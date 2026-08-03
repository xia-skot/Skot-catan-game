import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, LayoutGrid, X, LogOut, ArrowLeft, RotateCw, Trash2, Edit2, Save, Settings, Loader2 } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

export function AdminDashboard({ onLogout, onClose, inline = false }: { onLogout: () => void, onClose: () => void, inline?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUsers, setEditingUsers] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteGameId, setConfirmDeleteGameId] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);

  const handleOpenUserProfile = async (username: string) => {
    setInspectingLoading(true);
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/user/${encodeURIComponent(username)}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('获取玩家信息失败');
      const json = await res.json();
      if (json.user) {
        setInspectingUser({
          ...json.user,
          isViewingAsAdmin: true
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInspectingLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('无权限访问');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    setConfirmDeleteId(null);
    setDeletingId(userId);
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '删除失败');
      }
      setTimeout(fetchStats, 500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    setConfirmDeleteGameId(null);
    setDeletingGameId(gameId);
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '删除记录失败');
      }
      setTimeout(fetchStats, 500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingGameId(null);
    }
  };

  const handleEditChange = (userId: string, val: string) => {
    setEditingUsers(prev => ({ ...prev, [userId]: val }));
  };

  const startEdit = (userId: string, currentName: string) => {
    setEditingUsers(prev => ({ ...prev, [userId]: currentName }));
  };

  const cancelEdit = (userId: string) => {
    setEditingUsers(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const saveEdit = async (userId: string) => {
    const newName = editingUsers[userId];
    if (!newName || newName.trim() === '') return cancelEdit(userId);
    setSavingId(userId);
    try {
      const token = localStorage.getItem('catan_auth_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newName.trim() })
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '修改失败');
      }
      cancelEdit(userId);
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (error) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-600 rounded-3xl w-full max-w-lg shadow-2xl border border-red-100">
          <h2 className="text-xl font-bold mb-4">连接失败或权限不足</h2>
          <p className="mb-6">{error}</p>
          <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors" onClick={onClose}>返回大厅</button>
        </div>
      </div>
    );
  }

  if (inline) {
    if (loading && !data) {
      return (
        <div className="flex items-center justify-center py-20 text-indigo-400">
          <RotateCw size={24} className="animate-spin" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-3xl text-sm border border-red-100">
          {error}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex gap-4 p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">注册用户</span>
            <span className="text-xl font-black text-slate-800 mt-1">{data?.stats?.users || 0}</span>
          </div>
          <div className="flex-1 flex flex-col items-center border-l border-r border-slate-100">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70">游客</span>
            <span className="text-xl font-black text-emerald-600 mt-1">{data?.stats?.guests || 0}</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-600/70">对局数</span>
            <span className="text-xl font-black text-purple-600 mt-1">{data?.stats?.games || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Settings size={16} /> 系统设置
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">大厅显示房间上限</span>
            <input
              type="number"
              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-indigo-500 bg-slate-50"
              defaultValue={data?.settings?.maxVisibleRooms || 10}
              onBlur={async (e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  try {
                    await fetch('/api/admin/settings', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('catan_auth_token')}`
                      },
                      body: JSON.stringify({ maxVisibleRooms: val })
                    });
                  } catch (err) {
                    console.warn('Failed to update setting', err);
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} /> 所有玩家战绩
            </div>
            <button onClick={fetchStats} className="text-indigo-500 hover:bg-indigo-50 p-1 rounded-md transition-colors">
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </h3>
          
          <div className="flex flex-col">
            {(data?.allUsers || data?.latestUsers)?.map((u: any) => {
              const isEditing = editingUsers[u._id] !== undefined;
              return (
                <div key={u._id} className="py-3 border-b border-slate-100 last:border-b-0 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <span className="text-sm font-black text-indigo-600">{u.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingUsers[u._id]}
                            onChange={(e) => handleEditChange(u._id, e.target.value)}
                            className="border border-indigo-200 rounded px-1.5 py-0.5 text-xs outline-none w-24 focus:border-indigo-400"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleOpenUserProfile(u.username)}
                          >
                            {u.username}
                          </span>
                        )}
                        {u.role === 'admin' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">管理员</span>}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-medium">
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded">场次: <span className="font-bold text-slate-600">{u.totalGames || 0}</span></span>
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded">胜率: <span className="font-bold text-emerald-600">{u.winRate || 0}%</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 shrink-0 ml-2">
                    {isEditing ? (
                      <button onClick={() => saveEdit(u._id)} disabled={savingId === u._id} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors bg-slate-50">
                        {savingId === u._id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      </button>
                    ) : (
                      <button onClick={() => setEditingUsers(prev => ({ ...prev, [u._id]: u.username }))} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors bg-slate-50">
                        <Edit2 size={16} />
                      </button>
                    )}
                    
                    {confirmDeleteId === u._id ? (
                      <div className="flex gap-1 bg-red-50 p-1 rounded-xl border border-red-100">
                        <button onClick={() => handleDeleteUser(u._id)} className="px-2 py-1 text-[10px] font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">确认</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-white rounded-lg hover:bg-slate-100">取消</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(u._id)} disabled={deletingId === u._id} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors bg-slate-50">
                        {deletingId === u._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {inspectingUser && (
          <UserProfileModal 
            currentUser={inspectingUser} 
            onClose={() => setInspectingUser(null)} 
            onUpdateSuccess={(updatedUser) => {
              setInspectingUser({ ...updatedUser, isViewingAsAdmin: true });
              fetchStats();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 bg-slate-50 z-50 overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm border border-slate-200 text-slate-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">管理中心</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">查看系统运行状态和玩家数据</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={fetchStats} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm border border-slate-200 text-indigo-500 transition-colors">
              <RotateCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl shadow-sm border border-red-100 font-bold transition-colors">
              <LogOut size={16} /> 退出登录
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-20 text-indigo-400">
            <RotateCw size={40} className="animate-spin" />
          </div>
        ) : data && (
          <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">注册用户</p>
                  <p className="text-4xl font-black text-slate-800">{data.stats.users}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Users size={32} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-100/50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">游客总数</p>
                  <p className="text-4xl font-black text-slate-800">{data.stats.guests}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Users size={32} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-100/50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">已完成游戏</p>
                  <p className="text-4xl font-black text-slate-800">{data.stats.games}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                  <LayoutGrid size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                  <Settings size={18} className="text-slate-400" />
                  大厅游戏显示数量
                </p>
                <p className="text-xs text-slate-500 font-medium">普通玩家在“游戏大厅”列表中最多能看到的活跃房间数量</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-indigo-500"
                  defaultValue={data.settings?.maxVisibleRooms || 10}
                  onBlur={async (e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      try {
                        await fetch('/api/admin/settings', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('catan_auth_token')}`
                          },
                          body: JSON.stringify({ maxVisibleRooms: val })
                        });
                      } catch (err) {
                        console.warn('Failed to update setting', err);
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex flex-wrap gap-2 items-center">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full" /> 所有玩家战绩
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">用户名</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">场次</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">胜率</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">注册时间</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.allUsers || data?.latestUsers)?.map((u: any) => {
                        const isEditing = editingUsers[u._id] !== undefined;
                        return (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editingUsers[u._id]}
                                onChange={(e) => handleEditChange(u._id, e.target.value)}
                                className="border border-indigo-200 rounded px-2 py-1 text-sm outline-none w-32 focus:border-indigo-400"
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="cursor-pointer hover:text-indigo-600 hover:underline"
                                onClick={() => handleOpenUserProfile(u.username)}
                              >
                                {u.username}
                              </span>
                            )}
                            {u.role === 'admin' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full relative -top-0.5">管理员</span>}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600 font-bold text-center">{u.totalGames || 0}</td>
                          <td className="py-4 px-4 text-sm text-emerald-600 font-bold text-center">{u.winRate || 0}%</td>
                          <td className="py-4 px-4 text-xs font-mono text-slate-400">{new Date(u.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-4 text-right flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(u._id)}
                                  disabled={savingId === u._id}
                                  className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="保存"
                                >
                                  {savingId === u._id ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} />}
                                </button>
                                <button
                                  onClick={() => cancelEdit(u._id)}
                                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="取消"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(u._id, u.username)}
                                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="修改昵称"
                                >
                                  <Edit2 size={16} />
                                </button>
                                {u.role !== 'admin' && (
                                  <>
                                    {confirmDeleteId === u._id ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleDeleteUser(u._id)}
                                          className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold"
                                        >
                                          确认注销
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="text-[10px] px-2 py-1 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteId(u._id)}
                                        disabled={deletingId === u._id}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="注销该用户"
                                      >
                                        {deletingId === u._id ? <RotateCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                      {data.latestUsers.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm font-medium">暂无数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full" /> 最近游戏记录
                </h3>
                <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                  {data.latestGames.map((g: any) => {
                    const sortedPlayers = [...(g.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
                    return (
                      <div key={g._id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                        {/* Game entry header: Time + Room ID */}
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 border-b border-slate-100/80 pb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-bold">房间: {g.roomId}</span>
                            <span className="text-slate-300">|</span>
                            <span>{new Date(g.completedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {confirmDeleteGameId === g._id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteGame(g._id)}
                                  className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold"
                                >
                                  确认删除
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteGameId(null)}
                                  className="text-[10px] px-2 py-1 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteGameId(g._id)}
                                disabled={deletingGameId === g._id}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="删除该记录"
                              >
                                {deletingGameId === g._id ? <RotateCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Scoreboard horizontal table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <th className="py-2 px-1 text-center w-8">排名</th>
                                <th className="py-2 px-1">玩家</th>
                                <th className="py-2 px-1 text-center w-12">总分</th>
                                <th className="py-2 px-1 text-center w-8">村</th>
                                <th className="py-2 px-1 text-center w-8">城</th>
                                <th className="py-2 px-1 text-center w-8">路</th>
                                <th className="py-2 px-1 text-center w-8">骑</th>
                                <th className="py-2 px-1 text-center w-8">卡</th>
                                <th className="py-2 px-1 text-center w-8">探</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                              {sortedPlayers.map((p, idx) => {
                                const isWinner = p.id === g.winnerId;
                                const isRealPlayer = !p.isBot;
                                return (
                                  <tr key={idx} className={`hover:bg-slate-100/50 transition-colors ${isWinner ? 'bg-yellow-50/20' : ''}`}>
                                    <td className="py-2 px-1 text-center">
                                      <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {idx + 1}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1 font-semibold text-slate-700">
                                      <span 
                                        className={`inline-flex items-center gap-1 ${isWinner ? 'text-yellow-700 font-bold' : ''} ${isRealPlayer ? 'cursor-pointer hover:text-indigo-600 hover:underline' : ''}`}
                                        onClick={() => isRealPlayer && handleOpenUserProfile(p.name)}
                                      >
                                        {p.name} {isWinner && '👑'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1 text-center font-mono font-black text-indigo-600">{p.score || 0}</td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.settlements ? 'text-slate-700 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.settlements || "-"}
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.cities ? 'text-indigo-600 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.cities ? p.breakdown.cities * 2 : "-"}
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.longestRoad ? 'text-orange-600 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.longestRoad ? 2 : "-"}
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.largestArmy ? 'text-red-600 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.largestArmy ? 2 : "-"}
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.vpCards ? 'text-emerald-600 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.vpCards || "-"}
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${p.breakdown?.islandBonus ? 'text-sky-600 font-bold' : 'text-slate-300'}`}>
                                      {p.breakdown?.islandBonus || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  {data.latestGames.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                      暂无数据
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {inspectingUser && (
        <UserProfileModal
          currentUser={inspectingUser}
          onClose={() => setInspectingUser(null)}
          onUpdateSuccess={() => {}}
          onPlayerClick={(name) => handleOpenUserProfile(name)}
        />
      )}
      {inspectingLoading && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}
    </motion.div>
  );
}
