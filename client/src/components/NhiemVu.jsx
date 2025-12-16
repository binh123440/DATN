import React, { useState, useEffect } from 'react';
import { layNhiemVuCuaToi, submitNhiemVu } from '../services/apiService';
import { 
  Check, Clock, Calendar, MapPin, User, 
  AlertCircle, CheckCircle, XCircle, Send,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';

const NhiemVu = () => {
  const [nhiemVus, setNhiemVus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [ketQuaSubmit, setKetQuaSubmit] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await layNhiemVuCuaToi();
      if (response.success) {
        setNhiemVus(response.data || []);
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

  const handleSubmit = async (idSuKien, taskIndex) => {
    const ketQua = ketQuaSubmit[`${idSuKien}-${taskIndex}`];
    
    console.log('🚀 handleSubmit called:', { idSuKien, taskIndex, ketQua });
    
    if (!ketQua || ketQua.trim() === '') {
      alert('Vui lòng nhập kết quả nhiệm vụ');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn gửi kết quả này?')) return;

    try {
      console.log('📤 Gọi API submitNhiemVu...');
      const response = await submitNhiemVu(idSuKien, taskIndex, ketQua);
      console.log('✅ Response:', response);
      
      alert('✅ Đã gửi kết quả thành công!');
      fetchData(); // Reload dữ liệu
      setKetQuaSubmit(prev => {
        const newState = { ...prev };
        delete newState[`${idSuKien}-${taskIndex}`];
        return newState;
      });
    } catch (err) {
      console.error('❌ Lỗi submit:', err);
      console.error('Error response:', err.response);
      alert('Đã xảy ra lỗi: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại.'));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getTrangThaiInfo = (trangThai) => {
    switch (trangThai) {
      case 'chua_lam':
        return { text: 'Chưa làm', color: 'gray', icon: Clock, bg: 'bg-gray-100', textColor: 'text-gray-700' };
      case 'cho_duyet':
        return { text: 'Chờ duyệt', color: 'yellow', icon: Clock, bg: 'bg-yellow-100', textColor: 'text-yellow-700' };
      case 'da_duyet':
        return { text: 'Đã duyệt', color: 'green', icon: CheckCircle, bg: 'bg-green-100', textColor: 'text-green-700' };
      case 'bi_tu_choi':
        return { text: 'Bị từ chối', color: 'red', icon: XCircle, bg: 'bg-red-100', textColor: 'text-red-700' };
      default:
        return { text: 'Chưa rõ', color: 'gray', icon: AlertCircle, bg: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  const isOverdue = (deadline) => {
    return deadline && new Date(deadline) < new Date();
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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold">Nhiệm Vụ Của Tôi</h1>
        <p className="mt-2 text-blue-100">
          Tổng số: <span className="font-semibold">{nhiemVus.length}</span> nhiệm vụ được giao
        </p>
      </div>

      {nhiemVus.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Chưa có nhiệm vụ nào</h2>
          <p className="text-gray-500">Bạn chưa được giao nhiệm vụ nào trong các sự kiện</p>
        </div>
      ) : (
        <div className="space-y-4">
          {nhiemVus.map((nv) => {
            const isExpanded = expandedId === `${nv.id_su_kien}-${nv.task_index}`;
            const trangThaiInfo = getTrangThaiInfo(nv.trang_thai);
            const Icon = trangThaiInfo.icon;
            const overdue = isOverdue(nv.deadline);
            const canSubmit = nv.trang_thai === 'chua_lam' || nv.trang_thai === 'bi_tu_choi';

            return (
              <div 
                key={`${nv.id_su_kien}-${nv.task_index}`} 
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {nv.ten_nhiem_vu}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" />
                        Sự kiện: <span className="font-medium">{nv.ten_su_kien}</span>
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${trangThaiInfo.bg} ${trangThaiInfo.textColor}`}>
                      <Icon size={16} /> {trangThaiInfo.text}
                    </span>
                  </div>

                  {/* Mô tả */}
                  {nv.mo_ta && (
                    <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg">
                      {nv.mo_ta}
                    </p>
                  )}

                  {/* Thông tin chi tiết */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className={overdue ? "text-red-500" : "text-orange-500"} />
                      <span className={overdue ? "text-red-600 font-semibold" : "text-gray-700"}>
                        Hạn: {new Date(nv.deadline).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-red-500" />
                      <span className="text-gray-700">{nv.dia_diem}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-blue-500" />
                      <span className="text-gray-700">{nv.nguoi_tao?.ho_ten}</span>
                    </div>
                  </div>

                  {overdue && nv.trang_thai === 'chua_lam' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-red-700 text-sm font-medium">Nhiệm vụ đã quá hạn!</span>
                    </div>
                  )}

                  {/* Kết quả đã submit */}
                  {nv.ket_qua && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleExpand(`${nv.id_su_kien}-${nv.task_index}`)}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm mb-2"
                      >
                        <FileText size={16} />
                        <span>Kết quả đã gửi</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {isExpanded && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
                          <p className="text-gray-700 whitespace-pre-wrap">{nv.ket_qua}</p>
                          {nv.ngay_nop && (
                            <p className="text-xs text-gray-500 mt-2">
                              Đã gửi lúc: {new Date(nv.ngay_nop).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form submit (chỉ hiện khi có thể submit) */}
                  {canSubmit && (
                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kết quả thực hiện nhiệm vụ
                      </label>
                      <textarea
                        value={ketQuaSubmit[`${nv.id_su_kien}-${nv.task_index}`] || ''}
                        onChange={(e) => setKetQuaSubmit(prev => ({
                          ...prev,
                          [`${nv.id_su_kien}-${nv.task_index}`]: e.target.value
                        }))}
                        placeholder="Mô tả chi tiết kết quả thực hiện, bằng chứng, hình ảnh (link), v.v..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none mb-3"
                      />
                      <button
                        onClick={() => handleSubmit(nv.id_su_kien, nv.task_index)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
                      >
                        <Send size={18} /> <span>Gửi Kết Quả</span>
                      </button>
                    </div>
                  )}

                  {/* Feedback từ người duyệt */}
                  {nv.feedback && nv.trang_thai === 'bi_tu_choi' && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Phản hồi từ người duyệt:
                      </h5>
                      <p className="text-red-700 whitespace-pre-wrap">{nv.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NhiemVu;