import express from 'express';
import upload from '../middleware/upload.js';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import { layDanhSachBaiViet, taoBaiViet, thichBaiViet, xoaBaiViet, capNhatBaiViet, layChiTietBaiViet } from '../controllers/baiVietController.js';

const router = express.Router();

// GET /api/bai-viet - Lấy danh sách bài viết
router.get('/', xacThucToken, layDanhSachBaiViet);

// GET /api/bai-viet/:id - Lấy chi tiết bài viết
router.get('/:id', xacThucToken, layChiTietBaiViet);

// POST /api/bai-viet - Tạo bài viết mới với upload nhiều file
router.post('/', xacThucToken, upload.array('media', 5), taoBaiViet); // ✅ Tối đa 5 files

// PUT /api/bai-viet/:id - Cập nhật bài viết
// router.put('/:id', xacThucToken, capNhatBaiViet);

router.put('/:id', xacThucToken, upload.array('media', 5), capNhatBaiViet);

// POST /api/bai-viet/:id/thich - Thích/bỏ thích bài viết
router.post('/:id/thich', xacThucToken, thichBaiViet);

// DELETE /api/bai-viet/:id - Xóa bài viết
router.delete('/:id', xacThucToken, xoaBaiViet);

export default router;