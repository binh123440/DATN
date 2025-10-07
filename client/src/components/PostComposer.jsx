import { useState } from 'react'
import { Image, Calendar, MapPin, Users, Gift } from 'lucide-react'

const PostComposer = ({ onPost, currentUser }) => {
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('post') // 'post' or 'event'
  const [eventDetails, setEventDetails] = useState({
    title: '',
    date: '',
    location: '',
    maxAttendees: '',
    points: ''
  })

  const handleSubmit = () => {
    if (!content.trim()) return

    const newPost = {
      content,
      type: postType,
      ...(postType === 'event' && {
        event: {
          title: eventDetails.title,
          date: eventDetails.date,
          location: eventDetails.location,
          attendees: `0/${eventDetails.maxAttendees} Người`,
          points: `${eventDetails.points} điểm thưởng`,
          status: 'Chưa đăng ký',
          hasQR: true,
          remainingSlots: parseInt(eventDetails.maxAttendees)
        }
      })
    }

    onPost(newPost)
    setContent('')
    setPostType('post')
    setEventDetails({
      title: '',
      date: '',
      location: '',
      maxAttendees: '',
      points: ''
    })
  }

  return (
    <div className="post-card p-4">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{currentUser.avatar}</span>
        </div>
        <div className="flex-1">
          <div className="mb-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì ?"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="3"
            />
          </div>

          {/* Post Type Selector */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setPostType('post')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                postType === 'post' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Image size={16} />
              <span>Ảnh/Video</span>
            </button>
            <button
              onClick={() => setPostType('event')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                postType === 'event' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Calendar size={16} />
              <span>Sự kiện</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700">
              <Users size={16} />
              <span>Cảm xúc</span>
            </button>
          </div>

          {/* Event Details Form */}
          {postType === 'event' && (
            <div className="space-y-3 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">Chi tiết sự kiện</h4>
              <input
                type="text"
                placeholder="Tiêu đề sự kiện"
                value={eventDetails.title}
                onChange={(e) => setEventDetails({...eventDetails, title: e.target.value})}
                className="w-full p-2 border border-blue-200 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={eventDetails.date}
                  onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                  className="p-2 border border-blue-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Địa điểm"
                  value={eventDetails.location}
                  onChange={(e) => setEventDetails({...eventDetails, location: e.target.value})}
                  className="p-2 border border-blue-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Số người tối đa"
                  value={eventDetails.maxAttendees}
                  onChange={(e) => setEventDetails({...eventDetails, maxAttendees: e.target.value})}
                  className="p-2 border border-blue-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Điểm thưởng"
                  value={eventDetails.points}
                  onChange={(e) => setEventDetails({...eventDetails, points: e.target.value})}
                  className="p-2 border border-blue-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <span className="text-sm text-gray-500">Chế độ: Công khai</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Đăng bài
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostComposer
