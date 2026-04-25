import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: true, // Allow all origins explicitly
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/proxy-image', async (req, res) => {
    try {
      let imageUrl = req.query.url as string;
      if (!imageUrl) {
        res.status(400).send('Missing url parameter');
        return;
      }

      // Encode spaces in url just in case
      imageUrl = imageUrl.replace(/ /g, '%20');

      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        res.status(response.status).send('Failed to fetch image');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Proxy image error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Socket.io logic
  const rooms = new Map<string, any>();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (roomId: string, playerId: string, playerName: string) => {
      console.log('User joining room:', roomId, playerId);
      socket.join(roomId);
      
      let room = rooms.get(roomId);
      console.log('Room found:', !!room);
      if (!room) {
        room = {
          roomId,
          hostId: playerId,
          players: [],
          settings: {
            playerCount: 4,
            mapType: 'standard',
            botConfig: [false, false, false, false]
          }
        };
        rooms.set(roomId, room);
        console.log('Created room:', roomId, JSON.stringify(room));
      }
      
      const existingPlayer = room.players.find((p: any) => p.id === playerId);
      if (!existingPlayer) {
        room.players.push({ id: playerId, name: playerName, isReady: false, socketId: socket.id, disconnected: false });
      } else {
        existingPlayer.socketId = socket.id;
        existingPlayer.name = playerName;
        existingPlayer.disconnected = false;
        // Reset ready status if player is re-joining
        existingPlayer.isReady = false; 
      }
      
      io.to(roomId).emit('room_state', room);
    });

    socket.on('leave_room', (roomId: string, playerId: string) => {
      console.log('User leaving room:', roomId, playerId);
      socket.leave(roomId);
      
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === playerId);
        if (player) {
          player.disconnected = true;
          console.log('Player marked disconnected:', playerId);
          
          if (room.hostId === playerId) {
            const connectedPlayers = room.players.filter((p: any) => !p.disconnected);
            if (connectedPlayers.length > 0) {
              room.hostId = connectedPlayers[0].id;
              console.log('New host assigned:', room.hostId);
            }
          }
          
          io.to(roomId).emit('room_state', room);
        }
      }
    });

    socket.on('toggle_ready', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === playerId);
        if (player) {
          player.isReady = !player.isReady;
          io.to(roomId).emit('room_state', room);
        }
      }
    });

    socket.on('update_settings', (roomId: string, playerId: string, settings: any) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === playerId) {
        room.settings = settings;
        io.to(roomId).emit('room_state', room);
      }
    });

    socket.on('update_game_state', (roomId: string, gameState: any) => {
      io.to(roomId).emit('game_state_updated', gameState);
    });

    socket.on('start_game', (roomId: string, initialGameState: any) => {
      io.to(roomId).emit('game_init', initialGameState);
    });

    socket.on('reset_game', (roomId: string, playerId: string) => {
      rooms.delete(roomId);
      io.to(roomId).emit('game_reset');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Also need to find room and mark player as disconnected
      for (const [roomId, room] of rooms.entries()) {
        const player = room.players.find((p: any) => p.socketId === socket.id);
        if (player) {
          player.disconnected = true;
          console.log('Player marked disconnected:', player.id);
          
          if (room.hostId === player.id) {
            const connectedPlayers = room.players.filter((p: any) => !p.disconnected);
            if (connectedPlayers.length > 0) {
              room.hostId = connectedPlayers[0].id;
              console.log('New host assigned:', room.hostId);
            }
          }
          
          io.to(roomId).emit('room_state', room);
          break;
        }
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
