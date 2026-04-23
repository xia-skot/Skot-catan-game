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

  constructor() {
    let storedId = sessionStorage.getItem('catan_player_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('catan_player_id', storedId);
    }
    this.playerId = storedId;
  }

  connect() {
    if (this.socket) return;
    this.socket = io({ transports: ['websocket'] });

    this.socket.on('connect', () => {
      console.log('Connected to server with Socket ID:', this.socket?.id, ', persistent Player ID:', this.playerId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, playerName: string) {
    this.socket?.emit('join_room', roomId, this.playerId, playerName);
  }

  toggleReady(roomId: string) {
    this.socket?.emit('toggle_ready', roomId, this.playerId);
  }

  updateSettings(roomId: string, settings: any) {
    this.socket?.emit('update_settings', roomId, this.playerId, settings);
  }

  sendGameState(roomId: string, gameState: any) {
    this.socket?.emit('update_game_state', roomId, gameState);
  }

  startGame(roomId: string, initialGameState: any) {
    this.socket?.emit('start_game', roomId, initialGameState);
  }

  onRoomState(callback: (state: RoomState) => void) {
    this.socket?.off('room_state'); // Clear old listeners to avoid duplicates
    this.socket?.on('room_state', callback);
  }

  onGameInit(callback: (state: any) => void) {
    this.socket?.off('game_init');
    this.socket?.on('game_init', callback);
  }

  onGameUpdate(callback: (state: any) => void) {
    this.socket?.off('game_state_updated');
    this.socket?.on('game_state_updated', callback);
  }
}

export const socketService = new SocketService();
