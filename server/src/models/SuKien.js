import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SuKien = sequelize.define('SuKien', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_tao: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_bai_viet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  ten_su_kien: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mo_ta: DataTypes.TEXT,
  dia_diem: DataTypes.STRING(255),
  thoi_gian_bat_dau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  so_luong_toi_da: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  diem_thuong: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.ENUM,
    values: ['cho_duyet', 'da_duyet', 'da_tu_choi'],
    allowNull: false,
    defaultValue: 'cho_duyet',
    field: 'trang_thai'
  },
  id_nguoi_duyet: DataTypes.INTEGER
}, {
  tableName: 'SuKien',
  timestamps: false
});

export default SuKien;
