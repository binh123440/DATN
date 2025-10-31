import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThanhVienHoiThoai = sequelize.define('ThanhVienHoiThoai', {
  id_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_cuoc_hoi_thoai: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'CuocHoiThoai',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  vai_tro: {
    type: DataTypes.ENUM,
    values: ['thanh_vien', 'quan_tri_vien'],
    allowNull: false,
    defaultValue: 'thanh_vien'
  },
  ngay_gio_tham_gia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ThanhVienHoiThoai',
  timestamps: false,
  indexes: [
    {
      fields: ['id_cuoc_hoi_thoai']
    }
  ]
});

export default ThanhVienHoiThoai;
