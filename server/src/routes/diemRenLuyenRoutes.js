import express from 'express';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import {
  layThongTinDiemRenLuyen,
  layLichSuTichDiem,
  laySuKienSapDienRa
} from '../controllers/diemRenLuyenController.js';

const router = express.Router();

// GET /api/diem-ren-luyen/thong-tin - Lấy thông tin điểm rèn luyện
router.get('/thong-tin', xacThucToken, layThongTinDiemRenLuyen);

// GET /api/diem-ren-luyen/lich-su - Lấy lịch sử tích điểm
router.get('/lich-su', xacThucToken, layLichSuTichDiem);

// GET /api/diem-ren-luyen/su-kien-sap-dien-ra - Lấy sự kiện sắp diễn ra
router.get('/su-kien-sap-dien-ra', xacThucToken, laySuKienSapDienRa);

export default router;