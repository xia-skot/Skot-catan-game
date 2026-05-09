import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, UploadCloud } from 'lucide-react';

interface SaveMapConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  isAdmin: boolean;
  onSave: (name: string, isOfficial: boolean) => void;
}

export function SaveMapConfirmModal({ isOpen, onClose, defaultName, isAdmin, onSave }: SaveMapConfirmModalProps) {
  const [name, setName] = useState(defaultName);
  const [isOfficial, setIsOfficial] = useState(false);

  // Synchronize state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setIsOfficial(false);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">
          <Save size={20} className="text-indigo-600" /> 保存地图
        </h2>

        <div className="space-y-4">
          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
              地图名称
            </label>
            <input 
              type="text" 
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="为这张地图起个名字..."
              className="w-full bg-stone-50 border border-stone-100 px-4 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm"
              maxLength={30}
            />
          </div>

          {isAdmin && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-2">
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <UploadCloud size={16} className="text-amber-600" />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                      <span className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded text-[9px] uppercase tracking-widest font-black">Admin</span>
                      存为官方地图
                   </h3>
                   <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                     官方地图将永久保存在云端，所有玩家都可以看到并使用此地图。
                   </p>
                   <button 
                     type="button"
                     className="mt-2 flex items-center gap-2 cursor-pointer group w-fit select-none outline-none border-none bg-transparent"
                     onClick={() => setIsOfficial(!isOfficial)}
                   >
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isOfficial ? 'bg-amber-500 border-amber-500 text-white scale-110' : 'border-stone-300 bg-white group-hover:border-amber-400'}`}>
                       {isOfficial && <span className="text-xs font-bold font-sans">✓</span>}
                     </div>
                     <span className="text-xs font-bold text-stone-700">保存到官方云图册</span>
                   </button>
                 </div>
               </div>
            </div>
          )}

          <button 
            onClick={() => {
              if (!name.trim()) return;
              onSave(name.trim(), isOfficial);
            }}
            disabled={!name.trim()}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex items-center justify-center gap-2"
          >
            确认保存
          </button>
        </div>
      </motion.div>
    </div>
  );
}
