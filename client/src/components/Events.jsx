import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Gift, Plus, Filter } from 'lucide-react'
// import { layDanhSachSuKien } from '../services/apiService';
import EventCard from './EventCard'; // Sử dụng lại EventCard đã được tối ưu

const Events = ({ currentUser }) => {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const currentUserId = currentUser?.id || 1
  const userRole = currentUser?.vai_tro || 'sinh_vien'

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      // TODO: Thay thế bằng API lấy danh sách sự kiện thật
      // const response = await layDanhSachSuKien();
      // setEvents(response.data.su_kiens || []);
      
      // Dữ liệu giả để test giao diện
      const mockEvents = [
        { id: 1, id_nguoi_tao: 99, ten_su_kien: 'Workshop: AI trong giáo dục hiện đại', thoi_gian_bat_dau: '2025-08-25T14:00:00', dia_diem: 'Hội trường - Khu B', so_da_dang_ky: 67, so_luong_toi_da: 100, diem_thuong: 80 },
        { id: 2, id_nguoi_tao: 99, ten_su_kien: 'Hội thảo định hướng nghề nghiệp', thoi_gian_bat_dau: '2025-08-28T09:00:00', dia_diem: 'Phòng 101 - Khu A', so_da_dang_ky: 45, so_luong_toi_da: 80, diem_thuong: 60 },
        { id: 3, id_nguoi_tao: 1, ten_su_kien: 'Cuộc thi lập trình ACM', thoi_gian_bat_dau: '2025-08-30T13:00:00', dia_diem: 'Phòng Lab 1 - Khu B', so_da_dang_ky: 24, so_luong_toi_da: 40, diem_thuong: 100 },
      ]
      setEvents(mockEvents)

    } catch (error) {
      console.error("Lỗi khi tải danh sách sự kiện:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // TODO: Logic filter cần được hoàn thiện khi có API
  const filteredEvents = events

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sự kiện</h1>
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium">
          <Plus size={18} />
          <span>Tạo sự kiện</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        {['all', 'registered', 'available'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'registered' ? 'Đã đăng ký' : 'Có thể tham gia'}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center py-8">Đang tải sự kiện...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map(event => (
            <EventCard 
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              userRole={userRole}
              onRefresh={fetchEvents}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Events
