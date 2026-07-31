import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Volume2, VolumeX, Music, BellRing, Sliders, Play, RotateCcw, Shield } from 'lucide-react';
import { audioService, SoundEqualizer, DEFAULT_EQUALIZER, SoundType } from '../audioService';
import { socketService } from '../socketService';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const SFX_ITEMS: { key: keyof SoundEqualizer; label: string; icon: string }[] = [
  { key: 'dice', label: '掷骰子音效', icon: '🎲' },
  { key: 'resource', label: '资源获取音效', icon: '🌾' },
  { key: 'pirate', label: '海盗/强盗音效', icon: '🏴‍☠️' },
  { key: 'click', label: '按钮点击音效', icon: '🔘' },
  { key: 'build', label: '建造结构音效', icon: '🏗️' },
  { key: 'bgm', label: '背景音乐', icon: '🎵' },
];

export function SoundSettingsModal({ isOpen, onClose, isAdmin = false }: SoundSettingsModalProps) {
  const [enabled, setEnabled] = useState(audioService.enabled);
  const [bgmVol, setBgmVol] = useState(Math.round(audioService.bgmVolume * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(audioService.sfxVolume * 100));
  const [equalizer, setEqualizer] = useState<SoundEqualizer>(audioService.sfxEqualizer);

  useEffect(() => {
    if (isOpen) {
      setEnabled(audioService.enabled);
      setBgmVol(Math.round(audioService.bgmVolume * 100));
      setSfxVol(Math.round(audioService.sfxVolume * 100));
      setEqualizer(audioService.sfxEqualizer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = () => {
    const nextEnabled = !enabled;
    audioService.enabled = nextEnabled;
    setEnabled(nextEnabled);
    if (nextEnabled) {
      audioService.play('click');
    }
  };

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBgmVol(val);
    audioService.bgmVolume = val / 100;
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSfxVol(val);
    audioService.sfxVolume = val / 100;
  };

  const handleSfxMouseUp = () => {
    audioService.play('click');
  };

  const handleEqChange = (key: keyof SoundEqualizer, val: number) => {
    const newEq = { ...equalizer, [key]: val };
    setEqualizer(newEq);
    audioService.setEqualizer(newEq);
    socketService.updateSoundSettings(newEq);

    const token = localStorage.getItem('catan_auth_token');
    if (token) {
      fetch('/api/admin/sound-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ soundSettings: newEq })
      }).catch(console.error);
    }
  };

  const handleResetEq = () => {
    const defaultEq = { ...DEFAULT_EQUALIZER };
    setEqualizer(defaultEq);
    audioService.setEqualizer(defaultEq);
    socketService.updateSoundSettings(defaultEq);

    const token = localStorage.getItem('catan_auth_token');
    if (token) {
      fetch('/api/admin/sound-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ soundSettings: defaultEq })
      }).catch(console.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`bg-white rounded-3xl p-6 sm:p-8 w-full shadow-2xl relative z-10 border border-stone-100 max-h-[90vh] overflow-y-auto ${
          isAdmin ? 'max-w-md' : 'max-w-sm'
        }`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors z-20"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">
          <BellRing size={20} className="text-indigo-600" /> 声音设置
          {isAdmin && (
            <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
              <Shield size={12} /> 管理员权限
            </span>
          )}
        </h2>

        <div className="space-y-6">
          {/* Main Switch */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-200 text-stone-400'}`}>
                {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-800">全部声音</h3>
                <p className="text-[10px] text-stone-400">开启或关闭游戏内所有音效</p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                enabled ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* BGM Slider */}
          <div className={`space-y-2 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5">
                <Music size={14} className="text-indigo-500" /> 背景音乐 (BGM)
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">{bgmVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bgmVol}
              onChange={handleBgmChange}
              disabled={!enabled}
              className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* SFX Slider */}
          <div className={`space-y-2 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5">
                <Volume2 size={14} className="text-indigo-500" /> 主音效音量 (SFX)
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={handleSfxChange}
              onMouseUp={handleSfxMouseUp}
              onTouchEnd={handleSfxMouseUp}
              disabled={!enabled}
              className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* ADMIN EQUALIZER SECTION */}
          {isAdmin ? (
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-500" /> 音效均衡器 (所有玩家音效比例)
                  </h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">管理员可调节单项音效比例，实时对所有玩家生效</p>
                </div>
                <button
                  onClick={handleResetEq}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  title="重置所有音效为 100%"
                >
                  <RotateCcw size={12} /> 重置
                </button>
              </div>

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                {SFX_ITEMS.map((item) => {
                  const val = equalizer[item.key] ?? 100;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700 flex items-center gap-1">
                          <span>{item.icon}</span> {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-600 text-[11px]">{val}%</span>
                          <button
                            onClick={() => audioService.play(item.key as SoundType)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 transition-colors"
                            title="试听音效"
                          >
                            <Play size={12} className="fill-stone-500" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="5"
                        value={val}
                        onChange={(e) => handleEqChange(item.key, Number(e.target.value))}
                        disabled={!enabled}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-700 font-medium leading-relaxed">
              💡 提示：全局单项音效比例由管理员均衡器统一设定，您可自行调节主音效与背景音乐大小。
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex items-center justify-center gap-2 text-sm"
          >
            确定
          </button>
        </div>
      </motion.div>
    </div>
  );
}
