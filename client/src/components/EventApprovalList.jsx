import { useState, useEffect } from 'react';
import { Clock, Eye } from 'lucide-react';
import { layDanhSachChoDuyet } from '../services/apiService';
import EventApproval from './EventApproval';

const EventApprovalList = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await layDanhSachChoDuyet();
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải sự kiện:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedEvent) {
    return (
      <div>
        <button
          onClick={() => setSelectedEvent(null)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Quay lại danh sách
        </button>
        <EventApproval 
          event={selectedEvent} 
          onApprove={() => {
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📋 Sự kiện chờ duyệt</h2>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Đang tải...</p>
      ) : events.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Không có sự kiện nào cần duyệt</p>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{event.ten_su_kien}</h3>
                  <p className="text-gray-600 text-sm mt-1">{event.mo_ta?.slice(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {new Date(event.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}
                    </span>
                    <span>👤 {event.nguoi_tao?.ho_ten}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Eye size={18} />
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventApprovalList;