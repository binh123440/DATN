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

    // Lưu userId vào request để sử dụng ở các handler khác
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.vai_tro;

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

    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực token',
      error: error.message
    });
  }
};

/**
 * Middleware kiểm tra vai trò
 */
export const kiemTraVaiTro = (...vaiTroChoPhep) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    if (!vaiTroChoPhep.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tính năng này'
      });
    }

    next();
  };
};