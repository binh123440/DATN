import React, { useState } from 'react';
import { Calendar, ImagePlus, SmilePlus, X } from 'lucide-react';
import { taoBaiVietVoiMedia, taoSuKien } from '../services/apiService';

const PostComposer = ({ onCreatePost, currentUserId }) => {
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState('');
  const [eventDetails, setEventDetails] = useState({ 
    name: '', location: '', date: '', time: '', maxParticipants: '', points: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

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

  const resetForm = () => {
    setContent('');
    setActiveType(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEventDetails({ name: '', location: '', date: '', time: '', maxParticipants: '', points: '' });
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
          thoi_gian_bat_dau: `${eventDetails.date} ${eventDetails.time}`,
          so_luong_toi_da: parseInt(eventDetails.maxParticipants),
          diem_thuong: parseInt(eventDetails.points),
          noi_dung_bai_viet: content
        };
        const response = await taoSuKien(eventData);
        if (response.success) {
          alert('Tạo sự kiện thành công! Đang chờ duyệt.');
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
          alert('Đăng bài thành công!');
          onCreatePost();
          resetForm();
        }
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionButtons = [
    { type: 'image', label: 'Ảnh/Video', Icon: ImagePlus, activeClasses: 'text-purple-600 bg-purple-100', hoverClasses: 'hover:bg-purple-50' },
    { type: 'event', label: 'Sự kiện', Icon: Calendar, activeClasses: 'text-cyan-600 bg-cyan-100', hoverClasses: 'hover:bg-cyan-50' },
    { type: 'feeling', label: 'Cảm xúc', Icon: SmilePlus, activeClasses: 'text-yellow-600 bg-yellow-100', hoverClasses: 'hover:bg-yellow-50' }
  ];

  const isSubmitDisabled = isSubmitting || (activeType === 'event' 
    ? !eventDetails.name || !eventDetails.location || !eventDetails.date 
    : !content.trim() && selectedFiles.length === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          SV
        </div>
        <input 
          type="text" 
          placeholder={activeType === 'event' ? "Mô tả về sự kiện của bạn..." : "Bạn đang nghĩ gì?"} 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all" 
        />
      </div>

      {previewUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {previewUrls.map((preview, index) => (
            <div key={index} className="relative group">
              {preview.type === 'image' ? (
                <img 
                  src={preview.url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={preview.url} 
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {activeType === 'event' && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4">
            <Calendar size={18} className="mr-2" />Tạo sự kiện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tên sự kiện</label>
              <input 
                type="text" 
                name="name" 
                value={eventDetails.name} 
                onChange={handleEventDetailChange} 
                placeholder="Ví dụ: Hội thảo AI" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Địa điểm</label>
              <input 
                type="text" 
                name="location" 
                value={eventDetails.location} 
                onChange={handleEventDetailChange} 
                placeholder="Ví dụ: Hội trường A" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày</label>
              <input 
                type="date" 
                name="date" 
                value={eventDetails.date} 
                onChange={handleEventDetailChange} 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Giờ</label>
              <input 
                type="time" 
                name="time" 
                value={eventDetails.time} 
                onChange={handleEventDetailChange} 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Số người tối đa</label>
              <input 
                type="number" 
                name="maxParticipants" 
                value={eventDetails.maxParticipants} 
                onChange={handleEventDetailChange} 
                placeholder="100" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Điểm thưởng</label>
              <input 
                type="number" 
                name="points" 
                value={eventDetails.points} 
                onChange={handleEventDetailChange} 
                placeholder="50" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          {actionButtons.map((button) => (
            <div key={button.type}>
              {button.type === 'image' ? (
                <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium cursor-pointer ${activeType === button.type ? button.activeClasses : `text-gray-600 ${button.hoverClasses}`}`}>
                  <button.Icon size={20} />
                  <span className="hidden sm:inline">{button.label}</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    multiple 
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <button 
                  onClick={() => setActiveType(activeType === button.type ? null : button.type)} 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${activeType === button.type ? button.activeClasses : `text-gray-600 ${button.hoverClasses}`}`}
                >
                  <button.Icon size={20} />
                  <span className="hidden sm:inline">{button.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? 'Đang tạo...' : (activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài')}
        </button>
      </div>
    </div>
  );
};

export default PostComposer;