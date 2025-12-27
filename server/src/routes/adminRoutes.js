import express from 'express';
import { xacThucToken, kiemTraVaiTro } from '../middleware/dangNhapMiddleware.js';
import {
  layTatCaNguoiDung,
  capNhatVaiTroNguoiDung,
  resetMatKhauNguoiDung,
} from '../controllers/adminController.js';
import {
  layDanhSachChoDuyet,
  capNhatTrangThai
} from '../controllers/suKienController.js';

const router = express.Router();

// Áp dụng middleware xác thực và kiểm tra vai trò admin cho tất cả routes
router.use(xacThucToken, kiemTraVaiTro('quan_tri_vien'));

// ==================== QUẢN LÝ NGƯỜI DÙNG ====================
router.get('/users', layTatCaNguoiDung);
router.put('/users/:id/role', capNhatVaiTroNguoiDung);
router.post('/users/:id/reset-password', resetMatKhauNguoiDung);

// ==================== DUYỆT NỘI DUNG ====================
router.get('/pending-content', layDanhSachChoDuyet);
router.post('/approve-content', capNhatTrangThai);

export default router;