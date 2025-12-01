-- Xóa các bảng cũ nếu tồn tại để tránh lỗi khi chạy lại
DROP TABLE IF EXISTS 
    "ThongBao", "DangKySuKien", "SuKien", "LuotThich", "BinhLuan", "BaiViet",
    "CuocGoi", "TinNhan", "ThanhVienHoiThoai", "CuocHoiThoai", 
    "NguoiDung", "Nganh", "Khoa"
CASCADE;

-- Xóa các kiểu ENUM cũ nếu tồn tại
DROP TYPE IF EXISTS 
    vai_tro_nguoi_dung_enum, loai_cuoc_hoi_thoai_enum, vai_tro_thanh_vien_enum, 
    loai_cuoc_goi_enum, trang_thai_noi_dung_enum, trang_thai_dang_ky_enum, trang_thai_su_kien_enum, media_type_enum
CASCADE;

-- === TẠO CÁC KIỂU DỮ LIỆU ENUM ===

CREATE TYPE vai_tro_nguoi_dung_enum AS ENUM ('sinh_vien', 'giao_vien', 'doanh_nghiep', 'quan_tri_vien', 'kiem_duyet_vien');
CREATE TYPE loai_cuoc_hoi_thoai_enum AS ENUM ('rieng_tu', 'nhom');
CREATE TYPE vai_tro_thanh_vien_enum AS ENUM ('thanh_vien', 'quan_tri_vien');
CREATE TYPE loai_cuoc_goi_enum AS ENUM ('thoai', 'hinh');
CREATE TYPE trang_thai_noi_dung_enum AS ENUM ('cho_duyet', 'da_duyet', 'da_tu_choi');
CREATE TYPE trang_thai_dang_ky_enum AS ENUM ('da_dang_ky', 'da_huy');
CREATE TYPE media_type_enum AS ENUM ('image', 'video', 'mixed');
CREATE TYPE trang_thai_su_kien_enum AS ENUM ('ban_nhap','da_gui_khoa','da_duyet_khoa','tu_choi_khoa','da_dang');

-- === TẠO CÁC BẢNG ===

-- Bảng Khoa
CREATE TABLE "Khoa" (
    "id" SERIAL PRIMARY KEY,
    "ten_khoa" VARCHAR(255) UNIQUE NOT NULL
);

-- Bảng Ngành
CREATE TABLE "Nganh" (
    "id" SERIAL PRIMARY KEY,
    "ten_nganh" VARCHAR(255) UNIQUE NOT NULL,
    "id_khoa" INT NOT NULL REFERENCES "Khoa"("id") ON DELETE RESTRICT
);

-- Bảng Người Dùng
CREATE TABLE "NguoiDung" (
    "id" SERIAL PRIMARY KEY,
    "ho_ten" VARCHAR(255) NOT NULL,
	"ma_sinh_vien" VARCHAR(255) UNIQUE NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "mat_khau_bam" VARCHAR(255) NOT NULL,
    "vai_tro" vai_tro_nguoi_dung_enum NOT NULL,
    
    -- Thông tin cá nhân
    "dong_gioi_thieu" TEXT,
    "ngay_sinh" DATE,
    "so_dien_thoai" VARCHAR(20) UNIQUE,
    "anh_dai_dien_url" TEXT,
    "anh_bia_url" TEXT,
    "anh_nhan_dien_url" TEXT,
    
    -- Thông tin sinh viên
    "id_nganh" INT REFERENCES "Nganh"("id") ON DELETE SET NULL,
    "lop_sh" VARCHAR(100),
    
    "tong_diem" INT NOT NULL DEFAULT 0,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng Cuộc Hội Thoại
CREATE TABLE "CuocHoiThoai" (
    "id" SERIAL PRIMARY KEY,
    "ten_hoi_thoai" VARCHAR(255),
    "loai" loai_cuoc_hoi_thoai_enum NOT NULL,
    "id_nguoi_tao" INT REFERENCES "NguoiDung"("id") ON DELETE SET NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng Thành Viên Hội Thoại
CREATE TABLE "ThanhVienHoiThoai" (
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "vai_tro" vai_tro_thanh_vien_enum NOT NULL DEFAULT 'thanh_vien',
    "ngay_gio_tham_gia" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id_nguoi_dung", "id_cuoc_hoi_thoai")
);

-- Bảng Tin Nhắn
CREATE TABLE "TinNhan" (
    "id" BIGSERIAL PRIMARY KEY,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "id_nguoi_gui" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "noi_dung" TEXT NOT NULL,
    "thoi_gian_gui" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng Cuộc Gọi
CREATE TABLE "CuocGoi" (
    "id" SERIAL PRIMARY KEY,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "id_nguoi_goi" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "loai" loai_cuoc_goi_enum NOT NULL,
    "thoi_gian_bat_dau" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "thoi_gian_ket_thuc" TIMESTAMPTZ,
    "url_ghi_am" TEXT
);

-- Bảng Bài Viết
CREATE TABLE "BaiViet" (
    "id" SERIAL PRIMARY KEY,
    "id_tac_gia" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_bai_viet_goc" INT REFERENCES "BaiViet"("id") ON DELETE CASCADE,
    "id_cuoc_hoi_thoai" INT REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "noi_dung" TEXT,
	"media_urls" JSONB DEFAULT '[]'::jsonb,
    "media_type" media_type_enum,
    "trang_thai" trang_thai_noi_dung_enum NOT NULL DEFAULT 'cho_duyet',
    "id_nguoi_duyet" INT REFERENCES "NguoiDung"("id") ON DELETE SET NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng Bình Luận
CREATE TABLE "BinhLuan" (
    "id" SERIAL PRIMARY KEY,
    "id_bai_viet" INT NOT NULL REFERENCES "BaiViet"("id") ON DELETE CASCADE,
    "id_tac_gia" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_binh_luan_cha" INT REFERENCES "BinhLuan"("id") ON DELETE CASCADE,
    "noi_dung" TEXT NOT NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng Lượt Thích
CREATE TABLE "LuotThich" (
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_doi_tuong" INT NOT NULL,
    "loai_doi_tuong" VARCHAR(50) NOT NULL,
    "ngay_thich" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id_nguoi_dung", "id_doi_tuong", "loai_doi_tuong")
);

-- Bảng Sự Kiện
CREATE TABLE "SuKien" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_tao" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_bai_viet" INT UNIQUE NOT NULL REFERENCES "BaiViet"("id") ON DELETE CASCADE,
    "ten_su_kien" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
	"ke_hoach_chi_tiet" JSONB DEFAULT NULL,
	"trang_thai_su_kien" trang_thai_su_kien_enum DEFAULT 'ban_nhap',
	"dia_diem" VARCHAR(255),
    "thoi_gian_bat_dau" TIMESTAMPTZ NOT NULL,
    "so_luong_toi_da" INT NOT NULL,
    "diem_thuong" INT NOT NULL,
    "trang_thai" trang_thai_noi_dung_enum NOT NULL DEFAULT 'cho_duyet',
    "id_nguoi_duyet" INT REFERENCES "NguoiDung"("id") ON DELETE SET NULL
);

-- Bảng Đăng Ký Sự Kiện (Đã hợp nhất điểm danh)
CREATE TABLE "DangKySuKien" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_su_kien" INT NOT NULL REFERENCES "SuKien"("id") ON DELETE CASCADE,
    "trang_thai" trang_thai_dang_ky_enum NOT NULL DEFAULT 'da_dang_ky',
    "ngay_gio_dang_ky" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ngay_gio_diem_danh" TIMESTAMPTZ, -- ✅ Đã thêm cột này
    UNIQUE("id_nguoi_dung", "id_su_kien")
);

-- Bảng Thông Báo
CREATE TABLE "ThongBao" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_nhan" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_nguoi_hanh_dong" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "loai" VARCHAR(50) NOT NULL,
    "id_muc_tieu" INT,
    "loai_muc_tieu" VARCHAR(50),
    "da_doc" BOOLEAN NOT NULL DEFAULT FALSE,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === TẠO CÁC INDEX ===

CREATE INDEX ON "NguoiDung" ("id_nganh");
CREATE INDEX ON "Nganh" ("id_khoa");
CREATE INDEX ON "ThanhVienHoiThoai" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "TinNhan" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "TinNhan" ("id_nguoi_gui");
CREATE INDEX ON "BaiViet" ("id_tac_gia");
CREATE INDEX ON "BaiViet" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "BinhLuan" ("id_bai_viet");
CREATE INDEX ON "BinhLuan" ("id_tac_gia");
CREATE INDEX ON "LuotThich" ("id_doi_tuong", "loai_doi_tuong");
CREATE INDEX ON "DangKySuKien" ("id_su_kien");
CREATE INDEX ON "ThongBao" ("id_nguoi_nhan");
CREATE INDEX ON "BaiViet"("media_type");

-- === THÊM DỮ LIỆU MẪU (OPTIONAL) ===

-- Thêm các khoa
INSERT INTO "Khoa" ("ten_khoa") VALUES
    ('Công nghệ Thông tin'),
    ('Điện - Điện tử'),
    ('Cơ khí');

-- Thêm các ngành
INSERT INTO "Nganh" ("ten_nganh", "id_khoa") VALUES
    ('Công nghệ Thông tin', 1),
    ('An toàn Thông tin', 1),
    ('Tự động hóa', 2),
    ('Cơ điện tử', 3);

-- Thêm người dùng mẫu
-- === THÊM DỮ LIỆU MẪU CHO BÀI VIẾT VÀ SỰ KIỆN ===

-- Thêm thêm một số người dùng để có nhiều tác giả khác nhau
INSERT INTO "NguoiDung" (
    "ho_ten", "ma_sinh_vien", "email", "mat_khau_bam", "vai_tro", 
    "id_nganh", "lop_sh", "tong_diem"
) VALUES
    ('Phạm Minh Tuấn', '21115053120101', 'tuanpm@student.ute.edu.vn', '$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.', 'sinh_vien', 1, '21DTHD1', 850),
    ('Nguyễn Thị Hương', '21115053120102', 'huongnt@student.ute.edu.vn', '$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.', 'sinh_vien', 2, '21ATTT1', 920),
    ('Trần Văn Đức', '21115053120103', 'ductv@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 1, '21DTHD2', 780),
    ('Lê Thị Mai', '21115053120104', 'mailt@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 3, '21TDHH1', 1100),
    ('Hoàng Văn Nam', '21115053120106', 'namhv@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 1, '21DTHD1', 950),
    ('Vũ Thị Lan', '21115053120107', 'lanvt@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 2, '21A1', 870),
	('Lê Hà Bình', '21115053120105', 'binhlh12@sv.ute.udn.vn', '$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.', 'sinh_vien', 2, '22T1', 870),
	('Lê Kìm Nam', '21115053120108', 'lkn@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 2, '21T1', 870),
	('Lê Ngọc Hào', '21115053120109', 'lnh@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 2, '21A1', 870),
    ('Đỗ Minh Khoa', '21115053120110', 'khoadm@ute.edu.vn', '$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.', 'kiem_duyet_vien', NULL, NULL, 0);

-- === THÊM 10 BÀI VIẾT MẪU ===

-- Bài viết 1: Chia sẻ kinh nghiệm học tập
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    1,
    'Chào mọi người! Mình vừa hoàn thành đồ án môn Lập trình Web. Cảm ơn thầy và các bạn đã hỗ trợ nhiệt tình. Đây là những gì mình học được trong quá trình làm đồ án: React.js thật sự rất mạnh mẽ, việc tổ chức component tốt sẽ giúp code dễ maintain hơn rất nhiều! 💻✨',
    'da_duyet',
    NOW() - INTERVAL '2 hours'
);

-- Bài viết 2: Thông báo về học bổng
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    4,
    '🎓 TIN VUI! Trường vừa công bố danh sách sinh viên đạt học bổng học kỳ 1 năm học 2024-2025. Xin chúc mừng các bạn đã nỗ lực và đạt được thành tích xuất sắc! Các bạn hãy tiếp tục phát huy trong học kỳ tiếp theo nhé! 🏆',
    'da_duyet',
    NOW() - INTERVAL '5 hours'
);

-- Bài viết 3: Mời tham gia CLB
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    5,
    'CLB Lập trình UTE đang tuyển thành viên mới cho năm học 2024-2025! 🚀 Nếu bạn đam mê lập trình, muốn học hỏi và phát triển kỹ năng cùng các bạn có cùng đam mê, hãy tham gia với chúng mình nhé! Đăng ký tại: https://utecode.club 💻',
    'da_duyet',
    NOW() - INTERVAL '1 day'
);

-- Bài viết 4: Chia sẻ về thi đấu
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    6,
    'Giải bóng đá sinh viên UTE Cup 2024 đã kết thúc thành công! Xin chúc mừng đội Khoa CNTT đã giành chức vô địch. Cảm ơn tất cả các bạn đã tham gia và cổ vũ nhiệt tình! ⚽🏆 #UTESports',
    'da_duyet',
    NOW() - INTERVAL '1 day'
);

-- Bài viết 5: Hỏi về môn học
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    7,
    'Cho mình hỏi môn Cấu trúc dữ liệu và Giải thuật học kỳ này ai học với thầy Nguyễn Văn A không? Môn này khó không các bạn? Mình cần tài liệu tham khảo ạ! 📚',
    'da_duyet',
    NOW() - INTERVAL '3 hours'
);

-- Bài viết 6: Chia sẻ về thực tập
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    4,
    'Vừa kết thúc 2 tháng thực tập tại công ty công nghệ FPT Software. Trải nghiệm thật sự bổ ích! Được làm việc với các anh chị senior, học được rất nhiều về quy trình làm việc chuyên nghiệp và các công nghệ mới. Cảm ơn công ty và thầy cô đã tạo cơ hội! 🙏💼',
    'da_duyet',
    NOW() - INTERVAL '6 hours'
);

-- Bài viết 7: Thông báo nghỉ học
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    3,
    '📢 THÔNG BÁO: Do thời tiết xấu, trường thông báo nghỉ học vào chiều nay (15/11). Các lớp học buổi chiều sẽ được dời sang thứ 7 tuần này. Sinh viên theo dõi email để cập nhật lịch học bù chi tiết. Stay safe everyone! 🌧️',
    'da_duyet',
    NOW() - INTERVAL '4 hours'
);

-- Bài viết 8: Chia sẻ về du học
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    8,
    'Mình vừa nhận được thư mời học bổng toàn phần từ đại học Tokyo Institute of Technology! 🇯🇵✨ Cảm ơn thầy cô đã hỗ trợ mình trong suốt quá trình chuẩn bị hồ sơ. Nếu bạn nào có mơ ước du học, hãy cố gắng và đừng bỏ cuộc nhé!',
    'da_duyet',
    NOW() - INTERVAL '8 hours'
);

-- Bài viết 9: Hỏi về đồ án
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    1,
    'Các bạn có ai đang làm đồ án tốt nghiệp về AI/Machine Learning không? Mình đang tìm người cùng nghiên cứu và chia sẻ tài liệu. Có thể tạo nhóm study cùng nhau! 🤖📊 Inbox mình nha!',
    'da_duyet',
    NOW() - INTERVAL '10 hours'
);

-- Bài viết 10: Cảm ơn và chúc mừng
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "ngay_tao")
VALUES (
    5,
    'Hôm nay là ngày cuối cùng của tuần lễ sinh viên năm 2024! Cảm ơn Ban tổ chức và tất cả các bạn đã tham gia nhiệt tình. Những kỷ niệm đẹp sẽ mãi in sâu trong lòng chúng mình. Hẹn gặp lại các bạn vào năm sau! 🎉🎓💙',
    'da_duyet',
    NOW() - INTERVAL '12 hours'
);

-- === THÊM 10 SỰ KIỆN MẪU ===

-- Sự kiện 1: Hội thảo AI
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🎓 Hội thảo "AI và Machine Learning trong thời đại số" sẽ diễn ra vào tuần tới. Đây là cơ hội tuyệt vời để các bạn sinh viên được học hỏi từ các chuyên gia hàng đầu trong lĩnh vực AI. Đăng ký ngay để nhận 60 điểm hoạt động!',
    'da_duyet',
    2,
    NOW() - INTERVAL '1 hour'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10, -- id_nguoi_tao (Điều phối viên)
    CURRVAL('public."BaiViet_id_seq"'), -- id_bai_viet (bài viết vừa tạo)
    'Hội thảo AI và Machine Learning trong thời đại số',
    'Hội thảo chuyên đề về ứng dụng AI trong các lĩnh vực: Y tế, Giáo dục, Tài chính. Diễn giả: TS. Nguyễn Văn Minh - Chuyên gia AI tại Google Brain.',
    'Hội trường A - Tòa nhà H6',
    NOW() + INTERVAL '5 days',
    100,
    60,
    'da_duyet',
    2
);

-- Sự kiện 2: Workshop React.js
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '💻 Workshop "Xây dựng ứng dụng web hiện đại với React.js" - Học từ cơ bản đến nâng cao. Phù hợp cho sinh viên đang học lập trình web và muốn nâng cao kỹ năng frontend!',
    'da_duyet',
    2,
    NOW() - INTERVAL '2 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Workshop: Xây dựng ứng dụng web với React.js',
    'Workshop thực hành xây dựng một ứng dụng Todo List hoàn chỉnh. Yêu cầu: Biết JavaScript cơ bản. Mang theo laptop.',
    'Phòng Lab 301 - Tòa nhà A1',
    NOW() + INTERVAL '3 days',
    50,
    70,
    'da_duyet',
    2
);

-- Sự kiện 3: Giải bóng đá
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '⚽ Giải bóng đá UTE Cup 2024 chính thức khai mạc! Đăng ký tham gia để thể hiện kỹ năng và giành điểm hoạt động cao!',
    'da_duyet',
    2,
    NOW() - INTERVAL '3 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Giải bóng đá UTE Cup 2024',
    'Giải bóng đá giao hữu giữa các khoa. Mỗi đội 7 người (5 chính + 2 dự bị). Giải thưởng hấp dẫn cho đội vô địch!',
    'Sân bóng đá trường UTE',
    NOW() + INTERVAL '7 days',
    200,
    50,
    'da_duyet',
    2
);

-- Sự kiện 4: Hackathon
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🚀 UTE Hackathon 2024 - Sân chơi dành cho các tài năng lập trình! 48 giờ code marathon với giải thưởng lên đến 50 triệu đồng!',
    'da_duyet',
    2,
    NOW() - INTERVAL '4 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'UTE Hackathon 2024 - Code for Future',
    'Cuộc thi lập trình 48 giờ. Đội 3-5 người. Giải quyết các bài toán thực tế về Smart City, IoT, AI. Tài trợ bởi FPT Software.',
    'Khu A - Tòa nhà Thực hành',
    NOW() + INTERVAL '14 days',
    150,
    100,
    'da_duyet',
    2
);

-- Sự kiện 5: Ngày hội việc làm
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '💼 Ngày hội việc làm UTE 2024 với sự tham gia của hơn 50 doanh nghiệp lớn. Cơ hội tìm việc làm và thực tập cho sinh viên!',
    'da_duyet',
    2,
    NOW() - INTERVAL '5 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Ngày hội việc làm UTE Career Fair 2024',
    'Gặp gỡ nhà tuyển dụng từ các công ty: FPT, Viettel, VNG, VinGroup, Samsung... Mang theo CV để nộp trực tiếp!',
    'Sân vận động Hoà Bình',
    NOW() + INTERVAL '10 days',
    500,
    40,
    'da_duyet',
    2
);

-- Sự kiện 6: Tình nguyện mùa đông
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🌱 Chiến dịch "Mùa đông ấm cho em" - Hành trình tình nguyện đến với trẻ em vùng cao. Cùng góp sức mang yêu thương đến những em nhỏ!',
    'da_duyet',
    2,
    NOW() - INTERVAL '6 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Chiến dịch Mùa đông ấm cho em',
    'Hành trình 3 ngày 2 đêm đến Sapa - Lào Cai. Mang quà tặng, sách vở, áo ấm cho trẻ em vùng cao. Chi phí: 500k/người.',
    'Điểm tập trung: Cổng trường UTE',
    NOW() + INTERVAL '21 days',
    80,
    90,
    'da_duyet',
    2
);

-- Sự kiện 7: Workshop Blockchain
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🔗 Workshop "Blockchain và Cryptocurrency" - Tìm hiểu công nghệ đang thay đổi tương lai tài chính toàn cầu!',
    'da_duyet',
    2,
    NOW() - INTERVAL '7 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Workshop: Blockchain và Ứng dụng thực tế',
    'Khám phá công nghệ Blockchain, Smart Contract, DeFi. Thực hành tạo một ứng dụng đơn giản trên Ethereum.',
    'Phòng 401 - Tòa nhà B2',
    NOW() + INTERVAL '6 days',
    60,
    75,
    'da_duyet',
    2
);

-- Sự kiện 8: Cuộc thi Startup
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '💡 Cuộc thi Ý tưởng Khởi nghiệp UTE Startup Challenge 2024. Biến ý tưởng thành hiện thực với hỗ trợ từ các mentor chuyên nghiệp!',
    'da_duyet',
    2,
    NOW() - INTERVAL '8 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'UTE Startup Challenge 2024',
    'Cuộc thi khởi nghiệp dành cho sinh viên. Giải nhất: 30 triệu + Mentorship 6 tháng. Pitching trước hội đồng đầu tư.',
    'Trung tâm Khởi nghiệp UTE',
    NOW() + INTERVAL '30 days',
    100,
    80,
    'da_duyet',
    2
);

-- Sự kiện 9: Giải chạy Marathon
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🏃‍♂️ UTE Marathon 2024 - Chạy vì sức khỏe, chạy vì cộng đồng! Cự ly: 5km, 10km, 21km. Đăng ký sớm để nhận áo đấu miễn phí!',
    'da_duyet',
    2,
    NOW() - INTERVAL '9 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'UTE Marathon 2024 - Run for Health',
    'Giải chạy Marathon từ thiện. Toàn bộ lệ phí tham gia sẽ được ủng hộ xây dựng thư viện cho học sinh vùng cao.',
    'Công viên Gia Định',
    NOW() + INTERVAL '15 days',
    300,
    45,
    'da_duyet',
    2
);

-- Sự kiện 10: Hội thảo du học
INSERT INTO "BaiViet" ("id_tac_gia", "noi_dung", "trang_thai", "id_nguoi_duyet", "ngay_tao")
VALUES (
    10,
    '🌏 Hội thảo "Định hướng du học - Con đường phát triển bản thân". Tư vấn miễn phí về học bổng Nhật Bản, Hàn Quốc, Đức, Úc...',
    'da_duyet',
    2,
    NOW() - INTERVAL '10 hours'
);

INSERT INTO "SuKien" (
    "id_nguoi_tao", "id_bai_viet", "ten_su_kien", "mo_ta", "dia_diem",
    "thoi_gian_bat_dau", "so_luong_toi_da", "diem_thuong", "trang_thai", "id_nguoi_duyet"
)
VALUES (
    10,
    CURRVAL('public."BaiViet_id_seq"'),
    'Hội thảo Định hướng Du học quốc tế 2024',
    'Gặp gỡ đại diện các trường đại học quốc tế. Tìm hiểu về học bổng toàn phần, quy trình apply, kinh nghiệm từ du học sinh.',
    'Hội trường C - Tòa nhà H6',
    NOW() + INTERVAL '12 days',
    120,
    55,
    'da_duyet',
    2
);

-- === THÊM MỘT SỐ LƯỢT THÍCH VÀ BÌNH LUẬN MẪU ===

-- Thêm lượt thích cho các bài viết
INSERT INTO "LuotThich" ("id_nguoi_dung", "id_doi_tuong", "loai_doi_tuong", "ngay_thich")
VALUES
    (1, 1, 'bai_viet', NOW() - INTERVAL '1 hour'),
    (4, 1, 'bai_viet', NOW() - INTERVAL '50 minutes'),
    (5, 1, 'bai_viet', NOW() - INTERVAL '45 minutes'),
    (1, 2, 'bai_viet', NOW() - INTERVAL '4 hours'),
    (4, 2, 'bai_viet', NOW() - INTERVAL '3 hours'),
    (5, 2, 'bai_viet', NOW() - INTERVAL '2 hours'),
    (6, 2, 'bai_viet', NOW() - INTERVAL '1 hour'),
    (7, 2, 'bai_viet', NOW() - INTERVAL '30 minutes');

-- Thêm bình luận cho các bài viết
INSERT INTO "BinhLuan" ("id_bai_viet", "id_tac_gia", "noi_dung", "ngay_tao")
VALUES
    (1, 4, 'Chúc mừng bạn nhé! Đồ án của bạn rất ấn tượng đấy! 🎉', NOW() - INTERVAL '1 hour'),
    (1, 5, 'Mình cũng vừa học xong React, thật sự rất thú vị!', NOW() - INTERVAL '50 minutes'),
    (2, 1, 'Chúc mừng các bạn đạt học bổng! Năm sau mình cũng phải cố gắng thêm!', NOW() - INTERVAL '4 hours'),
    (3, 6, 'CLB này có dạy AI không bạn? Mình đang quan tâm lắm!', NOW() - INTERVAL '20 hours'),
    (4, 7, 'Trận chung kết hôm qua thật sự kịch tính! Xứng đáng là nhà vô địch!', NOW() - INTERVAL '23 hours');

-- Thêm đăng ký cho một số sự kiện
INSERT INTO "DangKySuKien" ("id_nguoi_dung", "id_su_kien", "trang_thai", "ngay_gio_dang_ky")
VALUES
    (1, 1, 'da_dang_ky', NOW() - INTERVAL '30 minutes'),
    (4, 1, 'da_dang_ky', NOW() - INTERVAL '1 hour'),
    (5, 1, 'da_dang_ky', NOW() - INTERVAL '2 hours'),
    (6, 1, 'da_dang_ky', NOW() - INTERVAL '3 hours'),
    (1, 2, 'da_dang_ky', NOW() - INTERVAL '1 hour'),
    (7, 2, 'da_dang_ky', NOW() - INTERVAL '2 hours'),
    (1, 3, 'da_dang_ky', NOW() - INTERVAL '2 hours'),
    (4, 4, 'da_dang_ky', NOW() - INTERVAL '3 hours'),
    (5, 5, 'da_dang_ky', NOW() - INTERVAL '4 hours');

-- === KẾT THÚC INSERT DỮ LIỆU MẪU ===

-- Kiểm tra kết quả
SELECT 
    'Tổng số bài viết' as loai, 
    COUNT(*) as so_luong 
FROM "BaiViet"
UNION ALL
SELECT 
    'Tổng số sự kiện', 
    COUNT(*) 
FROM "SuKien"
UNION ALL
SELECT 
    'Tổng số người dùng', 
    COUNT(*) 
FROM "NguoiDung"
UNION ALL
SELECT 
    'Tổng số lượt thích', 
    COUNT(*) 
FROM "LuotThich"
UNION ALL
SELECT 
    'Tổng số bình luận', 
    COUNT(*) 
FROM "BinhLuan"
UNION ALL
SELECT 
    'Tổng số đăng ký sự kiện', 
    COUNT(*) 
FROM "DangKySuKien";