import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, LayoutGrid, X, LogOut, ArrowLeft, RotateCw, Trash2, Edit2, Save } from 'lucide-react';

export function AdminDashboard({ onLogout, onClose }: { onLogout: () => void, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUsers, setEditingUsers] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex flex-wrap gap-2 items-center">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full" /> 最近注册用户
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">用户名</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">邮箱</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">注册时间</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.latestUsers.map((u: any) => {
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
                              <>{u.username}</>
                            )}
                            {u.role === 'admin' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full relative -top-0.5">管理员</span>}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500">{u.email}</td>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">地图/房号</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">获胜者</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">回合/完成时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.latestGames.map((g: any) => {
                        const winner = g.players?.find((p: any) => p.id === g.winnerId);
                        return (
                          <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-slate-700 whitespace-nowrap">{g.mapType === 'standard' ? '标准大陆' : g.mapType === 'islands' ? '群岛' : '自定义'} <span className="text-[10px] font-mono text-slate-400 block mt-1">Room: {g.roomId}</span></td>
                            <td className="py-4 px-4 text-sm font-bold text-emerald-600">{winner?.name || '未知'} <span className="text-xs text-slate-400 inline-block ml-1">({winner?.score}分)</span></td>
                            <td className="py-4 px-4 text-xs font-mono text-slate-500">回合 {g.turnCount || '-'}<span className="block text-[10px] text-slate-400 mt-1">{new Date(g.completedAt).toLocaleString()}</span></td>
                          </tr>
                        );
                      })}
                      {data.latestGames.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm font-medium">暂无数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
