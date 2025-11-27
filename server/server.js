import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Import routes
import baiVietRoutes from './src/routes/baiVietRoutes.js';
import suKienRoutes from './src/routes/suKienRoutes.js';
import dangNhapRoutes from './src/routes/dangNhapRoutes.js';
import binhLuanRoutes from './src/routes/binhLuanRoutes.js';  
import diemRenLuyenRoutes from './src/routes/diemRenLuyenRoutes.js';
import thongBaoRoutes from './src/routes/thongBaoRoutes.js';
import nhomRoutes from './src/routes/nhomRoutes.js';
import searchRoutes from './src/routes/timKiemRoutes.js';
import timKiemRoutes from './src/routes/timKiemRoutes.js';
import tinNhanRoutes from './src/routes/tinNhanRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js'; // Thêm dòng này

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ Cấu hình CORS cho Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // ✅ Thêm polling làm fallback
  allowEIO3: true
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UTE Social API đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', dangNhapRoutes);
app.use('/api/bai-viet', baiVietRoutes);
app.use('/api/su-kien', suKienRoutes);
app.use('/api/binh-luan', binhLuanRoutes);
app.use('/api/diem-ren-luyen', diemRenLuyenRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/nhom', nhomRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tim-kiem', timKiemRoutes);
app.use('/api/chat', tinNhanRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ Socket.IO Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Invalid token'));
  }
});

// ✅ Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userId} connected - Socket ID: ${socket.id}`);

  // Join conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Handle new message
  socket.on('send-message', (data) => {
    try {
      console.log(`Message from user ${socket.userId}:`, data);
      
      // Broadcast to conversation room
      io.to(`conversation-${data.id_cuoc_hoi_thoai}`).emit('new-message', {
        ...data,
        id_nguoi_gui: socket.userId,
        thoi_gian_gui: new Date()
      });
    } catch (error) {
      console.error('Socket send-message error:', error);
    }
  });

  // Handle typing
  socket.on('typing', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-stop-typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.userId} disconnected`);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Khởi động server
const startServer = async () => {
  try {
    // const isConnected = await testConnection();
    
    // if (!isConnected) {
    //   console.error('❌ Không thể kết nối database');
    //   process.exit(1);
    // }

    // await db.sequelize.authenticate();
    // console.log('✅ Models đã được xác thực với database');

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server UTE Social: http://localhost:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📄 Bài viết: http://localhost:${PORT}/api/bai-viet`);
      console.log(`🎉 Sự kiện: http://localhost:${PORT}/api/su-kien\n`);
      console.log(`🔌 Socket.IO ready`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
