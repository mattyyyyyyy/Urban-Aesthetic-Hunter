import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Image as ImageIcon, Sparkles, Zap, RotateCcw, AlertTriangle, Download, Wand2, ChevronRight, Layers, CameraOff, Trash2, Maximize, ChevronDown, Home as HomeIcon, ArrowLeft, StopCircle } from 'lucide-react';
import { editImageWithGemini, stripDataPrefix } from '../services/geminiService';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { DynamicIsland } from '../components/Layout/DynamicIsland';
import { useNavigate } from 'react-router-dom';
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

const LIBRARY_ITEMS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop', // Abstract Fluid
    'https://images.unsplash.com/photo-1605218427306-6354db696faa?q=80&w=400&auto=format&fit=crop', // Neon Light
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop', // Glitch
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', // Cyberpunk Street
    'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&auto=format&fit=crop', // Neon Text
    'https://images.unsplash.com/photo-1518558997970-4ddc236affcd?q=80&w=400&auto=format&fit=crop', // Statue
    'https://images.unsplash.com/photo-1534145765275-680459c943ba?q=80&w=400&auto=format&fit=crop', // Retro car
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400&auto=format&fit=crop', // Pink Smoke
    'https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=400&auto=format&fit=crop', // Geometric
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

  // State
  const [viewMode, setViewMode] = useState<'hunting' | 'results'>('hunting');
  const [preyList, setPreyList] = useState<Prey[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [islandStatus, setIslandStatus] = useState<'idle' | 'scanning' | 'processing' | 'success'>('idle');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
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

  // Sync Island Status
  useEffect(() => {
    if (isProcessing) setIslandStatus('processing');
    else if (preyList.length > 0 && islandStatus !== 'idle') setIslandStatus('success');
    else setIslandStatus('idle');
  }, [isProcessing, preyList.length]);

  // Lifecycle
  useEffect(() => {
    isMounted.current = true;
    startCamera();
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);

  // --- Drawing / Pointer Events ---

  const handlePointerDown = (e: React.PointerEvent) => {
      // Only draw in hunting mode and if not touching a sticker (handled by e.target check or sticker stopping propagation)
      if (viewMode !== 'hunting' || isProcessing || isLibraryOpen) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setStartPoint({ x, y });
      setIsDrawing(true);
      // Don't set rect yet, wait for move
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
          // Valid box drawn, trigger capture
          await handleCapture(selectionRect);
          setSelectionRect(null);
      } else {
          // It was just a tap
          setSelectedId(null); // Deselect stickers
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
      if (isMounted.current) setCameraError("Camera API unavailable (Check HTTPS)");
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
      if (isMounted.current) setCameraError("Camera Access Denied");
    }
  };

  const cancelProcessing = () => {
      // Increment ID so any pending async completion checks will fail
      processingIdRef.current += 1;
      setIsProcessing(false);
      setIslandStatus('idle');
      // If we were scanning, clear selection
      setSelectionRect(null);
  };

  const processImageSource = async (
      source: CanvasImageSource, 
      sourceWidth: number, 
      sourceHeight: number,
      cropRect?: SelectionRect
    ) => {
    const currentId = Date.now();
    processingIdRef.current = currentId;
    
    setIslandStatus('scanning');
    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let sx, sy, sWidth, sHeight;

      if (cropRect && containerRef.current) {
          // --- Custom Crop Logic ---
          const screenW = containerRef.current.clientWidth;
          const screenH = containerRef.current.clientHeight;
          
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
          // --- Default Center Crop Logic ---
          const minDim = Math.min(sourceWidth, sourceHeight);
          const cropSize = Math.floor(minDim * 0.6);
          sx = (sourceWidth - cropSize) / 2;
          sy = (sourceHeight - cropSize) / 2;
          sWidth = cropSize;
          sHeight = cropSize;
      }

      // Check cancellation
      if (processingIdRef.current !== currentId) return;

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
      const originalDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const { data, mimeType } = stripDataPrefix(originalDataUrl);
      const huntPrompt = "Extract the main central subject (sticker/object) from this image. Ignore frames/borders. Return ONLY the subject on a pure BLACK background.";
      
      const resultBase64 = await editImageWithGemini(data, mimeType, huntPrompt);

      // Check cancellation again
      if (processingIdRef.current !== currentId) return;

      if (resultBase64 && isMounted.current) {
        let processedImage = `data:image/jpeg;base64,${resultBase64}`;
        processedImage = await removeBlackBackground(processedImage);
        
        // Final check
        if (processingIdRef.current !== currentId) return;

        let initX = 0;
        let initY = 0;
        
        if (cropRect && containerRef.current) {
            const screenW = containerRef.current.clientWidth;
            const screenH = containerRef.current.clientHeight;
            const rectCenterX = cropRect.x + cropRect.width / 2;
            const rectCenterY = cropRect.y + cropRect.height / 2;
            initX = rectCenterX - screenW / 2;
            initY = rectCenterY - screenH / 2;
        }

        addSticker(processedImage, originalDataUrl, initX, initY);
      } else {
         console.warn("Hunt failed - no subject found");
         setIslandStatus('idle');
      }

    } catch (error) {
      console.error("Hunt process error:", error);
      if (processingIdRef.current === currentId) {
          setIslandStatus('idle');
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
        
        if (originalUrl) {
            setIslandStatus('success');
            setTimeout(() => {
                if(isMounted.current) setIslandStatus('idle');
            }, 2000);
        }
  };

  const handleCapture = async (cropRect?: SelectionRect) => {
    if (!videoRef.current || isProcessing) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;
    await processImageSource(video, video.videoWidth, video.videoHeight, cropRect);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
        await processImageSource(img, img.width, img.height);
        URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFinishHunt = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
        }
        stopCamera();
        setViewMode('results'); 
    }
  };

  const handleBackToHunt = () => {
    setCapturedImage(null);
    setViewMode('hunting');
    startCamera();
  };

  const handleDownloadComposite = async () => {
    if (!capturedImage) return;
    const canvas = document.createElement('canvas');
    const bgImg = new Image();
    bgImg.src = capturedImage;
    await new Promise(r => bgImg.onload = r);

    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(bgImg, 0, 0);

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    for (const prey of preyList) {
        const stickerImg = new Image();
        stickerImg.src = prey.image;
        await new Promise(r => stickerImg.onload = r);

        const scale = Math.max(screenW / bgImg.width, screenH / bgImg.height);
        
        const imgCenterX = bgImg.width / 2;
        const imgCenterY = bgImg.height / 2;
        
        const imgOffsetX = prey.x / scale;
        const imgOffsetY = prey.y / scale;
        
        const finalX = imgCenterX + imgOffsetX;
        const finalY = imgCenterY + imgOffsetY;
        
        const stickerW = (0.6 * screenW) / scale * prey.scale;
        const stickerH = stickerW * (stickerImg.height / stickerImg.width); 

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(prey.rotation * Math.PI / 180);
        ctx.drawImage(stickerImg, -stickerW/2, -stickerH/2, stickerW, stickerH);
        ctx.restore();
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `urban_prey_composition_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        className="relative h-screen w-full bg-black overflow-hidden flex flex-col touch-none" 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
    >
       <DynamicIsland status={islandStatus} />

       <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileSelect}
       />

       {/* Main Viewport */}
       <div className="absolute inset-0 z-0 bg-slate-900">
          {viewMode === 'results' && capturedImage ? (
              <img src={capturedImage} className="w-full h-full object-cover" alt="Frozen" />
          ) : (
              !cameraError ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 p-8 text-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <CameraOff size={32} />
                    </div>
                    <div className="max-w-xs pointer-events-auto">
                        <p className="text-white font-bold mb-1">Camera System Offline</p>
                        <p className="text-xs mb-6 opacity-60">{cameraError}</p>
                        <button 
                            onClick={triggerFileUpload}
                            className="px-6 py-3 bg-amber-400 text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
                        >
                            Upload Photo
                        </button>
                    </div>
                </div>
              )
          )}
       </div>
       
       {/* Drawing Selection Layer */}
       {selectionRect && isDrawing && (
           <div 
             className="absolute border-2 border-amber-400 bg-amber-400/20 z-30 pointer-events-none shadow-[0_0_20px_rgba(251,191,36,0.5)]"
             style={{
                 left: selectionRect.x,
                 top: selectionRect.y,
                 width: selectionRect.width,
                 height: selectionRect.height,
             }}
           >
               <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400 -translate-x-1 -translate-y-1"></div>
               <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400 translate-x-1 -translate-y-1"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400 -translate-x-1 translate-y-1"></div>
               <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400 translate-x-1 translate-y-1"></div>
               
               <div className="absolute -top-6 left-0 bg-amber-400 text-black text-[10px] font-bold px-1 rounded">
                   SCANNING...
               </div>
           </div>
       )}

       <canvas ref={canvasRef} className="hidden" />

       {/* Interactive Sticker Layer */}
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

       {/* Top Bar Actions */}
       <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-4 flex justify-between pointer-events-none">
           {viewMode === 'results' ? (
                <button 
                    onClick={handleBackToHunt}
                    className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center pointer-events-auto active:scale-95 text-white"
                >
                    <ArrowLeft size={18} />
                </button>
           ) : (
                <div />
           )}
       </div>

       {/* Bottom UI Controls */}
       <div className="absolute inset-0 z-40 flex flex-col justify-end pb-12 px-8 pointer-events-none">
          {isProcessing && (
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,1)] animate-[scan_1.5s_linear_infinite] z-50"></div>
          )}

          <div className="flex justify-between items-center w-full pointer-events-auto">
             
             {viewMode === 'hunting' ? (
                 <>
                     {/* Left: Library + Upload */}
                     <div className="w-24 h-16 flex items-center justify-start gap-3">
                         <button 
                            onClick={() => setIsLibraryOpen(true)}
                            className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-white/10"
                         >
                             <Layers className="text-white/80" size={20} />
                         </button>
                         <button 
                            onClick={triggerFileUpload}
                            className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-white/10"
                         >
                           <ImageIcon size={20} className="text-white/80" />
                         </button>
                     </div>

                     {/* Center: Shutter or Cancel Button */}
                     {!cameraError ? (
                         isProcessing ? (
                            <button 
                                onClick={cancelProcessing}
                                className="w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-red-500/90 text-white animate-in zoom-in duration-200"
                            >
                                <X size={28} />
                                <span className="text-[10px] font-bold mt-1">CANCEL</span>
                            </button>
                         ) : (
                            <button 
                                onClick={() => handleCapture()} 
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all"
                            >
                                <div className="w-[90%] h-[90%] bg-white rounded-full"></div>
                            </button>
                         )
                     ) : (
                         <div className="w-20 h-20" /> 
                     )}

                     {/* Right: Next Button */}
                     <div className="w-24 h-16 flex items-center justify-end">
                         {preyList.length > 0 && !isProcessing ? (
                            <button 
                                onClick={handleFinishHunt}
                                className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20 active:scale-90 transition-transform"
                            >
                                <ChevronRight size={28} className="text-black ml-0.5" strokeWidth={3} />
                            </button>
                         ) : (
                            <div className="w-14 h-14" />
                         )}
                     </div>
                 </>
             ) : (
                 <>
                    <div className="w-16 flex justify-center"></div>
                    <button 
                        onClick={handleDownloadComposite}
                        className="h-14 px-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20 active:scale-95 gap-2 text-black font-bold"
                    >
                        <Download size={20} />
                        SAVE
                    </button>
                    <div className="w-16 flex justify-center">
                        <button 
                             onClick={() => navigate(`/${AppRoute.HOME}`)}
                             className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center active:scale-90 text-white"
                        >
                            <HomeIcon size={20} />
                        </button>
                    </div>
                 </>
             )}
          </div>
       </div>

       {/* Card Library Drawer */}
       <AnimatePresence>
            {isLibraryOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        onClick={() => setIsLibraryOpen(false)}
                    />
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 h-[45vh] bg-slate-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 z-50 flex flex-col p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
                                <Layers size={18} className="text-amber-400" />
                                Aesthetic Collection
                            </h3>
                            <button onClick={() => setIsLibraryOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronDown size={20} className="text-white/60" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pb-8 pr-1 custom-scrollbar">
                            {LIBRARY_ITEMS.map((src, index) => (
                                <motion.div 
                                    key={index}
                                    drag
                                    dragSnapToOrigin 
                                    dragElastic={0.2}
                                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                                    onDragEnd={(e, info) => {
                                        const drawerHeight = window.innerHeight * 0.45;
                                        const dropY = info.point.y;
                                        if (dropY < (window.innerHeight - drawerHeight)) {
                                            addSticker(src, '', 0, 0); 
                                            setIsLibraryOpen(false); 
                                        }
                                    }}
                                    className="aspect-[3/4] bg-black/20 rounded-lg overflow-hidden border border-white/5 cursor-grab active:cursor-grabbing relative"
                                >
                                    <img src={src} className="w-full h-full object-cover pointer-events-none" alt={`sticker-${index}`} />
                                    <div 
                                        className="absolute inset-0" 
                                        onClick={() => {
                                            addSticker(src, '', 0, 0);
                                            setIsLibraryOpen(false);
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                        <div className="text-center text-[10px] text-white/30 pt-2 font-mono">
                            DRAG CARD UP TO ADD
                        </div>
                    </motion.div>
                </>
            )}
       </AnimatePresence>
    </div>
  );
};

// --- Sub-Component: DraggableSticker ---

interface DraggableStickerProps {
    data: Prey;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (changes: Partial<Prey>) => void;
    onDelete: () => void;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ data, containerRef, isSelected, onSelect, onUpdate, onDelete }) => {
    
    // Calculate precise constraints based on scale to ensure sticker stays within container but reaches edges
    const getConstraints = () => {
        if (!containerRef.current) return {};
        
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        
        // Base width of sticker (from CSS w-[60vw])
        const baseSize = window.innerWidth * 0.6;
        
        // Scaled dimensions
        const currentSize = baseSize * data.scale;
        
        // The x/y are translations from the center
        // Max translation allowed is (ContainerSize - StickerSize) / 2
        
        const maxX = (containerW - currentSize) / 2;
        const maxY = (containerH - currentSize) / 2;
        
        // Return object constraints for motion component
        return {
            left: -maxX,
            right: maxX,
            top: -maxY,
            bottom: maxY
        };
    };

    const handleScaleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const delta = info.delta.x + info.delta.y; 
        const newScale = Math.max(0.3, Math.min(3, data.scale + delta * 0.01));
        onUpdate({ scale: newScale });
    };

    return (
        <motion.div
            drag
            // Calculate constraints dynamically based on scale
            dragConstraints={getConstraints()}
            dragElastic={0} // Hard stop at edges
            dragMomentum={false}
            onPointerDown={(e) => e.stopPropagation()}
            onTap={onSelect}
            onDragEnd={(_, info) => {
                onUpdate({ x: data.x + info.offset.x, y: data.y + info.offset.y });
            }}
            style={{ 
                x: data.x, 
                y: data.y, 
                scale: data.scale,
                rotate: data.rotation,
                position: 'absolute',
                left: '50%', 
                top: '50%',
                // Use margin to center the element initially
                marginLeft: '-30vw',
                marginTop: '-30vw',
                touchAction: 'none'
            }}
            className="w-[60vw] h-[60vw] max-w-[300px] max-h-[300px] flex items-center justify-center pointer-events-auto"
        >
            <div className={`relative w-full h-full transition-all duration-200 ${isSelected ? 'z-50' : 'z-10'}`}>
                <img 
                    src={data.image} 
                    alt="sticker" 
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{ 
                        filter: 'drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)'
                    }}
                />

                {isSelected && (
                    <div className="absolute inset-0 border-2 border-white/50 border-dashed rounded-lg">
                        <div 
                            className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md text-white active:scale-90"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <X size={14} strokeWidth={3} />
                        </div>

                        <motion.div 
                            className="absolute -bottom-3 -right-3 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md text-black"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0}
                            dragMomentum={false}
                            onDrag={handleScaleDrag}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Maximize size={14} strokeWidth={3} className="rotate-90" />
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
