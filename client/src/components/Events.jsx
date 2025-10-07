import { useState } from 'react'
import { Calendar, MapPin, Users, Gift, Plus, Filter } from 'lucide-react'

const Events = ({ currentUser }) => {
  const [events] = useState([
    {
      id: 1,
      title: 'Workshop: AI trong giáo dục hiện đại',
      date: '25/08/2025 - 14:00',
      location: 'Hội trường - Khu B',
      organizer: 'Khoa CNTT',
      attendees: 67,
      maxAttendees: 100,
      points: 80,
      status: 'registered',
      category: 'workshop',
      image: '🤖'
    },
    {
      id: 2,
      title: 'Hội thảo định hướng nghề nghiệp',
      date: '28/08/2025 - 09:00',
      location: 'Phòng 101 - Khu A',
      organizer: 'Phòng Đào tạo',
      attendees: 45,
      maxAttendees: 80,
      points: 60,
      status: 'available',
      category: 'seminar',
      image: '💼'
    },
    {
      id: 3,
      title: 'Cuộc thi lập trình ACM',
      date: '30/08/2025 - 13:00',
      location: 'Phòng Lab 1 - Khu B',
      organizer: 'CLB Lập trình',
      attendees: 24,
      maxAttendees: 40,
      points: 100,
      status: 'available',
      category: 'competition',
      image: '💻'
    }
  ])

  const [filter, setFilter] = useState('all')

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    if (filter === 'registered') return event.status === 'registered'
    if (filter === 'available') return event.status === 'available'
    return true
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sự kiện</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Tạo sự kiện</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilter('registered')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'registered' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Đã đăng ký
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'available' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Có thể tham gia
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{event.image}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-500">bởi {event.organizer}</p>
                  </div>
                </div>
                {event.status === 'registered' && (
                  <span className="text-green-600 text-sm font-medium">✅</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{event.attendees}/{event.maxAttendees} người</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Gift size={16} className="text-yellow-600" />
                  <span className="font-semibold text-yellow-600">{event.points} điểm thưởng</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {event.status === 'registered' ? (
                  <button className="flex-1 bg-green-50 text-green-600 border border-green-200 py-2 rounded-lg font-medium">
                    Đã đăng ký
                  </button>
                ) : (
                  <button className="flex-1 btn-primary mr-2">
                    Đăng ký tham gia
                  </button>
                )}
                <div className="text-xs text-gray-500">
                  {event.maxAttendees - event.attendees} chỗ trống
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Events
