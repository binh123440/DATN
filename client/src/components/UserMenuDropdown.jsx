import React from 'react';
import { Settings, HelpCircle, Moon, MessageSquare, LogOut, ChevronRight } from 'lucide-react';

const UserMenuDropdown = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen) return null;

  const user = currentUser || {
    name: 'Hà Bình',
    avatar: 'https://i.pravatar.cc/150?img=33',
    email: 'lehabinh@student.ute.edu.vn'
  };

  const menuItems = [
    {
      icon: <Settings size={20} />,
      label: 'Settings & privacy',
      hasArrow: true,
      onClick: () => console.log('Settings')
    },
    {
      icon: <HelpCircle size={20} />,
      label: 'Help & support',
      hasArrow: true,
      onClick: () => console.log('Help')
    },
    {
      icon: <Moon size={20} />,
      label: 'Display & accessibility',
      hasArrow: true,
      onClick: () => console.log('Display')
    },
    {
      icon: <MessageSquare size={20} />,
      label: 'Give feedback',
      subtitle: 'CTRL B',
      onClick: () => console.log('Feedback')
    },
    {
      icon: <LogOut size={20} />,
      label: 'Log out',
      onClick: () => console.log('Logout')
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
        {/* User Profile Section */}
        <div className="p-4">
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* See all profiles button */}
          <button className="w-full mt-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="font-medium text-gray-700">See all profiles</span>
          </button>
        </div>

        <div className="border-t border-gray-200"></div>

        {/* Menu Items */}
        <div className="p-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 group-hover:bg-gray-300 transition-colors">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    {item.subtitle && (
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                    )}
                  </div>
                </div>
                {item.hasArrow && (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
              </button>
              
              {/* Separator before Log out */}
              {index === menuItems.length - 2 && (
                <div className="border-t border-gray-200 my-2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-1 text-xs text-gray-600">
            <a href="#" className="hover:underline">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:underline">Terms</a>
            <span>·</span>
            <a href="#" className="hover:underline">Advertising</a>
            <span>·</span>
            <a href="#" className="hover:underline">Ad choices</a>
            <span>·</span>
            <a href="#" className="hover:underline">Cookies</a>
            <span>·</span>
            <a href="#" className="hover:underline">More</a>
          </div>
          <p className="text-xs text-gray-500 mt-2">Meta © 2025</p>
        </div>
      </div>
    </>
  );
};

export default UserMenuDropdown;
