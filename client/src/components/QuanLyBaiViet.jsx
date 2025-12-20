// client/src/components/QuanLyBaiViet.jsx
import React, { useState, useEffect } from 'react';
import { layBaiVietNguoiDung, xoaBaiViet, capNhatBaiViet, capNhatSuKien, layDanhSachNguoiPhanCong, dangSuKienCongKhai } from '../services/apiService'; // ✅ Thêm dangSuKienCongKhai
import { Edit2, Trash2, Calendar, FileText, X, Save, MapPin, Clock, Users, Award, CheckCircle, XCircle } from 'lucide-react';

const QuanLyBaiViet = () => {
  const [baiViets, setBaiViets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // State cho chỉnh sửa sự kiện
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    ten_su_kien: '',
    mo_ta: '',
    dia_diem: '',
    thoi_gian_bat_dau: '',
    so_luong_toi_da: '',
    diem_thuong: ''
  });
  const [editingTasks, setEditingTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchBaiViets();
    // load danh sách người phân công 1 lần
    (async () => {
      try {
        const res = await layDanhSachNguoiPhanCong(); // từ apiService
        // res.data hoặc res có thể khác tùy API => lấy res.data || res
        setAssignableUsers(res?.data?.data || res?.data || res || []);
      } catch (e) {
        console.error('Không lấy được danh sách người phân công', e);
      }
    })();
  }, []);

  const fetchBaiViets = async () => {
    try {
      setLoading(true);
      const response = await layBaiVietNguoiDung(user.id, 1, 100);
      console.log('📦 Response:', response);
      setBaiViets(response.data?.data?.bai_viets || []);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Lỗi khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, loai) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${loai === 'su_kien' ? 'sự kiện' : 'bài viết'} này?`)) return;
    
    try {
      await xoaBaiViet(id);
      alert('✅ Đã xóa thành công!');
      fetchBaiViets();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa'));
    }
  };

  // Chỉnh sửa nội dung bài viết
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditContent(item.noi_dung);
  };

  const handleSave = async (id) => {
    try {
      await capNhatBaiViet(id, { noi_dung: editContent });
      alert('✅ Đã cập nhật nội dung!');
      setEditingId(null);
      fetchBaiViets();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật'));
    }
  };

  // Chỉnh sửa thông tin sự kiện
  const handleEditEvent = (suKien) => {
    setEditingEvent(suKien.id);
    setEventForm({
      ten_su_kien: suKien.ten_su_kien,
      mo_ta: suKien.mo_ta || '',
      dia_diem: suKien.dia_diem,
      thoi_gian_bat_dau: suKien.thoi_gian_bat_dau ? new Date(suKien.thoi_gian_bat_dau).toISOString().slice(0, 16) : '',
      so_luong_toi_da: suKien.so_luong_toi_da,
      diem_thuong: suKien.diem_thuong
    });
    setEditingTasks(suKien.ke_hoach_chi_tiet?.tasks || []);
  };

  const handleSaveEvent = async (eventId) => {
    try {
      // Cập nhật thông tin sự kiện
      await capNhatSuKien(eventId, {
        ...eventForm,
        ke_hoach_chi_tiet: { tasks: editingTasks }
      });
      alert('✅ Đã cập nhật sự kiện!');
      setEditingEvent(null);
      fetchBaiViets();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật sự kiện'));
    }
  };

  const handleAddTask = () => {
    const newTask = {
      id: `t${Date.now()}${Math.random().toString(36).slice(2,6)}`,
      order: editingTasks.length + 1,
      title: '',
      description: '',
      assignee: null,
      deadline: '',
      status: 'pending'
    };
    setEditingTasks([...editingTasks, newTask]);
  };

  const handleUpdateTask = (index, field, value) => {
    const newTasks = [...editingTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setEditingTasks(newTasks);
  };

  const handleRemoveTask = (index) => {
    setEditingTasks(editingTasks.filter((_, i) => i !== index));
  };

  const getStatusBadge = (trangThai) => {
    const statusMap = {
      'cho_duyet': { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
      'da_duyet': { text: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
      'bi_tu_choi': { text: 'Bị từ chối', color: 'bg-red-100 text-red-700' },
      'ban_nhap': { text: 'Bản nháp', color: 'bg-gray-100 text-gray-700' },
      'da_gui': { text: 'Đã gửi', color: 'bg-blue-100 text-blue-700' },
      'da_dang': { text: 'Đã đăng', color: 'bg-purple-100 text-purple-700' }
    };
    const status = statusMap[trangThai] || { text: trangThai, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>{status.text}</span>;
  };

  // Thay thế hàm cũ bằng hàm này
  const getTaskStatusBadge = (taskOrStatus) => {
    const status = typeof taskOrStatus === 'string'
      ? taskOrStatus
      : (taskOrStatus?.status || (taskOrStatus?.approved ? 'approved' : 'pending'));

    const statusMap = {
      'pending': { text: 'Chưa làm', icon: Clock, color: 'text-gray-500' },
      'in_progress': { text: 'Đang làm', icon: Clock, color: 'text-blue-500' },
      'done': { text: 'Hoàn thành', icon: CheckCircle, color: 'text-green-500' },
      'completed': { text: 'Hoàn thành', icon: CheckCircle, color: 'text-green-500' },
      'approved': { text: 'Đã duyệt', icon: CheckCircle, color: 'text-purple-500' }
    };

    const taskStatus = statusMap[status] || statusMap['pending'];
    const Icon = taskStatus.icon;
    return (
      <span className={`flex items-center gap-1 text-xs ${taskStatus.color}`}>
        <Icon size={14} /> {taskStatus.text}
      </span>
    );
  };

  // Thêm hàm xử lý đăng công khai
  const handlePublishEvent = async (eventId) => {
    if (!window.confirm('Bạn có chắc muốn đăng sự kiện này lên trang chủ công khai?')) return;
    
    try {
      await dangSuKienCongKhai(eventId);
      alert('✅ Sự kiện đã được đăng công khai!');
      fetchBaiViets(); // Refresh danh sách
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể đăng công khai'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Bài Viết & Sự Kiện</h1>
        <p className="text-gray-600 mt-2">Tổng số: <span className="font-semibold text-blue-600">{baiViets.length}</span></p>
      </div>

      {baiViets.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-bold text-gray-700">Chưa có bài viết nào</h2>
        </div>
      ) : (
        <div className="space-y-6">
          {baiViets.map((item) => {
            const isSuKien = !!item.su_kien;
            const isEditingPost = editingId === item.id;
            const isEditingEventData = editingEvent === item.su_kien?.id;

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isSuKien ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        <Calendar size={16} /> Sự kiện
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText size={16} /> Bài viết
                      </span>
                    )}
                    {getStatusBadge(isSuKien ? item.su_kien.trang_thai : item.trang_thai)}
                  </div>
                  <div className="flex gap-2">
                    {!isEditingPost && !isEditingEventData && (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa nội dung"
                        >
                          <Edit2 size={18} />
                        </button>
                        {isSuKien && (
                          <button
                            onClick={() => handleEditEvent(item.su_kien)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Chỉnh sửa sự kiện"
                          >
                            <Calendar size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id, isSuKien ? 'su_kien' : 'bai_viet')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Nội dung bài viết */}
                {isEditingPost ? (
                  <div className="space-y-3 mb-4">
                    <label className="block text-sm font-medium text-gray-700">Nội dung bài viết</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Save size={16} /> Lưu nội dung
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X size={16} /> Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-700 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: item.noi_dung?.substring(0, 300) }}
                  />
                )}

                {/* Form chỉnh sửa sự kiện */}
                {isSuKien && isEditingEventData && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="text-lg font-bold text-purple-700 mb-3">Chỉnh sửa thông tin sự kiện</h3>
                    
                    {/* Thông tin cơ bản */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sự kiện</label>
                        <input
                          type="text"
                          value={eventForm.ten_su_kien}
                          onChange={(e) => setEventForm({...eventForm, ten_su_kien: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                        <input
                          type="text"
                          value={eventForm.dia_diem}
                          onChange={(e) => setEventForm({...eventForm, dia_diem: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                        <input
                          type="datetime-local"
                          value={eventForm.thoi_gian_bat_dau}
                          onChange={(e) => setEventForm({...eventForm, thoi_gian_bat_dau: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối đa</label>
                        <input
                          type="number"
                          value={eventForm.so_luong_toi_da}
                          onChange={(e) => setEventForm({...eventForm, so_luong_toi_da: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Điểm thưởng</label>
                        <input
                          type="number"
                          value={eventForm.diem_thuong}
                          onChange={(e) => setEventForm({...eventForm, diem_thuong: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                      <textarea
                        value={eventForm.mo_ta}
                        onChange={(e) => setEventForm({...eventForm, mo_ta: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    {/* Kế hoạch chi tiết */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">Kế hoạch chi tiết (Tasks)</h4>
                        <button
                          onClick={handleAddTask}
                          className="text-sm bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600"
                        >
                          + Thêm task
                        </button>
                      </div>

                      <div className="space-y-3">
                        {editingTasks.map((task, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Task #{index + 1}</span>
                              <button
                                onClick={() => handleRemoveTask(index)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Tiêu đề task"
                                value={task.title}
                                onChange={(e) => handleUpdateTask(index, 'title', e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                              />
                              <input
                                type="datetime-local"
                                placeholder="Deadline"
                                value={task.deadline}
                                onChange={(e) => handleUpdateTask(index, 'deadline', e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            
                            <textarea
                              placeholder="Mô tả task"
                              value={task.description}
                              onChange={(e) => handleUpdateTask(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 border rounded text-sm mt-2"
                            />

                            {/* Người thực hiện */}
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                              <select
                                value={task.assignee?.id || ''}
                                onChange={(e) => {
                                  const uid = e.target.value;
                                  if (!uid) {
                                    handleUpdateTask(index, 'assignee', null);
                                    return;
                                  }
                                  const userObj = assignableUsers.find(u => String(u.id) === String(uid));
                                  const assigneeObj = {
                                    type: 'user',
                                    id: userObj?.id,
                                    name: userObj?.ho_ten || userObj?.name || '',
                                    email: userObj?.email || ''
                                  };
                                  handleUpdateTask(index, 'assignee', assigneeObj);
                                }}
                                className="w-full px-2 py-2 border rounded text-sm"
                              >
                                <option value="">-- Chọn người thực hiện --</option>
                                {assignableUsers.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.ho_ten || u.name || u.email || `ID:${u.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        onClick={() => handleSaveEvent(item.su_kien.id)}
                        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <Save size={16} /> Lưu sự kiện
                      </button>
                      <button
                        onClick={() => setEditingEvent(null)}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X size={16} /> Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Hiển thị thông tin sự kiện (khi không edit) */}
                {isSuKien && !isEditingEventData && !isEditingPost && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-xl font-bold text-purple-700 mb-3">{item.su_kien.ten_su_kien}</h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-purple-500" />
                        <span>{item.su_kien.dia_diem}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-purple-500" />
                        <span>{new Date(item.su_kien.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={16} className="text-purple-500" />
                        <span>{item.su_kien.so_luong_toi_da} người</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Award size={16} className="text-purple-500" />
                        <span>{item.su_kien.diem_thuong} điểm</span>
                      </div>
                    </div>

                    {/* ✅ Nút đăng công khai nếu trạng thái là da_duyet */}
                    {item.su_kien.trang_thai === 'da_duyet' && (
                      <div className="mb-4">
                        <button
                          onClick={() => handlePublishEvent(item.su_kien.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          🌐 Đăng công khai
                        </button>
                      </div>
                    )}

                    {/* Hiển thị kế hoạch chi tiết */}
                    {item.su_kien.ke_hoach_chi_tiet?.tasks?.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Kế hoạch chi tiết ({item.su_kien.ke_hoach_chi_tiet.tasks.length} tasks)</h4>
                        <div className="space-y-2">
                          {item.su_kien.ke_hoach_chi_tiet.tasks.slice(0, 3).map((task, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{task.title}</span>
                                {getTaskStatusBadge(task)}
                              </div>
                              {task.assignee && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Người thực hiện:{' '}
                                  {typeof task.assignee === 'string'
                                    ? task.assignee
                                    : (task.assignee.name ?? task.assignee.ho_ten ?? task.assignee.email ?? `ID: ${task.assignee.id}`)}
                                </div>
                              )}
                            </div>
                          ))}
                          {item.su_kien.ke_hoach_chi_tiet.tasks.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              ... và {item.su_kien.ke_hoach_chi_tiet.tasks.length - 3} task khác
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                {!isEditingPost && !isEditingEventData && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-gray-500">
                    <span>📝 {new Date(item.ngay_tao).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuanLyBaiViet;