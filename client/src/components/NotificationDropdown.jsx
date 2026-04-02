import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  layDanhSachThongBao, 
  danhDauDaDoc, 
  danhDauTatCaDaDoc, 
  xoaThongBao 
} from '../services/apiService';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click bên ngoài
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
    if (isOpen) setIsMounted(true);
    else if (isMounted) {
      const t = setTimeout(() => setIsMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen, isMounted]);

  // Load thông báo
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await layDanhSachThongBao(1, 10);
      if (response.success) {
        setNotifications(response.data.thong_baos || []);
        setUnreadCount(response.data.so_chua_doc || 0);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh mỗi 30 giây
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  // Xử lý khi click vào thông báo
  const handleNotificationClick = async (notif) => {
    try {
      // Đánh dấu đã đọc nếu chưa đọc
      if (!notif.da_doc) {
        await danhDauDaDoc(notif.id);
        loadNotifications();
      }

      // Đóng dropdown
      setIsOpen(false);

      // Điều hướng dựa vào loại mục tiêu
      if (notif.loai_muc_tieu === 'bai_viet' && notif.id_muc_tieu) {
        // Điều hướng đến Feed với postId trong URL để mở modal
        navigate(`/?postId=${notif.id_muc_tieu}`);
      } else if (notif.loai_muc_tieu === 'su_kien' && notif.id_muc_tieu) {
        // Điều hướng đến trang Events với eventId trong URL để mở modal
        navigate(`/events?eventId=${notif.id_muc_tieu}`);
      } else if (notif.link) {
        // Fallback: sử dụng link có sẵn
        navigate(notif.link);
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thông báo:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await danhDauTatCaDaDoc();
      loadNotifications();
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await xoaThongBao(id);
      loadNotifications();
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
    }
  };

  const getNotificationIcon = (loai) => {
    const icons = {
      like_bai_viet: '❤️',
      binh_luan_bai_viet: '💬',
      tra_loi_binh_luan: '↩️',
      su_kien_moi: '📅',
      su_kien_sap_dien_ra: '⏰',
      duyet_bai_viet: '✅',
      tu_choi_bai_viet: '❌',
      diem_danh_thanh_cong: '✔️',
      nhan_diem_thuong: '🎁',
      tin_nhan_moi: '💌',
      he_thong: '🔔'
    };
    return icons[loai] || '🔔';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isMounted && (
        <div className={`absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col ${isOpen ? 'animate-dropdown-in' : 'animate-dropdown-out'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <Check size={16} />
                <span>Đánh dấu tất cả đã đọc</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notif.da_doc ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg">
                          {notif.nguoi_hanh_dong ? (
                            <span className="text-white text-sm font-semibold">
                              {notif.nguoi_hanh_dong.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-xl">{getNotificationIcon(notif.loai)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="text-gray-700">{notif.noi_dung}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notif.ngay_tao)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-2">
                            {!notif.da_doc && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => handleDelete(notif.id, e)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button 
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
