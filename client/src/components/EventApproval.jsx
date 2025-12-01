import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { duyetSuKien, dangSuKienCongKhai } from '../services/apiService';

const EventApproval = ({ event, onApprove }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (action) => {
    if (action === 'tu_choi' && !feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    setLoading(true);
    try {
      const response = await duyetSuKien(event.id, action, feedback);
      if (response.success) {
        alert(action === 'duyet' ? '✅ Đã duyệt sự kiện' : '❌ Đã từ chối sự kiện');
        onApprove?.();
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Đăng sự kiện công khai?')) return;

    setLoading(true);
    try {
      const response = await dangSuKienCongKhai(event.id);
      if (response.success) {
        alert('✅ Đã đăng sự kiện công khai!');
        onApprove?.();
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📝 Duyệt sự kiện</h2>

      <div className="mb-6">
        <h3 className="font-bold text-lg">{event.ten_su_kien}</h3>
        <p className="text-gray-600 mt-2">{event.mo_ta}</p>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>📅 {new Date(event.thoi_gian_bat_dau).toLocaleString('vi-VN')}</div>
          <div>📍 {event.dia_diem}</div>
          <div>👥 Tối đa: {event.so_luong_toi_da} người</div>
          <div>🎁 Điểm thưởng: {event.diem_thuong}</div>
        </div>
      </div>

      {/* Kế hoạch chi tiết */}
      {event.ke_hoach_chi_tiet?.tasks?.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">📋 Danh sách công việc:</h4>
          <div className="space-y-2">
            {event.ke_hoach_chi_tiet.tasks.map((task, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{task.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {task.approved ? '✅ Đã duyệt' : task.status === 'done' ? '⏳ Chờ duyệt' : '📝 Chưa xong'}
                  </span>
                </div>
                {task.assignee && (
                  <p className="text-sm text-gray-600 mt-1">👤 {task.assignee.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form phản hồi */}
      {event.trang_thai_su_kien === 'da_gui_khoa' && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Phản hồi:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Nhập phản hồi (bắt buộc nếu từ chối)..."
              className="w-full border border-gray-300 rounded-lg p-3"
              rows="3"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleApprove('duyet')}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Duyệt
            </button>
            <button
              onClick={() => handleApprove('tu_choi')}
              disabled={loading}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Nút đăng công khai */}
      {event.trang_thai_su_kien === 'da_duyet_khoa' && (
        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          🌐 Đăng công khai
        </button>
      )}
    </div>
  );
};

export default EventApproval;