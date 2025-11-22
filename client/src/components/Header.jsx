import React, { useState } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';
import UserMenuDropdown from './UserMenuDropdown';

const Header = ({ onToggleSidebar, isSidebarOpen, currentUser }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsMessageOpen(false); // Close message dropdown
    setIsUserMenuOpen(false); // Close user menu
  };

  const toggleMessage = () => {
    setIsMessageOpen(!isMessageOpen);
    setIsNotificationOpen(false); // Close notification dropdown
    setIsUserMenuOpen(false); // Close user menu
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsNotificationOpen(false); // Close notification dropdown
    setIsMessageOpen(false); // Close message dropdown
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg fixed top-0 left-0 right-0 z-20">
      <div className="px-2 sm:px-4 xl:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Mobile Menu & Logo */}
          <div className="flex items-center">
            <div className="xl:hidden">
              <button 
                onClick={handleMobileMenuToggle}
                className="p-2 rounded-md text-white hover:bg-blue-700 transition-colors"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                  />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                U
              </div>
              <h1 className="text-xl font-bold hidden md:block">UTE Social</h1>
            </div>
          </div>

          {/* Center Section: Search Bar (for md and up) */}
          <div className="w-full max-w-2xl mx-auto md:block px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full bg-white text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Right Section: Icons */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-4">
            {/* ✅ Thông báo */}
            <NotificationDropdown />

            {/* ✅ Tin nhắn */}
            <MessageDropdown />

            {/* ✅ User Menu */}
            <UserMenuDropdown currentUser={currentUser} />
          </div>
        </div>

        {/* Mobile Search (hidden on md and up) */}
        {/* <div className="block md:hidden mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-white text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div> */}
      </div>
    </header>
  );
};

export default Header;