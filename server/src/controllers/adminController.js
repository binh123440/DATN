import db from '../models/index.js';
const { NguoiDung } = db;

/**
 * Lấy danh sách tất cả người dùng
 */
export const layTatCaNguoiDung = async (req, res) => {
  try {
    const users = await NguoiDung.findAll({
      attributes: { 
        exclude: ['mat_khau'] // Không trả về mật khẩu
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