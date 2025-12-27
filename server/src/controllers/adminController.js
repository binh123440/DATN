import db from '../models/index.js';
const { NguoiDung } = db;
import bcrypt from 'bcryptjs';

const taoMatKhauTam = (ngaySinh) => {
  // Mật khẩu tạm = ngày sinh người dùng theo format dd/mm/yyyy
  // ngaySinh (DATEONLY) thường là 'yyyy-mm-dd'
  if (!ngaySinh) return null;

  const s = String(ngaySinh);

  // Nếu đã là dd/mm/yyyy thì trả thẳng
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // Parse từ yyyy-mm-dd
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
  }

  // Trường hợp là Date string khác: cố gắng parse bằng Date
  const date = new Date(s);
  if (!Number.isNaN(date.getTime())) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  return null;
};

/**
 * Lấy danh sách tất cả người dùng
 */
export const layTatCaNguoiDung = async (req, res) => {
  try {
    const users = await NguoiDung.findAll({
      attributes: { 
        exclude: ['mat_khau_bam'] // Không trả về mật khẩu
      },
      order: [['ngay_tao', 'DESC']],
    });

    res.json({ 
      success: true, 
      message: 'Lấy danh sách người dùng thành công',
      data: users 
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

/**
 * Cập nhật vai trò của người dùng
 */
export const capNhatVaiTroNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const { vai_tro } = req.body;

    // Validate vai trò
    const validRoles = ['quan_tri_vien'];
    if (!validRoles.includes(vai_tro)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vai trò không hợp lệ. Chỉ chấp nhận: quan_tri_vien' 
      });
    }

    const user = await NguoiDung.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng.' 
      });
    }

    // Cập nhật vai trò
    user.vai_tro = vai_tro;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Cập nhật vai trò thành công.',
      data: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        vai_tro: user.vai_tro
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật vai trò:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

/**
 * Admin reset mật khẩu người dùng
 */
export const resetMatKhauNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NguoiDung.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.'
      });
    }

    const matKhauTam = taoMatKhauTam(user.ngay_sinh);
    if (!matKhauTam) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng chưa có ngày sinh hợp lệ để reset mật khẩu'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(matKhauTam, salt);

    await user.update({ mat_khau_bam: hashedPassword });

    return res.json({
      success: true,
      message: 'Reset mật khẩu thành công',
      data: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        temp_password: matKhauTam
      }
    });
  } catch (error) {
    console.error('Lỗi khi reset mật khẩu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};