--
-- PostgreSQL database dump
--

\restrict XcFCgy3aaWxW8vjVVTciotvJSNFZDKE1iggAdZVu9G0idSlCJ3AgQ77AxabAEBk

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_NguoiDung_vai_tro; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_NguoiDung_vai_tro" AS ENUM (
    'sinh_vien',
    'giao_vien',
    'doanh_nghiep',
    'quan_tri_vien',
    'dieu_phoi_vien'
);


ALTER TYPE public."enum_NguoiDung_vai_tro" OWNER TO postgres;

--
-- Name: loai_cuoc_goi_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_cuoc_goi_enum AS ENUM (
    'thoai',
    'hinh'
);


ALTER TYPE public.loai_cuoc_goi_enum OWNER TO postgres;

--
-- Name: loai_cuoc_hoi_thoai_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_cuoc_hoi_thoai_enum AS ENUM (
    'rieng_tu',
    'nhom'
);


ALTER TYPE public.loai_cuoc_hoi_thoai_enum OWNER TO postgres;

--
-- Name: media_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.media_type_enum AS ENUM (
    'image',
    'video',
    'mixed'
);


ALTER TYPE public.media_type_enum OWNER TO postgres;

--
-- Name: trang_thai_dang_ky_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_dang_ky_enum AS ENUM (
    'da_dang_ky',
    'da_huy'
);


ALTER TYPE public.trang_thai_dang_ky_enum OWNER TO postgres;

--
-- Name: trang_thai_noi_dung_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_noi_dung_enum AS ENUM (
    'cho_duyet',
    'da_duyet',
    'bi_tu_choi',
    'da_dang'
);


ALTER TYPE public.trang_thai_noi_dung_enum OWNER TO postgres;

--
-- Name: trang_thai_phong_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_phong_enum AS ENUM (
    'maintenance',
    'active',
    'occupied'
);


ALTER TYPE public.trang_thai_phong_enum OWNER TO postgres;

--
-- Name: trang_thai_su_kien_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_su_kien_enum AS ENUM (
    'ban_nhap',
    'da_gui',
    'da_duyet',
    'tu_choi',
    'da_dang',
    'bi_tu_choi'
);


ALTER TYPE public.trang_thai_su_kien_enum OWNER TO postgres;

--
-- Name: vai_tro_nguoi_dung_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vai_tro_nguoi_dung_enum AS ENUM (
    'sinh_vien',
    'giao_vien',
    'doanh_nghiep',
    'quan_tri_vien',
    'kiem_duyet_vien'
);


ALTER TYPE public.vai_tro_nguoi_dung_enum OWNER TO postgres;

--
-- Name: vai_tro_thanh_vien_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vai_tro_thanh_vien_enum AS ENUM (
    'thanh_vien',
    'quan_tri_vien'
);


ALTER TYPE public.vai_tro_thanh_vien_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BaiViet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BaiViet" (
    id integer NOT NULL,
    id_tac_gia integer NOT NULL,
    id_bai_viet_goc integer,
    id_cuoc_hoi_thoai integer,
    noi_dung text,
    media_urls jsonb DEFAULT '[]'::jsonb,
    media_type public.media_type_enum,
    trang_thai public.trang_thai_noi_dung_enum DEFAULT 'cho_duyet'::public.trang_thai_noi_dung_enum NOT NULL,
    id_nguoi_duyet integer,
    ngay_tao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."BaiViet" OWNER TO postgres;

--
-- Name: BaiViet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BaiViet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BaiViet_id_seq" OWNER TO postgres;

--
-- Name: BaiViet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BaiViet_id_seq" OWNED BY public."BaiViet".id;


--
-- Name: BinhLuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BinhLuan" (
    id integer NOT NULL,
    id_bai_viet integer NOT NULL,
    id_tac_gia integer NOT NULL,
    id_binh_luan_cha integer,
    noi_dung text NOT NULL,
    ngay_tao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."BinhLuan" OWNER TO postgres;

--
-- Name: BinhLuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BinhLuan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BinhLuan_id_seq" OWNER TO postgres;

--
-- Name: BinhLuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BinhLuan_id_seq" OWNED BY public."BinhLuan".id;


--
-- Name: CuocGoi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CuocGoi" (
    id integer NOT NULL,
    id_cuoc_hoi_thoai integer NOT NULL,
    id_nguoi_goi integer NOT NULL,
    loai public.loai_cuoc_goi_enum NOT NULL,
    thoi_gian_bat_dau timestamp with time zone DEFAULT now() NOT NULL,
    thoi_gian_ket_thuc timestamp with time zone,
    url_ghi_am text
);


ALTER TABLE public."CuocGoi" OWNER TO postgres;

--
-- Name: CuocGoi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CuocGoi_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CuocGoi_id_seq" OWNER TO postgres;

--
-- Name: CuocGoi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CuocGoi_id_seq" OWNED BY public."CuocGoi".id;


--
-- Name: CuocHoiThoai; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CuocHoiThoai" (
    id integer NOT NULL,
    ten_hoi_thoai character varying(255),
    loai public.loai_cuoc_hoi_thoai_enum NOT NULL,
    id_nguoi_tao integer,
    ngay_tao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."CuocHoiThoai" OWNER TO postgres;

--
-- Name: CuocHoiThoai_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CuocHoiThoai_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CuocHoiThoai_id_seq" OWNER TO postgres;

--
-- Name: CuocHoiThoai_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CuocHoiThoai_id_seq" OWNED BY public."CuocHoiThoai".id;


--
-- Name: DangKySuKien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DangKySuKien" (
    id integer NOT NULL,
    id_nguoi_dung integer NOT NULL,
    id_su_kien integer NOT NULL,
    trang_thai public.trang_thai_dang_ky_enum DEFAULT 'da_dang_ky'::public.trang_thai_dang_ky_enum NOT NULL,
    ngay_gio_dang_ky timestamp with time zone DEFAULT now() NOT NULL,
    ngay_gio_diem_danh timestamp with time zone
);


ALTER TABLE public."DangKySuKien" OWNER TO postgres;

--
-- Name: DangKySuKien_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DangKySuKien_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DangKySuKien_id_seq" OWNER TO postgres;

--
-- Name: DangKySuKien_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DangKySuKien_id_seq" OWNED BY public."DangKySuKien".id;


--
-- Name: Khoa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Khoa" (
    id integer NOT NULL,
    ten_khoa character varying(255) NOT NULL
);


ALTER TABLE public."Khoa" OWNER TO postgres;

--
-- Name: Khoa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Khoa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Khoa_id_seq" OWNER TO postgres;

--
-- Name: Khoa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Khoa_id_seq" OWNED BY public."Khoa".id;


--
-- Name: LuotThich; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LuotThich" (
    id_nguoi_dung integer NOT NULL,
    id_doi_tuong integer NOT NULL,
    loai_doi_tuong character varying(50) NOT NULL,
    ngay_thich timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."LuotThich" OWNER TO postgres;

--
-- Name: Nganh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Nganh" (
    id integer NOT NULL,
    ten_nganh character varying(255) NOT NULL,
    id_khoa integer NOT NULL
);


ALTER TABLE public."Nganh" OWNER TO postgres;

--
-- Name: Nganh_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Nganh_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Nganh_id_seq" OWNER TO postgres;

--
-- Name: Nganh_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Nganh_id_seq" OWNED BY public."Nganh".id;


--
-- Name: NguoiDung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NguoiDung" (
    id integer NOT NULL,
    ho_ten character varying(255) NOT NULL,
    ma_sinh_vien character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    mat_khau_bam character varying(255) NOT NULL,
    vai_tro public.vai_tro_nguoi_dung_enum[] DEFAULT '{}'::public.vai_tro_nguoi_dung_enum[] NOT NULL,
    dong_gioi_thieu text,
    ngay_sinh date,
    so_dien_thoai character varying(20),
    anh_dai_dien_url text,
    anh_bia_url text,
    anh_nhan_dien_url text,
    id_nganh integer,
    lop_sh character varying(100),
    tong_diem integer DEFAULT 0 NOT NULL,
    ngay_tao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."NguoiDung" OWNER TO postgres;

--
-- Name: NguoiDung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."NguoiDung_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NguoiDung_id_seq" OWNER TO postgres;

--
-- Name: NguoiDung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."NguoiDung_id_seq" OWNED BY public."NguoiDung".id;


--
-- Name: Phong; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Phong" (
    id integer NOT NULL,
    ten_phong character varying(255) NOT NULL,
    toa character varying(255),
    co_so character varying(255),
    suc_chua integer,
    mo_ta text,
    trang_thai character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE public."Phong" OWNER TO postgres;

--
-- Name: Phong_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Phong_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Phong_id_seq" OWNER TO postgres;

--
-- Name: Phong_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Phong_id_seq" OWNED BY public."Phong".id;


--
-- Name: SuKien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SuKien" (
    id integer NOT NULL,
    id_nguoi_tao integer NOT NULL,
    id_bai_viet integer NOT NULL,
    id_phong integer,
    ten_su_kien character varying(255) NOT NULL,
    mo_ta text,
    ke_hoach_chi_tiet jsonb,
    dia_diem character varying(255),
    thoi_gian_bat_dau timestamp with time zone NOT NULL,
    thoi_gian_ket_thuc timestamp with time zone NOT NULL,
    so_luong_toi_da integer NOT NULL,
    diem_thuong integer NOT NULL,
    trang_thai public.trang_thai_su_kien_enum DEFAULT 'ban_nhap'::public.trang_thai_su_kien_enum NOT NULL,
    id_nguoi_duyet integer
);


ALTER TABLE public."SuKien" OWNER TO postgres;

--
-- Name: SuKien_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SuKien_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SuKien_id_seq" OWNER TO postgres;

--
-- Name: SuKien_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SuKien_id_seq" OWNED BY public."SuKien".id;


--
-- Name: ThanhVienHoiThoai; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ThanhVienHoiThoai" (
    id_nguoi_dung integer NOT NULL,
    id_cuoc_hoi_thoai integer NOT NULL,
    vai_tro public.vai_tro_thanh_vien_enum DEFAULT 'thanh_vien'::public.vai_tro_thanh_vien_enum NOT NULL,
    ngay_gio_tham_gia timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."ThanhVienHoiThoai" OWNER TO postgres;

--
-- Name: ThongBao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ThongBao" (
    id integer NOT NULL,
    id_nguoi_nhan integer NOT NULL,
    id_nguoi_hanh_dong integer NOT NULL,
    loai character varying(50) NOT NULL,
    id_muc_tieu integer,
    loai_muc_tieu character varying(50),
    da_doc boolean DEFAULT false NOT NULL,
    ngay_tao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."ThongBao" OWNER TO postgres;

--
-- Name: ThongBao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ThongBao_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ThongBao_id_seq" OWNER TO postgres;

--
-- Name: ThongBao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ThongBao_id_seq" OWNED BY public."ThongBao".id;


--
-- Name: TinNhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TinNhan" (
    id bigint NOT NULL,
    id_cuoc_hoi_thoai integer NOT NULL,
    id_nguoi_gui integer NOT NULL,
    noi_dung text NOT NULL,
    thoi_gian_gui timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."TinNhan" OWNER TO postgres;

--
-- Name: TinNhan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."TinNhan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TinNhan_id_seq" OWNER TO postgres;

--
-- Name: TinNhan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."TinNhan_id_seq" OWNED BY public."TinNhan".id;


--
-- Name: BaiViet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet" ALTER COLUMN id SET DEFAULT nextval('public."BaiViet_id_seq"'::regclass);


--
-- Name: BinhLuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BinhLuan" ALTER COLUMN id SET DEFAULT nextval('public."BinhLuan_id_seq"'::regclass);


--
-- Name: CuocGoi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocGoi" ALTER COLUMN id SET DEFAULT nextval('public."CuocGoi_id_seq"'::regclass);


--
-- Name: CuocHoiThoai id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocHoiThoai" ALTER COLUMN id SET DEFAULT nextval('public."CuocHoiThoai_id_seq"'::regclass);


--
-- Name: DangKySuKien id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DangKySuKien" ALTER COLUMN id SET DEFAULT nextval('public."DangKySuKien_id_seq"'::regclass);


--
-- Name: Khoa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Khoa" ALTER COLUMN id SET DEFAULT nextval('public."Khoa_id_seq"'::regclass);


--
-- Name: Nganh id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Nganh" ALTER COLUMN id SET DEFAULT nextval('public."Nganh_id_seq"'::regclass);


--
-- Name: NguoiDung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung" ALTER COLUMN id SET DEFAULT nextval('public."NguoiDung_id_seq"'::regclass);


--
-- Name: Phong id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Phong" ALTER COLUMN id SET DEFAULT nextval('public."Phong_id_seq"'::regclass);


--
-- Name: SuKien id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien" ALTER COLUMN id SET DEFAULT nextval('public."SuKien_id_seq"'::regclass);


--
-- Name: ThongBao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThongBao" ALTER COLUMN id SET DEFAULT nextval('public."ThongBao_id_seq"'::regclass);


--
-- Name: TinNhan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TinNhan" ALTER COLUMN id SET DEFAULT nextval('public."TinNhan_id_seq"'::regclass);


--
-- Data for Name: BaiViet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BaiViet" (id, id_tac_gia, id_bai_viet_goc, id_cuoc_hoi_thoai, noi_dung, media_urls, media_type, trang_thai, id_nguoi_duyet, ngay_tao) FROM stdin;
1	1	\N	\N	Chào mọi người! Mình vừa hoàn thành đồ án môn Lập trình Web. Cảm ơn thầy và các bạn đã hỗ trợ nhiệt tình. Đây là những gì mình học được trong quá trình làm đồ án: React.js thật sự rất mạnh mẽ, việc tổ chức component tốt sẽ giúp code dễ maintain hơn rất nhiều! 💻✨	[]	\N	da_dang	\N	2026-01-01 20:35:56.049997+07
2	4	\N	\N	🎓 TIN VUI! Trường vừa công bố danh sách sinh viên đạt học bổng học kỳ 1 năm học 2024-2025. Xin chúc mừng các bạn đã nỗ lực và đạt được thành tích xuất sắc! Các bạn hãy tiếp tục phát huy trong học kỳ tiếp theo nhé! 🏆	[]	\N	da_dang	\N	2026-01-01 17:35:56.049997+07
3	5	\N	\N	CLB Lập trình UTE đang tuyển thành viên mới cho năm học 2024-2025! 🚀 Nếu bạn đam mê lập trình, muốn học hỏi và phát triển kỹ năng cùng các bạn có cùng đam mê, hãy tham gia với chúng mình nhé! Đăng ký tại: https://utecode.club 💻	[]	\N	da_dang	\N	2025-12-31 22:35:56.049997+07
4	6	\N	\N	Giải bóng đá sinh viên UTE Cup 2024 đã kết thúc thành công! Xin chúc mừng đội Khoa CNTT đã giành chức vô địch. Cảm ơn tất cả các bạn đã tham gia và cổ vũ nhiệt tình! ⚽🏆 #UTESports	[]	\N	da_dang	\N	2025-12-31 22:35:56.049997+07
5	7	\N	\N	Cho mình hỏi môn Cấu trúc dữ liệu và Giải thuật học kỳ này ai học với thầy Nguyễn Văn A không? Môn này khó không các bạn? Mình cần tài liệu tham khảo ạ! 📚	[]	\N	da_dang	\N	2026-01-01 19:35:56.049997+07
6	4	\N	\N	Vừa kết thúc 2 tháng thực tập tại công ty công nghệ FPT Software. Trải nghiệm thật sự bổ ích! Được làm việc với các anh chị senior, học được rất nhiều về quy trình làm việc chuyên nghiệp và các công nghệ mới. Cảm ơn công ty và thầy cô đã tạo cơ hội! 🙏💼	[]	\N	da_dang	\N	2026-01-01 16:35:56.049997+07
7	3	\N	\N	📢 THÔNG BÁO: Do thời tiết xấu, trường thông báo nghỉ học vào chiều nay (15/11). Các lớp học buổi chiều sẽ được dời sang thứ 7 tuần này. Sinh viên theo dõi email để cập nhật lịch học bù chi tiết. Stay safe everyone! 🌧️	[]	\N	da_dang	\N	2026-01-01 18:35:56.049997+07
8	8	\N	\N	Mình vừa nhận được thư mời học bổng toàn phần từ đại học Tokyo Institute of Technology! 🇯🇵✨ Cảm ơn thầy cô đã hỗ trợ mình trong suốt quá trình chuẩn bị hồ sơ. Nếu bạn nào có mơ ước du học, hãy cố gắng và đừng bỏ cuộc nhé!	[]	\N	da_dang	\N	2026-01-01 14:35:56.049997+07
9	1	\N	\N	Các bạn có ai đang làm đồ án tốt nghiệp về AI/Machine Learning không? Mình đang tìm người cùng nghiên cứu và chia sẻ tài liệu. Có thể tạo nhóm study cùng nhau! 🤖📊 Inbox mình nha!	[]	\N	da_dang	\N	2026-01-01 12:35:56.049997+07
10	5	\N	\N	Hôm nay là ngày cuối cùng của tuần lễ sinh viên năm 2024! Cảm ơn Ban tổ chức và tất cả các bạn đã tham gia nhiệt tình. Những kỷ niệm đẹp sẽ mãi in sâu trong lòng chúng mình. Hẹn gặp lại các bạn vào năm sau! 🎉🎓💙	[]	\N	da_dang	\N	2026-01-01 10:35:56.049997+07
21	10	\N	\N	Hội thảo AI và Machine Learning trong thời đại số	[]	\N	da_dang	10	2026-01-01 22:36:31.243+07
11	10	\N	\N	🎓 Hội thảo "AI và Machine Learning trong thời đại số" sẽ diễn ra vào tuần tới. Đây là cơ hội tuyệt vời để các bạn sinh viên được học hỏi từ các chuyên gia hàng đầu trong lĩnh vực AI. Đăng ký ngay để nhận 60 điểm hoạt động!	[]	\N	da_dang	\N	2026-01-01 21:35:56.049997+07
12	10	\N	\N	💻 Workshop "Xây dựng ứng dụng web hiện đại với React.js" - Học từ cơ bản đến nâng cao. Phù hợp cho sinh viên đang học lập trình web và muốn nâng cao kỹ năng frontend!	[]	\N	da_dang	\N	2026-01-01 20:35:56.049997+07
13	10	\N	\N	⚽ Giải bóng đá UTE Cup 2024 chính thức khai mạc! Đăng ký tham gia để thể hiện kỹ năng và giành điểm hoạt động cao!	[]	\N	da_dang	\N	2026-01-01 19:35:56.049997+07
14	10	\N	\N	🚀 UTE Hackathon 2024 - Sân chơi dành cho các tài năng lập trình! 48 giờ code marathon với giải thưởng lên đến 50 triệu đồng!	[]	\N	da_dang	\N	2026-01-01 18:35:56.049997+07
15	10	\N	\N	💼 Ngày hội việc làm UTE 2024 với sự tham gia của hơn 50 doanh nghiệp lớn. Cơ hội tìm việc làm và thực tập cho sinh viên!	[]	\N	da_dang	\N	2026-01-01 17:35:56.049997+07
16	10	\N	\N	🌱 Chiến dịch "Mùa đông ấm cho em" - Hành trình tình nguyện đến với trẻ em vùng cao. Cùng góp sức mang yêu thương đến những em nhỏ!	[]	\N	da_dang	\N	2026-01-01 16:35:56.049997+07
17	10	\N	\N	🔗 Workshop "Blockchain và Cryptocurrency" - Tìm hiểu công nghệ đang thay đổi tương lai tài chính toàn cầu!	[]	\N	da_dang	\N	2026-01-01 15:35:56.049997+07
18	10	\N	\N	💡 Cuộc thi Ý tưởng Khởi nghiệp UTE Startup Challenge 2024. Biến ý tưởng thành hiện thực với hỗ trợ từ các mentor chuyên nghiệp!	[]	\N	da_dang	\N	2026-01-01 14:35:56.049997+07
19	10	\N	\N	🏃‍♂️ UTE Marathon 2024 - Chạy vì sức khỏe, chạy vì cộng đồng! Cự ly: 5km, 10km, 21km. Đăng ký sớm để nhận áo đấu miễn phí!	[]	\N	da_dang	\N	2026-01-01 13:35:56.049997+07
20	10	\N	\N	🌏 Hội thảo "Định hướng du học - Con đường phát triển bản thân". Tư vấn miễn phí về học bổng Nhật Bản, Hàn Quốc, Đức, Úc...	[]	\N	da_dang	\N	2026-01-01 12:35:56.049997+07
22	10	\N	\N	Sự kiện cho sinh viên	[]	\N	da_dang	10	2026-01-02 18:56:40.958+07
23	10	\N	\N	Hội thảo AI và Machine Learning trong thời đại số	[]	\N	da_dang	10	2026-01-02 19:24:39.019+07
24	10	\N	\N	Hội thảo AI và Machine Learning trong thời đại số	[]	\N	da_dang	10	2026-01-10 19:40:41.983+07
25	10	\N	\N	Hội thảo AI và Machine Learning trong thời đại số	[]	\N	cho_duyet	\N	2026-01-11 10:43:26.421+07
\.


--
-- Data for Name: BinhLuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BinhLuan" (id, id_bai_viet, id_tac_gia, id_binh_luan_cha, noi_dung, ngay_tao) FROM stdin;
1	1	4	\N	Chúc mừng bạn nhé! Đồ án của bạn rất ấn tượng đấy! 🎉	2026-01-01 21:35:56.049997+07
2	1	5	\N	Mình cũng vừa học xong React, thật sự rất thú vị!	2026-01-01 21:45:56.049997+07
3	2	1	\N	Chúc mừng các bạn đạt học bổng! Năm sau mình cũng phải cố gắng thêm!	2026-01-01 18:35:56.049997+07
4	3	6	\N	CLB này có dạy AI không bạn? Mình đang quan tâm lắm!	2026-01-01 02:35:56.049997+07
5	4	7	\N	Trận chung kết hôm qua thật sự kịch tính! Xứng đáng là nhà vô địch!	2025-12-31 23:35:56.049997+07
\.


--
-- Data for Name: CuocGoi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CuocGoi" (id, id_cuoc_hoi_thoai, id_nguoi_goi, loai, thoi_gian_bat_dau, thoi_gian_ket_thuc, url_ghi_am) FROM stdin;
\.


--
-- Data for Name: CuocHoiThoai; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CuocHoiThoai" (id, ten_hoi_thoai, loai, id_nguoi_tao, ngay_tao) FROM stdin;
1	Lê Hà Bình	rieng_tu	10	2026-01-02 19:34:51.415+07
2	Nhóm 1	nhom	10	2026-01-11 11:06:55.209+07
\.


--
-- Data for Name: DangKySuKien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DangKySuKien" (id, id_nguoi_dung, id_su_kien, trang_thai, ngay_gio_dang_ky, ngay_gio_diem_danh) FROM stdin;
1	1	1	da_dang_ky	2026-01-01 22:05:56.049997+07	\N
2	4	1	da_dang_ky	2026-01-01 21:35:56.049997+07	\N
3	5	1	da_dang_ky	2026-01-01 20:35:56.049997+07	\N
4	6	1	da_dang_ky	2026-01-01 19:35:56.049997+07	\N
5	1	2	da_dang_ky	2026-01-01 21:35:56.049997+07	\N
7	1	3	da_dang_ky	2026-01-01 20:35:56.049997+07	\N
8	4	4	da_dang_ky	2026-01-01 19:35:56.049997+07	\N
9	5	5	da_dang_ky	2026-01-01 18:35:56.049997+07	\N
10	7	1	da_dang_ky	2026-01-02 19:32:14.956+07	2026-01-02 19:34:15.45+07
6	7	2	da_dang_ky	2026-01-01 20:35:56.049997+07	2026-01-02 19:42:49.84+07
11	7	3	da_dang_ky	2026-01-02 19:45:17.424+07	\N
\.


--
-- Data for Name: Khoa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Khoa" (id, ten_khoa) FROM stdin;
1	Công nghệ Thông tin
2	Điện - Điện tử
3	Cơ khí
\.


--
-- Data for Name: LuotThich; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LuotThich" (id_nguoi_dung, id_doi_tuong, loai_doi_tuong, ngay_thich) FROM stdin;
1	1	bai_viet	2026-01-01 21:35:56.049997+07
4	1	bai_viet	2026-01-01 21:45:56.049997+07
5	1	bai_viet	2026-01-01 21:50:56.049997+07
1	2	bai_viet	2026-01-01 18:35:56.049997+07
4	2	bai_viet	2026-01-01 19:35:56.049997+07
5	2	bai_viet	2026-01-01 20:35:56.049997+07
6	2	bai_viet	2026-01-01 21:35:56.049997+07
7	2	bai_viet	2026-01-01 22:05:56.049997+07
\.


--
-- Data for Name: Nganh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Nganh" (id, ten_nganh, id_khoa) FROM stdin;
1	Công nghệ Thông tin	1
2	An toàn Thông tin	1
3	Tự động hóa	2
4	Cơ điện tử	3
\.


--
-- Data for Name: NguoiDung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NguoiDung" (id, ho_ten, ma_sinh_vien, email, mat_khau_bam, vai_tro, dong_gioi_thieu, ngay_sinh, so_dien_thoai, anh_dai_dien_url, anh_bia_url, anh_nhan_dien_url, id_nganh, lop_sh, tong_diem, ngay_tao) FROM stdin;
1	Phạm Minh Tuấn	21115053120101	tuanpm@student.ute.edu.vn	$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	1	21DTHD1	850	2026-01-01 22:35:56.049997+07
3	Trần Văn Đức	21115053120103	ductv@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	1	21DTHD2	780	2026-01-01 22:35:56.049997+07
4	Lê Thị Mai	21115053120104	mailt@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	3	21TDHH1	1100	2026-01-01 22:35:56.049997+07
5	Hoàng Văn Nam	21115053120106	namhv@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	1	21DTHD1	950	2026-01-01 22:35:56.049997+07
6	Vũ Thị Lan	21115053120107	lanvt@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	2	21A1	870	2026-01-01 22:35:56.049997+07
8	Lê Kìm Nam	21115053120108	lkn@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	2	21T1	870	2026-01-01 22:35:56.049997+07
9	Lê Ngọc Hào	21115053120109	lnh@student.ute.edu.vn	$2a$10$hashed_password	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	2	21A1	870	2026-01-01 22:35:56.049997+07
10	Đỗ Minh Khoa	21115053120110	khoadm@ute.edu.vn	$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.	{quan_tri_vien}	\N	2003-12-06	\N	\N	\N	\N	\N	\N	0	2026-01-01 22:35:56.049997+07
11	Nguyễn Văn A	2111505312069	a@sv.ute.udn.vn	$2b$10$f0p2ccTf31BVjT960JLnUutcECbUIEu7qmRUrYUULAiBKuMdi1PTK	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	\N	\N	0	2026-01-01 23:54:32.604+07
7	Lê Hà Bình	21115053120105	binhlh12@sv.ute.udn.vn	$2y$10$nKyZ7Pitflx.hkwgc4fbXOHJGwsx8Wnv3fX3PSzpHbRku.oeGGRu.	{sinh_vien}	\N	2003-12-06	\N	\N	\N	\N	2	22T1	1000	2026-01-01 22:35:56.049997+07
\.


--
-- Data for Name: Phong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Phong" (id, ten_phong, toa, co_so, suc_chua, mo_ta, trang_thai) FROM stdin;
1	Phòng 101	Toà A	Cơ sở 1	40	Phòng học lý thuyết, bảng trắng, máy chiếu	active
2	Phòng 102	Toà A	Cơ sở 1	40	Phòng học nhỏ	active
3	Phòng A201	Toà A	Cơ sở 1	80	Giảng đường lớn, âm thanh, máy chiếu	active
4	Phòng B105	Toà B	Cơ sở 2	35	Phòng thực hành máy tính	active
5	Phòng Thí nghiệm Hóa	Toà C	Cơ sở 1	25	Trang bị tủ hút và bồn rửa	active
6	Phòng Thí nghiệm CNTT	Toà C	Cơ sở 1	30	Máy tính, router thực hành	active
7	Phòng Hội thảo 1	Toà D	Cơ sở 1	120	Hội trường đa năng, sân khấu nhỏ	active
8	Phòng Hội thảo 2	Toà D	Cơ sở 1	200	Hội trường lớn, sự kiện sinh viên	active
\.


--
-- Data for Name: SuKien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SuKien" (id, id_nguoi_tao, id_bai_viet, id_phong, ten_su_kien, mo_ta, ke_hoach_chi_tiet, dia_diem, thoi_gian_bat_dau, thoi_gian_ket_thuc, so_luong_toi_da, diem_thuong, trang_thai, id_nguoi_duyet) FROM stdin;
1	10	11	\N	Hội thảo AI và Machine Learning trong thời đại số	Hội thảo chuyên đề về ứng dụng AI trong các lĩnh vực: Y tế, Giáo dục, Tài chính. Diễn giả: TS. Nguyễn Văn Minh - Chuyên gia AI tại Google Brain.	\N	Hội trường A - Tòa nhà H6	2026-01-06 22:35:56.049997+07	2026-01-07 01:35:56.049997+07	100	60	da_dang	\N
2	10	12	\N	Workshop: Xây dựng ứng dụng web với React.js	Workshop thực hành xây dựng một ứng dụng Todo List hoàn chỉnh. Yêu cầu: Biết JavaScript cơ bản. Mang theo laptop.	\N	Phòng Lab 301 - Tòa nhà A1	2026-01-04 22:35:56.049997+07	2026-01-05 02:35:56.049997+07	50	70	da_dang	\N
3	10	13	\N	Giải bóng đá UTE Cup 2024	Giải bóng đá giao hữu giữa các khoa. Mỗi đội 7 người (5 chính + 2 dự bị). Giải thưởng hấp dẫn cho đội vô địch!	\N	Sân bóng đá trường UTE	2026-01-08 22:35:56.049997+07	2026-01-09 02:35:56.049997+07	200	50	da_dang	\N
4	10	14	\N	UTE Hackathon 2024 - Code for Future	Cuộc thi lập trình 48 giờ. Đội 3-5 người. Giải quyết các bài toán thực tế về Smart City, IoT, AI. Tài trợ bởi FPT Software.	\N	Khu A - Tòa nhà Thực hành	2026-01-15 22:35:56.049997+07	2026-01-17 22:35:56.049997+07	150	100	da_dang	\N
5	10	15	\N	Ngày hội việc làm UTE Career Fair 2024	Gặp gỡ nhà tuyển dụng từ các công ty: FPT, Viettel, VNG, VinGroup, Samsung... Mang theo CV để nộp trực tiếp!	\N	Sân vận động Hoà Bình	2026-01-11 22:35:56.049997+07	2026-01-12 06:35:56.049997+07	500	40	da_dang	\N
6	10	16	\N	Chiến dịch Mùa đông ấm cho em	Hành trình 3 ngày 2 đêm đến Sapa - Lào Cai. Mang quà tặng, sách vở, áo ấm cho trẻ em vùng cao. Chi phí: 500k/người.	\N	Điểm tập trung: Cổng trường UTE	2026-01-22 22:35:56.049997+07	2026-01-25 22:35:56.049997+07	80	90	da_dang	\N
7	10	17	\N	Workshop: Blockchain và Ứng dụng thực tế	Khám phá công nghệ Blockchain, Smart Contract, DeFi. Thực hành tạo một ứng dụng đơn giản trên Ethereum.	\N	Phòng 401 - Tòa nhà B2	2026-01-07 22:35:56.049997+07	2026-01-08 01:35:56.049997+07	60	75	da_dang	\N
8	10	18	\N	UTE Startup Challenge 2024	Cuộc thi khởi nghiệp dành cho sinh viên. Giải nhất: 30 triệu + Mentorship 6 tháng. Pitching trước hội đồng đầu tư.	\N	Trung tâm Khởi nghiệp UTE	2026-01-31 22:35:56.049997+07	2026-02-01 06:35:56.049997+07	100	80	da_dang	\N
9	10	19	\N	UTE Marathon 2024 - Run for Health	Giải chạy Marathon từ thiện. Toàn bộ lệ phí tham gia sẽ được ủng hộ xây dựng thư viện cho học sinh vùng cao.	\N	Công viên Gia Định	2026-01-16 22:35:56.049997+07	2026-01-17 04:35:56.049997+07	300	45	da_dang	\N
10	10	20	\N	Hội thảo Định hướng Du học quốc tế 2024	Gặp gỡ đại diện các trường đại học quốc tế. Tìm hiểu về học bổng toàn phần, quy trình apply, kinh nghiệm từ du học sinh.	\N	Hội trường C - Tòa nhà H6	2026-01-13 22:35:56.049997+07	2026-01-14 01:35:56.049997+07	120	55	da_dang	\N
11	10	21	\N	Hội thảo AI và Machine Learning trong thời đại số	Hội thảo AI và Machine Learning trong thời đại số	{"tasks": [{"id": "t1767281782210", "order": 1, "title": "sdggfsgdfhg", "result": "fghf", "status": "done", "approved": true, "assignee": {"id": 7, "name": "Lê Hà Bình", "type": "user", "email": "binhlh12@sv.ute.udn.vn"}, "deadline": "2026-01-02T22:36", "feedback": "oke rồi đó", "attachments": [{"url": "https://res.cloudinary.com/myblogpage/image/upload/v1767282434/ute-social/task-documents/xyk9lnhgczescm0erwqg.pdf", "size": 434534, "mimetype": "application/pdf", "public_id": "ute-social/task-documents/xyk9lnhgczescm0erwqg", "originalname": "125_ERD_NguyenThiHaQuyen_LeHaBinh_WebHoatDongCongDongUTE_Scan.pdf", "resource_type": "raw"}, {"url": "https://res.cloudinary.com/myblogpage/image/upload/v1767282435/ute-social/task-images/tuwmtzycwx2p5k3ejxls.png", "size": 47618, "mimetype": "image/png", "public_id": "ute-social/task-images/tuwmtzycwx2p5k3ejxls", "originalname": "Pháº§n viáº¿t bÃ i viáº¿t.png", "resource_type": "image"}], "description": "sdfsdfsd", "reviewed_at": "2026-01-01T15:47:37.631Z", "reviewed_by": 10, "completed_at": "2026-01-01T15:47:16.872Z", "submitted_at": "2026-01-01T15:47:16.872Z"}], "targetAudience": {"roles": ["dieu_phoi_vien", "giao_vien", "quan_tri_vien"], "khoa_ids": [1], "mandatory": [], "voluntary": true}}	Khách sạn Lmao	2026-01-08 22:36:00+07	2026-01-09 22:36:00+07	100	60	da_dang	10
15	10	25	1	Hội thảo AI và Machine Learning trong thời đại số	Hội thảo AI và Machine Learning trong thời đại số	{"tasks": [{"id": "t1768102962793_0", "order": 1, "title": "Nộp bản kế hoạch pdf", "result": null, "status": "todo", "approved": null, "assignee": {"id": 7, "name": "Lê Hà Bình", "type": "user", "email": "binhlh12@sv.ute.udn.vn"}, "deadline": "2026-01-15T10:43", "feedback": null, "attachments": [], "description": "Nộp bản kế hoạch pdf", "completed_at": null}], "targetAudience": {"roles": [], "khoa_ids": [], "mandatory": [], "voluntary": true}}	Phòng 101	2026-01-18 12:30:00+07	2026-01-18 19:45:00+07	100	60	ban_nhap	\N
12	10	22	1	Hội thảo AI và Machine Learning trong thời đại số	Sự kiện cho sinh viên	{"tasks": [], "targetAudience": {"roles": ["sinh_vien"], "khoa_ids": [], "mandatory": [], "voluntary": true}}	Phòng 101	2026-01-03 10:45:00+07	2026-01-03 16:45:00+07	100	60	da_dang	10
13	10	23	1	Hội thảo AI và Machine Learning trong thời đại số	Hội thảo AI và Machine Learning trong thời đại số	{"tasks": [{"id": "t1767356625183", "order": 1, "title": "Nộp bản kế hoạch pdf", "result": "file pdf", "status": "done", "approved": true, "assignee": {"id": 7, "name": "Lê Hà Bình", "type": "user", "email": "binhlh12@sv.ute.udn.vn"}, "deadline": "2026-01-04T19:24", "feedback": "", "attachments": [{"url": "https://res.cloudinary.com/myblogpage/image/upload/v1767356740/ute-social/task-documents/fr7vxrxzjsy5mvlx7ox5.pdf", "size": 549858, "mimetype": "application/pdf", "public_id": "ute-social/task-documents/fr7vxrxzjsy5mvlx7ox5", "originalname": "CV_LÃª HÃ  BÃ¬nh_Fresher-FullStack-Tester.pdf", "resource_type": "raw"}], "description": "Nộp bản kế hoạch pdf", "reviewed_at": "2026-01-02T12:27:05.642Z", "reviewed_by": 10, "completed_at": "2026-01-02T12:25:42.102Z", "submitted_at": "2026-01-02T12:25:42.102Z"}], "targetAudience": {"roles": ["sinh_vien"], "khoa_ids": [], "mandatory": [], "voluntary": true}}	Phòng 101	2026-01-04 09:00:00+07	2026-01-04 15:00:00+07	100	60	da_dang	10
14	10	24	1	Hội thảo AI và Machine Learning trong thời đại số	Hội thảo AI và Machine Learning trong thời đại số	{"tasks": [{"id": "t1768048828029_0", "order": 1, "title": "Nộp bản kế hoạch pdf", "result": "dsfsdgs", "status": "done", "approved": true, "assignee": {"id": 7, "name": "Lê Hà Bình", "type": "user", "email": "binhlh12@sv.ute.udn.vn"}, "deadline": "", "feedback": "", "attachments": [{"url": "https://res.cloudinary.com/myblogpage/image/upload/v1768048867/ute-social/task-images/eywkpwj0xs6h4czwxj8e.png", "size": 145296, "mimetype": "image/png", "public_id": "ute-social/task-images/eywkpwj0xs6h4czwxj8e", "originalname": "Frame 1.png", "resource_type": "image"}], "description": "Nộp bản kế hoạch pdf", "reviewed_at": "2026-01-10T12:41:29.742Z", "reviewed_by": 10, "completed_at": "2026-01-10T12:41:08.579Z", "submitted_at": "2026-01-10T12:41:08.579Z"}], "targetAudience": {"roles": ["sinh_vien"], "khoa_ids": [], "mandatory": [], "voluntary": true}}	Phòng 101	2026-01-06 10:15:00+07	2026-01-06 17:00:00+07	100	60	da_dang	10
\.


--
-- Data for Name: ThanhVienHoiThoai; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ThanhVienHoiThoai" (id_nguoi_dung, id_cuoc_hoi_thoai, vai_tro, ngay_gio_tham_gia) FROM stdin;
10	1	thanh_vien	2026-01-02 19:34:51.427+07
7	1	thanh_vien	2026-01-02 19:34:51.427+07
10	2	quan_tri_vien	2026-01-11 11:06:55.213+07
\.


--
-- Data for Name: ThongBao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ThongBao" (id, id_nguoi_nhan, id_nguoi_hanh_dong, loai, id_muc_tieu, loai_muc_tieu, da_doc, ngay_tao) FROM stdin;
1	7	10	phan_cong_task	11	ke_hoach	f	2026-01-01 22:36:31.253+07
3	7	10	task_approved	11	su_kien	f	2026-01-01 22:47:37.634+07
4	7	10	phan_cong_task	13	ke_hoach	f	2026-01-02 19:24:39.026+07
6	7	10	task_approved	13	su_kien	f	2026-01-02 19:27:05.654+07
7	7	10	diem_danh_thanh_cong	1	su_kien	f	2026-01-02 19:34:15.452+07
8	7	10	diem_danh_thanh_cong	2	su_kien	f	2026-01-02 19:42:49.843+07
2	10	7	submit_nhiem_vu	11	su_kien	t	2026-01-01 22:47:16.878+07
5	10	7	submit_nhiem_vu	13	su_kien	t	2026-01-02 19:25:42.114+07
9	7	10	phan_cong_task	14	ke_hoach	f	2026-01-10 19:40:41.998+07
11	7	10	task_approved	14	su_kien	f	2026-01-10 19:41:29.745+07
12	7	10	phan_cong_task	15	ke_hoach	f	2026-01-11 10:43:26.439+07
10	10	7	submit_nhiem_vu	14	su_kien	t	2026-01-10 19:41:08.585+07
\.


--
-- Data for Name: TinNhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TinNhan" (id, id_cuoc_hoi_thoai, id_nguoi_gui, noi_dung, thoi_gian_gui) FROM stdin;
1	1	10	alo	2026-01-02 19:34:53.559+07
2	1	7	fdg	2026-01-02 19:34:59.138+07
3	1	7	hello	2026-01-11 10:56:06.438+07
\.


--
-- Name: BaiViet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BaiViet_id_seq"', 25, true);


--
-- Name: BinhLuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BinhLuan_id_seq"', 5, true);


--
-- Name: CuocGoi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CuocGoi_id_seq"', 1, false);


--
-- Name: CuocHoiThoai_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CuocHoiThoai_id_seq"', 2, true);


--
-- Name: DangKySuKien_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DangKySuKien_id_seq"', 11, true);


--
-- Name: Khoa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Khoa_id_seq"', 3, true);


--
-- Name: Nganh_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Nganh_id_seq"', 4, true);


--
-- Name: NguoiDung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."NguoiDung_id_seq"', 11, true);


--
-- Name: Phong_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Phong_id_seq"', 8, true);


--
-- Name: SuKien_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SuKien_id_seq"', 15, true);


--
-- Name: ThongBao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ThongBao_id_seq"', 12, true);


--
-- Name: TinNhan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TinNhan_id_seq"', 3, true);


--
-- Name: BaiViet BaiViet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet"
    ADD CONSTRAINT "BaiViet_pkey" PRIMARY KEY (id);


--
-- Name: BinhLuan BinhLuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BinhLuan"
    ADD CONSTRAINT "BinhLuan_pkey" PRIMARY KEY (id);


--
-- Name: CuocGoi CuocGoi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocGoi"
    ADD CONSTRAINT "CuocGoi_pkey" PRIMARY KEY (id);


--
-- Name: CuocHoiThoai CuocHoiThoai_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocHoiThoai"
    ADD CONSTRAINT "CuocHoiThoai_pkey" PRIMARY KEY (id);


--
-- Name: DangKySuKien DangKySuKien_id_nguoi_dung_id_su_kien_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DangKySuKien"
    ADD CONSTRAINT "DangKySuKien_id_nguoi_dung_id_su_kien_key" UNIQUE (id_nguoi_dung, id_su_kien);


--
-- Name: DangKySuKien DangKySuKien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DangKySuKien"
    ADD CONSTRAINT "DangKySuKien_pkey" PRIMARY KEY (id);


--
-- Name: Khoa Khoa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Khoa"
    ADD CONSTRAINT "Khoa_pkey" PRIMARY KEY (id);


--
-- Name: Khoa Khoa_ten_khoa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Khoa"
    ADD CONSTRAINT "Khoa_ten_khoa_key" UNIQUE (ten_khoa);


--
-- Name: LuotThich LuotThich_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LuotThich"
    ADD CONSTRAINT "LuotThich_pkey" PRIMARY KEY (id_nguoi_dung, id_doi_tuong, loai_doi_tuong);


--
-- Name: Nganh Nganh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Nganh"
    ADD CONSTRAINT "Nganh_pkey" PRIMARY KEY (id);


--
-- Name: Nganh Nganh_ten_nganh_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Nganh"
    ADD CONSTRAINT "Nganh_ten_nganh_key" UNIQUE (ten_nganh);


--
-- Name: NguoiDung NguoiDung_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung"
    ADD CONSTRAINT "NguoiDung_email_key" UNIQUE (email);


--
-- Name: NguoiDung NguoiDung_ma_sinh_vien_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung"
    ADD CONSTRAINT "NguoiDung_ma_sinh_vien_key" UNIQUE (ma_sinh_vien);


--
-- Name: NguoiDung NguoiDung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung"
    ADD CONSTRAINT "NguoiDung_pkey" PRIMARY KEY (id);


--
-- Name: NguoiDung NguoiDung_so_dien_thoai_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung"
    ADD CONSTRAINT "NguoiDung_so_dien_thoai_key" UNIQUE (so_dien_thoai);


--
-- Name: Phong Phong_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Phong"
    ADD CONSTRAINT "Phong_pkey" PRIMARY KEY (id);


--
-- Name: SuKien SuKien_id_bai_viet_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_id_bai_viet_key" UNIQUE (id_bai_viet);


--
-- Name: SuKien SuKien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_pkey" PRIMARY KEY (id);


--
-- Name: ThanhVienHoiThoai ThanhVienHoiThoai_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThanhVienHoiThoai"
    ADD CONSTRAINT "ThanhVienHoiThoai_pkey" PRIMARY KEY (id_nguoi_dung, id_cuoc_hoi_thoai);


--
-- Name: ThongBao ThongBao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThongBao"
    ADD CONSTRAINT "ThongBao_pkey" PRIMARY KEY (id);


--
-- Name: TinNhan TinNhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TinNhan"
    ADD CONSTRAINT "TinNhan_pkey" PRIMARY KEY (id);


--
-- Name: BaiViet_id_cuoc_hoi_thoai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BaiViet_id_cuoc_hoi_thoai_idx" ON public."BaiViet" USING btree (id_cuoc_hoi_thoai);


--
-- Name: BaiViet_id_tac_gia_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BaiViet_id_tac_gia_idx" ON public."BaiViet" USING btree (id_tac_gia);


--
-- Name: BaiViet_media_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BaiViet_media_type_idx" ON public."BaiViet" USING btree (media_type);


--
-- Name: BinhLuan_id_bai_viet_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BinhLuan_id_bai_viet_idx" ON public."BinhLuan" USING btree (id_bai_viet);


--
-- Name: BinhLuan_id_tac_gia_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BinhLuan_id_tac_gia_idx" ON public."BinhLuan" USING btree (id_tac_gia);


--
-- Name: DangKySuKien_id_su_kien_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DangKySuKien_id_su_kien_idx" ON public."DangKySuKien" USING btree (id_su_kien);


--
-- Name: LuotThich_id_doi_tuong_loai_doi_tuong_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LuotThich_id_doi_tuong_loai_doi_tuong_idx" ON public."LuotThich" USING btree (id_doi_tuong, loai_doi_tuong);


--
-- Name: Nganh_id_khoa_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Nganh_id_khoa_idx" ON public."Nganh" USING btree (id_khoa);


--
-- Name: NguoiDung_id_nganh_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NguoiDung_id_nganh_idx" ON public."NguoiDung" USING btree (id_nganh);


--
-- Name: ThanhVienHoiThoai_id_cuoc_hoi_thoai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ThanhVienHoiThoai_id_cuoc_hoi_thoai_idx" ON public."ThanhVienHoiThoai" USING btree (id_cuoc_hoi_thoai);


--
-- Name: ThongBao_id_nguoi_nhan_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ThongBao_id_nguoi_nhan_idx" ON public."ThongBao" USING btree (id_nguoi_nhan);


--
-- Name: TinNhan_id_cuoc_hoi_thoai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TinNhan_id_cuoc_hoi_thoai_idx" ON public."TinNhan" USING btree (id_cuoc_hoi_thoai);


--
-- Name: TinNhan_id_nguoi_gui_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TinNhan_id_nguoi_gui_idx" ON public."TinNhan" USING btree (id_nguoi_gui);


--
-- Name: BaiViet BaiViet_id_bai_viet_goc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet"
    ADD CONSTRAINT "BaiViet_id_bai_viet_goc_fkey" FOREIGN KEY (id_bai_viet_goc) REFERENCES public."BaiViet"(id) ON DELETE CASCADE;


--
-- Name: BaiViet BaiViet_id_cuoc_hoi_thoai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet"
    ADD CONSTRAINT "BaiViet_id_cuoc_hoi_thoai_fkey" FOREIGN KEY (id_cuoc_hoi_thoai) REFERENCES public."CuocHoiThoai"(id) ON DELETE CASCADE;


--
-- Name: BaiViet BaiViet_id_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet"
    ADD CONSTRAINT "BaiViet_id_nguoi_duyet_fkey" FOREIGN KEY (id_nguoi_duyet) REFERENCES public."NguoiDung"(id) ON DELETE SET NULL;


--
-- Name: BaiViet BaiViet_id_tac_gia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BaiViet"
    ADD CONSTRAINT "BaiViet_id_tac_gia_fkey" FOREIGN KEY (id_tac_gia) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: BinhLuan BinhLuan_id_bai_viet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BinhLuan"
    ADD CONSTRAINT "BinhLuan_id_bai_viet_fkey" FOREIGN KEY (id_bai_viet) REFERENCES public."BaiViet"(id) ON DELETE CASCADE;


--
-- Name: BinhLuan BinhLuan_id_binh_luan_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BinhLuan"
    ADD CONSTRAINT "BinhLuan_id_binh_luan_cha_fkey" FOREIGN KEY (id_binh_luan_cha) REFERENCES public."BinhLuan"(id) ON DELETE CASCADE;


--
-- Name: BinhLuan BinhLuan_id_tac_gia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BinhLuan"
    ADD CONSTRAINT "BinhLuan_id_tac_gia_fkey" FOREIGN KEY (id_tac_gia) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: CuocGoi CuocGoi_id_cuoc_hoi_thoai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocGoi"
    ADD CONSTRAINT "CuocGoi_id_cuoc_hoi_thoai_fkey" FOREIGN KEY (id_cuoc_hoi_thoai) REFERENCES public."CuocHoiThoai"(id) ON DELETE CASCADE;


--
-- Name: CuocGoi CuocGoi_id_nguoi_goi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocGoi"
    ADD CONSTRAINT "CuocGoi_id_nguoi_goi_fkey" FOREIGN KEY (id_nguoi_goi) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: CuocHoiThoai CuocHoiThoai_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CuocHoiThoai"
    ADD CONSTRAINT "CuocHoiThoai_id_nguoi_tao_fkey" FOREIGN KEY (id_nguoi_tao) REFERENCES public."NguoiDung"(id) ON DELETE SET NULL;


--
-- Name: DangKySuKien DangKySuKien_id_nguoi_dung_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DangKySuKien"
    ADD CONSTRAINT "DangKySuKien_id_nguoi_dung_fkey" FOREIGN KEY (id_nguoi_dung) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: DangKySuKien DangKySuKien_id_su_kien_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DangKySuKien"
    ADD CONSTRAINT "DangKySuKien_id_su_kien_fkey" FOREIGN KEY (id_su_kien) REFERENCES public."SuKien"(id) ON DELETE CASCADE;


--
-- Name: LuotThich LuotThich_id_nguoi_dung_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LuotThich"
    ADD CONSTRAINT "LuotThich_id_nguoi_dung_fkey" FOREIGN KEY (id_nguoi_dung) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: Nganh Nganh_id_khoa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Nganh"
    ADD CONSTRAINT "Nganh_id_khoa_fkey" FOREIGN KEY (id_khoa) REFERENCES public."Khoa"(id) ON DELETE RESTRICT;


--
-- Name: NguoiDung NguoiDung_id_nganh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NguoiDung"
    ADD CONSTRAINT "NguoiDung_id_nganh_fkey" FOREIGN KEY (id_nganh) REFERENCES public."Nganh"(id) ON DELETE SET NULL;


--
-- Name: SuKien SuKien_id_bai_viet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_id_bai_viet_fkey" FOREIGN KEY (id_bai_viet) REFERENCES public."BaiViet"(id) ON DELETE CASCADE;


--
-- Name: SuKien SuKien_id_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_id_nguoi_duyet_fkey" FOREIGN KEY (id_nguoi_duyet) REFERENCES public."NguoiDung"(id) ON DELETE SET NULL;


--
-- Name: SuKien SuKien_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_id_nguoi_tao_fkey" FOREIGN KEY (id_nguoi_tao) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: SuKien SuKien_id_phong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuKien"
    ADD CONSTRAINT "SuKien_id_phong_fkey" FOREIGN KEY (id_phong) REFERENCES public."Phong"(id) ON DELETE SET NULL;


--
-- Name: ThanhVienHoiThoai ThanhVienHoiThoai_id_cuoc_hoi_thoai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThanhVienHoiThoai"
    ADD CONSTRAINT "ThanhVienHoiThoai_id_cuoc_hoi_thoai_fkey" FOREIGN KEY (id_cuoc_hoi_thoai) REFERENCES public."CuocHoiThoai"(id) ON DELETE CASCADE;


--
-- Name: ThanhVienHoiThoai ThanhVienHoiThoai_id_nguoi_dung_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThanhVienHoiThoai"
    ADD CONSTRAINT "ThanhVienHoiThoai_id_nguoi_dung_fkey" FOREIGN KEY (id_nguoi_dung) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: ThongBao ThongBao_id_nguoi_hanh_dong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThongBao"
    ADD CONSTRAINT "ThongBao_id_nguoi_hanh_dong_fkey" FOREIGN KEY (id_nguoi_hanh_dong) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: ThongBao ThongBao_id_nguoi_nhan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThongBao"
    ADD CONSTRAINT "ThongBao_id_nguoi_nhan_fkey" FOREIGN KEY (id_nguoi_nhan) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- Name: TinNhan TinNhan_id_cuoc_hoi_thoai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TinNhan"
    ADD CONSTRAINT "TinNhan_id_cuoc_hoi_thoai_fkey" FOREIGN KEY (id_cuoc_hoi_thoai) REFERENCES public."CuocHoiThoai"(id) ON DELETE CASCADE;


--
-- Name: TinNhan TinNhan_id_nguoi_gui_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TinNhan"
    ADD CONSTRAINT "TinNhan_id_nguoi_gui_fkey" FOREIGN KEY (id_nguoi_gui) REFERENCES public."NguoiDung"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XcFCgy3aaWxW8vjVVTciotvJSNFZDKE1iggAdZVu9G0idSlCJ3AgQ77AxabAEBk

