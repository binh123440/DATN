import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Lock, Globe, MessageCircle } from 'lucide-react';
import { layDanhSachNhom, taoNhom, thamGiaNhom } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const Groups = () => {
  const [nhoms, setNhoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tenNhom, setTenNhom] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNhoms();
  }, []);

  const fetchNhoms = async () => {
    try {
      setLoading(true);
      const response = await layDanhSachNhom({ limit: 50 });
      
      console.log('📦 Full response:', response);
      
      // Kiểm tra cấu trúc response
      if (response && response.data) {
        const nhomsList = response.data.nhoms || [];
        console.log('📋 Danh sách nhóm:', nhomsList);
        console.log('📊 Số lượng nhóm:', nhomsList.length);
        setNhoms(nhomsList);
      } else {
        console.warn('⚠️ Response không có data');
        setNhoms([]);
      }
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách nhóm:', error);
      console.error('❌ Error response:', error.response?.data);
      setNhoms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNhom = async (e) => {
    e.preventDefault();
    if (!tenNhom.trim()) return;

    setIsCreating(true);
    try {
      const response = await taoNhom({ ten_hoi_thoai: tenNhom });
      if (response.success) {
        alert('Tạo nhóm thành công!');
        setShowCreateModal(false);
        setTenNhom('');
        fetchNhoms();
      }
    } catch (error) {
      alert('Lỗi tạo nhóm: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (idNhom) => {
    try {
      const response = await thamGiaNhom(idNhom);
      if (response.success) {
        alert(response.message);
        fetchNhoms();
      }
    } catch (error) {
      alert('Lỗi tham gia nhóm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenGroup = (idNhom) => {
    navigate(`/nhom/${idNhom}`);
  };

  const filteredNhoms = nhoms.filter(nhom => 
    nhom.ten_hoi_thoai?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nhóm</h1>
            <p className="text-gray-600">Khám phá và tham gia các nhóm học tập</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Tạo nhóm mới</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải nhóm...</p>
        </div>
      ) : filteredNhoms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'Không tìm thấy nhóm nào' : 'Chưa có nhóm nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNhoms.map((nhom) => (
            <div
              key={nhom.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenGroup(nhom.id)}
            >
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {nhom.ten_hoi_thoai}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{nhom.so_thanh_vien || 0} thành viên</span>
                  </div>
                </div>

                {/* Action Button */}
                {nhom.da_tham_gia ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGroup(nhom.id);
                    }}
                    className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    <span>Xem nhóm</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(nhom.id);
                    }}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Tham gia nhóm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo nhóm mới</h2>
            
            <form onSubmit={handleCreateNhom}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setTenNhom('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !tenNhom.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
