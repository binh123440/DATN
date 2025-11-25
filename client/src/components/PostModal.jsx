import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { layChiTietBaiViet } from '../services/apiService';

/**
 * Component PostModal - Modal hiển thị bài viết chi tiết kiểu Facebook
 * Sử dụng React Portal để render trực tiếp lên body
 */
const PostModal = ({ postId, commentId, isOpen, onClose, currentUser, PostCardComponent }) => {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPost();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('body-no-scroll');
    return () => {
      document.body.classList.remove('body-no-scroll');
    };
  }, [isOpen]);
  
  const fetchPost = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await layChiTietBaiViet(postId);
      if (response.success) {
        setPost(response.data);
      } else {
        setError('Không tìm thấy bài viết');
      }
    } catch (err) {
      console.error('Lỗi khi tải bài viết:', err);
      setError('Có lỗi xảy ra khi tải bài viết');
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ Xử lý keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      style={{ 
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {post?.su_kien ? 'Bài viết sự kiện' : 'Bài viết'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng modal"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)] custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 ml-3">Đang tải bài viết...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : post ? (
            <div className="p-4">
              <PostCardComponent
                post={post}
                currentUserId={currentUser?.id}
                userRole={currentUser?.vai_tro}
                onPostDeleted={onClose}
                onRefresh={fetchPost} 
                isInModal={true}
                highlightCommentId={commentId}
                autoOpenComments={!!commentId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostModal;