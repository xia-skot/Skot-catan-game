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
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 opacity-10"></div>
          <Crown size={64} className="mx-auto mb-4 text-yellow-300 drop-shadow-lg" />
          <h2 className="text-4xl font-black tracking-tight mb-2">GAME OVER</h2>
          <p className="text-xl font-medium opacity-90">Winner: {winner.name}</p>
        </div>

        <div className="p-8 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-4 pl-4">Player</th>
                <th className="pb-4 text-center font-bold text-black" title="Total Score">Total</th>
                <th className="pb-4 text-center" title="Settlements (1pt)">
                  <div className="flex flex-col items-center gap-1">
                    <Home size={16} />
                    <span>Settlements</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Cities (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Building2 size={16} />
                    <span>Cities</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="VP Cards (1pt)">
                  <div className="flex flex-col items-center gap-1">
                    <BookOpen size={16} />
                    <span>VP Cards</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Longest Road (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Map size={16} />
                    <span>Road</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Largest Army (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <Sword size={16} />
                    <span>Army</span>
                  </div>
                </th>
                <th className="pb-4 text-center" title="Island Bonus (2pts)">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">🏝️</span>
                    <span>Island</span>
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
                  <tr key={p.id} className={`border-b border-black/5 last:border-0 ${index === 0 ? 'bg-yellow-50/50' : ''}`}>
                    <td className="py-4 pl-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-black/10 shadow-sm flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: p.color }}>
                        {/* Use contrasting text color */}
                        <span style={{ color: p.color === '#FFFFFF' ? '#000' : '#FFF' }}>{index + 1}</span>
                      </div>
                      <span className={`font-bold ${index === 0 ? 'text-orange-600' : 'text-gray-700'}`}>{p.name}</span>
                      {index === 0 && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                    </td>
                    <td className="py-4 text-center font-black text-xl text-orange-600">{totalScore}</td>
                    <td className="py-4 text-center text-gray-600 font-mono">{settlementsScore}</td>
                    <td className="py-4 text-center text-gray-600 font-mono">{citiesScore}</td>
                    <td className="py-4 text-center text-gray-600 font-mono">{totalVPCards}</td>
                    <td className="py-4 text-center">
                      {hasLongestRoad ? <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">+2</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="py-4 text-center">
                      {hasLargestArmy ? <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full">+2</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="py-4 text-center font-mono text-blue-600 font-bold">
                      {islandBonus > 0 ? <span className="bg-blue-100 px-2 py-1 rounded-full text-xs">+{islandBonus}</span> : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-6 flex justify-end gap-4 border-t border-black/5">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white border border-black/10 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Trophy size={18} />
            New Game
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
