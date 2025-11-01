import db from '../models/index.js';
const { SuKien, BaiViet, NguoiDung, DangKySuKien } = db;

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
    const { id } = req.params;
    const { id_nguoi_dung } = req.query;

    if (!id_nguoi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu id_nguoi_dung'
      });
    }

    const dangKy = await DangKySuKien.findOne({
      where: {
        id_nguoi_dung,
        id_su_kien: id
      }
    });

    res.json({
      success: true,
      data: {
        da_dang_ky: !!dangKy,
        thong_tin: dangKy || null
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};