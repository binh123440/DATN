import React from 'react'

const RightSidebar = ({ currentUser }) => {
  return (
    <div className="w-full h-full overflow-y-auto space-y-4 custom-scrollbar">
      {/* Điểm Hoạt động Widget */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">🌟</span>
          </div>
          <span className="text-sm text-gray-600 font-medium">Điểm Hoạt động (Xét học bổng)</span>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            1,250
          </div>
          <div className="text-xs text-gray-500">điểm tích lũy</div>
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <span className="text-green-600 text-sm font-medium">🏆 Đạt 62.5% tiến độ học bổng (Mục tiêu: 2,000đ)</span>
          </div>
          
          <div className="text-center py-2">
            <p className="text-sm text-gray-600 mb-1">Xếp hạng lớp 21DTHD1</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
              <span className="text-orange-500 font-bold text-sm">Top 2/45 sinh viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lịch sử tích điểm */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">📅</span>
          </div>
          <h3 className="font-semibold text-gray-800">Lịch sử tích điểm</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">🎤</span>
              <div>
                <span className="text-sm text-gray-700">Hội thảo AI trong giáo dục</span>
                <p className="text-xs text-gray-500">Điểm danh thành công • 2 ngày trước</p>
              </div>
            </div>
            <span className="text-green-600 font-semibold text-sm">+50</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">🏀</span>
              <div>
                <span className="text-sm text-gray-700">Giải bóng rổ khoa CNTT</span>
                <p className="text-xs text-gray-500">Tham gia thi đấu • 5 ngày trước</p>
              </div>
            </div>
            <span className="text-green-600 font-semibold text-sm">+40</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">🌱</span>
              <div>
                <span className="text-sm text-gray-700">Chiến dịch trồng cây xanh</span>
                <p className="text-xs text-gray-500">Hoàn thành xuất sắc • 1 tuần trước</p>
              </div>
            </div>
            <span className="text-green-600 font-semibold text-sm">+60</span>
          </div>
        </div>
        
        <button className="w-full mt-4 text-blue-500 text-center py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
          Xem lịch sử đầy đủ
        </button>
      </div>

      {/* Sự kiện sắp diễn ra */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Sự kiện sắp diễn ra</h3>
        
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-3 py-2">
            <p className="text-sm font-medium text-gray-800">Hội thảo AI trong giáo dục</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>📅</span>
              <span>28/10/2025 - 14:00</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-orange-600 mt-1">
              <span>⭐</span>
              <span>+60 điểm hoạt động</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                Đã đăng ký
              </span>
            </div>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-3 py-2">
            <p className="text-sm font-medium text-gray-800">Workshop định hướng du học Nhật Bản</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>📅</span>
              <span>30/10/2025 - 15:30</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-orange-600 mt-1">
              <span>⭐</span>
              <span>+70 điểm hoạt động</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                Đăng ký ngay
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RightSidebar
