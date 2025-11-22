import React, { useState, useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { layDanhSachBaiViet } from '../services/apiService';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';
import PostModal from './PostModal';

const Feed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ Ref để lưu vị trí scroll
  const scrollPositionRef = useRef(0);

  const restoreScrollPosition = () => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant'
      });
    });
  };

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

  useEffect(() => {
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');
    
    if (postId) {
      handleOpenModal(parseInt(postId), commentId ? parseInt(commentId) : null);
      searchParams.delete('postId');
      searchParams.delete('commentId');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const handleOpenModal = (postId, commentId = null) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedPostId(postId);
    setSelectedCommentId(commentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
    setSelectedCommentId(null);

    restoreScrollPosition();

    fetchPosts().finally(() => {
      restoreScrollPosition();
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-400 bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg">
            <Home className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-2xl font-bold">Chào mừng, {currentUser?.name || 'bạn'}!</h2>
            <p className="text-cyan-100 text-sm">Kết nối và chia sẻ với cộng đồng UTE</p>
          </div>
        </div>
      </div>

      <PostComposer onCreatePost={fetchPosts} currentUserId={currentUserId} />

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Đang tải bài viết...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl">
          <p className="text-gray-500">Chưa có bài viết nào</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id}>
            {post.su_kien ? (
              <EventPostCard 
                post={post}
                currentUserId={currentUserId}
                userRole={userRole}
                onRefresh={fetchPosts}
                onOpenModal={handleOpenModal}
              />
            ) : (
              <PostCard 
                post={post} 
                currentUserId={currentUserId} 
                onPostDeleted={fetchPosts}
                onOpenModal={handleOpenModal}
              />
            )}
          </div>
        ))
      )}

      <PostModal
        postId={selectedPostId}
        commentId={selectedCommentId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        currentUser={currentUser}
        PostCardComponent={({ post, ...props }) => {
          return post.su_kien ? (
            <EventPostCard post={post} {...props} />
          ) : (
            <PostCard post={post} {...props} />
          );
        }}
      />
    </div>
  );
};

export default Feed;