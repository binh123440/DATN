import { useState } from 'react'
import { Edit, Camera, MapPin, Calendar, Mail, Phone } from 'lucide-react'

const Profile = ({ currentUser }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: currentUser.name,
    bio: 'Sinh viên năm 3 ngành Công nghệ Thông tin, đam mê AI và Machine Learning',
    location: 'TP. Hồ Chí Minh',
    joinDate: 'Tham gia từ tháng 9, 2022',
    email: 'lehabinh@student.ute.edu.vn',
    phone: '0123456789',
    totalPoints: currentUser.points,
    eventsAttended: 15,
    postsCreated: 23
  })

  const recentActivities = [
    {
      id: 1,
      type: 'event',
      title: 'Tham gia Workshop AI trong giáo dục',
      points: '+80',
      date: '24/08/2025'
    },
    {
      id: 2,
      type: 'post',
      title: 'Đăng bài viết về Machine Learning',
      points: '+20',
      date: '23/08/2025'
    },
    {
      id: 3,
      type: 'event',
      title: 'Tham gia Hackathon UTE 2025',
      points: '+150',
      date: '20/08/2025'
    }
  ]

  const achievements = [
    { title: 'Người tham gia tích cực', icon: '🏆', earned: true },
    { title: 'Chuyên gia AI', icon: '🤖', earned: true },
    { title: 'Người chia sẻ', icon: '🌟', earned: false },
    { title: 'Thành viên VIP', icon: '👑', earned: false }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{currentUser.avatar}</span>
            </div>
            <button className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50">
              <Camera size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit size={16} />
                <span>Chỉnh sửa</span>
              </button>
            </div>
            
            <p className="text-gray-600 mb-3">{profile.bio}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>{profile.joinDate}</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Mail size={16} />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone size={16} />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Tổng điểm</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{profile.eventsAttended}</div>
            <div className="text-sm text-gray-500">Sự kiện đã tham gia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.postsCreated}</div>
            <div className="text-sm text-gray-500">Bài viết đã tạo</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {activity.type === 'event' ? '📅' : '📝'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <span className="text-green-600 font-bold text-sm">{activity.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thành tích</h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 text-center ${
                  achievement.earned
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className={`font-semibold text-sm ${
                  achievement.earned ? 'text-yellow-800' : 'text-gray-500'
                }`}>
                  {achievement.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Points History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử điểm thưởng</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <h4 className="font-semibold text-gray-900">Workshop AI trong giáo dục hiện đại</h4>
              <p className="text-sm text-gray-500">25/08/2025 - 14:00</p>
            </div>
            <span className="text-green-600 font-bold">+80 điểm</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <h4 className="font-semibold text-gray-900">Đăng bài viết chất lượng</h4>
              <p className="text-sm text-gray-500">24/08/2025 - 10:30</p>
            </div>
            <span className="text-green-600 font-bold">+20 điểm</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-semibold text-gray-900">Tham gia thảo luận nhóm</h4>
              <p className="text-sm text-gray-500">23/08/2025 - 16:45</p>
            </div>
            <span className="text-green-600 font-bold">+10 điểm</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
