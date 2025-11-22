import express from 'express';
import {
  layDanhSachThongBao,
  danhDauDaDoc,
  danhDauTatCaDaDoc,
  xoaThongBao,
  demThongBaoChuaDoc
} from '../controllers/thongBaoController.js';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';

const router = express.Router();

router.get('/', xacThucToken, layDanhSachThongBao);
router.get('/chua-doc', xacThucToken, demThongBaoChuaDoc);
router.put('/:id/da-doc', xacThucToken, danhDauDaDoc);
router.put('/tat-ca-da-doc', xacThucToken, danhDauTatCaDaDoc);
router.delete('/:id', xacThucToken, xoaThongBao);

export default router;