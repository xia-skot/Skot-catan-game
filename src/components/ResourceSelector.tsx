import { ResourceType } from '../types';
import { RESOURCE_COLORS, RESOURCE_NAMES } from '../constants';

interface ResourceSelectorProps {
  onSelect: (resource: ResourceType | null) => void;
  selected: ResourceType | null;
  title: string;
}

export const ResourceSelector = ({ onSelect, selected, title }: ResourceSelectorProps) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-indigo-50/50">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center text-slate-400">{title}</h4>
      <div className="grid grid-cols-5 gap-3 mb-2">
        {Object.values(ResourceType).map(res => (
          <button
            key={res}
            onClick={() => onSelect(res)}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${selected === res ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-600'}`}
          >
            <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
          </button>
        ))}
      </div>
    </div>
  );
};
