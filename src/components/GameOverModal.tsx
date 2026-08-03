import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Home, Map as MapIcon, Award, Castle, Waypoints, Swords, Flag, User, X } from 'lucide-react';
import { GameState, DevCardType } from '../types';

const CircleOne = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l2 -2v12" />
  </svg>
);

interface GameOverModalProps {
  gameState: GameState;
  onReturnToLobby: () => void;
  onReturnToMap: () => void;
  maxWidth?: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onReturnToLobby, onReturnToMap, maxWidth }) => {
  if (!gameState) return null;

  // Helper to calculate specific player stats
  const getPlayerStats = (playerId: number) => {
    const player = gameState.players.find(p => p.id === playerId);
    const settlements = gameState.settlements.filter(s => s.playerId === playerId && !s.isCity).length;
    const cities = gameState.settlements.filter(s => s.playerId === playerId && s.isCity).length;
    const roads = gameState.roads.filter(r => r.playerId === playerId).length;
    const ships = gameState.ships.filter(s => s.playerId === playerId).length;
    
    const totalVpCards = (player?.devCards.filter(c => c === DevCardType.VictoryPoint).length || 0) + 
                        ((player?.devCardsBoughtThisTurn || []).filter(c => c === DevCardType.VictoryPoint).length || 0) +
                        (player?.playedDevCards?.filter(c => c === DevCardType.VictoryPoint).length || 0);

    const vpBreakdown = [
      { id: 'settlements', label: '村庄', icon: Home, value: settlements, points: settlements },
      { id: 'cities', label: '城市', icon: Castle, value: cities, points: cities * 2 },
      { id: 'roads', label: '最长道路', icon: Waypoints, value: gameState.longestRoadPlayerId === playerId ? 1 : 0, points: gameState.longestRoadPlayerId === playerId ? 2 : 0 },
      { id: 'army', label: '最多骑士', icon: Swords, value: gameState.largestArmyPlayerId === playerId ? 1 : 0, points: gameState.largestArmyPlayerId === playerId ? 2 : 0 },
      { id: 'cards', label: '胜利点卡', icon: CircleOne, value: totalVpCards, points: totalVpCards },
      { id: 'islands', label: '登岛奖励', icon: Flag, value: player?.islandBonusPoints || 0, points: player?.islandBonusPoints || 0 },
    ];

    const totalVp = vpBreakdown.reduce((sum, item) => sum + item.points, 0);

    return { settlements, cities, roads, ships, vpBreakdown, totalVp };
  };

  const playersWithStats = gameState.players.map(p => ({
    ...p,
    stats: getPlayerStats(p.id)
  }));

  const sortedPlayers = [...playersWithStats].sort((a, b) => b.stats.totalVp - a.stats.totalVp);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-[120] flex flex-col bg-stone-50 overflow-hidden w-full h-full"
    >
      {/* Header - More Compact */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 text-center bg-white border-b border-black/5 shrink-0 relative overflow-hidden flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md rotate-3 ring-2 ring-yellow-400/10">
            <Trophy size={16} className="text-white drop-shadow-sm sm:w-4 sm:h-4" />
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-xl font-serif font-black italic tracking-tighter text-slate-900 leading-none">卡坦岛盛大闭幕</h2>
            <p className="text-[7px] sm:text-[9px] opacity-40 uppercase tracking-[0.2em] font-bold mt-0.5">The Golden Victory of Catan</p>
          </div>
        </div>

        <button 
          onClick={onReturnToMap}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Vertical & Horizontal Rankings Container */}
      <div className="flex-1 overflow-auto bg-white no-scrollbar relative z-10 px-2 pb-2 sm:px-4 sm:pb-4">
        <div className="min-w-max flex flex-col gap-2">
          {/* Header Row */}
          {sortedPlayers.length > 0 && (
            <div className="sticky top-0 z-40 flex items-end mb-1 border-b border-black/5 pb-2 pt-2 sm:pt-4 bg-white">
              <div className="sticky left-0 z-50 w-28 sm:w-36 lg:w-48 shrink-0 bg-white" />
              <div className="flex items-center gap-3 sm:gap-5 px-3 sm:px-4 bg-white flex-1">
                {sortedPlayers[0].stats.vpBreakdown.map((item) => (
                  <div key={item.id} className="flex flex-col items-center gap-1 min-w-[32px] sm:min-w-[40px]">
                    <item.icon size={14} className="sm:w-4 sm:h-4 text-stone-400" />
                    <span className="text-[8px] sm:text-[9px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="sticky right-0 z-50 w-16 sm:w-20 shrink-0 bg-white" />
            </div>
          )}
          {sortedPlayers.map((player, index) => {
            const isWinner = index === 0;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative flex items-stretch transition-all ${
                  isWinner 
                    ? 'bg-amber-50/80 rounded-xl shadow-sm' 
                    : 'border-b border-black/5 last:border-b-0 hover:bg-stone-50'
                }`}
              >
                {/* Left Section: Rank & Player Info (Sticky) */}
                <div className={`sticky left-0 z-20 flex items-center gap-3 shrink-0 w-28 sm:w-36 lg:w-48 py-2 px-2 sm:px-3 transition-colors ${
                  isWinner ? 'bg-amber-50/90 rounded-l-xl' : 'bg-white group-hover:bg-stone-50'
                }`}>
                  <div className="relative flex-shrink-0">
                    <div 
                      className={`flex items-center justify-center text-white font-serif font-black italic shadow-sm relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg text-xs sm:text-sm`}
                      style={{ backgroundColor: player.color }}
                    >
                      #{index + 1}
                    </div>
                    {isWinner && (
                      <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] shadow-sm border border-white z-20">
                        👑
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight">
                      {player.name}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Horizontal Score Breakdown */}
                <div className="flex items-center gap-3 sm:gap-5 px-3 sm:px-4 py-2 sm:py-3 bg-transparent flex-1">
                  {player.stats.vpBreakdown.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex flex-col items-center justify-center min-w-[32px] sm:min-w-[40px] transition-opacity ${
                        item.points > 0 
                        ? 'opacity-100' 
                        : 'opacity-30 grayscale'
                      }`}
                    >
                      <span className={`text-[12px] sm:text-[14px] font-serif font-black italic leading-none ${item.points > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                        {item.points > 0 ? `+${item.points}` : '0'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Section: Total Score (Sticky) */}
                <div className={`sticky right-0 z-20 flex items-center justify-end w-16 sm:w-20 shrink-0 py-2 px-2 sm:px-4 transition-colors ${
                  isWinner ? 'bg-amber-50/90 rounded-r-xl' : 'bg-white group-hover:bg-stone-50'
                }`}>
                  <span className={`text-xl sm:text-2xl font-serif font-black italic tabular-nums leading-none ${isWinner ? 'text-amber-600' : 'text-slate-800'}`}>
                    {player.stats.totalVp}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
