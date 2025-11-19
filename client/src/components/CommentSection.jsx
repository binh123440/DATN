import React, { useState, useEffect } from 'react';
import { Send, MoreHorizontal, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { layDanhSachBinhLuan, taoBinhLuan, capNhatBinhLuan, xoaBinhLuan } from '../services/apiService';

const CommentItem = ({ comment, currentUserId, onEdit, onDelete, onReply }) => {
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId === comment.id_tac_gia;

  return (
    <div className="mb-4">
      <div className="flex space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {comment.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        
        <div className="flex-1">
          <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block max-w-full">
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-semibold text-sm text-gray-900">{comment.tac_gia.ho_ten}</h5>
              {isOwner && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
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
            <p className="text-sm text-gray-800">{comment.noi_dung}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 ml-2 text-xs text-gray-500">
            <span>{new Date(comment.ngay_tao).toLocaleString('vi-VN')}</span>
            <button
              onClick={() => onReply(comment)}
              className="hover:text-blue-600 font-medium"
            >
              Trả lời
            </button>
          </div>

          {/* Hiển thị các reply */}
          {comment.binh_luan_tra_loi && comment.binh_luan_tra_loi.length > 0 && (
            <div className="mt-3 ml-8 space-y-3">
              {comment.binh_luan_tra_loi.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, currentUserId, totalComments }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await layDanhSachBinhLuan(postId);
      if (response.success) {
        setComments(response.data.binh_luans || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải bình luận:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        // Cập nhật bình luận
        await capNhatBinhLuan(editingComment.id, newComment);
        setEditingComment(null);
      } else {
        // Tạo bình luận mới
        await taoBinhLuan({
          id_bai_viet: postId,
          id_tac_gia: currentUserId,
          noi_dung: newComment,
          id_binh_luan_cha: replyingTo?.id || null
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
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
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setNewComment('');
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
      {/* Input bình luận */}
      <div className="mb-4">
        {(editingComment || replyingTo) && (
          <div className="mb-2 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-blue-700">
              {editingComment ? (
                <>✏️ Đang chỉnh sửa bình luận</>
              ) : (
                <>↩️ Đang trả lời <strong>{replyingTo.tac_gia.ho_ten}</strong></>
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
        
        <div className="flex space-x-3">
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
              className="flex-1 p-2 px-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
            <button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
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
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;