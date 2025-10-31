import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './src/config/database.js';
import db from './src/models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
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

// Khởi động server
const startServer = async () => {
  try {
    // Kiểm tra kết nối database
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Không thể kết nối database. Server không khởi động.');
      process.exit(1);
    }

    // ✅ CHỈ xác thực models, KHÔNG sync vì schema đã được tạo bằng SQL
    // Database schema đã được tạo sẵn bởi SQL script
    await db.sequelize.authenticate();
    console.log('✅ Models đã được xác thực với database');

    // Khởi động server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
