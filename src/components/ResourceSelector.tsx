import React from 'react';
import { ResourceType } from '../types';
import { RESOURCE_COLORS } from '../constants';

interface ResourceSelectorProps {
  title: string;
  selected: ResourceType | null;
  onSelect: (type: ResourceType) => void;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({ title, selected, onSelect }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">{title}</h4>
      <div className="grid grid-cols-5 gap-2">
        {Object.values(ResourceType).map(res => (
          <button
            key={res}
            onClick={() => onSelect(res)}
            className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${selected === res ? 'border-black bg-stone-50 scale-105 shadow-md' : 'border-black/5 hover:border-black/20 hover:bg-stone-50'}`}
          >
            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
          </button>
        ))}
      </div>
    </div>
  );
};
