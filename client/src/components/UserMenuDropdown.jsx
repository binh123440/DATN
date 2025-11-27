import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { authService } from '../services/authService';

const UserMenuDropdown = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(currentUser || null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setUserInfo(currentUser);
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (error) {
        console.error('Lỗi parse user:', error);
      }
    }
  }, [currentUser]);

  const userId = userInfo?.id || currentUser?.id || localStorage.getItem('userId');
  const userName = userInfo?.ho_ten || userInfo?.name || 'Người dùng';
  const userEmail = userInfo?.email || 'user@example.com';

  const getInitials = () =>
    userName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const handleLogout = () => {
    if (window.confirm('Bạn chắc chắn muốn đăng xuất?')) {
      authService.dangXuat();
      navigate('/login');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-blue-700 transition-colors"
      >
        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold">
          {getInitials()}
        </div>
        <span className="hidden md:block font-medium">{userName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900">{userName}</p>
            <p className="text-sm text-gray-500">{userEmail}</p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate(userId ? `/profile/${userId}` : '/');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={20} />
              <span>Trang cá nhân</span>
            </button>

            <button
              onClick={() => {
                alert('Tính năng đang phát triển');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={20} />
              <span>Cài đặt</span>
            </button>

            <button
              onClick={() => {
                alert('Tính năng đang phát triển');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle size={20} />
              <span>Trợ giúp</span>
            </button>

            <div className="border-t border-gray-100 my-2" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center space-x-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenuDropdown;
