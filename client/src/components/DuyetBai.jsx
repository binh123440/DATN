import React, { useState, useEffect } from 'react';
import { layDanhSachChoDuyet, capNhatTrangThaiNoiDung } from '../services/apiService';
import { Check, X, Clock, FileText, Calendar, AlertCircle } from 'lucide-react';

const DuyetBai = () => {
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await layDanhSachChoDuyet();
      
      console.log('📊 Dữ liệu nhận được:', response);
      
      if (response.success) {
        setDanhSach(response.data || []);
      } else {
        setError(response.message || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      console.error('❌ Lỗi fetchData:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, loai, trang_thai_moi) => {
    const confirmMessage = trang_thai_moi === 'da_duyet' 
      ? 'Bạn có chắc muốn duyệt nội dung này?' 
      : 'Bạn có chắc muốn từ chối nội dung này?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await capNhatTrangThaiNoiDung(id, loai, trang_thai_moi);
      
      // Xóa mục đã xử lý khỏi danh sách
      setDanhSach(prev => prev.filter(item => !(item.id === id && item.loai === loai)));
      
      alert(`✅ ${trang_thai_moi === 'da_duyet' ? 'Đã duyệt' : 'Đã từ chối'} thành công!`);
    } catch (err) {
      console.error('❌ Lỗi handleAction:', err);
      alert('Đã xảy ra lỗi: ' + (err.response?.data?.message || 'Vui lòng thử lại.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách cần duyệt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
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
          {danhSach.map((item) => (
            <div 
              key={`${item.loai}-${item.id}`} 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1">
                  {/* Badge loại nội dung */}
                  <div className="flex items-center gap-2 mb-3">
                    {item.loai === 'bai_viet' ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText size={16} /> BÀI VIẾT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        <Calendar size={16} /> SỰ KIỆN
                      </span>
                    )}
                  </div>

                  {/* Nội dung */}
                  <div 
                    className="text-sm text-gray-600 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: item.noi_dung?.substring(0, 300) + (item.noi_dung?.length > 300 ? '...' : '') 
                    }} 
                  />

                  {/* Thông tin tác giả */}
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
                </div>

                {/* Action buttons */}
                <div className="flex lg:flex-col gap-3">
                  <button 
                    onClick={() => handleAction(item.id, item.loai, 'da_duyet')} 
                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    <Check size={18} /> <span>Duyệt</span>
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, item.loai, 'bi_tu_choi')} 
                    className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    <X size={18} /> <span>Từ chối</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuyetBai;