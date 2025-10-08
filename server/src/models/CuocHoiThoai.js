import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CuocHoiThoai = sequelize.define('CuocHoiThoai', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_hoi_thoai: DataTypes.STRING(255),
  loai: {
    type: DataTypes.ENUM,
    values: ['rieng_tu', 'nhom'],
    allowNull: false,
    field: 'loai'
  },
  id_nguoi_tao: DataTypes.INTEGER,
  ngay_tao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CuocHoiThoai',
  timestamps: false
});

export default CuocHoiThoai;
