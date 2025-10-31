import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BinhLuan = sequelize.define('BinhLuan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_bai_viet: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_tac_gia: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_binh_luan_cha: DataTypes.INTEGER,
  noi_dung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ngay_tao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'BinhLuan',
  timestamps: false,
  indexes: [
    { fields: ['id_bai_viet'] },
    { fields: ['id_tac_gia'] }
  ]
});

export default BinhLuan;
