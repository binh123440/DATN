-- Xóa các bảng cũ nếu tồn tại để tránh lỗi khi chạy lại
DROP TABLE IF EXISTS 
    "GiaoDichDiem", "DiemDanhSuKien", "DangKySuKien", "SuKien", "BaiViet", "BinhLuan", "LuotThich",
    "CuocGoi", "TinNhan", "ThanhVienHoiThoai", "CuocHoiThoai", "ThongBao", "NguoiDung"
CASCADE;

-- Xóa các kiểu ENUM cũ nếu tồn tại
DROP TYPE IF EXISTS 
    vai_tro_nguoi_dung_enum, loai_cuoc_hoi_thoai_enum, vai_tro_thanh_vien_enum, 
    loai_cuoc_goi_enum, trang_thai_noi_dung_enum, trang_thai_dang_ky_enum;

-- === TẠO CÁC KIỂU DỮ LIỆU ENUM BẰNG TIẾNG VIỆT ===

CREATE TYPE vai_tro_nguoi_dung_enum AS ENUM ('sinh_vien', 'giao_vien', 'doanh_nghiep', 'quan_tri_vien', 'dieu_phoi_vien');
CREATE TYPE loai_cuoc_hoi_thoai_enum AS ENUM ('rieng_tu', 'nhom');
CREATE TYPE vai_tro_thanh_vien_enum AS ENUM ('thanh_vien', 'quan_tri_vien');
CREATE TYPE loai_cuoc_goi_enum AS ENUM ('thoai', 'hinh');
CREATE TYPE trang_thai_noi_dung_enum AS ENUM ('cho_duyet', 'da_duyet', 'da_tu_choi');
CREATE TYPE trang_thai_dang_ky_enum AS ENUM ('da_dang_ky', 'da_huy');


-- === TẠO CÁC BẢNG BẰNG TIẾNG VIỆT ===

CREATE TABLE "NguoiDung" (
    "id" SERIAL PRIMARY KEY,
    "ho_ten" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "mat_khau_bam" VARCHAR(255) NOT NULL,
    "vai_tro" vai_tro_nguoi_dung_enum NOT NULL,
	    -- Thông tin cá nhân mở rộng --
    "dong_gioi_thieu" TEXT, -- Dòng giới thiệu ngắn (Bio)
    "ngay_sinh" DATE,
    "so_dien_thoai" VARCHAR(20) UNIQUE,
    "anh_dai_dien_url" TEXT, -- URL ảnh đại diện
    "anh_bia_url" TEXT, -- URL ảnh bìa trang cá nhân
    "anh_nhan_dien_url" TEXT, -- URL ảnh thẻ để xác thực

    "id_nganh" INT REFERENCES "Nganh"("id") ON DELETE SET NULL, -- Liên kết đến bảng Ngành, có thể NULL cho các vai trò không phải sinh viên
    "lopsh" VARCHAR(100), -- Lớp sinh hoạt

    "tong_diem" INT NOT NULL DEFAULT 0,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Bảng để lưu danh sách các khoa
CREATE TABLE "Khoa" (
    "id" SERIAL PRIMARY KEY,
    "ten_khoa" VARCHAR(255) UNIQUE NOT NULL
);

-- Bảng để lưu danh sách các ngành, mỗi ngành thuộc về một khoa
CREATE TABLE "Nganh" (
    "id" SERIAL PRIMARY KEY,
    "ten_nganh" VARCHAR(255) UNIQUE NOT NULL,
    "id_khoa" INT NOT NULL REFERENCES "Khoa"("id") ON DELETE RESTRICT -- Ngăn việc xóa một khoa nếu vẫn còn ngành thuộc về nó
);

CREATE TABLE "CuocHoiThoai" (
    "id" SERIAL PRIMARY KEY,
    "ten_hoi_thoai" VARCHAR(255), -- NULLable, chỉ dùng cho chat nhóm
    "loai" loai_cuoc_hoi_thoai_enum NOT NULL,
    "id_nguoi_tao" INT REFERENCES "NguoiDung"("id") ON DELETE SET NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ThanhVienHoiThoai" (
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "vai_tro" vai_tro_thanh_vien_enum NOT NULL DEFAULT 'thanh_vien',
    "ngay_tham_gia" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id_nguoi_dung", "id_cuoc_hoi_thoai")
);

CREATE TABLE "TinNhan" (
    "id" BIGSERIAL PRIMARY KEY,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "id_nguoi_gui" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "noi_dung" TEXT NOT NULL,
    "thoi_gian_gui" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "CuocGoi" (
    "id" SERIAL PRIMARY KEY,
    "id_cuoc_hoi_thoai" INT NOT NULL REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE,
    "id_nguoi_goi" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "loai" loai_cuoc_goi_enum NOT NULL,
    "thoi_gian_bat_dau" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "thoi_gian_ket_thuc" TIMESTAMPTZ,
	"url_ghi_am" TEXT
);

CREATE TABLE "BaiViet" (
    "id" SERIAL PRIMARY KEY,
    "id_tac_gia" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
	"id_bai_viet_goc" INT REFERENCES "BaiViet"("id") ON DELETE CASCADE, -- Tham chiếu đến bài viết gốc được chia sẻ
    "id_cuoc_hoi_thoai" INT REFERENCES "CuocHoiThoai"("id") ON DELETE CASCADE, -- Cho bài viết trong nhóm
    "noi_dung" TEXT NOT NULL,
    "trang_thai" trang_thai_noi_dung_enum NOT NULL DEFAULT 'cho_duyet',
    "id_nguoi_duyet" INT REFERENCES "NguoiDung"("id") ON DELETE SET NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- === TẠO BẢNG BÌNH LUẬN ===
CREATE TABLE "BinhLuan" (
    "id" SERIAL PRIMARY KEY,
    "id_bai_viet" INT NOT NULL REFERENCES "BaiViet"("id") ON DELETE CASCADE,
    "id_tac_gia" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_binh_luan_cha" INT REFERENCES "BinhLuan"("id") ON DELETE CASCADE, -- Cho bình luận trả lời (nested)
    "noi_dung" TEXT NOT NULL,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === TẠO BẢNG LƯỢT THÍCH (POLYMORPHIC) ===
CREATE TABLE "LuotThich" (
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_doi_tuong" INT NOT NULL, -- ID của bài viết hoặc bình luận được thích
    "loai_doi_tuong" VARCHAR(50) NOT NULL, -- VD: 'BaiViet', 'BinhLuan'
    "ngay_thich" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id_nguoi_dung", "id_doi_tuong", "loai_doi_tuong") -- Đảm bảo mỗi người chỉ thích 1 đối tượng 1 lần
);

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

CREATE TABLE "DangKySuKien" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_su_kien" INT NOT NULL REFERENCES "SuKien"("id") ON DELETE CASCADE,
    "trang_thai" trang_thai_dang_ky_enum NOT NULL DEFAULT 'da_dang_ky',
    "ngay_dang_ky" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("id_nguoi_dung", "id_su_kien")
);

CREATE TABLE "DiemDanhSuKien" (
    "id" SERIAL PRIMARY KEY,
    "id_dang_ky" INT UNIQUE NOT NULL REFERENCES "DangKySuKien"("id") ON DELETE CASCADE,
    "id_nguoi_quet" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "thoi_gian_diem_danh" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "diem_da_nhan" INT NOT NULL
);

CREATE TABLE "GiaoDichDiem" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_dung" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "thay_doi_diem" INT NOT NULL,
    "mo_ta" VARCHAR(255),
    "id_nguon" INT,
    "loai_nguon" VARCHAR(50), -- VD: 'DiemDanhSuKien', 'ThuongBaiViet'
    "ngay_giao_dich" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ThongBao" (
    "id" SERIAL PRIMARY KEY,
    "id_nguoi_nhan" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "id_nguoi_hanh_dong" INT NOT NULL REFERENCES "NguoiDung"("id") ON DELETE CASCADE,
    "loai" VARCHAR(50) NOT NULL, -- VD: 'bai_viet_moi', 'nhac_nho_su_kien'
    "id_muc_tieu" INT,
    "loai_muc_tieu" VARCHAR(50), -- VD: 'BaiViet', 'SuKien'
    "da_doc" BOOLEAN NOT NULL DEFAULT FALSE,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === TẠO CÁC INDEX ĐỂ TĂNG TỐC ĐỘ TRUY VẤN ===

CREATE INDEX ON "NguoiDung" ("id_nganh");
CREATE INDEX ON "Nganh" ("id_khoa");
CREATE INDEX ON "ThanhVienHoiThoai" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "TinNhan" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "TinNhan" ("id_nguoi_gui");
CREATE INDEX ON "BaiViet" ("id_tac_gia");
CREATE INDEX ON "BaiViet" ("id_cuoc_hoi_thoai");
CREATE INDEX ON "DangKySuKien" ("id_su_kien");
CREATE INDEX ON "GiaoDichDiem" ("id_nguoi_dung");
CREATE INDEX ON "ThongBao" ("id_nguoi_nhan");
CREATE INDEX ON "BinhLuan" ("id_bai_viet");
CREATE INDEX ON "BinhLuan" ("id_tac_gia");
CREATE INDEX ON "LuotThich" ("id_doi_tuong", "loai_doi_tuong");

