import React, { useState, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import CommentItem from './CommentItem';
import { layDanhSachBinhLuan, taoBinhLuan, capNhatBinhLuan, xoaBinhLuan } from '../services/apiService';

const CommentSection = ({ 
  postId, 
  currentUserId, 
  initialCommentCount = 0, 
  showComments, 
  onCommentCountChange 
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await layDanhSachBinhLuan(postId);
      if (response.success) {
        setComments(response.data.binh_luans || []);
        const newTotal = response.data.pagination?.tong_so_binh_luan || 0;
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
  }, [showComments, postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        await capNhatBinhLuan(editingComment.id, newComment);
        setEditingComment(null);
      } else {
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

  if (!showComments) return null;

  return (
    <div className="mt-3 space-y-3 bg-gray-50/50 rounded-lg p-3">
      <div>
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
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;