import db from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const { NguoiDung, DangKySuKien, SuKien } = db;

// Hàm tính xếp loại dựa trên tổng điểm
const tinhXepLoai = (tongDiem) => {
  if (tongDiem >= 90) return { loai: 'Xuất sắc', mauSac: 'text-purple-600', bgColor: 'bg-purple-50' };
  if (tongDiem >= 80) return { loai: 'Tốt', mauSac: 'text-green-600', bgColor: 'bg-green-50' };
  if (tongDiem >= 65) return { loai: 'Khá', mauSac: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (tongDiem >= 50) return { loai: 'Trung bình', mauSac: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  if (tongDiem >= 35) return { loai: 'Yếu', mauSac: 'text-orange-600', bgColor: 'bg-orange-50' };
  return { loai: 'Kém', mauSac: 'text-red-600', bgColor: 'bg-red-50' };
};

// Lấy thông tin điểm rèn luyện của sinh viên
export const layThongTinDiemRenLuyen = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;

    if (!id_nguoi_dung) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const nguoiDung = await NguoiDung.findByPk(id_nguoi_dung, {
      attributes: ['id', 'ho_ten', 'tong_diem', 'id_nganh']
    });

    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const tongDiem = nguoiDung.tong_diem || 0;
    const xepLoai = tinhXepLoai(tongDiem);
    
    const mucTieuHocBong = 100;
    const tiLeHoanThanh = Math.min((tongDiem / mucTieuHocBong) * 100, 100);

    const danhSachSinhVien = await NguoiDung.findAll({
      where: {
        id_nganh: nguoiDung.id_nganh,
        [Op.and]: sequelize.where(
          // ✅ Dùng literal để ép kiểu đúng: vai_tro @> ARRAY['sinh_vien']::vai_tro_nguoi_dung_enum[]
          sequelize.literal(`vai_tro @> ARRAY['sinh_vien']::vai_tro_nguoi_dung_enum[]`),
          true
        )
      },
      attributes: ['id', 'tong_diem'],
      order: [['tong_diem', 'DESC']]
    });

    const tongSoSinhVien = danhSachSinhVien.length;
    const xepHang = danhSachSinhVien.findIndex(sv => sv.id === id_nguoi_dung) + 1;

    res.json({
      success: true,
      data: {
        tong_diem: tongDiem,
        xep_loai: xepLoai,
        ti_le_hoan_thanh: tiLeHoanThanh.toFixed(1),
        muc_tieu: mucTieuHocBong,
        xep_hang: xepHang,
        tong_so_sinh_vien: tongSoSinhVien
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy thông tin điểm rèn luyện:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Lấy lịch sử tích điểm
export const layLichSuTichDiem = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;
    const { limit = 5 } = req.query;

    if (!id_nguoi_dung) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const lichSu = await DangKySuKien.findAll({
      where: {
        id_nguoi_dung,
        ngay_gio_diem_danh: {
          [Op.ne]: null
        }
      },
      include: [
        {
          model: SuKien,
          as: 'su_kien',
          attributes: ['id', 'ten_su_kien', 'diem_thuong', 'thoi_gian_bat_dau']
        }
      ],
      order: [['ngay_gio_diem_danh', 'DESC']],
      limit: parseInt(limit)
    });

    const danhSachLichSu = lichSu.map(item => {
      const ngayThamGia = new Date(item.ngay_gio_diem_danh);
      const ngayHienTai = new Date();
      const soNgay = Math.floor((ngayHienTai - ngayThamGia) / (1000 * 60 * 60 * 24));
      
      let moTaNgay;
      if (soNgay === 0) moTaNgay = 'Hôm nay';
      else if (soNgay === 1) moTaNgay = 'Hôm qua';
      else if (soNgay < 7) moTaNgay = `${soNgay} ngày trước`;
      else if (soNgay < 30) moTaNgay = `${Math.floor(soNgay / 7)} tuần trước`;
      else moTaNgay = `${Math.floor(soNgay / 30)} tháng trước`;

      return {
        id: item.id,
        ten_su_kien: item.su_kien.ten_su_kien,
        diem: item.su_kien.diem_thuong,
        mo_ta_ngay: moTaNgay,
        ngay_tham_gia: item.ngay_gio_diem_danh
      };
    });

    res.json({
      success: true,
      data: danhSachLichSu
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch sử tích điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Lấy danh sách sự kiện sắp diễn ra
export const laySuKienSapDienRa = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;
    const { limit = 5 } = req.query;

    if (!id_nguoi_dung) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const ngayHienTai = new Date();
    // ✅ Tính thời điểm 30 ngày sau (tùy chỉnh theo nhu cầu)
    const ngayKetThuc = new Date();
    ngayKetThuc.setDate(ngayKetThuc.getDate() + 15);

    // ✅ BỎ điều kiện trang_thai, chỉ lọc theo thời gian
    const suKienSapDienRa = await SuKien.findAll({
      where: {
        thoi_gian_bat_dau: {
          [Op.gte]: ngayHienTai, // Sự kiện chưa diễn ra
          [Op.lte]: ngayKetThuc  // Trong vòng 30 ngày tới
        }
      },
      attributes: ['id', 'ten_su_kien', 'thoi_gian_bat_dau', 'diem_thuong', 'so_luong_toi_da'],
      order: [['thoi_gian_bat_dau', 'ASC']],
      limit: parseInt(limit)
    });

    // Kiểm tra trạng thái đăng ký của từng sự kiện
    const danhSachSuKien = await Promise.all(
      suKienSapDienRa.map(async (suKien) => {
        const dangKy = await DangKySuKien.findOne({
          where: {
            id_su_kien: suKien.id,
            id_nguoi_dung
          }
        });

        const soDaDangKy = await DangKySuKien.count({
          where: {
            id_su_kien: suKien.id,
            trang_thai: 'da_dang_ky'
          }
        });

        return {
          id: suKien.id,
          ten_su_kien: suKien.ten_su_kien,
          thoi_gian_bat_dau: suKien.thoi_gian_bat_dau,
          diem_thuong: suKien.diem_thuong,
          da_dang_ky: !!dangKy,
          con_cho: suKien.so_luong_toi_da - soDaDangKy
        };
      })
    );

    res.json({
      success: true,
      data: danhSachSuKien
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy sự kiện sắp diễn ra:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};