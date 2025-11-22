import db from '../models/index.js';
import { taoThongBao } from './thongBaoController.js';

const { BaiViet, NguoiDung, BinhLuan, LuotThich, SuKien } = db;

// ✅ XÓA các helper phức tạp, CHỈ GIỮ CÁI NÀY
const buildMediaFromFiles = (files) => {
  return files.map(file => ({
    url: file.path,
    public_id: file.filename,
    resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image'
  }));
};

const detectMediaType = (mediaArray) => {
  if (!mediaArray || mediaArray.length === 0) return null;
  const hasImage = mediaArray.some(m => m.resource_type === 'image');
  const hasVideo = mediaArray.some(m => m.resource_type === 'video');
  if (hasImage && hasVideo) return 'mixed';
  if (hasVideo) return 'video';
  if (hasImage) return 'image';
  return null;
};

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

    const baiVietsWithDetails = await Promise.all(
      baiViets.map(async (baiViet) => {
        const baiVietData = baiViet.toJSON();

        const soLuotThich = await LuotThich.count({
          where: {
            id_doi_tuong: baiViet.id,
            loai_doi_tuong: 'bai_viet'
          }
        });

        const soBinhLuan = await BinhLuan.count({
          where: { id_bai_viet: baiViet.id }
        });

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
    console.error('❌ Lỗi:', error);
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

    if (req.files && req.files.length > 0) {
      media_urls = buildMediaFromFiles(req.files);
      media_type = detectMediaType(media_urls);
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

// ✅ CẬP NHẬT BÀI VIẾT - CÓ XÓA ẢNH CŨ TRÊN CLOUDINARY
export const capNhatBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_dung, existing_media_urls } = req.body;
    const idNguoiDung = req.user?.id;

    console.log('📥 Nhận request cập nhật:', {
      id,
      noi_dung,
      existing_media_urls,
      files: req.files?.length || 0
    });

    const baiViet = await BaiViet.findByPk(id);
    if (!baiViet) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    if (baiViet.id_tac_gia !== idNguoiDung) return res.status(403).json({ success: false, message: 'Không có quyền.' });

    // ✅ Lấy media cũ từ DB
    const oldMediaInDB = baiViet.media_urls || [];
    console.log('📦 Media cũ trong DB:', oldMediaInDB);

    // ✅ Lấy media cũ được giữ lại từ request
    let mediaToKeep = [];
    if (existing_media_urls) {
      try {
        mediaToKeep = JSON.parse(existing_media_urls);
        console.log('💾 Media được giữ lại:', mediaToKeep);
      } catch (e) {
        console.error('❌ Lỗi parse existing_media_urls:', e);
        mediaToKeep = [];
      }
    }

    // ✅ Tìm media cần xóa (có trong DB nhưng không có trong mediaToKeep)
    const mediaToDelete = oldMediaInDB.filter(
      oldItem => !mediaToKeep.some(keepItem => keepItem.public_id === oldItem.public_id)
    );

    console.log('🗑️ Media cần xóa:', mediaToDelete);

    // ✅ XÓA ẢNH CŨ TRÊN CLOUDINARY
    if (mediaToDelete.length > 0) {
      const { cloudinary } = await import('../config/cloudinary.js');
      
      await Promise.all(
        mediaToDelete.map(async (media) => {
          try {
            const result = await cloudinary.uploader.destroy(media.public_id, {
              resource_type: media.resource_type
            });
            console.log(`✅ Đã xóa ${media.public_id}:`, result);
          } catch (err) {
            console.error(`❌ Lỗi xóa ${media.public_id}:`, err);
          }
        })
      );
    }

    // ✅ Bắt đầu với media được giữ lại
    let media_urls = [...mediaToKeep];

    // ✅ Thêm file mới từ upload (giống tạo bài viết)
    if (req.files && req.files.length > 0) {
      const newMedia = buildMediaFromFiles(req.files);
      console.log('📸 Media mới upload:', newMedia);
      media_urls = [...media_urls, ...newMedia];
    }

    console.log('✅ Tổng media sau merge:', media_urls);

    const media_type = detectMediaType(media_urls);

    // ✅ Cập nhật vào DB
    await baiViet.update({
      noi_dung,
      media_urls: media_urls.length > 0 ? media_urls : [],
      media_type
    });

    console.log('💾 Đã cập nhật vào DB');

    // ✅ Trả về dữ liệu đầy đủ
    const updatedPost = await BaiViet.findByPk(id, {
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    res.json({ 
      success: true, 
      message: 'Cập nhật bài viết thành công.', 
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Lỗi capNhatBaiViet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server.', 
      error: error.message 
    });
  }
};

// Thích/bỏ thích bài viết
export const thichBaiViet = async (req, res) => {
  try {
    const { id: id_bai_viet } = req.params;
    const id_nguoi_dung = req.user?.id;

    if (!id_nguoi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu id_nguoi_dung'
      });
    }

    const baiViet = await BaiViet.findByPk(id_bai_viet);
    if (!baiViet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const luotThich = await LuotThich.findOne({
      where: {
        id_nguoi_dung,
        id_doi_tuong: id_bai_viet,
        loai_doi_tuong: 'bai_viet'
      }
    });

    if (!luotThich) {
      await LuotThich.create({
        id_nguoi_dung,
        id_doi_tuong: id_bai_viet,
        loai_doi_tuong: 'bai_viet'
      });

      if (baiViet && baiViet.id_tac_gia !== id_nguoi_dung) {
        await taoThongBao({
          id_nguoi_nhan: baiViet.id_tac_gia,
          id_nguoi_tao: id_nguoi_dung,
          loai_thong_bao: 'like_bai_viet',
          tieu_de: '❤️ Có người thích bài viết của bạn',
          noi_dung: 'đã thích bài viết của bạn',
          link: `/bai-viet/${id_bai_viet}`,
          id_doi_tuong: id_bai_viet,
          loai_doi_tuong: 'bai_viet'
        });
      }
    } else {
      await luotThich.destroy();
    }

    res.json({
      success: true,
      message: luotThich ? 'Đã bỏ thích bài viết' : 'Đã thích bài viết',
      data: { da_thich: !luotThich }
    });
  } catch (error) {
    console.error('Lỗi khi thích bài viết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ XÓA BÀI VIẾT - ĐƠN GIẢN
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
          cloudinary.uploader.destroy(media.public_id, { 
            resource_type: media.resource_type 
          }).catch(err => console.error('Lỗi xóa media:', err))
        )
      );
    }

    await baiViet.destroy();
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (error) {
    console.error('❌ Lỗi:', error);
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
        id_binh_luan_cha: null
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

    // ✅ Tạo thông báo
    const baiViet = await BaiViet.findByPk(id_bai_viet);
    if (baiViet && baiViet.id_tac_gia !== id_tac_gia) {
      if (id_binh_luan_cha) {
        const binhLuanCha = await BinhLuan.findByPk(id_binh_luan_cha);
        if (binhLuanCha && binhLuanCha.id_tac_gia !== id_tac_gia) {
          await taoThongBao({
            id_nguoi_nhan: binhLuanCha.id_tac_gia,
            id_nguoi_tao: id_tac_gia,
            loai_thong_bao: 'tra_loi_binh_luan',
            tieu_de: '💬 Có người trả lời bình luận của bạn',
            noi_dung: `đã trả lời bình luận của bạn: "${noi_dung}"`,
            link: `/bai-viet/${id_bai_viet}?commentId=${binhLuan.id}`,
            id_doi_tuong: binhLuan.id,
            loai_doi_tuong: 'binh_luan'
          });
        }
      } else {
        await taoThongBao({
          id_nguoi_nhan: baiViet.id_tac_gia,
          id_nguoi_tao: id_tac_gia,
          loai_thong_bao: 'binh_luan_bai_viet',
          tieu_de: '💬 Có người bình luận bài viết của bạn',
          noi_dung: `đã bình luận: "${noi_dung}"`,
          link: `/bai-viet/${id_bai_viet}?commentId=${binhLuan.id}`,
          id_doi_tuong: binhLuan.id,
          loai_doi_tuong: 'binh_luan'
        });
      }
    }

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

// ✅ LẤY CHI TIẾT - KHÔNG NORMALIZE
export const layChiTietBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const baiViet = await BaiViet.findByPk(id, {
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url', 'vai_tro']
        },
        {
          model: SuKien,
          as: 'su_kien',
          required: false
        }
      ]
    });

    if (!baiViet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const so_luot_thich = await LuotThich.count({
      where: {
        id_doi_tuong: id,
        loai_doi_tuong: 'bai_viet'
      }
    });

    let da_thich = false;
    if (id_nguoi_dung) {
      const luotThich = await LuotThich.findOne({
        where: {
          id_nguoi_dung,
          id_doi_tuong: id,
          loai_doi_tuong: 'bai_viet'
        }
      });
      da_thich = !!luotThich;
    }

    const so_binh_luan = await BinhLuan.count({
      where: { id_bai_viet: id }
    });

    const baiVietData = {
      ...baiViet.toJSON(),
      so_luot_thich,
      da_thich,
      so_binh_luan
    };

    res.json({
      success: true,
      data: baiVietData
    });
  } catch (error) {
    console.error('❌ Lỗi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};