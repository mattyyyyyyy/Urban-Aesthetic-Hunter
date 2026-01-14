import React from 'react';
import { Search, User, ChevronRight, Layers, Sparkles, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

// 城市海报数据 (City Posters)
const CITY_POSTERS = [
  {
    id: 1,
    issue: 'VOL.01',
    title: '霓虹东京',
    enTitle: 'TOKYO CYBERPUNK',
    subtitle: '寻找新宿的灵魂碎片',
    image: 'https://images.unsplash.com/photo-1542051841-866158684856?q=80&w=800&auto=format&fit=crop',
    tag: '热门城市'
  },
  {
    id: 2,
    issue: 'VOL.02',
    title: '赛博重庆',
    enTitle: 'CYBER MOUNTAIN',
    subtitle: '穿梭于8D魔幻现实',
    image: 'https://images.unsplash.com/photo-1464869032613-1908608794b4?q=80&w=800&auto=format&fit=crop',
    tag: '新发布'
  },
  {
    id: 3,
    issue: 'VOL.03',
    title: '雨夜香港',
    enTitle: 'NEON RAIN',
    subtitle: '九龙城寨的数字回响',
    image: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=800&auto=format&fit=crop',
    tag: '限时活动'
  }
];

// 贴纸库数据 (Sticker Library)
const STICKER_LIBRARY = [
  {
    id: 's1',
    name: '赛博义体组件',
    desc: '机械臂 / 电子眼 / 神经接口',
    count: 12,
    collected: 8,
    preview1: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&fit=crop',
    preview2: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&fit=crop',
  },
  {
    id: 's2',
    name: '故障艺术字体',
    desc: '破碎 / 重叠 / 信号失真',
    count: 24,
    collected: 2,
    preview1: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=200&fit=crop',
    preview2: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&fit=crop',
  },
  {
    id: 's3',
    name: '工业废墟纹理',
    desc: '混凝土 / 锈迹 / 警告标识',
    count: 18,
    collected: 18,
    preview1: 'https://images.unsplash.com/photo-1518558997970-4ddc236affcd?q=80&w=200&fit=crop',
    preview2: 'https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=200&fit=crop',
  }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col text-white overflow-hidden font-sans">
      
      {/* 顶部导航栏 */}
      <header className="flex-none px-6 pt-14 pb-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900 to-slate-900/0">
         <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/5 shadow-lg">
                <Box size={20} className="text-amber-400" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg leading-none tracking-tight">Pi Next</span>
                <span className="text-[10px] text-gray-400 font-mono tracking-wider">URBAN HUNTER</span>
            </div>
         </div>
         <div className="flex gap-3">
             <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/5 active:scale-95 transition-all">
                <Search size={20} className="text-white/80" />
             </button>
             <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/5 active:scale-95 transition-all">
                <User size={20} className="text-white/80" />
             </button>
         </div>
      </header>

      {/* 主要内容滚动区 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        
        {/* 区域 1: 城市海报 (横向滑动) */}
        <div className="mb-8">
            <div className="px-6 mb-4 flex justify-between items-end">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    城市海报 
                    <span className="text-amber-400 text-xs font-mono px-1.5 py-0.5 bg-amber-400/10 rounded">LIVE</span>
                </h2>
                <button className="text-xs text-gray-400 font-medium flex items-center hover:text-white transition-colors">
                    全部城市 <ChevronRight size={12} />
                </button>
            </div>

            {/* 横向滚动容器 */}
            <div className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 no-scrollbar pb-4">
                {CITY_POSTERS.map((item) => (
                    <motion.div 
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        className="snap-center shrink-0 w-[85vw] h-[50vh] relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group bg-slate-800"
                    >
                        <img src={item.image} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                        
                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                        
                        {/* 左上角标签 */}
                        <div className="absolute top-5 left-5 flex items-center gap-2">
                            <div className="px-2 py-1 bg-black/30 backdrop-blur-md rounded-lg text-[10px] font-mono font-bold tracking-wider border border-white/10 text-white/90">
                                {item.issue}
                            </div>
                            {item.tag && (
                                <div className="px-2 py-1 bg-amber-500/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-black border border-amber-400">
                                    {item.tag}
                                </div>
                            )}
                        </div>

                        {/* 底部信息 */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                            <h3 className="text-3xl font-black leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                                {item.title}
                            </h3>
                            <div className="text-xs font-mono text-amber-400 mb-2 tracking-widest uppercase opacity-80">
                                {item.enTitle}
                            </div>
                            <p className="text-gray-300 text-sm font-light tracking-wide flex items-center gap-2 border-l-2 border-amber-500 pl-3">
                                {item.subtitle}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* 区域 2: 贴纸库 (垂直列表) */}
        <div className="px-6">
            <div className="mb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold mb-1">贴纸库</h2>
                    <p className="text-xs text-gray-400">已收集 3 套 • 发现 12 个新素材</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90">
                    <Layers size={16} className="text-white/80" />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {STICKER_LIBRARY.map((collection, idx) => (
                    <motion.div 
                        key={collection.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-800/40 border border-white/5 rounded-3xl p-4 flex gap-4 backdrop-blur-sm active:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => navigate(`/${AppRoute.CAMERA}`)}
                    >
                        {/* 预览图片堆叠 */}
                        <div className="relative w-20 h-24 flex-shrink-0 ml-1">
                            <div className="absolute top-0 right-[-4px] w-16 h-20 bg-slate-700 rounded-xl rotate-12 overflow-hidden border border-white/10 shadow-lg z-0 opacity-40">
                                <img src={collection.preview2} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="absolute top-1 right-[-2px] w-16 h-20 bg-slate-600 rounded-xl rotate-6 overflow-hidden border border-white/10 shadow-lg z-10 opacity-70">
                                <img src={collection.preview2} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="absolute top-2 left-0 w-16 h-20 bg-slate-500 rounded-xl -rotate-2 overflow-hidden border border-white/10 shadow-xl z-20">
                                <img src={collection.preview1} className="w-full h-full object-cover" alt="" />
                            </div>
                        </div>

                        {/* 信息内容 */}
                        <div className="flex-1 flex flex-col justify-center py-1 pl-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-gray-100">{collection.name}</h3>
                                {collection.collected === collection.count && (
                                    <Sparkles size={14} className="text-amber-400" />
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{collection.desc}</p>

                            {/* 进度条 */}
                            <div className="w-full">
                                <div className="flex justify-between text-[10px] font-mono mb-1.5 text-gray-400">
                                    <span>COLLECTION</span>
                                    <span className={collection.collected === collection.count ? 'text-amber-400' : ''}>
                                        {collection.collected} / {collection.count}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${collection.collected === collection.count ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-white/40'}`} 
                                        style={{ width: `${(collection.collected / collection.count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 底部按钮 */}
            <button className="w-full mt-6 py-4 rounded-3xl border border-dashed border-white/10 text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5 hover:border-white/20 transition-all mb-8 text-sm group">
                <span className="group-hover:text-gray-300">浏览更多贴纸包</span>
                <ChevronRight size={14} />
            </button>
        </div>

      </div>
    </div>
  );
};
