import { sequelize } from '../config/database.js';

// Import models
import NguoiDung from './NguoiDung.js';
import Khoa from './Khoa.js';
import Nganh from './Nganh.js';
import CuocHoiThoai from './CuocHoiThoai.js';
import ThanhVienHoiThoai from './ThanhVienHoiThoai.js';
import TinNhan from './TinNhan.js';
import CuocGoi from './CuocGoi.js';
import BaiViet from './BaiViet.js';
import BinhLuan from './BinhLuan.js';
import LuotThich from './LuotThich.js';
import SuKien from './SuKien.js';
import DangKySuKien from './DangKySuKien.js';
import ThongBao from './ThongBao.js';

// Định nghĩa relationships
const setupAssociations = () => {
  // Khoa - Nganh
  Khoa.hasMany(Nganh, { foreignKey: 'id_khoa', onDelete: 'RESTRICT' });
  Nganh.belongsTo(Khoa, { foreignKey: 'id_khoa' });

  // Nganh - NguoiDung
  Nganh.hasMany(NguoiDung, { foreignKey: 'id_nganh', onDelete: 'SET NULL' });
  NguoiDung.belongsTo(Nganh, { foreignKey: 'id_nganh' });

  // CuocHoiThoai - NguoiDung (creator)
  NguoiDung.hasMany(CuocHoiThoai, { foreignKey: 'id_nguoi_tao', onDelete: 'SET NULL' });
  CuocHoiThoai.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_tao', as: 'nguoi_tao' });

  // ThanhVienHoiThoai (many-to-many)
  NguoiDung.belongsToMany(CuocHoiThoai, { through: ThanhVienHoiThoai, foreignKey: 'id_nguoi_dung', onDelete: 'CASCADE' });
  CuocHoiThoai.belongsToMany(NguoiDung, { through: ThanhVienHoiThoai, foreignKey: 'id_cuoc_hoi_thoai', onDelete: 'CASCADE' });

  // TinNhan
  CuocHoiThoai.hasMany(TinNhan, { foreignKey: 'id_cuoc_hoi_thoai', onDelete: 'CASCADE' });
  TinNhan.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai' });
  NguoiDung.hasMany(TinNhan, { foreignKey: 'id_nguoi_gui', onDelete: 'CASCADE' });
  TinNhan.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_gui', as: 'nguoi_gui' });

  // CuocGoi
  CuocHoiThoai.hasMany(CuocGoi, { foreignKey: 'id_cuoc_hoi_thoai', onDelete: 'CASCADE' });
  CuocGoi.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai' });
  NguoiDung.hasMany(CuocGoi, { foreignKey: 'id_nguoi_goi', onDelete: 'CASCADE' });
  CuocGoi.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_goi', as: 'nguoi_goi' });

  // BaiViet
  NguoiDung.hasMany(BaiViet, { foreignKey: 'id_tac_gia', onDelete: 'CASCADE' });
  BaiViet.belongsTo(NguoiDung, { foreignKey: 'id_tac_gia', as: 'tac_gia' });
  BaiViet.hasOne(BaiViet, { foreignKey: 'id_bai_viet_goc', onDelete: 'CASCADE', as: 'bai_viet_goc' });
  CuocHoiThoai.hasMany(BaiViet, { foreignKey: 'id_cuoc_hoi_thoai', onDelete: 'CASCADE' });
  BaiViet.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai' });
  NguoiDung.hasMany(BaiViet, { foreignKey: 'id_nguoi_duyet', onDelete: 'SET NULL', as: 'bai_viet_da_duyet' });
  BaiViet.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_duyet', as: 'nguoi_duyet' });

  // BinhLuan
  BaiViet.hasMany(BinhLuan, { foreignKey: 'id_bai_viet', onDelete: 'CASCADE' });
  BinhLuan.belongsTo(BaiViet, { foreignKey: 'id_bai_viet' });
  NguoiDung.hasMany(BinhLuan, { foreignKey: 'id_tac_gia', onDelete: 'CASCADE' });
  BinhLuan.belongsTo(NguoiDung, { foreignKey: 'id_tac_gia', as: 'tac_gia' });
  BinhLuan.hasOne(BinhLuan, { foreignKey: 'id_binh_luan_cha', onDelete: 'CASCADE', as: 'binh_luan_cha' });

  // LuotThich
  NguoiDung.hasMany(LuotThich, { foreignKey: 'id_nguoi_dung', onDelete: 'CASCADE' });
  LuotThich.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_dung' });

  // SuKien
  NguoiDung.hasMany(SuKien, { foreignKey: 'id_nguoi_tao', onDelete: 'CASCADE' });
  SuKien.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_tao', as: 'nguoi_tao' });
  BaiViet.hasOne(SuKien, { foreignKey: 'id_bai_viet', onDelete: 'CASCADE' });
  SuKien.belongsTo(BaiViet, { foreignKey: 'id_bai_viet' });
  NguoiDung.hasMany(SuKien, { foreignKey: 'id_nguoi_duyet', onDelete: 'SET NULL', as: 'su_kien_da_duyet' });
  SuKien.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_duyet', as: 'nguoi_duyet' });

  // DangKySuKien
  NguoiDung.hasMany(DangKySuKien, { foreignKey: 'id_nguoi_dung', onDelete: 'CASCADE' });
  DangKySuKien.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_dung' });
  SuKien.hasMany(DangKySuKien, { foreignKey: 'id_su_kien', onDelete: 'CASCADE' });
  DangKySuKien.belongsTo(SuKien, { foreignKey: 'id_su_kien' });

  // ThongBao
  NguoiDung.hasMany(ThongBao, { foreignKey: 'id_nguoi_nhan', onDelete: 'CASCADE', as: 'thong_bao_nhan' });
  ThongBao.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_nhan', as: 'nguoi_nhan' });
  NguoiDung.hasMany(ThongBao, { foreignKey: 'id_nguoi_hanh_dong', onDelete: 'CASCADE', as: 'thong_bao_gui' });
  ThongBao.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_hanh_dong', as: 'nguoi_hanh_dong' });

  console.log('✅ Thiết lập associations thành công!');
};

export {
  sequelize,
  NguoiDung,
  Khoa,
  Nganh,
  CuocHoiThoai,
  ThanhVienHoiThoai,
  TinNhan,
  CuocGoi,
  BaiViet,
  BinhLuan,
  LuotThich,
  SuKien,
  DangKySuKien,
  ThongBao,
  setupAssociations
};
