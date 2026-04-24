import React from 'react';
import { GameState, Player, DevCardType } from '../types';
import { motion } from 'motion/react';
import { Trophy, Crown, Map, Sword, Home, Building2, BookOpen } from 'lucide-react';

interface GameOverModalProps {
  gameState: GameState;
  onReturnToLobby: () => void;
  onReturnToMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onReturnToLobby, onReturnToMap }) => {
  const players = [...gameState.players].sort((a, b) => {
    const scoreA = calculateTotalScore(a, gameState);
    const scoreB = calculateTotalScore(b, gameState);
    return scoreB - scoreA;
  });

  const winner = players[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 lg:p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] lg:rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[90vh]"
      >
        <div className="bg-slate-900 p-6 lg:p-10 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-indigo-500/20 to-transparent"></div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Crown size={48} className="mx-auto mb-4 text-yellow-400 lg:hidden" />
            <Crown size={80} className="mx-auto mb-6 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)] hidden lg:block" />
            <h2 className="text-3xl lg:text-5xl font-serif font-black italic tracking-tighter mb-2 lg:mb-3 uppercase">胜利终局</h2>
            <p className="text-sm lg:text-xl font-medium text-slate-400 uppercase tracking-widest">
              冠军得主: <span className="text-white">{winner.name}</span>
            </p>
          </motion.div>
        </div>

        <div className="p-4 lg:p-10 overflow-y-auto flex-1">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
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
                  const settlementsScore = p.settlements;
                  const citiesScore = p.cities * 2;
                  const unplayedVPCards = p.devCards.filter(c => c === DevCardType.VictoryPoint).length;
                  const vpBoughtThisTurn = (p.devCardsBoughtThisTurn || []).filter(c => c === DevCardType.VictoryPoint).length;
                  const playedVPCards = p.playedDevCards?.filter(c => c === DevCardType.VictoryPoint).length || 0;
                  const totalVPCards = unplayedVPCards + playedVPCards + vpBoughtThisTurn;
                  const hasLongestRoad = gameState.longestRoadPlayerId === p.id;
                  const hasLargestArmy = gameState.largestArmyPlayerId === p.id;

                  let islandBonus = p.victoryPoints;
                  if (hasLongestRoad) islandBonus -= 2;
                  if (hasLargestArmy) islandBonus -= 2;
                  islandBonus -= playedVPCards;
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

          {/* Mobile List View */}
          <div className="lg:hidden space-y-4">
            {players.map((p, index) => {
              const totalScore = calculateTotalScore(p, gameState);
              const playedVPCards = p.playedDevCards?.filter(c => c === DevCardType.VictoryPoint).length || 0;
              const hasLongestRoad = gameState.longestRoadPlayerId === p.id;
              const hasLargestArmy = gameState.largestArmyPlayerId === p.id;
              let islandBonus = p.victoryPoints;
              if (hasLongestRoad) islandBonus -= 2;
              if (hasLargestArmy) islandBonus -= 2;
              islandBonus -= playedVPCards;
              islandBonus = Math.max(0, islandBonus);

              return (
                <div key={p.id} className={`p-4 rounded-3xl border ${index === 0 ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[10px] shadow-sm shrink-0" style={{ backgroundColor: p.color }}>
                        <span style={{ color: p.color === '#FFFFFF' ? '#000' : '#FFF' }}>{index + 1}</span>
                      </div>
                      <div>
                        <p className={`font-black text-sm leading-none ${index === 0 ? 'text-indigo-600' : 'text-slate-800'}`}>{p.name}</p>
                        {index === 0 && <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1">THE KING</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">总分</p>
                      <p className="text-2xl font-black text-indigo-600 leading-none">{totalScore}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/60 p-2 rounded-xl flex flex-col items-center">
                       <Home size={12} className="opacity-20 mb-1" />
                       <span className="text-[10px] font-bold text-slate-500">{p.settlements}村庄</span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl flex flex-col items-center">
                       <Building2 size={12} className="opacity-20 mb-1" />
                       <span className="text-[10px] font-bold text-slate-500">{p.cities}城市</span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl flex flex-col items-center">
                       <span className="bg-indigo-100/50 text-indigo-600 px-1.5 rounded-full text-[8px] font-black mb-1">{islandBonus > 0 ? `+${islandBonus}` : '0'}</span>
                       <span className="text-[10px] font-bold text-slate-500">岛屿</span>
                    </div>
                    {hasLongestRoad && (
                      <div className="bg-indigo-600 p-2 rounded-xl flex flex-col items-center text-white col-span-1">
                        <Map size={12} className="mb-1" />
                        <span className="text-[8px] font-black uppercase">最长路</span>
                      </div>
                    )}
                    {hasLargestArmy && (
                      <div className="bg-slate-800 p-2 rounded-xl flex flex-col items-center text-white col-span-1">
                        <Sword size={12} className="mb-1" />
                        <span className="text-[8px] font-black uppercase">最大军</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 p-4 lg:p-8 flex flex-col lg:flex-row justify-end gap-3 lg:gap-6 border-t border-slate-100 shrink-0">
          <button 
            onClick={onReturnToMap}
            className="w-full lg:w-auto px-8 py-3 lg:py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            返回地图
          </button>
          <button 
            onClick={onReturnToLobby}
            className="w-full lg:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98]"
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
  const vpBoughtThisTurn = (p.devCardsBoughtThisTurn || []).filter(c => c === DevCardType.VictoryPoint).length;
  // p.victoryPoints includes Island Bonus, Longest Road, Largest Army, and Played VP cards.
  // Base score = Settlements + Cities * 2.
  return (p.settlements * 1) + (p.cities * 2) + p.victoryPoints + unplayedVPCards + vpBoughtThisTurn;
}
