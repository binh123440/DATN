import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Trash2, Edit, Calendar, Image as ImageIcon, X } from 'lucide-react';
import PostActions from './PostActions';
import EventCard from './EventCard';
import ImageGalleryModal from './ImageGalleryModal';
import { xoaBaiViet, capNhatBaiViet, capNhatSuKien } from '../services/apiService';

const EventPostCard = ({ 
  post, 
  currentUserId, 
  userRole, 
  onRefresh, 
  isInModal = false, 
  onOpenModal,
  highlightCommentId,
  autoOpenComments
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.noi_dung || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editedEvent, setEditedEvent] = useState({
    ten_su_kien: post.su_kien?.ten_su_kien || '',
    dia_diem: post.su_kien?.dia_diem || '',
    thoi_gian_bat_dau: post.su_kien?.thoi_gian_bat_dau || '',
    so_luong_toi_da: post.su_kien?.so_luong_toi_da || '',
    diem_thuong: post.su_kien?.diem_thuong || ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState(post.media_urls || []);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeletePost = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết và sự kiện này?')) return;

    setIsDeleting(true);
    try {
      const response = await xoaBaiViet(post.id);
      if (response.success) {
        alert('Đã xóa bài viết và sự kiện thành công!');
        setShowDropdown(false);
        onRefresh?.();
      }
    } catch (error) {
      alert('Lỗi khi xóa: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    setEditedContent(post.noi_dung || '');
    setEditedEvent({
      ten_su_kien: post.su_kien?.ten_su_kien || '',
      dia_diem: post.su_kien?.dia_diem || '',
      thoi_gian_bat_dau: post.su_kien?.thoi_gian_bat_dau || '',
      so_luong_toi_da: post.su_kien?.so_luong_toi_da || '',
      diem_thuong: post.su_kien?.diem_thuong || ''
    });
    setMediaPreviews(post.media_urls || []);
    setMediaFiles([]);
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleEventFieldChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Xử lý chọn ảnh/video
  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage && !isVideo) {
        alert(`${file.name} không phải là ảnh hoặc video hợp lệ`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} vượt quá kích thước 10MB`);
        return false;
      }
      return true;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    // Tạo preview
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, {
          url: reader.result,
          resource_type: file.type.startsWith('image/') ? 'image' : 'video',
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Xóa ảnh/video
  const handleRemoveMedia = (index) => {
    const mediaToRemove = mediaPreviews[index];
    
    if (mediaToRemove.isNew) {
      // Xóa file mới (chưa upload)
      const fileIndex = mediaPreviews.slice(0, index).filter(m => m.isNew).length;
      setMediaFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePost = async () => {
    setIsUpdating(true);
    try {
      // ✅ Cập nhật bài viết
      const formData = new FormData();
      formData.append('noi_dung', editedContent);
      
      mediaFiles.forEach(file => formData.append('media', file));

      const oldMedia = mediaPreviews.filter(m => !m.isNew);
      if (oldMedia.length > 0) {
        formData.append('existing_media_urls', JSON.stringify(oldMedia));
      }

      await capNhatBaiViet(post.id, formData);

      // ✅ Cập nhật sự kiện
      const eventData = {
        ten_su_kien: editedEvent.ten_su_kien,
        dia_diem: editedEvent.dia_diem,
        thoi_gian_bat_dau: editedEvent.thoi_gian_bat_dau,
        so_luong_toi_da: parseInt(editedEvent.so_luong_toi_da),
        diem_thuong: parseInt(editedEvent.diem_thuong),
        noi_dung_bai_viet: editedContent
      };

      const response = await capNhatSuKien(post.su_kien.id, eventData);
      
      if (response.success) {
        alert('Cập nhật thành công!');
        setIsEditing(false);
        onRefresh?.();
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const getDateValue = () => editedEvent.thoi_gian_bat_dau?.split(' ')[0] || '';
  const getTimeValue = () => editedEvent.thoi_gian_bat_dau?.split(' ')[1] || '';

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const currentTime = getTimeValue() || '00:00:00';
    setEditedEvent(prev => ({ ...prev, thoi_gian_bat_dau: `${newDate} ${currentTime}` }));
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value + ':00';
    const currentDate = getDateValue();
    setEditedEvent(prev => ({ ...prev, thoi_gian_bat_dau: `${currentDate} ${newTime}` }));
  };

  const handleContentClick = () => {
    if (!isInModal && onOpenModal && !isEditing) {
      onOpenModal(post.id);
    }
  };

  const handleImageClick = (index, e) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const isOwner = currentUserId === post.id_tac_gia;
  const initials = post.tac_gia.ho_ten
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mediaCount = post.media_urls?.length || 0;
  const displayMedia = post.media_urls?.slice(0, 2) || [];
  const remainingCount = mediaCount - 2;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
            <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
          </div>

          {isOwner && !isEditing && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                  <button
                    onClick={handleEditClick}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Chỉnh sửa sự kiện</span>
                  </button>
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết & sự kiện'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mb-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mô tả sự kiện</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Mô tả về sự kiện..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
                rows="3"
              />
            </div>

            {/* ✅ Phần upload ảnh/video */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ảnh/Video sự kiện</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {mediaPreviews.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.resource_type === 'video' ? (
                      <video 
                        src={media.url} 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                    ) : (
                      <img 
                        src={media.url} 
                        alt={`Preview ${index}`}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    {media.isNew && (
                      <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">Mới</span>
                    )}
                  </div>
                ))}

                {/* Button thêm ảnh */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon size={24} className="text-gray-400" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">Chọn ảnh hoặc video (tối đa 10MB mỗi file)</p>
            </div>

            <div className="p-4 bg-cyan-50/50 border border-cyan-200 rounded-lg">
              <h3 className="text-sm font-semibold text-cyan-800 flex items-center mb-3">
                <Calendar size={16} className="mr-2" />
                Thông tin sự kiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Tên sự kiện</label>
                  <input
                    type="text"
                    name="ten_su_kien"
                    value={editedEvent.ten_su_kien}
                    onChange={handleEventFieldChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Địa điểm</label>
                  <input
                    type="text"
                    name="dia_diem"
                    value={editedEvent.dia_diem}
                    onChange={handleEventFieldChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Ngày</label>
                  <input
                    type="date"
                    value={getDateValue()}
                    onChange={handleDateChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Giờ</label>
                  <input
                    type="time"
                    value={getTimeValue().slice(0, 5)}
                    onChange={handleTimeChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Số người tối đa</label>
                  <input
                    type="number"
                    name="so_luong_toi_da"
                    value={editedEvent.so_luong_toi_da}
                    onChange={handleEventFieldChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Điểm thưởng</label>
                  <input
                    type="number"
                    name="diem_thuong"
                    value={editedEvent.diem_thuong}
                    onChange={handleEventFieldChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePost();
                }}
                disabled={isUpdating}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.noi_dung && (
              <div 
                onClick={handleContentClick}
                className={!isInModal ? 'cursor-pointer mb-4' : 'mb-4'}
              >
                <p className="text-gray-800 leading-relaxed">{post.noi_dung}</p>
              </div>
            )}

            {/* ✅ Hiển thị preview 2 ảnh đầu */}
            {mediaCount > 0 && (
              <div className={`mb-4 grid gap-2 ${displayMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {displayMedia.map((media, index) => (
                  <div 
                    key={index} 
                    className="relative overflow-hidden rounded-lg cursor-pointer group"
                    onClick={(e) => handleImageClick(index, e)}
                  >
                    {media.resource_type === 'video' ? (
                      <video 
                        src={media.url} 
                        className="w-full h-64 object-cover transition-transform group-hover:scale-105" 
                      />
                    ) : (
                      <img 
                        src={media.url} 
                        alt="" 
                        className="w-full h-64 object-cover transition-transform group-hover:scale-105" 
                        loading="lazy"
                      />
                    )}
                    
                    {index === 1 && remainingCount > 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">+{remainingCount}</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 group-hover:bg-opacity-20 transition-all" />
                  </div>
                ))}
              </div>
            )}
            
            <EventCard 
              event={post.su_kien} 
              currentUserId={currentUserId}
              userRole={userRole}
              onRefresh={onRefresh}
            />

            <div className="mt-4">
              <PostActions 
                post={post} 
                currentUserId={currentUserId}
                highlightCommentId={highlightCommentId}
                autoOpenComments={autoOpenComments}
              />
            </div>
          </>
        )}
      </div>

      {/* ✅ Modal xem ảnh full size */}
      {showImageModal && post.media_urls && (
        <ImageGalleryModal
          media={post.media_urls}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  );
};

export default EventPostCard;