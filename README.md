# UTE Social - Mạng xã hội sinh viên

Một nền tảng mạng xã hội được thiết kế đặc biệt cho sinh viên Đại học Sư phạm Kỹ thuật TP. Đà Nẵng (UTE) với các tính năng:

## 🚀 Tính năng chính

### 📱 Mạng xã hội cơ bản
- **Feed bài viết**: Chia sẻ thoughts, ảnh, video
- **Nhóm/Groups**: Tham gia các nhóm học tập, câu lạc bộ
- **Chat**: Tin nhắn trực tiếp và nhóm chat
- **Profile**: Quản lý thông tin cá nhân

### 🎯 Hệ thống sự kiện đặc biệt
- **Tạo sự kiện**: Tổ chức workshop, hội thảo, cuộc thi
- **Đăng ký tham gia**: Sinh viên có thể đăng ký tham gia sự kiện
- **QR Code điểm danh**: Sinh viên quét mã QR để điểm danh tại sự kiện
- **Quản lý sự kiện**: Người tổ chức có thể quản lý attendees

### 🏆 Hệ thống điểm thưởng
- **Tích điểm**: Nhận điểm khi tham gia sự kiện, đăng bài chất lượng
- **Mua đồ uống**: Sử dụng điểm để mua đồ uống tại máy bán hàng tự động
- **Leaderboard**: Bảng xếp hạng người tham gia tích cực nhất

## 🛠 Công nghệ sử dụng

- **Frontend**: React.js + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **QR Code**: QRCode.js + QRCode-reader
- **State Management**: React Hooks

## 📦 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js 16.0 hoặc cao hơn
- npm hoặc yarn

### Cách cài đặt

1. **Cài đặt dependencies**
```bash
npm install
```

2. **Chạy development server**
```bash
npm run dev
```

3. **Truy cập ứng dụng**
Mở trình duyệt và truy cập: http://localhost:5173

### Scripts có sẵn

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run preview      # Preview production build
npm run lint         # Chạy linting
```

## 🎨 Giao diện người dùng

Giao diện được thiết kế theo phong cách hiện đại, dễ sử dụng với:
- **Sidebar navigation**: Điều hướng chính bên trái
- **Header thông tin**: Hiển thị thông tin user và điểm thưởng
- **Feed chính**: Hiển thị bài viết và sự kiện
- **Responsive design**: Tương thích với mọi thiết bị

## 📱 Tính năng chi tiết

### Đăng bài viết thường
- Text content
- Đính kèm ảnh/video
- Reactions (like, comment, share)

### Tạo sự kiện
- Thông tin cơ bản: Tên, thời gian, địa điểm
- Số lượng người tham gia tối đa
- Điểm thưởng cho người tham gia
- Tự động generate QR code cho điểm danh

### Hệ thống điểm danh QR
- Sinh viên đăng ký sự kiện → Nhận QR code
- Tại sự kiện: Quét QR để điểm danh
- Sau khi điểm danh → Nhận điểm thưởng

### Sử dụng điểm thưởng
- Xem số điểm hiện có
- Quy đổi điểm thành đồ uống
- Lịch sử sử dụng điểm

## 🗂 Cấu trúc thư mục

```
src/
├── components/           # React components
│   ├── Sidebar.jsx      # Navigation sidebar
│   ├── Header.jsx       # Top header với thông tin user
│   ├── Feed.jsx         # Main feed
│   ├── PostComposer.jsx # Tạo bài viết
│   ├── PostCard.jsx     # Hiển thị bài viết
│   ├── EventCard.jsx    # Hiển thị sự kiện
│   ├── Groups.jsx       # Trang nhóm
│   ├── Events.jsx       # Trang sự kiện
│   ├── Chat.jsx         # Trang chat
│   └── Profile.jsx      # Trang cá nhân
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles với Tailwind
```

## 🔮 Roadmap tương lai

- [ ] Backend API integration
- [ ] Real-time chat với WebSocket
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics cho admin
- [ ] Integration với hệ thống máy bán hàng thật
- [ ] AI chatbot hỗ trợ sinh viên

## 🤝 Đóng góp

Dự án này được phát triển như một đồ án tốt nghiệp. Mọi góp ý và đóng góp đều được chào đón!

## 📄 License

This project is licensed under the MIT License.

---

**UTE Social** - Kết nối sinh viên, chia sẻ kiến thức, xây dựng cộng đồng học tập tích cực! 🎓✨
