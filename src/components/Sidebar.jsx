import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageCircle, 
  Bell, 
  Gift, 
  Settings,
  User,
  Wifi
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match transition duration
  };

  const menuItems = [
    { icon: Home, label: 'Trang chủ', badge: null, path: '/' },
    { icon: Calendar, label: 'Sự kiện', badge: 8, path: '/events' },
    { icon: Users, label: 'Nhóm', badge: 6, path: '/groups' },
    { icon: MessageCircle, label: 'Tin nhắn', badge: 6, path: '/chat' },
    { icon: Wifi, label: 'Nostr Relay', badge: null, path: '/nostr' },
    { icon: Gift, label: 'Điểm thưởng', badge: null, path: '/rewards' },
    { icon: Bell, label: 'Thông báo', badge: 6, path: '/notifications' },
    { icon: Settings, label: 'Cài đặt', badge: null, path: '/settings' }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed left-0 top-16 bottom-0 z-10 overflow-y-auto xl:block hidden custom-scrollbar">
        {/* Navigation Menu */}
        <nav className="p-3 flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    location.pathname === item.path 
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="xl:hidden">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${
              isAnimating ? 'bg-transparent' : 'bg-opacity-0'
            }`}
            onClick={handleClose}
          ></div>
          
          {/* Mobile Sidebar */}
          <div className={`fixed left-0 top-0 bottom-0 w-64 bg-white bg-opacity-90 backdrop-blur-md shadow-xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out custom-scrollbar-blue ${
            isAnimating ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Header Space */}
            <div className="h-16 bg-blue-600 bg-opacity-95 flex items-center px-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                  U
                </div>
                <h1 className="text-xl font-bold text-white">UTE Social</h1>
              </div>
            </div>
            
            <nav className="p-3 flex-1">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      onClick={handleClose}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        location.pathname === item.path 
                          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      <item.icon size={20} className="mr-3" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* RightSidebar Content for Mobile */}
            <div className="p-3 space-y-4 border-t border-gray-200">
              {/* Điểm thưởng Widget */}
              <div className="bg-gray-50 bg-opacity-80 rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎯</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Điểm thưởng của bạn</span>
                </div>
                
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    1,250
                  </div>
                  <div className="text-xs text-gray-500">điểm hiện có</div>
                </div>

                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-2 py-2 text-center">
                    <span className="text-green-600 text-xs font-medium">☕ Có thể mua 83 ly cà phê</span>
                  </div>
                  
                  <div className="text-center py-1">
                    <p className="text-xs text-gray-600 mb-1">Mức độ tích cực</p>
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                      <span className="text-orange-500 font-bold text-xs">Xuất sắc</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hoạt động gần đây */}
              <div className="bg-gray-50 bg-opacity-80 rounded-xl p-3 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔥</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">Hoạt động gần đây</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500 text-sm">🔥</span>
                      <div>
                        <span className="text-xs text-gray-700">Hội thảo AI trong giáo dục</span>
                        <p className="text-xs text-gray-500">2 ngày trước</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold text-xs">+50</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500 text-sm">🔥</span>
                      <div>
                        <span className="text-xs text-gray-700">Workshop định hướng du học</span>
                        <p className="text-xs text-gray-500">3 ngày trước</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold text-xs">+50</span>
                  </div>
                </div>
                
                <button className="w-full mt-3 text-blue-500 text-center py-2 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium">
                  Xem lịch sử đầy đủ
                </button>
              </div>

              {/* Sự kiện sắp tới */}
              <div className="bg-gray-50 bg-opacity-80 rounded-xl p-3 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Sự kiện sắp tới</h3>
                
                <div className="space-y-2">
                  <div className="border-l-4 border-blue-500 pl-2 py-1">
                    <p className="text-xs font-medium text-gray-800">Hội thảo AI trong giáo dục</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <span>📅</span>
                      <span>26/08/2025 - 15:00</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-orange-600 mt-1">
                      <span>🎁</span>
                      <span>+60 điểm</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                        Đã đăng ký
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-2 py-1">
                    <p className="text-xs font-medium text-gray-800">Workshop định hướng du học Nhật Bản</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <span>📅</span>
                      <span>28/08/2025 - 14:00</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-orange-600 mt-1">
                      <span>🎁</span>
                      <span>+60 điểm</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                        Đăng ký
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;