import { useState } from 'react';
import { ResourceType } from '../types';
import { RESOURCE_COLORS, RESOURCE_NAMES } from '../constants';

interface GoldSelectionPanelProps {
  bankResources: Record<ResourceType, number>;
  amount: number;
  onSelect: (resources: Record<ResourceType, number>) => void;
}

export const GoldSelectionPanel = ({ bankResources, amount, onSelect }: GoldSelectionPanelProps) => {
  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    [ResourceType.Lumber]: 0,
    [ResourceType.Brick]: 0,
    [ResourceType.Wool]: 0,
    [ResourceType.Grain]: 0,
    [ResourceType.Ore]: 0,
  });

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleIncrement = (res: ResourceType) => {
    if (totalSelected < amount && bankResources[res] > selected[res]) {
      setSelected(prev => ({ ...prev, [res]: prev[res] + 1 }));
    }
  };

  const handleDecrement = (res: ResourceType) => {
    if (selected[res] > 0) {
      setSelected(prev => ({ ...prev, [res]: prev[res] - 1 }));
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">选择 {amount} 张黄金资源 ({totalSelected}/{amount})</h4>
      <div className="space-y-2 mb-4">
        {Object.entries(bankResources).map(([res, count]) => {
          const resourceType = res as ResourceType;
          if (count === 0) return null;
          return (
            <div key={res} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: RESOURCE_COLORS[resourceType] }} />
                <span className="font-bold text-[10px]">{RESOURCE_NAMES[resourceType]}</span>
                <span className="text-[10px] opacity-40">({count})</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDecrement(resourceType)}
                  disabled={selected[resourceType] === 0}
                  className="w-6 h-6 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="font-mono text-xs w-4 text-center">{selected[resourceType]}</span>
                <button 
                  onClick={() => handleIncrement(resourceType)}
                  disabled={totalSelected >= amount || selected[resourceType] >= count}
                  className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button 
        onClick={() => onSelect(selected)}
        disabled={totalSelected !== amount}
        className="w-full bg-black text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        确认领取
      </button>
    </div>
  );
};
