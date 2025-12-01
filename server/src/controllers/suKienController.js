import db from '../models/index.js';
import * as geolib from 'geolib';
import { taoThongBao } from './thongBaoController.js';
const { SuKien, BaiViet, NguoiDung, DangKySuKien, sequelize, ThongBao, Khoa } = db;

// Lấy danh sách sự kiện
export const layDanhSachSuKien = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await SuKien.findAndCountAll({
      where: { trang_thai: 'da_duyet' },
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: DangKySuKien,
          as: 'luot_dang_ky',
          attributes: ['id_nguoi_dung']
        }
      ],
      order: [['thoi_gian_bat_dau', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.json({
      success: true,
      message: 'Lấy danh sách sự kiện thành công',
      data: {
        su_kiens: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sự kiện:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Tạo sự kiện (với bài viết)
export const taoSuKien = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      id_nguoi_tao,
      ten_su_kien,
      mo_ta,
      dia_diem,
      thoi_gian_bat_dau,
      so_luong_toi_da,
      diem_thuong,
      noi_dung_bai_viet,
      ke_hoach_chi_tiet
    } = req.body;

    if (!id_nguoi_tao || !ten_su_kien || !thoi_gian_bat_dau || !so_luong_toi_da || !diem_thuong) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // 1. Tạo bài viết
    const baiViet = await BaiViet.create({
      id_tac_gia: id_nguoi_tao,
      noi_dung: noi_dung_bai_viet || mo_ta || `Sự kiện: ${ten_su_kien}`,
      trang_thai: 'cho_duyet'
    }, { transaction });

    // 2. Tạo sự kiện với kế hoạch
    const suKien = await SuKien.create({
      id_nguoi_tao,
      id_bai_viet: baiViet.id,
      ten_su_kien,
      mo_ta,
      dia_diem,
      thoi_gian_bat_dau,
      so_luong_toi_da,
      diem_thuong,
      trang_thai: 'cho_duyet',
      trang_thai_su_kien: 'ban_nhap',
      ke_hoach_chi_tiet: ke_hoach_chi_tiet || {}
    }, { transaction });

    // 3. ✅ Gửi thông báo cho người được giao task (sửa lỗi)
    if (ke_hoach_chi_tiet?.tasks?.length > 0) {
      for (const task of ke_hoach_chi_tiet.tasks) {
        if (task.assignee?.id) {
          await ThongBao.create({
            id_nguoi_nhan: task.assignee.id,
            id_nguoi_hanh_dong: id_nguoi_tao, // ✅ THÊM DÒNG NÀY
            loai: 'phan_cong_task',
            tieu_de: `📋 Bạn được giao task: ${task.title}`,
            noi_dung: `Trong sự kiện "${ten_su_kien}"`,
            link: `/events/${suKien.id}`
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công',
      data: suKien
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi khi tạo sự kiện:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật sự kiện
export const capNhatSuKien = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      ten_su_kien,
      mo_ta,
      dia_diem,
      thoi_gian_bat_dau,
      thoi_gian_ket_thuc,
      so_luong_toi_da,
      diem_thuong,
      noi_dung_bai_viet
    } = req.body;
    const idNguoiDung = req.user?.id ;

    const suKien = await SuKien.findByPk(id, { transaction: t });
    if (!suKien) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện.' });
    }
    if (suKien.id_nguoi_tao !== idNguoiDung) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }

    const payload = {};
    if (ten_su_kien !== undefined) payload.ten_su_kien = ten_su_kien;
    if (mo_ta !== undefined) payload.mo_ta = mo_ta;
    if (dia_diem !== undefined) payload.dia_diem = dia_diem;
    if (thoi_gian_bat_dau !== undefined) payload.thoi_gian_bat_dau = thoi_gian_bat_dau;
    if (thoi_gian_ket_thuc !== undefined) payload.thoi_gian_ket_thuc = thoi_gian_ket_thuc;
    if (so_luong_toi_da !== undefined) payload.so_luong_toi_da = so_luong_toi_da;
    if (diem_thuong !== undefined) payload.diem_thuong = diem_thuong;

    if (Object.keys(payload).length) await suKien.update(payload, { transaction: t });
    if (noi_dung_bai_viet && suKien.id_bai_viet) {
      await BaiViet.update(
        { noi_dung: noi_dung_bai_viet },
        { where: { id: suKien.id_bai_viet }, transaction: t }
      );
    }

    await t.commit();
    res.json({ success: true, message: 'Cập nhật sự kiện thành công.' });
  } catch (error) {
    await t.rollback();
    console.error('capNhatSuKien error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// Đăng ký tham gia sự kiện
export const dangKySuKien = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_nguoi_dung } = req.body;

    if (!id_nguoi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu id_nguoi_dung'
      });
    }

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    // Kiểm tra đã đăng ký chưa
    const dangKyCu = await DangKySuKien.findOne({
      where: {
        id_nguoi_dung,
        id_su_kien: id
      }
    });

    if (dangKyCu) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký sự kiện này rồi'
      });
    }

    // Kiểm tra còn chỗ không
    const soDaDangKy = await DangKySuKien.count({
      where: {
        id_su_kien: id,
        trang_thai: 'da_dang_ky'
      }
    });

    if (soDaDangKy >= suKien.so_luong_toi_da) {
      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã hết chỗ'
      });
    }

    // Đăng ký
    const dangKy = await DangKySuKien.create({
      id_nguoi_dung,
      id_su_kien: id,
      trang_thai: 'da_dang_ky'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký sự kiện thành công',
      data: dangKy
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký sự kiện:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Kiểm tra trạng thái đăng ký
export const kiemTraDangKy = async (req, res) => {
  try {
    const { id: id_su_kien } = req.params;
    const { id_nguoi_dung } = req.query;

    const dangKy = await DangKySuKien.findOne({
      where: { id_su_kien, id_nguoi_dung }
    });

    res.json({
      success: true,
      data: {
        da_dang_ky: !!dangKy,
        da_diem_danh: !!dangKy?.ngay_gio_diem_danh // Trả về trạng thái đã điểm danh
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Điểm danh sự kiện
export const diemDanhSuKien = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id: id_su_kien_param } = req.params;
    const { qrDataString, scannerCoords } = req.body;
    const id_nguoi_quet = req.user.id; // Lấy từ token

    // 1. Parse và xác thực dữ liệu QR
    const qrData = JSON.parse(qrDataString);
    if (!qrData.eventId || !qrData.userId || !qrData.timestamp || !qrData.coords?.lat) {
      return res.status(400).json({ success: false, message: 'Mã QR không hợp lệ.' });
    }
    
    // 2. Kiểm tra sự kiện và quyền của người quét
    const suKien = await SuKien.findByPk(qrData.eventId);
    if (!suKien || suKien.id.toString() !== id_su_kien_param) {
      return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại hoặc mã QR không khớp.' });
    }
    if (suKien.id_nguoi_tao !== id_nguoi_quet) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền điểm danh cho sự kiện này.' });
    }

    // 3. Kiểm tra thời gian hiệu lực (30 giây)
    if (Date.now() - qrData.timestamp > 30000) {
      return res.status(400).json({ success: false, message: 'Mã QR đã hết hạn.' });
    }

    // 4. Kiểm tra khoảng cách (100m)
    const distance = geolib.getDistance(scannerCoords, { latitude: qrData.coords.lat, longitude: qrData.coords.lng });
    if (distance > 100) {
      return res.status(400).json({ success: false, message: `Khoảng cách quá xa (${distance}m > 100m).` });
    }

    // 5. Cập nhật điểm danh và cộng điểm
    const dangKy = await DangKySuKien.findOne({ where: { id_su_kien: suKien.id, id_nguoi_dung: qrData.userId } });
    if (!dangKy) {
      return res.status(404).json({ success: false, message: 'Sinh viên này chưa đăng ký sự kiện.' });
    }
    if (dangKy.ngay_gio_diem_danh) {
      return res.status(400).json({ success: false, message: 'Sinh viên này đã được điểm danh trước đó.' });
    }

    // Cập nhật thời gian điểm danh
    dangKy.ngay_gio_diem_danh = new Date();
    await dangKy.save({ transaction });

    // Cộng điểm cho người dùng
    await NguoiDung.increment('tong_diem', { by: suKien.diem_thuong, where: { id: qrData.userId }, transaction });

    // ✅ Tạo thông báo điểm danh thành công
    await taoThongBao({
      id_nguoi_nhan: qrData.userId,
      id_nguoi_hanh_dong: id_nguoi_quet,
      loai: 'diem_danh_thanh_cong',
      id_muc_tieu: suKien.id,
      loai_muc_tieu: 'su_kien'
    });

    // ✅ Tạo thông báo nhận điểm thưởng
    if (suKien.diem_thuong > 0) {
      await taoThongBao({
        id_nguoi_nhan: qrData.userId,
        id_nguoi_hanh_dong: qrData.userId, // Tự động từ hệ thống
        loai: 'nhan_diem_thuong',
        id_muc_tieu: suKien.id,
        loai_muc_tieu: 'su_kien'
      });
    }

    await transaction.commit();
    res.json({ success: true, message: `Điểm danh thành công cho User ID: ${qrData.userId}.` });

  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi khi điểm danh:', error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ success: false, message: 'Mã QR có định dạng không đúng.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi điểm danh.' });
  }
};

// Lấy thống kê điểm danh cho một sự kiện
export const layThongKeDiemDanh = async (req, res) => {
  try {
    const { id: id_su_kien } = req.params;
    const { id: id_nguoi_dung, vai_tro } = req.user;

    const suKien = await SuKien.findByPk(id_su_kien);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại.' });
    }

    // Chỉ người tạo sự kiện hoặc admin mới có quyền xem
    if (suKien.id_nguoi_tao !== id_nguoi_dung && vai_tro !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài nguyên này.' });
    }

    const danhSachDangKy = await DangKySuKien.findAll({
      where: { id_su_kien },
      include: [{
        model: NguoiDung,
        as: 'nguoi_dang_ky',
        attributes: ['ho_ten', 'email', 'ma_sinh_vien']
      }],
      order: [['ngay_gio_diem_danh', 'DESC'], ['ngay_gio_dang_ky', 'ASC']]
    });

    res.json({ success: true, data: danhSachDangKy });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê điểm danh:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy danh sách tất cả nội dung đang chờ duyệt
export const layDanhSachChoDuyet = async (req, res) => {
  try {
    // Lấy các bài viết đang chờ duyệt, kèm thông tin người tạo
    const baiVietChoDuyet = await BaiViet.findAll({
      where: { trang_thai: 'cho_duyet' },
      include: {
        model: NguoiDung,
        as: 'tac_gia', // ✅ THÊM DÒNG NÀY ĐỂ CHỈ ĐỊNH RÕ MỐI QUAN HỆ
        attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
      },
      order: [['ngay_tao', 'DESC']]
    });

    // Thêm thuộc tính 'loai' để phân biệt trên frontend
    const baiVietFormatted = baiVietChoDuyet.map(item => ({ ...item.toJSON(), loai: 'bai_viet' }));

    // Hiện tại chỉ có Bài viết cần duyệt, sau này có thể thêm Sự kiện
    const tatCaNoiDung = [...baiVietFormatted];

    res.json({ success: true, data: tatCaNoiDung });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chờ duyệt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái của một nội dung (Bài viết hoặc Sự kiện)
export const capNhatTrangThai = async (req, res) => {
  const { id, loai, trang_thai_moi } = req.body; // loai: 'bai_viet' | 'su_kien'

  if (!id || !loai || !['da_duyet', 'bi_tu_choi'].includes(trang_thai_moi)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
  }

  const transaction = await sequelize.transaction();

  try {
    if (loai === 'bai_viet') {
      // ✅ Cập nhật trạng thái bài viết
      const [updatedCount] = await BaiViet.update(
        { trang_thai: trang_thai_moi },
        { where: { id }, transaction }
      );

      if (updatedCount === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để cập nhật.' });
      }

      // ✅ Nếu có sự kiện liên kết với bài viết này, cập nhật luôn trạng thái sự kiện
      const suKienLienKet = await SuKien.findOne({ where: { id_bai_viet: id }, transaction });
      if (suKienLienKet) {
        await suKienLienKet.update({ trang_thai: trang_thai_moi }, { transaction });
      }

    } else if (loai === 'su_kien') {
      // ✅ Lấy thông tin sự kiện để tìm bài viết liên kết
      const suKien = await SuKien.findByPk(id, { transaction });
      
      if (!suKien) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện để cập nhật.' });
      }

      // ✅ Cập nhật trạng thái sự kiện
      await suKien.update({ trang_thai: trang_thai_moi }, { transaction });

      // ✅ Nếu sự kiện có bài viết liên kết, cập nhật luôn trạng thái bài viết
      if (suKien.id_bai_viet) {
        await BaiViet.update(
          { trang_thai: trang_thai_moi },
          { where: { id: suKien.id_bai_viet }, transaction }
        );
      }

    } else {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Loại nội dung không hợp lệ.' });
    }

    await transaction.commit();

    // ✅ Thông báo rõ ràng hơn
    const thongBao = trang_thai_moi === 'da_duyet' ? 'duyệt' : 'từ chối';
    const loaiNoiDung = loai === 'bai_viet' ? 'bài viết' : 'sự kiện';
    
    res.json({ 
      success: true, 
      message: `${loaiNoiDung.charAt(0).toUpperCase() + loaiNoiDung.slice(1)} đã được ${thongBao} thành công${loai === 'su_kien' ? ' (bao gồm bài viết liên kết)' : ''}.` 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi khi cập nhật trạng thái:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 1. Cập nhật kế hoạch chi tiết sự kiện
 * POST /api/su-kien/:id/ke-hoach
 */
export const capNhatKeHoachSuKien = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { ke_hoach } = req.body;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    // Quyền: chủ tạo hoặc admin/kiểm duyệt viên
    const isOwner = suKien.id_nguoi_tao === userId;
    const isAuthorized = ['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro);
    
    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa kế hoạch' });
    }

    // Kiểm tra trạng thái - chỉ sửa được khi ở trạng thái ban_nhap hoặc tu_choi_khoa
    if (!['ban_nhap', 'tu_choi_khoa'].includes(suKien.trang_thai_su_kien)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể sửa kế hoạch khi sự kiện đã gửi duyệt hoặc đã duyệt' 
      });
    }

    await suKien.update({ ke_hoach_chi_tiet: ke_hoach });

    // Gửi thông báo cho người được phân công
    const assignees = new Set();
    (ke_hoach.tasks || []).forEach(task => {
      if (task.assignee?.type === 'user' && task.assignee.id) {
        assignees.add(task.assignee.id);
      }
    });

    for (const uid of assignees) {
      await ThongBao.create({
        id_nguoi_nhan: uid,
        id_nguoi_hanh_dong: userId,
        loai: 'phan_cong_su_kien',
        tieu_de: `🎯 Bạn được phân công nhiệm vụ: ${suKien.ten_su_kien}`,
        noi_dung: `Kiểm tra chi tiết công việc được giao trong sự kiện "${suKien.ten_su_kien}"`,
        link: `/events/${id}/ke-hoach`
      });
    }

    res.json({ 
      success: true, 
      message: 'Cập nhật kế hoạch thành công',
      data: { ke_hoach_chi_tiet: suKien.ke_hoach_chi_tiet }
    });
  } catch (error) {
    console.error('❌ Lỗi capNhatKeHoachSuKien:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 2. Gán task cho người thực hiện
 * POST /api/su-kien/:id/task/:taskId/assign
 */
export const ganTaskChoNguoi = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { assignee } = req.body; // { type: 'user'|'khoa'|'lop', id: number, name: string }
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    const isOwner = suKien.id_nguoi_tao === userId;
    const isAuthorized = ['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro);
    
    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ success: false, message: 'Không có quyền phân công' });
    }

    const keHoach = suKien.ke_hoach_chi_tiet || { tasks: [] };
    const taskIndex = keHoach.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    }

    // Cập nhật assignee
    keHoach.tasks[taskIndex].assignee = assignee;
    keHoach.tasks[taskIndex].updated_at = new Date().toISOString();

    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo
    if (assignee.type === 'user' && assignee.id) {
      await ThongBao.create({
        id_nguoi_nhan: assignee.id,
        id_nguoi_hanh_dong: userId,
        loai: 'phan_cong_task',
        tieu_de: `📋 Task mới: ${keHoach.tasks[taskIndex].title}`,
        noi_dung: `Bạn được giao nhiệm vụ "${keHoach.tasks[taskIndex].title}" trong sự kiện "${suKien.ten_su_kien}"`,
        link: `/events/${id}/ke-hoach`
      });
    }

    res.json({ 
      success: true, 
      message: 'Phân công thành công',
      data: { task: keHoach.tasks[taskIndex] }
    });
  } catch (error) {
    console.error('❌ Lỗi ganTaskChoNguoi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 3. Người được giao hoàn thành task và gửi kết quả
 * POST /api/su-kien/:id/task/:taskId/complete
 */
export const hoanThanhTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { result, attachments } = req.body; // { result: string, attachments: string[] }
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    const keHoach = suKien.ke_hoach_chi_tiet || { tasks: [] };
    const taskIndex = keHoach.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    }

    const task = keHoach.tasks[taskIndex];

    // Kiểm tra quyền: phải là người được giao
    if (task.assignee?.type === 'user' && task.assignee.id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không được giao task này' });
    }

    // Cập nhật kết quả
    keHoach.tasks[taskIndex] = {
      ...task,
      status: 'done',
      result: result || task.result,
      attachments: attachments || task.attachments || [],
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo cho người tạo sự kiện
    await ThongBao.create({
      id_nguoi_nhan: suKien.id_nguoi_tao,
      id_nguoi_hanh_dong: userId,
      loai: 'hoan_thanh_task',
      tieu_de: `✅ Task "${task.title}" đã hoàn thành`,
      noi_dung: `Nhiệm vụ trong sự kiện "${suKien.ten_su_kien}" đã được hoàn thành. Vui lòng kiểm tra kết quả.`,
      link: `/events/${id}/ke-hoach`
    });

    res.json({ 
      success: true, 
      message: 'Gửi kết quả thành công',
      data: { task: keHoach.tasks[taskIndex] }
    });
  } catch (error) {
    console.error('❌ Lỗi hoanThanhTask:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 4. Duyệt kết quả task (người tạo sự kiện)
 * POST /api/su-kien/:id/task/:taskId/duyet-ket-qua
 */
export const duyetKetQuaTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { approved, feedback } = req.body; // { approved: boolean, feedback: string }
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    // Chỉ người tạo hoặc admin mới được duyệt
    if (suKien.id_nguoi_tao !== userId && !['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro)) {
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt kết quả' });
    }

    const keHoach = suKien.ke_hoach_chi_tiet || { tasks: [] };
    const taskIndex = keHoach.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    }

    const task = keHoach.tasks[taskIndex];

    // Cập nhật trạng thái duyệt
    keHoach.tasks[taskIndex] = {
      ...task,
      approved: approved,
      feedback: feedback,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString()
    };

    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo cho người thực hiện
    if (task.assignee?.type === 'user' && task.assignee.id) {
      await ThongBao.create({
        id_nguoi_nhan: task.assignee.id,
        id_nguoi_hanh_dong: userId, // ✅ Thêm dòng này
        loai: approved ? 'task_approved' : 'task_rejected',
        tieu_de: approved ? `✅ Kết quả task "${task.title}" được chấp nhận` : `❌ Kết quả task "${task.title}" cần chỉnh sửa`,
        noi_dung: feedback || (approved ? 'Kết quả đạt yêu cầu' : 'Vui lòng xem phản hồi và chỉnh sửa'),
        link: `/events/${id}/ke-hoach`
      });
    }

    res.json({ 
      success: true, 
      message: approved ? 'Đã duyệt kết quả' : 'Đã yêu cầu chỉnh sửa',
      data: { task: keHoach.tasks[taskIndex] }
    });
  } catch (error) {
    console.error('❌ Lỗi duyetKetQuaTask:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 5. Gửi sự kiện lên Khoa/BGH để duyệt
 * POST /api/su-kien/:id/gui-duyet
 */
export const guiSuKienLenKhoa = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { ghi_chu } = req.body;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    // Chỉ người tạo mới có thể gửi
    if (suKien.id_nguoi_tao !== userId) {
      return res.status(403).json({ success: false, message: 'Chỉ người tạo mới có thể gửi duyệt' });
    }

    // Kiểm tra trạng thái
    if (suKien.trang_thai_su_kien !== 'ban_nhap' && suKien.trang_thai_su_kien !== 'tu_choi_khoa') {
      return res.status(400).json({ success: false, message: 'Sự kiện đã được gửi duyệt hoặc đã duyệt rồi' });
    }

    // Kiểm tra xem tất cả task đã được duyệt chưa
    const keHoach = suKien.ke_hoach_chi_tiet || { tasks: [] };
    const hasUnapprovedTasks = keHoach.tasks?.some(task => 
      task.status === 'done' && !task.approved
    );

    if (hasUnapprovedTasks) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng duyệt tất cả kết quả task trước khi gửi lên Khoa' 
      });
    }

    // Cập nhật trạng thái
    await suKien.update({ trang_thai_su_kien: 'da_gui_khoa' });

    // Lưu lịch sử
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: 'gui_khoa',
      user_id: userId,
      user_name: req.user.ho_ten,
      ghi_chu,
      timestamp: new Date().toISOString()
    });
    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo cho kiểm duyệt viên
    const kiemduyetvien = await NguoiDung.findAll({
      where: { vai_tro: ['quan_tri_vien', 'kiem_duyet_vien'] }
    });

    for (const user of kiemduyetvien) {
      await ThongBao.create({
        id_nguoi_nhan: user.id,
        id_nguoi_hanh_dong: userId, // ✅ Thêm dòng này
        loai: 'duyet_su_kien',
        tieu_de: `📝 Sự kiện "${suKien.ten_su_kien}" cần phê duyệt`,
        noi_dung: ghi_chu || `Sự kiện mới từ ${req.user.ho_ten} cần được phê duyệt`,
        link: `/admin/duyet-su-kien/${id}`
      });
    }

    res.json({ 
      success: true, 
      message: 'Đã gửi sự kiện lên để duyệt',
      data: { trang_thai_su_kien: suKien.trang_thai_su_kien }
    });
  } catch (error) {
    console.error('❌ Lỗi guiSuKienLenKhoa:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 6. Khoa/BGH duyệt hoặc từ chối sự kiện
 * POST /api/su-kien/:id/duyet
 */
export const duyetSuKien = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, phan_hoi } = req.body; // action: 'duyet' | 'tu_choi'
    const userId = req.user?.id;

    // Kiểm tra quyền
    if (!['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro)) {
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt sự kiện' });
    }

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (suKien.trang_thai_su_kien !== 'da_gui_khoa') {
      return res.status(400).json({ success: false, message: 'Sự kiện chưa được gửi duyệt' });
    }

    const newStatus = action === 'duyet' ? 'da_duyet_khoa' : 'tu_choi_khoa';
    await suKien.update({ 
      trang_thai_su_kien: newStatus,
      id_nguoi_duyet: userId
    });

    // Lưu lịch sử
    const keHoach = suKien.ke_hoach_chi_tiet || {};
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: action === 'duyet' ? 'duyet_khoa' : 'tu_choi_khoa',
      user_id: userId,
      user_name: req.user.ho_ten,
      phan_hoi,
      timestamp: new Date().toISOString()
    });
    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo cho người tạo
    await ThongBao.create({
      id_nguoi_nhan: suKien.id_nguoi_tao,
      id_nguoi_hanh_dong: userId, // ✅ Thêm dòng này
      loai: action === 'duyet' ? 'su_kien_duyet' : 'su_kien_tu_choi',
      tieu_de: action === 'duyet' 
        ? `✅ Sự kiện "${suKien.ten_su_kien}" đã được duyệt`
        : `❌ Sự kiện "${suKien.ten_su_kien}" bị từ chối`,
      noi_dung: phan_hoi || (action === 'duyet' 
        ? 'Sự kiện đã được phê duyệt. Bạn có thể đăng công khai.'
        : 'Sự kiện cần chỉnh sửa lại theo phản hồi.'),
      link: `/events/${id}`
    });

    res.json({ 
      success: true, 
      message: action === 'duyet' ? 'Đã duyệt sự kiện' : 'Đã từ chối sự kiện',
      data: { 
        trang_thai_su_kien: suKien.trang_thai_su_kien,
        phan_hoi 
      }
    });
  } catch (error) {
    console.error('❌ Lỗi duyetSuKien:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 7. Đăng công khai sự kiện (sau khi Khoa duyệt)
 * POST /api/su-kien/:id/dang-cong-khai
 */
export const dangSuKienCongKhai = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    // Kiểm tra quyền: người tạo hoặc kiểm duyệt viên
    const isOwner = suKien.id_nguoi_tao === userId;
    const isReviewer = ['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro);
    
    if (!isOwner && !isReviewer) {
      return res.status(403).json({ success: false, message: 'Không có quyền đăng sự kiện' });
    }

    if (suKien.trang_thai_su_kien !== 'da_duyet_khoa') {
      return res.status(400).json({ success: false, message: 'Sự kiện chưa được Khoa duyệt' });
    }

    await suKien.update({ 
      trang_thai_su_kien: 'da_dang',
      trang_thai: 'da_duyet'
    });

    // Lưu lịch sử
    const keHoach = suKien.ke_hoach_chi_tiet || {};
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: 'dang_cong_khai',
      user_id: userId,
      user_name: req.user.ho_ten,
      timestamp: new Date().toISOString()
    });
    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo cho các đối tượng bắt buộc tham gia
    const targetAudience = keHoach.target_audience || {};
    if (targetAudience.mandatory_participants?.length > 0) {
      for (const participant of targetAudience.mandatory_participants) {
        if (participant.type === 'user') {
          await ThongBao.create({
            id_nguoi_nhan: participant.id,
            id_nguoi_hanh_dong: userId, // ✅ Thêm dòng này
            loai: 'su_kien_bat_buoc',
            tieu_de: `⚠️ Bạn bắt buộc tham gia: ${suKien.ten_su_kien}`,
            noi_dung: `Sự kiện "${suKien.ten_su_kien}" yêu cầu sự tham gia của bạn. Vui lòng đăng ký sớm.`,
            link: `/events/${id}`
          });
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Đã đăng sự kiện công khai',
      data: suKien
    });
  } catch (error) {
    console.error('❌ Lỗi dangSuKienCongKhai:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 8. Lấy danh sách người dùng để phân công
 * GET /api/su-kien/users-for-assignment
 */
export const layDanhSachNguoiPhanCong = async (req, res) => {
  try {
    const { type } = req.query; // 'giao_vien' | 'can_bo' | 'all'

    let whereCondition = {};
    if (type === 'giao_vien') {
      whereCondition.vai_tro = 'giao_vien';
    } else if (type === 'can_bo') {
      whereCondition.vai_tro = ['quan_tri_vien', 'kiem_duyet_vien', 'giao_vien'];
    }

    const users = await NguoiDung.findAll({
      where: whereCondition,
      attributes: ['id', 'ho_ten', 'email', 'vai_tro', 'anh_dai_dien_url'],
      order: [['ho_ten', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Lỗi layDanhSachNguoiPhanCong:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};