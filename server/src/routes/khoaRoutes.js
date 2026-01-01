import express from 'express';
import { xacThucToken } from '../middleware/dangNhapMiddleware.js';
import { layDanhSachKhoa } from '../controllers/khoaController.js';

const router = express.Router();

router.get('/', xacThucToken, layDanhSachKhoa);

export default router;