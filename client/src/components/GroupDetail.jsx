import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Settings, LogOut, MessageSquare, Edit2, Trash2, 
  MessageCircle, X, MoreVertical, Shield, ArrowLeft, Image, Video
} from 'lucide-react';
import {
  layChiTietNhom,
  roiNhom,
  layDanhSachThanhVienNhom,
  xoaThanhVienKhoiNhom,
  capNhatVaiTroThanhVien,
  capNhatTenNhom,
  xoaNhom,
  thamGiaNhom,
  layBaiVietTrongNhom,
  taoBaiViet
} from '../services/apiService';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nhom, setNhom] = useState(null);
  const [thanhViens, setThanhViens] = useState([]);
  const [baiViets, setBaiViets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [tenNhomMoi, setTenNhomMoi] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Post composer states
  const [noiDung, setNoiDung] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    fetchNhomDetail();
    fetchThanhViens();
    fetchBaiViets();
  }, [id]);

  const fetchNhomDetail = async () => {
    try {
      setLoading(true);
      const response = await layChiTietNhom(id);
      setNhom(response.data);
      setTenNhomMoi(response.data.ten_hoi_thoai);
    } catch (error) {
      console.error('Lỗi lấy chi tiết nhóm:', error);
      alert('Không thể tải thông tin nhóm');
    } finally {
      setLoading(false);
    }
  };

  const fetchThanhViens = async () => {
    try {
      const response = await layDanhSachThanhVienNhom(id);
      setThanhViens(response.data || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách thành viên:', error);
    }
  };

  const fetchBaiViets = async () => {
    try {
      const response = await layBaiVietTrongNhom(id, { limit: 50 });
      setBaiViets(response.data.bai_viets || []);
    } catch (error) {
      console.error('Lỗi lấy bài viết:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const response = await thamGiaNhom(id);
      if (response.success) {
        alert(response.message);
        fetchNhomDetail();
        fetchThanhViens();
      }
    } catch (error) {
      alert('Lỗi tham gia nhóm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;

    try {
      const response = await roiNhom(id);
      if (response.success) {
        alert(response.message);
        navigate('/nhom');
      }
    } catch (error) {
      alert('Lỗi rời nhóm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateTenNhom = async (e) => {
    e.preventDefault();
    try {
      const response = await capNhatTenNhom(id, tenNhomMoi);
      if (response.success) {
        alert('Cập nhật tên nhóm thành công!');
        setShowEditModal(false);
        fetchNhomDetail();
      }
    } catch (error) {
      alert('Lỗi cập nhật: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác!')) return;

    try {
      const response = await xoaNhom(id);
      if (response.success) {
        alert('Đã xóa nhóm thành công!');
        navigate('/nhom');
      }
    } catch (error) {
      alert('Lỗi xóa nhóm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveMember = async (idNguoiDung) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) return;

    try {
      const response = await xoaThanhVienKhoiNhom(id, idNguoiDung);
      if (response.success) {
        alert('Đã xóa thành viên!');
        fetchThanhViens();
        fetchNhomDetail();
      }
    } catch (error) {
      alert('Lỗi xóa thành viên: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChangeRole = async (idNguoiDung, vaiTroMoi) => {
    try {
      const response = await capNhatVaiTroThanhVien(id, idNguoiDung, vaiTroMoi);
      if (response.success) {
        alert('Đã cập nhật vai trò!');
        fetchThanhViens();
      }
    } catch (error) {
      alert('Lỗi cập nhật vai trò: ' + (error.response?.data?.message || error.message));
    }
  };

  // Post composer handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!noiDung.trim() && selectedFiles.length === 0) return;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('noi_dung', noiDung);
      formData.append('id_cuoc_hoi_thoai', id); // Gắn bài viết vào nhóm

      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      const response = await taoBaiViet(formData);
      if (response.success) {
        alert('Đã đăng bài viết trong nhóm!');
        setNoiDung('');
        setSelectedFiles([]);
        fetchBaiViets();
      }
    } catch (error) {
      alert('Lỗi đăng bài: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsPosting(false);
    }
  };

  const handleOpenChat = () => {
    // Navigate to chat with this group's conversation
    navigate(`/tin-nhan?conversation=${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải nhóm...</p>
        </div>
      </div>
    );
  }

  if (!nhom) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">Không tìm thấy nhóm</p>
        </div>
      </div>
    );
  }

  const isOwner = nhom.id_nguoi_tao === currentUserId;
  const isAdmin = nhom.vai_tro_cua_toi === 'quan_tri_vien';
  const isMember = nhom.da_tham_gia;
  const canManage = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/nhom')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Quay lại danh sách nhóm</span>
      </button>

      {/* Group Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {nhom.ten_hoi_thoai}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                >
                  <Users size={20} />
                  <span>{nhom.so_thanh_vien || 0} thành viên</span>
                </button>
                {isOwner && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Chủ nhóm
                  </span>
                )}
                {isAdmin && !isOwner && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Quản trị viên
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isMember ? (
                <button
                  onClick={handleJoinGroup}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Tham gia nhóm
                </button>
              ) : (
                <>
                  {/* ✅ Nút Nhắn tin - Hiển thị cho thành viên */}
                  <button
                    onClick={handleOpenChat}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <MessageSquare size={18} />
                    <span>Nhắn tin</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Settings size={18} />
                      <span>Quản lý</span>
                    </button>
                  )}

                  {!isOwner && (
                    <button
                      onClick={handleLeaveGroup}
                      className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={18} />
                      <span>Rời nhóm</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Only show if member */}
      {isMember ? (
        <div className="space-y-6">
          {/* Post Composer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleCreatePost}>
              <textarea
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value)}
                placeholder={`Viết gì đó cho nhóm ${nhom.ten_hoi_thoai}...`}
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-300 outline-none"
                rows="3"
              />

              {/* Preview selected files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <Image size={20} />
                    <span>Ảnh</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <Video size={20} />
                    <span>Video</span>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPosting || (!noiDung.trim() && selectedFiles.length === 0)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          {baiViets.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Chưa có bài viết nào trong nhóm</p>
              <p className="text-gray-500 text-sm mt-2">Hãy là người đầu tiên đăng bài!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {baiViets.map((post) =>
                post.su_kien ? (
                  <EventPostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onRefresh={fetchBaiViets}
                  />
                ) : (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onPostDeleted={fetchBaiViets}
                  />
                )
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg mb-4">Tham gia nhóm để xem bài viết</p>
          <button
            onClick={handleJoinGroup}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tham gia ngay
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quản lý nhóm</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTenNhom} className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên nhóm
              </label>
              <input
                type="text"
                value={tenNhomMoi}
                onChange={(e) => setTenNhomMoi(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none mb-3"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Cập nhật tên nhóm
              </button>
            </form>

            {isOwner && (
              <button
                onClick={handleDeleteGroup}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                <span>Xóa nhóm</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Thành viên ({thanhViens.length})
              </h2>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedMember(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
              <div className="space-y-3">
                {thanhViens.map((tv) => {
                  const isCurrentUser = tv.id_nguoi_dung === currentUserId;
                  const isGroupOwner = tv.vai_tro === 'chu_nhom';
                  const isMemberAdmin = tv.vai_tro === 'quan_tri_vien';

                  return (
                    <div
                      key={tv.id_nguoi_dung}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {tv.nguoi_dung.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {tv.nguoi_dung.ho_ten}
                            {isCurrentUser && <span className="text-gray-500 text-sm ml-2">(Bạn)</span>}
                          </h4>
                          <div className="flex items-center gap-2">
                            {isGroupOwner ? (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                Chủ nhóm
                              </span>
                            ) : isMemberAdmin ? (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                Quản trị viên
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Thành viên</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManage && !isGroupOwner && !isCurrentUser && (
                        <div className="relative">
                          <button
                            onClick={() => setSelectedMember(selectedMember === tv.id_nguoi_dung ? null : tv.id_nguoi_dung)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>

                          {selectedMember === tv.id_nguoi_dung && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                              {isOwner && (
                                <button
                                  onClick={() => {
                                    handleChangeRole(
                                      tv.id_nguoi_dung,
                                      isMemberAdmin ? 'thanh_vien' : 'quan_tri_vien'
                                    );
                                    setSelectedMember(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Shield size={16} />
                                  <span>
                                    {isMemberAdmin ? 'Bỏ vai trò quản trị viên' : 'Đặt làm quản trị viên'}
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleRemoveMember(tv.id_nguoi_dung);
                                  setSelectedMember(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                                <span>Xóa khỏi nhóm</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;