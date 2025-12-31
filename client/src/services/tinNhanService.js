import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.activeConversationId = null;

    // Fallback polling khi socket mất kết nối
    this.fallbackPoller = null; // async function
    this.fallbackPollingMs = 5000;
    this.fallbackTimerId = null;
    this.isFallbackPolling = false;

    // Watchdog: nếu socket "đứng"/mất kết nối lâu thì tự thử connect lại
    this.ensureConnectedMs = 10000;
    this.ensureTimerId = null;

    this._visibilityHandlerBound = false;
    this._coreListenersBound = false;
  }

  bindVisibilityHandler() {
    if (this._visibilityHandlerBound) return;
    this._visibilityHandlerBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.socket?.connected) {
          this.connect();
          this.startFallbackPolling();
        }
      }
    });
  }

  bindCoreListeners() {
    if (!this.socket || this._coreListenersBound) return;
    this._coreListenersBound = true;

    this.socket.on('connect', () => {
      console.log('✅ Socket đã kết nối thành công - ID:', this.socket.id);
      this.isConnecting = false;

      // Có socket lại thì tắt fallback polling
      this.stopFallbackPolling();

      // Auto join lại cuộc hội thoại đang xem sau khi connect/reconnect
      if (this.activeConversationId != null) {
        console.log('📥 Auto join lại cuộc hội thoại:', this.activeConversationId);
        this.socket.emit('join-conversation', this.activeConversationId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket ngắt kết nối:', reason);
      this.isConnecting = false;
      this.startFallbackPolling();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Lỗi kết nối socket:', error?.message || error);
      this.isConnecting = false;
      this.startFallbackPolling();
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  setFallbackPoller(poller, { intervalMs } = {}) {
    this.fallbackPoller = typeof poller === 'function' ? poller : null;
    if (Number.isFinite(intervalMs) && intervalMs > 0) {
      this.fallbackPollingMs = intervalMs;
    }

    if (!this.socket?.connected) this.startFallbackPolling();
  }

  startFallbackPolling() {
    if (this.isFallbackPolling) return;
    if (!this.fallbackPoller) return;
    if (this.socket?.connected) return;

    this.isFallbackPolling = true;

    Promise.resolve()
      .then(() => this.fallbackPoller({ conversationId: this.activeConversationId }))
      .catch((err) => console.error('❌ Lỗi fallback poller:', err));

    this.fallbackTimerId = setInterval(() => {
      if (this.socket?.connected) {
        this.stopFallbackPolling();
        return;
      }

      Promise.resolve()
        .then(() => this.fallbackPoller({ conversationId: this.activeConversationId }))
        .catch((err) => console.error('❌ Lỗi fallback poller:', err));
    }, this.fallbackPollingMs);
  }

  stopFallbackPolling() {
    this.isFallbackPolling = false;
    if (this.fallbackTimerId) {
      clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }

  startEnsureConnected() {
    if (this.ensureTimerId) return;

    this.ensureTimerId = setInterval(() => {
      if (!this.socket?.connected && !this.isConnecting) {
        this.connect();
        this.startFallbackPolling();
      }
    }, this.ensureConnectedMs);
  }

  stopEnsureConnected() {
    if (this.ensureTimerId) {
      clearInterval(this.ensureTimerId);
      this.ensureTimerId = null;
    }
  }

  connect() {
    this.bindVisibilityHandler();

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Không tìm thấy token để kết nối socket');
      return;
    }

    const serverUrl =
      import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    // ✅ Nếu đã có socket instance -> chỉ connect lại, KHÔNG tạo socket mới
    if (this.socket) {
      if (this.socket.connected) return;
      if (this.isConnecting) return; // ✅ FIX: thêm ngoặc

      this.isConnecting = true;
      this.socket.auth = { token };
      this.startEnsureConnected();

      try {
        this.socket.connect();
      } catch (e) {
        console.error('❌ socket.connect() lỗi:', e);
        this.isConnecting = false;
        this.startFallbackPolling();
      }
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    console.log('🔌 Đang kết nối socket tới:', serverUrl);

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });

    this.bindCoreListeners();
    this.startEnsureConnected();
  }

  disconnect() {
    this.stopFallbackPolling();
    this.stopEnsureConnected();

    if (this.socket) {
      console.log('🔌 Đang ngắt kết nối socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this._coreListenersBound = false;
    }
  }

  joinConversation(conversationId) {
    this.activeConversationId = conversationId;

    // ✅ Nếu chưa có socket / socket đang rớt => chủ động connect lại
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket chưa kết nối, sẽ auto-join khi kết nối lại');
      this.connect();
      this.startFallbackPolling();
      return;
    }

    console.log('📥 Tham gia cuộc hội thoại:', conversationId);
    this.socket.emit('join-conversation', conversationId);
  }

  sendMessage(data) {
    if (this.socket?.connected) {
      console.log('📤 Gửi tin nhắn:', data);
      this.socket.emit('send-message', data);
      return;
    }

    console.warn('⚠️ Socket chưa kết nối, không thể gửi tin nhắn');
    this.connect();
    this.startFallbackPolling();
  }

  onNewMessage(callback) {
    if (this.socket) this.socket.on('new-message', callback);
  }

  offNewMessage(callback) {
    if (!this.socket) return;
    if (callback) this.socket.off('new-message', callback);
    else this.socket.off('new-message');
  }

  sendTyping(conversationId) {
    if (this.socket?.connected) this.socket.emit('typing', { conversationId });
  }

  sendStopTyping(conversationId) {
    if (this.socket?.connected) this.socket.emit('stop-typing', { conversationId });
  }

  onUserTyping(callback) {
    if (this.socket) this.socket.on('user-typing', callback);
  }

  offUserTyping(callback) {
    if (!this.socket) return;
    if (callback) this.socket.off('user-typing', callback);
    else this.socket.off('user-typing');
  }

  onUserStopTyping(callback) {
    if (this.socket) this.socket.on('user-stop-typing', callback);
  }

  offUserStopTyping(callback) {
    if (!this.socket) return;
    if (callback) this.socket.off('user-stop-typing', callback);
    else this.socket.off('user-stop-typing');
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// ✅ Singleton xuyên HMR (Vite): tránh tạo nhiều instance => tránh "connect 1 nơi, join 1 nơi"
const GLOBAL_KEY = '__UTE_SOCIAL_SOCKET_SERVICE__';
const socketService = globalThis[GLOBAL_KEY] || new SocketService();
globalThis[GLOBAL_KEY] = socketService;

export default socketService;