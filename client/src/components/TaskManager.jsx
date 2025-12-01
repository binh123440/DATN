import { useState } from 'react';
import { CheckCircle, Upload, File } from 'lucide-react';
import { hoanThanhTask } from '../services/apiService';

const TaskManager = ({ eventId, task, onComplete }) => {
  const [result, setResult] = useState(task.result || '');
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!result.trim()) {
      alert('Vui lòng nhập kết quả công việc');
      return;
    }

    setLoading(true);
    try {
      const response = await hoanThanhTask(eventId, task.id, result, attachments);
      if (response.success) {
        alert('✅ Gửi kết quả thành công!');
        onComplete?.();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      todo: { text: 'Chưa làm', color: 'bg-gray-100 text-gray-700' },
      doing: { text: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
      done: { text: 'Đã xong', color: 'bg-green-100 text-green-700' }
    };
    const badge = badges[task.status] || badges.todo;
    return <span className={`px-3 py-1 rounded-full text-sm ${badge.color}`}>{badge.text}</span>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{task.title}</h3>
          <p className="text-gray-600 mt-1">{task.description}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Deadline:</span>
          <span className="ml-2 font-medium">
            {new Date(task.deadline).toLocaleString('vi-VN')}
          </span>
        </div>
        {task.completed_at && (
          <div>
            <span className="text-gray-600">Hoàn thành:</span>
            <span className="ml-2 font-medium text-green-600">
              {new Date(task.completed_at).toLocaleString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      {task.status !== 'done' ? (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Báo cáo kết quả:</label>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Mô tả chi tiết kết quả công việc..."
              className="w-full border border-gray-300 rounded-lg p-3"
              rows="4"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {loading ? 'Đang gửi...' : 'Hoàn thành công việc'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-medium text-green-800 mb-2">✅ Kết quả đã nộp:</p>
          <p className="text-gray-700">{task.result}</p>
          
          {task.approved !== undefined && (
            <div className={`mt-3 p-3 rounded-lg ${task.approved ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <p className="font-medium">{task.approved ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}</p>
              {task.feedback && <p className="text-sm mt-1">💬 {task.feedback}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskManager;