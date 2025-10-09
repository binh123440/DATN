import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Khoa = sequelize.define('Khoa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_khoa: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'Khoa',
  timestamps: false
});

export default Khoa;
