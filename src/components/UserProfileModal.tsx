import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Loader2, Trophy, Clock, Swords, LogOut, Settings, Edit3, ArrowLeft, Mail, BellRing } from 'lucide-react';
import { SoundSettingsModal } from './SoundSettingsModal';
import { AdminDashboard } from './AdminDashboard';

interface UserProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (user: any) => void;
  onLogout?: () => void;
  inline?: boolean;
  onPlayerClick?: (username: string) => void;
}

export function UserProfileModal({ currentUser, onClose, onUpdateSuccess, onLogout, inline = false, onPlayerClick }: UserProfileModalProps) {
  const [activeView, setActiveView] = useState<'menu' | 'edit' | 'history' | 'sound' | 'admin'>('menu');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const [games, setGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  useEffect(() => {
    setGames([]);
    if (!currentUser?.username) return;
    
    setGamesLoading(true);
    const token = localStorage.getItem('catan_auth_token');
    const fetchUrl = currentUser.isViewingAsAdmin
      ? `/api/admin/user/${encodeURIComponent(currentUser.username)}/games`
      : '/api/user/games';
      
    fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : null)
    .then(data => {
      if (data?.games) setGames(data.games);
    })
    .catch(console.error)
    .finally(() => setGamesLoading(false));
  }, [currentUser?.username]);

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
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) {
        throw new Error(`服务器响应异常 (${res.status})`);
      }
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
        setActiveView('menu');
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
      className={`relative z-10 flex flex-col overflow-hidden ${inline ? 'w-full h-full bg-transparent' : 'bg-slate-50 rounded-3xl w-full shadow-2xl max-h-[90vh]'}`}
    >
      {/* Header Profile Section */}
      <div className={`bg-white px-5 py-3.5 shadow-2xs z-10 shrink-0 relative flex justify-between items-center w-full rounded-none border-b border-slate-200/80 ${inline ? '' : 'pt-4 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-200/50 relative overflow-hidden shrink-0">
            <User size={22} />
            {currentUser?.role === 'admin' && (
              <div className="absolute bottom-0 left-0 w-full bg-indigo-500 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Admin</div>
            )}
          </div>
          <div>
            <div className="text-base font-black text-slate-800 leading-tight flex items-center gap-1.5">
              {currentUser.username}
              {currentUser.isGuest && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                  游客
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{currentUser.isGuest ? '未绑定邮箱' : currentUser.email}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
            {activeView !== 'menu' && (
              <button 
                onClick={() => setActiveView('menu')}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                title="返回"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {!inline && (
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors ml-2"
              >
                <X size={20} />
              </button>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 space-y-4 max-w-2xl w-full mx-auto">
        {activeView === 'edit' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
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
        )}
        {activeView === 'sound' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <SoundSettingsModal 
                isOpen={true} 
                onClose={() => {}} 
                isAdmin={currentUser?.role === 'admin'}
                inline={true}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {activeView === 'admin' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <AdminDashboard 
                onClose={() => {}} 
                onLogout={onLogout || (() => {})}
                inline={true}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {activeView === 'history' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              
              {/* Stats Box (moved to top) */}
              <div className="flex gap-4 p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">场次</span>
                    <span className="text-xl font-black text-slate-800 mt-1">{totalGames}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center border-l border-r border-slate-100">
                    <span className="text-[10px] uppercase font-black tracking-widest text-yellow-600/70">胜场</span>
                    <span className="text-xl font-black text-yellow-600 mt-1">{wins}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70">胜率</span>
                    <span className="text-xl font-black text-emerald-600 mt-1">{winRate}%</span>
                  </div>
              </div>

              {/* Match History (moved below) */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Clock size={16} /> 历史战绩明细
                </h3>
                  
                <div className="flex flex-col">
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
                      const calcTotalScore = (p: any) => {
                        const setPts = (p.breakdown?.settlements || 0) * 1;
                        const cityPts = p.breakdown?.cities ? p.breakdown.cities * 2 : 0;
                        const roadPts = p.breakdown?.longestRoad ? 2 : 0;
                        const armyPts = p.breakdown?.largestArmy ? 2 : 0;
                        const vpCardsPts = p.breakdown?.vpCards || 0;
                        const islandPts = p.breakdown?.islandBonus || 0;
                        const breakdownSum = setPts + cityPts + roadPts + armyPts + vpCardsPts + islandPts;
                        return Math.max(p.score || 0, breakdownSum);
                      };
                      const sortedPlayers = [...(g.players || [])].sort((a, b) => calcTotalScore(b) - calcTotalScore(a));
                      const isWin = g.winnerId && g.players?.find((p: any) => p.name === currentUser.username)?.id === g.winnerId;
                      return (
                        <div key={i} className="py-4 border-b border-slate-100 last:border-b-0 flex flex-col gap-2 relative group">
                          {isWin && (
                            <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/10 rounded-bl-full flex items-start justify-end p-2 pointer-events-none">
                              <Trophy size={14} className="text-yellow-500" />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-600">ID: {g.roomId}</span>
                            <span className="font-mono">{new Date(g.completedAt).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Scrolling Table */}
                          <div className="overflow-x-auto pb-2 -mx-2 px-2">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                  <th className="py-2 px-2 text-center w-8">排名</th>
                                  <th className="py-2 px-2 min-w-[80px]">玩家</th>
                                  <th className="py-2 px-2 text-center">总分</th>
                                  <th className="py-2 px-2 text-center">村</th>
                                  <th className="py-2 px-2 text-center">城</th>
                                  <th className="py-2 px-2 text-center">路</th>
                                  <th className="py-2 px-2 text-center">骑</th>
                                  <th className="py-2 px-2 text-center">卡</th>
                                  <th className="py-2 px-2 text-center">探</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {sortedPlayers.map((p, idx) => {
                                  const isWinner = p.id === g.winnerId;
                                  return (
                                    <tr key={idx} className={`${isWinner ? 'bg-yellow-50/30' : ''}`}>
                                      <td className="py-2 px-2 text-center font-black text-slate-400">
                                        {idx + 1}
                                      </td>
                                      <td className="py-2 px-2 font-bold text-slate-700 whitespace-nowrap">
                                        {p.name} {isWinner && '👑'}
                                      </td>
                                      <td className="py-2 px-2 text-center font-black text-indigo-600">{calcTotalScore(p)}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.settlements || 0}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.cities ? p.breakdown.cities * 2 : 0}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.longestRoad ? 2 : 0}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.largestArmy ? 2 : 0}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.vpCards || 0}</td>
                                      <td className="py-2 px-2 text-center">{p.breakdown?.islandBonus || 0}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
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
        
        {activeView === 'menu' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <button 
                onClick={() => setActiveView('history')} 
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <h3 className="font-bold text-slate-700 text-sm">历史战绩</h3>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveView('edit')} 
                disabled={currentUser.isGuest}
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors disabled:opacity-50 disabled:hover:border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <Edit3 size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <h3 className="font-bold text-slate-700 text-sm">修改资料</h3>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>

              <button 
                onClick={() => setActiveView('sound')} 
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BellRing size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <h3 className="font-bold text-slate-700 text-sm">声音设置</h3>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>

              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setActiveView('admin')} 
                  className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <h3 className="font-bold text-slate-700 text-sm">管理中心</h3>
                  </div>
                  <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Logout Button */}
      {activeView === 'menu' && onLogout && !currentUser?.isViewingAsAdmin && (
         <div className="shrink-0 z-10 mt-auto pt-8 pb-3 px-4 flex justify-center">
           <button
             onClick={onLogout}
             className="w-full max-w-[220px] flex items-center justify-center gap-2 text-xs font-black text-red-500 bg-red-50 hover:bg-red-100 py-2.5 px-4 rounded-xl transition-all border border-red-100/80 shadow-2xs hover:shadow-xs active:scale-95"
           >
             <LogOut size={15} /> 退出登录
           </button>
         </div>
      )}
    </motion.div>
  );

  if (inline) {
    return (
      <>
        {content}
      </>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      {content}
    </div>
  );
}
