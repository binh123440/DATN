import React, { useMemo, useState } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import CommentSection from './CommentSection';
import SharePostModal from './SharePostModal';
import { thichBaiViet, chiaSeBaiViet } from '../services/apiService';

const PostActions = ({ post, currentUserId, onShared, highlightCommentId, autoOpenComments }) => {
  const [liked, setLiked] = useState(post.da_thich || false);
  const [likes, setLikes] = useState(Number(post.so_luot_thich) || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(post.so_binh_luan) || 0);

  // ✅ Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // ✅ Share token cho chat (phương án 1)
  const shareToken = useMemo(() => `UTEPOST:${post?.id}`, [post?.id]);

  // ✅ Chuỗi "URL + token" để vừa đúng nghĩa URL, vừa chắc chắn Chat parse được token
  const shareLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Nếu route FE của bạn khác, chỉ cần đổi "/bai-viet/"
    const url = origin ? `${origin}/bai-viet/${post?.id}` : '';
    return url ? `${url} ${shareToken}` : shareToken;
  }, [post?.id, shareToken]);

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback bên dưới
    }

    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyShareLink = async () => {
    const ok = await copyToClipboard(shareLink);
    if (ok) alert('✅ Đã sao chép liên kết chia sẻ. Dán vào tin nhắn để hiện preview.');
    else alert('❌ Không thể sao chép. Bạn thử bôi đen và copy thủ công giúp mình.');
  };

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

  const handleCommentCountChange = (newCount) => {
    setCommentCount(Number(newCount) || 0);
  };

  const handleOpenShare = () => {
    if (!currentUserId) return alert('Vui lòng đăng nhập để chia sẻ.');
    setIsShareOpen(true);
  };

  const handleDoShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const res = await chiaSeBaiViet(post.id, { noi_dung: shareText });
      if (res?.data?.success === false) throw new Error(res?.data?.message || 'Chia sẻ thất bại');

      setIsShareOpen(false);
      setShareText('');
      onShared?.(); // ✅ refresh feed nếu parent truyền vào
      alert('✅ Đã chia sẻ bài viết.');
    } catch (e) {
      console.error('Lỗi chia sẻ:', e);
      alert(`❌ Không thể chia sẻ: ${e.message || 'Lỗi không xác định'}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              liked ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} className={liked ? 'animate-pulse' : ''} />
            <span>{likes} Thích</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 ${
              showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <MessageCircle size={18} />
            <span>{commentCount} Bình luận</span>
          </button>

          <button
            onClick={handleOpenShare}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
          >
            <Share size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      <SharePostModal
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        value={shareText}
        onChange={setShareText}
        onSubmit={handleDoShare}
        isSubmitting={isSharing}
        shareLink={shareLink}
        onCopyLink={handleCopyShareLink}
      />

      <CommentSection
        postId={post.id}
        currentUserId={currentUserId}
        initialCommentCount={post.so_binh_luan || 0}
        showComments={showComments || !!autoOpenComments}
        onCommentCountChange={handleCommentCountChange}
        highlightCommentId={highlightCommentId}
        autoOpenComments={autoOpenComments}
      />
    </div>
  );
};

export default PostActions;