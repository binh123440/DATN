import db from '../models/index.js';
const { BaiViet, NguoiDung, BinhLuan, LuotThich, SuKien } = db;

// Lấy danh sách bài viết (bao gồm cả sự kiện)
export const layDanhSachBaiViet = async (req, res) => {
  try {
    const { page = 1, limit = 10, trang_thai = 'da_duyet' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: baiViets } = await BaiViet.findAndCountAll({
      where: { trang_thai },
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url', 'vai_tro']
        },
        {
          model: SuKien,
          as: 'su_kien',
          required: false, // LEFT JOIN để lấy cả bài viết thường
          attributes: [
            'id', 'id_nguoi_tao', 'ten_su_kien', 'mo_ta', 'dia_diem', 
            'thoi_gian_bat_dau', 'so_luong_toi_da', 'diem_thuong', 'trang_thai'
          ]
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Thêm thông tin lượt thích và số lượng đăng ký (cho sự kiện)
    const baiVietsWithDetails = await Promise.all(
      baiViets.map(async (baiViet) => {
        const baiVietData = baiViet.toJSON();

        // Đếm lượt thích
        const soLuotThich = await LuotThich.count({
          where: {
            id_doi_tuong: baiViet.id,
            loai_doi_tuong: 'bai_viet'
          }
        });

        // Đếm bình luận
        const soBinhLuan = await BinhLuan.count({
          where: { id_bai_viet: baiViet.id }
        });

        // Nếu là sự kiện, đếm số người đăng ký
        let thongTinSuKien = null;
        if (baiVietData.su_kien) {
          const { DangKySuKien } = db;
          const soDaDangKy = await DangKySuKien.count({
            where: {
              id_su_kien: baiVietData.su_kien.id,
              trang_thai: 'da_dang_ky'
            }
          });

          thongTinSuKien = {
            ...baiVietData.su_kien,
            so_da_dang_ky: soDaDangKy,
            con_cho: baiVietData.su_kien.so_luong_toi_da - soDaDangKy
          };
        }

        return {
          ...baiVietData,
          so_luot_thich: soLuotThich,
          so_binh_luan: soBinhLuan,
          su_kien: thongTinSuKien
        };
      })
    );

    res.json({
      success: true,
      message: 'Lấy danh sách bài viết thành công',
      data: {
        bai_viets: baiVietsWithDetails,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_so_bai_viet: count,
          so_bai_viet_moi_trang: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài viết',
      error: error.message
    });
  }
};

// Tạo bài viết mới (thường)
export const taoBaiViet = async (req, res) => {
  try {
    const { id_tac_gia, noi_dung } = req.body;

    if (!id_tac_gia || !noi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (id_tac_gia, noi_dung)'
      });
    }

    const baiViet = await BaiViet.create({
      id_tac_gia,
      noi_dung,
      trang_thai: 'da_duyet' // Tự động duyệt cho bài viết thường
    });

    const baiVietDayDu = await BaiViet.findByPk(baiViet.id, {
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo bài viết thành công',
      data: baiVietDayDu
    });
  } catch (error) {
    console.error('Lỗi khi tạo bài viết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bài viết',
      error: error.message
    });
  }
};

// Thích/bỏ thích bài viết
export const thichBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_nguoi_dung } = req.body;

    if (!id_nguoi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu id_nguoi_dung'
      });
    }

    const baiViet = await BaiViet.findByPk(id);
    if (!baiViet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const luotThich = await LuotThich.findOne({
      where: {
        id_nguoi_dung,
        id_doi_tuong: id,
        loai_doi_tuong: 'bai_viet'
      }
    });

    if (luotThich) {
      await luotThich.destroy();
      return res.json({
        success: true,
        message: 'Đã bỏ thích bài viết',
        data: { da_thich: false }
      });
    } else {
      await LuotThich.create({
        id_nguoi_dung,
        id_doi_tuong: id,
        loai_doi_tuong: 'bai_viet'
      });
      return res.json({
        success: true,
        message: 'Đã thích bài viết',
        data: { da_thich: true }
      });
    }
  } catch (error) {
    console.error('Lỗi khi thích bài viết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};