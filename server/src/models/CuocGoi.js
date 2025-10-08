import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CuocGoi = sequelize.define('CuocGoi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_nguoi_goi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  loai: {
    type: DataTypes.ENUM('thoai', 'hinh'),
    allowNull: false
  },
  thoi_gian_bat_dau: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  thoi_gian_ket_thuc: DataTypes.DATE,
  url_ghi_am: DataTypes.TEXT
}, {
  tableName: 'CuocGoi',
  timestamps: false
});

export default CuocGoi;
