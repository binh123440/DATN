import db from '../models/index.js';
import { Op } from 'sequelize';

const { ThongBao, NguoiDung, BaiViet, SuKien } = db;

// Lấy danh sách thông báo của người dùng
export const layDanhSachThongBao = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;
    const { page = 1, limit = 20, da_doc } = req.query;
    const offset = (page - 1) * limit;

    if (!id_nguoi_dung) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const whereClause = { id_nguoi_nhan: id_nguoi_dung };
    if (da_doc !== undefined) {
      whereClause.da_doc = da_doc === 'true';
    }

    const { count, rows: thongBaos } = await ThongBao.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_hanh_dong',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Đếm số thông báo chưa đọc
    const so_chua_doc = await ThongBao.count({
      where: {
        id_nguoi_nhan: id_nguoi_dung,
        da_doc: false
      }
    });

    // ✅ Format thông báo với nội dung động (thêm tieu_de và link)
    const thongBaoFormatted = thongBaos.map(tb => ({
      ...tb.toJSON(),
      tieu_de: taoTieuDeThongBao(tb),
      noi_dung: taoNoiDungThongBao(tb),
      link: taoLinkThongBao(tb)
    }));

    res.json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        thong_baos: thongBaoFormatted,
        so_chua_doc,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_so_thong_bao: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách thông báo:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Helper: Tạo tiêu đề thông báo
const taoTieuDeThongBao = (thongBao) => {
  const loai = thongBao.loai;
  const tenNguoiHanhDong = thongBao.nguoi_hanh_dong?.ho_ten || 'Ai đó';

  const tieuDe = {
    'like_bai_viet': '❤️ Thích bài viết',
    'binh_luan_bai_viet': '💬 Bình luận mới',
    'tra_loi_binh_luan': '↩️ Trả lời bình luận',
    'su_kien_moi': '🎉 Sự kiện mới',
    'su_kien_sap_dien_ra': '⏰ Sự kiện sắp diễn ra',
    'duyet_bai_viet': '✅ Bài viết được duyệt',
    'tu_choi_bai_viet': '❌ Bài viết bị từ chối',
    'diem_danh_thanh_cong': '✅ Điểm danh thành công',
    'nhan_diem_thuong': '🎁 Nhận điểm thưởng',
    
    // ✅ Kế hoạch sự kiện
    'phan_cong_task': '📋 Công việc mới',
    'phan_cong_su_kien': '🎯 Phân công nhiệm vụ',
    'cap_nhat_ke_hoach': '📝 Cập nhật kế hoạch',
    'hoan_thanh_task': '✅ Hoàn thành công việc',
    'task_approved': '✅ Kết quả được duyệt',
    'task_rejected': '❌ Cần chỉnh sửa',
    'duyet_su_kien': '📝 Sự kiện cần duyệt',
    'su_kien_duyet': '✅ Sự kiện được duyệt',
    'su_kien_tu_choi': '❌ Sự kiện bị từ chối',
    'su_kien_bat_buoc': '⚠️ Tham gia bắt buộc',
    'reminder_deadline': '⏰ Nhắc nhở deadline',
    'task_overdue': '❌ Công việc quá hạn'
  };

  return tieuDe[loai] || '🔔 Thông báo mới';
};

// Tạo nội dung thông báo
const taoNoiDungThongBao = (thongBao) => {
  const tenNguoiHanhDong = thongBao.nguoi_hanh_dong?.ho_ten || 'Ai đó';
  
  const noiDung = {
    'like_bai_viet': `${tenNguoiHanhDong} đã thích bài viết của bạn`,
    'binh_luan_bai_viet': `${tenNguoiHanhDong} đã bình luận về bài viết của bạn`,
    'tra_loi_binh_luan': `${tenNguoiHanhDong} đã trả lời bình luận của bạn`,
    'su_kien_moi': `${tenNguoiHanhDong} đã tạo sự kiện mới`,
    'su_kien_sap_dien_ra': 'Sự kiện bạn đăng ký sắp diễn ra',
    'duyet_bai_viet': `${tenNguoiHanhDong} đã duyệt bài viết của bạn`,
    'tu_choi_bai_viet': `${tenNguoiHanhDong} đã từ chối bài viết của bạn`,
    'diem_danh_thanh_cong': `${tenNguoiHanhDong} đã điểm danh thành công cho bạn`,
    'nhan_diem_thuong': 'Bạn đã nhận được điểm thưởng',
    
    // ✅ Kế hoạch sự kiện
    'phan_cong_task': `${tenNguoiHanhDong} đã giao cho bạn một công việc mới`,
    'phan_cong_su_kien': `${tenNguoiHanhDong} đã phân công bạn tham gia kế hoạch sự kiện`,
    'cap_nhat_ke_hoach': `${tenNguoiHanhDong} đã cập nhật kế hoạch sự kiện`,
    'hoan_thanh_task': `${tenNguoiHanhDong} đã hoàn thành công việc được giao`,
    'task_approved': `${tenNguoiHanhDong} đã duyệt kết quả công việc của bạn`,
    'task_rejected': `${tenNguoiHanhDong} yêu cầu bạn chỉnh sửa lại kết quả`,
    'duyet_su_kien': `${tenNguoiHanhDong} gửi sự kiện cần phê duyệt`,
    'su_kien_duyet': `${tenNguoiHanhDong} đã duyệt sự kiện của bạn`,
    'su_kien_tu_choi': `${tenNguoiHanhDong} đã từ chối sự kiện của bạn`,
    'su_kien_bat_buoc': `Bạn bắt buộc tham gia sự kiện được chỉ định`,
    'reminder_deadline': 'Công việc của bạn sắp đến hạn',
    'task_overdue': 'Công việc của bạn đã quá hạn'
  };
  
  return noiDung[thongBao.loai] || `${tenNguoiHanhDong} có hoạt động mới`;
};

// Helper: Tạo link cho thông báo
const taoLinkThongBao = (thongBao) => {
  // ✅ Sử dụng loai_muc_tieu để tạo link động
  if (thongBao.loai_muc_tieu === 'bai_viet') {
    return `/bai-viet/${thongBao.id_muc_tieu}`;
  } else if (thongBao.loai_muc_tieu === 'su_kien') {
    return `/su-kien/${thongBao.id_muc_tieu}`;
  } else if (thongBao.loai_muc_tieu === 'binh_luan') {
    return `/bai-viet/${thongBao.id_muc_tieu}`;
  } else if (thongBao.loai_muc_tieu === 'ke_hoach') {
    return `/events/${thongBao.id_muc_tieu}/ke-hoach`;
  }
  return '/';
};

// Đánh dấu thông báo đã đọc
export const danhDauDaDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const thongBao = await ThongBao.findOne({
      where: {
        id,
        id_nguoi_nhan: id_nguoi_dung
      }
    });

    if (!thongBao) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    thongBao.da_doc = true;
    await thongBao.save();

    res.json({
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc',
      data: thongBao
    });
  } catch (error) {
    console.error('❌ Lỗi khi đánh dấu thông báo đã đọc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const danhDauTatCaDaDoc = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;

    await ThongBao.update(
      { da_doc: true },
      {
        where: {
          id_nguoi_nhan: id_nguoi_dung,
          da_doc: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc'
    });
  } catch (error) {
    console.error('❌ Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Xóa thông báo
export const xoaThongBao = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const thongBao = await ThongBao.findOne({
      where: {
        id,
        id_nguoi_nhan: id_nguoi_dung
      }
    });

    if (!thongBao) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    await thongBao.destroy();

    res.json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa thông báo:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Tạo thông báo (helper function để dùng trong các controller khác)
export const taoThongBao = async (data) => {
  try {
    // Không tạo thông báo nếu người hành động là chính người nhận
    if (data.id_nguoi_nhan === data.id_nguoi_hanh_dong) {
      return null;
    }

    const thongBao = await ThongBao.create({
      id_nguoi_nhan: data.id_nguoi_nhan,
      id_nguoi_hanh_dong: data.id_nguoi_hanh_dong,
      loai: data.loai,
      id_muc_tieu: data.id_muc_tieu,
      loai_muc_tieu: data.loai_muc_tieu
    });
    
    return thongBao;
  } catch (error) {
    console.error('❌ Lỗi khi tạo thông báo:', error);
    throw error;
  }
};

// Lấy số lượng thông báo chưa đọc
export const demThongBaoChuaDoc = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;

    const so_chua_doc = await ThongBao.count({
      where: {
        id_nguoi_nhan: id_nguoi_dung,
        da_doc: false
      }
    });

    res.json({
      success: true,
      data: {
        so_chua_doc
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi đếm thông báo chưa đọc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};