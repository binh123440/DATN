import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SuKien = sequelize.define('SuKien', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_tao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_bai_viet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'BaiViet',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
    id_phong: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Phong',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ten_su_kien: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mo_ta: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ke_hoach_chi_tiet: {
      type: DataTypes.JSONB, // ✅ Phải là JSONB, không phải JSON
      allowNull: true,
      defaultValue: {}
  },
  dia_diem: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  thoi_gian_bat_dau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  thoi_gian_ket_thuc: {
  type: DataTypes.DATE,
  allowNull: true
  },
  so_luong_toi_da: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  diem_thuong: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.ENUM('cho_duyet', 'da_duyet', 'da_huy'),
    allowNull: false,
    defaultValue: 'cho_duyet'
  },
  id_nguoi_duyet: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NguoiDung',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'SuKien',
  timestamps: false
});

export default SuKien;
