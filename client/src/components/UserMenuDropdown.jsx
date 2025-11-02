import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';

const UserMenuDropdown = ({ isOpen, onClose, currentUser }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    // Xóa thông tin user khỏi localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Chuyển hướng về trang đăng nhập
    navigate('/login');
    onClose();
  };

  if (!isOpen) return null;

  const user = currentUser || {
    name: 'Hà Bình',
    avatar: 'https://i.pravatar.cc/150?img=33',
    email: 'lehabinh@student.ute.edu.vn'
  };

  const menuItems = [
    {
      icon: User,
      label: 'Trang cá nhân',
      onClick: () => {
        navigate('/ca-nhan');
        onClose();
      }
    },
    {
      icon: Settings,
      label: 'Cài đặt',
      onClick: () => {
        alert('Tính năng đang phát triển');
        onClose();
      }
    },
    {
      icon: HelpCircle,
      label: 'Trợ giúp',
      onClick: () => {
        alert('Tính năng đang phát triển');
        onClose();
      }
    },
    {
      icon: LogOut,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true
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
      <div 
        ref={dropdownRef}
        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
      >
        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">Sinh viên</p>
        </div>

        {/* Menu items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors ${
                item.danger 
                  ? 'hover:bg-red-50 text-red-600' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserMenuDropdown;
