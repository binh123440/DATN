import { useState } from 'react'
import { Search, Phone, Video, MoreHorizontal, Send } from 'lucide-react'

const Chat = ({ currentUser }) => {
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState('')
  
  const chats = [
    {
      id: 1,
      name: 'Nhóm CNTT K17',
      lastMessage: 'Ai có tài liệu môn Cơ sở dữ liệu không?',
      time: '10:30',
      unread: 3,
      isGroup: true,
      avatar: '💻'
    },
    {
      id: 2,
      name: 'Nguyễn Văn A',
      lastMessage: 'Hẹn gặp lại bạn ở thư viện nhé',
      time: '09:15',
      unread: 0,
      isGroup: false,
      avatar: 'NA'
    },
    {
      id: 3,
      name: 'CLB AI & ML',
      lastMessage: 'Workshop vào chủ nhật này nha mọi người',
      time: '08:45',
      unread: 5,
      isGroup: true,
      avatar: '🤖'
    }
  ]

  const messages = [
    {
      id: 1,
      sender: 'Trần Thị B',
      content: 'Chào mọi người!',
      time: '10:15',
      isMe: false
    },
    {
      id: 2,
      sender: 'Lê Hà Bình',
      content: 'Ai có tài liệu môn Cơ sở dữ liệu không?',
      time: '10:25',
      isMe: true
    },
    {
      id: 3,
      sender: 'Nguyễn Văn C',
      content: 'Mình có, gửi link drive cho mọi người nhé: https://drive.google.com/...',
      time: '10:28',
      isMe: false
    },
    {
      id: 4,
      sender: 'Lê Hà Bình',
      content: 'Cảm ơn bạn nhiều! 😊',
      time: '10:30',
      isMe: true
    }
  ]

  const selectedChatInfo = chats.find(chat => chat.id === selectedChat)

  const sendMessage = () => {
    if (message.trim()) {
      // Logic gửi tin nhắn
      setMessage('')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex">
        {/* Chat List */}
        <div className="w-1/3 border-r border-gray-200">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto h-full">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat === chat.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {chat.isGroup ? (
                      <span className="text-xl">{chat.avatar}</span>
                    ) : (
                      <span className="text-white font-semibold">{chat.avatar}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                {selectedChatInfo?.isGroup ? (
                  <span className="text-lg">{selectedChatInfo.avatar}</span>
                ) : (
                  <span className="text-white font-semibold text-sm">{selectedChatInfo?.avatar}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedChatInfo?.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedChatInfo?.isGroup ? 'Nhóm' : 'Đang hoạt động'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Phone size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Video size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    msg.isMe
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!msg.isMe && selectedChatInfo?.isGroup && (
                    <p className="text-xs font-semibold mb-1 opacity-75">{msg.sender}</p>
                  )}
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={sendMessage}
                className="btn-primary p-3"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
