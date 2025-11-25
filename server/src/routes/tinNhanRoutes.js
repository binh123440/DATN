import { Router } from 'express';
import {
  layDanhSachCuocHoiThoai,
  layTinNhanTrongCuocHoiThoai,
  guiTinNhan,
  taoCuocHoiThoaiRiengTu
} from '../controllers/tinNhanController.js';
import {xacThucToken} from '../middleware/dangNhapMiddleware.js';

const router = Router();

router.get('/cuoc-hoi-thoai', xacThucToken, layDanhSachCuocHoiThoai);
router.get('/cuoc-hoi-thoai/:id/tin-nhan', xacThucToken, layTinNhanTrongCuocHoiThoai);
router.post('/tin-nhan', xacThucToken, guiTinNhan);
router.post('/cuoc-hoi-thoai/rieng-tu', xacThucToken, taoCuocHoiThoaiRiengTu);

export default router;