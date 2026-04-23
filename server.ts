import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Database
const db = new Database('game.db');
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    hostId TEXT,
    players TEXT,
    gameState TEXT,
    settings TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
}

interface RoomData {
  hostId: string;
  players: Map<string, LobbyPlayer>;
  gameState: any;
  settings: {
    playerCount: number;
    mapType: string;
    botConfig: boolean[];
  };
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });
  const PORT = 3000;

  // In-memory cache
  const rooms = new Map<string, RoomData>();
  const socketMap = new Map<string, { roomId: string, playerId: string }>();

  // Load existing rooms from DB on startup
  const savedRooms = db.prepare('SELECT * FROM rooms').all();
  savedRooms.forEach((row: any) => {
    const playersArr = JSON.parse(row.players);
    const playersMap = new Map<string, LobbyPlayer>();
    playersArr.forEach((p: LobbyPlayer) => playersMap.set(p.id, p));

    rooms.set(row.id, {
      hostId: row.hostId,
      players: playersMap,
      gameState: row.gameState ? JSON.parse(row.gameState) : null,
      settings: JSON.parse(row.settings)
    });
  });

  const saveRoomToDb = (roomId: string, room: RoomData) => {
    const playersArr = Array.from(room.players.values());
    db.prepare(`
      INSERT INTO rooms (id, hostId, players, gameState, settings, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        hostId = excluded.hostId,
        players = excluded.players,
        gameState = excluded.gameState,
        settings = excluded.settings,
        updatedAt = CURRENT_TIMESTAMP
    `).run(
      roomId,
      room.hostId,
      JSON.stringify(playersArr),
      room.gameState ? JSON.stringify(room.gameState) : null,
      JSON.stringify(room.settings)
    );
  };

  const broadcastRoomState = (roomId: string) => {
    const room = rooms.get(roomId);
    if (room) {
      const state = {
        roomId,
        hostId: room.hostId,
        players: Array.from(room.players.values()),
        settings: room.settings
      };
      io.to(roomId).emit('room_state', state);
      saveRoomToDb(roomId, room);
    }
  };

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      const data = socketMap.get(socket.id);
      if (data) {
        const { roomId, playerId } = data;
        socketMap.delete(socket.id);
        
        const room = rooms.get(roomId);
        if (room) {
          const otherSockets = Array.from(socketMap.values()).filter(
            val => val.roomId === roomId && val.playerId === playerId
          );
          
          if (otherSockets.length === 0) {
            // Keep players in room data for persistence, but mark as "offline" if needed?
            // For now, let's keep the existing logic where they are removed, 
            // but the ROOM persists in DB as long as players are there or gameState exists.
            room.players.delete(playerId);
            if (room.players.size === 0 && !room.gameState) {
              rooms.delete(roomId);
              db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
            } else {
              if (room.hostId === playerId) {
                 const firstPlayer = Array.from(room.players.values())[0];
                 if (firstPlayer) room.hostId = firstPlayer.id;
              }
              broadcastRoomState(roomId);
            }
          }
        }
      }
    });

    socket.on('join_room', (roomId, playerId, playerName) => {
      socket.join(roomId);
      socketMap.set(socket.id, { roomId, playerId });
      
      let room = rooms.get(roomId);
      if (!room) {
        room = {
          hostId: playerId,
          players: new Map(),
          gameState: null,
          settings: { playerCount: 4, mapType: 'standard', botConfig: Array(6).fill(false) }
        };
        rooms.set(roomId, room);
      }
      
      room.players.set(playerId, { id: playerId, name: playerName, isReady: room.hostId === playerId ? true : false });
      broadcastRoomState(roomId);

      if (room.gameState) {
        socket.emit('game_init', room.gameState);
      }
    });

    socket.on('toggle_ready', (roomId, playerId) => {
      const room = rooms.get(roomId);
      if (room) {
        const p = room.players.get(playerId);
        if (p) {
          p.isReady = !p.isReady;
          broadcastRoomState(roomId);
        }
      }
    });

    socket.on('update_settings', (roomId, playerId, newSettings) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === playerId) {
        room.settings = newSettings;
        broadcastRoomState(roomId);
      }
    });

    socket.on('update_game_state', (roomId, newState) => {
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = newState;
        socket.to(roomId).emit('game_state_updated', newState);
        // Direct DB save for game state updates to prevent loss
        saveRoomToDb(roomId, room);
      }
    });

    socket.on('start_game', (roomId, initialGameState) => {
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = initialGameState;
        io.to(roomId).emit('game_init', initialGameState);
        saveRoomToDb(roomId, room);
      }
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', roomsCount: rooms.size });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
