import React from 'react';
import { MapPin, Heart, Search, Scan, Battery, Wifi, Signal } from 'lucide-react';
import { Post } from '../types';
import { motion } from 'framer-motion';

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Neon nights in Shinjuku were absolutely surreal yesterday',
    image: 'https://picsum.photos/400/500?random=1',
    likes: 1245,
    user: { name: 'CyberWalker', avatar: 'https://i.pravatar.cc/150?u=1' },
    heightClass: 'aspect-[3/4]'
  },
  {
    id: '2',
    title: 'Found this hidden brutalist cafe in the old district',
    image: 'https://picsum.photos/400/400?random=2',
    likes: 892,
    user: { name: 'ArchHunter', avatar: 'https://i.pravatar.cc/150?u=2' },
    heightClass: 'aspect-square'
  },
  {
    id: '3',
    title: 'The reflections on the wet pavement create a perfect mirror world',
    image: 'https://picsum.photos/400/600?random=3',
    likes: 4521,
    user: { name: 'RainMaker', avatar: 'https://i.pravatar.cc/150?u=3' },
    heightClass: 'aspect-[2/3]'
  },
  {
    id: '4',
    title: 'Subway aesthetics are peak design',
    image: 'https://picsum.photos/400/300?random=4',
    likes: 56,
    user: { name: 'MetroBoi', avatar: 'https://i.pravatar.cc/150?u=4' },
    heightClass: 'aspect-[4/3]'
  },
  {
    id: '5',
    title: 'Just downloaded the new augmentation patch for my lens',
    image: 'https://picsum.photos/400/550?random=5',
    likes: 102,
    user: { name: 'Techie', avatar: 'https://i.pravatar.cc/150?u=5' },
    heightClass: 'aspect-[3/4]'
  },
  {
    id: '6',
    title: 'Chrome Sky looking ominous tonight',
    image: 'https://picsum.photos/400/450?random=6',
    likes: 15,
    user: { name: 'SkyWatcher', avatar: 'https://i.pravatar.cc/150?u=6' },
    heightClass: 'aspect-square'
  },
  {
    id: '7',
    title: 'Lost in the data stream of the upper city',
    image: 'https://picsum.photos/400/700?random=7',
    likes: 330,
    user: { name: 'DataDrifter', avatar: 'https://i.pravatar.cc/150?u=7' },
    heightClass: 'aspect-[9/16]'
  },
  {
    id: '8',
    title: 'Minimalist corners',
    image: 'https://picsum.photos/400/420?random=8',
    likes: 88,
    user: { name: 'MonoTone', avatar: 'https://i.pravatar.cc/150?u=8' },
    heightClass: 'aspect-square'
  }
];

export const Home: React.FC = () => {
  // Split posts for waterfall layout (Masonry)
  const leftColumn = MOCK_POSTS.filter((_, i) => i % 2 === 0);
  const rightColumn = MOCK_POSTS.filter((_, i) => i % 2 !== 0);

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col text-white relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 to-slate-900 pointer-events-none" />

      {/* Top Fixed Header Area */}
      <div className="flex-none bg-slate-900/95 backdrop-blur-xl z-50 sticky top-0 w-full border-b border-white/5">
        
        {/* Status Bar (Reserved Space) */}
        <div className="w-full h-[44px]"></div>

        {/* App Header */}
        <div className="flex items-center justify-between px-4 py-2 pb-3">
           {/* Left Icon */}
           <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all">
              <Scan size={22} className="text-gray-100" />
           </button>

           {/* Center Tabs */}
           <div className="flex items-baseline gap-5">
              <button className="text-gray-400 text-sm font-medium relative hover:text-white transition-colors">
                Update
                <div className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></div>
              </button>
              <button className="text-white text-lg font-bold relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-0.5 after:bg-amber-400">
                Discover
              </button>
              <button className="text-gray-400 text-sm font-medium hover:text-white transition-colors">
                Shanghai
              </button>
           </div>

           {/* Right Icon */}
           <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all">
              <Search size={22} className="text-gray-100" />
           </button>
        </div>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pt-2 pb-24">
         <div className="flex gap-2 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-2 w-1/2">
               {leftColumn.map((post, idx) => (
                 <PostCard key={post.id} post={post} index={idx} />
               ))}
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-2 w-1/2">
               {rightColumn.map((post, idx) => (
                 <PostCard key={post.id} post={post} index={idx} />
               ))}
            </div>
         </div>
         
         {/* Loading Indicator at bottom */}
         <div className="w-full text-center py-6 text-xs text-gray-500 font-mono">
            Scanning for more aesthetics...
         </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post; index: number }> = ({ post, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-slate-800 rounded-xl overflow-hidden mb-1 shadow-lg shadow-black/20 group"
  >
     {/* Image Area */}
     <div className={`w-full ${post.heightClass} bg-slate-700 relative overflow-hidden`}>
        <img 
          src={post.image} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
     </div>
     
     {/* Content Area */}
     <div className="p-3">
        {/* Title */}
        <h3 className="text-[13px] font-bold text-gray-100 leading-snug line-clamp-2 mb-3 tracking-wide">
          {post.title}
        </h3>
        
        {/* User Info Row */}
        <div className="flex items-center justify-between mt-auto">
           <div className="flex items-center gap-1.5 overflow-hidden flex-1">
              <img 
                src={post.user.avatar} 
                className="w-5 h-5 rounded-full flex-shrink-0 bg-gray-600 border border-white/10" 
                alt={post.user.name} 
              />
              <span className="text-[10px] text-gray-400 truncate font-medium">{post.user.name}</span>
           </div>
           
           <div className="flex items-center gap-1 flex-shrink-0 pl-2">
              <Heart size={12} className="text-gray-400 group-hover:text-red-400 group-hover:fill-red-400 transition-colors" />
              <span className="text-[10px] text-gray-400 font-mono">{post.likes}</span>
           </div>
        </div>
     </div>
  </motion.div>
);