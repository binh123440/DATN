import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ThanhVienHoiThoai = sequelize.define('ThanhVienHoiThoai', {
  id_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  vai_tro: {
    type: DataTypes.ENUM,
    values: ['thanh_vien', 'quan_tri_vien'],
    allowNull: false,
    defaultValue: 'thanh_vien',
    field: 'vai_tro'
  },
  ngay_gio_tham_gia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ThanhVienHoiThoai',
  timestamps: false,
  indexes: [{ fields: ['id_cuoc_hoi_thoai'] }]
});

export default ThanhVienHoiThoai;
