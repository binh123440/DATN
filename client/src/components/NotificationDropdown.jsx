import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const NotificationDropdown = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      user: {
        name: 'Lạc Đức Hậu',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      message: "You're featured on Lac Duc Hau's public weekly engagement list.",
      time: '3d',
      isRead: false
    },
    {
      id: 2,
      user: {
        name: 'Xuân Tình',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      message: 'mentioned you and others in a comment in Câu lạc bộ Valorant Đà Nẵng.',
      time: '1w',
      isRead: true
    },
    {
      id: 3,
      user: {
        name: 'Rin Obito',
        avatar: 'https://i.pravatar.cc/150?img=3'
      },
      message: 'and Lac Duc Hau mentioned you in their comments.',
      time: '1w',
      isRead: true
    },
    {
      id: 4,
      user: {
        name: 'Gumball cầm fact',
        avatar: 'https://i.pravatar.cc/150?img=4',
        isPage: true
      },
      message: 'a Page that you recently viewed, invited you to join their public group Con...',
      time: '1w',
      isRead: false,
      hasActions: true
    },
    {
      id: 5,
      user: {
        name: 'Alex Nguyen',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      message: 'mentioned you and others in a comment in Zố đây mà chill.',
      time: '1w',
      isRead: false
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose}
      ></div>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-40 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
              All
            </button>
            <button className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-full text-sm font-semibold transition-colors">
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          <div className="px-2 py-1">
            <p className="px-2 py-2 text-sm font-semibold text-gray-600">Earlier</p>
            
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={notification.user.avatar}
                    alt={notification.user.name}
                    className="w-14 h-14 rounded-full"
                  />
                  {notification.user.isPage && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">📄</span>
                    </div>
                  )}
                  {!notification.isRead && !notification.user.isPage && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Content */}
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{notification.user.name}</span>{' '}
                    {notification.message}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">{notification.time}</p>
                  
                  {/* Action Buttons */}
                  {notification.hasActions && (
                    <div className="flex space-x-2 mt-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md transition-colors">
                        Join
                      </button>
                      <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold py-2 rounded-md transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="ml-2 mt-2">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200">
          <button className="w-full py-2 text-center text-blue-600 hover:bg-gray-100 rounded-md text-sm font-semibold transition-colors">
            See previous notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
