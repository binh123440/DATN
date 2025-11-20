import React, { useState, useEffect } from 'react';
import { Calendar, Star, TrendingUp, Award } from 'lucide-react';
import { 
  layThongTinDiemRenLuyen, 
  layLichSuTichDiem, 
  laySuKienSapDienRa 
} from '../services/apiService';

const RightSidebar = ({ currentUser }) => {
  const [thongTinDiem, setThongTinDiem] = useState(null);
  const [lichSu, setLichSu] = useState([]);
  const [suKienSapDienRa, setSuKienSapDienRa] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Lấy thông tin điểm rèn luyện
        const thongTinResponse = await layThongTinDiemRenLuyen();
        if (thongTinResponse.success) {
          setThongTinDiem(thongTinResponse.data);
        }

        // Lấy lịch sử tích điểm
        const lichSuResponse = await layLichSuTichDiem(3);
        if (lichSuResponse.success) {
          setLichSu(lichSuResponse.data);
        }

        // Lấy sự kiện sắp diễn ra
        const suKienResponse = await laySuKienSapDienRa(2);
        if (suKienResponse.success) {
          setSuKienSapDienRa(suKienResponse.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu RightSidebar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 custom-scrollbar">
      {/* Điểm Hoạt động Widget */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-gray-600 font-medium">Điểm Hoạt động (Xét học bổng)</span>
        </div>
        
        {thongTinDiem && (
          <>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {thongTinDiem.tong_diem.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">điểm tích lũy</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${thongTinDiem.xep_loai.bgColor} ${thongTinDiem.xep_loai.mauSac}`}>
                {thongTinDiem.xep_loai.loai}
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <span className="text-green-600 text-sm font-medium">
                  🏆 Đạt {thongTinDiem.ti_le_hoan_thanh}% tiến độ học bổng (Mục tiêu: {thongTinDiem.muc_tieu.toLocaleString()}đ)
                </span>
              </div>
              
              <div className="text-center py-2">
                <p className="text-sm text-gray-600 mb-1">Xếp hạng lớp</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                  <span className="text-orange-500 font-bold text-sm">
                    Top {thongTinDiem.xep_hang}/{thongTinDiem.tong_so_sinh_vien} sinh viên
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lịch sử tích điểm */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-800">Lịch sử tích điểm</h3>
        </div>
        
        <div className="space-y-3">
          {lichSu.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Chưa có lịch sử tích điểm</p>
          ) : (
            lichSu.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-green-500">✓</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 block truncate">{item.ten_su_kien}</span>
                    <p className="text-xs text-gray-500">Điểm danh thành công • {item.mo_ta_ngay}</p>
                  </div>
                </div>
                <span className="text-green-600 font-semibold text-sm ml-2">+{item.diem}</span>
              </div>
            ))
          )}
        </div>
        
        <button className="w-full mt-4 text-blue-500 text-center py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
          Xem lịch sử đầy đủ
        </button>
      </div>

      {/* Sự kiện sắp diễn ra */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Sự kiện sắp diễn ra</h3>
        </div>
        
        <div className="space-y-3">
          {suKienSapDienRa.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Không có sự kiện nào sắp diễn ra</p>
          ) : (
            suKienSapDienRa.map((suKien, index) => (
              <div 
                key={suKien.id} 
                className={`border-l-4 ${index % 2 === 0 ? 'border-blue-500' : 'border-purple-500'} pl-3 py-2`}
              >
                <p className="text-sm font-medium text-gray-800">{suKien.ten_su_kien}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(suKien.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-orange-600 mt-1">
                  <Award className="w-3 h-3" />
                  <span>+{suKien.diem_thuong} điểm hoạt động</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                    suKien.da_dang_ky 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {suKien.da_dang_ky ? 'Đã đăng ký' : 'Đăng ký ngay'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
