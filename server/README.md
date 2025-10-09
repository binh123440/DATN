# UTE Social - Backend API

Backend cho nền tảng mạng xã hội UTE Social, sử dụng Node.js, Express và PostgreSQL.

## � Technology Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize
- **Authentication**: JWT (sẽ thêm)

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
```bash
cp .env.example .env
# Sửa thông tin database trong .env
```

### 3. Setup database
```bash
npm run setup-db
```

### 4. Chạy server
```bash
npm run dev
```

Server chạy tại: `http://localhost:5000`

📖 **Chi tiết setup**: Xem file [SETUP.md](./SETUP.md)

## 📊 Database Models

Hệ thống gồm 13 bảng chính:

### 👤 Quản lý người dùng
- **NguoiDung** - Thông tin người dùng
- **Khoa** - Các khoa
- **Nganh** - Các ngành học

### � Chat & Gọi
- **CuocHoiThoai** - Cuộc trò chuyện
- **ThanhVienHoiThoai** - Thành viên nhóm
- **TinNhan** - Tin nhắn
- **CuocGoi** - Cuộc gọi

### 📝 Nội dung
- **BaiViet** - Bài viết (với kiểm duyệt)
- **BinhLuan** - Bình luận
- **LuotThich** - Lượt thích

### 🎉 Sự kiện
- **SuKien** - Sự kiện với QR check-in
- **DangKySuKien** - Đăng ký & điểm danh

### 🔔 Khác
- **ThongBao** - Hệ thống thông báo

## 🔗 API Endpoints

### Health Check
```bash
GET /api/health
```

### Database Test
```bash
GET /api/db-test
```

## 📁 Cấu trúc thư mục

```
server/
├── src/
│   ├── config/
│   │   └── database.js        # Cấu hình PostgreSQL
│   └── models/                # 13 models
│       ├── index.js           # Export & relationships
│       ├── NguoiDung.js
│       ├── Khoa.js
│       ├── Nganh.js
│       ├── CuocHoiThoai.js
│       ├── ThanhVienHoiThoai.js
│       ├── TinNhan.js
│       ├── CuocGoi.js
│       ├── BaiViet.js
│       ├── BinhLuan.js
│       ├── LuotThich.js
│       ├── SuKien.js
│       ├── DangKySuKien.js
│       └── ThongBao.js
├── .env                       # Environment config
├── .env.example              # Template
├── package.json
├── server.js                 # Entry point
├── setup-db.js               # Database setup script
├── README.md                 # This file
└── SETUP.md                  # Hướng dẫn chi tiết
```

## 🎯 Tính năng chính

### ✅ Đã hoàn thành
- [x] Kết nối PostgreSQL với Sequelize
- [x] 13 models đầy đủ theo schema
- [x] Relationships (associations) hoàn chỉnh
- [x] Auto-sync database
- [x] Health check endpoints

### 🔄 Sẽ phát triển
- [ ] Authentication (JWT + bcrypt)
- [ ] Authorization middleware
- [ ] CRUD APIs cho từng model
- [ ] File upload (Cloudinary)
- [ ] Real-time chat (Socket.io)
- [ ] QR code generation/validation
- [ ] Email notifications
- [ ] Hệ thống kiểm duyệt

## � Scripts

```bash
npm run dev        # Development với nodemon
npm start          # Production
npm run setup-db   # Setup database lần đầu
```

## 🔒 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ute_social
DB_USER=postgres
DB_PASSWORD=your_password

# CORS
CLIENT_URL=http://localhost:5173
```

## 🛠️ Development

### Thêm model mới
1. Tạo file model trong `src/models/`
2. Import trong `src/models/index.js`
3. Setup relationships nếu cần
4. Chạy `npm run setup-db`

### Database Migration
```javascript
// Cập nhật cấu trúc bảng
await syncDatabase({ alter: true });

// Reset toàn bộ (⚠️ XÓA dữ liệu!)
await syncDatabase({ force: true });
```

## 🐛 Troubleshooting

Xem chi tiết trong [SETUP.md](./SETUP.md)

## 📚 Resources

- [Express.js Docs](https://expressjs.com/)
- [Sequelize Docs](https://sequelize.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**UTE Social Backend** - Phiên bản 1.0.0
