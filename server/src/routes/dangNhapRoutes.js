import express from 'express';
import { 
  dangNhap, 
  layThongTinNguoiDung, 
  doiMatKhau 
} from '../controllers/dangNhapController.js';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';

const router = express.Router();

// POST /api/auth/dang-nhap - Đăng nhập
router.post('/dang-nhap', dangNhap);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
router.get('/me', xacThucToken, layThongTinNguoiDung);

// PUT /api/auth/doi-mat-khau - Đổi mật khẩu (cần token)
router.put('/doi-mat-khau', xacThucToken, doiMatKhau);

export default router;