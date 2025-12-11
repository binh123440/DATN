import jwt from 'jsonwebtoken';

/**
 * Middleware xác thực JWT token
 */
export const xacThucToken = (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'ute-social-secret-key-2024'
    );

    // Lưu toàn bộ thông tin đã giải mã vào req.user
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Lỗi không xác định khác
    console.error('Lỗi xác thực token:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực token'
    });
  }
};

/**
 * Middleware kiểm tra vai trò
 */
export const kiemTraVaiTro = (...allowedRoles) => {
  // nếu truyền 1 mảng vào như kiemTraVaiTro(['a','b']) cũng hợp lệ
  const rolesToCheck = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    const userRoles = req.user?.vai_tro;

    // nếu không có vai trò -> chặn
    if (!userRoles) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    // chuẩn hóa userRoles thành mảng
    const userRolesArr = Array.isArray(userRoles) ? userRoles : [userRoles];

    // kiểm tra giao nhau
    const ok = userRolesArr.some(r => rolesToCheck.includes(r));

    if (!ok) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    next();
  };
};