import db from '../models/index.js';
const { BaiViet, NguoiDung, BinhLuan, LuotThich, SuKien } = db;

// Lấy danh sách bài viết (bao gồm cả sự kiện)
export const layDanhSachBaiViet = async (req, res) => {
  try {
    const { page = 1, limit = 10, trang_thai = 'da_duyet' } = req.query;
    const id_nguoi_dung = req.user?.id;
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

        // ✅ Kiểm tra người dùng hiện tại đã thích bài viết này chưa
        let daThich = false;
        if (id_nguoi_dung) {
          const luotThich = await LuotThich.findOne({
            where: {
              id_nguoi_dung: id_nguoi_dung,
              id_doi_tuong: baiViet.id,
              loai_doi_tuong: 'bai_viet'
            }
          });
          daThich = !!luotThich;
          
          // ✅ LOG RA TRẠNG THÁI THÍCH
          console.log(`📊 Bài viết #${baiViet.id}:`, {
            id_bai_viet: baiViet.id,
            id_nguoi_dung: id_nguoi_dung,
            da_thich: daThich,
            so_luot_thich: soLuotThich,
            co_ban_ghi_luot_thich: !!luotThich
          });
        } else {
          console.log(`⚠️ Bài viết #${baiViet.id}: Không có ID người dùng để kiểm tra`);
        }

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
          da_thich: daThich, 
          su_kien: thongTinSuKien
        };
      })
    );

    console.log(`✅ Trả về bài viết`);

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
    console.error('❌ Lỗi khi lấy danh sách bài viết:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Tạo bài viết mới (thường)
export const taoBaiViet = async (req, res) => {
  try {
    const { id_tac_gia, noi_dung } = req.body;

    if (!id_tac_gia || (!noi_dung && (!req.files || req.files.length === 0))) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    let media_urls = [];
    let media_type = null;

    // ✅ Lấy URL từ Cloudinary
    if (req.files && req.files.length > 0) {
      media_urls = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      }));

      const hasImage = req.files.some(f => f.mimetype.startsWith('image/'));
      const hasVideo = req.files.some(f => f.mimetype.startsWith('video/'));
      media_type = hasImage && hasVideo ? 'mixed' : hasImage ? 'image' : 'video';
    }

    const baiViet = await BaiViet.create({
      id_tac_gia,
      noi_dung,
      media_urls,
      media_type,
      trang_thai: 'da_duyet'
    });

    const baiVietDayDu = await BaiViet.findByPk(baiViet.id, {
      include: [{ model: NguoiDung, as: 'tac_gia', attributes: ['id', 'ho_ten', 'anh_dai_dien_url'] }]
    });

    res.status(201).json({ success: true, message: 'Đăng bài thành công', data: baiVietDayDu });
  } catch (error) {
    console.error('❌ Lỗi khi tạo bài viết:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
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

export const xoaBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const baiViet = await BaiViet.findByPk(id);

    if (!baiViet) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // ✅ Xóa media trên Cloudinary
    if (baiViet.media_urls && baiViet.media_urls.length > 0) {
      const { cloudinary } = await import('../config/cloudinary.js');
      await Promise.all(
        baiViet.media_urls.map(media => 
          cloudinary.uploader.destroy(media.public_id, { resource_type: media.resource_type })
        )
      );
    }

    await baiViet.destroy();
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (error) {
    console.error('❌ Lỗi khi xóa bài viết:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};