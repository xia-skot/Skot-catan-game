import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HexType } from '../types';

interface MapAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMaps: any[];
  onSelectMap: (map: any) => void;
  onDeleteMap: (id: string) => void;
  onGenerateNew: () => void;
  albumFilter: '2-4' | '5' | '6';
  setAlbumFilter: (val: '2-4' | '5' | '6') => void;
  MapPreviewRenderer?: React.ComponentType<{ board: any[], isTopologyOnly?: boolean }>;
}

export function MapAlbumModal({
  isOpen,
  onClose,
  savedMaps,
  onSelectMap,
  onDeleteMap,
  onGenerateNew,
  albumFilter,
  setAlbumFilter,
  MapPreviewRenderer
}: MapAlbumModalProps) {
  if (!isOpen) return null;

  const filteredMaps = savedMaps.filter(map => {
    if (albumFilter === '2-4') return map.playerCount >= 2 && map.playerCount <= 4;
    if (albumFilter === '5') return map.playerCount === 5;
    if (albumFilter === '6') return map.playerCount === 6;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="w-full max-w-4xl max-h-[90vh] bg-stone-50 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
      >
        <div className="p-4 sm:p-6 pb-4 flex justify-between items-center border-b border-stone-200 bg-white">
          <h2 className="text-lg sm:text-2xl font-serif font-black italic text-stone-800">地图收藏册</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex bg-stone-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setAlbumFilter('2-4')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${albumFilter === '2-4' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
              >
                2-4人
              </button>
              <button 
                onClick={() => setAlbumFilter('5')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${albumFilter === '5' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
              >
                5人
              </button>
              <button 
                onClick={() => setAlbumFilter('6')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${albumFilter === '6' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
              >
                6人
              </button>
            </div>
            
            <button 
              onClick={() => {
                onClose();
                onGenerateNew();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
            >
              ✨ 随机生成新地图
            </button>
          </div>

          {filteredMaps.length === 0 ? (
            <div className="py-20 text-center text-stone-400">
              <div className="text-4xl mb-4 opacity-50">🗺️</div>
              <p className="text-sm font-bold tracking-widest uppercase">暂无相关收藏地图</p>
              <p className="text-xs mt-2 opacity-70">点击上方按钮生成并收藏</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredMaps.map(map => (
                <div key={map.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest">{map.name}</h3>
                    <p className="text-[10px] text-stone-400 mt-1">{map.date}</p>
                  </div>
                  
                  {/* Map Preview */}
                  <div className="bg-stone-100 aspect-video rounded-xl mb-4 flex-1 flex flex-col justify-center items-center overflow-hidden border border-stone-200 shadow-inner relative min-h-[160px]">
                     {MapPreviewRenderer && map.board ? (
                       <div className="absolute inset-0">
                         <MapPreviewRenderer board={map.board} isTopologyOnly={true} />
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                         <span className="text-4xl mb-2">{map.mapType === 'standard' ? '🌍' : '🏝️'}</span>
                         <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{map.mapType === 'standard' ? '标准大陆' : '群岛世界'}</span>
                       </div>
                     )}
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                     <button 
                        onClick={() => onDeleteMap(map.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="删除"
                     >
                       🗑️
                     </button>
                     <button 
                        onClick={() => onSelectMap(map)}
                        className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                     >
                        使用此地图
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
