import { Calendar, MapPin, Users } from 'lucide-react'

const UpcomingEvents = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: 'Hội thảo AI trong giáo dục',
      date: '26/08/2025 - 15:00',
      attendees: '+60 điểm',
      status: 'registered'
    },
    {
      id: 2,
      title: 'Workshop về định hướng du học Nhật Bản',
      date: '26/08/2025 - 15:00',
      attendees: '+60 điểm',
      status: 'available'
    }
  ]

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="font-bold text-gray-900 mb-4">Sự kiện sắp tới</h3>
      <div className="space-y-3">
        {upcomingEvents.map(event => (
          <div key={event.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">{event.title}</h4>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex items-center space-x-2">
                <Calendar size={12} />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-600">🎯</span>
                  <span className="font-medium">{event.attendees}</span>
                </div>
                {event.status === 'registered' ? (
                  <span className="text-green-600 font-medium">✅ Đã đăng ký</span>
                ) : (
                  <button className="text-blue-600 hover:underline font-medium">
                    Đăng ký
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpcomingEvents
