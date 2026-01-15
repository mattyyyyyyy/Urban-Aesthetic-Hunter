import React from 'react';
import { Home, Map as MapIcon, Camera, LayoutGrid } from 'lucide-react';
import { AppRoute } from '../../types';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  // Hide bottom nav on camera page to let the specific camera controls take over
  if (currentRoute === AppRoute.CAMERA) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-zinc-900 flex items-center justify-around px-6 z-40 pb-2">
      
      {/* Home Button */}
      <button 
        onClick={() => onNavigate(AppRoute.HOME)} 
        className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-lg transition-all active:scale-95 ${
            currentRoute === AppRoute.HOME ? 'bg-zinc-100 bauhaus-border bauhaus-shadow-sm -translate-y-1' : ''
        }`}
      >
        <Home size={20} strokeWidth={2.5} className={currentRoute === AppRoute.HOME ? 'text-black' : 'text-zinc-400'} />
      </button>
      
      {/* Floating Camera Button (Middle) - Geometric Bauhaus Style */}
      <div className="relative -top-6">
        <button 
          onClick={() => onNavigate(AppRoute.CAMERA)}
          className="w-16 h-16 bg-white border-2 border-zinc-900 flex items-center justify-center bauhaus-shadow active:bauhaus-shadow-hover transition-all active:scale-95 group relative overflow-hidden"
          style={{ borderRadius: '4px' }} // Slightly rounded square
        >
            {/* Geometric decor inside button */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 border-r-2 border-b-2 border-zinc-900"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 border-l-2 border-t-2 border-zinc-900"></div>
            
            <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-900 group-hover:bg-white group-hover:text-black transition-colors flex items-center justify-center text-white">
                <Camera size={18} />
            </div>
        </button>
      </div>

      {/* Map Button */}
      <button 
        onClick={() => onNavigate(AppRoute.MAP)} 
        className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-lg transition-all active:scale-95 ${
            currentRoute === AppRoute.MAP ? 'bg-zinc-100 bauhaus-border bauhaus-shadow-sm -translate-y-1' : ''
        }`}
      >
        <MapIcon size={20} strokeWidth={2.5} className={currentRoute === AppRoute.MAP ? 'text-black' : 'text-zinc-400'} />
      </button>
    </div>
  );
};