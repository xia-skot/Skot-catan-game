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
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-indigo-50/50">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center text-slate-400">弃牌阶段 ({totalSelected}/{amount})</h4>
      <div className="space-y-2 mb-6">
        {Object.values(ResourceType).map(res => (
          <div key={res} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
              <span className="text-xs font-bold text-slate-700">{RESOURCE_NAMES[res]} <span className="opacity-40 ml-1">({player.resources[res]})</span></span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleSelect(res, -1)}
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm active:scale-95 text-slate-400 disabled:opacity-30"
              >
                -
              </button>
              <span className="font-mono text-sm w-5 text-center font-bold text-slate-600">{selected[res]}</span>
              <button 
                onClick={() => handleSelect(res, 1)}
                className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-30"
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
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale active:scale-[0.98]"
      >
        确认弃牌
      </button>
    </div>
  );
};
