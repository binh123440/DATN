import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThongBao = sequelize.define('ThongBao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_nguoi_nhan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    }
  },
  id_nguoi_hanh_dong: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'id'
    }
  },
  loai: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'like_bai_viet, binh_luan_bai_viet, tra_loi_binh_luan, su_kien_moi, duyet_bai_viet, tu_choi_bai_viet, diem_danh_thanh_cong, nhan_diem_thuong'
  },
  id_muc_tieu: {
    type: DataTypes.INTEGER,
    comment: 'ID của bài viết, sự kiện, bình luận...'
  },
  loai_muc_tieu: {
    type: DataTypes.STRING(50),
    comment: 'bai_viet, su_kien, binh_luan'
  },
  da_doc: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ngay_tao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ThongBao',
  timestamps: false,
  indexes: [
    { fields: ['id_nguoi_nhan'] },
    { fields: ['da_doc'] },
    { fields: ['ngay_tao'] }
  ]
});

export default ThongBao;
