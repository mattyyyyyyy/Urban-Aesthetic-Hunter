import React from 'react';
import { Home, Map as MapIcon, Camera } from 'lucide-react';
import { AppRoute } from '../../types';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  // Hide bottom nav on camera page to let the specific camera controls take over
  if (currentRoute === AppRoute.CAMERA) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-8 z-40 pb-2">
      {/* Home Button */}
      <button 
        onClick={() => onNavigate(AppRoute.HOME)} 
        className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${currentRoute === AppRoute.HOME ? 'text-amber-400' : 'text-gray-500'}`}
      >
        <Home size={22} strokeWidth={currentRoute === AppRoute.HOME ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Home</span>
      </button>
      
      {/* Floating Camera Button (Middle) */}
      <div className="relative -top-6">
        <button 
          onClick={() => onNavigate(AppRoute.CAMERA)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_4px_20px_rgba(251,191,36,0.4)] flex items-center justify-center border-4 border-slate-900 active:scale-90 transition-transform group"
        >
          <Camera size={24} className="text-slate-900 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Map Button */}
      <button 
        onClick={() => onNavigate(AppRoute.MAP)} 
        className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${currentRoute === AppRoute.MAP ? 'text-amber-400' : 'text-gray-500'}`}
      >
        <MapIcon size={22} strokeWidth={currentRoute === AppRoute.MAP ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Radar</span>
      </button>
    </div>
  );
};