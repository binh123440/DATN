import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CuocHoiThoai = sequelize.define('CuocHoiThoai', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_hoi_thoai: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  loai: {
    type: DataTypes.ENUM,
    values: ['rieng_tu', 'nhom'],
    allowNull: false
  },
  id_nguoi_tao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
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
