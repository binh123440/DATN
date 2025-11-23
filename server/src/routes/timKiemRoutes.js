import { Router } from 'express';
import { timKiemTongHop } from '../controllers/timKiemController.js';
import {xacThucToken} from '../middleware/dangNhapMiddleware.js';

const router = Router();

router.get('/', xacThucToken, timKiemTongHop);
export default router;