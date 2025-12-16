import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== BÀI VIẾT ====================

export const layDanhSachBaiViet = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/bai-viet', {
      params: { page, limit, trang_thai: 'da_duyet' }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
    throw error;
  }
};

// ✅ THÊM HÀM LẤY CHI TIẾT BÀI VIẾT
export const layChiTietBaiViet = async (idBaiViet) => {
  try {
    const response = await apiClient.get(`/bai-viet/${idBaiViet}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài viết:', error);
    throw error;
  }
};

export const taoBaiVietVoiMedia = async (formData) => {
  const response = await apiClient.post('/bai-viet', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const taoBaiViet = async (data) => {
  try {
    const response = await apiClient.post('/bai-viet', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo bài viết:', error);
    throw error;
  }
};

export const capNhatBaiViet = async (id, data) => {
  try {
    console.log('🔄 Gọi API cập nhật bài viết:', id);
    
    const response = await apiClient.put(`/bai-viet/${id}`, data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    });
    
    console.log('✅ Response cập nhật:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi API cập nhật:', error);
    throw error;
  }
};

export const thichBaiViet = async (idBaiViet, idNguoiDung) => {
  try {
    const response = await apiClient.post(`/bai-viet/${idBaiViet}/thich`, {
      id_nguoi_dung: idNguoiDung
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thích bài viết:', error);
    throw error;
  }
};

export const xoaBaiViet = async (id) => {
  try {
    const response = await apiClient.delete(`/bai-viet/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa bài viết:', error);
    throw error;
  }
};

// ==================== SỰ KIỆN ====================

export const layDanhSachSuKien = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/su-kien', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sự kiện:', error);
    throw error;
  }
};

export const taoSuKien = async (data) => {
  try {
    const response = await apiClient.post('/su-kien', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo sự kiện:', error);
    throw error;
  }
};

export const capNhatSuKien = async (id, data) => {
  const response = await apiClient.put(`/su-kien/${id}`, data);
  return response.data;
};

export const dangKySuKien = async (idSuKien, idNguoiDung) => {
  try {
    const response = await apiClient.post(`/su-kien/${idSuKien}/dang-ky`, { id_nguoi_dung: idNguoiDung });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng ký sự kiện:', error);
    throw error;
  }
};

export const kiemTraDangKySuKien = async (idSuKien, idNguoiDung) => {
  try {
    const response = await apiClient.get(`/su-kien/${idSuKien}/kiem-tra-dang-ky`, { params: { id_nguoi_dung: idNguoiDung } });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra đăng ký:', error);
    throw error;
  }
};

export const diemDanhSuKien = async (idSuKien, qrDataString, scannerCoords) => {
  try {
    const response = await apiClient.post(`/su-kien/${idSuKien}/diem-danh`, { qrDataString, scannerCoords });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi điểm danh sự kiện:', error);
    throw error;
  }
};

export const layThongKeDiemDanh = async (idSuKien) => {
  try {
    const response = await apiClient.get(`/su-kien/${idSuKien}/thong-ke`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    throw error;
  }
};

// ==================== KIỂM DUYỆT ====================

export const layDanhSachChoDuyet = async () => {
  try {
    const response = await apiClient.get('/su-kien/duyet');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chờ duyệt:', error);
    throw error;
  }
};

export const capNhatTrangThaiNoiDung = async (id, loai, trang_thai_moi) => {
  try {
    const response = await apiClient.post('/su-kien/duyet/cap-nhat-trang-thai', { id, loai, trang_thai_moi });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    throw error;
  }
};

// ==================== BÌNH LUẬN ====================

export const  layDanhSachBinhLuan = async (idBaiViet, page = 1, limit = 10) => {
  const response = await apiClient.get(`/binh-luan/bai-viet/${idBaiViet}`, {
    params: { page, limit }
  });
  return response.data;
};

export const taoBinhLuan = async (binhLuanData) => {
  const response = await apiClient.post('/binh-luan', binhLuanData);
  return response.data;
};

export const capNhatBinhLuan = async (id, noiDung) => {
  const response = await apiClient.put(`/binh-luan/${id}`, { noi_dung: noiDung });
  return response.data;
};

export const xoaBinhLuan = async (id) => {
  const response = await apiClient.delete(`/binh-luan/${id}`);
  return response.data;
};

// ==================== ĐIỂM RÈN LUYỆN ====================

export const layThongTinDiemRenLuyen = async () => {
  const response = await apiClient.get('/diem-ren-luyen/thong-tin');
  return response.data;
};

export const layLichSuTichDiem = async (limit = 5) => {
  const response = await apiClient.get('/diem-ren-luyen/lich-su', {
    params: { limit }
  });
  return response.data;
};

export const laySuKienSapDienRa = async (limit = 5) => {
  const response = await apiClient.get('/diem-ren-luyen/su-kien-sap-dien-ra', {
    params: { limit }
  });
  return response.data;
};

// ==================== THÔNG BÁO ====================

export const layDanhSachThongBao = async (page = 1, limit = 20, da_doc) => {
  const params = { page, limit };
  if (da_doc !== undefined) params.da_doc = da_doc;
  
  const response = await apiClient.get('/thong-bao', { params });
  return response.data;
};

export const demThongBaoChuaDoc = async () => {
  const response = await apiClient.get('/thong-bao/chua-doc');
  return response.data;
};

export const danhDauDaDoc = async (id) => {
  const response = await apiClient.put(`/thong-bao/${id}/da-doc`);
  return response.data;
};

export const danhDauTatCaDaDoc = async () => {
  const response = await apiClient.put('/thong-bao/tat-ca-da-doc');
  return response.data;
};

export const xoaThongBao = async (id) => {
  const response = await apiClient.delete(`/thong-bao/${id}`);
  return response.data;
};

// ===== NHÓM (GROUPS) =====
export const taoNhom = async (data) => {
  try {
    const response = await apiClient.post('/nhom', data);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi tạo nhóm:', error);
    throw error;
  }
};

export const layDanhSachNhom = async (params = {}) => {
  try {
    const response = await apiClient.get('/nhom', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách nhóm:', error);
    throw error;
  }
};

export const layChiTietNhom = async (id) => {
  try {
    const response = await apiClient.get(`/nhom/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết nhóm:', error);
    throw error;
  }
};

export const thamGiaNhom = async (id) => {
  try {
    const response = await apiClient.post(`/nhom/${id}/tham-gia`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi tham gia nhóm:', error);
    throw error;
  }
};

export const roiNhom = async (id) => {
  try {
    const response = await apiClient.delete(`/nhom/${id}/roi-nhom`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi rời nhóm:', error);
    throw error;
  }
};

export const layDanhSachThanhVienNhom = async (id) => {
  try {
    const response = await apiClient.get(`/nhom/${id}/thanh-vien`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách thành viên:', error);
    throw error;
  }
};

export const xoaThanhVienKhoiNhom = async (idNhom, idNguoiDung) => {
  try {
    const response = await apiClient.delete(`/nhom/${idNhom}/thanh-vien/${idNguoiDung}`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi xóa thành viên:', error);
    throw error;
  }
};

export const capNhatVaiTroThanhVien = async (idNhom, idNguoiDung, vaiTro) => {
  try {
    const response = await apiClient.put(`/nhom/${idNhom}/thanh-vien/${idNguoiDung}/vai-tro`, {
      vai_tro: vaiTro
    });
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi cập nhật vai trò:', error);
    throw error;
  }
};

export const capNhatTenNhom = async (id, tenMoi) => {
  try {
    const response = await apiClient.put(`/nhom/${id}`, {
      ten_hoi_thoai: tenMoi
    });
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi cập nhật tên nhóm:', error);
    throw error;
  }
};

export const xoaNhom = async (id) => {
  try {
    const response = await apiClient.delete(`/nhom/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi xóa nhóm:', error);
    throw error;
  }
};

export const layBaiVietTrongNhom = async (id, params = {}) => {
  try {
    const response = await apiClient.get(`/nhom/${id}/bai-viet`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi lấy bài viết trong nhóm:', error);
    throw error;
  }
};

export const timKiemTongHop = async (query) => {
  const response = await apiClient.get('/tim-kiem', { params: { q: query } }); // ✅ Đổi từ '/search' thành '/tim-kiem'
  return response.data;
};

export const layDanhSachCuocHoiThoai = async () => {
  const response = await apiClient.get('/chat/cuoc-hoi-thoai');
  return response.data;
};

export const layTinNhanTrongCuocHoiThoai = async (idCuocHoiThoai, params = {}) => {
  const response = await apiClient.get(`/chat/cuoc-hoi-thoai/${idCuocHoiThoai}/tin-nhan`, { params });
  return response.data;
};

export const guiTinNhan = async (data) => {
  const response = await apiClient.post('/chat/tin-nhan', data);
  return response.data;
};

export const taoCuocHoiThoaiRiengTu = async (idNguoiNhan) => {
  const response = await apiClient.post('/chat/cuoc-hoi-thoai/rieng-tu', { id_nguoi_nhan: idNguoiNhan });
  return response.data;
};

// ==================== ADMIN APIs ====================
export const layDanhSachNguoiDung = () => apiClient.get('/admin/users');

export const capNhatVaiTroNguoiDung = (userId, vai_tro) => 
  apiClient.put(`/admin/users/${userId}/role`, { vai_tro });

export const layNoiDungChoDuyet = () => apiClient.get('/admin/pending-content');

export const duyetNoiDung = (id, loai, trang_thai_moi) => 
  apiClient.post('/admin/approve-content', { id, loai, trang_thai_moi });

// ========== NGƯỜI DÙNG ==========
export const layThongTinNguoiDung = (id) => apiClient.get(`/nguoi-dung/${id}`);

export const layBaiVietNguoiDung = (id, page = 1, limit = 10) => 
  apiClient.get(`/nguoi-dung/${id}/bai-viet`, { params: { page, limit } });

export const capNhatThongTinCaNhan = (id, data) => 
  apiClient.put(`/nguoi-dung/${id}`, data);

export const capNhatAnhNguoiDung = async (id, file, loaiAnh) => {
  try {
    const formData = new FormData();
    formData.append('image', file); // ✅ Đúng với multer.single('image')
    formData.append('loai_anh', loaiAnh); // ✅ Gửi loại ảnh

    console.log('📤 Uploading image:', {
      id,
      loaiAnh,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await apiClient.put(`/nguoi-dung/${id}/anh`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Upload response:', response.data);
    return response;
  } catch (error) {
    console.error('❌ Lỗi capNhatAnhNguoiDung:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ API Sự kiện - Quản lý kế hoạch
export const capNhatKeHoachSuKien = async (id, keHoach) => {
  return apiClient.post(`/su-kien/${id}/ke-hoach`, { ke_hoach: keHoach });
};

export const ganTaskChoNguoi = async (id, taskId, assignee) => {
  return apiClient.post(`/su-kien/${id}/task/${taskId}/assign`, { assignee });
};

export const hoanThanhTask = async (id, taskId, result, attachments) => {
  return apiClient.post(`/su-kien/${id}/task/${taskId}/complete`, { result, attachments });
};

export const duyetKetQuaTask = async (id, taskId, approved, feedback) => {
  return apiClient.post(`/su-kien/${id}/task/${taskId}/duyet-ket-qua`, { approved, feedback });
};

export const guiSuKienLenKhoa = async (id, ghiChu) => {
  return apiClient.post(`/su-kien/${id}/gui-duyet`, { ghi_chu: ghiChu });
};

// ✅ Duyệt sự kiện
export const duyetSuKien = async (id, action, phan_hoi) => {
  const response = await apiClient.post(`/su-kien/${id}/duyet`, { 
    action, // 'duyet' | 'tu_choi'
    phan_hoi 
  });
  return response.data;
};

export const dangSuKienCongKhai = async (id) => {
  return apiClient.post(`/su-kien/${id}/dang-cong-khai`);
};

export const layDanhSachNguoiPhanCong = async (params) => {
  try {
    const response = await apiClient.get('/su-kien/users-for-assignment', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người phân công:', error);
    throw error;
  }
};

// Nhiệm vụ
export const layNhiemVuCuaToi = async () => {
  console.log('🔍 Gọi API: GET /su-kien/nhiem-vu/cua-toi');
  const response = await apiClient.get('/su-kien/nhiem-vu/cua-toi');
  console.log('✅ Response layNhiemVuCuaToi:', response.data);
  return response.data;
};

export const submitNhiemVu = async (idSuKien, taskIndex, ketQua) => {
  const url = `/su-kien/nhiem-vu/${idSuKien}/${taskIndex}/submit`;
  console.log('📤 Gọi API: POST', url);
  console.log('📦 Payload:', { ket_qua: ketQua });
  
  const response = await apiClient.post(url, {
    ket_qua: ketQua
  });
  
  console.log('✅ Response submitNhiemVu:', response.data);
  return response.data;
};

export default apiClient;