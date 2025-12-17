import express from 'express';
import phongController from '../controllers/phongController.js';

const router = express.Router();

// GET /api/phong?q=...&page=1&limit=20
router.get('/', phongController.layDanhSachPhong);

// GET /api/phong/:id
router.get('/:id', phongController.layChiTietPhong);

export default router;