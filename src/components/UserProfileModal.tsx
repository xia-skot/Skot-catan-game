import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Loader2, Trophy, Clock, Swords } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (user: any) => void;
}

export function UserProfileModal({ currentUser, onClose, onUpdateSuccess }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'games'>('profile');
  const [username, setUsername] = useState(currentUser.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const [games, setGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'games' && games.length === 0 && !currentUser.isGuest) {
      setGamesLoading(true);
      const token = localStorage.getItem('catan_auth_token');
      fetch('/api/user/games', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.games) setGames(data.games);
      })
      .catch(console.error)
      .finally(() => setGamesLoading(false));
    }
  }, [activeTab, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (currentUser.isGuest) {
      setErrorText('游客无法修改资料，请注册正式账号。');
      return;
    }

    if (!username.trim() && !password.trim()) {
      setErrorText('尚未修改任何内容。');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, oldPassword, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '修改失败');
      }

      setSuccessText('修改成功！');
      localStorage.setItem('catan_auth_token', data.token);
      localStorage.setItem('catan_player_name', data.user.username);
      setOldPassword('');
      setPassword('');
      
      setTimeout(() => {
        onUpdateSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 pb-0 flex flex-col shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-20"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">我的</h2>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              个人中心
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'games' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              历史战绩
            </button>
          </div>
        </div>

        <div className="p-6 pt-0 overflow-y-auto no-scrollbar relative flex-1 min-h-[300px]">
          {activeTab === 'profile' ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center animate-bounce">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">当前身份</div>
                    <div className="text-slate-800 font-bold">{currentUser.isGuest ? '游客' : currentUser.email}</div>
                  </div>
                </div>

                {errorText && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium text-center">
                    {errorText}
                  </div>
                )}
                {successText && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100 font-medium text-center">
                    {successText}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
                      游戏昵称
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="修改昵称"
                        disabled={currentUser.isGuest}
                        className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50 text-sm"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
                      原密码 (修改密码时必填)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        placeholder="输入当前密码"
                        disabled={currentUser.isGuest}
                        className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50 text-sm"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
                      新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={currentUser.isGuest}
                        className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50 text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || currentUser.isGuest}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存修改'}
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="games"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-3"
              >
                {currentUser.isGuest ? (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    游客无法查阅战绩，请注册正式账号。
                  </div>
                ) : gamesLoading ? (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : games.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                    暂无历史战绩
                  </div>
                ) : (
                  games.map((g, i) => {
                    const isWin = g.winnerId && g.players?.find((p: any) => p.name === currentUser.username)?.id === g.winnerId;
                    return (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                        {isWin && (
                          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/10 rounded-bl-full flex items-start justify-end p-2 pointer-events-none">
                            <Trophy size={16} className="text-yellow-500" />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono"><Clock size={12} /> {new Date(g.completedAt).toLocaleString()}</span>
                          <span className="font-bold flex items-center gap-1"><Swords size={12}/> {g.turnCount || 0} 回合</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {g.players?.map((p: any, idx: number) => (
                             <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm border border-slate-100 shadow-sm">
                               <span className={`font-bold ${p.id === g.winnerId ? 'text-yellow-600' : 'text-slate-600'}`}>
                                 {p.name} {p.id === g.winnerId && '👑'} {p.isBot && <span className="opacity-50 text-[10px] bg-slate-100 px-1 rounded ml-1">BOT</span>}
                               </span>
                               <span className="font-mono font-bold text-slate-500">{p.score} 分</span>
                             </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
