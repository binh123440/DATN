-- Database: ute_social

-- DROP DATABASE IF EXISTS ute_social;

-- CREATE DATABASE ute_social;
-- Xóa các bảng cũ nếu tồn tại để tránh lỗi khi chạy lại file
DROP TABLE IF EXISTS ThongBao, GiaoDichDiem, DiemDanhSuKien, DangKySuKien, ThanhVienNhom, SuKien, BaiViet, Nhom, NguoiDung CASCADE;
DROP TYPE IF EXISTS vai_tro_nguoi_dung, trang_thai_dang_ky, vai_tro_thanh_vien_nhom;

-- =================================================================
-- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU TÙY CHỈNH (ENUMs)
-- =================================================================

CREATE TYPE vai_tro_nguoi_dung AS ENUM ('sinh_vien', 'giao_vien');
CREATE TYPE trang_thai_dang_ky AS ENUM ('da_dang_ky', 'da_tham_gia', 'da_huy');
CREATE TYPE vai_tro_thanh_vien_nhom AS ENUM ('quan_tri_vien', 'thanh_vien');

-- =================================================================
-- TẠO CÁC BẢNG
-- =================================================================

-- Bảng: NguoiDung
-- Chú thích: Lưu trữ thông tin người dùng, vai trò và điểm thưởng.
CREATE TABLE NguoiDung (
    id SERIAL PRIMARY KEY,
    khoa_cong_khai_nostr VARCHAR(64) UNIQUE NOT NULL,
    ten VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    vai_tro vai_tro_nguoi_dung NOT NULL DEFAULT 'sinh_vien',
    tong_diem INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng: BaiViet
-- Chú thích: Lưu trữ các bài đăng văn bản, liên kết với event trên Nostr.
CREATE TABLE BaiViet (
    id SERIAL PRIMARY KEY,
    id_su_kien_nostr VARCHAR(64) UNIQUE NOT NULL,
    id_nguoi_dung INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    noi_dung TEXT,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng: SuKien
-- Chú thích: Lưu thông tin chi tiết của sự kiện, được tạo bởi giáo viên.
CREATE TABLE SuKien (
    id SERIAL PRIMARY KEY,
    id_bai_viet INT UNIQUE NOT NULL REFERENCES BaiViet(id) ON DELETE CASCADE,
    id_nguoi_tao INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    ten VARCHAR(255) NOT NULL,
    dia_diem VARCHAR(255),
    thoi_gian_bat_dau TIMESTAMPTZ NOT NULL,
    so_luong_toi_da INT NOT NULL,
    so_luong_da_dang_ky INT NOT NULL DEFAULT 0,
    diem_thuong INT NOT NULL DEFAULT 0,
    ma_bi_mat_qr VARCHAR(255) UNIQUE NOT NULL,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng: DangKySuKien
-- Chú thích: Ghi lại việc sinh viên đăng ký tham gia sự kiện.
CREATE TABLE DangKySuKien (
    id SERIAL PRIMARY KEY,
    id_nguoi_dung INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    id_su_kien INT NOT NULL REFERENCES SuKien(id) ON DELETE CASCADE,
    trang_thai trang_thai_dang_ky NOT NULL DEFAULT 'da_dang_ky',
    ngay_dang_ky TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(id_nguoi_dung, id_su_kien) -- Đảm bảo mỗi sinh viên chỉ đăng ký 1 lần cho 1 sự kiện
);

-- Bảng: DiemDanhSuKien
-- Chú thích: Ghi lại lịch sử điểm danh thành công qua QR code.
CREATE TABLE DiemDanhSuKien (
    id SERIAL PRIMARY KEY,
    id_dang_ky INT UNIQUE NOT NULL REFERENCES DangKySuKien(id) ON DELETE CASCADE,
    id_nguoi_dung INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    id_su_kien INT NOT NULL REFERENCES SuKien(id) ON DELETE CASCADE,
    thoi_gian_diem_danh TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diem_da_trao INT NOT NULL
);

-- Bảng: GiaoDichDiem
-- Chú thích: Lịch sử giao dịch điểm để dễ dàng truy vết.
CREATE TABLE GiaoDichDiem (
    id SERIAL PRIMARY KEY,
    id_nguoi_dung INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    id_diem_danh INT REFERENCES DiemDanhSuKien(id) ON DELETE SET NULL, -- Nguồn gốc điểm thưởng
    diem INT NOT NULL,
    mo_ta VARCHAR(255), -- Mô tả giao dịch, ví dụ: "Điểm danh sự kiện X"
    ngay_giao_dich TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng: Nhom
-- Chú thích: Lưu thông tin các nhóm/cộng đồng.
CREATE TABLE Nhom (
    id SERIAL PRIMARY KEY,
    id_nguoi_tao INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    ten VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng: ThanhVienNhom
-- Chú thích: Bảng trung gian cho mối quan hệ nhiều-nhiều giữa NguoiDung và Nhom.
CREATE TABLE ThanhVienNhom (
    id_nguoi_dung INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    id_nhom INT NOT NULL REFERENCES Nhom(id) ON DELETE CASCADE,
    vai_tro vai_tro_thanh_vien_nhom NOT NULL DEFAULT 'thanh_vien',
    ngay_tham_gia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_nguoi_dung, id_nhom) -- Khóa chính phức hợp
);

-- Bảng: ThongBao
-- Chú thích: Lưu các thông báo cần đẩy đến người dùng.
CREATE TABLE ThongBao (
    id SERIAL PRIMARY KEY,
    id_nguoi_nhan INT NOT NULL REFERENCES NguoiDung(id) ON DELETE CASCADE,
    noi_dung TEXT NOT NULL,
    da_doc BOOLEAN NOT NULL DEFAULT FALSE,
    lien_ket VARCHAR(255), -- Đường dẫn đến nội dung liên quan (bài viết, sự kiện)
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- TẠO CÁC CHỈ MỤC (INDEXES) ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =================================================================

CREATE INDEX idx_nguoidung_khoacongkhai ON NguoiDung(khoa_cong_khai_nostr);
CREATE INDEX idx_baiviet_idnguoidung ON BaiViet(id_nguoi_dung);
CREATE INDEX idx_sukien_idnguoitao ON SuKien(id_nguoi_tao);
CREATE INDEX idx_sukien_thoigianbatdau ON SuKien(thoi_gian_bat_dau);
CREATE INDEX idx_dangkysukien_idnguoidung ON DangKySuKien(id_nguoi_dung);
CREATE INDEX idx_dangkysukien_idsukien ON DangKySuKien(id_su_kien);
CREATE INDEX idx_thongbao_idnguoinhan ON ThongBao(id_nguoi_nhan);

-- =================================================================
-- KẾT THÚC SCRIPT
-- =================================================================

-- Thông báo hoàn tất
\echo 'Cấu trúc cơ sở dữ liệu cho UTE Social đã được tạo thành