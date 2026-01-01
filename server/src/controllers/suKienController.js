import db from '../models/index.js';
import * as geolib from 'geolib';
import { taoThongBao } from './thongBaoController.js';
import { Op } from 'sequelize';
const { SuKien, BaiViet, NguoiDung, DangKySuKien, sequelize, ThongBao, Khoa } = db;

// Lấy danh sách sự kiện
export const layDanhSachSuKien = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await SuKien.findAndCountAll({
      where: { 
        trang_thai: 'da_dang' // ✅ Chỉ lấy sự kiện đã đăng công khai
      },
      include: [
        {
          model: BaiViet,
          as: 'bai_viet',
          where: { trang_thai: 'da_dang' }, // ✅ Bài viết đã được duyệt
          required: true
        },
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
      thoi_gian_ket_thuc,
      so_luong_toi_da,
      id_phong,
      diem_thuong,
      noi_dung_bai_viet,
      ke_hoach_chi_tiet
    } = req.body;

    if (!id_nguoi_tao || !ten_su_kien || !thoi_gian_bat_dau || !so_luong_toi_da || !diem_thuong) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    let keHoachData = ke_hoach_chi_tiet;
    if (typeof ke_hoach_chi_tiet === 'string') {
      try {
        keHoachData = JSON.parse(ke_hoach_chi_tiet);
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON:', parseError);
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu kế hoạch không hợp lệ'
        });
      }
    }

    // ✅ nhận media từ multipart (nếu có)
    const media_urls = req.files && req.files.length > 0 ? buildMediaFromFiles(req.files) : [];
    const media_type = detectMediaType(media_urls);

    // ✅ 1. Tạo bài viết với trạng thái cho_duyet (chưa đăng) + media
    const baiViet = await BaiViet.create(
      {
        id_tac_gia: id_nguoi_tao,
        noi_dung: noi_dung_bai_viet || mo_ta || `Sự kiện: ${ten_su_kien}`,
        trang_thai: 'cho_duyet',
        media_urls: media_urls.length > 0 ? media_urls : [],
        media_type
      },
      { transaction }
    );

    // ✅ 2. Tạo sự kiện với trạng thái ban_nhap
    const suKien = await SuKien.create(
      {
        id_nguoi_tao,
        id_bai_viet: baiViet.id,
        ten_su_kien,
        mo_ta,
        dia_diem,
        thoi_gian_bat_dau,
        thoi_gian_ket_thuc,
        so_luong_toi_da,
        diem_thuong,
        id_phong,
        trang_thai: 'ban_nhap', // Kế hoạch đang soạn thảo
        ke_hoach_chi_tiet: keHoachData || {}
      },
      { transaction }
    );

    // ✅ 3. Gửi thông báo cho người được giao task
    if (keHoachData?.tasks?.length > 0) {
      for (const task of keHoachData.tasks) {
        if (task.assignee?.id) {
          await ThongBao.create({
            id_nguoi_nhan: task.assignee.id,
            id_nguoi_hanh_dong: id_nguoi_tao,
            loai: 'phan_cong_task',
            id_muc_tieu: suKien.id,
            loai_muc_tieu: 'ke_hoach'
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
    console.error('❌ Lỗi khi tạo sự kiện:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
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
      noi_dung_bai_viet,
      ke_hoach_chi_tiet // <-- nhận kế hoạch chi tiết ở đây
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

    // parse ke_hoach nếu gửi dưới dạng string
    let keHoachData;
    if (ke_hoach_chi_tiet !== undefined) {
      if (typeof ke_hoach_chi_tiet === 'string') {
        try {
          keHoachData = JSON.parse(ke_hoach_chi_tiet);
        } catch (parseErr) {
          await t.rollback();
          return res.status(400).json({ success: false, message: 'ke_hoach_chi_tiet không hợp lệ (JSON).' });
        }
      } else {
        keHoachData = ke_hoach_chi_tiet;
      }
    }

    // Lưu các thay đổi thông thường
    const payload = {};
    if (ten_su_kien !== undefined) payload.ten_su_kien = ten_su_kien;
    if (mo_ta !== undefined) payload.mo_ta = mo_ta;
    if (dia_diem !== undefined) payload.dia_diem = dia_diem;
    if (thoi_gian_bat_dau !== undefined) payload.thoi_gian_bat_dau = thoi_gian_bat_dau;
    if (thoi_gian_ket_thuc !== undefined) payload.thoi_gian_ket_thuc = thoi_gian_ket_thuc;
    if (so_luong_toi_da !== undefined) payload.so_luong_toi_da = so_luong_toi_da;
    if (diem_thuong !== undefined) payload.diem_thuong = diem_thuong;

    if (Object.keys(payload).length) {
      await suKien.update(payload, { transaction: t });
    }

    // Cập nhật nội dung bài viết liên quan nếu cần
    if (noi_dung_bai_viet && suKien.id_bai_viet) {
      await BaiViet.update(
        { noi_dung: noi_dung_bai_viet },
        { where: { id: suKien.id_bai_viet }, transaction: t }
      );
    }

    // Xử lý ke_hoach_chi_tiet: lưu và thông báo cho assignee mới
    if (keHoachData !== undefined) {
      const oldKeHoach = suKien.ke_hoach_chi_tiet || { tasks: [] };
      const oldAssigneeIds = new Set();
      (oldKeHoach.tasks || []).forEach(tk => {
        if (tk?.assignee?.type === 'user' && tk.assignee.id) oldAssigneeIds.add(tk.assignee.id);
      });

      // Lưu ke_hoach mới
      await suKien.update({ ke_hoach_chi_tiet: keHoachData }, { transaction: t });

      // Tạo thông báo cho các assignee mới (user)
      const newAssigneeIds = new Set();
      (keHoachData.tasks || []).forEach(tk => {
        if (tk?.assignee?.type === 'user' && tk.assignee.id) newAssigneeIds.add(tk.assignee.id);
      });

      for (const uid of newAssigneeIds) {
        if (!oldAssigneeIds.has(uid)) {
          try {
            await ThongBao.create({
              id_nguoi_nhan: uid,
              id_nguoi_hanh_dong: idNguoiDung,
              loai: 'phan_cong_task',
              id_muc_tieu: suKien.id,
              loai_muc_tieu: 'ke_hoach'
            }, { transaction: t });
          } catch (nbErr) {
            console.error('Không thể tạo thông báo phân công:', nbErr);
          }
        }
      }
    }

    await t.commit();

    // Trả về dữ liệu cập nhật
    const updated = await SuKien.findByPk(id, { include: [{ model: BaiViet, as: 'bai_viet' }, { model: NguoiDung, as: 'nguoi_tao', attributes: ['id','ho_ten','anh_dai_dien_url'] }] });
    res.json({ success: true, message: 'Cập nhật sự kiện thành công.', data: updated });
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
    if (suKien.id_nguoi_tao !== id_nguoi_dung && !vai_tro.includes('quan_tri_vien')) {
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
    // ✅ Lấy các bài viết đang chờ duyệt
    const baiVietChoDuyet = await BaiViet.findAll({
      where: { trang_thai: 'cho_duyet' },
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: SuKien,
          as: 'su_kien',
          // ✅ Sửa ở đây: Thêm các trường còn thiếu
          attributes: [
            'id', 
            'ten_su_kien', 
            'thoi_gian_bat_dau', 
            'dia_diem', 
            'so_luong_toi_da', 
            'diem_thuong', 
            'ke_hoach_chi_tiet', 
            'trang_thai'
          ]
        }
      ],
      order: [['ngay_tao', 'DESC']]
    });

    // ✅ Lấy các sự kiện chờ duyệt
    const suKienChoDuyet = await SuKien.findAll({
      where: { trang_thai: 'da_gui' },
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: BaiViet,
          as: 'bai_viet',
          attributes: ['noi_dung', 'ngay_tao']
        }
      ],
      order: [['thoi_gian_bat_dau', 'DESC']]
    });

    // Format dữ liệu
    const baiVietFormatted = baiVietChoDuyet.map(item => ({ 
      ...item.toJSON(), 
      loai: item.su_kien ? 'bai_viet_su_kien' : 'bai_viet', // ✅ Phân biệt loại
      ngay_tao: item.ngay_tao
    }));

    const suKienFormatted = suKienChoDuyet.map(item => ({
      id: item.id,
      loai: 'su_kien',
      noi_dung: item.bai_viet?.noi_dung || item.mo_ta,
      tac_gia: item.nguoi_tao,
      ngay_tao: item.bai_viet?.ngay_tao || item.thoi_gian_bat_dau,
      ten_su_kien: item.ten_su_kien,
      dia_diem: item.dia_diem,
      thoi_gian_bat_dau: item.thoi_gian_bat_dau,
      so_luong_toi_da: item.so_luong_toi_da,
      diem_thuong: item.diem_thuong,
      ke_hoach_chi_tiet: item.ke_hoach_chi_tiet,
      trang_thai: item.trang_thai
    }));

    const tatCaNoiDung = [...baiVietFormatted, ...suKienFormatted].sort((a, b) => {
      return new Date(b.ngay_tao) - new Date(a.ngay_tao);
    });

    res.json({ success: true, data: tatCaNoiDung });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chờ duyệt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật trạng thái của một nội dung (Bài viết hoặc Sự kiện)
export const capNhatTrangThai = async (req, res) => {
  const { id, loai, trang_thai_moi } = req.body; // loai: 'bai_viet' | 'su_kien' | 'bai_viet_su_kien'

  if (!id || !loai || !['da_duyet', 'bi_tu_choi'].includes(trang_thai_moi)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
  }

  const transaction = await sequelize.transaction();

  try {
    // ✅ Xử lý 'bai_viet_su_kien' như 'bai_viet'
    const actualLoai = loai === 'bai_viet_su_kien' ? 'bai_viet' : loai;

    if (actualLoai === 'bai_viet') {
      // ✅ Cập nhật trạng thái bài viết và id_nguoi_duyet
      const [updatedCount] = await BaiViet.update(
        { 
          trang_thai: trang_thai_moi,
          id_nguoi_duyet: req.user?.id // ✅ Thêm cập nhật id_nguoi_duyet
        },
        { where: { id }, transaction }
      );

      if (updatedCount === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để cập nhật.' });
      }

      // ✅ Nếu có sự kiện liên kết với bài viết này, cập nhật luôn trạng thái sự kiện
      const suKienLienKet = await SuKien.findOne({ where: { id_bai_viet: id }, transaction });
      if (suKienLienKet) {
        await suKienLienKet.update({ 
          trang_thai: trang_thai_moi,
          id_nguoi_duyet: req.user?.id // ✅ Thêm cập nhật id_nguoi_duyet cho sự kiện liên kết
        }, { transaction });
      }
    } else if (actualLoai === 'su_kien') {
      // ✅ Lấy thông tin sự kiện để tìm bài viết liên kết
      const suKien = await SuKien.findByPk(id, { transaction });
      
      if (!suKien) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện để cập nhật.' });
      }

      // ✅ Cập nhật trạng thái sự kiện và id_nguoi_duyet
      await suKien.update({ 
        trang_thai: trang_thai_moi,
        id_nguoi_duyet: req.user?.id // ✅ Thêm cập nhật id_nguoi_duyet
      }, { transaction });

      // ✅ Nếu sự kiện có bài viết liên kết, cập nhật luôn trạng thái bài viết
      if (suKien.id_bai_viet) {
        await BaiViet.update(
          { 
            trang_thai: trang_thai_moi,
            id_nguoi_duyet: req.user?.id // ✅ Thêm cập nhật id_nguoi_duyet cho bài viết liên kết
          },
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
    const loaiNoiDung = actualLoai === 'bai_viet' ? 'bài viết' : 'sự kiện';
    
    res.json({ 
      success: true, 
      message: `${loaiNoiDung.charAt(0).toUpperCase() + loaiNoiDung.slice(1)} đã được ${thongBao} thành công${actualLoai === 'su_kien' ? ' (bao gồm bài viết liên kết)' : ''}.` 
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

    // Kiểm tra trạng thái - chỉ sửa được khi ở trạng thái ban_nhap hoặc tu_choi
    if (!['ban_nhap', 'tu_choi'].includes(suKien.trang_thai_su_kien)) {
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
        id_muc_tieu: id,
        loai_muc_tieu: 'ke_hoach' // ✅
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
        id_muc_tieu: id,
        loai_muc_tieu: 'ke_hoach' // ✅
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
      id_muc_tieu: id,
      loai_muc_tieu: 'ke_hoach' // ✅
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
    console.log('🔍 duyetKetQuaTask called');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    const { id, taskId } = req.params;
    const { approved, feedback } = req.body;
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id);
    if (!suKien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    // Chỉ người tạo hoặc admin mới được duyệt
    if (suKien.id_nguoi_tao !== userId && !['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro)) {
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt kết quả' });
    }

    // ⚠️ Clone để Sequelize phát hiện thay đổi JSONB
    const keHoach = JSON.parse(JSON.stringify(suKien.ke_hoach_chi_tiet || { tasks: [] }));
    
    console.log('📋 Tìm task với ID:', taskId);
    console.log('📋 Danh sách tasks:', keHoach.tasks?.map(t => ({ id: t.id, title: t.title })));
    
    const taskIndex = keHoach.tasks.findIndex(t => String(t.id) === String(taskId));
    
    if (taskIndex === -1) {
      console.log('❌ Không tìm thấy task với ID:', taskId);
      return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    }

    const task = keHoach.tasks[taskIndex];
    console.log('✅ Tìm thấy task:', task.title);

    // Cập nhật trạng thái duyệt
    keHoach.tasks[taskIndex] = {
      ...task,
      approved: approved,
      feedback: feedback || '',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString()
    };

    console.log('💾 Cập nhật task:', keHoach.tasks[taskIndex]);

    // ⚠️ Đánh dấu field đã thay đổi
    suKien.ke_hoach_chi_tiet = keHoach;
    suKien.changed('ke_hoach_chi_tiet', true);
    await suKien.save();
    
    console.log('✅ Đã lưu vào DB');

    // Gửi thông báo cho người thực hiện
    if (task.assignee?.type === 'user' && task.assignee.id) {
      await ThongBao.create({
        id_nguoi_nhan: task.assignee.id,
        id_nguoi_hanh_dong: userId,
        loai: approved ? 'task_approved' : 'task_rejected',
        id_muc_tieu: parseInt(id),
        loai_muc_tieu: 'su_kien'
      });
      console.log('✅ Đã gửi thông báo');
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

    if (suKien.id_nguoi_tao !== userId) {
      return res.status(403).json({ success: false, message: 'Chỉ người tạo mới có thể gửi duyệt' });
    }

    // ✅ Kiểm tra trạng thái phê duyệt
    if (suKien.trang_thai !== 'ban_nhap' && suKien.trang_thai !== 'tu_choi') {
      return res.status(400).json({ success: false, message: 'Sự kiện đã được gửi duyệt rồi' });
    }

    // ✅ Cập nhật trạng thái phê duyệt
    await suKien.update({ trang_thai: 'da_gui' });

    // Lưu lịch sử
    const keHoach = suKien.ke_hoach_chi_tiet || {};
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: 'gui_khoa',
      user_id: userId,
      user_name: req.user.ho_ten,
      ghi_chu,
      timestamp: new Date().toISOString()
    });
    await suKien.update({ ke_hoach_chi_tiet: keHoach });

    // Gửi thông báo
    const kiemduyetvien = await NguoiDung.findAll({
      where: { vai_tro:{
                  [Op.overlap]: ['quan_tri_vien', 'kiem_duyet_vien']
                } 
              }
    });

    for (const user of kiemduyetvien) {
      await ThongBao.create({
        id_nguoi_nhan: user.id,
        id_nguoi_hanh_dong: userId,
        loai: 'duyet_su_kien',
        id_muc_tieu: id,
        loai_muc_tieu: 'su_kien'
      });
    }

    res.json({ 
      success: true, 
      message: 'Đã gửi sự kiện lên để duyệt'
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
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { action, phan_hoi } = req.body; // 'duyet' | 'tu_choi'
    const userId = req.user?.id;

    if (!['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt' });
    }

    const suKien = await SuKien.findByPk(id, { transaction });
    if (!suKien) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (suKien.trang_thai !== 'da_gui') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Sự kiện chưa được gửi duyệt' });
    }

    // ✅ Chỉ cho phép duyệt khi tất cả nhiệm vụ đã hoàn thành và đã được duyệt
    const parseKeHoach = (raw) => {
      if (!raw) return {};
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try {
          const obj = JSON.parse(raw);
          return obj && typeof obj === 'object' ? obj : {};
        } catch {
          return {};
        }
      }
      return {};
    };

    const keHoachParsed = parseKeHoach(suKien.ke_hoach_chi_tiet);
    const tasks = Array.isArray(keHoachParsed.tasks) ? keHoachParsed.tasks : [];

    const isTaskDone = (t) => {
      if (!t || typeof t !== 'object') return false;
      if (t.status === 'done') return true;
      if (t.completed_at) return true;
      if (t.result) return true;
      return false;
    };

    if (action === 'duyet' && tasks.length > 0) {
      const notReady = tasks.filter((t) => !(isTaskDone(t) && t.approved === true));
      if (notReady.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Chỉ được duyệt sự kiện khi tất cả nhiệm vụ trong kế hoạch đã hoàn thành và đã được duyệt.'
        });
      }
    }

    // ✅ Cập nhật trạng thái phê duyệt
    const newStatusSuKien = action === 'duyet' ? 'da_duyet' : 'tu_choi';
    await suKien.update({ 
      trang_thai: newStatusSuKien,
      id_nguoi_duyet: userId
    }, { transaction });

    // Lưu lịch sử
    const keHoach = keHoachParsed || {};
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: action === 'duyet' ? 'duyet_khoa' : 'tu_choi',
      user_id: userId,
      user_name: req.user.ho_ten,
      phan_hoi,
      timestamp: new Date().toISOString()
    });
    await suKien.update({ ke_hoach_chi_tiet: keHoach }, { transaction });

    // Gửi thông báo cho người tạo
    await ThongBao.create({
      id_nguoi_nhan: suKien.id_nguoi_tao,
      id_nguoi_hanh_dong: userId,
      loai: action === 'duyet' ? 'su_kien_duyet' : 'su_kien_tu_choi',
      id_muc_tieu: id,
      loai_muc_tieu: 'su_kien'
    }, { transaction });

    await transaction.commit();

    res.json({ 
      success: true, 
      message: action === 'duyet' ? 'Đã duyệt sự kiện' : 'Đã từ chối sự kiện',
      data: { trang_thai: newStatusSuKien, phan_hoi }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Lỗi duyetSuKien:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * ✅ 7. Đăng công khai sự kiện (sau khi Khoa duyệt)
 * POST /api/su-kien/:id/dang-cong-khai
 */
export const dangSuKienCongKhai = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const suKien = await SuKien.findByPk(id, {
      include: [{
        model: BaiViet,
        as: 'bai_viet'
      }],
      transaction
    });

    if (!suKien) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    const isOwner = suKien.id_nguoi_tao === userId;
    const isReviewer = ['quan_tri_vien', 'kiem_duyet_vien'].includes(req.user?.vai_tro);
    
    if (!isOwner && !isReviewer) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Không có quyền đăng sự kiện' });
    }

    // ✅ Kiểm tra trạng thái phê duyệt
    if (suKien.trang_thai !== 'da_duyet') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Sự kiện chưa được Khoa duyệt' });
    }

    // ✅ 1. Cập nhật trạng thái phê duyệt sự kiện
    await suKien.update({ 
      trang_thai: 'da_dang'
    }, { transaction });

    // ✅ 2. Cập nhật trạng thái bài viết để công khai
    await BaiViet.update(
      { trang_thai: 'da_dang' },
      { where: { id: suKien.id_bai_viet }, transaction }
    );

    // Lưu lịch sử
    const keHoach = suKien.ke_hoach_chi_tiet || {};
    keHoach.history = keHoach.history || [];
    keHoach.history.push({
      action: 'dang_cong_khai',
      user_id: userId,
      user_name: req.user.ho_ten,
      timestamp: new Date().toISOString()
    });

    // Gửi thông báo cho các đối tượng bắt buộc tham gia
    const targetAudience = keHoach.target_audience || {};
    if (targetAudience.mandatory_participants?.length > 0) {
      for (const participant of targetAudience.mandatory_participants) {
        if (participant.type === 'user') {
          await ThongBao.create({
            id_nguoi_nhan: participant.id,
            id_nguoi_hanh_dong: userId, // ✅ Thêm dòng này
            loai: 'su_kien_bat_buoc',
            id_muc_tieu: id,
            loai_muc_tieu: 'su_kien' // ✅
          });
        }
      }
    }
    
    await suKien.update({ ke_hoach_chi_tiet: keHoach }, { transaction });

    await transaction.commit();

    

    res.json({ 
      success: true,
      message: 'Đã đăng sự kiện công khai',
      data: {
        trang_thai_su_kien: 'da_dang',
        trang_thai_bai_viet: 'da_duyet'
      }
    });
  } catch (error) {
    await transaction.rollback();
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
      whereCondition.vai_tro = {[Op.contains]: ['giao_vien']};
    } else if (type === 'can_bo') {
      whereCondition.vai_tro = {[Op.overlap]: ['quan_tri_vien', 'kiem_duyet_vien', 'giao_vien']};
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

// API: Lấy danh sách nhiệm vụ của người dùng hiện tại
export const layNhiemVuCuaToi = async (req, res) => {
  try {
    const id_nguoi_dung = req.user?.id;

    if (!id_nguoi_dung) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Lấy tất cả sự kiện đã được duyệt
    const suKiens = await SuKien.findAll({
      where: { trang_thai: 'ban_nhap' },
      attributes: ['id', 'ten_su_kien', 'thoi_gian_bat_dau', 'dia_diem', 'ke_hoach_chi_tiet'],
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ],
      order: [['thoi_gian_bat_dau', 'DESC']]
    });

    // Lọc ra các nhiệm vụ được giao cho người dùng hiện tại
    const danhSachNhiemVu = [];

    suKiens.forEach(suKien => {
      const keHoach = suKien.ke_hoach_chi_tiet;
      if (keHoach?.tasks) {
        keHoach.tasks.forEach((task, index) => {
          // Check if task is assigned to current user
          if (task.assignee?.type === 'user' && task.assignee?.id === id_nguoi_dung) {
            // Determine status based on task properties
            let trangThai = 'chua_lam';
            if (task.approved === true) {
              trangThai = 'da_duyet';
            } else if (task.approved === false) {
              trangThai = 'bi_tu_choi';
            } else if (task.status === 'done' || task.result) {
              trangThai = 'cho_duyet';
            }

            danhSachNhiemVu.push({
              id_su_kien: suKien.id,
              ten_su_kien: suKien.ten_su_kien,
              thoi_gian_bat_dau: suKien.thoi_gian_bat_dau,
              dia_diem: suKien.dia_diem,
              nguoi_tao: suKien.nguoi_tao,
              task_index: index,
              task_id: task.id,
              ten_nhiem_vu: task.title,
              mo_ta: task.description,
              deadline: task.deadline,
              trang_thai: trangThai,
              ket_qua: task.result || null,
              tep_dinh_kem: task.attachments || task.tep_dinh_kem || [],
              ngay_nop: task.completed_at || task.submitted_at || null,
              feedback: task.feedback || null
            });
          }
        });
      }
    });

    res.json({
      success: true,
      data: danhSachNhiemVu
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy nhiệm vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// API: Submit kết quả nhiệm vụ
export const submitNhiemVu = async (req, res) => {
  try {
    console.log('📝 submitNhiemVu called');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.user?.id, req.user?.ho_ten);
    console.log(
      'Files:',
      (req.files || []).map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        filename: f.filename
      }))
    );

    const { id_su_kien, task_index } = req.params;
    const { ket_qua } = req.body;
    const id_nguoi_dung = req.user?.id;
    const files = req.files || [];

    if (!id_nguoi_dung) {
      console.log('❌ Không có user ID');
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập'
      });
    }

    const hasKetQuaText = !!(ket_qua && ket_qua.trim() !== '');

    if (!hasKetQuaText && files.length === 0) {
      console.log('❌ Không có kết quả và không có file');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập kết quả hoặc đính kèm ít nhất 1 file'
      });
    }

    console.log('🔍 Tìm sự kiện:', id_su_kien);
    const suKien = await SuKien.findByPk(id_su_kien);

    if (!suKien) {
      console.log('❌ Không tìm thấy sự kiện');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    console.log('✅ Tìm thấy sự kiện:', suKien.ten_su_kien);

    // ⚠️ Clone object để Sequelize phát hiện thay đổi
    const keHoach = JSON.parse(JSON.stringify(suKien.ke_hoach_chi_tiet || {}));
    const taskIdx = parseInt(task_index);

    console.log('📋 Kế hoạch có tasks:', keHoach?.tasks?.length);
    console.log('🎯 Task index:', taskIdx);

    if (!keHoach?.tasks || !keHoach.tasks[taskIdx]) {
      console.log('❌ Không tìm thấy nhiệm vụ tại index:', taskIdx);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhiệm vụ'
      });
    }

    const task = keHoach.tasks[taskIdx];
    console.log('📌 Task hiện tại:', {
      title: task.title,
      assignee: task.assignee,
      status: task.status
    });

    // Kiểm tra quyền
    if (task.assignee?.type !== 'user' || task.assignee?.id !== id_nguoi_dung) {
      console.log('❌ Không có quyền submit:', {
        taskAssigneeType: task.assignee?.type,
        taskAssigneeId: task.assignee?.id,
        userId: id_nguoi_dung
      });
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền submit nhiệm vụ này'
      });
    }

    console.log('✅ Người dùng có quyền submit');

    const attachments = buildAttachmentsFromFiles(files);

    // Cập nhật trạng thái và kết quả
    keHoach.tasks[taskIdx] = {
      ...task,
      status: 'done',
      result: hasKetQuaText ? ket_qua : (task.result || ''),
      attachments,
      submitted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      approved: null, // Reset approval status (dùng null thay vì undefined)
      feedback: null // Clear old feedback (dùng null thay vì undefined)
    };

    console.log('📝 Task sau khi cập nhật:', keHoach.tasks[taskIdx]);
    console.log('💾 Lưu kế hoạch mới...');
    
    // ⚠️ Quan trọng: Đánh dấu field đã thay đổi và update
    suKien.ke_hoach_chi_tiet = keHoach;
    suKien.changed('ke_hoach_chi_tiet', true);
    await suKien.save();
    
    console.log('✅ Đã lưu kế hoạch');

    // Verify - reload và kiểm tra
    await suKien.reload();
    console.log('🔍 Kiểm tra lại DB:', suKien.ke_hoach_chi_tiet.tasks[taskIdx]);

    // Gửi thông báo cho người tạo sự kiện
    console.log('📬 Gửi thông báo đến:', suKien.id_nguoi_tao);
    await ThongBao.create({
      id_nguoi_nhan: suKien.id_nguoi_tao,
      id_nguoi_hanh_dong: id_nguoi_dung,
      loai: 'submit_nhiem_vu',
      id_muc_tieu: parseInt(id_su_kien),
      loai_muc_tieu: 'su_kien'
    });
    console.log('✅ Đã gửi thông báo');

    console.log('🎉 Submit nhiệm vụ thành công!');
    res.json({
      success: true,
      message: 'Đã gửi kết quả thành công',
      data: keHoach.tasks[taskIdx]
    });
  } catch (error) {
    console.error('❌ Lỗi khi submit nhiệm vụ:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

export const laySuKienTheoKhoang = async (req, res) => {
  const { start, end, id_phong } = req.query;
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'Thiếu tham số start hoặc end (ISO)' });
  }

  const startDt = new Date(start);
  const endDt = new Date(end);
  if (isNaN(startDt) || isNaN(endDt)) {
    return res.status(400).json({ success: false, message: 'start hoặc end không hợp lệ' });
  }

  try {
    const where = {
      thoi_gian_bat_dau: { [Op.lt]: endDt },
      thoi_gian_ket_thuc: { [Op.gt]: startDt }
    };
    if (id_phong) where.id_phong = parseInt(id_phong, 10);

    const rows = await db.SuKien.findAll({
      where,
      order: [['thoi_gian_bat_dau', 'ASC']]
    });

    return res.json({ success: true, message: 'Lấy sự kiện theo khoảng thành công', data: rows });
  } catch (error) {
    console.error('suKienController.laySuKienTheoKhoang error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy sự kiện' });
  }
};

// ✅ giữ cách build media giống baiVietController
const buildMediaFromFiles = (files) => {
  return (files || []).map((file) => ({
    url: file.path,
    public_id: file.filename,
    resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image'
  }));
};

const buildAttachmentsFromFiles = (files) => {
  return (files || []).map((file) => {
    const mimetype = file.mimetype || '';
    const resource_type = mimetype.startsWith('video/')
      ? 'video'
      : mimetype.startsWith('image/')
        ? 'image'
        : 'raw';

    return {
      url: file.path,
      public_id: file.filename,
      originalname: file.originalname,
      mimetype,
      size: file.size,
      resource_type
    };
  });
};

const detectMediaType = (mediaArray) => {
  if (!mediaArray || mediaArray.length === 0) return null;
  const hasImage = mediaArray.some((m) => m.resource_type === 'image');
  const hasVideo = mediaArray.some((m) => m.resource_type === 'video');
  if (hasImage && hasVideo) return 'mixed';
  if (hasVideo) return 'video';
  if (hasImage) return 'image';
  return null;
};