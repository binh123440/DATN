import React, { useState } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import CommentSection from './CommentSection';
import { thichBaiViet } from '../services/apiService';

const PostActions = ({ post, currentUserId }) => {
  const [liked, setLiked] = useState(post.da_thich || false);
  const [likes, setLikes] = useState(Number(post.so_luot_thich) || 0); // ✅ Ép kiểu sang Number
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(post.so_binh_luan) || 0); // ✅ Ép kiểu sang Number

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true); // ✅ Đặt trước để tránh double click
    
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1; // ✅ Bây giờ sẽ cộng đúng
    
    // Optimistic update
    setLiked(newLiked);
    setLikes(newLikes);
    
    try {
      await thichBaiViet(post.id, currentUserId);
    } catch (error) {
      // Rollback nếu có lỗi
      setLiked(!newLiked);
      setLikes(likes);
      console.error('Lỗi khi thích bài viết:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(Number(newCount) || 0); // ✅ Đảm bảo luôn là số
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
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

          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200">
            <Share size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      <CommentSection
        postId={post.id}
        currentUserId={currentUserId}
        initialCommentCount={post.so_binh_luan || 0}
        showComments={showComments}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
};

export default PostActions;