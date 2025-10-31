-- Xóa các bảng cũ nếu tồn tại để tránh lỗi khi chạy lại
DROP TABLE IF EXISTS 
    "ThongBao", "DangKySuKien", "SuKien", "LuotThich", "BinhLuan", "BaiViet",
    "CuocGoi", "TinNhan", "ThanhVienHoiThoai", "CuocHoiThoai", 
    "NguoiDung", "Nganh", "Khoa"
CASCADE;

-- Xóa các kiểu ENUM cũ nếu tồn tại
DROP TYPE IF EXISTS 
    vai_tro_nguoi_dung_enum, loai_cuoc_hoi_thoai_enum, vai_tro_thanh_vien_enum, 
    loai_cuoc_goi_enum, trang_thai_noi_dung_enum, trang_thai_dang_ky_enum
CASCADE;

-- === TẠO CÁC KIỂU DỮ LIỆU ENUM ===

CREATE TYPE vai_tro_nguoi_dung_enum AS ENUM ('sinh_vien', 'giao_vien', 'doanh_nghiep', 'quan_tri_vien', 'dieu_phoi_vien');
CREATE TYPE loai_cuoc_hoi_thoai_enum AS ENUM ('rieng_tu', 'nhom');
CREATE TYPE vai_tro_thanh_vien_enum AS ENUM ('thanh_vien', 'quan_tri_vien');
CREATE TYPE loai_cuoc_goi_enum AS ENUM ('thoai', 'hinh');
CREATE TYPE trang_thai_noi_dung_enum AS ENUM ('cho_duyet', 'da_duyet', 'da_tu_choi');
CREATE TYPE trang_thai_dang_ky_enum AS ENUM ('da_dang_ky', 'da_huy');

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
    "noi_dung" TEXT NOT NULL,
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
    "ngay_dang_ky" TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- ✅ Đã sửa từ "ngay_gio_dang_ky"
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
INSERT INTO "NguoiDung" (
    "ho_ten", "email", "mat_khau_bam", "vai_tro", 
    "id_nganh", "lop", "tong_diem"
) VALUES
    ('Lê Hà Bình', 'lehabinh@student.ute.edu.vn', '$2a$10$hashed_password', 'sinh_vien', 1, '21DTHD1', 1250),
    ('Nguyễn Văn Admin', 'admin@ute.edu.vn', '$2a$10$hashed_password', 'quan_tri_vien', NULL, NULL, 0),
    ('Trần Thị Giáo Viên', 'giaoviena@ute.edu.vn', '$2a$10$hashed_password', 'giao_vien', NULL, NULL, 0);