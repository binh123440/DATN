import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, Edit, Video, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const conversations = [
    {
      id: 1,
      user: {
        name: 'Chân mệnh THIÊN TỬ',
        avatar: 'https://i.pravatar.cc/150?img=11',
        isOnline: true
      },
      lastMessage: 'Mua vl',
      sender: '黃 俊杰',
      time: '33m',
      isUnread: true
    },
    {
      id: 2,
      user: {
        name: 'Nhật Đăng',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isOnline: false
      },
      lastMessage: 'You sent an attachment',
      time: '1h',
      isUnread: false
    },
    {
      id: 3,
      user: {
        name: 'Hoàng Nguyên',
        avatar: 'https://i.pravatar.cc/150?img=13',
        isOnline: false
      },
      lastMessage: 'You sent an attachment',
      time: '1h',
      isUnread: false
    },
    {
      id: 4,
      user: {
        name: 'SHOE BOX THAT KINDA SMELL...',
        avatar: 'https://i.pravatar.cc/150?img=14',
        isOnline: false
      },
      lastMessage: "Gigi: Teto isn't coming to Fortnite......",
      time: '6h',
      isUnread: false
    },
    {
      id: 5,
      user: {
        name: 'Huy',
        avatar: 'https://i.pravatar.cc/150?img=15',
        isOnline: false
      },
      lastMessage: 'You sent an attachment',
      time: '12h',
      isUnread: false
    },
    {
      id: 6,
      user: {
        name: 'Nhật Minh',
        avatar: 'https://i.pravatar.cc/150?img=16',
        isOnline: false
      },
      lastMessage: 'You: đa oke anh, em cảm ơn a !',
      time: '16h',
      isUnread: false
    },
    {
      id: 7,
      user: {
        name: 'Phan Huy',
        avatar: 'https://i.pravatar.cc/150?img=17',
        isOnline: false
      },
      lastMessage: 'You sent an attachment',
      time: '1d',
      isUnread: false
    },
    {
      id: 8,
      user: {
        name: 'Bảo Khánh',
        avatar: 'https://i.pravatar.cc/150?img=18',
        isOnline: false
      },
      lastMessage: 'Reacted with ❤️ to your message',
      time: '1d',
      isUnread: false
    }
  ];

  const unreadCount = conversations.filter((c) => c.isUnread).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
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
          {/* Header */}
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Messenger"
                className="w-full bg-gray-100 text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>

            {/* Tabs */}
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

          {/* Conversations List */}
          <div className="max-h-96 overflow-y-auto">
            <div className="px-2 py-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
                    conversation.isUnread ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={conversation.user.avatar}
                      alt={conversation.user.name}
                      className="w-14 h-14 rounded-full"
                    />
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm truncate ${conversation.isUnread ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                        {conversation.user.name}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{conversation.time}</span>
                    </div>
                    <p className={`text-sm truncate ${conversation.isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'} mt-0.5`}>
                      {conversation.sender && <span>{conversation.sender}: </span>}
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {conversation.isUnread && (
                    <div className="ml-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                  )}

                  {/* Quick actions (show on hover) */}
                  {!conversation.isUnread && (
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-gray-200 rounded-full">
                        <Phone size={14} className="text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => {
                navigate('/tin-nhan');
                setIsOpen(false);
              }}
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
