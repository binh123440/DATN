import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TinNhan = sequelize.define('TinNhan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_nguoi_gui: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  noi_dung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  thoi_gian_gui: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'TinNhan',
  timestamps: false,
  indexes: [
    { fields: ['id_cuoc_hoi_thoai'] },
    { fields: ['id_nguoi_gui'] }
  ]
});

export default TinNhan;
