import { Op, Sequelize } from 'sequelize';
import db from '../models/index.js';
import { taoThongBao } from './thongBaoController.js';
import { cloudinary } from '../config/cloudinary.js';

const { BaiViet, NguoiDung, CuocHoiThoai, ThanhVienHoiThoai, LuotThich, BinhLuan} = db;

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
    const idNguoiDung = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // ✅ Lấy danh sách nhóm mà user tham gia
    const thanhVien = await ThanhVienHoiThoai.findAll({
      where: { id_nguoi_dung: idNguoiDung },
      attributes: ['id_cuoc_hoi_thoai'],
      raw: true
    });
    const nhomIds = thanhVien.map(tv => tv.id_cuoc_hoi_thoai);

    // ✅ Điều kiện lọc: 
    // - Bài viết công khai (id_cuoc_hoi_thoai = null) 
    // - HOẶC bài viết trong nhóm mà user là thành viên
    // - VÀ chỉ lấy bài viết đã duyệt
    const whereClause = {
      [Op.and]: [
        // ✅ Chỉ lấy bài viết đã duyệt   todo
        { trang_thai: 'da_dang' }, 
        // ✅ Bài viết công khai hoặc trong nhóm của user
        {
          [Op.or]: [
            { id_cuoc_hoi_thoai: null },
            nhomIds.length ? { id_cuoc_hoi_thoai: nhomIds } : { id_cuoc_hoi_thoai: -1 }
          ]
        }
      ]
    };

    const { rows, count } = await BaiViet.findAndCountAll({
      where: whereClause,
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "LuotThich" AS lt
              WHERE lt.id_doi_tuong = "BaiViet".id 
                AND lt.loai_doi_tuong = 'bai_viet'
            )`),
            'so_luot_thich'
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "BinhLuan" AS bl
              WHERE bl.id_bai_viet = "BaiViet".id
            )`),
            'so_binh_luan'
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*) > 0
              FROM "LuotThich" AS lt
              WHERE lt.id_doi_tuong = "BaiViet".id 
                AND lt.loai_doi_tuong = 'bai_viet'
                AND lt.id_nguoi_dung = ${idNguoiDung}
            )`),
            'da_thich'
          ]
        ]
      },
      include: [
        { 
          model: NguoiDung, 
          as: 'tac_gia', 
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url'] 
        },
        { 
          model: CuocHoiThoai, 
          as: 'nhom', 
          attributes: ['id', 'ten_hoi_thoai'], 
          required: false 
        },
        { 
          model: db.SuKien, 
          as: 'su_kien',
          attributes: [
            'id',
            'id_nguoi_tao',
            'id_bai_viet',
            'ten_su_kien',
            'dia_diem',
            'thoi_gian_bat_dau',
            'thoi_gian_ket_thuc',
            'so_luong_toi_da',
            'diem_thuong',
            'id_phong',
            'ke_hoach_chi_tiet',
            'trang_thai'
          ],
          where: { trang_thai: { [Op.in]: ['da_dang'] } },
          required: false
        },
        {
          model: BaiViet,
          as: 'bai_viet_goc',
          required: false,
          attributes: ['id', 'noi_dung', 'ngay_tao', 'media_urls', 'id_tac_gia', 'id_cuoc_hoi_thoai'],
          include: [
            { model: NguoiDung, as: 'tac_gia', attributes: ['id', 'ho_ten', 'anh_dai_dien_url'], required: false },
            { model: CuocHoiThoai, as: 'nhom', attributes: ['id', 'ten_hoi_thoai'], required: false },
            {
              model: db.SuKien,
              as: 'su_kien',
              attributes: [
                'id',
                'id_nguoi_tao',
                'id_bai_viet',
                'ten_su_kien',
                'dia_diem',
                'thoi_gian_bat_dau',
                'thoi_gian_ket_thuc',
                'so_luong_toi_da',
                'diem_thuong',
                'id_phong',
                'ke_hoach_chi_tiet',
                'trang_thai'
              ],
              where: { trang_thai: { [Op.in]: ['da_dang'] } },
              required: false
            }
          ]
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      subQuery: false
    });

    console.log(`📊 Lấy danh sách bài viết - Trang ${page}:`, {
      tong_bai_viet: count,
      bai_viet_trang_nay: rows.length,
      bai_viet_su_kien: rows.filter(bv => bv.su_kien).length,
      bai_viet_nhom: rows.filter(bv => bv.id_cuoc_hoi_thoai).length
    });

    res.json({
      success: true,
      data: {
        bai_viets: rows,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_bai_viet: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách bài viết:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Tạo bài viết mới (thường)
export const taoBaiViet = async (req, res) => {
  try {
    const { noi_dung, id_cuoc_hoi_thoai } = req.body;
    const id_tac_gia = req.user.id;

    console.log('📝 Tạo bài viết:', {
      id_tac_gia,
      noi_dung: noi_dung?.substring(0, 50),
      id_cuoc_hoi_thoai,
      files: req.files?.length || 0
    });

    // Validate
    if (!noi_dung || noi_dung.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bài viết không được để trống'
      });
    }

    // ✅ SỬ DỤNG buildMediaFromFiles - giống hàm capNhatBaiViet
    // Files đã được upload tự động lên Cloudinary nhờ middleware
    let media_urls = [];
    if (req.files && req.files.length > 0) {
      media_urls = buildMediaFromFiles(req.files);
      console.log('📸 Media uploaded:', media_urls);
    }

    const media_type = detectMediaType(media_urls);

    // Tạo bài viết mới
    const baiViet = await BaiViet.create({
      noi_dung: noi_dung.trim(),
      id_tac_gia,
      id_cuoc_hoi_thoai: id_cuoc_hoi_thoai || null,
      media_urls: media_urls.length > 0 ? media_urls : [], // ✅ Lưu array object
      media_type, // ✅ Thêm media_type
      trang_thai: 'da_dang',
      ngay_tao: new Date()
    });

    // Lấy thông tin bài viết vừa tạo kèm thông tin tác giả
    const baiVietMoi = await BaiViet.findByPk(baiViet.id, {
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    console.log('✅ Tạo bài viết thành công:', {
      id: baiVietMoi.id,
      media_count: media_urls.length,
      media_type
    });

    res.status(201).json({
      success: true,
      message: 'Tạo bài viết thành công',
      data: baiVietMoi
    });
  } catch (error) {
    console.error('❌ Lỗi tạo bài viết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
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

      // ✅ Sửa tham số theo đúng schema mới
      if (baiViet && baiViet.id_tac_gia !== id_nguoi_dung) {
        await taoThongBao({
          id_nguoi_nhan: baiViet.id_tac_gia,
          id_nguoi_hanh_dong: id_nguoi_dung,  // ✅ Đổi từ id_nguoi_tao
          loai: 'like_bai_viet',              // ✅ Đổi từ loai_thong_bao
          id_muc_tieu: parseInt(id_bai_viet), // ✅ Đổi từ id_doi_tuong
          loai_muc_tieu: 'bai_viet'           // ✅ Đổi từ loai_doi_tuong
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

    // ✅ Sửa tham số theo đúng schema mới
    const baiViet = await BaiViet.findByPk(id_bai_viet);
    if (baiViet && baiViet.id_tac_gia !== id_tac_gia) {
      if (id_binh_luan_cha) {
        const binhLuanCha = await BinhLuan.findByPk(id_binh_luan_cha);
        if (binhLuanCha && binhLuanCha.id_tac_gia !== id_tac_gia) {
          await taoThongBao({
            id_nguoi_nhan: binhLuanCha.id_tac_gia,
            id_nguoi_hanh_dong: id_tac_gia,  // ✅ Đổi từ id_nguoi_tao
            loai: 'tra_loi_binh_luan',       // ✅ Đổi từ loai_thong_bao
            id_muc_tieu: binhLuan.id,        // ✅ Đổi từ id_doi_tuong
            loai_muc_tieu: 'binh_luan'       // ✅ Đổi từ loai_doi_tuong
          });
        }
      } else {
        await taoThongBao({
          id_nguoi_nhan: baiViet.id_tac_gia,
          id_nguoi_hanh_dong: id_tac_gia,   // ✅ Đổi từ id_nguoi_tao
          loai: 'binh_luan_bai_viet',       // ✅ Đổi từ loai_thong_bao
          id_muc_tieu: binhLuan.id,         // ✅ Đổi từ id_doi_tuong
          loai_muc_tieu: 'binh_luan'        // ✅ Đổi từ loai_doi_tuong
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
    const idNguoiDung = req.user.id;
    const { id } = req.params;

    const baiViet = await BaiViet.findByPk(id, {
      attributes: {
        include: [
          // ✅ Sửa tên bảng từ luot_thich → LuotThich
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "LuotThich" AS lt
              WHERE lt.id_doi_tuong = "BaiViet".id 
                AND lt.loai_doi_tuong = 'bai_viet'
            )`),
            'so_luot_thich'
          ],
          // ✅ Sửa tên bảng từ binh_luan → BinhLuan
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "BinhLuan" AS bl
              WHERE bl.id_bai_viet = "BaiViet".id
            )`),
            'so_binh_luan'
          ],
          // ✅ Sửa tên bảng từ luot_thich → LuotThich
          [
            Sequelize.literal(`(
              SELECT COUNT(*) > 0
              FROM "LuotThich" AS lt
              WHERE lt.id_doi_tuong = "BaiViet".id 
                AND lt.loai_doi_tuong = 'bai_viet'
                AND lt.id_nguoi_dung = ${idNguoiDung}
            )`),
            'da_thich'
          ]
        ]
      },
      include: [
        { model: NguoiDung, as: 'tac_gia', attributes: ['id', 'ho_ten', 'anh_dai_dien_url'] },
        { model: CuocHoiThoai, as: 'nhom', attributes: ['id', 'ten_hoi_thoai'], required: false },
        { model: db.SuKien, as: 'su_kien', required: false },
        {
          model: BaiViet,
          as: 'bai_viet_goc',
          required: false,
          attributes: ['id', 'noi_dung', 'ngay_tao', 'media_urls', 'id_tac_gia', 'id_cuoc_hoi_thoai'],
          include: [
            { model: NguoiDung, as: 'tac_gia', attributes: ['id', 'ho_ten', 'anh_dai_dien_url'], required: false },
            { model: CuocHoiThoai, as: 'nhom', attributes: ['id', 'ten_hoi_thoai'], required: false },
            { model: db.SuKien, as: 'su_kien', required: false }
          ]
        }
      ]
    });

    if (!baiViet) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    if (baiViet.id_cuoc_hoi_thoai) {
      const isMember = await ThanhVienHoiThoai.findOne({
        where: { id_cuoc_hoi_thoai: baiViet.id_cuoc_hoi_thoai, id_nguoi_dung: idNguoiDung }
      });
      if (!isMember) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bài viết này' });
    }

    res.json({ success: true, data: baiViet });
  } catch (error) {
    console.error('❌ Lỗi khi lấy chi tiết bài viết:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * ✅ Chia sẻ bài viết (tạo bài viết mới trỏ về bài gốc)
 * POST /api/bai-viet/:id/chia-se
 * Body: { noi_dung?: string, id_cuoc_hoi_thoai?: number|null }
 */
export const chiaSeBaiViet = async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_dung = '', id_cuoc_hoi_thoai = null } = req.body || {};

    const idNguoiDung = req.user?.id;
    if (!idNguoiDung) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const baiVietGoc = await BaiViet.findByPk(id);
    if (!baiVietGoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết gốc.' });
    }

    const idBaiVietGocThuc = baiVietGoc.id_bai_viet_goc || baiVietGoc.id;

    // ✅ Tạo bài share: KHÔNG set media_type (enum) = 'text' vì enum của DB không có giá trị này
    // ✅ Đồng thời tránh set media_urls để không bị insert '[]' dạng string nếu schema/model đang map khác kiểu
    const baiVietMoi = await BaiViet.create({
      id_tac_gia: idNguoiDung,
      id_bai_viet_goc: idBaiVietGocThuc,
      id_cuoc_hoi_thoai: id_cuoc_hoi_thoai || null,
      noi_dung: String(noi_dung || '').trim(),
      trang_thai: "da_dang",
      // theo yêu cầu: media_type_enum = null
      media_type: null,
      media_urls: null
    });

    const data = await BaiViet.findByPk(baiVietMoi.id, {
      include: [
        { model: NguoiDung, as: 'tac_gia', attributes: ['id', 'ho_ten', 'anh_dai_dien_url'] },
        { model: BaiViet, as: 'bai_viet_goc' }
      ]
    });

    return res.json({
      success: true,
      message: 'Chia sẻ bài viết thành công.',
      data: data || baiVietMoi
    });
  } catch (error) {
    console.error('❌ Lỗi chiaSeBaiViet:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server.', error: error.message });
  }
};