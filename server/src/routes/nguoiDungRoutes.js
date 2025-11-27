import { Router } from 'express';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import upload from '../middleware/upload.js';
import {
  layThongTinNguoiDung,
  layBaiVietNguoiDung,
  capNhatThongTinCaNhan,
  capNhatAnhNguoiDung
} from '../controllers/nguoiDungController.js';

const router = Router();

// Routes công khai
router.get('/:id', layThongTinNguoiDung);
router.get('/:id/bai-viet', layBaiVietNguoiDung);


router.put('/:id',xacThucToken, capNhatThongTinCaNhan);
router.put('/:id/anh',xacThucToken, upload.single('image'), capNhatAnhNguoiDung);

export default router;