import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Trash2, Edit, X, Image as ImageIcon } from 'lucide-react';
import PostActions from './PostActions';
import ImageGalleryModal from './ImageGalleryModal';
import { xoaBaiViet, capNhatBaiViet } from '../services/apiService';

const PostCard = ({ 
  post, 
  currentUserId, 
  onPostDeleted, 
  isInModal = false, 
  onOpenModal 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.noi_dung);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [previewMedia, setPreviewMedia] = useState(post.media_urls || []);

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
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    setIsDeleting(true);
    try {
      const response = await xoaBaiViet(post.id);
      if (response.success) {
        alert('Đã xóa bài viết thành công!');
        setShowDropdown(false);
        onPostDeleted?.();
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    setEditedContent(post.noi_dung);
    setPreviewMedia(post.media_urls || []);
    setSelectedMedia([]);
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedMedia(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewMedia(prev => [...prev, {
          url: reader.result,
          resource_type: file.type.startsWith('image/') ? 'image' : 'video',
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index) => {
    const media = previewMedia[index];
    if (media.isNew) {
      const newMediaIndex = previewMedia.slice(0, index).filter(m => m.isNew).length;
      setSelectedMedia(prev => prev.filter((_, i) => i !== newMediaIndex));
    }
    setPreviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePost = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('noi_dung', editedContent);
      
      // ✅ Thêm file mới
      selectedMedia.forEach(file => formData.append('media', file));

      // ✅ Giữ media cũ
      const oldMedia = previewMedia.filter(m => !m.isNew);
      if (oldMedia.length > 0) {
        formData.append('existing_media_urls', JSON.stringify(oldMedia));
      }

      const response = await capNhatBaiViet(post.id, formData);
      
      if (response.success) {
        alert('Cập nhật thành công!');
        setIsEditing(false);
        onPostDeleted?.();
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
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
  const mediaCount = post.media_urls?.length || 0;
  const displayMedia = post.media_urls?.slice(0, 2) || [];
  const remainingCount = mediaCount - 2;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          
            <div>
              <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten} </h4>
              <p className="text-xs text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
            </div>
            {post.nhom && (
              <div className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100 mt-2">
                Thuộc nhóm: {post.nhom.ten_hoi_thoai}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <button
                    onClick={handleEditClick}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div onClick={handleContentClick} className={!isInModal && !isEditing ? 'cursor-pointer' : ''}>
          {isEditing ? (
            <div className="mb-4" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none mb-3"
                rows="4"
              />

              <div className="mb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {previewMedia.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.resource_type === 'video' ? (
                        <video src={media.url} className="w-24 h-24 object-cover rounded-lg" />
                      ) : (
                        <img src={media.url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400"
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
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpdatePost(); }}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.noi_dung && (
                <p className="text-gray-800 mb-4 leading-relaxed">{post.noi_dung}</p>
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
                      
                      {/* Overlay hiển thị số ảnh còn lại */}
                      {index === 1 && remainingCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-3xl font-bold">+{remainingCount}</span>
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 group-hover:bg-opacity-20 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {!isEditing && <PostActions post={post} currentUserId={currentUserId} />}
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

export default PostCard;