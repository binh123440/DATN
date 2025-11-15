import express from 'express';
import upload from '../middleware/upload.js';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import { layDanhSachBaiViet, taoBaiViet, thichBaiViet, xoaBaiViet } from '../controllers/baiVietController.js';

const router = express.Router();

router.get('/', xacThucToken, layDanhSachBaiViet);
router.post('/', xacThucToken, upload.array('media', 5), taoBaiViet); // ✅ Tối đa 5 files
router.post('/:id/thich', xacThucToken, thichBaiViet);
router.delete('/:id', xacThucToken, xoaBaiViet);

export default router;