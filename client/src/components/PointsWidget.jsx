import React from 'react'

const PointsWidget = ({ currentUser }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">🎯</span>
        <span className="text-sm text-gray-600">Điểm thưởng của bạn</span>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-blue-600 mb-1">
          {currentUser.points.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">điểm hiện có</div>
      </div>

      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
          <span className="text-green-600 text-sm font-medium">☕ Có thể mua 83 ly cà phê</span>
        </div>
        
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">Mức độ tích cực</p>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-green-500">🔥</span>
            <span className="text-green-500 font-bold text-sm">Xuất sắc</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PointsWidget
