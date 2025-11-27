import db from '../models/index.js';
const { NguoiDung, BaiViet, SuKien, DangKySuKien, Nganh, Khoa } = db;
import { Op } from 'sequelize';
import { cloudinary } from '../config/cloudinary.js';

/**
 * Lấy thông tin profile người dùng
 */
export const layThongTinNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const nguoiDungHienTai = req.user?.id;

    const nguoiDung = await NguoiDung.findByPk(id, {
      attributes: {
        exclude: ['mat_khau_bam']
      },
      include: [
        {
          model: Nganh,
          as: 'nganh',
          attributes: ['id', 'ten_nganh'],
          include: [
            {
              model: Khoa,
              as: 'khoa',
              attributes: ['id', 'ten_khoa']
            }
          ]
        }
      ]
    });

    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Đếm số bài viết
    const soBaiViet = await BaiViet.count({
      where: { 
        id_tac_gia: id,
        trang_thai: 'da_duyet'
      }
    });

    // Đếm số sự kiện đã tham gia
    const soSuKienThamGia = await DangKySuKien.count({
      where: { 
        id_nguoi_dung: id,
        trang_thai: 'da_dang_ky'
      }
    });

    // Đếm số sự kiện đã tạo (nếu là điều phối viên)
    const soSuKienTao = await SuKien.count({
      where: { 
        id_nguoi_tao: id,
        trang_thai: 'da_duyet'
      }
    });

    const thongTin = nguoiDung.toJSON();

    res.json({
      success: true,
      data: {
        ...thongTin,
        thong_ke: {
          so_bai_viet: soBaiViet,
          so_su_kien_tham_gia: soSuKienThamGia,
          so_su_kien_tao: soSuKienTao
        },
        la_nguoi_dung_hien_tai: nguoiDungHienTai === parseInt(id)
      }
    });
  } catch (error) {
    console.error('❌ Lỗi layThongTinNguoiDung:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách bài viết của người dùng
 */
export const layBaiVietNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await BaiViet.findAndCountAll({
      where: {
        id_tac_gia: id,
        trang_thai: 'da_duyet',
        id_cuoc_hoi_thoai: null // Chỉ lấy bài viết công khai
      },
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: db.SuKien,
          as: 'su_kien',
          where: { trang_thai: 'da_duyet' },
          required: false
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
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
    console.error('❌ Lỗi layBaiVietNguoiDung:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin cá nhân
 */
export const capNhatThongTinCaNhan = async (req, res) => {
  try {
    const { id } = req.params;
    const nguoiDungHienTai = req.user?.id;

    // Kiểm tra quyền
    if (nguoiDungHienTai !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin này'
      });
    }

    const {
      ho_ten,
      dong_gioi_thieu,
      ngay_sinh,
      so_dien_thoai,
      lop_sh,
      id_nganh
    } = req.body;

    const nguoiDung = await NguoiDung.findByPk(id);

    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    await nguoiDung.update({
      ho_ten,
      dong_gio_thieu,
      ngay_sinh,
      so_dien_thoai,
      lop_sh,
      id_nganh
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: nguoiDung
    });
  } catch (error) {
    console.error('❌ Lỗi capNhatThongTinCaNhan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Helper function để trích xuất public_id từ Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!url) return null;
  
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    if (matches && matches[1]) {
      return matches[1];
    }
  } catch (error) {
    console.error('❌ Lỗi khi trích xuất public_id:', error);
  }
  
  return null;
};

/**
 * Cập nhật ảnh đại diện/ảnh bìa
 */
export const capNhatAnhNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const { loai_anh } = req.body;
    const nguoiDungHienTai = req.user?.id;

    console.log('📸 Cập nhật ảnh:', { id, loai_anh, nguoiDungHienTai });
    console.log('📁 File uploaded:', req.file);

    // Kiểm tra quyền
    if (nguoiDungHienTai !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật ảnh này'
      });
    }

    // Kiểm tra file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được tải lên'
      });
    }

    // Validate loại ảnh
    if (!loai_anh || !['anh_dai_dien', 'anh_bia'].includes(loai_anh)) {
      return res.status(400).json({
        success: false,
        message: 'Loại ảnh không hợp lệ. Chỉ chấp nhận "anh_dai_dien" hoặc "anh_bia"'
      });
    }

    const nguoiDung = await NguoiDung.findByPk(id);

    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // ✅ Lấy URL ảnh cũ để xóa sau
    const oldImageUrl = loai_anh === 'anh_dai_dien' 
      ? nguoiDung.anh_dai_dien_url 
      : nguoiDung.anh_bia_url;

    console.log('🖼️ Ảnh cũ:', oldImageUrl);

    // Cập nhật URL ảnh mới từ Cloudinary
    const updateData = {};
    if (loai_anh === 'anh_dai_dien') {
      updateData.anh_dai_dien_url = req.file.path;
    } else {
      updateData.anh_bia_url = req.file.path;
    }

    await nguoiDung.update(updateData);

    console.log('✅ Cập nhật ảnh mới thành công:', updateData);

    // ✅ Xóa ảnh cũ khỏi Cloudinary (nếu có)
    if (oldImageUrl) {
      try {
        const publicId = extractPublicId(oldImageUrl);
        if (publicId) {
          console.log('🗑️ Đang xóa ảnh cũ từ Cloudinary:', publicId);
          const result = await cloudinary.uploader.destroy(publicId);
          console.log('✅ Đã xóa ảnh cũ:', result);
        }
      } catch (deleteError) {
        // Không throw error để không ảnh hưởng response
        console.error('⚠️ Không thể xóa ảnh cũ từ Cloudinary:', deleteError);
      }
    }

    res.json({
      success: true,
      message: `Cập nhật ${loai_anh === 'anh_dai_dien' ? 'ảnh đại diện' : 'ảnh bìa'} thành công`,
      data: {
        url: req.file.path,
        [loai_anh]: req.file.path
      }
    });
  } catch (error) {
    console.error('❌ Lỗi capNhatAnhNguoiDung:', error);
    
    // ✅ Nếu có lỗi và ảnh mới đã upload, xóa ảnh mới
    if (req.file?.path) {
      try {
        const publicId = extractPublicId(req.file.path);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Đã xóa ảnh mới do lỗi');
        }
      } catch (cleanupError) {
        console.error('⚠️ Không thể xóa ảnh mới:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

export default {
  layThongTinNguoiDung,
  layBaiVietNguoiDung,
  capNhatThongTinCaNhan,
  capNhatAnhNguoiDung
};