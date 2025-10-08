import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DangKySuKien = sequelize.define('DangKySuKien', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_su_kien: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.ENUM,
    values: ['da_dang_ky', 'da_huy'],
    allowNull: false,
    defaultValue: 'da_dang_ky',
    field: 'trang_thai'
  },
  ngay_dang_ky: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ngay_gio_diem_danh: DataTypes.DATE
}, {
  tableName: 'DangKySuKien',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_nguoi_dung', 'id_su_kien']
    }
  ]
});

export default DangKySuKien;
