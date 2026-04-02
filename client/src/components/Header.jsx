import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import PostModal from './PostModal';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';
import { timKiemTongHop } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const Header = ({ onToggleSidebar, isSidebarOpen, currentUser }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [displayResults, setDisplayResults] = useState(null);
  const [isSearchMounted, setIsSearchMounted] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchResults) {
      setDisplayResults(searchResults);
      setIsSearchMounted(true);
    } else if (isSearchMounted) {
      const t = setTimeout(() => {
        setIsSearchMounted(false);
        setDisplayResults(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [searchResults, isSearchMounted]);
  const searchTimeout = useRef(null);
  const searchWrapperRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Modal bài viết/sự kiện: dùng PostModal có sẵn
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const isModalOpen = !!selectedPostId;

  const handleCloseModal = () => {
    setSelectedPostId(null);
    setSelectedCommentId(null);
  };

  const closeSearch = () => {
    setSearchResults(null);
    setSearchValue('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchValue.trim()) {
      setSearchResults(null);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await timKiemTongHop(searchValue);
        const payload = response?.data ?? response; // hỗ trợ cả hai dạng

        if (payload?.success) {
          setSearchResults(payload.data);
        } else if (payload && (payload.users || payload.groups || payload.posts || payload.events)) {
          // nếu API trả trực tiếp object { users, groups, ... }
          setSearchResults(payload);
        } else {
          setSearchResults(null);
        }
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [searchValue]);

  const handleMobileMenuToggle = () => {
    if (onToggleSidebar) onToggleSidebar();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) navigate(`/search/${searchValue}`);
  };

  const getBadge = (section, item) => {
    if (section === 'users') return item.ho_ten?.[0] || item.name?.[0] || 'U';
    if (section === 'groups') return item.ten_hoi_thoai?.[0] || 'N';
    if (section === 'events') return 'SK';
    return 'BV';
  };

  const getTitle = (section, item) => {
    switch (section) {
      case 'users':
        return item.ho_ten;
      case 'groups':
        return item.ten_hoi_thoai;
      case 'events':
        return item.ten_su_kien;
      default:
        return item.noi_dung?.slice(0, 80) + (item.noi_dung?.length > 80 ? '...' : '');
    }
  };

  const getSubtitle = (section, item) => {
    switch (section) {
      case 'users':
        return item.email;
      case 'groups':
        return `${item.so_thanh_vien || 0} thành viên`;
      case 'events':
        return item.thoi_gian_bat_dau ? new Date(item.thoi_gian_bat_dau).toLocaleString('vi-VN') : '';
      default:
        return item.nhom ? `Thuộc nhóm ${item.nhom.ten_hoi_thoai}` : 'Bài viết công khai';
    }
  };

  // ✅ users/groups -> route, posts/events -> modal
  const handleNavigateResult = (section, item) => {
    closeSearch();

    if (section === 'users') return navigate(`/profile/${item.id}`);
    if (section === 'groups') return navigate(`/nhom/${item.id}`);

    if (section === 'posts') return setSelectedPostId(item.id);
    if (section === 'events') {
      // timKiemTongHop trả về SuKien, cần id_bai_viet để mở bài viết sự kiện
      if (item.id_bai_viet) return setSelectedPostId(item.id_bai_viet);
      return navigate(`/su-kien?highlight=${item.id}`);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg fixed top-0 left-0 right-0 z-20">
      <div className="px-2 sm:px-4 xl:px-8">
        <div className="flex items-center justify-between h-16 flex-nowrap">
          {/* Left Section: Mobile Menu & Logo */}
          <div className="flex items-center flex-shrink-0">
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
          <div className="flex-1 min-w-0 max-w-2xl mx-auto px-2 sm:px-4" ref={searchWrapperRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Tìm người dùng, nhóm, bài viết, sự kiện..."
                className="w-full bg-white text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {searchLoading && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  Đang tìm...
                </span>
              )}
            </div>

            {(isSearchMounted && displayResults) && (
              <div className={`absolute mt-2 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-96 overflow-y-auto ${searchResults ? 'animate-dropdown-in' : 'animate-dropdown-out'}`}>
                {['users', 'groups', 'posts', 'events'].map((section) => {
                  const data = displayResults[section];
                  if (!data || data.length === 0) return null;

                  const sectionTitle = {
                    users: 'Người dùng',
                    groups: 'Nhóm',
                    posts: 'Bài viết',
                    events: 'Sự kiện'
                  }[section];

                  return (
                    <div key={section} className="border-b border-gray-100 last:border-none">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                        {sectionTitle}
                      </p>
                      {data.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigateResult(section, item)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-start gap-3"
                        >
                          {section === 'users' && item.anh_dai_dien_url ? (
                            <img
                              src={item.anh_dai_dien_url}
                              alt={item.ho_ten || item.name || 'User'}
                              className="w-10 h-10 flex-shrink-0 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 flex-shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                              {getBadge(section, item)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{getTitle(section, item)}</p>
                            <p className="text-xs text-gray-500">{getSubtitle(section, item)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Section: Icons */}
          <div className="flex items-center justify-end flex-shrink-0 space-x-1 sm:space-x-4">
            {/* ✅ Thông báo */}
            <NotificationDropdown />

            {/* ✅ Tin nhắn */}
            <MessageDropdown />

            {/* ✅ User Menu */}
            <UserMenuDropdown currentUser={currentUser} />
          </div>
        </div>
      </div>

      {/* ✅ Modal có sẵn: PostModal (dùng chung cho bài viết & bài viết sự kiện) */}
      <PostModal
        postId={selectedPostId}
        commentId={selectedCommentId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        currentUser={currentUser}
        PostCardComponent={({ post, ...props }) => {
          return post?.su_kien && typeof post.su_kien === 'object' && post.su_kien.id ? (
            <EventPostCard post={post} {...props} isInModal={true} />
          ) : (
            <PostCard post={post} {...props} isInModal={true} />
          );
        }}
      />
    </header>
  );
};

export default Header;