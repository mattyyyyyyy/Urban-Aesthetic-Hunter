import React from 'react';
import { User, Scan, Layers } from 'lucide-react';

export const MapPage: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Radar Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
         <div className="w-[800px] h-[800px] border border-amber-500/30 rounded-full flex items-center justify-center">
            <div className="w-[600px] h-[600px] border border-amber-500/20 rounded-full flex items-center justify-center">
               <div className="w-[400px] h-[400px] border border-amber-500/10 rounded-full"></div>
            </div>
         </div>
      </div>

      {/* Radar Sweep Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[1000px] bg-[conic-gradient(transparent_270deg,rgba(251,191,36,0.1)_360deg)] animate-[spin_4s_linear_infinite] rounded-full blur-3xl"></div>
      </div>

      {/* Map Points (Mock) */}
      <div className="absolute top-1/3 left-1/4 animate-pulse">
        <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>
        <div className="absolute top-4 left-0 bg-black/80 border border-amber-500/50 px-2 py-1 rounded text-[10px] font-mono text-amber-300 whitespace-nowrap backdrop-blur-sm">
          Aesthetic Found: 200m
        </div>
      </div>
      
      {/* User Location */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1)] relative z-10 flex items-center justify-center">
            <User size={10} className="text-black" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Fog of War Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.9)_80%)] pointer-events-none"></div>
      
      {/* Search Header */}
      <div className="absolute top-14 left-6 right-6 flex gap-4 z-50">
        <div className="flex-1 h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center px-5 gap-3">
          <Scan size={18} className="text-amber-400" />
          <span className="text-white/40 text-xs font-medium font-mono">SCANNING_SECTOR_07...</span>
        </div>
        <button className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white">
            <Layers size={20} />
        </button>
      </div>
    </div>
  );
};