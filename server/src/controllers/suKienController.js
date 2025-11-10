import db from '../models/index.js';
import * as geolib from 'geolib';
const { SuKien, BaiViet, NguoiDung, DangKySuKien, sequelize } = db;

// Lấy danh sách sự kiện
export const layDanhSachSuKien = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
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
      noi_dung_bai_viet
    } = req.body;

    // Validation
    if (!id_nguoi_tao || !ten_su_kien || !thoi_gian_bat_dau || !so_luong_toi_da || !diem_thuong) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // 1. Tạo bài viết trước
    const baiViet = await BaiViet.create({
      id_tac_gia: id_nguoi_tao,
      noi_dung: noi_dung_bai_viet || mo_ta || `Sự kiện: ${ten_su_kien}`,
      trang_thai: 'cho_duyet'
    }, { transaction });

    // 2. Tạo sự kiện
    const suKien = await SuKien.create({
      id_nguoi_tao,
      id_bai_viet: baiViet.id,
      ten_su_kien,
      mo_ta,
      dia_diem,
      thoi_gian_bat_dau,
      so_luong_toi_da,
      diem_thuong,
      trang_thai: 'cho_duyet'
    }, { transaction });

    await transaction.commit();

    // Lấy thông tin đầy đủ
    const suKienDayDu = await SuKien.findByPk(suKien.id, {
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: BaiViet,
          as: 'bai_viet'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công',
      data: suKienDayDu
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi khi tạo sự kiện:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sự kiện',
      error: error.message
    });
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