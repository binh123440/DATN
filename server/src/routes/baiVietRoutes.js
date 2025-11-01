import express from 'express';
import {
  layDanhSachBaiViet,
  taoBaiViet,
  thichBaiViet
} from '../controllers/baiVietController.js';

const router = express.Router();

// GET /api/bai-viet - Lấy danh sách bài viết
router.get('/', layDanhSachBaiViet);

// POST /api/bai-viet - Tạo bài viết mới
router.post('/', taoBaiViet);

// POST /api/bai-viet/:id/thich - Thích/bỏ thích bài viết
router.post('/:id/thich', thichBaiViet);

export default router;