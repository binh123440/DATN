import express from 'express';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import {
  taoNhom,
  layDanhSachNhom,
  layChiTietNhom,
  thamGiaNhom,
  layDanhSachThanhVien,
  roiNhom,
  xoaThanhVien,
  capNhatVaiTro,
  capNhatTenNhom,
  xoaNhom,
  layBaiVietTrongNhom
} from '../controllers/nhomController.js';

const router = express.Router();

router.post('/', xacThucToken, taoNhom);
router.get('/', xacThucToken, layDanhSachNhom);
router.get('/:id', xacThucToken, layChiTietNhom);
router.post('/:id/tham-gia', xacThucToken, thamGiaNhom);
router.get('/:id/thanh-vien', xacThucToken, layDanhSachThanhVien);
router.delete('/:id/roi-nhom', xacThucToken, roiNhom);
router.delete('/:id/thanh-vien/:idNguoiDung', xacThucToken, xoaThanhVien);
router.put('/:id/thanh-vien/:idNguoiDung/vai-tro', xacThucToken, capNhatVaiTro);
router.put('/:id', xacThucToken, capNhatTenNhom);
router.delete('/:id', xacThucToken, xoaNhom);
router.get('/:id/bai-viet', xacThucToken, layBaiVietTrongNhom);

export default router;