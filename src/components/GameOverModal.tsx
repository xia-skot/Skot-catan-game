import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Home, Map as MapIcon } from 'lucide-react';
import { GameState, DevCardType } from '../types';

interface GameOverModalProps {
  gameState: GameState;
  onReturnToLobby: () => void;
  onReturnToMap: () => void;
  maxWidth?: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onReturnToLobby, onReturnToMap, maxWidth }) => {
  const sortedPlayers = gameState ? [...gameState.players].sort((a, b) => b.victoryPoints - a.victoryPoints) : [];

  if (!gameState) return null;

  // Helper to calculate specific player stats
  const getPlayerStats = (playerId: number) => {
    const player = gameState.players.find(p => p.id === playerId);
    const settlements = gameState.settlements.filter(s => s.playerId === playerId && !s.isCity).length;
    const cities = gameState.settlements.filter(s => s.playerId === playerId && s.isCity).length;
    const roads = gameState.roads.filter(r => r.playerId === playerId).length;
    const ships = gameState.ships.filter(s => s.playerId === playerId).length;
    const knights = player?.knightsPlayed || 0;
    
    // Calculate islands landed (approximate by grouping hexes with settlements)
    const settledHexes = new Set<string>();
    gameState.settlements.filter(s => s.playerId === playerId).forEach(s => {
      s.hexIds.forEach(hid => settledHexes.add(hid));
    });
    
    // Real island count logic if archipelago
    let islandsLanded = 0;
    if (gameState.mapType === 'archipelago') {
      const landedIslandIds = new Set<number>();
      gameState.settlements.filter(s => s.playerId === playerId).forEach(s => {
        s.hexIds.forEach(hid => {
          const hex = gameState.board.find(h => h.id === hid);
          if (hex?.isIsland && hex.islandId) landedIslandIds.add(hex.islandId);
        });
      });
      islandsLanded = landedIslandIds.size;
    } else {
      islandsLanded = Math.ceil(settledHexes.size / 3); 
    }

    const vpBreakdown = [
      { label: '村庄', value: settlements, points: settlements },
      { label: '城市', value: cities, points: cities * 2 },
      { label: '最长道路', value: gameState.longestRoadPlayerId === playerId ? 1 : 0, points: gameState.longestRoadPlayerId === playerId ? 2 : 0 },
      { label: '最大骑士', value: gameState.largestArmyPlayerId === playerId ? 1 : 0, points: gameState.largestArmyPlayerId === playerId ? 2 : 0 },
      { label: '胜利点卡', value: player?.victoryPoints || 0, points: player?.victoryPoints || 0 }, // p.victoryPoints stores VP from cards
    ];

    // In archipelago, settled on more than 1 island gives bonus? Usually 1 VP for each new island
    // We'll trust the victoryPoints total from game state as truth
    const totalVp = (settlements * 1) + (cities * 2) + 
                  (gameState.longestRoadPlayerId === playerId ? 2 : 0) + 
                  (gameState.largestArmyPlayerId === playerId ? 2 : 0) + 
                  (player?.victoryPoints || 0);

    return { settlements, cities, roads, ships, knights, islandsLanded, vpBreakdown, totalVp };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 lg:p-8 bg-stone-500/10 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full rounded-[2rem] lg:rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col relative border border-white/50"
        style={{ maxWidth: maxWidth ? `${Math.min(maxWidth, 800)}px` : '48rem' }}
      >
        <div className="p-2 lg:p-4 text-center bg-stone-50 border-b border-black/5 shrink-0 relative overflow-hidden flex items-center justify-center gap-3">
          <Trophy className="absolute -right-4 -top-4 w-24 h-24 text-black/[0.02] -rotate-12 pointer-events-none" />
          
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg rotate-12 ring-2 ring-yellow-400/20">
            <Trophy size={18} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-lg lg:text-2xl font-serif font-black italic tracking-tighter text-slate-900 leading-none">克坦岛盛大闭幕</h2>
            <p className="text-[7px] lg:text-[9px] opacity-40 uppercase tracking-[0.2em] font-bold">The Golden Victory of Catan</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 lg:p-4 no-scrollbar space-y-1.5 lg:space-y-2">
          {sortedPlayers.map((p, index) => {
            const stats = getPlayerStats(p.id);
            const isWinner = p.id === gameState.winnerId;
            
            return (
              <div 
                key={p.id} 
                className={`relative p-2 lg:p-3.5 rounded-[1rem] lg:rounded-[1.5rem] border transition-all ${isWinner ? 'bg-black text-white border-black shadow-lg z-10' : 'bg-stone-50 border-black/5'}`}
              >
                {isWinner && (
                  <div className="absolute -top-2 -right-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[6px] lg:text-[8px] shadow-lg rotate-6">
                    🏆 冠军
                  </div>
                )}

                <div className="grid grid-cols-[40px_1fr_auto_60px] lg:grid-cols-[60px_1fr_auto_100px] items-center gap-2 lg:gap-4">
                  {/* Rank & Color */}
                  <div className="flex flex-col items-center shrink-0 -mt-2 lg:-mt-3">
                    <span className={`text-xl lg:text-3xl font-serif italic font-black leading-none ${isWinner ? 'text-yellow-400' : 'opacity-20'}`}>
                      #{index + 1}
                    </span>
                    <div className="w-3 h-3 lg:w-4.5 lg:h-4.5 rounded-full border-2 border-white shadow-sm -mt-2 lg:-mt-2.5 z-10" style={{ backgroundColor: p.color }} />
                  </div>

                  {/* Player Name & Breakdown */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <h3 className="font-black uppercase tracking-tight text-xs lg:text-lg truncate leading-tight">{p.name}</h3>
                    <div className="flex flex-wrap gap-x-2 gap-y-0 mt-0.5">
                      {stats.vpBreakdown.map((item, i) => (
                        item.points > 0 && (
                          <div key={i} className="flex items-center gap-1 opacity-60">
                            <span className="text-[7px] lg:text-[9px] font-bold uppercase">{item.label}</span>
                            <span className="text-[8px] lg:text-[10px] font-black">+{item.points}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats - Grid with fixed-width columns for alignment */}
                  <div className="hidden sm:grid grid-cols-6 gap-1 lg:gap-4 px-2 lg:px-4 border-l border-r border-black/5 items-center justify-items-center">
                    <StatMini label="村" value={stats.settlements} isWinner={isWinner} />
                    <StatMini label="城" value={stats.cities} isWinner={isWinner} />
                    <StatMini label="路" value={stats.roads} isWinner={isWinner} />
                    <StatMini label="船" value={stats.ships} isWinner={isWinner} />
                    <StatMini label="骑" value={stats.knights} isWinner={isWinner} />
                    <StatMini label="探" value={stats.islandsLanded} isWinner={isWinner} />
                  </div>
                  
                  {/* Total Score */}
                  <div className="flex items-baseline justify-end gap-0.5 lg:gap-1">
                    <span className="text-xl lg:text-5xl font-serif font-black italic tabular-nums leading-none">{stats.totalVp}</span>
                    <span className="text-[7px] lg:text-[11px] uppercase tracking-widest font-black opacity-40">分</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 lg:p-6 bg-stone-50 border-t border-black/5 flex gap-2 shrink-0">
          <button 
            onClick={onReturnToMap}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black border border-black/10 px-4 py-3 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[8px] lg:text-[10px] hover:bg-stone-100 transition-all shadow-sm active:scale-95"
          >
            <MapIcon size={14} />
            详情
          </button>
          <button 
            onClick={onReturnToLobby}
            className="flex-[1.5] flex items-center justify-center gap-1.5 bg-black text-white px-4 py-3 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[8px] lg:text-[10px] hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
          >
            <Home size={14} />
            游戏大厅
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatMini = ({ label, value, isWinner }: { label: string, value: number, isWinner: boolean }) => (
  <div className="flex flex-col items-center min-w-[24px] lg:min-w-[32px]">
    <span className={`text-[10px] lg:text-[12px] uppercase font-bold ${isWinner ? 'text-white/40' : 'text-stone-400'}`}>{label}</span>
    <span className="text-[12px] lg:text-[16px] font-black italic">{value}</span>
  </div>
);

const StatBox = ({ label, value, color, isWinner }: { label: string, value: number, color: string, isWinner: boolean }) => (
  <div className={`p-2 lg:p-4 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center border ${isWinner ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
    <span className={`text-[7px] lg:text-[9px] uppercase tracking-tighter mb-0.5 lg:mb-1 font-bold ${isWinner ? 'text-white/40' : 'text-stone-400'}`}>{label}</span>
    <div className="flex items-baseline gap-0.5 lg:gap-1">
      <span className="text-sm lg:text-lg font-serif font-black italic">{value}</span>
      <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full" style={{ backgroundColor: color }} />
    </div>
  </div>
);

