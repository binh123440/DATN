import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const BaiViet = sequelize.define('BaiViet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_tac_gia: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_bai_viet_goc: DataTypes.INTEGER,
  id_cuoc_hoi_thoai: DataTypes.INTEGER,
  noi_dung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.ENUM,
    values: ['cho_duyet', 'da_duyet', 'da_tu_choi'],
    allowNull: false,
    defaultValue: 'cho_duyet',
    field: 'trang_thai'
  },
  id_nguoi_duyet: DataTypes.INTEGER,
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
    { fields: ['id_cuoc_hoi_thoai'] }
  ]
});

export default BaiViet;
