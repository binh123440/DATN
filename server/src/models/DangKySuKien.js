import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DangKySuKien = sequelize.define('DangKySuKien', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_su_kien: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SuKien',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  trang_thai: {
    type: DataTypes.ENUM,
    values: ['da_dang_ky', 'da_huy'],
    allowNull: false,
    defaultValue: 'da_dang_ky'
  },
  ngay_gio_dang_ky: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ngay_gio_diem_danh: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'DangKySuKien',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_nguoi_dung', 'id_su_kien']
    },
    {
      fields: ['id_su_kien']
    }
  ]
});

export default DangKySuKien;
