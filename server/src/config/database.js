import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Tạo instance Sequelize để kết nối PostgreSQL
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Tắt logging SQL queries, bật lên khi debug: console.log
    pool: {
      max: 10,        // Số kết nối tối đa
      min: 0,        // Số kết nối tối thiểu
      acquire: 60000, // Thời gian chờ tối đa để lấy kết nối (ms)
      idle: 10000    // Thời gian tối đa một kết nối có thể idle (ms)
    },
    define: {
      freezeTableName: true,
      timestamps: false
    }
  }
);

// Hàm kiểm tra kết nối database
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công!');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    return true;
  } catch (error) {
    console.error('❌ Không thể kết nối PostgreSQL:', error.message);
    return false;
  }
};


export default sequelize;
