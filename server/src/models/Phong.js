import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phong = sequelize.define('Phong', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_phong: {
    type: DataTypes.STRING,
    allowNull: false
  },
  toa: {
    type: DataTypes.STRING
  },
  co_so: {
    type: DataTypes.STRING
  },
  suc_chua: {
    type: DataTypes.INTEGER
  },
  mo_ta: {
    type: DataTypes.TEXT
  },
  trang_thai: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'Phong',
  timestamps: false
});


export default Phong;