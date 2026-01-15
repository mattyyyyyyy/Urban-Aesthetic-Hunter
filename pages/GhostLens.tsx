import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Image as ImageIcon, Sparkles, Zap, RotateCcw, AlertTriangle, Download, Wand2, ChevronRight, Layers, CameraOff, Trash2, Maximize, ChevronDown, Home as HomeIcon, ArrowLeft, StopCircle, Move, RotateCw, Scale } from 'lucide-react';
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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
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

  // Feedback Auto-Dismiss
  useEffect(() => {
    if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 3000);
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

  // --- Drawing / Pointer Events ---

  const handlePointerDown = (e: React.PointerEvent) => {
      // Only draw in hunting mode and if not touching a sticker (handled by e.target check or sticker stopping propagation)
      if (viewMode !== 'hunting' || isProcessing) return;
      
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
      const huntPrompt = "Cut out the main object in this image and put it on a black background.";
      
      const resultBase64 = await editImageWithGemini(data, mimeType, huntPrompt);

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

      if (resultBase64 && isMounted.current) {
        let processedImage = `data:image/jpeg;base64,${resultBase64}`;
        processedImage = await removeBlackBackground(processedImage);
        
        if (processingIdRef.current !== currentId) return;
        addSticker(processedImage, originalDataUrl, initX, initY);

      } else {
         console.warn("Hunt failed - no subject found");
         if (processingIdRef.current === currentId) {
            setFeedback("No object found, using original.");
            addSticker(originalDataUrl, originalDataUrl, initX, initY);
         }
      }

    } catch (error) {
      console.error("Hunt process error:", error);
      if (processingIdRef.current === currentId) {
          setFeedback("Network error, using original.");
          const canvas = canvasRef.current;
          if (canvas) {
             const originalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
             addSticker(originalDataUrl, originalDataUrl, 0, 0);
          } else {
             setIslandStatus('idle');
          }
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
        className="relative h-screen w-full bg-zinc-200 overflow-hidden flex flex-col touch-none" 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
    >
       <DynamicIsland status={islandStatus} />

       {/* Feedback Toast */}
       <AnimatePresence>
            {feedback && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-40 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-zinc-900 text-zinc-900 px-4 py-3 bauhaus-shadow flex items-center gap-3 whitespace-nowrap"
                >
                    <AlertTriangle size={18} className="text-red-600" />
                    <span className="text-sm font-bold uppercase">{feedback}</span>
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

       {/* Main Viewport */}
       <div className="absolute inset-0 z-0 bg-zinc-900">
          {!cameraError ? (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 p-8 text-center pointer-events-none bg-zinc-200">
                <div className="w-16 h-16 bg-white border-2 border-zinc-900 flex items-center justify-center mb-2 bauhaus-shadow">
                    <CameraOff size={32} className="text-zinc-900"/>
                </div>
                <div className="max-w-xs pointer-events-auto">
                    <p className="text-zinc-900 font-black uppercase mb-1">Camera Offline</p>
                    <p className="text-xs mb-6 font-mono opacity-60">{cameraError}</p>
                    <button 
                        onClick={triggerFileUpload}
                        className="px-6 py-3 bg-zinc-900 text-white font-bold text-sm border-2 border-zinc-900 bauhaus-shadow hover:-translate-y-1 transition-all"
                    >
                        UPLOAD IMAGE
                    </button>
                </div>
            </div>
          )}
       </div>
       
       {/* Drawing Selection Layer */}
       {selectionRect && isDrawing && (
           <div 
             className="absolute border-2 border-white bg-white/10 z-30 pointer-events-none backdrop-invert"
             style={{
                 left: selectionRect.x,
                 top: selectionRect.y,
                 width: selectionRect.width,
                 height: selectionRect.height,
             }}
           >
               <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
               <div className="absolute top-0 right-0 w-2 h-2 bg-white"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 bg-white"></div>
               <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>
               
               <div className="absolute -top-6 left-0 bg-white text-black text-[10px] font-bold px-1 border border-black font-mono">
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

       {/* Controls Overlay */}
       <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6">
           
           {/* Header */}
           <div className="flex justify-between items-start pointer-events-auto">
                <button 
                    onClick={() => navigate(`/${AppRoute.HOME}`)}
                    className="w-12 h-12 bg-white border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="bg-white px-3 py-1 border-2 border-zinc-900 bauhaus-shadow-sm rotate-1">
                    <span className="font-black text-xl uppercase tracking-tighter">GHOST LENS</span>
                </div>
           </div>

           {/* Footer Controls */}
           <div className="flex items-end justify-between pointer-events-auto pb-8">
                {/* Upload */}
                <button 
                    onClick={triggerFileUpload}
                    className="w-14 h-14 bg-zinc-100 border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:scale-95 group"
                >
                    <ImageIcon size={24} className="group-hover:scale-110 transition-transform"/>
                </button>

                {/* Shutter / Capture Button */}
                <button 
                    onClick={() => handleCapture()}
                    disabled={isProcessing}
                    className={`
                        w-20 h-20 rounded-full border-4 border-zinc-900 flex items-center justify-center shadow-2xl transition-all active:scale-95 relative overflow-hidden
                        ${isProcessing ? 'bg-zinc-400 cursor-not-allowed' : 'bg-white hover:bg-zinc-50'}
                    `}
                >
                    {/* Geometric Center */}
                    <div className={`w-12 h-12 bg-red-500 border-2 border-zinc-900 transition-all duration-300 ${isProcessing ? 'scale-75 rounded-none rotate-45' : 'rounded-full'}`}></div>
                </button>

                {/* Clear / Reset */}
                <button 
                    onClick={() => setPreyList([])}
                    disabled={preyList.length === 0}
                    className="w-14 h-14 bg-zinc-100 border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:scale-95 disabled:opacity-50"
                >
                    <RotateCcw size={24} />
                </button>
           </div>
       </div>

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
    
    // Simple state for local drag delta if needed, mostly handled by motion
    const handleDragEnd = (event: any, info: PanInfo) => {
        onUpdate({ x: data.x + info.offset.x, y: data.y + info.offset.y });
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            // Note: In a real app we would sync x/y with motion values, here we just use the initial + relative drag
            // A robust implementation would use useMotionValue for x/y
            style={{ 
                x: data.x, 
                y: data.y, 
                rotate: data.rotation, 
                scale: data.scale,
                position: 'absolute',
                left: '50%', // Center initially
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
                    className={`max-w-[200px] max-h-[200px] object-contain drop-shadow-xl select-none pointer-events-none transition-all ${isSelected ? 'filter brightness-105 contrast-110' : ''}`}
                />

                {/* Selection Frame (Bauhaus Style) */}
                {isSelected && (
                    <>
                        <div className="absolute inset-0 border-2 border-zinc-900 pointer-events-none"></div>
                        
                        {/* Delete Button (Top Right) */}
                        <div 
                            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 border-2 border-zinc-900 flex items-center justify-center text-white cursor-pointer hover:scale-110 shadow-sm pointer-events-auto"
                            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <X size={14} strokeWidth={3} />
                        </div>

                        {/* Rotate Handle (Bottom Right) - Simplified Click to Rotate */}
                        <div 
                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-white cursor-pointer hover:scale-110 shadow-sm pointer-events-auto"
                            onPointerDown={(e) => { 
                                e.stopPropagation(); 
                                onUpdate({ rotation: data.rotation + 45 });
                            }}
                        >
                            <RotateCw size={12} strokeWidth={3} />
                        </div>

                        {/* Scale Handle (Bottom Left) - Simplified Click to Scale */}
                        <div 
                            className="absolute -bottom-3 -left-3 w-6 h-6 bg-yellow-400 border-2 border-zinc-900 flex items-center justify-center text-zinc-900 cursor-pointer hover:scale-110 shadow-sm pointer-events-auto"
                            onPointerDown={(e) => { 
                                e.stopPropagation(); 
                                const newScale = data.scale >= 1.5 ? 0.5 : data.scale + 0.25;
                                onUpdate({ scale: newScale });
                            }}
                        >
                            <Scale size={12} strokeWidth={3} />
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};
