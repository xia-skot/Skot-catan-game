import { io, Socket } from 'socket.io-client';

export interface RoomState {
  roomId: string;
  hostId: string;
  players: { id: string; name: string; isReady: boolean }[];
  settings: {
    playerCount: number;
    mapType: string;
    botConfig: boolean[];
  };
}

class SocketService {
  private socket: Socket | null = null;
  public playerId: string;
  private callbacks: Map<string, any> = new Map();

  constructor() {
    let storedId = sessionStorage.getItem('catan_player_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('catan_player_id', storedId);
    }
    this.playerId = storedId;
  }

  connect() {
    if (this.socket?.connected) return;
    
    // If socket exists but disconnected, just connect it
    if (this.socket) {
      this.socket.connect();
      return;
    }

    // Create new socket with websocket preferred
    this.socket = io(window.location.origin, { 
      transports: ['websocket', 'polling'], // Prefer websocket
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    // Re-bind all sticky listeners whenever a new socket is created
    this.callbacks.forEach((callback, event) => {
      this.socket?.on(event, callback);
    });

    this.socket.on('connect', () => {
      console.log('Connected to server. ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      // We don't nullify it here if we want to reuse it, 
      // but if we do, connect() handles creating a new one.
    }
  }

  private emit(event: string, ...args: any[]) {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected. Cannot emit ${event}. Reconnecting...`);
      this.connect();
      // Optional: buffer or retry
      return;
    }
    try {
      this.socket.emit(event, ...args);
    } catch (err) {
      console.error(`Error emitting ${event}:`, err);
    }
  }

  joinRoom(roomId: string, playerName: string) {
    this.emit('join_room', roomId, this.playerId, playerName);
  }

  leaveRoom(roomId: string) {
    this.emit('leave_room', roomId, this.playerId);
  }

  toggleReady(roomId: string) {
    this.emit('toggle_ready', roomId, this.playerId);
  }

  updateSettings(roomId: string, settings: any) {
    this.emit('update_settings', roomId, this.playerId, settings);
  }

  sendGameState(roomId: string, gameState: any) {
    this.emit('update_game_state', roomId, gameState);
  }

  startGame(roomId: string, initialGameState: any) {
    this.emit('start_game', roomId, initialGameState);
  }

  resetGame(roomId: string) {
    console.log(`[Socket] Requesting game reset for room: ${roomId}`);
    this.emit('reset_game', roomId, this.playerId);
  }

  onRoomState(callback: (state: RoomState) => void) {
    this.registerCallback('room_state', callback);
  }

  onGameInit(callback: (state: any) => void) {
    this.registerCallback('game_init', callback);
  }

  onGameUpdate(callback: (state: any) => void) {
    this.registerCallback('game_state_updated', callback);
  }

  onGameReset(callback: () => void) {
    this.registerCallback('game_reset', callback);
  }

  private registerCallback(event: string, callback: any) {
    console.log(`[Socket] Registering sticky listener for: ${event}`);
    this.callbacks.set(event, callback);
    if (this.socket) {
      this.socket.off(event);
      this.socket.on(event, (...args: any[]) => {
        console.log(`[Socket] Event received: ${event}`, args);
        callback(...args);
      });
    }
  }
}

export const socketService = new SocketService();
