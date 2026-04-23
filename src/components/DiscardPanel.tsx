import { useState, useEffect } from 'react';
import { ResourceType, Player } from '../types';
import { RESOURCE_COLORS, RESOURCE_NAMES } from '../constants';

interface DiscardPanelProps {
  player: Player;
  amount: number;
  onDiscard: (resources: ResourceType[]) => void;
}

export const DiscardPanel = ({ player, amount, onDiscard }: DiscardPanelProps) => {
  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    [ResourceType.Lumber]: 0,
    [ResourceType.Brick]: 0,
    [ResourceType.Wool]: 0,
    [ResourceType.Grain]: 0,
    [ResourceType.Ore]: 0,
  });

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleSelect = (res: ResourceType, change: number) => {
    const current = selected[res];
    const max = player.resources[res];
    const newAmount = Math.max(0, Math.min(max, current + change));
    
    if (totalSelected - current + newAmount <= amount) {
      setSelected(prev => ({ ...prev, [res]: newAmount }));
    }
  };

  const handleDiscard = () => {
    const toDiscard = Object.entries(selected).flatMap(([res, count]) => Array(count).fill(res as ResourceType));
    onDiscard(toDiscard);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">弃牌阶段 ({totalSelected}/{amount})</h4>
      <div className="space-y-2 mb-4">
        {Object.values(ResourceType).map(res => (
          <div key={res} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
              <span className="text-xs font-bold">{RESOURCE_NAMES[res]} ({player.resources[res]})</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleSelect(res, -1)}
                className="w-6 h-6 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-stone-100"
              >
                -
              </button>
              <span className="font-mono text-xs w-4 text-center">{selected[res]}</span>
              <button 
                onClick={() => handleSelect(res, 1)}
                className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <button 
        onClick={handleDiscard}
        disabled={totalSelected !== amount}
        className="w-full bg-red-500 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        确认弃牌
      </button>
    </div>
  );
};
