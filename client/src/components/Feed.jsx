import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { layDanhSachBaiViet, layDanhSachKhoa } from '../services/apiService';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';
import PostModal from './PostModal';

const parseTargetAudienceFromPlan = (raw) => {
  if (!raw) return { roles: [], khoa_ids: [], voluntary: true };

  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { obj = null; }
  }
  if (!obj || typeof obj !== 'object') return { roles: [], khoa_ids: [], voluntary: true };

  const ta = obj.targetAudience || obj.target_audience || {};
  const khoaIds =
    Array.isArray(ta.khoa_ids) ? ta.khoa_ids :
    Array.isArray(ta.khoaIds) ? ta.khoaIds : [];

  return {
    voluntary: ta.voluntary !== false,
    roles: Array.isArray(ta.roles) ? ta.roles : [],
    khoa_ids: khoaIds
  };
};

const Feed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [audienceFilter, setAudienceFilter] = useState('all'); // all | role:* | khoa:*
  const [khoaList, setKhoaList] = useState([]);

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

  useEffect(() => {
    const fetchKhoa = async () => {
      try {
        const resp = await layDanhSachKhoa();
        if (resp?.success) setKhoaList(resp.data || []);
      } catch (e) {
        console.error('Lỗi khi tải khoa:', e);
        setKhoaList([]);
      }
    };
    fetchKhoa();
  }, []);

  const filteredPosts = useMemo(() => {
    if (audienceFilter === 'all') return posts;

    return (posts || []).filter((post) => {
      // Khi đang lọc theo đối tượng -> chỉ lọc các bài sự kiện
      if (!post?.su_kien || typeof post.su_kien !== 'object' || !post.su_kien.id) return false;

      const ta = parseTargetAudienceFromPlan(post.su_kien.ke_hoach_chi_tiet);

      if (audienceFilter.startsWith('role:')) {
        const role = audienceFilter.replace('role:', '');
        return (ta.roles || []).includes(role);
      }

      if (audienceFilter.startsWith('khoa:')) {
        const id = Number(audienceFilter.replace('khoa:', ''));
        return (ta.khoa_ids || []).includes(id);
      }

      return true;
    });
  }, [posts, audienceFilter]);

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

  const roleFilterOptions = useMemo(() => ([
    { value: 'role:dieu_phoi_vien', label: 'Cán bộ, nhân viên trong trường' },
    { value: 'role:giao_vien', label: 'Giảng viên' },
    { value: 'role:sinh_vien', label: 'Sinh viên' },
    { value: 'role:doanh_nghiep', label: 'Doanh nghiệp' },
    { value: 'role:quan_tri_vien', label: 'Quản trị viên' }
  ]), []);

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

      {/* Thanh lọc */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-sm font-semibold text-gray-800">Lọc Feed theo đối tượng sự kiện</div>

          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tất cả bài viết</option>
            <optgroup label="Theo vai trò">
              {roleFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
            <optgroup label="Theo khoa">
              {khoaList.map((k) => (
                <option key={k.id} value={`khoa:${k.id}`}>{k.ten_khoa}</option>
              ))}
            </optgroup>
          </select>

          <div className="text-xs text-gray-500 sm:ml-auto">
            Đang hiển thị: <span className="font-semibold">{filteredPosts.length}</span> bài
          </div>
        </div>
        {audienceFilter !== 'all' && (
          <div className="mt-2 text-xs text-gray-500">
            Gợi ý: khi chọn bộ lọc, hệ thống chỉ hiển thị bài viết <strong>sự kiện</strong> phù hợp.
          </div>
        )}
      </div>

      <PostComposer onCreatePost={fetchPosts} 
        currentUserId={currentUser?.id}
        currentUser={currentUser} 
      />

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Đang tải bài viết...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl">
          <p className="text-gray-500">Không có bài viết phù hợp bộ lọc</p>
        </div>
      ) : (
        filteredPosts.map(post => (
          <div key={post.id} className="mb-4">
            {/* ✅ Kiểm tra chặt chẽ hơn: post.su_kien phải là một object và có id */}
            {post.su_kien && typeof post.su_kien === 'object' && post.su_kien.id ? (
              <EventPostCard 
                post={post}
                currentUserId={currentUserId}
                userRole={userRole}
                currentUser={currentUser}
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
          // ✅ Đồng bộ logic trong Modal
          return post?.su_kien && typeof post.su_kien === 'object' && post.su_kien.id ? (
            <EventPostCard
              post={post}
              {...props}
              currentUserId={currentUserId}
              userRole={userRole}
              currentUser={currentUser}
              isInModal={true}
            />
          ) : (
            <PostCard
              post={post}
              {...props}
              currentUserId={currentUserId}
              isInModal={true}
            />
          );
        }}
      />
    </div>
  );
};

export default Feed;