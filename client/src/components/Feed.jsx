import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, ImagePlus, SmilePlus, Heart, MessageCircle, Share, X, MoreHorizontal, Trash2, Edit, Send, Edit2 } from 'lucide-react';
import { 
  layDanhSachBaiViet, 
  taoBaiVietVoiMedia, 
  taoSuKien, 
  thichBaiViet, 
  xoaBaiViet, 
  capNhatBaiViet, 
  capNhatSuKien,
  layDanhSachBinhLuan,
  taoBinhLuan,
  capNhatBinhLuan,
  xoaBinhLuan
} from '../services/apiService';
import EventCard from './EventCard';

/**
 * Component PostComposer - Khung soạn bài viết và tạo sự kiện
 */
const PostComposer = ({ onCreatePost, currentUserId }) => {
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState('');
  const [eventDetails, setEventDetails] = useState({ 
    name: '', location: '', date: '', time: '', maxParticipants: '', points: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ THÊM 2 STATE CHO MEDIA
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  // ✅ THÊM HÀM XỬ LÝ FILE
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Chỉ được chọn tối đa 5 file!');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    // Tạo preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, {
          url: reader.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeType === 'event') {
        const eventData = {
          id_nguoi_tao: currentUserId,
          ten_su_kien: eventDetails.name,
          mo_ta: content || eventDetails.name,
          dia_diem: eventDetails.location,
          thoi_gian_bat_dau: `${eventDetails.date} ${eventDetails.time}`,
          so_luong_toi_da: parseInt(eventDetails.maxParticipants),
          diem_thuong: parseInt(eventDetails.points),
          noi_dung_bai_viet: content
        };
        const response = await taoSuKien(eventData);
        if (response.success) {
          alert('Tạo sự kiện thành công! Đang chờ duyệt.');
          onCreatePost();
        }
      } else {
        // ✅ THAY ĐỔI DUY NHẤT: Gửi FormData thay vì JSON
        const formData = new FormData();
        formData.append('id_tac_gia', currentUserId);
        formData.append('noi_dung', content);
        
        // Thêm files
        selectedFiles.forEach(file => {
          formData.append('media', file);
        });

        const response = await taoBaiVietVoiMedia(formData); // ✅ Gọi API mới
        if (response.success) {
          alert('Đăng bài thành công!');
          onCreatePost();
        }
      }
      
      // Reset form
      setContent('');
      setActiveType(null);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setEventDetails({ name: '', location: '', date: '', time: '', maxParticipants: '', points: '' });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionButtons = [
    { type: 'image', label: 'Ảnh/Video', Icon: ImagePlus, activeClasses: 'text-purple-600 bg-purple-100', hoverClasses: 'hover:bg-purple-50' },
    { type: 'event', label: 'Sự kiện', Icon: Calendar, activeClasses: 'text-cyan-600 bg-cyan-100', hoverClasses: 'hover:bg-cyan-50' },
    { type: 'feeling', label: 'Cảm xúc', Icon: SmilePlus, activeClasses: 'text-yellow-600 bg-yellow-100', hoverClasses: 'hover:bg-yellow-50' }
  ];

  const isSubmitDisabled = isSubmitting || (activeType === 'event' 
    ? !eventDetails.name || !eventDetails.location || !eventDetails.date 
    : !content.trim() && selectedFiles.length === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">SV</div>
        <input 
          type="text" 
          placeholder={activeType === 'event' ? "Mô tả về sự kiện của bạn..." : "Bạn đang nghĩ gì?"} 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all" 
        />
      </div>

      {/* ✅ PREVIEW MEDIA - CHỈ HIỂN THỊ KHI CÓ FILE */}
      {previewUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {previewUrls.map((preview, index) => (
            <div key={index} className="relative group">
              {preview.type === 'image' ? (
                <img 
                  src={preview.url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={preview.url} 
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {activeType === 'event' && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4">
            <Calendar size={18} className="mr-2" />Tạo sự kiện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Tên sự kiện</label><input type="text" name="name" value={eventDetails.name} onChange={handleEventDetailChange} placeholder="Ví dụ: Hội thảo AI" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Địa điểm</label><input type="text" name="location" value={eventDetails.location} onChange={handleEventDetailChange} placeholder="Ví dụ: Hội trường A" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Ngày</label><input type="date" name="date" value={eventDetails.date} onChange={handleEventDetailChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Giờ</label><input type="time" name="time" value={eventDetails.time} onChange={handleEventDetailChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Số người tối đa</label><input type="number" name="maxParticipants" value={eventDetails.maxParticipants} onChange={handleEventDetailChange} placeholder="100" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Điểm thưởng</label><input type="number" name="points" value={eventDetails.points} onChange={handleEventDetailChange} placeholder="50" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" /></div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          {actionButtons.map((button) => (
            <div key={button.type}>
              {/* ✅ NÚT UPLOAD ẢNH/VIDEO - CHỈ THAY ĐỔI CHỖ NÀY */}
              {button.type === 'image' ? (
                <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium cursor-pointer ${activeType === button.type ? button.activeClasses : `text-gray-600 ${button.hoverClasses}`}`}>
                  <button.Icon size={20} />
                  <span className="hidden sm:inline">{button.label}</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    multiple 
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <button 
                  onClick={() => setActiveType(activeType === button.type ? null : button.type)} 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${activeType === button.type ? button.activeClasses : `text-gray-600 ${button.hoverClasses}`}`}
                >
                  <button.Icon size={20} />
                  <span className="hidden sm:inline">{button.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? 'Đang tạo...' : (activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài')}
        </button>
      </div>
    </div>
  );
};

/**
 * Component CommentItem - Hiển thị một bình luận với nested vô hạn cấp
 */
const CommentItem = ({ comment, currentUserId, onEdit, onDelete, onReply, depth = 0 }) => {
  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = currentUserId === comment.id_tac_gia;
  const hasReplies = comment.binh_luan_tra_loi && comment.binh_luan_tra_loi.length > 0;
  
  // ✅ Giới hạn độ sâu indent (sau 4 cấp thì không indent thêm)
  const maxIndent = 999;
  const currentIndent = Math.min(depth, maxIndent);
  const indentClass = currentIndent > 0 ? `ml-${currentIndent * 2}` : '';

  return (
    <div className={`mb-3 ${indentClass}`}>
      <div className="flex space-x-2">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {comment.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Bubble bình luận */}
          <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block max-w-full">
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-semibold text-sm text-gray-900">{comment.tac_gia.ho_ten}</h5>
              {isOwner && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit2 size={14} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-800 break-words">{comment.noi_dung}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4 mt-1 ml-2 text-xs text-gray-500">
            <span>{new Date(comment.ngay_tao).toLocaleString('vi-VN')}</span>
            <button
              onClick={() => onReply(comment)}
              className="hover:text-blue-600 font-medium transition-colors"
            >
              Trả lời
            </button>
            {/* ✅ Toggle hiển thị replies */}
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="hover:text-blue-600 font-medium transition-colors flex items-center space-x-1"
              >
                <span>{showReplies ? '▼' : '►'}</span>
                <span>{comment.binh_luan_tra_loi.length} phản hồi</span>
              </button>
            )}
          </div>

          {/* ✅ Nested replies - Đệ quy hiển thị tất cả cấp */}
          {hasReplies && showReplies && (
            <div className={`mt-2 space-y-2 ${depth < maxIndent ? 'border-l-2 border-blue-100 pl-3' : ''}`}>
              {comment.binh_luan_tra_loi.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  depth={depth + 1} // ✅ Tăng độ sâu
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Component CommentSection - Quản lý bình luận với nested vô hạn
 */
const CommentSection = ({ postId, currentUserId, initialCommentCount = 0, showComments, onToggle, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [totalComments, setTotalComments] = useState(initialCommentCount);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await layDanhSachBinhLuan(postId);
      if (response.success) {
        setComments(response.data.binh_luans || []);
        const newTotal = response.data.pagination.tong_so_binh_luan || 0;
        setTotalComments(newTotal);
        if (onCommentCountChange) {
          onCommentCountChange(newTotal);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải bình luận:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        await capNhatBinhLuan(editingComment.id, newComment);
        setEditingComment(null);
      } else {
        // ✅ Khi reply, gửi id của comment đang reply (cho phép nested vô hạn)
        await taoBinhLuan({
          id_bai_viet: postId,
          id_tac_gia: currentUserId,
          noi_dung: newComment,
          id_binh_luan_cha: replyingTo?.id || null // Gắn vào comment được reply
        });
        setReplyingTo(null);
      }
      
      setNewComment('');
      fetchComments();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.noi_dung);
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này? (Tất cả phản hồi con cũng sẽ bị xóa)')) {
      return;
    }

    try {
      await xoaBinhLuan(commentId);
      fetchComments();
    } catch (error) {
      alert('Lỗi khi xóa bình luận: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
    setNewComment('');
    
    // ✅ Scroll xuống input để user thấy họ đang reply
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder*="Trả lời"]');
      if (inputElement) {
        inputElement.focus();
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setNewComment('');
  };

  if (!showComments) return null;

  return (
    <div className="mt-3 space-y-3 bg-gray-50/50 rounded-lg p-3">
      {/* Input bình luận */}
      <div>
        {(editingComment || replyingTo) && (
          <div className="mb-2 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-blue-700">
              {editingComment ? (
                <>✏️ Đang chỉnh sửa bình luận</>
              ) : (
                <>
                  ↩️ Đang trả lời <strong>{replyingTo.tac_gia.ho_ten}</strong>
                  {replyingTo.id_binh_luan_cha && (
                    <span className="text-xs ml-1">(phản hồi cấp {calculateDepth(replyingTo)})</span>
                  )}
                </>
              )}
            </span>
            <button
              onClick={handleCancelEdit}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Hủy
            </button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            U
          </div>
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder={replyingTo ? `Trả lời ${replyingTo.tac_gia.ho_ten}...` : "Viết bình luận..."}
              className="flex-1 p-2 px-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            />
            <button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bình luận */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6">
          <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Chưa có bình luận nào</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              depth={0} // ✅ Bắt đầu từ độ sâu 0
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ✅ Helper function để tính độ sâu của comment (optional, cho hiển thị)
const calculateDepth = (comment) => {
  let depth = 1;
  let current = comment;
  while (current.id_binh_luan_cha) {
    depth++;
    current = current.binh_luan_cha || {};
  }
  return depth;
};

/**
 * Component PostActions - Các nút Thích, Bình luận, Chia sẻ (CẬP NHẬT)
 */
const PostActions = ({ post, currentUserId }) => {
  const [liked, setLiked] = useState(post.da_thich || false);
  const [likes, setLikes] = useState(post.so_luot_thich || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  // ✅ State để track số lượng bình luận
  const [commentCount, setCommentCount] = useState(post.so_binh_luan || 0);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;
    setLiked(newLiked);
    setLikes(newLikes);
    
    try {
      await thichBaiViet(post.id, currentUserId);
    } catch (error) {
      setLiked(!newLiked);
      setLikes(likes);
      console.error('Lỗi khi thích bài viết:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // ✅ Callback để cập nhật số lượng bình luận
  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  return (
    <div className="space-y-3">
      {/* ✅ HÀNG NÚT - Like, Bình luận, Chia sẻ */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {/* Nút Thích */}
          <button 
            onClick={handleLike} 
            disabled={isLiking} 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              liked 
                ? 'text-red-600 bg-red-50 shadow-sm' 
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart 
              size={18} 
              fill={liked ? 'currentColor' : 'none'}
              className={liked ? 'animate-pulse' : ''}
            />
            <span>{likes} Thích</span>
          </button>

          {/* ✅ Nút Bình luận - Hiển thị số lượng từ state local */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 ${
              showComments
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <MessageCircle size={18} />
            <span>{commentCount} Bình luận</span>
          </button>

          {/* Nút Chia sẻ */}
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200">
            <Share size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* ✅ PHẦN NỘI DUNG BÌNH LUẬN - Truyền callback */}
      <CommentSection
        postId={post.id}
        currentUserId={currentUserId}
        initialCommentCount={post.so_binh_luan || 0}
        showComments={showComments}
        onToggle={() => setShowComments(!showComments)}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
};

/**
 * Component PostCard - Thẻ hiển thị bài viết thường
 */
const PostCard = ({ post, currentUserId, onPostDeleted }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.noi_dung);
  const [isUpdating, setIsUpdating] = useState(false);

  // Đóng dropdown khi click bên ngoài
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await xoaBaiViet(post.id);
      if (response.success) {
        alert('Đã xóa bài viết thành công!');
        setShowDropdown(false);
        if (onPostDeleted) {
          onPostDeleted();
        }
      }
    } catch (error) {
      alert('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Hàm xử lý khi bắt đầu chỉnh sửa
  const handleEditClick = () => {
    setEditedContent(post.noi_dung);
    setIsEditing(true);
    setShowDropdown(false);
  };

  // ✅ Hàm xử lý khi lưu thay đổi
  const handleUpdatePost = async () => {
    if (editedContent === post.noi_dung) {
      setIsEditing(false);
      return;
    }
    setIsUpdating(true);
    try {
      const response = await capNhatBaiViet(post.id, { noi_dung: editedContent });
      if (response.success) {
        alert('Cập nhật bài viết thành công!');
        setIsEditing(false);
        if (onPostDeleted) { // Dùng chung callback để refresh
          onPostDeleted();
        }
      }
    } catch (error) {
      alert('Lỗi khi cập nhật bài viết: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  // Kiểm tra xem user hiện tại có phải chủ bài viết không
  const isOwner = currentUserId === post.id_tac_gia;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
          <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
        </div>
        
        {/* ✅ Dropdown Menu - Chỉ hiển thị nếu là chủ bài viết và không ở chế độ chỉnh sửa */}
        {isOwner && !isEditing && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Edit size={16} />
                  <span>Chỉnh sửa bài viết</span>
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 text-left text-black-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span>Tính năng thêm sau ...</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ✅ Giao diện chỉnh sửa hoặc hiển thị nội dung */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            rows="4"
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdatePost}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      ) : (
        post.noi_dung && <p className="text-gray-800 mb-4 leading-relaxed">{post.noi_dung}</p>
      )}
      
      {/* ✅ HIỂN THỊ MEDIA */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`mb-4 grid gap-2 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.map((media, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg">
              {media.resource_type === 'video' ? (
                <video 
                  src={media.url} 
                  controls 
                  className="w-full h-auto max-h-96 object-cover"
                />
              ) : (
                <img 
                  src={media.url} 
                  alt={`Media ${index + 1}`} 
                  className="w-full h-auto max-h-96 object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      <PostActions post={post} currentUserId={currentUserId} />
    </div>
  );
};

/**
 * Component EventPostCard - Thẻ hiển thị bài viết có kèm sự kiện (CÓ CHỈNH SỬA SỰ KIỆN)
 */
const EventPostCard = ({ post, currentUserId, userRole, onRefresh }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.noi_dung || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ State cho chỉnh sửa thông tin sự kiện
  const [editedEvent, setEditedEvent] = useState({
    ten_su_kien: post.su_kien?.ten_su_kien || '',
    dia_diem: post.su_kien?.dia_diem || '',
    thoi_gian_bat_dau: post.su_kien?.thoi_gian_bat_dau || '',
    so_luong_toi_da: post.su_kien?.so_luong_toi_da || '',
    diem_thuong: post.su_kien?.diem_thuong || ''
  });

  // Đóng dropdown khi click bên ngoài
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết và sự kiện này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await xoaBaiViet(post.id);
      if (response.success) {
        alert('Đã xóa bài viết và sự kiện thành công!');
        setShowDropdown(false);
        if (onRefresh) {
          onRefresh();
        }
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
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleEventFieldChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePost = async () => {
    setIsUpdating(true);
    try {
      // ✅ Cập nhật bài viết (mô tả)
      if (editedContent !== post.noi_dung) {
        await capNhatBaiViet(post.id, { noi_dung: editedContent });
      }

      // ✅ Cập nhật sự kiện
      const eventUpdateData = {
        ten_su_kien: editedEvent.ten_su_kien,
        dia_diem: editedEvent.dia_diem,
        thoi_gian_bat_dau: editedEvent.thoi_gian_bat_dau,
        so_luong_toi_da: parseInt(editedEvent.so_luong_toi_da),
        diem_thuong: parseInt(editedEvent.diem_thuong),
        noi_dung_bai_viet: editedContent
      };

      const response = await capNhatSuKien(post.su_kien.id, eventUpdateData);
      
      if (response.success) {
        alert('Cập nhật sự kiện thành công!');
        setIsEditing(false);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      alert('Lỗi khi cập nhật: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  // Tách date và time từ thoi_gian_bat_dau
  const getDateValue = () => {
    if (!editedEvent.thoi_gian_bat_dau) return '';
    return editedEvent.thoi_gian_bat_dau.split(' ')[0] || '';
  };

  const getTimeValue = () => {
    if (!editedEvent.thoi_gian_bat_dau) return '';
    return editedEvent.thoi_gian_bat_dau.split(' ')[1] || '';
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const currentTime = getTimeValue() || '00:00:00';
    setEditedEvent(prev => ({
      ...prev,
      thoi_gian_bat_dau: `${newDate} ${currentTime}`
    }));
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value + ':00';
    const currentDate = getDateValue();
    setEditedEvent(prev => ({
      ...prev,
      thoi_gian_bat_dau: `${currentDate} ${newTime}`
    }));
  };

  // Kiểm tra quyền sở hữu
  const isOwner = currentUserId === post.id_tac_gia;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
          <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
        </div>

        {/* ✅ Dropdown Menu */}
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

      {/* ✅ Giao diện chỉnh sửa TOÀN BỘ THÔNG TIN */}
      {isEditing ? (
        <div className="mb-4 space-y-4">
          {/* Mô tả bài viết */}
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

          {/* Form chỉnh sửa thông tin sự kiện */}
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

          {/* Nút hành động */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdatePost}
              disabled={isUpdating}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hiển thị bình thường */}
          {post.noi_dung && <p className="text-gray-800 mb-4 leading-relaxed">{post.noi_dung}</p>}
          
          <EventCard 
            event={post.su_kien} 
            currentUserId={currentUserId}
            userRole={userRole}
            onRefresh={onRefresh}
          />

          <div className="mt-4">
            <PostActions post={post} currentUserId={currentUserId} />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Component Feed - Component chính hiển thị trang chủ
 */
const Feed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const currentUserId = currentUser?.id || 1;
  const userRole = currentUser?.vai_tro || 'sinh_vien';

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await layDanhSachBaiViet(currentPage, 10);
      if (response.success) {
        setPosts(response.data.bai_viets || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-400 bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg"><Home className="w-7 h-7 text-white" /></div>
          <div className="flex-1 pt-1"><h2 className="text-2xl font-bold">Chào mừng, {currentUser?.name || 'bạn'}!</h2><p className="text-cyan-100 text-sm">Kết nối và chia sẻ với cộng đồng UTE</p></div>
        </div>
      </div>

      <PostComposer onCreatePost={fetchPosts} currentUserId={currentUserId} />

      {isLoading ? (
        <div className="text-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-4">Đang tải bài viết...</p></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl"><p className="text-gray-500">Chưa có bài viết nào</p></div>
      ) : (
        posts.map(post => (
          <div key={post.id}>
            {post.su_kien ? (
              <EventPostCard 
                post={post}
                currentUserId={currentUserId}
                userRole={userRole}
                onRefresh={fetchPosts}
              />
            ) : (
              <PostCard 
                post={post} 
                currentUserId={currentUserId} 
                onPostDeleted={fetchPosts}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;