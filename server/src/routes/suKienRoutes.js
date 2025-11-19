import { Router } from 'express';
import { 
  taoSuKien, 
  dangKySuKien, 
  kiemTraDangKy, 
  layDanhSachSuKien,
  diemDanhSuKien,
  layThongKeDiemDanh,
  capNhatTrangThai,
  layDanhSachChoDuyet,
  capNhatSuKien// Thêm import
} from '../controllers/suKienController.js';
import { xacThucToken, kiemTraVaiTro } from '../middleware/dangNhapMiddleware.js';

const router = Router();

// GET /api/su-kien - Lấy danh sách sự kiện
router.get('/', layDanhSachSuKien);

// POST /api/su-kien - Tạo sự kiện mới
router.post('/', xacThucToken, taoSuKien);

// PUT /api/su-kien/:id - Cập nhật sự kiện
router.put('/:id', xacThucToken, capNhatSuKien);

// POST /api/su-kien/:id/dang-ky - Đăng ký tham gia sự kiện
router.post('/:id/dang-ky', xacThucToken, dangKySuKien);

// GET /api/su-kien/:id/kiem-tra-dang-ky - Kiểm tra đã đăng ký chưa
router.get('/:id/kiem-tra-dang-ky', xacThucToken, kiemTraDangKy);

// POST /api/su-kien/:id/diem-danh - Điểm danh sự kiện
router.post('/:id/diem-danh', xacThucToken, diemDanhSuKien);

// GET /api/su-kien/:id/thong-ke - Lấy thống kê điểm danh
router.get('/:id/thong-ke', xacThucToken, layThongKeDiemDanh);


router.use(xacThucToken, kiemTraVaiTro('admin', 'quan_tri_vien'));

router.get('/duyet', layDanhSachChoDuyet);

router.patch('/duyet/cap-nhat-trang-thai', capNhatTrangThai);

export default router;
