import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
  }

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Không tìm thấy token để kết nối socket');
      return;
    }

    if (this.socket?.connected || this.isConnecting) {
      console.log('⚠️ Socket đã kết nối hoặc đang kết nối');
      return;
    }

    this.isConnecting = true;

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    console.log('🔌 Đang kết nối socket tới:', serverUrl);

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket đã kết nối thành công - ID:', this.socket.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket ngắt kết nối:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Lỗi kết nối socket:', error.message);
      this.isConnecting = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Đang ngắt kết nối socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  joinConversation(conversationId) {
    if (this.socket?.connected) {
      console.log('📥 Tham gia cuộc hội thoại:', conversationId);
      this.socket.emit('join-conversation', conversationId);
    } else {
      console.warn('⚠️ Socket chưa kết nối, không thể tham gia cuộc hội thoại');
    }
  }

  sendMessage(data) {
    if (this.socket?.connected) {
      console.log('📤 Gửi tin nhắn:', data);
      this.socket.emit('send-message', data);
    } else {
      console.warn('⚠️ Socket chưa kết nối, không thể gửi tin nhắn');
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message');
    }
  }

  sendTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId });
    }
  }

  sendStopTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('stop-typing', { conversationId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stop-typing', callback);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();