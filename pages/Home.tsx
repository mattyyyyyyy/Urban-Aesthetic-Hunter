import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Layers, LayoutGrid, List, ArrowLeft, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

// 城市海报数据 (City Posters)
const CITY_POSTERS = [
  {
    id: 1,
    issue: 'NO.01',
    title: '东京',
    enTitle: 'TOKYO',
    subtitle: '新宿灵魂碎片',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/unnamed.jpg?raw=true',
    tag: 'HOT',
    color: 'bg-red-500',
  },
  {
    id: 2,
    issue: 'NO.02',
    title: '重庆',
    enTitle: 'CHONGQING',
    subtitle: '8D魔幻现实',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/unnamed%20(1).jpg?raw=true',
    tag: 'NEW',
    color: 'bg-blue-600',
  },
  {
    id: 3,
    issue: 'NO.03',
    title: '香港',
    enTitle: 'HONGKONG',
    subtitle: '九龙城寨回响',
    image: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=800&auto=format&fit=crop',
    tag: 'LTD',
    color: 'bg-yellow-400',
  }
];

// 路线攻略数据
const TOKYO_ITINERARY = [
    { id: 'p1', name: '浅草寺雷门', x: 20, y: 62, type: 'start' },
    { id: 'p2', name: '东京塔', x: 45, y: 52, type: 'waypoint' },
    { id: 'p3', name: '六本木', x: 35, y: 38, type: 'waypoint' },
    { id: 'p4', name: '涉谷', x: 65, y: 28, type: 'waypoint' },
    { id: 'p5', name: '新宿', x: 80, y: 15, type: 'end' }
];

const STICKER_ITEMS = [
  {
    id: 's1',
    name: '故障路标',
    location: '上海',
    date: '23.10.24',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/111111.jpg?raw=true',
    fullImage: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/111111.jpg?raw=true',
  },
  {
    id: 's2',
    name: '拉面碗',
    location: '东京',
    date: '23.11.02',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/1111231231411.jpg?raw=true',
    fullImage: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/1111231231411.jpg?raw=true',
  },
  {
    id: 's3',
    name: '机械臂',
    location: '重庆',
    date: '23.12.15',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/222222.jpg?raw=true',
    fullImage: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/222222.jpg?raw=true',
  },
  {
    id: 's4',
    name: '复古电视',
    location: '香港',
    date: '24.01.05',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/33333.jpg?raw=true',
    fullImage: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/33333.jpg?raw=true',
  },
  {
    id: 's5',
    name: '霓虹梦',
    location: '台北',
    date: '24.02.14',
    image: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/image.png?raw=true',
    fullImage: 'https://github.com/mattyyyyyyy/picture2bed/blob/main/citypictture/image.png?raw=true',
  }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSticker, setSelectedSticker] = useState<typeof STICKER_ITEMS[0] | null>(null);
  const [activeCityId, setActiveCityId] = useState<number | null>(null);
  const [isGridView, setIsGridView] = useState(true);

  // Find active city data
  const activeCity = CITY_POSTERS.find(c => c.id === activeCityId);

  // Generate SVG path for the itinerary route
  const routePath = useMemo(() => {
    if (!TOKYO_ITINERARY.length) return "";
    return TOKYO_ITINERARY.reduce((acc, point, index) => {
        const cmd = index === 0 ? 'M' : 'L';
        return `${acc} ${cmd} ${point.x} ${point.y}`;
    }, "");
  }, []);

  const handleCreate = () => {
      if (selectedSticker) {
          navigate(`/${AppRoute.CAMERA}`, { 
              state: { initialSticker: selectedSticker.fullImage } 
          });
      }
  };

  return (
    <div className="w-full h-full bg-[#F2F2F7] flex flex-col text-black overflow-hidden font-sans relative">
      
      {/* 顶部安全区 (无标题栏) */}
      <div className="w-full h-12 bg-[#F2F2F7]/90 backdrop-blur-md sticky top-0 z-30" />

      {/* 主要内容滚动区 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        
        {/* 区域 1: 城市海报 (Carousel) */}
        <div className="pb-6">
            <div className="px-4 mb-3 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">精选城市</h2>
                <button className="text-xs font-medium text-gray-500 flex items-center gap-0.5">
                    全部 <ChevronRight size={14} />
                </button>
            </div>

            {/* 横向滚动容器 */}
            <div className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-3 no-scrollbar">
                {CITY_POSTERS.map((item) => (
                    <motion.div 
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveCityId(item.id)}
                        className="snap-center shrink-0 w-[85vw] md:w-[400px] aspect-[16/10] relative rounded-[16px] overflow-hidden shadow-sm cursor-pointer bg-white"
                    >
                        {/* Image - Full Color, Fill Container */}
                        <img 
                            src={item.image} 
                            className="w-full h-full object-cover"
                            alt={item.title} 
                        />
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        {/* Top Badge */}
                        <div className="absolute top-3 left-3">
                            <div className="ios-glass px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full text-black backdrop-blur-xl">
                                {item.enTitle}
                            </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="text-xl font-bold mb-0.5">{item.title}</h3>
                            <p className="text-xs font-medium opacity-90">{item.subtitle}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* 区域 2: 贴纸库 (Stickers) */}
        <div className="px-4">
            <div className="mb-3 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">我的收集</h2>
                {/* View Toggle */}
                <div className="flex bg-gray-200/80 p-0.5 rounded-lg h-7">
                    <button 
                        onClick={() => setIsGridView(true)}
                        className={`px-2.5 rounded-[5px] flex items-center justify-center transition-all ${isGridView ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button 
                        onClick={() => setIsGridView(false)}
                        className={`px-2.5 rounded-[5px] flex items-center justify-center transition-all ${!isGridView ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className={isGridView ? "grid grid-cols-2 gap-2 pb-8" : "flex flex-col gap-2 pb-8"}>
                {STICKER_ITEMS.map((item, idx) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`
                            bg-white cursor-pointer group relative overflow-hidden transition-all duration-200
                            ${isGridView 
                                ? 'rounded-xl shadow-sm aspect-square border-none' 
                                : 'rounded-xl shadow-sm border border-gray-100 flex flex-row items-center p-2 gap-3 h-20'
                            }
                        `}
                        onClick={() => setSelectedSticker(item)}
                    >
                        {/* Image Container */}
                        <div className={`
                            relative bg-gray-100 overflow-hidden shrink-0
                            ${isGridView 
                                ? 'absolute inset-0 w-full h-full' // Grid: Fill entire card
                                : 'w-16 h-16 rounded-lg' // List: Fixed thumbnail
                            }
                        `}>
                             <img 
                                src={item.image} 
                                className="w-full h-full object-cover" 
                                alt={item.name} 
                            />
                        </div>

                        {/* Text Container - Overlay for Grid, Side for List */}
                        <div className={`
                            ${isGridView 
                                ? 'absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end h-1/2'
                                : 'flex flex-col justify-center min-w-0 flex-1'
                            }
                        `}>
                            <h3 className={`font-bold text-sm truncate leading-tight mb-0.5 ${isGridView ? 'text-white' : 'text-gray-900'}`}>
                                {item.name}
                            </h3>
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${isGridView ? 'text-white/80' : 'text-gray-500'}`}>
                                <MapPin size={10} />
                                <span className="truncate">{item.location}</span>
                            </div>
                        </div>

                        {/* List View Arrow */}
                        {!isGridView && (
                            <div className="pr-1 text-gray-300">
                                <ChevronRight size={16} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
      </div>

      {/* 贴纸详情 Modal */}
      <AnimatePresence>
        {selectedSticker && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedSticker(null)}
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedSticker(null)}
                        className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                    >
                        <X size={16} className="text-black" />
                    </button>

                    {/* Image Area */}
                    <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-0 relative">
                         <img 
                            src={selectedSticker.fullImage} 
                            className="w-full h-full object-cover z-10" 
                            alt={selectedSticker.name} 
                         />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                         <div className="flex items-start justify-between mb-4">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedSticker.name}</h2>
                                <p className="text-sm text-gray-500 font-medium">{selectedSticker.location} • {selectedSticker.date}</p>
                             </div>
                             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                 <Layers size={20} />
                             </div>
                         </div>

                         <button 
                            onClick={handleCreate}
                            className="w-full py-3.5 bg-black text-white font-semibold text-sm rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
                         >
                            去创作
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 城市攻略详情页 (Scrollable Page) */}
      <AnimatePresence>
        {activeCity && (
            <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-white flex flex-col font-sans"
            >
                {/* Header (Sticky) */}
                <div className="sticky top-0 z-30 px-4 pt-14 pb-3 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between">
                     <button 
                        onClick={() => setActiveCityId(null)}
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={18} className="text-black" />
                    </button>
                    <span className="font-bold text-sm text-gray-500 tracking-wider">{activeCity.enTitle}</span>
                    <div className="w-9"></div> {/* Spacer */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-white pb-10">
                    
                    {/* 1. 标题区 */}
                    <div className="px-6 pt-8 pb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">{activeCity.tag}</span>
                            <span className="text-xs font-mono text-gray-400">{activeCity.issue}</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">{activeCity.title}</h1>
                        <p className="text-lg text-gray-500 font-medium">{activeCity.subtitle}</p>
                    </div>

                    {/* 2. 封面大图 */}
                    <div className="w-full aspect-[4/3] px-6 mb-10">
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg relative">
                             <img 
                                src={activeCity.image} 
                                className="w-full h-full object-cover"
                                alt="Cover"
                            />
                            {/* Decorative Line */}
                            <div className="absolute bottom-4 left-4 w-12 h-1 bg-white/80 backdrop-blur-sm rounded-full"></div>
                        </div>
                    </div>

                    {/* 3. 路线地图区 (Scroll down to see) */}
                    <div className="px-6 mb-4">
                        <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-500" />
                            城市探索路线
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">下滑查看完整路线图</p>
                    </div>

                    <div className="w-full h-[60vh] relative bg-gray-50 border-t border-b border-gray-100">
                        <img 
                            src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop" 
                            className="w-full h-full object-cover grayscale opacity-15"
                            alt="Map"
                        />
                        
                        {/* SVG Route */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path 
                                d={routePath} 
                                fill="none" 
                                stroke="#3b82f6" 
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="4 4"
                            />
                        </svg>

                        {/* Waypoints */}
                        {TOKYO_ITINERARY.map((point, index) => (
                            <div
                                key={point.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
                                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                            >
                                <div className="mb-2 px-2.5 py-1 bg-white rounded-lg shadow-md border border-gray-100 transform transition-transform hover:-translate-y-1">
                                    <span className="text-xs font-bold text-gray-800 whitespace-nowrap">
                                        {point.name}
                                    </span>
                                </div>
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${point.type === 'start' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-6 text-center text-gray-300 text-xs">
                        End of Itinerary
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};