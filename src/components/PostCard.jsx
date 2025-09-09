import { useState } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'

const PostCard = ({ post, currentUser }) => {
  const [liked, setLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
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
        <p className="text-gray-800">{post.content}</p>
      </div>

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

export default PostCard
