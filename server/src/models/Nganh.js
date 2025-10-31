import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Nganh = sequelize.define('Nganh', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_nganh: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  id_khoa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Khoa',
      key: 'id'
    },
    onDelete: 'RESTRICT'
  }
}, {
  tableName: 'Nganh',
  timestamps: false,
  indexes: [
    {
      fields: ['id_khoa']
    }
  ]
});

export default Nganh;
