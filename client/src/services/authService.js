import api from './apiService';

export const authService = {
  /**
   * Đăng nhập
   * @param {string} email - Email người dùng
   * @param {string} mat_khau - Mật khẩu
   */
  dangNhap: async (email, mat_khau) => {
    try {
      const response = await api.post('/auth/dang-nhap', { email, mat_khau });
      
      if (response.success) {
        // Lưu token vào localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.nguoi_dung));
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin user hiện tại
   */
  layThongTinNguoiDung: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      throw error;
    }
  },

  /**
   * Đổi mật khẩu
   */
  doiMatKhau: async (mat_khau_cu, mat_khau_moi) => {
    try {
      const response = await api.put('/auth/doi-mat-khau', { 
        mat_khau_cu, 
        mat_khau_moi 
      });
      return response;
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      throw error;
    }
  },

  /**
   * Đăng xuất
   */
  dangXuat: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  kiemTraDangNhap: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Lấy user từ localStorage
   */
  layNguoiDungTuLocalStorage: () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
};