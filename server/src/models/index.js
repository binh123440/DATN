import sequelize from '../config/database.js';
import Khoa from './Khoa.js';
import Nganh from './Nganh.js';
import NguoiDung from './NguoiDung.js';
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

// === ĐỊNH NGHĨA RELATIONSHIPS ===

// Khoa - Nganh (1-N)
Khoa.hasMany(Nganh, { foreignKey: 'id_khoa', as: 'cac_nganh' });
Nganh.belongsTo(Khoa, { foreignKey: 'id_khoa', as: 'khoa' });

// Nganh - NguoiDung (1-N)
Nganh.hasMany(NguoiDung, { foreignKey: 'id_nganh', as: 'sinh_vien' });
NguoiDung.belongsTo(Nganh, { foreignKey: 'id_nganh', as: 'nganh' });

// NguoiDung - CuocHoiThoai (1-N) - người tạo
NguoiDung.hasMany(CuocHoiThoai, { foreignKey: 'id_nguoi_tao', as: 'cuoc_hoi_thoai_tao' });
CuocHoiThoai.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_tao', as: 'nguoi_tao' });

// CuocHoiThoai - ThanhVienHoiThoai - NguoiDung (M-N)
CuocHoiThoai.belongsToMany(NguoiDung, {
  through: ThanhVienHoiThoai,
  foreignKey: 'id_cuoc_hoi_thoai',
  otherKey: 'id_nguoi_dung',
  as: 'thanh_vien'
});
NguoiDung.belongsToMany(CuocHoiThoai, {
  through: ThanhVienHoiThoai,
  foreignKey: 'id_nguoi_dung',
  otherKey: 'id_cuoc_hoi_thoai',
  as: 'cuoc_hoi_thoai'
});

// CuocHoiThoai - TinNhan (1-N)
CuocHoiThoai.hasMany(TinNhan, { foreignKey: 'id_cuoc_hoi_thoai', as: 'tin_nhan' });
TinNhan.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai', as: 'cuoc_hoi_thoai' });

// NguoiDung - TinNhan (1-N)
NguoiDung.hasMany(TinNhan, { foreignKey: 'id_nguoi_gui', as: 'tin_nhan_gui' });
TinNhan.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_gui', as: 'nguoi_gui' });

// CuocHoiThoai - CuocGoi (1-N)
CuocHoiThoai.hasMany(CuocGoi, { foreignKey: 'id_cuoc_hoi_thoai', as: 'cuoc_goi' });
CuocGoi.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai', as: 'cuoc_hoi_thoai' });

// NguoiDung - CuocGoi (1-N)
NguoiDung.hasMany(CuocGoi, { foreignKey: 'id_nguoi_goi', as: 'cuoc_goi' });
CuocGoi.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_goi', as: 'nguoi_goi' });

// NguoiDung - BaiViet (1-N) - tác giả
NguoiDung.hasMany(BaiViet, { foreignKey: 'id_tac_gia', as: 'bai_viet' });
BaiViet.belongsTo(NguoiDung, { foreignKey: 'id_tac_gia', as: 'tac_gia' });

// NguoiDung - BaiViet (1-N) - người duyệt
NguoiDung.hasMany(BaiViet, { foreignKey: 'id_nguoi_duyet', as: 'bai_viet_duyet' });
BaiViet.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_duyet', as: 'nguoi_duyet' });

// BaiViet - BaiViet (self-reference) - chia sẻ
BaiViet.hasMany(BaiViet, { foreignKey: 'id_bai_viet_goc', as: 'bai_viet_chia_se' });
BaiViet.belongsTo(BaiViet, { foreignKey: 'id_bai_viet_goc', as: 'bai_viet_goc' });

// CuocHoiThoai - BaiViet (1-N) - bài viết trong nhóm
CuocHoiThoai.hasMany(BaiViet, { foreignKey: 'id_cuoc_hoi_thoai', as: 'bai_viet' });
BaiViet.belongsTo(CuocHoiThoai, { foreignKey: 'id_cuoc_hoi_thoai', as: 'cuoc_hoi_thoai' });

// BaiViet - BinhLuan (1-N)
BaiViet.hasMany(BinhLuan, { foreignKey: 'id_bai_viet', as: 'binh_luan' });
BinhLuan.belongsTo(BaiViet, { foreignKey: 'id_bai_viet', as: 'bai_viet' });

// NguoiDung - BinhLuan (1-N)
NguoiDung.hasMany(BinhLuan, { foreignKey: 'id_tac_gia', as: 'binh_luan' });
BinhLuan.belongsTo(NguoiDung, { foreignKey: 'id_tac_gia', as: 'tac_gia' });

// BinhLuan - BinhLuan (self-reference) - trả lời
BinhLuan.hasMany(BinhLuan, { foreignKey: 'id_binh_luan_cha', as: 'binh_luan_tra_loi' });
BinhLuan.belongsTo(BinhLuan, { foreignKey: 'id_binh_luan_cha', as: 'binh_luan_cha' });

// NguoiDung - LuotThich (1-N)
NguoiDung.hasMany(LuotThich, { foreignKey: 'id_nguoi_dung', as: 'luot_thich' });
LuotThich.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_dung', as: 'nguoi_dung' });

// NguoiDung - SuKien (1-N) - người tạo
NguoiDung.hasMany(SuKien, { foreignKey: 'id_nguoi_tao', as: 'su_kien_tao' });
SuKien.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_tao', as: 'nguoi_tao' });

// NguoiDung - SuKien (1-N) - người duyệt
NguoiDung.hasMany(SuKien, { foreignKey: 'id_nguoi_duyet', as: 'su_kien_duyet' });
SuKien.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_duyet', as: 'nguoi_duyet' });

// BaiViet - SuKien (1-1)
BaiViet.hasOne(SuKien, { foreignKey: 'id_bai_viet', as: 'su_kien' });
SuKien.belongsTo(BaiViet, { foreignKey: 'id_bai_viet', as: 'bai_viet' });

// Thêm 2 dòng này để định nghĩa quan hệ trực tiếp 1-N
SuKien.hasMany(DangKySuKien, { foreignKey: 'id_su_kien', as: 'luot_dang_ky' });
DangKySuKien.belongsTo(SuKien, { foreignKey: 'id_su_kien', as: 'su_kien' });

// NguoiDung - DangKySuKien - SuKien (M-N)
NguoiDung.belongsToMany(SuKien, {
  through: DangKySuKien,
  foreignKey: 'id_nguoi_dung',
  otherKey: 'id_su_kien',
  as: 'su_kien_dang_ky'
});
SuKien.belongsToMany(NguoiDung, {
  through: DangKySuKien,
  foreignKey: 'id_su_kien',
  otherKey: 'id_nguoi_dung',
  as: 'nguoi_dang_ky'
});

// NguoiDung - ThongBao (1-N) - người nhận
NguoiDung.hasMany(ThongBao, { foreignKey: 'id_nguoi_nhan', as: 'thong_bao_nhan' });
ThongBao.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_nhan', as: 'nguoi_nhan' });

// NguoiDung - ThongBao (1-N) - người hành động
NguoiDung.hasMany(ThongBao, { foreignKey: 'id_nguoi_hanh_dong', as: 'thong_bao_hanh_dong' });
ThongBao.belongsTo(NguoiDung, { foreignKey: 'id_nguoi_hanh_dong', as: 'nguoi_hanh_dong' });

// === EXPORT TẤT CẢ MODELS ===

const db = {
  sequelize,
  Khoa,
  Nganh,
  NguoiDung,
  CuocHoiThoai,
  ThanhVienHoiThoai,
  TinNhan,
  CuocGoi,
  BaiViet,
  BinhLuan,
  LuotThich,
  SuKien,
  DangKySuKien,
  ThongBao
};

export default db;
