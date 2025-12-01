import React, { useState, useEffect } from 'react';
import { Calendar, ImagePlus, SmilePlus, X, ChevronRight, Users } from 'lucide-react';
import { taoBaiVietVoiMedia, taoSuKien, layDanhSachNguoiPhanCong } from '../services/apiService';

const PostComposer = ({ onCreatePost, currentUserId, currentUser }) => {
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState('');
  const [eventDetails, setEventDetails] = useState({ 
    name: '', location: '', date: '', time: '', maxParticipants: '', points: '' 
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ State cho kế hoạch sự kiện
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

  const fetchUsers = async () => {
    try {
      const response = await layDanhSachNguoiPhanCong({ type: 'giao_vien' });
      if (response.success) setAvailableUsers(response.data);
    } catch (error) {
      console.error('Lỗi tải người dùng:', error);
    }
  };

  // ✅ Lấy tên viết tắt an toàn
  const initials = currentUser?.name
        .trim()
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Chỉ được chọn tối đa 5 file!');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, {
          url: reader.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addTask = () => {
    setEventPlan(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: `t${Date.now()}`,
        title: '',
        assignee: null,
        deadline: '',
        order: prev.tasks.length + 1
      }]
    }));
  };

  const updateTask = (index, field, value) => {
    setEventPlan(prev => {
      const newTasks = [...prev.tasks];
      newTasks[index][field] = value;
      return { ...prev, tasks: newTasks };
    });
  };

  const removeTask = (index) => {
    setEventPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setContent('');
    setActiveType(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEventDetails({ name: '', location: '', date: '', time: '', maxParticipants: '', points: '' });
    setEventPlan({ tasks: [], targetAudience: { voluntary: true, mandatory: [] } });
    setShowEventPlan(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeType === 'event') {
        const eventData = {
          id_nguoi_tao: currentUserId,
          ten_su_kien: eventDetails.name,
          mo_ta: content || eventDetails.name,
          dia_diem: eventDetails.location,
          thoi_gian_bat_dau: `${eventDetails.date}T${eventDetails.time}:00`,
          so_luong_toi_da: parseInt(eventDetails.maxParticipants),
          diem_thuong: parseInt(eventDetails.points),
          noi_dung_bai_viet: content,
          ke_hoach_chi_tiet: JSON.stringify(eventPlan) // ✅ Gửi kế hoạch
        };
        const response = await taoSuKien(eventData);
        if (response.success) {
          alert('✅ Tạo sự kiện thành công! Đang chờ duyệt.');
          onCreatePost();
          resetForm();
        }
      } else {
        const formData = new FormData();
        formData.append('id_tac_gia', currentUserId);
        formData.append('noi_dung', content);
        selectedFiles.forEach(file => formData.append('media', file));

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

  const isSubmitDisabled = isSubmitting || (activeType === 'event' 
    ? !eventDetails.name || !eventDetails.location || !eventDetails.date 
    : !content.trim() && selectedFiles.length === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Avatar + Input */}
      <div className="flex items-center space-x-3 mb-4">
        {currentUser?.anh_dai_dien_url ? (
          <img 
            src={currentUser.anh_dai_dien_url} 
            alt={currentUser.name || 'User'}
            className="w-10 h-10 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {initials}
          </div>
        )}
        <input 
          type="text" 
          placeholder={activeType === 'event' ? "Mô tả về sự kiện..." : "Bạn đang nghĩ gì?"} 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all" 
        />
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
            <input type="text" name="name" value={eventDetails.name} onChange={handleEventDetailChange} placeholder="Tên sự kiện" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="text" name="location" value={eventDetails.location} onChange={handleEventDetailChange} placeholder="Địa điểm" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="date" name="date" value={eventDetails.date} onChange={handleEventDetailChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="time" name="time" value={eventDetails.time} onChange={handleEventDetailChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" name="maxParticipants" value={eventDetails.maxParticipants} onChange={handleEventDetailChange} placeholder="Số người tối đa" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" name="points" value={eventDetails.points} onChange={handleEventDetailChange} placeholder="Điểm thưởng" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={() => setShowEventPlan(true)} className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
            Tiếp theo: Tạo kế hoạch <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Kế hoạch chi tiết */}
      {activeType === 'event' && showEventPlan && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-cyan-800">📋 Kế hoạch công việc</h3>
            <button onClick={addTask} className="px-3 py-1 bg-green-500 text-white rounded text-sm">+ Thêm task</button>
          </div>

          <div className="space-y-3">
            {eventPlan.tasks.map((task, index) => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Tên công việc" value={task.title} onChange={(e) => updateTask(index, 'title', e.target.value)} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
                  <button onClick={() => removeTask(index)} className="text-red-500"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={task.assignee?.id || ''} onChange={(e) => {
                    const user = availableUsers.find(u => u.id === parseInt(e.target.value));
                    updateTask(index, 'assignee', user ? { type: 'user', id: user.id, name: user.ho_ten } : null);
                  }} className="border border-gray-300 rounded px-2 py-1 text-sm">
                    <option value="">-- Giao cho --</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.ho_ten}</option>
                    ))}
                  </select>
                  <input type="datetime-local" value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''} onChange={(e) => updateTask(index, 'deadline', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Đối tượng tham gia */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2"><Users size={16} />Đối tượng tham gia</h4>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={eventPlan.targetAudience.voluntary} onChange={(e) => setEventPlan(prev => ({ ...prev, targetAudience: { ...prev.targetAudience, voluntary: e.target.checked } }))} />
              <span className="text-sm">Đăng ký tự nguyện</span>
            </label>
          </div>

          <button onClick={() => setShowEventPlan(false)} className="mt-4 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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