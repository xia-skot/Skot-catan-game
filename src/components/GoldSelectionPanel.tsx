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
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-indigo-50/50">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center text-slate-400">选择 {amount} 张黄金资源 ({totalSelected}/{amount})</h4>
      <div className="space-y-2 mb-6">
        {Object.entries(bankResources).map(([res, count]) => {
          const resourceType = res as ResourceType;
          if (count === 0) return null;
          return (
            <div key={res} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: RESOURCE_COLORS[resourceType] }} />
                <span className="font-bold text-xs text-slate-700">{RESOURCE_NAMES[resourceType]} <span className="opacity-40 ml-1">({count})</span></span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDecrement(resourceType)}
                  disabled={selected[resourceType] === 0}
                  className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95 text-slate-400"
                >
                  -
                </button>
                <span className="font-mono text-sm w-5 text-center font-bold text-slate-600">{selected[resourceType]}</span>
                <button 
                  onClick={() => handleIncrement(resourceType)}
                  disabled={totalSelected >= amount || selected[resourceType] >= count}
                  className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
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
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        确认领取
      </button>
    </div>
  );
};
