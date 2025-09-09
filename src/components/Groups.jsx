import { useState } from 'react'
import { Users, Plus, Search } from 'lucide-react'

const Groups = ({ currentUser }) => {
  const [groups] = useState([
    {
      id: 1,
      name: 'Khoa Công nghệ Thông tin',
      members: 2341,
      posts: 156,
      image: '🖥️',
      joined: true
    },
    {
      id: 2,
      name: 'Câu lạc bộ AI & Machine Learning',
      members: 587,
      posts: 89,
      image: '🤖',
      joined: true
    },
    {
      id: 3,
      name: 'Sinh viên năm nhất 2024',
      members: 1234,
      posts: 245,
      image: '🎓',
      joined: false
    }
  ])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhóm của bạn</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Tạo nhóm mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-4xl">{group.image}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{group.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{group.members.toLocaleString()} thành viên</span>
                    <span>{group.posts} bài viết</span>
                  </div>
                </div>
              </div>
              
              {group.joined ? (
                <button className="w-full bg-green-50 text-green-600 border border-green-200 py-2 rounded-lg font-medium">
                  ✅ Đã tham gia
                </button>
              ) : (
                <button className="w-full btn-primary">
                  Tham gia nhóm
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Groups
