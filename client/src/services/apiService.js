import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor để đính kèm token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== BÀI VIẾT =====

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

export const taoBaiViet = async (data) => {
  try {
    const response = await apiClient.post('/bai-viet', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo bài viết:', error);
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

// ===== SỰ KIỆN =====

export const taoSuKien = async (data) => {
  try {
    const response = await apiClient.post('/su-kien', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo sự kiện:', error);
    throw error;
  }
};

export const dangKySuKien = async (idSuKien, idNguoiDung) => {
  try {
    const response = await apiClient.post(`/su-kien/${idSuKien}/dang-ky`, {
      id_nguoi_dung: idNguoiDung
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng ký sự kiện:', error);
    throw error;
  }
};

export const kiemTraDangKySuKien = async (idSuKien, idNguoiDung) => {
  try {
    const response = await apiClient.get(`/su-kien/${idSuKien}/kiem-tra-dang-ky`, {
      params: { id_nguoi_dung: idNguoiDung }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra đăng ký:', error);
    throw error;
  }
};

export const diemDanhSuKien = async (idSuKien, qrDataString, scannerCoords) => {
  try {
    const response = await apiClient.post(`/su-kien/${idSuKien}/diem-danh`, {
      qrDataString,
      scannerCoords
    });
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

export default apiClient;