import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MoreHorizontal, Edit, Video, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { layDanhSachCuocHoiThoai } from '../services/apiService';

const MessageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) fetchConversations();
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await layDanhSachCuocHoiThoai();
      // API trả về { success: true, data: [...] }
      const data = res?.success ? res.data : (res?.data ?? []);
      setConversations(data || []);
      computeUnread(data || []);
    } catch (err) {
      console.error('Lỗi lấy cuộc hội thoại:', err);
      setConversations([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Heuristic: nếu tin nhắn cuối cùng được gửi bởi người khác => có khả năng chưa đọc
  const computeUnread = (convs = []) => {
    const uid = currentUser?.id ? parseInt(currentUser.id, 10) : null;
    if (!uid) {
      setUnreadCount(0);
      return;
    }
    const count = convs.reduce((acc, c) => {
      const last = c.tin_nhan?.[0];
      if (last && last.nguoi_gui && last.nguoi_gui.id !== uid) return acc + 1;
      return acc;
    }, 0);
    setUnreadCount(count);
  };

  const handleOpenConversation = (conv) => {
    setIsOpen(false);
    navigate(`/chat?conversation=${conv.id}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
        aria-label="Open messages"
      >
        <MessageCircle size={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-40 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreHorizontal size={20} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Video size={20} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Edit size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Messenger"
                className="w-full bg-gray-100 text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                disabled
              />
            </div>

            <div className="flex space-x-2 mt-3">
              <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                All
              </button>
              <button className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-full text-sm font-semibold transition-colors">
                Unread
              </button>
              <button className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-full text-sm font-semibold transition-colors">
                Groups
              </button>
              <button className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-full text-sm font-semibold transition-colors">
                Communities
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="px-2 py-1">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">Chưa có cuộc hội thoại</div>
              ) : (
                conversations.map((conversation) => {
                  const lastMessage = conversation.tin_nhan?.[0];
                  const isUnread = lastMessage && lastMessage.nguoi_gui?.id !== (currentUser?.id ?? null);
                  const otherMember = conversation.thanh_vien?.find(tv => tv.nguoi_dung && tv.nguoi_dung.id !== (currentUser?.id ?? null));
                  const displayUser = conversation.loai === 'nhom' ? { name: conversation.ten_hoi_thoai } : (otherMember?.nguoi_dung || { ho_ten: 'Người dùng' });

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleOpenConversation(conversation)}
                      className={`flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        {displayUser?.anh_dai_dien_url ? (
                          <img src={displayUser.anh_dai_dien_url} alt={displayUser.ho_ten || displayUser.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                            {(displayUser.ho_ten || displayUser.name || 'U')[0]?.toUpperCase()}
                          </div>
                        )}
                        {conversation.loai === 'nhom' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="ml-3 flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                            {conversation.loai === 'nhom' ? conversation.ten_hoi_thoai : (displayUser.ho_ten || displayUser.name)}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {lastMessage ? new Date(lastMessage.thoi_gian_gui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'} mt-0.5`}>
                          {lastMessage ? (lastMessage.nguoi_gui?.id === currentUser?.id ? 'Bạn: ' : '') + lastMessage.noi_dung : 'Không có tin nhắn'}
                        </p>
                      </div>

                      {isUnread && (
                        <div className="ml-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => { navigate('/chat'); setIsOpen(false); }}
              className="w-full py-2 text-center text-blue-600 hover:bg-gray-100 rounded-md text-sm font-semibold transition-colors"
            >
              Xem tất cả trong Messenger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDropdown;
