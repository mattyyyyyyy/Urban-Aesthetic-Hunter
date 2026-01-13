import React from 'react';
import { MapPin, Heart, ChevronRight, History } from 'lucide-react';
import { Post } from '../types';
import { motion } from 'framer-motion';

const MOCK_POSTS: Post[] = [
  { id: '1', title: 'Cyberpunk Alley', image: 'https://picsum.photos/400/600', likes: 124 },
  { id: '2', title: 'Neon Rain', image: 'https://picsum.photos/400/500', likes: 89 },
  { id: '3', title: 'Concrete Zen', image: 'https://picsum.photos/400/700', likes: 231 },
  { id: '4', title: 'Subway Glitch', image: 'https://picsum.photos/400/450', likes: 56 },
  { id: '5', title: 'Brutalist Void', image: 'https://picsum.photos/400/650', likes: 102 },
  { id: '6', title: 'Chrome Sky', image: 'https://picsum.photos/400/550', likes: 15 },
];

export const Home: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-900 relative">
      {/* Subtle Background Gradient to prevent stark black screen */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-slate-900 pointer-events-none" />

      {/* Main Content Scroll Area */}
      <div className="w-full h-full pt-14 px-4 pb-32 custom-scrollbar overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 px-2">
          <h1 className="text-2xl font-bold tracking-tight text-white italic">
            AESTHETIC <span className="text-amber-400">HUNTER</span>
          </h1>
          <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
            <History size={20} />
          </button>
        </div>

        {/* Waterfall Grid */}
        <div className="grid grid-cols-2 gap-4 pb-10">
          {MOCK_POSTS.map((post, index) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="aspect-[3/4] rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute inset-0">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
              </div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-end">
                <div className="bg-black/40 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
                  <Heart size={10} className="text-amber-400 fill-amber-400" /> 
                </div>
              </div>
              
              {/* Content info */}
              <div className="relative z-10">
                <span className="text-[10px] font-mono text-amber-400 opacity-90 tracking-wider">2025.05.{20 + index}</span>
                <h3 className="text-sm font-bold mt-1 leading-tight text-white line-clamp-2">{post.title}</h3>
                
                <div className="flex justify-between items-end mt-2 border-t border-white/10 pt-2">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400">
                      <MapPin size={8} />
                      <span>0.{8 + index}km</span>
                  </div>
                  <ChevronRight size={14} className="text-amber-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};