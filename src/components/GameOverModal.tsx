import React from 'react';
import { GameState, Player, DevCardType } from '../types';
import { motion } from 'motion/react';
import { Trophy, Crown, Map, Sword, Home, Building2, BookOpen } from 'lucide-react';

interface GameOverModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onClose }) => {
  const players = [...gameState.players].sort((a, b) => {
    const scoreA = calculateTotalScore(a, gameState);
    const scoreB = calculateTotalScore(b, gameState);
    return scoreB - scoreA;
  });

  const winner = players[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full scale-150 animate-pulse"></div>
          <Crown size={80} className="mx-auto mb-6 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
          <h2 className="text-5xl font-serif font-black italic tracking-tighter mb-3">胜利终局</h2>
          <p className="text-xl font-medium text-slate-400">冠军得主: <span className="text-white">{winner.name}</span></p>
        </div>

        <div className="p-10 overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                <th className="pb-4 pl-4 font-black">玩家</th>
                <th className="pb-4 text-center text-slate-900" title="Total Score">总分</th>
                <th className="pb-4 text-center" title="Settlements (1pt)">
                  <div className="flex flex-col items-center gap-1">
                    <Home size={16} className="opacity-40" />
                    <span>村庄</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Cities (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Building2 size={16} className="opacity-40" />
                    <span>城市</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="VP Cards (1pt)">
                  <div className="flex flex-col items-center gap-1">
                    <BookOpen size={16} className="opacity-40" />
                    <span>发展卡</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Longest Road (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Map size={16} className="opacity-40" />
                    <span>道路</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Largest Army (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Sword size={16} className="opacity-40" />
                    <span>军队</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Island Bonus (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg opacity-40">🏝️</span>
                    <span>岛屿</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, index) => {
                const totalScore = calculateTotalScore(p, gameState);
                const settlementsScore = p.settlements; // 1 pt each
                const citiesScore = p.cities * 2; // 2 pts each
                const unplayedVPCards = p.devCards.filter(c => c === DevCardType.VictoryPoint).length;
                const playedVPCards = p.playedDevCards?.filter(c => c === DevCardType.VictoryPoint).length || 0;
                const totalVPCards = unplayedVPCards + playedVPCards;
                
                const hasLongestRoad = gameState.longestRoadPlayerId === p.id;
                const hasLargestArmy = gameState.largestArmyPlayerId === p.id;
                
                // Island Bonus = p.victoryPoints - (LR + LA + PlayedVP)
                // Note: p.victoryPoints includes Island Bonus, LR, LA, and Played VP.
                // It does NOT include unplayed VP cards.
                let islandBonus = p.victoryPoints;
                if (hasLongestRoad) islandBonus -= 2;
                if (hasLargestArmy) islandBonus -= 2;
                islandBonus -= playedVPCards;

                // Ensure non-negative (just in case)
                islandBonus = Math.max(0, islandBonus);

                return (
                  <tr key={p.id} className={`group transition-all ${index === 0 ? 'bg-indigo-50/50' : 'bg-slate-50/30'}`}>
                    <td className="py-5 pl-6 rounded-l-3xl border-y border-l border-transparent group-hover:border-slate-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl shadow-sm flex items-center justify-center font-black text-white text-xs" style={{ backgroundColor: p.color }}>
                        <span style={{ color: p.color === '#FFFFFF' ? '#000' : '#FFF' }}>{index + 1}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-base ${index === 0 ? 'text-indigo-600' : 'text-slate-800'}`}>{p.name}</span>
                        {index === 0 && <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">卡坦岛之王</span>}
                      </div>
                    </td>
                    <td className="py-5 text-center font-black text-2xl text-indigo-600 border-y border-transparent group-hover:border-slate-200">{totalScore}</td>
                    <td className="py-5 text-center text-slate-500 font-mono font-bold border-y border-transparent group-hover:border-slate-200">{settlementsScore}</td>
                    <td className="py-5 text-center text-slate-500 font-mono font-bold border-y border-transparent group-hover:border-slate-200">{citiesScore}</td>
                    <td className="py-5 text-center text-slate-500 font-mono font-bold border-y border-transparent group-hover:border-slate-200">{totalVPCards}</td>
                    <td className="py-5 text-center border-y border-transparent group-hover:border-slate-200">
                      {hasLongestRoad ? <span className="text-indigo-600 font-black text-[10px] bg-indigo-100 px-3 py-1.5 rounded-full">+2</span> : <span className="text-slate-200">-</span>}
                    </td>
                    <td className="py-5 text-center border-y border-transparent group-hover:border-slate-200">
                      {hasLargestArmy ? <span className="text-slate-600 font-black text-[10px] bg-slate-200 px-3 py-1.5 rounded-full">+2</span> : <span className="text-slate-200">-</span>}
                    </td>
                    <td className="py-5 text-center rounded-r-3xl border-y border-r border-transparent group-hover:border-slate-200 font-mono text-indigo-600 font-bold">
                      {islandBonus > 0 ? <span className="bg-indigo-100/50 px-3 py-1.5 rounded-full text-[10px] font-black">+{islandBonus}</span> : <span className="text-slate-200">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 p-8 flex justify-end gap-6 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            返回地图
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98]"
          >
            <Trophy size={18} />
            开启新对局
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function calculateTotalScore(p: Player, gameState: GameState): number {
  const unplayedVPCards = p.devCards.filter(c => c === DevCardType.VictoryPoint).length;
  // p.victoryPoints includes Island Bonus, Longest Road, Largest Army, and Played VP cards.
  // Base score = Settlements + Cities * 2.
  return (p.settlements * 1) + (p.cities * 2) + p.victoryPoints + unplayedVPCards;
}
