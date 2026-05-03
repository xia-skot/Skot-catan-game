import { io, Socket } from 'socket.io-client';

// Use current origin
const URL = window.location.origin;

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
});
