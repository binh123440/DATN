import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  GraduationCap, 
  Award, 
  Camera,
  Edit2,
  Save,
  X,
  Loader,
  Image as ImageIcon
} from 'lucide-react';
import { 
  layThongTinNguoiDung, 
  capNhatThongTinCaNhan,
  capNhatAnhNguoiDung
} from '../services/apiService';

const UserProfile = ({ currentUser }) => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCoverHover, setShowCoverHover] = useState(false);

  const isOwnProfile = currentUser?.id === parseInt(id);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await layThongTinNguoiDung(id);
      if (response.data.success) {
        setUserData(response.data.data);
        setEditForm({
          ho_ten: response.data.data.ho_ten,
          dong_gioi_thieu: response.data.data.dong_gioi_thieu || '',
          ngay_sinh: response.data.data.ngay_sinh || '',
          so_dien_thoai: response.data.data.so_dien_thoai || '',
          lop_sh: response.data.data.lop_sh || ''
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải thông tin người dùng:', error);
      alert('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await capNhatThongTinCaNhan(id, editForm);
      if (response.data.success) {
        alert('✅ Cập nhật thông tin thành công!');
        setIsEditing(false);
        fetchUserData();
      }
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật thông tin');
    }
  };

  const handleImageUpload = async (e, loaiAnh) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Kích thước file không được vượt quá 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    try {
      if (loaiAnh === 'anh_dai_dien') {
        setUploadingAvatar(true);
      } else {
        setUploadingCover(true);
      }

      const response = await capNhatAnhNguoiDung(id, file, loaiAnh);
      
      if (response.data.success) {
        alert('✅ Cập nhật ảnh thành công!');
        await fetchUserData();
      }
    } catch (error) {
      console.error('❌ Lỗi khi upload ảnh:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật ảnh');
    } finally {
      if (loaiAnh === 'anh_dai_dien') {
        setUploadingAvatar(false);
      } else {
        setUploadingCover(false);
      }
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto text-gray-400 mb-4" size={64} />
        <p className="text-gray-500 text-lg">Không tìm thấy người dùng</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Cover Photo */}
      <div 
        className="relative h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-2xl overflow-hidden group"
        onMouseEnter={() => setShowCoverHover(true)}
        onMouseLeave={() => setShowCoverHover(false)}
      >
        {userData.anh_bia_url ? (
          <img 
            src={userData.anh_bia_url} 
            alt="Ảnh bìa" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" />
        )}

        {/* Nút Camera đổi ảnh bìa chỉ hiện khi đang chỉnh sửa */}
        {isOwnProfile && isEditing && (
          <label className={`absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 ${uploadingCover ? 'opacity-75 cursor-not-allowed' : ''}`}>
            {uploadingCover ? (
              <Loader className="text-blue-600 animate-spin" size={20} />
            ) : (
              <Camera size={20} className="text-gray-700" />
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'anh_bia')}
              disabled={uploadingCover}
            />
          </label>
        )}

        {/* Overlay loading toàn màn hình */}
        {uploadingCover && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader className="animate-spin mx-auto mb-3" size={40} />
              <p className="text-lg font-medium">Đang tải ảnh bìa lên...</p>
              <p className="text-sm mt-2 text-gray-200">Ảnh cũ sẽ được tự động xóa</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-b-2xl shadow-lg -mt-16 relative">
        <div className="p-6 pt-20">
          {/* Avatar Section */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-16">
            <div className="relative group">
              {userData.anh_dai_dien_url ? (
                <img 
                  src={userData.anh_dai_dien_url} 
                  alt={userData.ho_ten}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {userData.ho_ten?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Nút Camera đổi avatar chỉ hiện khi đang chỉnh sửa */}
              {isOwnProfile && isEditing && (
                <label className={`absolute bottom-0 right-0 bg-white p-2.5 rounded-full shadow-xl cursor-pointer hover:bg-gray-100 transition-all border-2 border-gray-200 hover:border-blue-500 ${uploadingAvatar ? 'opacity-75 cursor-not-allowed' : ''}`}>
                  {uploadingAvatar ? (
                    <Loader className="text-blue-600 animate-spin" size={20} />
                  ) : (
                    <Camera size={20} className="text-gray-700 group-hover:text-blue-600" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'anh_dai_dien')}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}

              {/* Overlay loading ảnh đại diện */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader className="text-white animate-spin" size={28} />
                </div>
              )}
            </div>
          </div>

          {/* User Name & Bio */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.ho_ten}</h1>
            {userData.dong_gioi_thieu && (
              <p className="text-gray-600 max-w-2xl mx-auto">{userData.dong_gioi_thieu}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8 pb-6 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userData.thong_ke?.so_bai_viet || 0}
              </div>
              <div className="text-sm text-gray-500">Bài viết</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {userData.thong_ke?.so_su_kien_tham_gia || 0}
              </div>
              <div className="text-sm text-gray-500">Sự kiện</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {userData.tong_diem || 0}
              </div>
              <div className="text-sm text-gray-500">Điểm rèn luyện</div>
            </div>
          </div>

          {/* Edit Button */}
          {isOwnProfile && !isEditing && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <Edit2 size={18} />
                Chỉnh sửa thông tin
              </button>
            </div>
          )}

          {/* Information Section */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={24} className="text-blue-600" />
              Thông tin cá nhân
            </h2>

            {isEditing ? (
              // Edit Form
              <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editForm.ho_ten}
                    onChange={(e) => setEditForm({ ...editForm, ho_ten: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={editForm.dong_gioi_thieu}
                    onChange={(e) => setEditForm({ ...editForm, dong_gioi_thieu: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Viết vài dòng về bản thân..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={editForm.ngay_sinh}
                      onChange={(e) => setEditForm({ ...editForm, ngay_sinh: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={editForm.so_dien_thoai}
                      onChange={(e) => setEditForm({ ...editForm, so_dien_thoai: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lớp sinh hoạt
                    </label>
                    <input
                      type="text"
                      value={editForm.lop_sh}
                      onChange={(e) => setEditForm({ ...editForm, lop_sh: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VD: 21DTHD1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        ho_ten: userData.ho_ten,
                        dong_gioi_thieu: userData.dong_gioi_thieu || '',
                        ngay_sinh: userData.ngay_sinh || '',
                        so_dien_thoai: userData.so_dien_thoai || '',
                        lop_sh: userData.lop_sh || ''
                      });
                    }}
                    className="flex-1 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              // View Info
              <div className="space-y-4">
                {userData.email && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Mail className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email</div>
                      <div className="font-medium text-gray-900">{userData.email}</div>
                    </div>
                  </div>
                )}

                {userData.so_dien_thoai && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Số điện thoại</div>
                      <div className="font-medium text-gray-900">{userData.so_dien_thoai}</div>
                    </div>
                  </div>
                )}

                {userData.ngay_sinh && (
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ngày sinh</div>
                      <div className="font-medium text-gray-900">
                        {new Date(userData.ngay_sinh).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {userData.lop_sh && (
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <GraduationCap className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Lớp sinh hoạt</div>
                      <div className="font-medium text-gray-900">Lớp {userData.lop_sh}</div>
                    </div>
                  </div>
                )}

                {userData.nganh && (
                  <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Award className="text-red-600" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ngành học</div>
                      <div className="font-medium text-gray-900">{userData.nganh.ten_nganh}</div>
                      {userData.nganh.khoa && (
                        <div className="text-sm text-gray-600">{userData.nganh.khoa.ten_khoa}</div>
                      )}
                    </div>
                  </div>
                )}

                {!userData.email && !userData.so_dien_thoai && !userData.ngay_sinh && !userData.lop_sh && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <User className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">Chưa có thông tin chi tiết</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Thêm thông tin →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;