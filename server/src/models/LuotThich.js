import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LuotThich = sequelize.define('LuotThich', {
  id_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  id_doi_tuong: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  loai_doi_tuong: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  ngay_thich: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'LuotThich',
  timestamps: false,
  indexes: [
    { fields: ['id_doi_tuong', 'loai_doi_tuong'] }
  ]
});

export default LuotThich;
