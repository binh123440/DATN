import React, { useState } from 'react';
import {QRCode} from 'react-qr-code';
import { Home, Calendar, MapPin, Users, Gift, QrCode as QrCodeIcon, Heart, MessageCircle, Share, ImagePlus, SmilePlus, X } from 'lucide-react';

const PostComposer = ({ onCreatePost }) => {
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState('');
  const [eventDetails, setEventDetails] = useState({
    name: '',
    location: '',
    date: '',
    time: '',
    maxParticipants: '',
    points: ''
  });

  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeType === 'event') {
      // Logic to handle event creation
      console.log({ type: 'event', content, ...eventDetails });
      // onCreatePost({ type: 'event', content, ...eventDetails, author: 'Lê Hà Bình', timestamp: new Date().toLocaleString('vi-VN') });
    } else if (content.trim()) {
      // Logic to handle regular post creation
      onCreatePost({
        type: activeType || 'post',
        content,
        author: 'Lê Hà Bình',
        timestamp: new Date().toLocaleString('vi-VN')
      });
    }
    setContent('');
    setActiveType(null);
    setEventDetails({ name: '', location: '', date: '', time: '', maxParticipants: '', points: '' });
  };

  const actionButtons = [
    {
      type: 'image',
      label: 'Ảnh/Video',
      Icon: ImagePlus,
      activeClasses: 'text-purple-600 bg-purple-100',
      hoverClasses: 'hover:bg-purple-50'
    },
    {
      type: 'event',
      label: 'Sự kiện',
      Icon: Calendar,
      activeClasses: 'text-cyan-600 bg-cyan-100',
      hoverClasses: 'hover:bg-cyan-50'
    },
    {
      type: 'feeling',
      label: 'Cảm xúc',
      Icon: SmilePlus,
      activeClasses: 'text-yellow-600 bg-yellow-100',
      hoverClasses: 'hover:bg-yellow-50'
    }
  ];

  const isSubmitDisabled = activeType === 'event' 
    ? !eventDetails.name || !eventDetails.location || !eventDetails.date
    : !content.trim();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          SV
        </div>
        <input
          type="text"
          placeholder={activeType === 'event' ? "Mô tả về sự kiện của bạn..." : "Bạn đang nghĩ gì ?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all"
        />
      </div>

      {activeType === 'event' && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4">
            <Calendar size={18} className="mr-2" />
            Tạo sự kiện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tên sự kiện</label>
              <input type="text" name="name" value={eventDetails.name} onChange={handleEventDetailChange} placeholder="Ví dụ: Hội thảo AI trong giáo dục" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Địa điểm</label>
              <input type="text" name="location" value={eventDetails.location} onChange={handleEventDetailChange} placeholder="Ví dụ: Hội trường A, Tòa nhà B" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày</label>
              <input type="text" name="date" value={eventDetails.date} onChange={handleEventDetailChange} placeholder="mm/dd/yyyy" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Giờ</label>
              <input type="text" name="time" value={eventDetails.time} onChange={handleEventDetailChange} placeholder="--:-- --" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Số người tối đa</label>
              <input type="number" name="maxParticipants" value={eventDetails.maxParticipants} onChange={handleEventDetailChange} placeholder="100" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Điểm thưởng</label>
              <input type="number" name="points" value={eventDetails.points} onChange={handleEventDetailChange} placeholder="50" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          {actionButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => setActiveType(activeType === button.type ? null : button.type)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                activeType === button.type
                  ? button.activeClasses
                  : `text-gray-600 ${button.hoverClasses}`
              }`}
            >
              <button.Icon size={20} />
              <span>{button.label}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleSubmit}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitDisabled}
        >
          {activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
};

const EventCard = ({ event }) => {
  // State để quản lý việc hiển thị modal QR code
  const [showQrModal, setShowQrModal] = useState(false);

  // Dữ liệu để mã hóa vào QR code.
  // Trong thực tế, đây nên là một chuỗi JSON chứa ID sự kiện và một mã bí mật duy nhất từ backend.
  const qrValue = JSON.stringify({ 
    eventId: event.id || "workshop-ai-2025", // Dùng event.id nếu có, nếu không thì dùng placeholder
    secret: "a-very-secret-code-from-backend-for-this-specific-event" // Mã này phải là duy nhất cho mỗi sự kiện
  });

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {event.title}
          </h3>
          <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
            ✓ Đã đăng ký
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar size={16} className="text-blue-600" />
            </div>
            <span className="text-sm">{event.date}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <MapPin size={16} className="text-purple-600" />
            </div>
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Users size={16} className="text-green-600" />
            </div>
            <span className="text-sm">{event.participants}</span>
          </div>
          <div className="flex items-center text-orange-600">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Gift size={16} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium">{event.points}</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {/* Nút bấm để mở Modal QR */}
          <button 
            onClick={() => setShowQrModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium"
          >
            <QrCodeIcon size={18} />
            <span>Xem mã QR điểm danh</span>
          </button>
          <button className="px-4 py-3 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium">
            33 chỗ còn lại
          </button>
        </div>
      </div>

      {/* Modal hiển thị QR Code - Thiết kế lại theo dạng "Thẻ Sinh Viên Kỹ Thuật Số" */}
      {showQrModal && (
        // Lớp phủ nền mờ, khi click sẽ đóng modal
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          {/* Hộp thoại modal, ngăn sự kiện click lan ra lớp phủ */}
          <div 
            className="bg-gray-50 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng modal được thiết kế lại */}
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:text-red-500 hover:scale-110 transition-transform z-10"
            >
              <X size={24} />
            </button>

            {/* Phần header của thẻ */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-24 rounded-t-2xl relative">
                {/* Placeholder cho ảnh thẻ sinh viên */}
                {/* Trong thực tế, src sẽ là dữ liệu động từ thông tin người dùng */}
                <img 
                    src="https://i.pravatar.cc/150?u=lehabinh" // Placeholder image
                    alt="Ảnh đại diện"
                    className="w-24 h-24 rounded-full border-4 border-white absolute -bottom-12 left-1/2 -translate-x-1/2 shadow-lg"
                />
            </div>

            {/* Phần thân thẻ chứa thông tin */}
            <div className="pt-16 pb-8 px-6 text-center">
                {/* Thông tin sinh viên - Dữ liệu này sẽ được lấy từ state hoặc props */}
                <h2 className="text-2xl font-bold text-gray-800">Lê Hà Bình</h2>
                <p className="text-gray-500 font-mono">21115053120105</p>

                <div className="mt-6 mb-6">
                    {/* Vùng hiển thị QR Code */}
                    <div className="p-2 bg-white border-2 border-gray-200 rounded-lg inline-block shadow-inner">
                        <QRCode value={qrValue} size={220} />
                    </div>
                </div>
                
                <p className="text-sm text-gray-600">Đưa mã này cho người tổ chức để điểm danh sự kiện:</p>
                <p className="mt-1 text-sm font-semibold text-blue-600 break-all">{event.title}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 50));

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{post.author}</h4>
          <p className="text-sm text-gray-500">{post.timestamp}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-2">
          <span className="text-lg">⋯</span>
        </button>
      </div>
      
      <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg font-medium transition-colors duration-200 ${
              liked 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likes} Thích</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
            <MessageCircle size={18} />
            <span>Bình luận</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200">
            <Share size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      type: 'post',
      author: 'Lê Hà Bình',
      content: 'addldf',
      timestamp: 'Vừa xong',
      likes: 0,
      comments: 0,
      shares: 0
    },
    {
      id: 2,
      type: 'post',  
      author: 'tyhhfghfgdfgdf',
      content: 'Chưa có bình luận nào.',
      timestamp: '2 giờ trước'
    }
  ]);

  const sampleEvent = {
    title: 'Workshop: AI trong giáo dục hiện đại',
    date: '25/08/2025 - 14:00',
    location: 'Hội trường - Khu B',
    participants: '67/100 Người',
    points: '80 điểm thưởng'
  };

  const handleCreatePost = (newPost) => {
    setPosts([{ ...newPost, id: Date.now(), likes: 0, comments: 0, shares: 0 }, ...posts]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Message */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-400 bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg">
             <Home className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-2xl font-bold">Chào mừng !</h2>
            <p className="text-cyan-100 text-sm">Kết nối và chia sẻ với cộng đồng của UTE</p>
          </div>
        </div>
        <div className="mt-5 flex items-center text-cyan-100 text-sm">
          <svg className="w-4 h-4 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          <span>Hôm nay: 3 sự kiện mới - 12 bài viết từ bạn bè</span>
        </div>
      </div>

      {/* Post Composer */}
      <PostComposer onCreatePost={handleCreatePost} />

      {/* Sample Event */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              LH
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Lê Hà Bình</h4>
              <p className="text-sm text-gray-500">2 giờ trước</p>
            </div>
          </div>
          
          <p className="text-gray-800 mb-4">
            Chào mọi người! Hôm nay mình muốn chia sẻ một workshop thú vị về AI trong giáo dục. 
            Rất mong được gặp các bạn tại đây! 😊
          </p>
          
          <EventCard event={sampleEvent} />
        </div>
      </div>

      {/* Posts */}
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Feed;