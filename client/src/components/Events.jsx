import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, MapPin, Users, Gift, Plus, Filter } from 'lucide-react'
import { layDanhSachSuKien, kiemTraDangKySuKien } from '../services/apiService';
import EventCard from './EventCard';

const Events = ({ currentUser }) => {
  const [events, setEvents] = useState([])
  const [eventsWithStatus, setEventsWithStatus] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1) // ✅ Thêm state để lưu tổng số trang
  const observerTarget = useRef(null)

  const currentUserId = currentUser?.id || 1
  const userRole = currentUser?.vai_tro || 'sinh_vien'

  /**
   * Kiểm tra trạng thái đăng ký và điểm danh cho từng sự kiện
   */
  const checkEventStatus = async (event) => {
    try {
      const response = await kiemTraDangKySuKien(event.id, currentUserId);
      return {
        ...event,
        da_dang_ky: response.data?.da_dang_ky || false,
        da_diem_danh: response.data?.da_diem_danh || false
      };
    } catch (error) {
      console.error(`Lỗi kiểm tra sự kiện ${event.id}:`, error);
      return {
        ...event,
        da_dang_ky: false,
        da_diem_danh: false
      };
    }
  };

  /**
   * ✅ Lấy danh sách sự kiện và kiểm tra trạng thái đăng ký
   */
  const fetchEvents = useCallback(async (pageNumber = 1, append = false) => {
    // ✅ Ngăn chặn load trùng lặp
    if (isLoadingMore) return;
    
    if (pageNumber === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const response = await layDanhSachSuKien(pageNumber, 10);
      const newEvents = response.data.su_kiens || [];
      const pagination = response.data.pagination || response.data;
      
      console.log(`📊 Page ${pageNumber}:`, {
        received: newEvents.length,
        totalPages: pagination.totalPages || pagination.tong_so_trang,
        currentPage: pagination.currentPage || pagination.trang_hien_tai
      });
      
      // ✅ Cập nhật totalPages từ API
      setTotalPages(pagination.totalPages || pagination.tong_so_trang || 1);
      
      // Kiểm tra trạng thái đăng ký cho từng sự kiện
      const eventsWithStatusPromises = newEvents.map(event => checkEventStatus(event));
      const checkedEvents = await Promise.all(eventsWithStatusPromises);
      
      if (append) {
        // ✅ Chỉ thêm sự kiện mới, không trùng lặp
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...uniqueNewEvents];
        });
        
        setEventsWithStatus(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const uniqueCheckedEvents = checkedEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...uniqueCheckedEvents];
        });
      } else {
        setEvents(newEvents);
        setEventsWithStatus(checkedEvents);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách sự kiện:", error)
      if (!append) {
        setEvents([]);
        setEventsWithStatus([]);
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [currentUserId, isLoadingMore]); // ✅ Thêm dependencies

  // ✅ Load dữ liệu ban đầu
  useEffect(() => {
    fetchEvents(1, false);
  }, []); // ✅ Chỉ chạy 1 lần khi mount

  /**
   * ✅ Intersection Observer để tự động tải khi cuộn xuống
   */
  useEffect(() => {
    // ✅ Điều kiện dừng observer
    if (filter !== 'all' || page >= totalPages || isLoadingMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('🔄 Trigger load more, page:', page + 1);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEvents(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // ✅ Thêm rootMargin để trigger sớm hơn
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, totalPages, filter, isLoadingMore, isLoading, fetchEvents]);

  /**
   * ✅ Logic filter sự kiện dựa trên trạng thái đăng ký thực tế
   */
  const filteredEvents = eventsWithStatus.filter(event => {
    if (filter === 'all') {
      return true;
    }
    
    if (filter === 'registered') {
      return event.da_dang_ky === true;
    }
    
    if (filter === 'available') {
      const chuaDangKy = event.da_dang_ky !== true;
      const conCho = (event.luot_dang_ky?.length || 0) < event.so_luong_toi_da;
      const chuaDienRa = new Date(event.thoi_gian_bat_dau) > new Date();
      
      return chuaDangKy && conCho && chuaDienRa;
    }
    
    return true;
  });

  /**
   * Callback để refresh lại trạng thái sau khi đăng ký/điểm danh
   */
  const handleRefresh = () => {
    setPage(1);
    fetchEvents(1, false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sự kiện</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredEvents.length} sự kiện
          </span>
          {/* ✅ Debug info */}
          <span className="text-xs text-gray-400">
            (Trang {page}/{totalPages})
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        {['all', 'registered', 'available'].map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              // ✅ Reset về trang 1 khi đổi filter
              if (f === 'all' && page > 1) {
                setPage(1);
                fetchEvents(1, false);
              }
            }}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? '🎯 Tất cả' : f === 'registered' ? '✅ Đã đăng ký' : '🎪 Có thể tham gia'}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 ml-3">Đang tải sự kiện...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">
            {filter === 'registered' && '📋'}
            {filter === 'available' && '🎪'}
            {filter === 'all' && '📅'}
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {filter === 'registered' && 'Bạn chưa đăng ký sự kiện nào'}
            {filter === 'available' && 'Không có sự kiện nào có thể tham gia'}
            {filter === 'all' && 'Chưa có sự kiện nào'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'registered' && 'Hãy khám phá và đăng ký các sự kiện mới!'}
            {filter === 'available' && 'Vui lòng quay lại sau hoặc thử bộ lọc khác'}
            {filter === 'all' && 'Các sự kiện sẽ được cập nhật sớm'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                currentUserId={currentUserId}
                userRole={userRole}
                onRefresh={handleRefresh}
              />
            ))}
          </div>

          {/* Trigger point cho infinite scroll */}
          {filter === 'all' && page < totalPages && (
            <div ref={observerTarget} className="flex justify-center mt-8 py-8">
              {isLoadingMore ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Đang tải thêm sự kiện...</span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Cuộn xuống để tải thêm...</div>
              )}
            </div>
          )}

          {/* ✅ Thông báo đã hết sự kiện */}
          {filter === 'all' && page >= totalPages && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                🎉 Đã hiển thị tất cả {eventsWithStatus.length} sự kiện
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Events
