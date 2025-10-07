import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Phone, Video, MoreHorizontal, Send } from 'lucide-react';

// --- Dữ liệu mẫu (Trong ứng dụng thực tế sẽ lấy từ API) ---
const CHAT_LIST_DATA = [
  { id: 1, name: 'Nhóm CNTT K17', lastMessage: 'Ai có tài liệu môn Cơ sở dữ liệu không?', time: '10:30', unread: 3, isGroup: true, avatar: '💻' },
  { id: 2, name: 'Nguyễn Văn A', lastMessage: 'Hẹn gặp lại bạn ở thư viện nhé', time: '09:15', unread: 0, isGroup: false, avatar: 'NA' },
  { id: 3, name: 'CLB AI & ML', lastMessage: 'Workshop vào chủ nhật này nha mọi người', time: '08:45', unread: 5, isGroup: true, avatar: '🤖' }
];

const MESSAGES_DATA = {
  1: [
    { id: 1, sender: 'Trần Thị B', content: 'Chào mọi người!', time: '10:15', isMe: false },
    { id: 2, sender: 'Lê Hà Bình', content: 'Ai có tài liệu môn Cơ sở dữ liệu không?', time: '10:25', isMe: true },
    { id: 3, sender: 'Nguyễn Văn C', content: 'Mình có, gửi link drive cho mọi người nhé: https://drive.google.com/...', time: '10:28', isMe: false },
    { id: 4, sender: 'Lê Hà Bình', content: 'Cảm ơn bạn nhiều! 😊', time: '10:30', isMe: true }
  ],
  2: [{ id: 1, sender: 'Nguyễn Văn A', content: 'Hẹn gặp lại bạn ở thư viện nhé', time: '09:15', isMe: false }],
  3: [{ id: 1, sender: 'Admin CLB', content: 'Workshop vào chủ nhật này nha mọi người', time: '08:45', isMe: false }]
};

// --- Các Component con được tối ưu ---

const ChatItem = React.memo(({ chat, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(chat.id)}
    className={`p-4 border-b border-gray-100 cursor-pointer flex items-center space-x-3 transition-colors duration-150 ${
      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-gray-50'
    }`}
  >
    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
      {chat.isGroup ? <span className="text-xl">{chat.avatar}</span> : <span>{chat.avatar}</span>}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
        <span className="text-xs text-gray-500">{chat.time}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
        {chat.unread > 0 && (
          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
            {chat.unread}
          </div>
        )}
      </div>
    </div>
  </div>
));

const ChatList = React.memo(({ chats, selectedChatId, onSelectChat }) => (
  <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
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
    <div className="overflow-y-auto flex-1">
      {chats.map(chat => (
        <ChatItem key={chat.id} chat={chat} isSelected={selectedChatId === chat.id} onSelect={onSelectChat} />
      ))}
    </div>
  </div>
));

const ChatHeader = React.memo(({ chatInfo }) => {
  if (!chatInfo) return null;
  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 z-10 bg-white">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
          {chatInfo.isGroup ? <span className="text-lg">{chatInfo.avatar}</span> : <span className="text-sm">{chatInfo.avatar}</span>}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{chatInfo.name}</h3>
          <p className="text-sm text-gray-500">{chatInfo.isGroup ? 'Nhóm' : 'Đang hoạt động'}</p>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        {[Phone, Video, MoreHorizontal].map((Icon, index) => (
          <button key={index} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
});

const Message = React.memo(({ msg, isGroupChat }) => (
  <div className={`flex items-end space-x-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
    {!msg.isMe && <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>}
    <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
      {!msg.isMe && isGroupChat && <p className="text-xs font-semibold mb-1 text-blue-500">{msg.sender}</p>}
      <p className="leading-relaxed">{msg.content}</p>
      <p className={`text-xs mt-1 text-right ${msg.isMe ? 'text-blue-100' : 'text-gray-500'}`}>{msg.time}</p>
    </div>
  </div>
));

const MessageInput = React.memo(({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white">
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={!message.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

// --- Component Cha ---

const Chat = ({ currentUser }) => {
  const [selectedChatId, setSelectedChatId] = useState(1);
  const messagesEndRef = useRef(null);

  const chats = CHAT_LIST_DATA;
  const messages = MESSAGES_DATA[selectedChatId] || [];
  const selectedChatInfo = chats.find(chat => chat.id === selectedChatId);

  const handleSelectChat = useCallback((id) => {
    setSelectedChatId(id);
  }, []);

  const handleSendMessage = useCallback((messageContent) => {
    // Logic gửi tin nhắn (hiện tại chỉ log ra console)
    console.log(`Gửi đến chat ${selectedChatId}:`, messageContent);
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="flex flex-1 min-h-0">
          <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
          
          <div className="flex-1 flex flex-col relative">
            <ChatHeader chatInfo={selectedChatInfo} />
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 flex flex-col justify-end">
              {messages.map(msg => (
                <Message key={msg.id} msg={msg} isGroupChat={selectedChatInfo?.isGroup} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
