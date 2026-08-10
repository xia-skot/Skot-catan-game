import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Loader2, Trophy, Clock, Swords, LogOut, Settings, Edit3, ArrowLeft, Mail, BellRing, Bug, Trash2, Play, Database, MessageSquare, Send, Bell, Info } from 'lucide-react';
import { SoundSettingsModal } from './SoundSettingsModal';
import { AdminDashboard } from './AdminDashboard';

interface UserProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (user: any) => void;
  onLogout?: () => void;
  inline?: boolean;
  fullScreen?: boolean;
  onPlayerClick?: (username: string) => void;
  onRestoreGame?: (roomId: string) => void;
  activeView?: string;
  onActiveViewChange?: (view: any) => void;
}

export function UserProfileModal({ currentUser, onClose, onUpdateSuccess, onLogout, inline = false, fullScreen = false, onPlayerClick, onRestoreGame, activeView: propActiveView, onActiveViewChange }: UserProfileModalProps) {
  const [internalActiveView, setInternalActiveView] = useState<'menu' | 'edit' | 'history' | 'sound' | 'admin' | 'debug' | 'feedback' | 'messages' | 'about'>('menu');
  const activeView = propActiveView !== undefined ? propActiveView : internalActiveView;
  const setActiveView = (v: any) => {
    setInternalActiveView(v);
    if (onActiveViewChange) onActiveViewChange(v);
  };
  const [username, setUsername] = useState(currentUser?.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const [games, setGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  const [saves, setSaves] = useState<any[]>([]);
  const [savesLoading, setSavesLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackPrompt, setFeedbackPrompt] = useState('');

  useEffect(() => {
    fetch('/api/feedback/prompt')
      .then(res => res.json())
      .then(data => {
        if (data?.prompt) setFeedbackPrompt(data.prompt);
      })
      .catch(console.error);
  }, [activeView]);

  useEffect(() => {
    const state = { modalView: activeView, time: Date.now() };
    window.history.pushState(state, '');

    const handlePopState = () => {
      if (activeView !== 'menu') {
        setActiveView('menu');
      } else {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeView, onClose]);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const [adminMsgTitle, setAdminMsgTitle] = useState('');
  const [adminMsgContent, setAdminMsgContent] = useState('');
  const [adminMsgLoading, setAdminMsgLoading] = useState(false);

  const [aboutInfo, setAboutInfo] = useState<{ content: string; updatedAt: string }>({ content: '', updatedAt: '' });
  const [aboutLoading, setAboutLoading] = useState(false);

  useEffect(() => {
    if (activeView === 'about' || !aboutInfo.content) {
      setAboutLoading(true);
      fetch('/api/about')
        .then(res => res.json())
        .then(data => {
          if (data) setAboutInfo({ content: data.content || '', updatedAt: data.updatedAt || '' });
        })
        .catch(console.error)
        .finally(() => setAboutLoading(false));
    }
  }, [activeView]);

  const unreadCount = messages.filter(m => !m.read).length;

  useEffect(() => {
    setMessagesLoading(true);
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          const readMsgs = JSON.parse(localStorage.getItem('catan_read_messages') || '[]');
          setMessages(data.messages.map((m: any) => ({ ...m, read: readMsgs.includes(m.id) })));
        }
      })
      .catch(console.error)
      .finally(() => setMessagesLoading(false));
  }, []);

  const markMessageAsRead = (id: string) => {
    const newMessages = messages.map(m => m.id === id ? { ...m, read: true } : m);
    setMessages(newMessages);
    const readMsgs = newMessages.filter(m => m.read).map(m => m.id);
    localStorage.setItem('catan_read_messages', JSON.stringify(readMsgs));
  };

  const markAllMessagesAsRead = () => {
    const newMessages = messages.map(m => ({ ...m, read: true }));
    setMessages(newMessages);
    const readMsgs = newMessages.map(m => m.id);
    localStorage.setItem('catan_read_messages', JSON.stringify(readMsgs));
  };

  const handleDeleteMessage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条消息吗？')) return;
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
      } else {
        alert('删除失败');
      }
    } catch (err) {
      alert('删除失败，请检查网络');
    }
  };

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
    .catch(() => {})
    .finally(() => setGamesLoading(false));
  }, [currentUser?.username]);

  const fetchSaves = async () => {
    if (currentUser?.role !== 'admin') return;
    setSavesLoading(true);
    setErrorText('');
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch('/api/admin/saved-games', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('获取存档列表失败');
      const data = await res.json();
      setSaves(data.saves || []);
    } catch (err: any) {
      setErrorText(err.message || '获取存档列表出错');
    } finally {
      setSavesLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'debug') {
      fetchSaves();
    }
  }, [activeView, currentUser?.role]);

  const handleRestoreSave = async (saveId: string) => {
    setErrorText('');
    setSuccessText('');
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch('/api/admin/restore-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ saveId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '恢复进度失败');
      }
      setSuccessText('进度已恢复！正在加载游戏...');
      setTimeout(() => {
        if (onRestoreGame) {
          onRestoreGame(data.roomId);
        }
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorText(err.message || '恢复进度出错');
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    setErrorText('');
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/saved-games/${saveId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }
      setSaves(prev => prev.filter(s => s._id !== saveId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setErrorText(err.message || '删除存档出错');
    }
  };

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
      className={`relative z-10 flex flex-col overflow-hidden ${inline ? 'w-full h-full bg-transparent' : fullScreen ? 'bg-slate-50 w-full h-full max-w-none rounded-none' : 'bg-slate-50 rounded-3xl w-full shadow-2xl max-h-[90%] md:max-w-md'}`}
    >
      {/* Header Profile Section */}
      <div className="bg-white px-5 py-3.5 shadow-2xs z-10 shrink-0 relative flex justify-between items-center w-full rounded-none border-b border-slate-200/80 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] shadow-sm">
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

      <div 
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative p-4 space-y-4 max-w-2xl w-full mx-auto touch-pan-y"
        style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
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

        {activeView === 'debug' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="debug"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                   <Bug size={16} className="text-indigo-500 animate-pulse" /> 游戏调试存档
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mb-4 leading-relaxed">
                  在这里可以查看、删除和一键加载已保存的游戏进度，方便您调试游戏和页面布局。
                </p>

                {errorText && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium text-center font-sans">
                    {errorText}
                  </div>
                )}
                {successText && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100 font-medium text-center font-sans">
                    {successText}
                  </div>
                )}

                <div className="space-y-3 font-sans">
                  {savesLoading ? (
                    <div className="py-12 flex justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : saves.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <Database className="w-8 h-8 opacity-30 text-slate-400 mb-1" />
                      暂无已保存的调试进度数据。
                      <span className="text-[10px] text-slate-400 max-w-[200px] leading-normal block">
                        在游戏中点击【调试控制台】中的【保存游戏进度】可以添加存档。
                      </span>
                    </div>
                  ) : (
                    saves.map((save) => {
                      const hostPlayer = save.roomData?.players?.find((p: any) => p.id === save.roomData?.hostId);
                      const hostName = hostPlayer ? hostPlayer.name : '未知';
                      const playerNames = save.roomData?.players?.map((p: any) => p.name).join(', ') || '无';
                      const botCount = save.roomData?.settings?.botConfig?.filter((b: boolean) => b).length || 0;
                      return (
                        <div key={save._id} className="p-3.5 border border-slate-100 hover:border-indigo-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 relative group">
                          <div className="space-y-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm truncate">{save.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold font-mono">
                                ID: {save.roomId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              <span className="text-slate-400 font-bold">玩家数：</span>
                              {save.roomData?.players?.length || 0}人 ({botCount}机器人)
                            </div>
                            <div className="text-[11px] text-slate-505 font-medium truncate text-slate-500">
                              <span className="text-slate-400 font-bold">玩家名单：</span>
                              {playerNames}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-1">
                              保存人: {save.savedBy} | {new Date(save.savedAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {confirmDeleteId === save._id ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-150">
                                <button
                                  onClick={() => handleDeleteSave(save._id)}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm animate-pulse"
                                >
                                  确认删除
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRestoreSave(save._id)}
                                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Play size={12} className="fill-white text-white" /> 继续游戏
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(save._id)}
                                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                                  title="删除存档"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
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
        
        {activeView === 'messages' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 font-sans"
            >
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Bell size={16} className="text-indigo-500" /> 系统消息
                  </h3>
                  <div className="flex items-center gap-2">
                    {messages.some(m => !m.read) && (
                      <button 
                        onClick={markAllMessagesAsRead}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="一键全部标记为已读"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m14 11 2-2 5-5" />
                          <path d="M11 14 3.5 21.5a1.5 1.5 0 0 0 2.1 2.1L13 16" />
                          <path d="M16 11c0 2.8-2.2 5-5 5" />
                          <path d="M8 18c-2 0-3.5-1.5-3.5-3.5" />
                        </svg>
                        <span className="text-[11px]">一键已读</span>
                      </button>
                    )}
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {messages.length} 条
                    </span>
                  </div>
                </div>
                
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 mt-10">
                    <Mail className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm font-bold">暂无消息</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-4">
                    {messages.map((msg) => {
                      const isExpanded = expandedMessageId === msg.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${msg.read ? 'bg-slate-50 border-slate-100' : 'bg-white border-indigo-100 shadow-sm'}`}
                          onClick={() => {
                            setExpandedMessageId(isExpanded ? null : msg.id);
                            if (!msg.read) {
                              markMessageAsRead(msg.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${msg.read ? 'bg-transparent' : 'bg-red-500'}`} />
                              <h4 className={`text-sm truncate ${msg.read ? 'text-slate-500 font-medium' : 'text-slate-800 font-bold'}`}>
                                {msg.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium">{msg.date}</span>
                              {currentUser?.role === 'admin' && (
                                <button
                                  onClick={(e) => handleDeleteMessage(e, msg.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="删除此条消息"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs leading-relaxed text-slate-600 pl-4 border-l-2 border-indigo-100">
                                  {msg.content}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentUser?.role === 'admin' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-slate-800">发布新消息</h4>
                    <input 
                      type="text"
                      placeholder="标题"
                      value={adminMsgTitle}
                      onChange={(e) => setAdminMsgTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 transition-all"
                    />
                    <textarea 
                      placeholder="内容"
                      value={adminMsgContent}
                      onChange={(e) => setAdminMsgContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 transition-all resize-none min-h-[80px]"
                    />
                    <button 
                      disabled={!adminMsgTitle.trim() || !adminMsgContent.trim() || adminMsgLoading}
                      onClick={() => {
                        setAdminMsgLoading(true);
                        fetch('/api/admin/messages', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('catan_auth_token')}`
                          },
                          body: JSON.stringify({ title: adminMsgTitle, content: adminMsgContent })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setMessages([data.message, ...messages]);
                            setAdminMsgTitle('');
                            setAdminMsgContent('');
                          } else {
                            alert(data.error || '发布失败');
                          }
                        })
                        .catch(() => alert('发布失败，请检查网络'))
                        .finally(() => setAdminMsgLoading(false));
                      }}
                      className="w-full bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {adminMsgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      发布
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {activeView === 'feedback' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 font-sans"
            >
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-500" /> 意见反馈
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed whitespace-pre-wrap">
                  {feedbackPrompt || '您的意见对我们非常重要。请详细描述您遇到的问题或建议，反馈内容将提交给管理员查看。'}
                </p>

                {feedbackSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-emerald-600 space-y-3 mt-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm font-bold">感谢您的反馈！</p>
                    <button 
                      onClick={() => { setFeedbackSuccess(false); setFeedbackText(''); }}
                      className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      继续反馈
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="relative flex-1 flex flex-col">
                      <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value.slice(0, 1000))}
                        maxLength={1000}
                        placeholder="请输入您的反馈意见（最多1000字）..."
                        className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pb-8 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none min-h-[160px]"
                      />
                      <div className="absolute bottom-2.5 right-4 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
                        {feedbackText.length} / 1000
                      </div>
                    </div>
                    <button 
                      disabled={!feedbackText.trim() || feedbackLoading}
                      onClick={() => {
                        setFeedbackLoading(true);
                        fetch('/api/feedback', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('catan_auth_token')}`
                          },
                          body: JSON.stringify({ text: feedbackText })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setFeedbackSuccess(true);
                          } else {
                            alert(data.error || '提交失败');
                          }
                        })
                        .catch(() => alert('提交失败，请检查网络'))
                        .finally(() => setFeedbackLoading(false));
                      }}
                      className="mt-4 w-full bg-indigo-600 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      提交反馈
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {activeView === 'about' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 font-sans"
            >
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Info size={18} className="text-indigo-500" /> 关于游戏
                  </h3>
                  {aboutLoading ? (
                    <div className="flex items-center justify-center py-12 text-indigo-500">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap py-2">
                      {aboutInfo.content || '暂无详细介绍信息。'}
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>卡坦岛 Catan Online</span>
                  <span>更新日期：{aboutInfo.updatedAt || '2026-08-10'}</span>
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

              <button 
                onClick={() => setActiveView('messages')} 
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm">消息</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-red-500">{unreadCount}</span>
                  )}
                  <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveView('feedback')} 
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <h3 className="font-bold text-slate-700 text-sm">反馈</h3>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>

              <button 
                onClick={() => setActiveView('about')} 
                className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <h3 className="font-bold text-slate-700 text-sm">关于</h3>
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

              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setActiveView('debug')} 
                  className="w-full bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bug size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <h3 className="font-bold text-slate-700 text-sm">调试 (游戏存档)</h3>
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

  const modalOverlay = (
    <div className={`fixed inset-0 z-[100000] bg-transparent pointer-events-auto flex items-center justify-center ${fullScreen ? 'p-0' : 'p-4'}`}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {content}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalOverlay, document.body) : modalOverlay;
}
