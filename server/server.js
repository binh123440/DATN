import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './src/config/database.js';
import db from './src/models/index.js';

// Import routes
import baiVietRoutes from './src/routes/baiVietRoutes.js';
import suKienRoutes from './src/routes/suKienRoutes.js';
import dangNhapRoutes from './src/routes/dangNhapRoutes.js';  

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
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

// Khởi động server
const startServer = async () => {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Không thể kết nối database');
      process.exit(1);
    }

    await db.sequelize.authenticate();
    console.log('✅ Models đã được xác thực với database');

    app.listen(PORT, () => {
      console.log(`\n🚀 Server UTE Social: http://localhost:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📄 Bài viết: http://localhost:${PORT}/api/bai-viet`);
      console.log(`🎉 Sự kiện: http://localhost:${PORT}/api/su-kien\n`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
