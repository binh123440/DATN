import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BaiViet = sequelize.define('BaiViet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_tac_gia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_bai_viet_goc: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'BaiViet',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'CuocHoiThoai',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  noi_dung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media_urls: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  media_type: {
    type: DataTypes.ENUM('image', 'video', 'mixed'),
    allowNull: true
  },
  trang_thai: {
    type: DataTypes.ENUM('cho_duyet', 'da_duyet', 'da_huy'),
    allowNull: false,
    defaultValue: 'cho_duyet'
  },
  id_nguoi_duyet: {
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
  tableName: 'BaiViet',
  timestamps: false,
  indexes: [
    { fields: ['id_tac_gia'] },
    { fields: ['id_cuoc_hoi_thoai'] },
    { fields: ['trang_thai'] }
  ]
});

export default BaiViet;
