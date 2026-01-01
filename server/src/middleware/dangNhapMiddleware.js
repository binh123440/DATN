import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { NguoiDung } = db;

const normalizeRoles = (vai_tro) => {
  if (!vai_tro) return [];

  // Sequelize chuẩn sẽ là array: ['quan_tri_vien', ...]
  if (Array.isArray(vai_tro)) return vai_tro;

  // Một số trường hợp có thể dính dạng string kiểu "{quan_tri_vien}"
  if (typeof vai_tro === 'string') {
    const s = vai_tro.trim();
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [s];
  }

  return [];
};

export const xacThucToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu token xác thực'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Load user từ DB để có vai_tro (vì token thường chỉ có id)
    const nguoiDung = await NguoiDung.findByPk(decoded.id, {
      attributes: ['id', 'vai_tro']
    });

    if (!nguoiDung) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc người dùng không tồn tại'
      });
    }

    const roles = normalizeRoles(nguoiDung.vai_tro);

    // ✅ Chuẩn hoá cho toàn project
    req.user = { id: nguoiDung.id, vai_tro: roles };
    req.userId = nguoiDung.id;

    next();
  } catch (error) {
    console.error('❌ xacThucToken error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

export const kiemTraVaiTro = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = normalizeRoles(req.user?.vai_tro);

    const ok = allowedRoles.some((r) => roles.includes(r));
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }

    next();
  };
};