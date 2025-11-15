import React, { useState, useEffect } from 'react';
import { layDanhSachChoDuyet, capNhatTrangThaiNoiDung } from '../services/apiService';
import { Check, X, Clock, FileText, Calendar } from 'lucide-react';

const DuyetBai = () => {
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await layDanhSachChoDuyet();
      if (response.success) {
        setDanhSach(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, loai, trang_thai_moi) => {
    try {
      await capNhatTrangThaiNoiDung(id, loai, trang_thai_moi);
      // Xóa mục đã xử lý khỏi danh sách trên UI
      setDanhSach(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Đã xảy ra lỗi: ' + (err.response?.data?.message || 'Vui lòng thử lại.'));
    }
  };

  if (loading) return <div className="text-center p-10">Đang tải danh sách cần duyệt...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Kiểm Duyệt Nội Dung</h1>
      {danhSach.length === 0 ? (
        <p className="text-gray-500">Không có nội dung nào đang chờ duyệt.</p>
      ) : (
        <div className="space-y-4">
          {danhSach.map((item) => (
            <div key={`${item.loai}-${item.id}`} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {item.loai === 'bai_viet' ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-blue-600"><FileText size={14} /> BÀI VIẾT</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm font-semibold text-purple-600"><Calendar size={14} /> SỰ KIỆN</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{item.tieu_de}</h2>
                  <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: item.noi_dung.substring(0, 200) + '...' }} />
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <img src={item.tac_gia.anh_dai_dien_url || '/default-avatar.png'} alt="avatar" className="w-5 h-5 rounded-full" />
                    <span>{item.tac_gia.ho_ten}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.ngay_tao).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                  <button onClick={() => handleAction(item.id, item.loai, 'da_duyet')} className="flex items-center justify-center gap-2 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium">
                    <Check size={16} /> <span>Duyệt</span>
                  </button>
                  <button onClick={() => handleAction(item.id, item.loai, 'bi_tu_choi')} className="flex items-center justify-center gap-2 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium">
                    <X size={16} /> <span>Từ chối</span>
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