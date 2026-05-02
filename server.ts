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
  const PORT = Number(process.env.PORT) || 3000;
  
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
  });

  // Log socket errors
  io.engine.on("connection_error", (err) => {
    console.log("Connection error context:", err.req ? "Request available" : "No request");
    console.log("Connection error message:", err.message);
    console.log("Connection error code:", err.code);
    console.log("Connection error context:", err.context);
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
          spectators: [],
          settings: {
            playerCount: 4,
            mapType: 'archipelago',
            botConfig: [false, false, false, false]
          }
        };
        rooms.set(roomId, room);
        console.log('Created room:', roomId, JSON.stringify(room));
      }
      
      const existingPlayer = room.players.find((p: any) => p.id === playerId);
      if (!existingPlayer) {
        // If game started or room full, join as spectator
        if (room.gameState || (room.players.length >= (room.settings?.playerCount || 4))) {
          if (!room.spectators) room.spectators = [];
          const existingSpectator = room.spectators.find((s: any) => s.id === playerId);
          if (!existingSpectator) {
            room.spectators.push({ id: playerId, name: playerName, socketId: socket.id });
          } else {
            existingSpectator.socketId = socket.id;
          }
        } else {
          room.players.push({ id: playerId, name: playerName, isReady: false, socketId: socket.id, disconnected: false });
        }
      } else {
        existingPlayer.socketId = socket.id;
        existingPlayer.name = playerName;
        existingPlayer.disconnected = false;
        // Don't reset ready status if game is already started, so they don't block the UI
        if (!room.gameState) {
          existingPlayer.isReady = false; 
        }
      }
      
      // Fallback: if server thinks current host is a bot or disconnected
      const currentHost = room.players.find((p: any) => p.id === room.hostId);
      if (!currentHost || currentHost.isBot || currentHost.disconnected) {
        room.hostId = playerId;
      }
      
      io.to(roomId).emit('room_state', room);
      
      if (room.gameState) {
        socket.emit('game_init', room.gameState);
      }
    });

    socket.on('leave_room', (roomId: string, playerId: string) => {
      console.log('User leaving room:', roomId, playerId);
      socket.leave(roomId);
      
      const room = rooms.get(roomId);
      if (room) {
        // Handle spectator leaving
        const spectatorIndex = room.spectators?.findIndex((s: any) => s.id === playerId);
        if (spectatorIndex !== undefined && spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
          io.to(roomId).emit('room_state', room);
          return;
        }

        if (!room.gameState) {
          room.players = room.players.filter((p: any) => p.id !== playerId);
          if (room.hostId === playerId && room.players.length > 0) {
            room.hostId = room.players[0].id;
          }
        } else {
          const player = room.players.find((p: any) => p.id === playerId);
          if (player) {
            player.disconnected = true;
            console.log('Player marked disconnected:', playerId);
            // Do not transfer host if the game has started, keep identity
          }
        }
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
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
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = gameState;
      }
      socket.broadcast.to(roomId).emit('game_state_updated', gameState);
    });

    socket.on('react_to_trade', (roomId: string, tradeId: string, playerId: number, reaction: 'accept' | 'reject') => {
      const room = rooms.get(roomId);
      if (room && room.gameState && room.gameState.tradeOffers) {
        const offers = room.gameState.tradeOffers;
        const index = offers.findIndex((o: any) => o.id === tradeId);
        if (index !== -1) {
          const offer = offers[index];
          if (reaction === 'accept') {
            if (!offer.acceptedBy.includes(playerId)) offer.acceptedBy.push(playerId);
            offer.rejectedBy = offer.rejectedBy.filter((id: number) => id !== playerId);
          } else {
            if (!offer.rejectedBy.includes(playerId)) offer.rejectedBy.push(playerId);
            offer.acceptedBy = offer.acceptedBy.filter((id: number) => id !== playerId);
          }
          io.to(roomId).emit('game_state_updated', room.gameState);
        }
      }
    });

    socket.on('finalize_trade', (roomId: string, tradeId: string, partnerId: number) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        const prev = room.gameState;
        const offer = (prev.tradeOffers || []).find((o: any) => o.id === tradeId);
        if (!offer) return;
        const initiator = prev.players.find((p: any) => p.id === offer.initiatorId);
        const partner = prev.players.find((p: any) => p.id === partnerId);
        if (!initiator || !partner) return;

        // Perform trade
        for (const [res, amount] of Object.entries(offer.request)) {
          initiator.resources[res as string] = (initiator.resources[res as string] || 0) + (amount as number);
          partner.resources[res as string] -= (amount as number);
        }
        for (const [res, amount] of Object.entries(offer.offer)) {
          initiator.resources[res as string] -= (amount as number);
          partner.resources[res as string] = (partner.resources[res as string] || 0) + (amount as number);
        }

        offer.status = 'completed';
        offer.completedWith = partnerId;
        io.to(roomId).emit('game_state_updated', room.gameState);
      }
    });

    socket.on('request_sync', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        // Send the cached game state only to the player who requested it
        socket.emit('game_state_updated', room.gameState);
        socket.emit('room_state', room);
      }
    });

    socket.on('reclaim_slot', (roomId: string, newPlayerId: string, oldPlayerId: string) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        // Find the old player in the room list
        const oldPlayerIndex = room.players.findIndex((p: any) => p.id === oldPlayerId);
        if (oldPlayerIndex !== -1 && room.players[oldPlayerIndex].disconnected) {
          // Update the room player list
          room.players[oldPlayerIndex].id = newPlayerId;
          room.players[oldPlayerIndex].socketId = socket.id;
          room.players[oldPlayerIndex].disconnected = false;
          
          // If the old player was the host, transfer host
          if (room.hostId === oldPlayerId) {
            room.hostId = newPlayerId;
          }
          
          // Update the gameState internal player list
          const gamePlayer = room.gameState.players.find((p: any) => p.sessionId === oldPlayerId);
          if (gamePlayer) {
            gamePlayer.sessionId = newPlayerId;
          }
          
          // Fallback: If current host is a bot or offline, or if the old player was host
          const currentHost = room.players.find((p: any) => p.id === room.hostId);
          if (room.hostId === oldPlayerId || !currentHost || currentHost.isBot || currentHost.disconnected) {
            room.hostId = newPlayerId;
          }
          
          io.to(roomId).emit('room_state', room);
          io.to(roomId).emit('game_state_updated', room.gameState);
        }
      }
    });

    socket.on('start_game', (roomId: string, initialGameState: any) => {
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = initialGameState;
      }
      io.to(roomId).emit('game_init', initialGameState);
    });

    socket.on('return_to_lobby', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === playerId) {
        room.gameState = null;
        room.players.forEach((p: any) => {
          p.isReady = false;
        });
        io.to(roomId).emit('room_state', room);
        io.to(roomId).emit('returned_to_lobby');
      }
    });

    socket.on('reset_game', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      // Allow host to reset anytime, or any player to reset if the game is already finished
      if (room && (room.hostId === playerId || (room.gameState && room.gameState.winnerId !== null))) {
        rooms.delete(roomId);
        io.to(roomId).emit('game_reset');
        // Let the clients process the reset event before severing their room connection
        setTimeout(() => {
          io.in(roomId).socketsLeave(roomId);
        }, 100);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      for (const [roomId, room] of rooms.entries()) {
        const spectatorIndex = room.spectators?.findIndex((s: any) => s.socketId === socket.id);
        if (spectatorIndex !== undefined && spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
          io.to(roomId).emit('room_state', room);
          break;
        }

        const playerIndex = room.players.findIndex((p: any) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          if (!room.gameState) {
            const removedPlayer = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            if (room.hostId === removedPlayer.id && room.players.length > 0) {
              room.hostId = room.players[0].id;
            }
          } else {
            room.players[playerIndex].disconnected = true;
            console.log('Player marked disconnected:', room.players[playerIndex].id);
            // Do not transfer host if the game has started, keep identity
          }
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room_state', room);
          }
          break;
        }
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
    console.log(`[Server] Socket.io path: /socket.io`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
