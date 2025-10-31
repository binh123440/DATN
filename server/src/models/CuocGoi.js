import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CuocGoi = sequelize.define('CuocGoi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CuocHoiThoai',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_nguoi_goi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  loai: {
    type: DataTypes.ENUM,
    values: ['thoai', 'hinh'],
    allowNull: false
  },
  thoi_gian_bat_dau: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  thoi_gian_ket_thuc: {
    type: DataTypes.DATE,
    allowNull: true
  },
  url_ghi_am: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'CuocGoi',
  timestamps: false
});

export default CuocGoi;
