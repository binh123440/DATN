import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

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
    validate: { isEmail: true }
  },
  mat_khau_bam: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  vai_tro: {
    type: DataTypes.ENUM,
    values: ['sinh_vien', 'giao_vien', 'doanh_nghiep', 'quan_tri_vien', 'dieu_phoi_vien'],
    allowNull: false,
    // Sử dụng ENUM đã tạo sẵn trong database
    field: 'vai_tro'
  },
  dong_gioi_thieu: DataTypes.TEXT,
  ngay_sinh: DataTypes.DATEONLY,
  so_dien_thoai: {
    type: DataTypes.STRING(20),
    unique: true
  },
  anh_dai_dien_url: DataTypes.TEXT,
  anh_bia_url: DataTypes.TEXT,
  anh_nhan_dien_url: DataTypes.TEXT,
  id_nganh: DataTypes.INTEGER,
  lop: DataTypes.STRING(100),
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
  timestamps: false
});

export default NguoiDung;
