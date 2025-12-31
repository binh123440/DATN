import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Calendar, ImagePlus, X, ChevronRight, Users, Trash2, Clock, User, FileText } from 'lucide-react';
import { taoBaiVietVoiMedia, taoSuKien, layDanhSachNguoiPhanCong, layBaiVietNguoiDung, layDanhSachPhong } from '../services/apiService';
import RoomComboBox from './RoomComboBox';
import EventDateTimePicker from './EventDateTimePicker';

const useDebounce = (value, delay = 250) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const parseKeHoachChiTiet = (raw) => {
  if (!raw) return { tasks: [], targetAudience: { voluntary: true, mandatory: [] } };

  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== 'object') return { tasks: [], targetAudience: { voluntary: true, mandatory: [] } };

  const target = obj.targetAudience || obj.target_audience || { voluntary: true, mandatory: [] };
  const tasks = Array.isArray(obj.tasks) ? obj.tasks : [];

  return {
    tasks: tasks.map((t, idx) => ({
      id: t.id || `t${Date.now()}_${idx}`,
      title: t.title || '',
      description: t.description || '',
      assignee: t.assignee || null,
      deadline: t.deadline || '',
      order: t.order ?? (idx + 1),
      status: t.status || 'todo',
      attachments: t.attachments || [],
      result: t.result ?? null,
      completed_at: t.completed_at ?? null,
      approved: t.approved ?? null,
      feedback: t.feedback ?? null
    })),
    targetAudience: {
      voluntary: target.voluntary !== false,
      mandatory: Array.isArray(target.mandatory) ? target.mandatory : []
    }
  };
};

const PostComposer = ({ onCreatePost, currentUserId, currentUser }) => {
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState('');
  const [eventDetails, setEventDetails] = useState({
    name: '',
    room: null, // selected room object
    start: null, // Date
    end: null, // Date
    maxParticipants: '',
    points: '',
    locationMode: 'in_school', // ✅ 'in_school' | 'outside'
    locationText: '' // ✅ địa điểm ngoài trường (nhập tay)
  });

  // ✅ Gợi ý sự kiện đã đăng trước đó (của chính user)
  const [eventTemplates, setEventTemplates] = useState([]); // items: { post, su_kien }
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);
  const templateRef = useRef(null);
  const debouncedQuery = useDebounce(templateQuery, 250);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho kế hoạch sự kiện
  const [showEventPlan, setShowEventPlan] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [eventPlan, setEventPlan] = useState({
    tasks: [],
    targetAudience: { voluntary: true, mandatory: [] }
  });

  useEffect(() => {
    if (activeType === 'event') {
      fetchUsers();
    }
  }, [activeType]);

  // ✅ click outside để đóng dropdown gợi ý
  useEffect(() => {
    const onDoc = (e) => {
      if (templateRef.current && !templateRef.current.contains(e.target)) setTemplateOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await layDanhSachNguoiPhanCong({ type: 'all' });
      if (response.success) setAvailableUsers(response.data);
    } catch (error) {
      console.error('Lỗi tải người dùng:', error);
    }
  };

  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  const fetchEventTemplatesOnce = async () => {
    if (!currentUserId) return;
    if (templateLoading) return;
    if (eventTemplates.length > 0) return;

    setTemplateLoading(true);
    try {
      const resp = await layBaiVietNguoiDung(currentUserId, 1, 100);
      const list = resp?.data?.data?.bai_viets || [];
      const onlyEvents = (Array.isArray(list) ? list : [])
        .filter((p) => p?.su_kien && typeof p.su_kien === 'object' && p.su_kien.id)
        .map((p) => ({ post: p, su_kien: p.su_kien }));
      setEventTemplates(onlyEvents);
    } catch (e) {
      console.error('Lỗi tải gợi ý sự kiện:', e);
      setEventTemplates([]);
    } finally {
      setTemplateLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = (debouncedQuery || '').trim().toLowerCase();
    if (!q) return eventTemplates.slice(0, 8);

    return eventTemplates
      .filter(({ su_kien }) => {
        const name = String(su_kien?.ten_su_kien || '').toLowerCase();
        const place = String(su_kien?.dia_diem || '').toLowerCase();
        return name.includes(q) || place.includes(q);
      })
      .slice(0, 8);
  }, [eventTemplates, debouncedQuery]);

  const resolveRoomFromTemplate = async (su_kien) => {
    const idPhong = su_kien?.id_phong ?? null;
    const tenPhong = (su_kien?.dia_diem || '').trim();

    // Nếu event đã lưu id_phong => dùng luôn
    if (idPhong) {
      return {
        id: idPhong,
        id_phong: idPhong,
        ten_phong: tenPhong
      };
    }

    // Nếu chỉ có text (dia_diem) => cố gắng tra danh sách phòng để lấy id
    if (!tenPhong) return null;

    try {
      const resp = await layDanhSachPhong(tenPhong);
      const rooms = resp?.success ? (resp.data || []) : [];
      if (!Array.isArray(rooms) || rooms.length === 0) {
        // fallback: vẫn trả object có tên để hiển thị, nhưng roomId sẽ không có
        return { id: null, id_phong: null, ten_phong: tenPhong };
      }

      const lower = tenPhong.toLowerCase();
      const exact = rooms.find((r) => String(r?.ten_phong || '').trim().toLowerCase() === lower);
      return exact || rooms[0];
    } catch {
      return { id: null, id_phong: null, ten_phong: tenPhong };
    }
  };

  const handleSelectTemplate = async ({ post, su_kien }) => {
    // ✅ Điền sẵn phòng, số người, điểm thưởng và kế hoạch
    const roomResolved = await resolveRoomFromTemplate(su_kien);

    setEventDetails((prev) => {
      const hasRoom = !!(roomResolved?.ten_phong);
      const locationMode = hasRoom ? 'in_school' : 'outside';

      return {
        ...prev,
        name: su_kien?.ten_su_kien || prev.name,
        room: hasRoom ? roomResolved : null,
        locationMode,
        locationText: !hasRoom ? (su_kien?.dia_diem || prev.locationText) : '',
        maxParticipants: su_kien?.so_luong_toi_da ?? prev.maxParticipants,
        points: su_kien?.diem_thuong ?? prev.points
      };
    });

    setEventPlan(parseKeHoachChiTiet(su_kien?.ke_hoach_chi_tiet));

    setTemplateQuery(su_kien?.ten_su_kien || '');
    setTemplateOpen(false);
  };

  const handleEventNameInput = async (e) => {
    const text = e.target.value;
    setEventDetails((prev) => ({ ...prev, name: text }));
    setTemplateQuery(text);
    setTemplateOpen(true);
    await fetchEventTemplatesOnce();
  };

  const handleRoomChange = (room) => {
    setEventDetails((prev) => ({
      ...prev,
      room,
      locationMode: 'in_school',
      locationText: ''
    }));
  };

  const handleDateRangeChange = ({ start, end }) => {
    setEventDetails((prev) => ({ ...prev, start, end }));
  };

  // ✅ Fallback chọn lịch khi địa điểm ngoài trường (không có phòng/roomId)
  const handleOutsideDateChange = (key, value) => {
    const dt = value ? new Date(value) : null;
    setEventDetails((prev) => {
      const next = { ...prev, [key]: dt };

      // Nếu end < start thì reset end cho hợp lệ (tránh lỗi UI)
      if (key === 'start' && next.end && dt && next.end.getTime() < dt.getTime()) {
        next.end = null;
      }
      return next;
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Chỉ được chọn tối đa 5 file!');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [
          ...prev,
          {
            url: reader.result,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addTask = () => {
    setEventPlan((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: `t${Date.now()}`,
          title: '',
          description: '',
          assignee: null,
          deadline: '',
          order: prev.tasks.length + 1,
          status: 'todo',
          attachments: [],
          result: null,
          completed_at: null,
          approved: null,
          feedback: null
        }
      ]
    }));
  };

  const updateTask = (index, field, value) => {
    setEventPlan((prev) => {
      const newTasks = [...prev.tasks];
      newTasks[index][field] = value;
      return { ...prev, tasks: newTasks };
    });
  };

  const removeTask = (index) => {
    setEventPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setContent('');
    setActiveType(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEventDetails({
      name: '',
      room: null,
      start: null,
      end: null,
      maxParticipants: '',
      points: '',
      locationMode: 'in_school',
      locationText: ''
    });
    setEventPlan({ tasks: [], targetAudience: { voluntary: true, mandatory: [] } });
    setShowEventPlan(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeType === 'event') {
        const diaDiem =
          eventDetails.room?.ten_phong ||
          (eventDetails.locationText || '').trim() ||
          (eventDetails.name || '');

        const idPhong = eventDetails.room?.id || eventDetails.room?.id_phong || null;

        // ✅ gửi multipart để kèm media cho bài viết liên kết sự kiện
        const formData = new FormData();
        formData.append('id_nguoi_tao', String(currentUserId));
        formData.append('ten_su_kien', String(eventDetails.name || ''));
        formData.append('mo_ta', String(content || eventDetails.name || ''));
        formData.append('dia_diem', String(diaDiem || ''));
        if (idPhong != null) formData.append('id_phong', String(idPhong));

        if (eventDetails.start) formData.append('thoi_gian_bat_dau', eventDetails.start.toISOString());
        if (eventDetails.end) formData.append('thoi_gian_ket_thuc', eventDetails.end.toISOString());

        if (eventDetails.maxParticipants) formData.append('so_luong_toi_da', String(parseInt(eventDetails.maxParticipants, 10)));
        if (eventDetails.points) formData.append('diem_thuong', String(parseInt(eventDetails.points, 10)));

        formData.append('noi_dung_bai_viet', String(content || ''));
        formData.append('ke_hoach_chi_tiet', JSON.stringify(eventPlan));

        selectedFiles.forEach((file) => formData.append('media', file));

        const response = await taoSuKien(formData);
        if (response.success) {
          alert('✅ Tạo sự kiện thành công! Đang chờ duyệt.');
          onCreatePost();
          resetForm();
        } else {
          alert('❌ ' + (response.message || 'Không thể tạo sự kiện.'));
        }
      } else {
        const formData = new FormData();
        formData.append('id_tac_gia', currentUserId);
        formData.append('noi_dung', content);
        selectedFiles.forEach((file) => formData.append('media', file));
        const response = await taoBaiVietVoiMedia(formData);
        if (response.success) {
          alert('✅ Đăng bài thành công!');
          onCreatePost();
          resetForm();
        }
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasLocation =
    !!eventDetails.room || (eventDetails.locationMode === 'outside' && (eventDetails.locationText || '').trim().length > 0);

  const isSubmitDisabled =
    isSubmitting ||
    (activeType === 'event'
      ? !eventDetails.name || !hasLocation || !eventDetails.start
      : !content.trim() && selectedFiles.length === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Avatar + Input */}
      <div className="flex items-center space-x-3 mb-4">
        {currentUser?.anh_dai_dien_url ? (
          <img src={currentUser.anh_dai_dien_url} alt={currentUser.name || 'User'} className="w-10 h-10 rounded-full object-cover shadow-lg" />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            { (currentUser?.ho_ten || currentUser?.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() }
          </div>
        )}
        <input type="text" placeholder={activeType === 'event' ? "Mô tả về sự kiện..." : "Bạn đang nghĩ gì?"}
          value={content} onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all" />
      </div>

      {/* Preview files */}
      {previewUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {previewUrls.map((preview, index) => (
            <div key={index} className="relative group">
              {preview.type === 'image' ? (
                <img src={preview.url} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <video src={preview.url} className="w-full h-32 object-cover rounded-lg" />
              )}
              <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Form sự kiện cơ bản */}
      {activeType === 'event' && !showEventPlan && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4">
            <Calendar size={18} className="mr-2" />Thông tin sự kiện
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={templateRef}>
              <input
                type="text"
                name="name"
                value={eventDetails.name}
                onChange={handleEventNameInput}
                onFocus={async () => {
                  setTemplateOpen(true);
                  setTemplateQuery(eventDetails.name || '');
                  await fetchEventTemplatesOnce();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setTemplateOpen(false);
                }}
                placeholder="Tên sự kiện (gõ để gợi ý từ sự kiện bạn đã đăng)"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />

              {templateOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-64 overflow-auto">
                  <div className="p-2 text-xs text-gray-500">
                    Chọn sự kiện đã đăng để tự điền phòng, số người tối đa, điểm thưởng và kế hoạch.
                  </div>

                  {templateLoading && <div className="p-2 text-sm text-gray-500">Đang tải...</div>}

                  {!templateLoading && filteredTemplates.length === 0 && (
                    <div className="p-2 text-sm text-gray-500">Không có gợi ý phù hợp</div>
                  )}

                  {!templateLoading &&
                    filteredTemplates.map(({ post, su_kien }) => (
                      <button
                        key={su_kien.id}
                        type="button"
                        onClick={() => handleSelectTemplate({ post, su_kien })}
                        className="w-full text-left px-3 py-2 hover:bg-cyan-50"
                      >
                        <div className="font-medium text-gray-900 truncate">{su_kien.ten_su_kien}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {su_kien.dia_diem ? `📍 ${su_kien.dia_diem}` : ''}
                          {su_kien.so_luong_toi_da ? ` • 👥 ${su_kien.so_luong_toi_da}` : ''}
                          {su_kien.diem_thuong ? ` • ⭐ ${su_kien.diem_thuong}` : ''}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* ✅ Chọn loại địa điểm */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEventDetails((prev) => ({
                      ...prev,
                      locationMode: 'in_school',
                      locationText: ''
                    }))
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    eventDetails.locationMode === 'in_school'
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Trong trường (chọn phòng)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEventDetails((prev) => ({
                      ...prev,
                      locationMode: 'outside',
                      room: null // ✅ ngoài trường thì không cần room
                    }))
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    eventDetails.locationMode === 'outside'
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Ngoài trường (nhập địa điểm)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nếu sự kiện tổ chức ngoài trường, bạn vẫn có thể chọn lịch bình thường.
              </p>
            </div>

            {/* Room combo box hoặc địa điểm ngoài trường */}
            {eventDetails.locationMode === 'in_school' ? (
              <div className="md:col-span-2">
                <RoomComboBox value={eventDetails.room} onChange={handleRoomChange} placeholder="Tìm và chọn phòng trong trường..." />
                {eventDetails.room && (
                  <div className="text-xs text-gray-600 mt-1">
                    Đã chọn: <strong>{eventDetails.room.ten_phong}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="locationText"
                  value={eventDetails.locationText}
                  onChange={handleEventDetailChange}
                  placeholder="Nhập địa điểm ngoài trường (VD: Nhà văn hoá Q.9, Công ty ABC...)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* ✅ Chọn lịch: dùng EventDateTimePicker khi có phòng, fallback khi ngoài trường */}
            <div className="md:col-span-2">
              {eventDetails.locationMode === 'in_school' ? (
                eventDetails.room ? (
                  <EventDateTimePicker
                    start={eventDetails.start}
                    end={eventDetails.end}
                    onChange={handleDateRangeChange}
                    onApply={({ start, end }) => handleDateRangeChange({ start, end })}
                    onCancel={() => {}}
                    roomId={eventDetails.room?.id || eventDetails.room?.id_phong}
                    minDate={new Date()}
                  />
                ) : (
                  <div className="p-3 border border-dashed border-gray-200 rounded text-sm text-gray-500">
                    Vui lòng chọn phòng trước khi chọn thời gian.
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={eventDetails.start ? new Date(eventDetails.start).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleOutsideDateChange('start', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian kết thúc (tuỳ chọn)</label>
                    <input
                      type="datetime-local"
                      value={eventDetails.end ? new Date(eventDetails.end).toISOString().slice(0, 16) : ''}
                      min={eventDetails.start ? new Date(eventDetails.start).toISOString().slice(0, 16) : undefined}
                      onChange={(e) => handleOutsideDateChange('end', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <input
              type="number"
              name="maxParticipants"
              value={eventDetails.maxParticipants}
              onChange={handleEventDetailChange}
              placeholder="Số người tối đa"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="points"
              value={eventDetails.points}
              onChange={handleEventDetailChange}
              placeholder="Điểm thưởng"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => setShowEventPlan(true)}
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            Tiếp theo: Tạo kế hoạch <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Kế hoạch chi tiết - ✅ PHẦN NÀY ĐƯỢC CẢI THIỆN */}
      {activeType === 'event' && showEventPlan && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-cyan-800 flex items-center gap-2">
              <FileText size={18} />Kế hoạch công việc
            </h3>
            <button 
              onClick={addTask} 
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              + Thêm công việc
            </button>
          </div>

          {/* Danh sách tasks */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {eventPlan.tasks.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có công việc nào. Hãy thêm công việc đầu tiên!</p>
              </div>
            ) : (
              eventPlan.tasks.map((task, index) => (
                <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Tên công việc + Nút xóa */}
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="Tên công việc *" 
                      value={task.title} 
                      onChange={(e) => updateTask(index, 'title', e.target.value)} 
                      className="flex-1 font-medium text-gray-800 border-b-2 border-transparent focus:border-blue-400 outline-none px-1 py-1 transition-colors"
                    />
                    <button 
                      onClick={() => removeTask(index)} 
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* ✅ Mô tả công việc */}
                  <textarea
                    placeholder="Mô tả chi tiết công việc..."
                    value={task.description || ''}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-3 border border-gray-200 focus:border-blue-400 outline-none resize-none transition-colors"
                  />

                  {/* Người thực hiện + Deadline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select 
                        value={task.assignee?.id || ''} 
                        onChange={(e) => {
                          const user = availableUsers.find(u => u.id === parseInt(e.target.value));
                          updateTask(index, 'assignee', user ? { 
                            type: 'user', 
                            id: user.id, 
                            name: user.ho_ten,
                            email: user.email 
                          } : null);
                        }} 
                        className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-400 outline-none transition-colors"
                      >
                        <option value="">-- Chọn người thực hiện --</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.ho_ten}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input 
                        type="datetime-local" 
                        value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''} 
                        onChange={(e) => updateTask(index, 'deadline', e.target.value)} 
                        className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-400 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* ✅ Thông tin người được giao */}
                  {task.assignee && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {task.assignee.name.charAt(0)}
                      </div>
                      <span className="text-xs text-blue-800 font-medium">{task.assignee.name}</span>
                      <span className="text-xs text-blue-600 ml-auto">sẽ nhận thông báo</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Đối tượng tham gia */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-700">
              <Users size={16} />Đối tượng tham gia
            </h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                eventPlan.targetAudience.voluntary 
                  ? 'bg-cyan-500 border-cyan-500' 
                  : 'bg-white border-gray-300 group-hover:border-cyan-400'
              }`}>
                {eventPlan.targetAudience.voluntary && <Users size={12} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={eventPlan.targetAudience.voluntary} 
                onChange={(e) => setEventPlan(prev => ({ 
                  ...prev, 
                  targetAudience: { ...prev.targetAudience, voluntary: e.target.checked } 
                }))} 
              />
              <span className="text-sm text-gray-700 group-hover:text-cyan-700 transition-colors">
                Cho phép đăng ký tự nguyện
              </span>
            </label>
          </div>

          <button 
            onClick={() => setShowEventPlan(false)} 
            className="mt-4 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-sm transition-colors"
          >
            ← Quay lại
          </button>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          <label className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:bg-purple-50">
            <ImagePlus size={20} />
            <span className="hidden sm:inline">Ảnh/Video</span>
            <input type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
          </label>
          <button onClick={() => setActiveType(activeType === 'event' ? null : 'event')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeType === 'event' ? 'text-cyan-600 bg-cyan-100' : 'text-gray-600 hover:bg-cyan-50'}`}>
            <Calendar size={20} />
            <span className="hidden sm:inline">Sự kiện</span>
          </button>
        </div>
        <button onClick={handleSubmit} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitDisabled}>
          {isSubmitting ? 'Đang tạo...' : (activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài')}
        </button>
      </div>
    </div>
  );
};

export default PostComposer;