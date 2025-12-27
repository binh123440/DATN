// client/src/components/QuanLyBaiViet.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  layBaiVietNguoiDung,
  xoaBaiViet,
  capNhatBaiViet,
  capNhatSuKien,
  layDanhSachNguoiPhanCong,
  dangSuKienCongKhai
} from '../services/apiService';
import { Edit2, Trash2, Calendar, FileText, X, Save, MapPin, Clock, Users, Award, CheckCircle } from 'lucide-react';
import RoomComboBox from './RoomComboBox';
import CalendarModal from './CalendarModal';
// import EventDateTimePicker from './EventDateTimePicker'; // ✅ bỏ nếu không dùng nữa

const toDateTimeLocal = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
};

const parseIntOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const toISOOrNullFromLocal = (localDt) => {
  if (!localDt) return null;
  const d = new Date(localDt);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const QuanLyBaiViet = () => {
  const [baiViets, setBaiViets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    ten_su_kien: '',
    mo_ta: '',
    dia_diem: '',
    thoi_gian_bat_dau: '',
    thoi_gian_ket_thuc: '', // ✅ thêm để giống PostComposer
    so_luong_toi_da: '',
    diem_thuong: '',
    id_phong: null,
    phong: null
  });

  const [eventRange, setEventRange] = useState({ start: null, end: null }); // ✅ dùng cho EventDateTimePicker

  const [editingTasks, setEditingTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);

  const updateEventForm = (patch) => setEventForm((prev) => ({ ...prev, ...patch }));

  const fetchBaiViets = async () => {
    try {
      setLoading(true);
      const response = await layBaiVietNguoiDung(user?.id, 1, 100);
      setBaiViets(response.data?.data?.bai_viets || []);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Lỗi khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaiViets();

    (async () => {
      try {
        const res = await layDanhSachNguoiPhanCong();
        setAssignableUsers(res?.data?.data || res?.data || res || []);
      } catch (e) {
        console.error('Không lấy được danh sách người phân công', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditContent(item.noi_dung || '');
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

  const handleEditEvent = (suKien) => {
    setEditingEvent(suKien.id);

    updateEventForm({
      ten_su_kien: suKien.ten_su_kien,
      mo_ta: suKien.mo_ta || '',
      dia_diem: suKien.dia_diem || '',
      thoi_gian_bat_dau: toDateTimeLocal(suKien.thoi_gian_bat_dau),
      thoi_gian_ket_thuc: toDateTimeLocal(suKien.thoi_gian_ket_thuc),
      so_luong_toi_da: suKien.so_luong_toi_da ?? '',
      diem_thuong: suKien.diem_thuong ?? '',
      id_phong: suKien.id_phong || suKien.phong?.id || null,
      phong: suKien.phong || null
    });

    setEventRange({
      start: suKien.thoi_gian_bat_dau ? new Date(suKien.thoi_gian_bat_dau) : null,
      end: suKien.thoi_gian_ket_thuc ? new Date(suKien.thoi_gian_ket_thuc) : null
    });

    const tasks = (suKien.ke_hoach_chi_tiet?.tasks || []).map((t) => ({
      ...t,
      deadline: toDateTimeLocal(t.deadline || '')
    }));
    setEditingTasks(tasks);
  };

  const handleSaveEvent = async (eventId) => {
    try {
      await capNhatSuKien(eventId, {
        ...eventForm,
        so_luong_toi_da: parseIntOrNull(eventForm.so_luong_toi_da),
        diem_thuong: parseIntOrNull(eventForm.diem_thuong),

        // ✅ đồng nhất với PostComposer: gửi ISO
        thoi_gian_bat_dau: eventRange.start ? eventRange.start.toISOString() : toISOOrNullFromLocal(eventForm.thoi_gian_bat_dau),
        thoi_gian_ket_thuc: eventRange.end ? eventRange.end.toISOString() : toISOOrNullFromLocal(eventForm.thoi_gian_ket_thuc),

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
      id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      order: editingTasks.length + 1,
      title: '',
      description: '',
      assignee: null,
      deadline: '',
      status: 'pending'
    };
    setEditingTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = (index, field, value) => {
    setEditingTasks((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const handleRemoveTask = (index) => {
    setEditingTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (trangThai) => {
    const statusMap = {
      cho_duyet: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
      da_duyet: { text: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
      bi_tu_choi: { text: 'Bị từ chối', color: 'bg-red-100 text-red-700' },
      ban_nhap: { text: 'Bản nháp', color: 'bg-gray-100 text-gray-700' },
      da_gui: { text: 'Đã gửi', color: 'bg-blue-100 text-blue-700' },
      da_dang: { text: 'Đã đăng', color: 'bg-purple-100 text-purple-700' }
    };
    const status = statusMap[trangThai] || { text: trangThai, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>{status.text}</span>;
  };

  const getTaskStatusBadge = (taskOrStatus) => {
    const status =
      typeof taskOrStatus === 'string'
        ? taskOrStatus
        : taskOrStatus?.status || (taskOrStatus?.approved ? 'approved' : 'pending');

    const statusMap = {
      pending: { text: 'Chưa làm', icon: Clock, color: 'text-gray-500' },
      in_progress: { text: 'Đang làm', icon: Clock, color: 'text-blue-500' },
      done: { text: 'Hoàn thành', icon: CheckCircle, color: 'text-green-500' },
      completed: { text: 'Hoàn thành', icon: CheckCircle, color: 'text-green-500' },
      approved: { text: 'Đã duyệt', icon: CheckCircle, color: 'text-purple-500' }
    };

    const taskStatus = statusMap[status] || statusMap.pending;
    const Icon = taskStatus.icon;
    return (
      <span className={`flex items-center gap-1 text-xs ${taskStatus.color}`}>
        <Icon size={14} /> {taskStatus.text}
      </span>
    );
  };

  const handlePublishEvent = async (eventId) => {
    if (!window.confirm('Bạn có chắc muốn đăng sự kiện này lên trang chủ công khai?')) return;
    try {
      await dangSuKienCongKhai(eventId);
      alert('✅ Sự kiện đã được đăng công khai!');
      fetchBaiViets();
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
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Bài Viết &amp; Sự Kiện</h1>
        <p className="text-gray-600 mt-2">
          Tổng số: <span className="font-semibold text-cyan-600">{baiViets.length}</span>
        </p>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* Badge loại bài viết */}
                    {isSuKien ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full">
                        <Calendar size={16} /> Sự kiện
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText size={16} /> Bài viết
                      </span>
                    )}
                    {getStatusBadge(isSuKien ? item.su_kien.trang_thai : item.trang_thai)}
                  </div>

                  <div className="flex gap-2">
                    {!isEditingPost && !isEditingEventData && (
                      <>
                        {/* Nút hành động */}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Chỉnh sửa nội dung"
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          onClick={() => handleEditEvent(item.su_kien)}
                          className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Chỉnh sửa sự kiện"
                        >
                          <Calendar size={18} />
                        </button>

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

                {isSuKien && isEditingEventData && (
                  <div className="border-t pt-4">
                    <div className="mt-3 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg space-y-4">
                      <h3 className="text-md font-semibold text-cyan-800 flex items-center gap-2">
                        <Calendar size={18} /> Chỉnh sửa thông tin sự kiện
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tên sự kiện */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên sự kiện <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={eventForm.ten_su_kien}
                            onChange={(e) => updateEventForm({ ten_su_kien: e.target.value })}
                            placeholder="Nhập tên sự kiện"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                          />
                        </div>

                        {/* Địa điểm */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa điểm <span className="text-red-500">*</span>
                          </label>
                          <RoomComboBox
                            value={eventForm.phong}
                            inputValue={eventForm.dia_diem}
                            onInputChange={(text) =>
                              updateEventForm({ dia_diem: text, phong: null, id_phong: null })
                            }
                            onChange={(room) =>
                              updateEventForm({
                                phong: room,
                                id_phong: room?.id || null,
                                dia_diem: room?.ten_phong || eventForm.dia_diem
                              })
                            }
                            placeholder="Gõ để nhập địa điểm hoặc chọn phòng..."
                          />
                          {eventForm.phong && (
                            <div className="text-xs text-gray-600 mt-1">
                              Đã chọn: <strong>{eventForm.phong.ten_phong}</strong>
                            </div>
                          )}
                        </div>

                        {/* Khung giờ */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian tổ chức <span className="text-red-500">*</span>
                          </label>
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm text-gray-600">
                                {eventRange.start ? (
                                  <div>
                                    <strong>Bắt đầu:</strong> {eventRange.start.toLocaleString('vi-VN')}
                                    {eventRange.end && (
                                      <>
                                        <br />
                                        <strong>Kết thúc:</strong> {eventRange.end.toLocaleString('vi-VN')}
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Chưa chọn thời gian</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setCalendarOpen(true)}
                                disabled={!eventForm.dia_diem}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                  eventForm.dia_diem
                                    ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                Chọn khung giờ
                              </button>
                            </div>

                            {!eventForm.dia_diem && (
                              <div className="mt-2 text-xs text-gray-500">
                                Vui lòng chọn phòng hoặc nhập địa điểm để mở lịch chọn thời gian.
                              </div>
                            )}
                          </div>

                          <CalendarModal
                            open={calendarOpen}
                            onClose={() => setCalendarOpen(false)}
                            roomId={eventForm.id_phong || eventForm.phong?.id}
                            onSelect={({ start, end }) => {
                              setEventRange({ start, end });
                              updateEventForm({
                                thoi_gian_bat_dau: start ? toDateTimeLocal(start) : '',
                                thoi_gian_ket_thuc: end ? toDateTimeLocal(end) : ''
                              });
                              setCalendarOpen(false);
                            }}
                          />
                        </div>

                        {/* Số người tối đa */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số người tối đa <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={eventForm.so_luong_toi_da}
                            onChange={(e) => updateEventForm({ so_luong_toi_da: e.target.value })}
                            placeholder="Nhập số người"
                            min="1"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                          />
                        </div>

                        {/* Điểm thưởng */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm thưởng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={eventForm.diem_thuong}
                            onChange={(e) => updateEventForm({ diem_thuong: e.target.value })}
                            placeholder="Nhập điểm thưởng"
                            min="0"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                          />
                        </div>
                      </div>

                      {/* Mô tả */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả sự kiện
                        </label>
                        <textarea
                          value={eventForm.mo_ta}
                          onChange={(e) => updateEventForm({ mo_ta: e.target.value })}
                          rows={3}
                          placeholder="Nhập mô tả chi tiết về sự kiện..."
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                        />
                      </div>

                      {/* Kế hoạch chi tiết */}
                      <div className="border-t border-cyan-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <FileText size={16} className="text-cyan-600" />
                            Kế hoạch chi tiết (Tasks)
                          </h4>
                          <button
                            onClick={handleAddTask}
                            className="text-sm bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1"
                          >
                            + Thêm công việc
                          </button>
                        </div>

                        <div className="space-y-3">
                          {editingTasks.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                              <FileText size={32} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Chưa có công việc nào. Nhấn "Thêm công việc" để bắt đầu!</p>
                            </div>
                          ) : (
                            editingTasks.map((task, index) => (
                              <div key={task.id || index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">Công việc #{index + 1}</span>
                                  <button
                                    onClick={() => handleRemoveTask(index)}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                    title="Xóa công việc"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {/* Tiêu đề */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Tiêu đề <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Nhập tên công việc"
                                      value={task.title || ''}
                                      onChange={(e) => handleUpdateTask(index, 'title', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                                    />
                                  </div>

                                  {/* Mô tả */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                                    <textarea
                                      placeholder="Mô tả chi tiết công việc"
                                      value={task.description || ''}
                                      onChange={(e) => handleUpdateTask(index, 'description', e.target.value)}
                                      rows={2}
                                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                                    />
                                  </div>

                                  {/* Deadline và Người thực hiện */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Deadline <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={task.deadline || ''}
                                        onChange={(e) => handleUpdateTask(index, 'deadline', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Người thực hiện <span className="text-red-500">*</span>
                                      </label>
                                      <select
                                        value={task.assignee?.id || ''}
                                        onChange={(e) => {
                                          const uid = e.target.value;
                                          if (!uid) return handleUpdateTask(index, 'assignee', null);

                                          const u = assignableUsers.find((x) => String(x.id) === String(uid));
                                          handleUpdateTask(index, 'assignee', {
                                            type: 'user',
                                            id: u?.id,
                                            name: u?.ho_ten || u?.name || '',
                                            email: u?.email || ''
                                          });
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 outline-none"
                                      >
                                        <option value="">-- Chọn người thực hiện --</option>
                                        {assignableUsers.map((u) => (
                                          <option key={u.id} value={u.id}>
                                            {u.ho_ten || u.name || u.email || `ID:${u.id}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex gap-2 pt-3 border-t border-cyan-100">
                        <button
                          onClick={() => handleSaveEvent(item.su_kien.id)}
                          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
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
                  </div>
                )}

                {isSuKien && !isEditingEventData && !isEditingPost && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-xl font-bold text-cyan-800 mb-3">{item.su_kien.ten_su_kien}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-cyan-600" />
                        <span><strong>Địa điểm:</strong> {item.su_kien.dia_diem}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={16} className="text-cyan-600" />
                        <span><strong>Số người tối đa:</strong> {item.su_kien.so_luong_toi_da} người</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-cyan-600" />
                        <div className="flex flex-col">
                          <span><strong>Bắt đầu:</strong> {new Date(item.su_kien.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
                          {item.su_kien.thoi_gian_ket_thuc && (
                            <span className="mt-1"><strong>Kết thúc:</strong> {new Date(item.su_kien.thoi_gian_ket_thuc).toLocaleString('vi-VN')}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Award size={16} className="text-cyan-600" />
                        <span><strong>Điểm thưởng:</strong> {item.su_kien.diem_thuong} điểm</span>
                      </div>
                    </div>

                    {item.su_kien.trang_thai === 'da_duyet' && (
                      <div className="mb-4">
                        <button
                          onClick={() => handlePublishEvent(item.su_kien.id)}
                          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                        >
                          🌐 Đăng công khai
                        </button>
                      </div>
                    )}

                    {item.su_kien.ke_hoach_chi_tiet?.tasks?.length > 0 && (
                      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                        <h4 className="font-semibold text-cyan-800 mb-2">
                          Kế hoạch chi tiết ({item.su_kien.ke_hoach_chi_tiet.tasks.length} tasks)
                        </h4>
                        <div className="space-y-2">
                          {item.su_kien.ke_hoach_chi_tiet.tasks.slice(0, 3).map((task, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-cyan-200 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{task.title}</span>
                                {getTaskStatusBadge(task)}
                              </div>
                              {task.assignee && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Người thực hiện:{' '}
                                  {typeof task.assignee === 'string'
                                    ? task.assignee
                                    : task.assignee.name ?? task.assignee.ho_ten ?? task.assignee.email ?? `ID: ${task.assignee.id}`}
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