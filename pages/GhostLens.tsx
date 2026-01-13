import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Image as ImageIcon, Sparkles, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import { editImageWithGemini, stripDataPrefix } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicIsland } from '../components/Layout/DynamicIsland';

// Mock Stickers for "Library"
const STICKERS = [
  { id: 1, symbol: '🪟', name: 'Art Deco Window' },
  { id: 2, symbol: '🏛️', name: 'Pillar Detail' },
  { id: 3, symbol: '🧱', name: 'Concrete Texture' },
  { id: 4, symbol: '⚡', name: 'Neon Sign' },
  { id: 5, symbol: '🚇', name: 'Metro Tile' },
  { id: 6, symbol: '🌉', name: 'Steel Beam' },
];

export const GhostLens: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // Trigger for retrying camera
  
  // Status for Dynamic Island
  const [islandStatus, setIslandStatus] = useState<'idle' | 'scanning' | 'processing' | 'success'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);

  // Sync Island Status
  useEffect(() => {
    if (isCapturing) setIslandStatus('scanning');
    else if (isProcessing) setIslandStatus('processing');
    else if (editedImage) setIslandStatus('success');
    else setIslandStatus('idle');
  }, [isCapturing, isProcessing, editedImage]);

  // Handle Mount Status
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Initialize Camera with Robust Fallback Strategy
  useEffect(() => {
    const startCamera = async () => {
      if (selectedImage) return; // Don't start if showing image
      setCameraError(null);

      // Basic Check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted.current) setCameraError("Camera API not available. This app requires a secure context (HTTPS) or localhost.");
          return;
      }

      // Helper to try getting stream, returns Stream or Error
      const getStream = async (constraints: MediaStreamConstraints): Promise<MediaStream | Error> => {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e: any) {
          console.warn(`Camera constraints failed: ${JSON.stringify(constraints)}`, e);
          return e;
        }
      };

      try {
        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        let result: MediaStream | Error | null = null;

        // 1. Try environment camera (Rear) with ideal resolution
        // Note: ideal 1280x720 is a safe bet for performance/quality balance
        result = await getStream({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });

        // 2. Fallback: Environment camera without resolution constraints
        if (result instanceof Error) {
            result = await getStream({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
        }

        // 3. Fallback: Any camera (User facing)
        if (result instanceof Error) {
          console.log("Fallback to generic camera...");
          result = await getStream({ video: true, audio: false });
        }

        if (result instanceof MediaStream) {
          if (isMounted.current) {
            streamRef.current = result;
            if (videoRef.current) {
              videoRef.current.srcObject = result;
              // Explicit play for some mobile browsers (iOS especially)
              videoRef.current.play().catch(e => console.error("Video play failed", e));
            }
          } else {
             // Stream acquired but unmounted, stop it immediately
             result.getTracks().forEach(t => t.stop());
          }
        } else if (result instanceof Error && isMounted.current) {
             // Handle specific errors
             const err = result;
             let msg = "Unable to access camera.";
             if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                 msg = "Camera permission denied. Please enable access in browser settings.";
             } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                 msg = "No camera device found.";
             } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                 msg = "Camera is in use by another app or invalid.";
             } else {
                 msg = `Camera error: ${err.message || err.name}`;
             }
             setCameraError(msg);
        }
      } catch (err) {
        console.error("Camera critical error", err);
        if (isMounted.current) setCameraError("Camera initialization failed.");
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [selectedImage, retryCount]); // Depend on retryCount to re-trigger

  const handleRetryCamera = () => {
      setRetryCount(c => c + 1);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      
      // Simulate scanning delay
      setTimeout(() => {
          if (!isMounted.current) return;
          
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (!video || !canvas) {
              setIsCapturing(false);
              return;
          }

          // Ensure video has dimensions
          if (video.videoWidth === 0 || video.videoHeight === 0) {
              setIsCapturing(false);
              return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // Flip if using front camera (detection is complex, assuming rear for now or just standard draw)
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Use high quality JPEG
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              setSelectedImage(dataUrl);
              setIsCapturing(false);
          }
      }, 800);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage || !prompt) return;

    setIsProcessing(true);
    try {
      const { data, mimeType } = stripDataPrefix(selectedImage);
      const enhancedPrompt = `${prompt}. Maintain the original composition but apply the requested style or modification.`;
      const resultBase64 = await editImageWithGemini(data, mimeType, enhancedPrompt);

      if (resultBase64 && isMounted.current) {
        setEditedImage(`data:image/jpeg;base64,${resultBase64}`);
      } else if (!resultBase64 && isMounted.current) {
        alert("Could not generate image. Please try again.");
      }
    } catch (error) {
      console.error(error);
      if (isMounted.current) alert("Error processing image. Check console for details.");
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setEditedImage(null);
    setPrompt('');
    setIsProcessing(false);
    setIslandStatus('idle');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
           if (isMounted.current) {
               setSelectedImage(reader.result as string);
               setCameraError(null); // Clear error if file uploaded
           }
       };
       reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // If we have an image (Capture Result or Edit Mode)
  if (selectedImage) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Dynamic Island */}
        <DynamicIsland status={islandStatus} />

        {/* Background Ambient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />

        {/* Main Image Container */}
        <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="relative w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl mb-24 z-10 group"
        >
           <img 
             src={editedImage || selectedImage} 
             alt="Capture" 
             className={`w-full h-full object-cover ${isProcessing ? 'animate-pulse grayscale' : ''}`} 
           />
           
           {/* Scan Line Animation during Processing */}
           {isProcessing && (
              <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                 <div className="w-full h-1 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)] animate-[scan_2s_linear_infinite]"></div>
                 <div className="absolute text-amber-400 font-mono text-xs tracking-widest animate-pulse">
                    GEMINI_PROCESSING...
                 </div>
              </div>
           )}

           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-mono text-amber-400">
                {editedImage ? 'RENDER_V2.5' : 'RAW_SOURCE'}
              </span>
           </div>
        </motion.div>

        {/* Edit Controls */}
        <div className="absolute bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-[40px] p-8 z-30">
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                 <Sparkles size={18} className="text-amber-400" />
                 <input 
                   type="text" 
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="Describe edit (e.g. 'Cyberpunk neon')" 
                   className="bg-transparent w-full text-sm text-white placeholder-gray-500 outline-none font-mono"
                 />
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={reset}
                   className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                 >
                   <X size={20} />
                 </button>
                 <button 
                   onClick={handleEdit}
                   disabled={isProcessing || !prompt}
                   className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isProcessing ? <RefreshCw className="animate-spin" /> : <Zap />}
                   {editedImage ? 'RE-GENERATE' : 'GENERATE'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Live Camera View
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
       {/* Dynamic Island */}
       <DynamicIsland status={islandStatus} />

       {/* Video Background */}
       <div className="absolute inset-0 z-0 bg-zinc-900">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover opacity-90"
          />
          
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-8 text-center backdrop-blur-sm z-30">
              <div className="mb-4 text-red-400 bg-red-400/10 p-4 rounded-full"><AlertTriangle size={32} /></div>
              <p className="text-white font-semibold mb-2">Camera Access Failed</p>
              <p className="text-sm font-mono text-gray-400 mb-6 max-w-xs">{cameraError}</p>
              <p className="text-xs text-gray-500 mb-8">
                If you are on iOS/Android, ensure you have granted camera permissions.
                <br />You can still upload a photo below.
              </p>
            </div>
          )}
       </div>

       {/* Canvas for Capture */}
       <canvas ref={canvasRef} className="hidden" />

       {/* Grid Overlays */}
       <div className="absolute inset-0 pointer-events-none opacity-20 z-10">
          <div className="w-1/3 h-full border-r border-white absolute left-0"></div>
          <div className="w-1/3 h-full border-r border-white absolute left-1/3"></div>
          <div className="h-1/3 w-full border-b border-white absolute top-0"></div>
          <div className="h-1/3 w-full border-b border-white absolute top-1/3"></div>
       </div>

       {/* Scanning Animation */}
       <AnimatePresence>
          {isCapturing && (
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent z-40 shadow-[0_0_20px_rgba(251,191,36,1)]"
            />
          )}
       </AnimatePresence>

       {/* Bottom Controls Area */}
       <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent z-40 flex flex-col justify-end pb-8 px-10 pointer-events-none">
          {/* Enable pointer events for buttons */}
          <div className="flex justify-around items-center pointer-events-auto">
             
             {/* Library Button */}
             <button 
               onClick={() => setShowLibrary(true)}
               className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
             >
               <ImageIcon size={20} />
             </button>

             {/* Shutter / Retry Button */}
             {cameraError ? (
               <button 
                 onClick={handleRetryCamera}
                 className="w-20 h-20 rounded-full border-4 border-red-500/50 bg-red-500/20 flex items-center justify-center p-1 shadow-2xl active:scale-95 transition-transform"
               >
                  <RotateCcw size={32} className="text-white" />
               </button>
             ) : (
               <button 
                 onClick={takePhoto}
                 className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center p-1 shadow-2xl active:scale-95 transition-transform"
               >
                 <div className="w-full h-full rounded-full bg-white scale-90 hover:scale-100 transition-transform" />
               </button>
             )}

             {/* Gallery Import (Standard) */}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
             >
               <div className="flex flex-col items-center">
                 <div className="w-4 h-4 border border-white/50 rounded-sm mb-0.5"></div>
               </div>
             </button>
          </div>
       </div>

       {/* Inspiration Library Drawer */}
       <AnimatePresence>
          {showLibrary && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 h-2/3 bg-slate-900/95 backdrop-blur-3xl rounded-t-[40px] z-[70] p-8 border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">Inspiration Assets</h2>
                <button onClick={() => setShowLibrary(false)} className="text-gray-400 p-2"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4 overflow-y-auto max-h-[400px] pb-10 custom-scrollbar">
                {STICKERS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => {
                      setPrompt(`Add ${s.name} style`); // Quick prompt set
                      setShowLibrary(false);
                    }}
                    className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-4xl filter drop-shadow-md">{s.symbol}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{s.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* Hidden Input for File Upload */}
       <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleFileUpload}
         className="hidden" 
         accept="image/*"
       />
    </div>
  );
};