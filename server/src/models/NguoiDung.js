import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NguoiDung = sequelize.define('NguoiDung', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ho_ten: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // Thông tin định danh (SV)
  ma_sinh_vien: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  mat_khau_bam: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  vai_tro: {
    type: DataTypes.ARRAY(DataTypes.ENUM({
      values: ['sinh_vien', 'giao_vien', 'doanh_nghiep', 'quan_tri_vien', 'dieu_phoi_vien'],
      name: 'vai_tro_nguoi_dung_enum' // Tên ENUM type trong database
    })),
    allowNull: false,
    defaultValue: []
  },
  // Thông tin cá nhân
  dong_gioi_thieu: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ngay_sinh: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  so_dien_thoai: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  anh_dai_dien_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  anh_bia_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  anh_nhan_dien_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Thông tin sinh viên
  id_nganh: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Nganh',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  lop_sh: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tong_diem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ngay_tao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'NguoiDung',
  timestamps: false,
  indexes: [
    {
      fields: ['id_nganh']
    }
  ]
});

export default NguoiDung;
