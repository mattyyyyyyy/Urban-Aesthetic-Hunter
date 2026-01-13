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
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent flex items-center justify-around px-8 z-40 pb-4">
      {/* Home Button */}
      <button 
        onClick={() => onNavigate(AppRoute.HOME)} 
        className={`flex flex-col items-center transition-colors ${currentRoute === AppRoute.HOME ? 'text-amber-400' : 'text-gray-500'}`}
      >
        <Home size={24} strokeWidth={currentRoute === AppRoute.HOME ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-medium tracking-wide">FEED</span>
      </button>
      
      {/* Floating Camera Button */}
      <div className="relative -top-4">
        <button 
          onClick={() => onNavigate(AppRoute.CAMERA)}
          className="w-16 h-16 rounded-full bg-gradient-to-b from-gray-100 to-gray-400 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center border-4 border-slate-900 active:scale-90 transition-transform group"
        >
          <Camera size={30} className="text-slate-900 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Map Button */}
      <button 
        onClick={() => onNavigate(AppRoute.MAP)} 
        className={`flex flex-col items-center transition-colors ${currentRoute === AppRoute.MAP ? 'text-amber-400' : 'text-gray-500'}`}
      >
        <MapIcon size={24} strokeWidth={currentRoute === AppRoute.MAP ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-medium tracking-wide">RADAR</span>
      </button>
    </div>
  );
};