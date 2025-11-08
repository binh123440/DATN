import express from 'express';
import {
  taoSuKien,
  dangKySuKien,
  kiemTraDangKy,
  layDanhSachSuKien
} from '../controllers/suKienController.js';

const router = express.Router();

// GET /api/su-kien - Lấy danh sách sự kiện
router.get('/', layDanhSachSuKien);

// POST /api/su-kien - Tạo sự kiện mới
router.post('/', taoSuKien);

// POST /api/su-kien/:id/dang-ky - Đăng ký tham gia sự kiện
router.post('/:id/dang-ky', dangKySuKien);

// GET /api/su-kien/:id/kiem-tra-dang-ky - Kiểm tra đã đăng ký chưa
router.get('/:id/kiem-tra-dang-ky', kiemTraDangKy);

export default router;