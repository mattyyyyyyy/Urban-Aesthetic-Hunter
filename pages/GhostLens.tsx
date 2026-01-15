import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Image as ImageIcon, Sparkles, Zap, RotateCcw, AlertTriangle, Download, Wand2, ChevronRight, Layers, CameraOff, Trash2, Maximize, ChevronDown, Home as HomeIcon, ArrowLeft, StopCircle, Move, RotateCw, Scale, Plus, Share, Check, Repeat } from 'lucide-react';
import { editImageWithGemini, stripDataPrefix } from '../services/geminiService';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../types';

interface Prey {
  id: number;
  image: string; // The cutout (transparent png) or URL
  original: string; // Original snapshot
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Sticker Library Assets
const LIBRARY_ITEMS = [
  { id: 's1', url: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/111111.jpg?raw=true' },
  { id: 's2', url: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/1111231231411.jpg?raw=true' },
  { id: 's3', url: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/222222.jpg?raw=true' },
  { id: 's4', url: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/33333.jpg?raw=true' },
  { id: 's5', url: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/image.png?raw=true' },
];

// Helper: Convert black background to transparent
const removeBlackBackground = (base64Data: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Data);
                return;
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple thresholding for "black"
            const threshold = 50; 
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r < threshold && g < threshold && b < threshold) {
                    data[i + 3] = 0; // Alpha = 0
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.crossOrigin = "anonymous";
        img.src = base64Data;
    });
};

export const GhostLens: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [viewMode, setViewMode] = useState<'hunting' | 'poster'>('hunting');
  const [preyList, setPreyList] = useState<Prey[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [capturedBackground, setCapturedBackground] = useState<string | null>(null);
  
  // Selection / Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingIdRef = useRef<number>(0);
  const isMounted = useRef(true);

  // Feedback Auto-Dismiss
  useEffect(() => {
    if (feedback) {
        // Keep feedback longer if it's "Saving..."
        const duration = feedback.includes("生成") ? 5000 : 3000;
        const timer = setTimeout(() => setFeedback(null), duration);
        return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Lifecycle
  useEffect(() => {
    isMounted.current = true;
    startCamera();
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);

  // Check for incoming stickers from Home page
  useEffect(() => {
    if (location.state && (location.state as any).initialSticker) {
        const stickerUrl = (location.state as any).initialSticker;
        setTimeout(() => {
            if(isMounted.current) {
                addSticker(stickerUrl, '', 0, 0);
                window.history.replaceState({}, '');
            }
        }, 500);
    }
  }, [location.state]);

  // --- Drawing / Pointer Events ---

  const handlePointerDown = (e: React.PointerEvent) => {
      if (viewMode !== 'hunting' || isProcessing) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setStartPoint({ x, y });
      setIsDrawing(true);
      setSelectionRect(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDrawing || !startPoint || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const width = Math.abs(currentX - startPoint.x);
      const height = Math.abs(currentY - startPoint.y);
      const x = Math.min(currentX, startPoint.x);
      const y = Math.min(currentY, startPoint.y);

      setSelectionRect({ x, y, width, height });
  };

  const handlePointerUp = async () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (selectionRect && selectionRect.width > 20 && selectionRect.height > 20) {
          await handleScan(selectionRect);
          setSelectionRect(null);
      } else {
          setSelectedId(null);
          setSelectionRect(null);
      }
      setStartPoint(null);
  };

  // --- Camera Logic ---

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (isMounted.current) setCameraError("HTTPS required for camera");
      return;
    }

    try {
      stopCamera();
      const constraints = {
        video: { 
            facingMode: 'environment',
            width: { ideal: 1280 }, 
            height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (isMounted.current && videoRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Play error:", e));
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (isMounted.current) setCameraError("Camera access denied");
    }
  };

  // --- Poster / Capture Logic ---

  const takeSnapshot = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setCapturedBackground(dataUrl);
          setViewMode('poster');
          stopCamera(); // Freeze camera
          setSelectedId(null); // Deselect any stickers for the clean look
      }
  };

  const retake = () => {
      setCapturedBackground(null);
      setViewMode('hunting');
      startCamera(); 
  };

  const savePoster = async () => {
      if (!containerRef.current || !capturedBackground) return;
      
      // Use isProcessing state to disable UI during save
      setIsProcessing(true);
      setFeedback("正在生成海报...");

      try {
          // 1. Setup Canvas
          const canvas = document.createElement('canvas');
          const rect = containerRef.current.getBoundingClientRect();
          // Use 2x resolution for better quality
          const scale = 2; 
          canvas.width = rect.width * scale;
          canvas.height = rect.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Context creation failed");

          // 2. Draw Background (Object-Cover Simulation)
          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
              bgImg.onload = resolve;
              bgImg.onerror = reject;
              bgImg.src = capturedBackground!;
          });

          // Draw bg to cover canvas
          const bgRatio = bgImg.width / bgImg.height;
          const canvasRatio = canvas.width / canvas.height;
          let drawW, drawH, drawX, drawY;

          if (canvasRatio > bgRatio) {
              drawW = canvas.width;
              drawH = canvas.width / bgRatio;
              drawX = 0;
              drawY = (canvas.height - drawH) / 2;
          } else {
              drawH = canvas.height;
              drawW = canvas.height * bgRatio;
              drawX = (canvas.width - drawW) / 2;
              drawY = 0;
          }
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

          // 3. Draw Stickers
          for (const prey of preyList) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = () => resolve(null); // skip if fail
                  img.src = prey.image;
              });

              ctx.save();
              // Coordinate mapping: 
              // prey.x/y are in CSS pixels relative to center.
              // canvas is scaled by `scale`.
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const x = centerX + (prey.x * scale);
              const y = centerY + (prey.y * scale);

              ctx.translate(x, y);
              ctx.rotate(prey.rotation * Math.PI / 180);

              // Size mapping:
              // CSS max size is 200px.
              // We need to calculate what the width/height is in CSS pixels, then multiply by `scale`.
              const maxCssSize = 200;
              const natW = img.width;
              const natH = img.height;
              let cssW = natW;
              let cssH = natH;

              // Apply max-width/max-height logic from CSS (simulate object-contain behavior within 200x200 box)
              // Actually, <img className="max-w-[200px] max-h-[200px]" /> means the image scales down to fit.
              if (cssW > maxCssSize || cssH > maxCssSize) {
                  const ratio = Math.min(maxCssSize / cssW, maxCssSize / cssH);
                  cssW *= ratio;
                  cssH *= ratio;
              }

              // Apply user scale
              cssW *= prey.scale;
              cssH *= prey.scale;

              // Convert to canvas pixels
              const finalW = cssW * scale;
              const finalH = cssH * scale;

              ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
              ctx.restore();
          }

          // 4. Download
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `UrbanHunter_${Date.now()}.jpg`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setFeedback("已保存至相册");
          
          // Wait a bit before leaving
          setTimeout(() => {
              navigate(`/${AppRoute.HOME}`);
          }, 2000);

      } catch (err) {
          console.error("Save failed", err);
          setFeedback("保存失败，请重试");
      } finally {
          setIsProcessing(false);
      }
  };

  // --- AI Scan Logic (Existing) ---

  const handleScan = async (cropRect: SelectionRect) => {
    if (!videoRef.current || isProcessing) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;
    await processImageSource(video, video.videoWidth, video.videoHeight, cropRect);
  };

  const processImageSource = async (
      source: CanvasImageSource, 
      sourceWidth: number, 
      sourceHeight: number, 
      cropRect?: SelectionRect
    ) => {
    const currentId = Date.now();
    processingIdRef.current = currentId;
    
    setIsProcessing(true);

    // Initial calculation of position to place the sticker exactly where drawn
    let initX = 0;
    let initY = 0;
    if (cropRect && containerRef.current) {
        const screenW = containerRef.current.clientWidth;
        const screenH = containerRef.current.clientHeight;
        const rectCenterX = cropRect.x + cropRect.width / 2;
        const rectCenterY = cropRect.y + cropRect.height / 2;
        // The sticker coordinates are offsets from center
        initX = rectCenterX - screenW / 2;
        initY = rectCenterY - screenH / 2;
    }

    let originalDataUrl = '';

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let sx, sy, sWidth, sHeight;

      if (cropRect && containerRef.current) {
          const screenW = containerRef.current.clientWidth;
          const screenH = containerRef.current.clientHeight;
          // Calculate video scaling relative to screen
          const scale = Math.max(screenW / sourceWidth, screenH / sourceHeight);
          const renderedW = sourceWidth * scale;
          const renderedH = sourceHeight * scale;
          const offsetX = (renderedW - screenW) / 2;
          const offsetY = (renderedH - screenH) / 2;
          
          sx = (cropRect.x + offsetX) / scale;
          sy = (cropRect.y + offsetY) / scale;
          sWidth = cropRect.width / scale;
          sHeight = cropRect.height / scale;

          if (sx < 0) sx = 0;
          if (sy < 0) sy = 0;
          if (sx + sWidth > sourceWidth) sWidth = sourceWidth - sx;
          if (sy + sHeight > sourceHeight) sHeight = sourceHeight - sy;

      } else {
          sx = 0; sy = 0; sWidth = sourceWidth; sHeight = sourceHeight;
      }

      // Resize for processing if too large
      const MAX_SIZE = 800;
      let targetW = sWidth;
      let targetH = sHeight;
      if (targetW > MAX_SIZE || targetH > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / targetW, MAX_SIZE / targetH);
          targetW *= ratio;
          targetH *= ratio;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
      originalDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // --- AI Processing with Fallback ---
      let resultBase64: string | null = null;
      try {
        const { data, mimeType } = stripDataPrefix(originalDataUrl);
        const huntPrompt = "Cut out the main object in this image and put it on a black background. If unsure, return the original image.";
        resultBase64 = await editImageWithGemini(data, mimeType, huntPrompt);
      } catch (err) {
        console.warn("AI processing error, falling back:", err);
        // Do not throw, just proceed with resultBase64 as null
      }

      if (processingIdRef.current !== currentId) return;

      if (resultBase64) {
        let processedImage = `data:image/jpeg;base64,${resultBase64}`;
        processedImage = await removeBlackBackground(processedImage);
        addSticker(processedImage, originalDataUrl, initX, initY);
      } else {
         // Fallback logic - This is CRITICAL for "if not recognized, just use original"
         setFeedback("已保留原图"); // "Kept original"
         addSticker(originalDataUrl, originalDataUrl, initX, initY);
      }

    } catch (error) {
        console.error("General Scan Error", error);
        // Ultimate fallback
        if (processingIdRef.current === currentId && originalDataUrl) {
            setFeedback("已保留原图");
            addSticker(originalDataUrl, originalDataUrl, initX, initY);
        }
    } finally {
      if (isMounted.current && processingIdRef.current === currentId) {
          setIsProcessing(false);
      }
    }
  };

  const addSticker = (imageUrl: string, originalUrl: string = '', x: number = 0, y: number = 0) => {
      const newPrey: Prey = {
          id: Date.now(),
          image: imageUrl,
          original: originalUrl,
          x: x, 
          y: y,
          scale: 1,
          rotation: 0
        };
        setPreyList(prev => [...prev, newPrey]);
        setSelectedId(newPrey.id);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.drawImage(img, 0, 0);
            setCapturedBackground(canvas.toDataURL('image/jpeg'));
            setViewMode('poster');
        }
        URL.revokeObjectURL(objectUrl);
        setIsLibraryOpen(false);
    };
    img.src = objectUrl;
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const updatePrey = (id: number, changes: Partial<Prey>) => {
      setPreyList(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  };

  const deletePrey = (id: number) => {
      setPreyList(prev => prev.filter(p => p.id !== id));
      if (selectedId === id) setSelectedId(null);
  };

  return (
    <div 
        ref={containerRef}
        className="relative h-screen w-full bg-zinc-900 overflow-hidden flex flex-col touch-none" 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
    >
       {/* Feedback Toast */}
       <AnimatePresence>
            {feedback && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap border border-white/20"
                >
                    <AlertTriangle size={14} className="text-yellow-400" />
                    <span className="text-xs font-medium">{feedback}</span>
                </motion.div>
            )}
       </AnimatePresence>

       <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileSelect}
       />

       {/* Viewport Layer */}
       <div className="absolute inset-0 z-0 bg-black">
          {viewMode === 'hunting' ? (
              !cameraError ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 p-8 text-center pointer-events-none bg-zinc-900">
                    <CameraOff size={24} className="text-white"/>
                    <p className="text-xs text-zinc-400">{cameraError}</p>
                </div>
              )
          ) : (
              // Poster Static Background
              <img 
                 src={capturedBackground || ''} 
                 className="w-full h-full object-cover"
                 alt="Captured"
              />
          )}
       </div>

       {/* Poster Graphic Overlay (CLEANED - No Big Text) */}
       {viewMode === 'poster' && (
           <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
               {/* Minimal Info - Just Date/Time in corner */}
               <div className="flex justify-between items-start opacity-60">
                   <div className="font-mono text-[10px] text-white bg-black/30 px-2 py-1 backdrop-blur-sm rounded-sm">
                       <p>{new Date().toLocaleDateString()}</p>
                   </div>
               </div>
               {/* No Big Title Text here anymore */}
           </div>
       )}
       
       {/* Drawing Selection Layer (Hunting Mode Only) */}
       {viewMode === 'hunting' && selectionRect && isDrawing && (
           <div 
             className="absolute border border-yellow-400 bg-yellow-400/20 z-30 pointer-events-none"
             style={{
                 left: selectionRect.x,
                 top: selectionRect.y,
                 width: selectionRect.width,
                 height: selectionRect.height,
             }}
           >
               <div className="absolute -top-6 left-0 text-yellow-400 text-[10px] font-bold tracking-wider bg-black/50 px-1">
                   SCANNING...
               </div>
           </div>
       )}

       <canvas ref={canvasRef} className="hidden" />

       {/* Interactive Sticker Layer (Visible in both modes) */}
       <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
          {preyList.map((prey) => (
             <DraggableSticker 
                key={prey.id} 
                data={prey} 
                containerRef={containerRef}
                isSelected={selectedId === prey.id}
                onSelect={() => setSelectedId(prey.id)}
                onUpdate={(changes) => updatePrey(prey.id, changes)}
                onDelete={() => deletePrey(prey.id)}
             />
          ))}
       </div>

       {/* Controls Overlay */}
       <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6">
           
           {/* Header */}
           <div className="flex justify-between items-start pointer-events-auto pt-6 px-2">
                <button 
                    onClick={() => {
                        if (viewMode === 'poster') retake();
                        else navigate(-1);
                    }}
                    className="w-10 h-10 rounded-full bg-black/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/30 transition-colors"
                >
                    <ArrowLeft size={24} strokeWidth={1.5} />
                </button>
           </div>

           {/* Footer Controls */}
           <div className="flex items-center justify-between pointer-events-auto pb-8 px-4 relative">
                
                {viewMode === 'hunting' ? (
                    <>
                        {/* Sticker Library */}
                        <button 
                            onClick={() => setIsLibraryOpen(true)}
                            className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-all"
                        >
                            <ImageIcon size={24} className="text-white opacity-90" />
                        </button>

                        {/* Bauhaus Shutter Button (Capture & Freeze) - No Animation on Processing */}
                        <button 
                            onClick={() => takeSnapshot()}
                            disabled={isProcessing}
                            className={`
                                w-20 h-20 bg-white border-2 border-zinc-900 rounded-[20px] flex items-center justify-center 
                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all relative
                                ${isProcessing ? 'opacity-80' : ''}
                            `}
                        >
                             <div className={`w-12 h-12 bg-red-600 rounded-full border-2 border-zinc-900 transition-all duration-300`}></div>
                        </button>

                        {/* Clear */}
                        <button 
                            onClick={() => setPreyList([])}
                            disabled={preyList.length === 0}
                            className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-all disabled:opacity-30"
                        >
                            <Trash2 size={22} className="text-white" />
                        </button>
                    </>
                ) : (
                    /* Poster Mode Controls */
                    <div className="w-full flex items-center justify-center gap-8">
                        {/* Retake */}
                        <button 
                            onClick={retake}
                            className="w-14 h-14 bg-white border-2 border-zinc-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                        >
                            <Repeat size={24} className="text-black" />
                        </button>

                        {/* Save / Confirm */}
                        <button 
                            onClick={savePoster}
                            disabled={isProcessing}
                            className={`
                                w-20 h-20 bg-yellow-400 border-2 border-zinc-900 rounded-[20px] flex items-center justify-center 
                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all
                                ${isProcessing ? 'opacity-80' : ''}
                            `}
                        >
                            <Check size={36} className="text-black" strokeWidth={3} />
                        </button>
                    </div>
                )}
           </div>
       </div>

       {/* Sticker Library Bottom Sheet */}
       <AnimatePresence>
         {isLibraryOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    onClick={() => setIsLibraryOpen(false)}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e] rounded-t-[32px] overflow-hidden shadow-2xl h-[55vh] flex flex-col"
                >
                    {/* Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsLibraryOpen(false)}>
                        <div className="w-12 h-1.5 bg-zinc-600 rounded-full opacity-50"></div>
                    </div>

                    {/* Library Content */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">贴纸库</h3>
                            <button 
                                onClick={() => setIsLibraryOpen(false)}
                                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                            >
                                <X size={16} className="text-zinc-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* Upload Tile */}
                            <button 
                                onClick={triggerFileUpload}
                                className="aspect-square rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 active:bg-zinc-700 transition-colors"
                            >
                                <Plus size={24} className="text-zinc-400" />
                                <span className="text-[10px] text-zinc-500 font-medium">从相册添加</span>
                            </button>

                            {/* Preset Stickers */}
                            {LIBRARY_ITEMS.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => {
                                        addSticker(item.url, '', 0, 0); // Add at center
                                        setIsLibraryOpen(false);
                                    }}
                                    className="aspect-square rounded-2xl bg-zinc-800 p-3 relative group active:scale-95 transition-transform"
                                >
                                    <img src={item.url} className="w-full h-full object-contain" alt="Sticker" />
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </>
         )}
       </AnimatePresence>

    </div>
  );
};

// --- Sub-components ---

const DraggableSticker: React.FC<{
    data: Prey;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (changes: Partial<Prey>) => void;
    onDelete: () => void;
}> = ({ data, containerRef, isSelected, onSelect, onUpdate, onDelete }) => {
    
    const stickerRef = useRef<HTMLDivElement>(null);

    // Linear interaction handler
    const handleInteraction = (e: React.PointerEvent, type: 'rotate' | 'scale') => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!stickerRef.current) return;
        
        // Get center of the sticker element visually
        const rect = stickerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const startX = e.clientX;
        const startY = e.clientY;
        
        // Initial values
        const startRotation = data.rotation;
        const startScale = data.scale;
        
        // Initial pointer vector
        const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        const startDist = Math.hypot(startX - centerX, startY - centerY);

        const onMove = (moveEvent: PointerEvent) => {
            const curX = moveEvent.clientX;
            const curY = moveEvent.clientY;
            
            if (type === 'rotate') {
                const curAngle = Math.atan2(curY - centerY, curX - centerX) * (180 / Math.PI);
                const delta = curAngle - startAngle;
                onUpdate({ rotation: startRotation + delta });
            } else {
                const curDist = Math.hypot(curX - centerX, curY - centerY);
                const scaleFactor = curDist / startDist;
                // Limit min scale to avoid disappearing
                onUpdate({ scale: Math.max(0.3, startScale * scaleFactor) });
            }
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return (
        <motion.div
            ref={stickerRef}
            drag
            dragMomentum={false}
            onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onDragEnd={(e, info) => {
                // Sync final drag position to state to avoid jumps on re-render
                onUpdate({ x: data.x + info.offset.x, y: data.y + info.offset.y });
            }}
            style={{ 
                x: data.x, 
                y: data.y, 
                rotate: data.rotation, 
                scale: data.scale,
                position: 'absolute',
                left: '50%',
                top: '50%',
                touchAction: 'none'
            }}
            className="absolute flex items-center justify-center cursor-move pointer-events-auto"
        >
            <div className={`relative group ${isSelected ? 'z-50' : 'z-20'}`}>
                {/* The Image */}
                <img 
                    src={data.image} 
                    alt="sticker"
                    className={`max-w-[200px] max-h-[200px] object-contain drop-shadow-2xl select-none pointer-events-none transition-all ${isSelected ? 'brightness-110' : ''}`}
                />

                {/* Selection Frame (Clean Bauhaus Style) */}
                {isSelected && (
                    <>
                        <div className="absolute -inset-2 border-2 border-yellow-400 rounded-none pointer-events-none opacity-80"></div>
                         <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 pointer-events-none"></div>
                         <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-yellow-400 pointer-events-none"></div>
                        
                        {/* Delete Button (Click to delete) */}
                        <div 
                            className="absolute -top-6 -right-6 w-8 h-8 bg-red-500 border border-black flex items-center justify-center text-white cursor-pointer shadow-lg active:scale-90 transition-transform pointer-events-auto"
                            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <X size={16} strokeWidth={2.5} />
                        </div>

                        {/* Rotate Handle (Drag to rotate) */}
                        <div 
                            className="absolute -bottom-6 -right-6 w-8 h-8 bg-yellow-400 border border-black flex items-center justify-center text-black cursor-pointer shadow-lg active:scale-90 transition-transform pointer-events-auto touch-none"
                            onPointerDown={(e) => handleInteraction(e, 'rotate')}
                        >
                            <RotateCw size={16} strokeWidth={2.5} />
                        </div>

                        {/* Scale Handle (Drag to scale) */}
                         <div 
                            className="absolute -bottom-6 -left-6 w-8 h-8 bg-white border border-black flex items-center justify-center text-black cursor-pointer shadow-lg active:scale-90 transition-transform pointer-events-auto touch-none"
                            onPointerDown={(e) => handleInteraction(e, 'scale')}
                        >
                            <Scale size={14} strokeWidth={2.5} />
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};