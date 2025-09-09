import { useState, useRef } from 'react'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Calendar,
  MapPin,
  Users,
  Gift,
  QrCode,
  CheckCircle2
} from 'lucide-react'
import QRCode from 'qrcode'

const EventCard = ({ post, currentUser }) => {
  const [liked, setLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isRegistered, setIsRegistered] = useState(post.event.status === 'Đã đăng ký')
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const canvasRef = useRef(null)

  const generateQRCode = async () => {
    try {
      const attendanceData = {
        eventId: post.id,
        userId: currentUser.id,
        eventTitle: post.event.title,
        attendeeInfo: currentUser.name,
        timestamp: new Date().toISOString()
      }
      
      const qrData = JSON.stringify(attendanceData)
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      })
      
      setQrDataUrl(dataUrl)
      setShowQR(true)
    } catch (error) {
      console.error('Lỗi tạo QR code:', error)
    }
  }

  const handleRegister = () => {
    setIsRegistered(true)
    // Thêm logic đăng ký sự kiện ở đây
  }

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{post.author.avatar}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
            <p className="text-sm text-gray-500">{post.author.time}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 mb-3">{post.content}</p>
      </div>

      {/* Event Card */}
      <div className="mx-4 mb-4 event-card">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-blue-900 text-lg">{post.event.title}</h3>
          {isRegistered && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Đã đăng ký</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar size={16} className="text-blue-600" />
            <span>{post.event.date}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin size={16} className="text-blue-600" />
            <span>{post.event.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Users size={16} className="text-blue-600" />
            <span>{post.event.attendees}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Gift size={16} className="text-yellow-600" />
            <span className="font-semibold text-yellow-600">{post.event.points}</span>
          </div>
        </div>

        {/* Event Actions */}
        <div className="flex items-center justify-between">
          {!isRegistered ? (
            <button
              onClick={handleRegister}
              className="btn-primary flex-1 mr-2"
            >
              Đăng ký tham gia
            </button>
          ) : (
            <button
              onClick={generateQRCode}
              className="btn-primary flex-1 mr-2 flex items-center justify-center space-x-2"
            >
              <QrCode size={18} />
              <span>Xem mã QR</span>
            </button>
          )}
          
          <div className="text-sm text-blue-600 font-medium bg-white px-3 py-2 rounded-lg border border-blue-200">
            {post.event.remainingSlots} chỗ còn lại
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="font-bold text-gray-900 mb-4 text-center">Mã QR Điểm danh</h3>
            <div className="text-center mb-4">
              <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-lg border" />
            </div>
            <div className="text-sm text-gray-600 text-center mb-4">
              <p className="font-semibold">{post.event.title}</p>
              <p>{post.event.date}</p>
              <p className="text-blue-600 font-medium">Người tham gia: {currentUser.name}</p>
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="w-full btn-secondary"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{post.likes} lượt thích</span>
          <div className="flex space-x-4">
            <span>{post.comments} bình luận</span>
            <span>{post.shares} chia sẻ</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>Thích</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={18} />
            <span>Bình luận</span>
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Share2 size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">{currentUser.avatar}</span>
            </div>
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 p-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="text-sm text-gray-500">
            Chưa có bình luận nào.
          </div>
        </div>
      )}
    </div>
  )
}

export default EventCard
