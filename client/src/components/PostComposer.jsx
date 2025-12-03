import React, { useState, useEffect } from 'react';
import { Calendar, ImagePlus, X, ChevronRight, Users, Trash2, Clock, User, FileText } from 'lucide-react';
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

  const fetchUsers = async () => {
    try {
      const response = await layDanhSachNguoiPhanCong({ type: 'all' });
      if (response.success) setAvailableUsers(response.data);
    } catch (error) {
      console.error('Lỗi tải người dùng:', error);
    }
  };

  const initials = currentUser?.name
    ?.trim()
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

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
          ke_hoach_chi_tiet: JSON.stringify(eventPlan)
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