import express from 'express';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import { 
  layDanhSachBinhLuan, 
  taoBinhLuan, 
  capNhatBinhLuan, 
  xoaBinhLuan 
} from '../controllers/binhLuanController.js';

const router = express.Router();

router.get('/bai-viet/:id_bai_viet', xacThucToken, layDanhSachBinhLuan);
router.post('/', xacThucToken, taoBinhLuan);
router.put('/:id', xacThucToken, capNhatBinhLuan);
router.delete('/:id', xacThucToken, xoaBinhLuan);

export default router;