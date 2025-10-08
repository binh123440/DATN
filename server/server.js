import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { sequelize, testConnection } from './src/config/database.js';
import { setupAssociations } from './src/models/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    message: 'UTE Social API is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection route
app.get('/api/db-test', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'success',
      message: 'Kết nối database thành công!',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Không thể kết nối database',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route không tồn tại'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // 1. Test connection
    console.log('🔄 Đang kết nối database...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Không thể khởi động server do lỗi kết nối database');
      process.exit(1);
    }

    // 2. Setup associations
    console.log('🔄 Đang thiết lập associations...');
    setupAssociations();


    // 3. Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════╗');
      console.log('║   🚀 UTE SOCIAL API SERVER STARTED   ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log('');
      console.log(`📡 Server:      http://localhost:${PORT}`);
      console.log(`🏥 Health:      http://localhost:${PORT}/api/health`);
      console.log(`🗄️  DB Test:     http://localhost:${PORT}/api/db-test`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log('');
      console.log('✅ Sẵn sàng nhận requests!');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Đang tắt server...');
  await sequelize.close();
  console.log('✅ Database connection đã đóng');
  process.exit(0);
});

// Start the server
startServer();
