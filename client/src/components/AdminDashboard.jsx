import React, { useState, useEffect } from 'react';
import { 
  layDanhSachNguoiDung, 
  capNhatVaiTroNguoiDung, 
  layNoiDungChoDuyet, 
  duyetNoiDung 
} from '../services/apiService';
import { CheckCircle, XCircle, User, FileText, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' hoặc 'content'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, contentRes] = await Promise.all([
        layDanhSachNguoiDung(),
        layNoiDungChoDuyet()
      ]);
      
      setUsers(usersRes.data.data || []);
      setPendingContent(contentRes.data.data || []);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);
      alert('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, loai) => {
    if (!confirm('Bạn có chắc muốn duyệt nội dung này?')) return;
    
    try {
      await duyetNoiDung(id, loai, 'da_duyet');
      alert('✅ Đã duyệt nội dung thành công!');
      fetchData();
    } catch (error) {
      console.error("❌ Lỗi khi duyệt:", error);
      alert('Không thể duyệt. Vui lòng thử lại.');
    }
  };

  const handleReject = async (id, loai) => {
    if (!confirm('Bạn có chắc muốn từ chối nội dung này?')) return;
    
    try {
      await duyetNoiDung(id, loai, 'bi_tu_choi');
      alert('✅ Đã từ chối nội dung!');
      fetchData();
    } catch (error) {
      console.error("❌ Lỗi khi từ chối:", error);
      alert('Không thể từ chối. Vui lòng thử lại.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Bạn có chắc muốn đổi vai trò thành ${newRole}?`)) return;
    
    try {
      await capNhatVaiTroNguoiDung(userId, newRole);
      alert('✅ Cập nhật vai trò thành công!');
      fetchData();
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật vai trò:", error);
      alert('Không thể cập nhật. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Trang quản trị</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`py-3 px-6 font-semibold transition-colors ${
              activeTab === 'users' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="inline mr-2" size={18} />
            Quản lý người dùng ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('content')} 
            className={`py-3 px-6 font-semibold transition-colors ${
              activeTab === 'content' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="inline mr-2" size={18} />
            Duyệt nội dung ({pendingContent.length})
          </button>
        </div>

        {/* Tab: Quản lý người dùng */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Danh sách người dùng
            </h2>
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Không có người dùng nào.</p>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
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
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
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
                              className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="sinh_vien">Sinh viên</option>
                              <option value="giao_vien">Giáo viên</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Duyệt nội dung */}
        {activeTab === 'content' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Nội dung chờ duyệt
            </h2>
            {pendingContent.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                <p className="text-gray-500 text-lg">Không có nội dung nào chờ duyệt.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingContent.map(item => (
                  <div 
                    key={`${item.loai}-${item.id}`} 
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="text-blue-500" size={20} />
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {item.loai === 'bai_viet' ? 'Bài viết' : 'Sự kiện'}
                          </span>
                        </div>
                        
                        {item.tac_gia && (
                          <div className="flex items-center gap-2 mb-3">
                            {item.tac_gia.anh_dai_dien_url ? (
                              <img 
                                src={item.tac_gia.anh_dai_dien_url} 
                                alt={item.tac_gia.ho_ten}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                                {item.tac_gia.ho_ten?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {item.tac_gia.ho_ten}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-gray-800 mb-2 line-clamp-3">
                          {item.noi_dung || item.mo_ta || 'Không có nội dung'}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          Ngày tạo: {new Date(item.ngay_tao).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button 
                          onClick={() => handleApprove(item.id, item.loai)} 
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        >
                          <CheckCircle size={18} /> Duyệt
                        </button>
                        <button 
                          onClick={() => handleReject(item.id, item.loai)} 
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                        >
                          <XCircle size={18} /> Từ chối
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;