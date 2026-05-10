import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Loader2, Trophy, Clock, Swords, LogOut, Settings, Edit3, ArrowLeft, Mail } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (user: any) => void;
  onLogout?: () => void;
  onAdminDashboard?: () => void;
  inline?: boolean;
}

export function UserProfileModal({ currentUser, onClose, onUpdateSuccess, onLogout, onAdminDashboard, inline = false }: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUser.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const [games, setGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  useEffect(() => {
    if (games.length === 0 && !currentUser.isGuest) {
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
  }, [currentUser]);

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
        setIsEditing(false);
        setSuccessText('');
      }, 1000);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalGames = games.length;
  const wins = games.filter(g => g.winnerId && g.players?.find((p: any) => p.name === currentUser.username)?.id === g.winnerId).length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const content = (
    <motion.div 
      initial={inline ? false : { opacity: 0, scale: 0.95, y: 20 }}
      animate={inline ? false : { opacity: 1, scale: 1, y: 0 }}
      className={`bg-slate-50 relative z-10 flex flex-col overflow-hidden ${inline ? 'w-full h-full' : 'rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh]'}`}
    >
      {/* Header Profile Section */}
      <div className={`bg-white px-6 pb-6 shadow-sm z-10 shrink-0 relative ${inline ? 'pt-8' : 'pt-6'}`}>
        {!inline && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-20"
          >
            <X size={20} />
          </button>
        )}
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
             <button onClick={() => setIsEditing(false)} className="flex items-center text-slate-500 hover:text-indigo-600 text-xs font-bold transition-colors">
               <ArrowLeft size={16} className="mr-1" /> 返回
             </button>
          ) : (
            <h2 className={`font-black text-slate-800 tracking-tight ${inline ? 'text-xl' : 'text-2xl'}`}>我的</h2>
          )}
          
          {!isEditing && (
             <div className="flex items-center gap-2">
               {currentUser?.role === 'admin' && onAdminDashboard && (
                 <button onClick={onAdminDashboard} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="管理面板">
                   <Settings size={18} />
                 </button>
               )}
               <button onClick={() => setIsEditing(true)} disabled={currentUser.isGuest} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="修改资料">
                 <Edit3 size={18} />
               </button>
             </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4 mt-4">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center border-2 border-indigo-200/50 relative overflow-hidden">
             <User size={32} />
             {currentUser?.role === 'admin' && (
                <div className="absolute bottom-0 left-0 w-full bg-indigo-500 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">
                  Admin
                </div>
             )}
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-xl font-black text-slate-800 truncate">{currentUser.isGuest ? '游客' : currentUser.username}</div>
             <div className="text-xs text-slate-400 font-medium truncate mt-0.5">{currentUser.isGuest ? '未绑定邮箱' : currentUser.email}</div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 space-y-4">
        {isEditing ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                 <Edit3 size={16} className="text-indigo-500" /> 编辑资料
              </h3>

              {errorText && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium text-center">
                  {errorText}
                </div>
              )}
              {successText && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100 font-medium text-center">
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 flex justify-between items-center group-focus-within:text-indigo-500 transition-colors">
                    <span>原密码 (修改必填)</span>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        alert('重置密码验证邮件已发送至：' + currentUser.email + '\n请注意查收邮件。');
                      }} 
                      className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                       <Mail size={12} /> 忘记密码?
                    </button>
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
                    新密码 (留空则不修改)
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
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存修改'}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Stats Box */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex gap-3">
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100/50">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">场次</span>
                    <span className="text-xl font-black text-slate-800 mt-1">{totalGames}</span>
                  </div>
                  <div className="flex-1 bg-yellow-50 rounded-xl p-3 flex flex-col items-center justify-center border border-yellow-100/50">
                    <span className="text-[10px] uppercase font-black tracking-widest text-yellow-600/70">胜场</span>
                    <span className="text-xl font-black text-yellow-600 mt-1">{wins}</span>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3 flex flex-col items-center justify-center border border-emerald-100/50">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70">胜率</span>
                    <span className="text-xl font-black text-emerald-600 mt-1">{winRate}%</span>
                  </div>
                </div>
              </div>

              {/* Match History */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                   <Clock size={16} className="text-slate-400" /> 历史战绩
                </h3>
                  
                <div className="flex flex-col gap-3">
                  {currentUser.isGuest ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      游客无法查阅战绩，请注册正式账号。
                    </div>
                  ) : gamesLoading ? (
                    <div className="py-8 flex justify-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : games.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-100 rounded-2xl">
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
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 font-mono"><Clock size={10} /> {new Date(g.completedAt).toLocaleString()}</span>
                            <span className="font-bold flex items-center gap-1"><Swords size={10}/> {g.turnCount || 0} 回合</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {[...(g.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm border border-slate-100 shadow-sm relative overflow-hidden">
                                 <div className="flex items-center gap-2 relative z-10">
                                   <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                                     {idx + 1}
                                   </span>
                                   <span className={`font-bold text-xs truncate max-w-[120px] ${p.id === g.winnerId ? 'text-yellow-600' : 'text-slate-600'}`}>
                                     {p.name} {p.id === g.winnerId && '👑'} {p.isBot && <span className="opacity-50 text-[9px] bg-slate-100 px-1 rounded ml-1">BOT</span>}
                                   </span>
                                 </div>
                                 <span className="font-mono font-bold text-slate-500 text-xs relative z-10">{p.score || 0} 分</span>
                               </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Logout Button */}
        {!isEditing && onLogout && (
           <div className="pt-2 pb-6">
             <button
               onClick={onLogout}
               className="w-full flex items-center justify-center gap-2 text-sm font-black text-red-500 bg-red-50 hover:bg-red-100 py-3.5 rounded-2xl transition-colors border border-red-100/50"
             >
               <LogOut size={16} /> 退出账号
             </button>
           </div>
        )}
      </div>
    </motion.div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {content}
    </div>
  );
}
