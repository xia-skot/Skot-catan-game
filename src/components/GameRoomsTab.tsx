import React, { useEffect, useState } from 'react';
import { socketService, RoomState } from '../socketService';
import { Swords, Eye, RefreshCw } from 'lucide-react';

interface GameRoomsTabProps {
  currentUser: { username: string, isAdmin?: boolean } | null;
  onJoinRoom: (roomId: string) => void;
  onSpectateRoom: (roomId: string) => void;
}

export const GameRoomsTab: React.FC<GameRoomsTabProps> = ({ currentUser, onJoinRoom, onSpectateRoom }) => {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = () => {
    socketService.getActiveRooms(currentUser?.isAdmin || false, (fetchedRooms) => {
      setRooms(fetchedRooms);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRooms();
    
    const interval = setInterval(() => {
      fetchRooms();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <h2 className="text-xl font-serif font-black italic text-slate-800 flex items-center gap-2">
          <Swords size={24} className="text-indigo-600" />
          游戏房间
        </h2>
        <button 
          onClick={fetchRooms}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm font-bold">加载中...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm font-bold">当前没有活跃的海域</div>
        ) : (
          rooms.map(room => (
            <div key={room.roomId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest">海域</span>
                  <span className="text-lg font-black text-indigo-700">{room.roomId}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {room.status === 'waiting' ? '约局中' : '游戏中'}
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 font-bold">
                    玩家: <span className="text-slate-800">{room.players.length} / {room.settings?.playerCount || 4}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    观战: <span className="text-slate-800">{room.spectators?.length || 0}</span>
                  </span>
                </div>
                
                {room.status === 'waiting' ? (
                  <button
                    onClick={() => onJoinRoom(room.roomId)}
                    className="px-4 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-colors"
                  >
                    加入海域
                  </button>
                ) : (
                  <button
                    onClick={() => onSpectateRoom(room.roomId)}
                    className="px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    观战
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
