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
          required: false,
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

    // ✅ Thêm thông tin lượt thích, bình luận và số lượng đăng ký
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

        // ✅ Đếm bình luận (bao gồm cả reply)
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
          so_binh_luan: soBinhLuan, // ✅ Thêm số lượng bình luận
          da_thich: daThich, 
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

// Cập nhật bài viết
export const capNhatBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_dung, media_urls, media_type } = req.body;
    const idNguoiDung = req.user?.id;

    if (!noi_dung && !media_urls) {
      return res.status(400).json({ success: false, message: 'Không có nội dung cần cập nhật.' });
    }

    const baiViet = await BaiViet.findByPk(id);
    if (!baiViet) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    if (baiViet.id_tac_gia !== idNguoiDung) return res.status(403).json({ success: false, message: 'Không có quyền.' });

    const payload = {};
    if (noi_dung !== undefined) payload.noi_dung = noi_dung;
    if (media_urls !== undefined) payload.media_urls = media_urls;
    if (media_type !== undefined) payload.media_type = media_type;

    await baiViet.update(payload);
    res.json({ success: true, message: 'Cập nhật bài viết thành công.', data: baiViet });
  } catch (error) {
    console.error('capNhatBaiViet error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
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

// ✅ ==================== BÌNH LUẬN ====================

// Lấy danh sách bình luận của bài viết
export const layDanhSachBinhLuan = async (req, res) => {
  try {
    const { id_bai_viet } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: binhLuans } = await BinhLuan.findAndCountAll({
      where: { 
        id_bai_viet,
        id_binh_luan_cha: null // Chỉ lấy bình luận gốc
      },
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: BinhLuan,
          as: 'binh_luan_tra_loi',
          include: [
            {
              model: NguoiDung,
              as: 'tac_gia',
              attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
            }
          ]
        }
      ],
      order: [
        ['ngay_tao', 'DESC'],
        [{ model: BinhLuan, as: 'binh_luan_tra_loi' }, 'ngay_tao', 'ASC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      message: 'Lấy danh sách bình luận thành công',
      data: {
        binh_luans: binhLuans,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_so_binh_luan: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Tạo bình luận mới
export const taoBinhLuan = async (req, res) => {
  try {
    const { id_bai_viet, id_tac_gia, noi_dung, id_binh_luan_cha } = req.body;

    if (!id_bai_viet || !id_tac_gia || !noi_dung?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const binhLuan = await BinhLuan.create({
      id_bai_viet,
      id_tac_gia,
      noi_dung: noi_dung.trim(),
      id_binh_luan_cha: id_binh_luan_cha || null
    });

    const binhLuanDayDu = await BinhLuan.findByPk(binhLuan.id, {
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
      message: 'Tạo bình luận thành công',
      data: binhLuanDayDu
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Cập nhật bình luận
export const capNhatBinhLuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_dung } = req.body;
    const id_nguoi_dung = req.user?.id;

    if (!noi_dung?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung không được để trống'
      });
    }

    const binhLuan = await BinhLuan.findByPk(id);
    
    if (!binhLuan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    if (binhLuan.id_tac_gia !== id_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bình luận này'
      });
    }

    binhLuan.noi_dung = noi_dung.trim();
    await binhLuan.save();

    res.json({
      success: true,
      message: 'Cập nhật bình luận thành công',
      data: binhLuan
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Xóa bình luận
export const xoaBinhLuan = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const binhLuan = await BinhLuan.findByPk(id);
    
    if (!binhLuan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    if (binhLuan.id_tac_gia !== id_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }

    // Xóa cả reply nếu có
    await BinhLuan.destroy({
      where: { id_binh_luan_cha: id }
    });

    await binhLuan.destroy();

    res.json({
      success: true,
      message: 'Xóa bình luận thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};