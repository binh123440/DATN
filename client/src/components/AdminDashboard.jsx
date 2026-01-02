import React, { useState, useEffect } from 'react';
import {
  layDanhSachNguoiDung,
  capNhatVaiTroNguoiDung,
  resetMatKhauNguoiDung,
  taoNguoiDungAdmin,
  xoaNguoiDungAdmin
} from '../services/apiService';
import { User, Shield, Search, Plus, Trash2, X } from 'lucide-react';

const getPrimaryRole = (vai_tro) => {
  if (Array.isArray(vai_tro)) return vai_tro[0] || 'sinh_vien';
  if (typeof vai_tro === 'string') return vai_tro || 'sinh_vien';
  return 'sinh_vien';
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingUserId, setResettingUserId] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    ho_ten: '',
    email: '',
    ma_sinh_vien: '',
    ngay_sinh: '',
    vai_tro: 'sinh_vien',
    mat_khau: '' // để trống => server tự sinh mật khẩu tạm
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRes = await layDanhSachNguoiDung();
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu người dùng:', error);
      alert('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Bạn có chắc muốn đổi vai trò thành ${newRole}?`)) return;

    try {
      // Backend thường lưu vai_tro dạng ARRAY => gửi mảng cho đúng schema
      await capNhatVaiTroNguoiDung(userId, [newRole]);
      alert('✅ Cập nhật vai trò thành công!');
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật vai trò:', error);
      alert(error?.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.');
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.ho_ten.trim() || !createForm.email.trim()) {
      alert('Vui lòng nhập họ tên và email.');
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        ho_ten: createForm.ho_ten.trim(),
        email: createForm.email.trim(),
        ma_sinh_vien: createForm.ma_sinh_vien.trim() || null,
        ngay_sinh: createForm.ngay_sinh || null,
        vai_tro: [createForm.vai_tro],
        mat_khau: createForm.mat_khau.trim() || undefined
      };

      const res = await taoNguoiDungAdmin(payload);
      const tempPassword = res?.data?.data?.temp_password;

      setIsCreateOpen(false);
      setCreateForm({ ho_ten: '', email: '', ma_sinh_vien: '', ngay_sinh: '', vai_tro: 'sinh_vien', mat_khau: '' });

      if (tempPassword) {
        alert(`✅ Tạo người dùng thành công!\n\nMật khẩu tạm thời: ${tempPassword}`);
      } else {
        alert('✅ Tạo người dùng thành công!');
      }

      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi tạo người dùng:', error);
      alert(error?.response?.data?.message || 'Không thể tạo người dùng. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.ho_ten}"?`)) return;

    try {
      await xoaNguoiDungAdmin(user.id);
      alert('✅ Đã xóa người dùng!');
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi xóa người dùng:', error);
      alert(error?.response?.data?.message || 'Không thể xóa người dùng. Vui lòng thử lại.');
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

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Thêm người dùng
          </button>
        </div>

        {/* Create modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="font-semibold text-gray-800">Thêm người dùng</div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 space-y-3">
                <div>
                  <label className="text-sm text-gray-700 font-medium">Họ tên *</label>
                  <input
                    value={createForm.ho_ten}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ho_ten: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 font-medium">Email *</label>
                  <input
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ví dụ: a@student.ute.edu.vn"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 font-medium">Mã sinh viên</label>
                  <input
                    value={createForm.ma_sinh_vien}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ma_sinh_vien: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ví dụ: 2111505..."
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    value={createForm.ngay_sinh}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ngay_sinh: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nếu để trống mật khẩu, hệ thống sẽ tạo mật khẩu theo ngày sinh (ddMMyyyy).
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-700 font-medium">Vai trò</label>
                  <select
                    value={createForm.vai_tro}
                    onChange={(e) => setCreateForm((p) => ({ ...p, vai_tro: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="sinh_vien">Sinh viên</option>
                    <option value="giao_vien">Giảng viên</option>
                    <option value="doanh_nghiep">Doanh nghiệp</option>
                    {/* <option value="dieu_phoi_vien">Điều phối viên</option> */}
                    <option value="kiem_duyet_vien">Ban giám hiệu</option>
                    <option value="quan_tri_vien">Trưởng phòng CTSV</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-700 font-medium">Mật khẩu (để trống sẽ tự sinh)</label>
                  <input
                    type="text"
                    value={createForm.mat_khau}
                    onChange={(e) => setCreateForm((p) => ({ ...p, mat_khau: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Tùy chọn"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isCreating ? 'Đang tạo...' : 'Tạo người dùng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <p className="text-gray-500">{searchTerm ? 'Không tìm thấy người dùng nào' : 'Không có người dùng nào'}</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.anh_dai_dien_url ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={user.anh_dai_dien_url} alt={user.ho_ten} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {user.ho_ten?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.ho_ten}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.ma_sinh_vien || 'N/A'}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={getPrimaryRole(user.vai_tro)}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="sinh_vien">Sinh viên</option>
                          <option value="giao_vien">Giảng viên</option>
                          <option value="doanh_nghiep">Doanh nghiệp</option>
                          <option value="kiem_duyet_vien">Kiểm duyệt viên</option>
                          <option value="quan_tri_vien">Quản trị viên</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            disabled={resettingUserId === user.id}
                            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {resettingUserId === user.id ? 'Đang reset...' : 'Reset mật khẩu'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
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
            <button onClick={() => setSearchTerm('')} className="text-blue-600 hover:text-blue-700 font-medium">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;