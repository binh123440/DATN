import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Send, MoreVertical, Smile, Image as ImageIcon, Paperclip, FileText, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  layDanhSachCuocHoiThoai,
  layTinNhanTrongCuocHoiThoai,
  guiTinNhan
} from '../services/apiService';
import socketService from '../services/tinNhanService';
import PostModal from './PostModal';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';

// ✅ Token chuẩn cho share bài viết qua chat (phương án 1)
const SHARE_POST_TOKEN_REGEX = /\bUTEPOST:(\d+)\b/;

const extractSharedPostId = (text) => {
  if (!text) return null;
  const m = String(text).match(SHARE_POST_TOKEN_REGEX);
  return m ? parseInt(m[1], 10) : null;
};

const stripShareToken = (text) => {
  if (!text) return '';
  return String(text).replace(SHARE_POST_TOKEN_REGEX, '').trim();
};

// ✅ Switcher để PostModal render đúng loại (bài thường vs sự kiện)
const PostCardSwitcher = (props) => {
  const isEvent = !!props?.post?.su_kien;
  if (isEvent) return <EventPostCard {...props} />;
  return <PostCard {...props} />;
};

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ PostModal state (mở bài viết từ chat)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [modalPostId, setModalPostId] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  }, []);

  const currentUserId = useMemo(() => {
    const id = currentUser?.id;
    return id ? parseInt(id, 10) : null;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login', { replace: true });
    }
  }, [currentUserId, navigate]);

  useEffect(() => {
    socketService.connect();
    
    const checkInterval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
    }, 1000);

    fetchConversations();

    return () => {
      clearInterval(checkInterval);
      socketService.offNewMessage();
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === parseInt(conversationId));
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    socketService.onNewMessage((message) => {
      if (selectedConversation && message.id_cuoc_hoi_thoai === selectedConversation.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      fetchConversations();
    });

    socketService.onUserTyping(({ userId, conversationId }) => {
      if (selectedConversation?.id === conversationId && userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    });

    socketService.onUserStopTyping(({ userId, conversationId }) => {
      if (selectedConversation?.id === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await layDanhSachCuocHoiThoai();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Lỗi tải cuộc hội thoại:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    socketService.joinConversation(conversation.id);

    try {
      const response = await layTinNhanTrongCuocHoiThoai(conversation.id);
      setMessages(response.data.tin_nhans || []);
    } catch (error) {
      console.error('Lỗi tải tin nhắn:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const messageData = {
      id_cuoc_hoi_thoai: selectedConversation.id,
      noi_dung: messageInput.trim()
    };

    setSending(true);
    try {
      const response = await guiTinNhan(messageData);
      socketService.sendMessage(response.data);
      setMessageInput('');
      socketService.sendStopTyping(selectedConversation.id);
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      alert('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation) return;
    socketService.sendTyping(selectedConversation.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendStopTyping(selectedConversation.id);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationName = (conversation) => {
    if (conversation.loai === 'nhom') {
      return conversation.ten_hoi_thoai;
    }
    const otherMember = conversation.thanh_vien?.find(tv => tv.nguoi_dung.id !== currentUserId);
    return otherMember?.nguoi_dung.ho_ten || 'Người dùng';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.loai === 'nhom') {
      return conversation.ten_hoi_thoai[0].toUpperCase();
    }
    const otherMember = conversation.thanh_vien?.find(tv => tv.nguoi_dung.id !== currentUserId);
    return otherMember?.nguoi_dung.ho_ten?.[0]?.toUpperCase() || 'U';
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPostFromChat = (postId) => {
    if (!postId) return;
    setModalPostId(postId);
    setIsPostModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* ✅ Hiển thị trạng thái kết nối */}
      {!socketConnected && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center z-50">
          ⚠️ Đang kết nối lại với máy chủ...
        </div>
      )}

      {/* Sidebar - Danh sách cuộc hội thoại */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Tin nhắn</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {searchTerm ? 'Không tìm thấy' : 'Chưa có cuộc hội thoại'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMessage = conv.tin_nhan?.[0];
              // console.log('Conversation:', conv);
              // console.log('Last Message:', lastMessage.nguoi_gui.id);
              // console.log('Current User ID:', currentUserId);
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0 shadow-sm">
                    {getConversationAvatar(conv)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate text-sm">
                      {getConversationName(conv)}
                    </h4>
                    {lastMessage && (
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {lastMessage.nguoi_gui.id === currentUserId ? 'Bạn: ' : ''}
                        {lastMessage.noi_dung}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Khu vực chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Header chat */}
            <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-semibold shadow-sm">
                  {getConversationAvatar(selectedConversation)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {getConversationName(selectedConversation)}
                  </h3>
                  {typingUsers.size > 0 && (
                    <p className="text-xs text-blue-600">Đang nhập...</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.nguoi_gui?.id === currentUserId || msg.id_nguoi_gui === currentUserId;

                const sharedPostId = extractSharedPostId(msg.noi_dung);
                const noteText = stripShareToken(msg.noi_dung);

                return (
                  <div
                    key={msg.id || index}
                    className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwnMessage && (
                        <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {msg.nguoi_gui?.ho_ten?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        {!isOwnMessage && selectedConversation?.loai === 'nhom' && (
                          <p className="text-xs text-gray-500 mb-1 px-3">
                            {msg.nguoi_gui?.ho_ten}
                          </p>
                        )}

                        {/* ✅ Nếu là tin nhắn share bài viết (UTEPOST:<id>) thì render card */}
                        {sharedPostId ? (
                          <div
                            className={[
                              'rounded-2xl shadow-sm px-4 py-3',
                              'bg-white text-gray-800 border border-gray-200',
                              isOwnMessage ? 'ring-1 ring-blue-200' : ''
                            ].join(' ')}
                          >
                            {noteText && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed mb-2">
                                {noteText}
                              </p>
                            )}

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={16} className="text-blue-600 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-gray-800 truncate">
                                      Bài viết được chia sẻ
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      ID: {sharedPostId}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openPostFromChat(sharedPostId)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                  title="Xem bài viết"
                                >
                                  <ExternalLink size={14} />
                                  Xem
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // ...existing code... (tin nhắn text bình thường)
                          <div
                            className={`px-4 py-2 rounded-2xl shadow-sm ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-lg'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.noi_dung}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-1.5 px-2">
                          {new Date(msg.thoi_gian_gui).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Nhập tin nhắn */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-3">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Aa"
                    className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none max-h-24"
                    rows="1"
                  />
                  <button
                    type="button"
                    className="absolute right-3 bottom-2 p-1 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Smile size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-600">Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ PostModal để xem bài viết ngay trong trang Chat */}
      <PostModal
        postId={modalPostId}
        commentId={null}
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        currentUser={currentUser}
        PostCardComponent={PostCardSwitcher}
      />
    </div>
  );
};

export default Chat;
