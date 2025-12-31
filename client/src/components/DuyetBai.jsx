import React, { useState, useEffect } from 'react';
import { layDanhSachChoDuyet, capNhatTrangThaiNoiDung, duyetSuKien, duyetKetQuaTask } from '../services/apiService';
import { Check, X, Clock, FileText, Calendar, AlertCircle, MapPin, Users, Target, ChevronDown, ChevronUp, User, List, Eye } from 'lucide-react';

// Component con để hiển thị chi tiết kế hoạch
const KeHoachChiTiet = ({ keHoach, phanHoi, onPhanHoiChange, onAction, itemId, loai, onTaskAction }) => {
  if (!keHoach) {
    return (
      <div className="bg-yellow-50 border-t border-yellow-200 rounded-b-lg p-6">
        <p className="text-yellow-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Sự kiện này chưa có kế hoạch chi tiết.
        </p>
      </div>
    );
  }

  const getTaskStatusBadge = (task) => {
    if (task.approved === true) {
      return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 font-medium">✅ Đã duyệt</span>;
    }
    if (task.approved === false) {
      return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 font-medium">❌ Từ chối</span>;
    }
    if (task.status === 'done' || task.result) {
      return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">⏳ Chờ duyệt</span>;
    }
    return <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 font-medium">📝 Chưa làm</span>;
  };

  const totalTasks = keHoach.tasks?.length || 0;
  const completedTasks = keHoach.tasks?.filter(t => t.approved === true).length || 0;
  const pendingTasks = keHoach.tasks?.filter(t => t.status === 'done' && t.approved !== true && t.approved !== false).length || 0;

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <List size={20} className="text-purple-600" />
          Kế Hoạch Chi Tiết
        </h4>
        {totalTasks > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Check size={14} className="text-green-600" />
              <span className="font-semibold text-green-700">{completedTasks}/{totalTasks}</span>
            </span>
            {pendingTasks > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-yellow-600" />
                <span className="font-semibold text-yellow-700">{pendingTasks} chờ</span>
              </span>
            )}
          </div>
        )}
      </div>

      {keHoach.tasks?.length > 0 ? (
        <div className="space-y-3 mb-6">
          {keHoach.tasks.map((task, index) => (
            <div key={task.id || index} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h5 className="font-semibold text-gray-800 flex-1">{task.title}</h5>
                    {getTaskStatusBadge(task)}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                    {task.assignee?.name && (
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-blue-500" />
                        <span className="font-medium">{task.assignee.name}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-orange-500" />
                        <span>{new Date(task.deadline).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Kết quả đã submit */}
                  {task.result && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-1">
                        <FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Kết quả đã nộp:</p>
                          <p className="text-xs text-gray-700">{task.result}</p>
                          {task.submitted_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {new Date(task.submitted_at).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Feedback từ người duyệt */}
                      {task.feedback && task.approved === false && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs font-semibold text-red-800 mb-1">💬 Phản hồi:</p>
                          <p className="text-xs text-red-700">{task.feedback}</p>
                        </div>
                      )}

                      {/* Nút duyệt task - chỉ hiện khi task chưa được duyệt */}
                      {task.approved === null && task.status === 'done' && (
                        <div className="mt-3 pt-2 border-t border-blue-200">
                          <input
                            type="text"
                            placeholder="Phản hồi (tùy chọn)..."
                            className="w-full text-xs px-2 py-1.5 mb-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                            id={`feedback-${itemId}-${index}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const feedback = document.getElementById(`feedback-${itemId}-${index}`).value;
                                onTaskAction(itemId, task.id || index, true, feedback);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white px-2 py-1.5 rounded text-xs hover:bg-green-600 transition-colors font-medium"
                            >
                              <Check size={12} /> Duyệt
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const feedback = document.getElementById(`feedback-${itemId}-${index}`).value;
                                if (!feedback.trim()) {
                                  alert('Vui lòng nhập lý do từ chối');
                                  return;
                                }
                                onTaskAction(itemId, task.id || index, false, feedback);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-2 py-1.5 rounded text-xs hover:bg-red-600 transition-colors font-medium"
                            >
                              <X size={12} /> Từ chối
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Chưa có nhiệm vụ nào trong kế hoạch.
          </p>
        </div>
      )}

      {/* Form duyệt sự kiện */}
      {loai === 'su_kien' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phản hồi cho người tạo (tùy chọn)
            </label>
            <textarea
              value={phanHoi}
              onChange={onPhanHoiChange}
              onClick={(e) => e.stopPropagation()}
              placeholder="Nhập góp ý hoặc lý do từ chối..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onAction(itemId, 'duyet'); }}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
            >
              <Check size={20} /> <span>Duyệt Sự Kiện</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction(itemId, 'tu_choi'); }}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
            >
              <X size={20} /> <span>Từ Chối</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const DuyetBai = () => {
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [phanHoi, setPhanHoi] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await layDanhSachChoDuyet();
      if (response.success) {
        setDanhSach(response.data || []);
      } else {
        setError(response.message || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, loai, action) => {
    const isEventPlan = loai === 'su_kien';
    const isApproval = action === 'da_duyet' || action === 'duyet';
    
    const confirmMessage = isEventPlan
      ? (isApproval ? 'Bạn có chắc muốn duyệt kế hoạch sự kiện này?' : 'Bạn có chắc muốn từ chối kế hoạch sự kiện này?')
      : (isApproval ? 'Bạn có chắc muốn duyệt bài viết này?' : 'Bạn có chắc muốn từ chối bài viết này?');

    if (!window.confirm(confirmMessage)) return;

    try {
      if (isEventPlan) {
        await duyetSuKien(id, action, phanHoi[id] || '');
      } else {
        await capNhatTrangThaiNoiDung(id, loai, action);
      }
      
      setDanhSach(prev => prev.filter(item => item.id !== id || item.loai !== loai));
      alert(`✅ ${isApproval ? 'Đã duyệt' : 'Đã từ chối'} thành công!`);
    } catch (err) {
      alert('Đã xảy ra lỗi: ' + (err.response?.data?.message || 'Vui lòng thử lại.'));
    }
  };

  const handleTaskAction = async (eventId, taskId, approved, feedback) => {
    const confirmMsg = approved ? 'Bạn có chắc muốn duyệt task này?' : 'Bạn có chắc muốn từ chối task này?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await duyetKetQuaTask(eventId, taskId, approved, feedback);
      alert(`✅ ${approved ? 'Đã duyệt' : 'Đã từ chối'} task thành công!`);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || 'Vui lòng thử lại'));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">Lỗi</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kiểm Duyệt Nội Dung</h1>
        <p className="text-gray-600 mt-2">
          Tổng số: <span className="font-semibold text-blue-600">{danhSach.length}</span> nội dung chờ duyệt
        </p>
      </div>

      {danhSach.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Check className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Tất cả đã được duyệt</h2>
          <p className="text-gray-500">Không có nội dung nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {danhSach.map((item) => {
            const isEventRelated = item.loai === 'su_kien' || item.loai === 'bai_viet_su_kien';
            const eventData = item.loai === 'su_kien' ? item : item.su_kien;
            const isExpanded = expandedId === item.id;

            const parseKeHoach = (raw) => {
              if (!raw) return {};
              if (typeof raw === 'object') return raw;
              if (typeof raw === 'string') {
                try {
                  const obj = JSON.parse(raw);
                  return obj && typeof obj === 'object' ? obj : {};
                } catch {
                  return {};
                }
              }
              return {};
            };

            // ✅ Parse kế hoạch an toàn
            const keHoach = parseKeHoach(eventData?.ke_hoach_chi_tiet);
            const tasks = Array.isArray(keHoach?.tasks) ? keHoach.tasks : [];

            // ✅ Một task được xem là "đã làm" nếu done/completed_at/result
            const isTaskDone = (t) => {
              if (!t || typeof t !== 'object') return false;
              if (t.status === 'done') return true;
              if (t.completed_at) return true;
              if (t.result) return true;
              return false;
            };

            // ✅ Chỉ cho duyệt khi: (nếu có tasks) tất cả tasks đều đã làm + approved === true
            const canApproveEventPlan =
              tasks.length === 0 ? true : tasks.every((t) => isTaskDone(t) && t.approved === true);

            // ✅ Chặn duyệt cho cả "KẾ HOẠCH SỰ KIỆN" và "BÀI VIẾT SỰ KIỆN"
            const approveDisabled =
              isEventRelated && item.loai !== 'bai_viet' && !canApproveEventPlan;

            return (
              <div key={`${item.loai}-${item.id}`} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div 
                    className={isEventRelated ? 'cursor-pointer' : ''}
                    onClick={() => isEventRelated && toggleExpand(item.id)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {item.loai === 'bai_viet' && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          <FileText size={16} /> BÀI VIẾT
                        </span>
                      )}
                      {item.loai === 'bai_viet_su_kien' && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <FileText size={16} /> BÀI VIẾT SỰ KIỆN
                        </span>
                      )}
                      {item.loai === 'su_kien' && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                          <Calendar size={16} /> KẾ HOẠCH SỰ KIỆN
                        </span>
                      )}
                      {isEventRelated && (isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />)}
                    </div>

                    {isEventRelated && (
                      <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-purple-600">
                        {eventData?.ten_su_kien}
                      </h3>
                    )}

                    <div 
                      className="text-sm text-gray-600 mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: item.noi_dung?.substring(0, 300) + (item.noi_dung?.length > 300 ? '...' : '') }}
                    />

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <img 
                        src={item.tac_gia?.anh_dai_dien_url || '/default-avatar.png'} 
                        alt={item.tac_gia?.ho_ten || 'User'} 
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <span className="font-medium text-gray-700">{item.tac_gia?.ho_ten || 'Ẩn danh'}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> 
                        {new Date(item.ngay_tao).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {isEventRelated && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-red-500" /><span className="text-gray-700">{eventData?.dia_diem}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-blue-500" /><span className="text-gray-700">{new Date(eventData?.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Users size={16} className="text-green-500" /><span className="text-gray-700">{eventData?.so_luong_toi_da} người</span></div>
                        <div className="flex items-center gap-2 text-sm"><Target size={16} className="text-orange-500" /><span className="text-gray-700">{eventData?.diem_thuong} điểm</span></div>
                      </div>
                    )}
                    
                    {isEventRelated && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-purple-600">
                        <Eye size={14} />
                        <span className="font-medium">{isExpanded ? 'Nhấn để ẩn kế hoạch' : 'Nhấn để xem kế hoạch chi tiết'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (approveDisabled) {
                          alert('Chỉ được duyệt khi tất cả nhiệm vụ trong kế hoạch đã hoàn thành và đã được duyệt.');
                          return;
                        }
                        handleAction(item.id, item.loai, item.loai === 'su_kien' ? 'duyet' : 'da_duyet');
                      }}
                      disabled={approveDisabled}
                      title={
                        approveDisabled
                          ? 'Chỉ được duyệt khi tất cả nhiệm vụ đã hoàn thành và đã được duyệt'
                          : 'Duyệt'
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm ${
                        approveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      <Check size={18} /> <span>Duyệt</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.id, item.loai, item.loai === 'su_kien' ? 'tu_choi' : 'bi_tu_choi');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                    >
                      <X size={18} /> <span>Từ chối</span>
                    </button>
                  </div>
                </div>

                {isExpanded && isEventRelated && (
                  <KeHoachChiTiet
                    // ✅ dùng bản đã parse để UI hiển thị đúng tasks + status
                    keHoach={keHoach}
                    phanHoi={phanHoi[item.id] || ''}
                    onPhanHoiChange={(e) => {
                      e.stopPropagation();
                      setPhanHoi((prev) => ({ ...prev, [item.id]: e.target.value }));
                    }}
                    onAction={handleAction}
                    itemId={eventData?.id || item.id}
                    loai={item.loai}
                    onTaskAction={handleTaskAction}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DuyetBai;