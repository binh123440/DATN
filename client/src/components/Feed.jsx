import React, { useState, useEffect } from 'react';
import { Home, Calendar, ImagePlus, SmilePlus, Heart, MessageCircle, Share } from 'lucide-react';
import { layDanhSachBaiViet, taoBaiViet, taoSuKien, thichBaiViet } from '../services/apiService';
import EventCard from './EventCard'; // ✅ IMPORT EventCard từ file riêng biệt

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

  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
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
      } else if (content.trim()) {
        const postData = { id_tac_gia: currentUserId, noi_dung: content };
        const response = await taoBaiViet(postData);
        if (response.success) onCreatePost();
      }
      setContent('');
      setActiveType(null);
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
    : !content.trim());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">SV</div>
        <input type="text" placeholder={activeType === 'event' ? "Mô tả về sự kiện của bạn..." : "Bạn đang nghĩ gì?"} value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all" />
      </div>
      
      {activeType === 'event' && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4"><Calendar size={18} className="mr-2" />Tạo sự kiện</h3>
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
            <button key={button.type} onClick={() => setActiveType(activeType === button.type ? null : button.type)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${activeType === button.type ? button.activeClasses : `text-gray-600 ${button.hoverClasses}`}`}>
              <button.Icon size={20} /><span className="hidden sm:inline">{button.label}</span>
            </button>
          ))}
        </div>
        <button onClick={handleSubmit} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitDisabled}>
          {isSubmitting ? 'Đang tạo...' : (activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài')}
        </button>
      </div>
    </div>
  );
};

/**
 * Component PostCard - Thẻ hiển thị bài viết thường
 */
const PostCard = ({ post, currentUserId }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.so_luot_thich || 0);
  const [isLiking, setIsLiking] = useState(false);

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
        <button className="text-gray-400 hover:text-gray-600 p-2"><span className="text-lg">⋯</span></button>
      </div>
      <p className="text-gray-800 mb-4 leading-relaxed">{post.noi_dung}</p>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button onClick={handleLike} disabled={isLiking} className={`flex items-center space-x-2 px-3 py-1 rounded-lg font-medium transition-colors duration-200 ${liked ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'} disabled:opacity-50`}>
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} /><span>{likes} Thích</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"><MessageCircle size={18} /><span>{post.so_binh_luan || 0} Bình luận</span></button>
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"><Share size={18} /><span>Chia sẻ</span></button>
        </div>
      </div>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
                    <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                {post.noi_dung && <p className="text-gray-800 mb-4">{post.noi_dung}</p>}
                {/* ✅ SỬ DỤNG EventCard từ file riêng */}
                <EventCard 
                  event={post.su_kien} 
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onRefresh={fetchPosts}
                />
              </div>
            ) : (
              <PostCard post={post} currentUserId={currentUserId} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;