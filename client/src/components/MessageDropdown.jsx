import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MoreHorizontal, Edit, Video, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { layDanhSachCuocHoiThoai } from '../services/apiService';

const STORAGE_KEY_LAST_SEEN = 'chat:lastSeenByConversation';

const loadLastSeenMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SEEN);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveLastSeenMap = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SEEN, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
};

const toMs = (value) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const MessageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenMap, setLastSeenMap] = useState(() => loadLastSeenMap());
  const dropdownRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  }, []);

  const isConversationUnread = (conversation) => {
    const uid = currentUser?.id ? parseInt(currentUser.id, 10) : null;
    if (!uid) return false;

    const lastMessage = conversation?.tin_nhan?.[0];
    if (!lastMessage) return false;

    // Tin nhắn do mình gửi thì không tính là chưa đọc
    if (lastMessage?.nguoi_gui?.id === uid) return false;

    const convId = String(conversation?.id ?? '');
    const lastSeen = toMs(lastSeenMap?.[convId]);
    const lastMsgTime = toMs(lastMessage?.thoi_gian_gui);

    // Nếu không có lastSeen => xem như chưa đọc
    if (!lastSeen || !lastMsgTime) return true;
    return lastMsgTime > lastSeen;
  };

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Mở dropdown = xem hết: cập nhật lastSeen cho tất cả cuộc hội thoại theo tin nhắn mới nhất
  const markAllAsSeen = (convs = []) => {
    const list = Array.isArray(convs) ? convs : [];
    const nowIso = new Date().toISOString();

    setLastSeenMap((prev) => {
      const next = { ...(prev || {}) };

      for (const conv of list) {
        const convId = String(conv?.id ?? '');
        if (!convId) continue;

        const lastMessage = conv?.tin_nhan?.[0];
        next[convId] = lastMessage?.thoi_gian_gui || nowIso;
      }

      saveLastSeenMap(next);
      return next;
    });

    // badge về 0 ngay, tránh nhấp nháy trong lúc chờ state lastSeenMap cập nhật
    setUnreadCount(0);
  };

  const fetchConversations = async ({ silent = false, markSeen = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      const res = await layDanhSachCuocHoiThoai();
      // API trả về { success: true, data: [...] }
      const data = res?.success ? res.data : (res?.data ?? []);
      if (!isMountedRef.current) return;

      const list = data || [];

      if (!silent) setConversations(list);

      // ✅ Nếu đang mở dropdown thì coi như đã xem hết ngay
      if (markSeen) {
        markAllAsSeen(list);
      } else {
        computeUnread(list);
      }
    } catch (err) {
      console.error('Lỗi lấy cuộc hội thoại:', err);
      if (!isMountedRef.current) return;

      if (!silent) {
        setConversations([]);
        setUnreadCount(0);
      }
    } finally {
      if (!silent && isMountedRef.current) setLoading(false);
    }
  };

  // Polling: cập nhật badge tin nhắn mỗi 5 giây
  useEffect(() => {
    // ✅ mở dropdown = xem hết => markSeen: true
    fetchConversations({ silent: !isOpen, markSeen: isOpen });

    const intervalId = setInterval(() => {
      fetchConversations({ silent: !isOpen, markSeen: isOpen });
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Khi lastSeenMap đổi (do mở dropdown hoặc click) => cập nhật badge lại (an toàn)
  useEffect(() => {
    computeUnread(conversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSeenMap]);

  // Heuristic: nếu tin nhắn cuối cùng được gửi bởi người khác => có khả năng chưa đọc
  const computeUnread = (convs = []) => {
    const count = (Array.isArray(convs) ? convs : []).reduce((acc, c) => {
      return isConversationUnread(c) ? acc + 1 : acc;
    }, 0);
    setUnreadCount(count);
  };

  const handleOpenConversation = (conv) => {
    // Đánh dấu đã xem ngay khi click để badge cập nhật liền
    const convId = String(conv?.id ?? '');
    const lastMessage = conv?.tin_nhan?.[0];
    const seenValue = lastMessage?.thoi_gian_gui || new Date().toISOString();

    if (convId) {
      setLastSeenMap((prev) => {
        const next = { ...(prev || {}), [convId]: seenValue };
        saveLastSeenMap(next);
        return next;
      });
    }

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
        <div className="absolute right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] max-w-sm sm:w-96 bg-white rounded-lg shadow-2xl z-40 overflow-hidden">
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

          <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
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
                  const isUnread = isConversationUnread(conversation);
                  const otherMember = conversation.thanh_vien?.find(tv => tv.nguoi_dung && tv.nguoi_dung.id !== (currentUser?.id ?? null));
                  const displayUser = conversation.loai === 'nhom'
                    ? { name: conversation.ten_hoi_thoai }
                    : (otherMember?.nguoi_dung || { ho_ten: 'Người dùng' });

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleOpenConversation(conversation)}
                      className={`w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        {displayUser?.anh_dai_dien_url ? (
                          <img
                            src={displayUser.anh_dai_dien_url}
                            alt={displayUser.ho_ten || displayUser.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                            {(displayUser.ho_ten || displayUser.name || 'U')[0]?.toUpperCase()}
                          </div>
                        )}
                        {conversation.loai === 'nhom' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                            {conversation.loai === 'nhom' ? conversation.ten_hoi_thoai : (displayUser.ho_ten || displayUser.name)}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:inline">
                            {lastMessage ? new Date(lastMessage.thoi_gian_gui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'} mt-0.5`}>
                          {lastMessage
                            ? (lastMessage.nguoi_gui?.id === currentUser?.id ? 'Bạn: ' : '') + lastMessage.noi_dung
                            : 'Không có tin nhắn'}
                        </p>
                      </div>

                      {isUnread && (
                        <div className="flex-shrink-0">
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
