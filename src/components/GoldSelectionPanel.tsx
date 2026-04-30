import React, { useState } from 'react';
import { ResourceType } from '../types';
import { RESOURCE_NAMES } from '../constants';
import { RESOURCE_ICONS } from '../images';

interface GoldSelectionPanelProps {
  bankResources: Record<ResourceType, number>;
  amount: number;
  onSelect: (selected: Record<ResourceType, number>) => void;
}

export const GoldSelectionPanel: React.FC<GoldSelectionPanelProps> = ({ bankResources, amount, onSelect }) => {
  const [selections, setSelections] = useState<Record<ResourceType, number>>({
    [ResourceType.Lumber]: 0,
    [ResourceType.Brick]: 0,
    [ResourceType.Wool]: 0,
    [ResourceType.Grain]: 0,
    [ResourceType.Ore]: 0,
  });

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);

  const handleAdjust = (res: ResourceType, delta: number) => {
    const newVal = selections[res] + delta;
    if (newVal >= 0 && (delta < 0 || totalSelected < amount) && (delta < 0 || bankResources[res] > selections[res])) {
      setSelections(prev => ({ ...prev, [res]: newVal }));
    }
  };

  return (
    <div className="bg-white p-4 lg:p-6 rounded-[2rem] border border-black/15 shadow-2xl">
      <h3 className="text-lg lg:text-xl font-serif font-black italic text-orange-600 mb-1 lg:mb-2 text-center">淘金热！</h3>
      <p className="text-[9px] lg:text-[10px] text-stone-500 uppercase tracking-widest mb-4 lg:mb-6 text-center">请选择 {amount} 份资源 (已选 {totalSelected}/{amount})</p>
      
      <div className="space-y-1.5 lg:space-y-2 mb-4 lg:mb-6">
        {Object.values(ResourceType).map(res => (
          <div key={res} className="flex items-center justify-between p-2 lg:p-3 rounded-xl border border-black/5 bg-stone-50/50">
            <div className="flex items-center gap-2 lg:gap-3">
              <img src={RESOURCE_ICONS[res]} className="w-5 h-5 lg:w-6 lg:h-6 object-contain" alt={RESOURCE_NAMES[res]} referrerPolicy="no-referrer" />
              <span className="text-[10px] lg:text-xs font-bold font-serif">{RESOURCE_NAMES[res]}</span>
              <span className="text-[8px] lg:text-[9px] opacity-30 font-mono">库存: {bankResources[res]}</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              <button 
                onClick={() => handleAdjust(res, -1)}
                disabled={selections[res] <= 0}
                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-stone-100 disabled:opacity-20 transition-all font-bold text-[10px] lg:text-base"
              >
                -
              </button>
              <span className="w-3 lg:w-4 text-center font-mono font-bold text-xs lg:text-sm">{selections[res]}</span>
              <button 
                onClick={() => handleAdjust(res, 1)}
                disabled={totalSelected >= amount || selections[res] >= bankResources[res]}
                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-20 transition-all font-bold text-[10px] lg:text-base"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        disabled={totalSelected !== amount}
        onClick={() => onSelect(selections)}
        className="w-full py-3 lg:py-4 bg-orange-600 text-white rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[11px] shadow-xl shadow-orange-200 hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        确认领取资源
      </button>
    </div>
  );
};
