import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('joinChat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leaveChat', chatId);
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  emitTyping(chatId: string, isTyping: boolean) {
    if (this.socket && this.userId) {
      this.socket.emit('typing', {
        chatId,
        userId: this.userId,
        isTyping
      });
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('newMessage');
    }
  }

  offUserTyping() {
    if (this.socket) {
      this.socket.off('userTyping');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();