import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Home, Map as MapIcon } from 'lucide-react';
import { GameState } from '../types';

interface GameOverModalProps {
  gameState: GameState;
  onReturnToLobby: () => void;
  onReturnToMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onReturnToLobby, onReturnToMap }) => {
  const sortedPlayers = gameState ? [...gameState.players].sort((a, b) => b.victoryPoints - a.victoryPoints) : [];

  if (!gameState) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="p-6 sm:p-12 text-center bg-stone-50 shrink-0">
          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-yellow-400 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl rotate-12">
            <Trophy size={24} className="text-white sm:hidden" />
            <Trophy size={40} className="text-white hidden sm:block" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-black italic tracking-tighter mb-1 sm:mb-2 text-slate-900">游戏结束</h2>
          <p className="text-[10px] opacity-40 uppercase tracking-[0.3em] font-bold">GAME OVER</p>
        </div>

        <div className="p-6 sm:p-12 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-3 sm:space-y-4">
            {sortedPlayers.map((p, index) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border ${p.id === gameState.winnerId ? 'bg-black text-white border-black shadow-xl ring-4 ring-yellow-400' : 'bg-stone-50 border-black/5'}`}
              >
                <div className="flex items-center gap-3 sm:gap-6">
                  <span className={`text-base sm:text-xl font-serif italic font-black ${p.id === gameState.winnerId ? 'text-yellow-400' : 'opacity-20'}`}>#{index + 1}</span>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-black uppercase tracking-tight text-sm sm:text-lg">{p.name} {p.id === gameState.winnerId && '👑'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-2xl font-serif font-black italic">{p.victoryPoints}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-40 ml-2 font-bold">VP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <button 
              onClick={onReturnToMap}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-stone-100 text-stone-600 px-4 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs hover:bg-stone-200 transition-all"
            >
              <MapIcon size={16} />
              返回地图
            </button>
            <button 
              onClick={onReturnToLobby}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-black text-white px-4 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs hover:bg-zinc-800 transition-all shadow-xl"
            >
              <Home size={16} />
              返回大厅
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
