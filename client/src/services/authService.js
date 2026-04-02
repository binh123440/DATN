import apiClient from './apiService';

export const authService = {
  /**
   * Đăng nhập
   * @param {string} email - Email người dùng
   * @param {string} mat_khau - Mật khẩu
   */
  dangNhap: async (email, mat_khau, ghi_nho = false) => {
    try {
      console.log('📤 Gửi request đăng nhập:', { email, ghi_nho }); // Debug
      
      const response = await apiClient.post('/auth/dang-nhap', { email, mat_khau, ghi_nho });
      
      console.log('📥 Response từ server:', response); // Debug
      
      // Kiểm tra response có success = true
      if (response && response.data.success) {
        const { token, nguoi_dung } = response.data;
        
        console.log('💾 Đang lưu token...', { token: token?.substring(0, 20) + '...' }); // Debug
        
        // Lưu token và user vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(nguoi_dung));
        
        console.log('✅ Đã lưu token vào localStorage'); // Debug
        console.log('✅ Đã lưu user vào localStorage'); // Debug
        
        // Verify đã lưu thành công
        const savedToken = localStorage.getItem('token');
        console.log('🔍 Verify token đã lưu:', savedToken ? 'Có' : 'Không có'); // Debug
      } else {
        console.warn('⚠️ Response không có success = true'); // Debug
      }
      
      return response;
    } catch (error) {
      console.error('❌ Lỗi khi đăng nhập:', error);
      console.error('❌ Chi tiết lỗi:', error.response?.data); // Debug
      throw error;
    }
  },

  /**
   * Lấy thông tin user hiện tại
   */
  layThongTinNguoiDung: async () => {
    try {
      const response = await apiClient.get('/auth/me');
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
      const response = await apiClient
.put('/auth/doi-mat-khau', { 
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
    console.log('🚪 Đã đăng xuất và xóa token'); // Debug
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  kiemTraDangNhap: () => {
    const token = localStorage.getItem('token');
    console.log('🔐 Kiểm tra token:', token ? 'Có' : 'Không có'); // Debug
    return !!token;
  },

  /**
   * Lấy user từ localStorage
   */
  layNguoiDungTuLocalStorage: () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
};