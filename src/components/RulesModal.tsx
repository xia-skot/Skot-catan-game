import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Map, Users, Star, Hammer, Ship as ShipIcon, Home, Trophy, Anchor } from 'lucide-react';
import {
  FOREST_IMG,
  FIELDS_IMG,
  PASTURE_IMG,
  Desert_IMG,
  Mountains_IMG,
  LUMBER_ICON,
  BRICK_ICON,
  WOOL_ICON,
  GRAIN_ICON,
  ORE_ICON
} from '../images';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HexImg = ({ src, alt }: { src: string, alt: string }) => (
  <div className={`w-12 h-[54px] mb-1.5 flex items-center justify-center relative`}>
    <div className={`absolute inset-0 bg-slate-300`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute inset-[2px] overflow-hidden bg-slate-100 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover scale-[1.4]" />
      ) : (
        <Anchor size={20} className="text-slate-400" />
      )}
    </div>
  </div>
);

const MockPort = ({ type }: { type: '3:1' | 'wood' | 'brick' | 'wool' | 'grain' | 'ore' }) => {
  const is3to1 = type === '3:1';
  let icon = '';
  let text = '2:1';
  
  if (is3to1) {
    text = '3:1';
  } else if (type === 'wood') {
    icon = LUMBER_ICON;
  } else if (type === 'brick') {
    icon = BRICK_ICON;
  } else if (type === 'wool') {
    icon = WOOL_ICON;
  } else if (type === 'grain') {
    icon = GRAIN_ICON;
  } else if (type === 'ore') {
    icon = ORE_ICON;
  }

  return (
    <div className="w-12 h-[54px] mb-1.5 flex flex-col items-center justify-center relative scale-[0.8]">
      <div className="absolute w-[3px] h-6 bg-[#8B5A2B] left-[13px] top-[10px]" />
      <div className="absolute w-[3px] h-6 bg-[#8B5A2B] right-[13px] top-[10px]" />
      <div className="absolute top-[3px] w-12 h-[22px] bg-[#FFFDF7] border-[1.5px] border-[#C8A97E] rounded-full shadow-sm flex items-center justify-center px-0.5">
        <span className="text-[9px] font-bold text-[#5C4033] mr-0.5">{text}</span>
        {is3to1 ? (
          <Star size={10} className="text-amber-500 fill-amber-500" />
        ) : (
          <img src={icon} alt={type} className="w-3 h-3 object-contain" />
        )}
      </div>
    </div>
  );
};

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <h2 className="text-xl font-serif font-black italic text-slate-800 flex items-center gap-2">
              <BookOpen size={24} className="text-indigo-600" />
              游戏规则与指南
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white no-scrollbar">
            
            {/* 2. 资源板块 */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <Star size={18} className="text-emerald-500" />
                资源板块
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-1.5">
                
                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={FOREST_IMG} alt="森林" />
                  <h4 className="font-bold text-slate-700 text-[11px]">森林</h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    <span>生产</span>
                    <img src={LUMBER_ICON} alt="木材" className="w-2.5 h-2.5 object-contain" />
                    <span className="font-bold text-slate-700 hidden sm:inline">木材</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E4%B8%98%E9%99%B5.jpg'} alt="丘陵" />
                  <h4 className="font-bold text-slate-700 text-[11px]">丘陵</h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    <span>生产</span>
                    <img src={BRICK_ICON} alt="砖块" className="w-2.5 h-2.5 object-contain" />
                    <span className="font-bold text-slate-700 hidden sm:inline">砖块</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={PASTURE_IMG} alt="牧场" />
                  <h4 className="font-bold text-slate-700 text-[11px]">牧场</h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    <span>生产</span>
                    <img src={WOOL_ICON} alt="羊毛" className="w-2.5 h-2.5 object-contain" />
                    <span className="font-bold text-slate-700 hidden sm:inline">羊毛</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={FIELDS_IMG} alt="麦田" />
                  <h4 className="font-bold text-slate-700 text-[11px]">麦田</h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    <span>生产</span>
                    <img src={GRAIN_ICON} alt="小麦" className="w-2.5 h-2.5 object-contain" />
                    <span className="font-bold text-slate-700 hidden sm:inline">小麦</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={Mountains_IMG} alt="矿山" />
                  <h4 className="font-bold text-slate-700 text-[11px]">矿山</h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    <span>生产</span>
                    <img src={ORE_ICON} alt="铁矿石" className="w-2.5 h-2.5 object-contain" />
                    <span className="font-bold text-slate-700 hidden sm:inline">铁矿石</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E9%87%91%E7%9F%BF.jpg'} alt="金矿" />
                  <h4 className="font-bold text-slate-700 text-[11px]">金矿</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    生产任意
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E6%B2%99%E6%BC%A0.jpg'} alt="沙漠" />
                  <h4 className="font-bold text-slate-700 text-[11px]">沙漠</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    不生产资源
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <HexImg src={'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E6%B5%B7%E6%B4%8B.png'} alt="海洋" />
                  <h4 className="font-bold text-slate-700 text-[11px]">海洋</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-sky-500 bg-sky-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                    航海家扩展
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="3:1" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">任意港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    3:1 任意
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="wood" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">木材港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    2:1 木材
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="brick" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">砖块港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    2:1 砖块
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="wool" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">羊毛港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    2:1 羊毛
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="grain" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">小麦港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    2:1 小麦
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow justify-between">
                  <MockPort type="ore" />
                  <h4 className="font-bold text-slate-700 text-[11px] mt-0.5">矿石港口</h4>
                  <div className="flex items-center justify-center mt-0.5 text-[8.5px] sm:text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                    2:1 矿石
                  </div>
                </div>

              </div>
            </section>

            {/* 3. 游戏流程 */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-sky-500 pl-3">
                <Users size={18} className="text-sky-500" />
                游戏流程
              </h3>
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">1</span> 初始建设</h4>
                  <p className="text-sm text-slate-600 ml-7">每位玩家轮流在地图上放置两个定居点和两条道路（或船只）。第二个放置的定居点将为你提供初始资源（周围每个板块对应1个资源）。</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">2</span> 掷骰子与强盗</h4>
                  <p className="text-sm text-slate-600 ml-7">每个回合开始时必须掷骰子。地图上对应该数字的板块将为相邻的定居点/城市产出资源。如果掷出 <strong>7</strong>，则不产出资源：手牌超过7张的玩家必须丢弃一半，并且掷骰子者必须移动强盗并抢夺一名玩家的一张资源卡。</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">3</span> 交易与建设</h4>
                  <p className="text-sm text-slate-600 ml-7">掷骰子后，你可以与其他玩家交易，或与银行(4:1)及港口(3:1或2:1)进行交易。随后可以使用资源建设道路、船只、定居点、城市，或购买发展卡。</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">4</span> 使用发展卡</h4>
                  <p className="text-sm text-slate-600 ml-7">每回合你最多可以使用一张发展卡（当回合购买的发展卡不能在当回合使用，胜利点卡除外）。</p>
                </div>
              </div>
            </section>

            {/* 4. 计分规则 */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                <Star size={18} className="text-amber-500" />
                计分规则 (14分获胜)
              </h3>
              <div className="bg-amber-50/50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed border border-amber-100">
                <p className="mb-2">最先达到目标分数（<strong>14分</strong>）的玩家将在其回合获得胜利。得分方式如下：</p>
                <ul className="list-none space-y-2 mt-3">
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 shrink-0">定居点</span>
                      <span className="text-amber-600 font-black shrink-0">+1 分 / 个</span>
                    </div>
                  </li>
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 shrink-0">城市</span>
                      <span className="text-amber-600 font-black shrink-0">+2 分 / 个</span>
                    </div>
                  </li>
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 shrink-0">最长道路</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 text-left">（至少5条连续的道路或船只，被别人超越时会失去）</span>
                      </div>
                      <span className="text-amber-600 font-black shrink-0">+2 分</span>
                    </div>
                  </li>
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 shrink-0">最大军队</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 text-left">（至少打出3张骑士卡，被别人超越时会失去）</span>
                      </div>
                      <span className="text-amber-600 font-black shrink-0">+2 分</span>
                    </div>
                  </li>
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 shrink-0">岛屿初始建房</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 text-left">（在非出生岛屿上建设的第一个定居点提供额外2分，此后不再叠加）</span>
                      </div>
                      <span className="text-amber-600 font-black shrink-0">+2 分</span>
                    </div>
                  </li>
                  <li className="flex flex-col bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 shrink-0">胜利点卡</span>
                      <span className="text-amber-600 font-black shrink-0">+1 分 / 张</span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. 建筑与发展卡消耗 */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-rose-500 pl-3">
                <Map size={18} className="text-rose-500" />
                建筑与发展卡消耗
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer size={16} className="text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">道路</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={BRICK_ICON} alt="砖块" className="w-5 h-5 object-contain" />
                    <img src={LUMBER_ICON} alt="木材" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShipIcon size={16} className="text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">船只</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={WOOL_ICON} alt="羊毛" className="w-5 h-5 object-contain" />
                    <img src={LUMBER_ICON} alt="木材" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">定居点</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={BRICK_ICON} alt="砖块" className="w-5 h-5 object-contain" />
                    <img src={LUMBER_ICON} alt="木材" className="w-5 h-5 object-contain" />
                    <img src={WOOL_ICON} alt="羊毛" className="w-5 h-5 object-contain" />
                    <img src={GRAIN_ICON} alt="小麦" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">城市</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={GRAIN_ICON} alt="小麦" className="w-5 h-5 object-contain" />
                    <img src={GRAIN_ICON} alt="小麦" className="w-5 h-5 object-contain" />
                    <img src={ORE_ICON} alt="铁矿石" className="w-5 h-5 object-contain" />
                    <img src={ORE_ICON} alt="铁矿石" className="w-5 h-5 object-contain" />
                    <img src={ORE_ICON} alt="铁矿石" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">发展卡</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={WOOL_ICON} alt="羊毛" className="w-5 h-5 object-contain" />
                    <img src={GRAIN_ICON} alt="小麦" className="w-5 h-5 object-contain" />
                    <img src={ORE_ICON} alt="铁矿石" className="w-5 h-5 object-contain" />
                  </div>
                </div>
              </div>
            </section>
            {/* 6. 发展卡详情 */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-violet-500 pl-3">
                <BookOpen size={18} className="text-violet-500" />
                发展卡详情
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg leading-none">⚔️</span> 骑士卡
                    </h4>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">共 14 张</span>
                  </div>
                  <p className="text-slate-600 text-xs">打出后可以移动强盗或海盗，并从受影响板块的玩家手中随机抽取一张资源卡。最先打出3张骑士卡的玩家获得“最大军队”称号（2分）。</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg leading-none">🏆</span> 胜利点卡
                    </h4>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">共 5 张</span>
                  </div>
                  <p className="text-slate-600 text-xs">每张卡片价值1个胜利点。隐藏在手中，可以在达到获胜条件时立刻打出并赢得游戏。</p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg leading-none">🛣️</span> 道路建设
                    </h4>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">共 2 张</span>
                  </div>
                  <p className="text-slate-600 text-xs">打出后可以免费在地图上建设两条道路或船只（必须符合建造规则）。</p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg leading-none">🎁</span> 丰收之年
                    </h4>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">共 2 张</span>
                  </div>
                  <p className="text-slate-600 text-xs">打出后可以立刻从银行免费拿取任意两张你选择的资源卡。</p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg leading-none">💎</span> 垄断
                    </h4>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">共 2 张</span>
                  </div>
                  <p className="text-slate-600 text-xs">打出后声明一种资源，所有其他玩家必须将他们手中该种资源的所有卡片全部交给你。</p>
                </div>
              </div>
            </section>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
