import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { NguoiDung, Nganh, Khoa } = db;

/**
 * Đăng nhập
 */
export const dangNhap = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    // Validation
    if (!email || !mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email và mật khẩu'
      });
    }

    // Tìm user theo email
    const nguoiDung = await NguoiDung.findOne({ 
      where: { email },
      include: [
        {
          model: Nganh,
          as: 'nganh',
          include: [{ model: Khoa, as: 'khoa' }]
        }
      ]
    });

    if (!nguoiDung) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(mat_khau, nguoiDung.mat_khau_bam);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: nguoiDung.id, 
        email: nguoiDung.email,
        vai_tro: nguoiDung.vai_tro 
      },
      process.env.JWT_SECRET || 'ute-social-secret-key-2024',
      { expiresIn: '7d' }
    );

    // Trả về thông tin user (không bao gồm mật khẩu)
    const userData = {
      id: nguoiDung.id,
      ho_ten: nguoiDung.ho_ten,
      email: nguoiDung.email,
      vai_tro: nguoiDung.vai_tro,
      dong_gioi_thieu: nguoiDung.dong_gioi_thieu,
      anh_dai_dien_url: nguoiDung.anh_dai_dien_url,
      anh_bia_url: nguoiDung.anh_bia_url,
      tong_diem: nguoiDung.tong_diem,
      nganh: nguoiDung.nganh,
      lop_sh: nguoiDung.lop_sh,
      so_dien_thoai: nguoiDung.so_dien_thoai
    };

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      nguoi_dung: userData,
      token
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const layThongTinNguoiDung = async (req, res) => {
  try {
    const userId = req.userId; // Được set từ authMiddleware

    const nguoiDung = await NguoiDung.findByPk(userId, {
      attributes: { exclude: ['mat_khau_bam'] },
      include: [
        {
          model: Nganh,
          as: 'nganh',
          include: [{ model: Khoa, as: 'khoa' }]
        }
      ]
    });

    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: nguoiDung
    });

  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Đổi mật khẩu
 */
export const doiMatKhau = async (req, res) => {
  try {
    const userId = req.userId;
    const { mat_khau_cu, mat_khau_moi } = req.body;

    // Validation
    if (!mat_khau_cu || !mat_khau_moi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (mat_khau_moi.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm user
    const nguoiDung = await NguoiDung.findByPk(userId);
    
    if (!nguoiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await bcrypt.compare(mat_khau_cu, nguoiDung.mat_khau_bam);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không đúng'
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mat_khau_moi, salt);

    // Cập nhật mật khẩu
    await nguoiDung.update({ mat_khau_bam: hashedPassword });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};