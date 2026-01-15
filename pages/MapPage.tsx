import React from 'react';
import { User, Navigation, MapPin, Layers, Locate, Plus, Minus, Compass } from 'lucide-react';

export const MapPage: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-zinc-100 overflow-hidden font-sans">
      
      {/* Map Background (Full Color Digital Style) */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover" 
            alt="Map Background"
          />
      </div>

      {/* Map Markers (Bauhaus Style) */}
      
      {/* Marker 1: Sticker Location */}
      <div className="absolute top-[35%] left-[30%] flex flex-col items-center group cursor-pointer z-10 transition-transform hover:scale-110 hover:-translate-y-1">
         <div className="bg-white border-2 border-zinc-900 text-zinc-900 text-[10px] font-bold px-2 py-1 mb-1.5 bauhaus-shadow-sm flex flex-col items-center gap-0.5">
            <span className="whitespace-nowrap font-mono uppercase">Broken Sign</span>
            <span className="text-[8px] bg-yellow-400 px-1 border border-zinc-900">150m</span>
         </div>
         <div className="relative">
             <div className="w-8 h-8 bg-red-500 border-2 border-zinc-900 flex items-center justify-center z-10 relative">
                <MapPin size={16} className="text-white fill-white" />
             </div>
             {/* Geometric Stem */}
             <div className="w-0.5 h-4 bg-zinc-900 absolute top-full left-1/2 -translate-x-1/2"></div>
         </div>
      </div>

      {/* Marker 2: New Discovery */}
      <div className="absolute top-[48%] right-[20%] flex flex-col items-center group cursor-pointer z-10">
         <div className="bg-white border-2 border-zinc-900 text-zinc-900 text-[10px] font-bold px-2 py-1 mb-1.5 shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Hologram Bowl
         </div>
         <div className="w-6 h-6 bg-blue-500 border-2 border-zinc-900 rounded-full flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-white rounded-full"></div>
         </div>
      </div>

      {/* User Location */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        {/* Radar Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-blue-500/30 rounded-full animate-ping"></div>
        
        {/* The Arrow */}
        <div className="relative w-10 h-10 bg-white border-2 border-zinc-900 rounded-full bauhaus-shadow flex items-center justify-center z-30">
           <Navigation size={18} className="text-blue-600 fill-blue-600 transform" />
        </div>
      </div>

      {/* Top Left: Context Card */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
          <div className="bg-white border-2 border-zinc-900 px-4 py-3 bauhaus-shadow flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center text-white font-bold">
                N
             </div>
             <div>
                 <h1 className="text-zinc-900 text-sm font-black uppercase leading-none">Cyber District</h1>
                 <p className="text-[10px] text-zinc-500 font-mono mt-1">ZONE A-12</p>
             </div>
          </div>
      </div>

      {/* Top Right: Settings */}
      <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
          <button className="w-10 h-10 bg-white border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:translate-y-0.5 active:shadow-none transition-all">
             <Layers size={20} />
          </button>
      </div>

      {/* Bottom Right: Map Controls */}
      <div className="absolute bottom-28 right-6 flex flex-col gap-3 z-30">
          <div className="flex flex-col bg-white border-2 border-zinc-900 bauhaus-shadow">
             <button className="w-10 h-10 flex items-center justify-center active:bg-zinc-100 border-b-2 border-zinc-900">
                <Plus size={18} />
             </button>
             <button className="w-10 h-10 flex items-center justify-center active:bg-zinc-100">
                <Minus size={18} />
             </button>
          </div>

          <button className="w-10 h-10 bg-yellow-400 border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:translate-y-0.5 active:shadow-none transition-all">
             <Locate size={20} className="text-zinc-900"/>
          </button>
      </div>

      {/* Bottom Left: Scale Indicator */}
      <div className="absolute bottom-24 left-6 z-30 pointer-events-none">
          <p className="text-[10px] font-mono font-bold text-zinc-900 mb-1 ml-1">50M</p>
          <div className="w-20 h-2 border-b-2 border-l-2 border-r-2 border-zinc-900"></div>
      </div>

    </div>
  );
};