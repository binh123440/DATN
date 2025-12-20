// ✅ Load environment variables TRƯỚC TIÊN
import dotenv from 'dotenv';
dotenv.config();

// ✅ Sau đó mới import các module khác
import express from 'express';
import cors from 'cors';
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
import timKiemRoutes from './src/routes/timKiemRoutes.js';
import tinNhanRoutes from './src/routes/tinNhanRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import nguoiDungRoutes from './src/routes/nguoiDungRoutes.js';
import phongRoutes from './src/routes/phongRoutes.js';

const app = express();
const httpServer = createServer(app);

// ✅ Cấu hình CORS cho Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UTE Social API hoạt động bình thường',
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      cloudinary_configured: !!process.env.CLOUDINARY_API_KEY
    }
  });
});

// Trả 204 cho favicon để tránh 404 logs từ browser
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// API Routes
app.use('/api/auth', dangNhapRoutes);
app.use('/api/bai-viet', baiVietRoutes);
app.use('/api/su-kien', suKienRoutes);
app.use('/api/binh-luan', binhLuanRoutes);
app.use('/api/diem-ren-luyen', diemRenLuyenRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/nhom', nhomRoutes);
app.use('/api/search', timKiemRoutes);
app.use('/api/tim-kiem', timKiemRoutes);
app.use('/api/chat', tinNhanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nguoi-dung', nguoiDungRoutes);
app.use('/api/phong', phongRoutes);

// 404 Handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userId} connected`);

  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`conversation-${data.id_cuoc_hoi_thoai}`).emit('new-message', {
      ...data,
      id_nguoi_gui: socket.userId,
      thoi_gian_gui: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.userId} disconnected`);
  });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server UTE Social: http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'Chưa cấu hình'}\n`);
});

export default app;
