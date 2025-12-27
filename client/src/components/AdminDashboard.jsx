import React, { useState, useEffect } from 'react';
import { 
  layDanhSachNguoiDung, 
  capNhatVaiTroNguoiDung,
  resetMatKhauNguoiDung
} from '../services/apiService';
import { User, Shield, Search } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingUserId, setResettingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRes = await layDanhSachNguoiDung();
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu người dùng:", error);
      alert('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Bạn có chắc muốn đổi vai trò thành ${newRole}?`)) return;
    
    try {
      await capNhatVaiTroNguoiDung(userId, newRole);
      alert('✅ Cập nhật vai trò thành công!');
      fetchUsers();
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật vai trò:", error);
      alert('Không thể cập nhật. Vui lòng thử lại.');
    }
  };

  const handleResetPassword = async (user) => {
    if (!confirm(`Reset mật khẩu cho "${user.ho_ten}"?`)) return;

    try {
      setResettingUserId(user.id);
      const res = await resetMatKhauNguoiDung(user.id);
      const tempPassword = res?.data?.data?.temp_password;

      if (tempPassword) {
        alert(
          `✅ Reset mật khẩu thành công!\n\nMật khẩu tạm thời: ${tempPassword}\n\nVui lòng yêu cầu người dùng đổi mật khẩu sau khi đăng nhập.`
        );
      } else {
        alert('✅ Reset mật khẩu thành công!');
      }
    } catch (error) {
      console.error('❌ Lỗi khi reset mật khẩu:', error);
      alert(error?.response?.data?.message || 'Không thể reset mật khẩu. Vui lòng thử lại.');
    } finally {
      setResettingUserId(null);
    }
  };

  // Lọc người dùng theo từ khóa tìm kiếm
  const filteredUsers = users.filter(user => 
    user.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.ma_sinh_vien?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Quản lý người dùng</h1>
              <p className="text-sm text-gray-500 mt-1">Tổng số: {users.length} người dùng</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc mã sinh viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* User table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">
              {searchTerm ? 'Không tìm thấy người dùng nào' : 'Không có người dùng nào'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã SV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.anh_dai_dien_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={user.anh_dai_dien_url} 
                                alt={user.ho_ten} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {user.ho_ten?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.ho_ten}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.ma_sinh_vien || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select 
                          value={user.vai_tro} 
                          onChange={(e) => handleRoleChange(user.id, e.target.value)} 
                          className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="sinh_vien">Sinh viên</option>
                          <option value="giao_vien">Giáo viên</option>
                          <option value="dieu_phoi_vien">Điều phối viên</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingUserId === user.id}
                          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {resettingUserId === user.id ? 'Đang reset...' : 'Reset mật khẩu'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {filteredUsers.length} / {users.length} người dùng</span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;