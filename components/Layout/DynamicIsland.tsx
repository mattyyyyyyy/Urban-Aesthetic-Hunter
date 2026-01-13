import React from 'react';

interface DynamicIslandProps {
  status: 'idle' | 'scanning' | 'processing' | 'success';
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({ status }) => {
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <div 
        className={`bg-black rounded-[24px] transition-all duration-500 ease-spring ${
          status === 'idle' ? 'w-[120px] h-[35px]' : 
          status === 'scanning' ? 'w-[200px] h-[35px]' :
          status === 'processing' ? 'w-[200px] h-[60px]' :
          'w-[240px] h-[50px]'
        } flex items-center justify-center overflow-hidden relative shadow-2xl border border-white/10`}
      >
        {status === 'idle' && (
          <div className="w-full h-full flex items-center justify-between px-4 opacity-50">
             <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
             <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          </div>
        )}
        
        {status === 'scanning' && (
           <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse">
             <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
             SCANNING_ENV...
           </div>
        )}

        {status === 'processing' && (
           <div className="flex flex-col items-center gap-1">
             <div className="flex items-center gap-2 text-xs font-mono text-yellow-400">
               <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
               GEMINI_PROCESSING
             </div>
             <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 animate-[width_1s_ease-in-out_infinite] w-1/2"></div>
             </div>
           </div>
        )}

        {status === 'success' && (
           <div className="flex items-center gap-2 text-sm font-semibold text-white">
             <span className="text-emerald-400">✓</span>
             AESTHETIC ACQUIRED
           </div>
        )}
      </div>
    </div>
  );
};