import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThongBao = sequelize.define('ThongBao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_nhan: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_nguoi_hanh_dong: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  loai: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  id_muc_tieu: DataTypes.INTEGER,
  loai_muc_tieu: DataTypes.STRING(50),
  da_doc: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ngay_tao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ThongBao',
  timestamps: false,
  indexes: [{ fields: ['id_nguoi_nhan'] }]
});

export default ThongBao;
