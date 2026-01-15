import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { NguoiDung, sequelize } = db;

const normalizeRoles = (vai_tro) => {
  if (!vai_tro) return [];
  if (Array.isArray(vai_tro)) return vai_tro;
  if (typeof vai_tro === 'string') return [vai_tro];
  return [];
};

const ALLOWED_ROLES = [
  'sinh_vien',
  'giao_vien',
  'doanh_nghiep',
  'quan_tri_vien',
  'dieu_phoi_vien',
  'kiem_duyet_vien'
];

// Mật khẩu tạm dựa theo ngày sinh: ddMMyyyy
// Ví dụ: 2003-09-01 => 01092003
const taoMatKhauTam = (ngaySinhInput) => {
  if (!ngaySinhInput) return null;

  // DateONLY thường về dạng 'YYYY-MM-DD'
  if (typeof ngaySinhInput === 'string') {
    const m = ngaySinhInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const yyyy = m[1];
      const mm = m[2];
      const dd = m[3];
      return `${dd}${mm}${yyyy}`;
    }

    const d = new Date(ngaySinhInput);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      return `${dd}${mm}${yyyy}`;
    }

    return null;
  }

  // Date object
  if (ngaySinhInput instanceof Date && !Number.isNaN(ngaySinhInput.getTime())) {
    const dd = String(ngaySinhInput.getDate()).padStart(2, '0');
    const mm = String(ngaySinhInput.getMonth() + 1).padStart(2, '0');
    const yyyy = String(ngaySinhInput.getFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  return null;
};

// ✅ GET /api/admin/thong-ke-vang-mat
// Thống kê: đăng ký nhưng vắng (chưa điểm danh) cho các sự kiện đã kết thúc.
export const thongKeVangMatTongHop = async (req, res) => {
  try {
    const { from, to, limit = 20 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

    // Lọc theo khoảng thời gian (tùy chọn)
    const timeWhereParts = [];
    const replacements = { limit: parsedLimit };

    if (from) {
      timeWhereParts.push('sk."thoi_gian_bat_dau" >= :from');
      replacements.from = from;
    }
    if (to) {
      timeWhereParts.push('sk."thoi_gian_bat_dau" <= :to');
      replacements.to = to;
    }

    const timeWhereSql = timeWhereParts.length ? ` AND ${timeWhereParts.join(' AND ')}` : '';

    const summarySql = `
      SELECT
        COUNT(*)::int AS tong_dang_ky,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NOT NULL THEN 1 ELSE 0 END)::int AS tong_tham_gia,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NULL THEN 1 ELSE 0 END)::int AS tong_vang
      FROM "DangKySuKien" dk
      JOIN "SuKien" sk ON sk.id = dk."id_su_kien"
      WHERE dk."trang_thai" = 'da_dang_ky'
        AND COALESCE(sk."thoi_gian_ket_thuc", sk."thoi_gian_bat_dau") < NOW()
        ${timeWhereSql}
    `;

    const perEventSql = `
      SELECT
        sk.id::int AS id_su_kien,
        sk."id_bai_viet"::int AS id_bai_viet,
        sk."ten_su_kien" AS ten_su_kien,
        sk."thoi_gian_bat_dau" AS thoi_gian_bat_dau,
        sk."thoi_gian_ket_thuc" AS thoi_gian_ket_thuc,
        COUNT(dk.id)::int AS tong_dang_ky,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NOT NULL THEN 1 ELSE 0 END)::int AS tong_tham_gia,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NULL THEN 1 ELSE 0 END)::int AS tong_vang
      FROM "SuKien" sk
      JOIN "DangKySuKien" dk
        ON dk."id_su_kien" = sk.id
       AND dk."trang_thai" = 'da_dang_ky'
      WHERE COALESCE(sk."thoi_gian_ket_thuc", sk."thoi_gian_bat_dau") < NOW()
        ${timeWhereSql}
      GROUP BY sk.id
      ORDER BY tong_vang DESC, tong_dang_ky DESC
      LIMIT :limit
    `;

    const perStudentSql = `
      SELECT
        nd.id::int AS id_nguoi_dung,
        nd."ho_ten" AS ho_ten,
        nd.email AS email,
        nd."ma_sinh_vien" AS ma_sinh_vien,
        COUNT(dk.id)::int AS tong_dang_ky,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NOT NULL THEN 1 ELSE 0 END)::int AS tong_tham_gia,
        SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NULL THEN 1 ELSE 0 END)::int AS tong_vang
      FROM "NguoiDung" nd
      JOIN "DangKySuKien" dk
        ON dk."id_nguoi_dung" = nd.id
       AND dk."trang_thai" = 'da_dang_ky'
      JOIN "SuKien" sk ON sk.id = dk."id_su_kien"
      WHERE COALESCE(sk."thoi_gian_ket_thuc", sk."thoi_gian_bat_dau") < NOW()
        ${timeWhereSql}
        AND nd."ma_sinh_vien" IS NOT NULL
      GROUP BY nd.id
      HAVING SUM(CASE WHEN dk."ngay_gio_diem_danh" IS NULL THEN 1 ELSE 0 END) > 0
      ORDER BY tong_vang DESC, tong_dang_ky DESC
      LIMIT :limit
    `;

    const [summaryRows] = await sequelize.query(summarySql, { replacements });
    const [eventRows] = await sequelize.query(perEventSql, { replacements });
    const [studentRows] = await sequelize.query(perStudentSql, { replacements });

    const summary = summaryRows?.[0] || { tong_dang_ky: 0, tong_tham_gia: 0, tong_vang: 0 };
    const tongDangKy = Number(summary.tong_dang_ky) || 0;
    const tongThamGia = Number(summary.tong_tham_gia) || 0;
    const tongVang = Number(summary.tong_vang) || 0;
    const tiLeThamGia = tongDangKy > 0 ? Math.round((tongThamGia / tongDangKy) * 10000) / 100 : 0;

    res.json({
      success: true,
      message: 'Lấy thống kê vắng mặt thành công',
      data: {
        tong_hop: {
          tong_dang_ky: tongDangKy,
          tong_tham_gia: tongThamGia,
          tong_vang: tongVang,
          ti_le_tham_gia: tiLeThamGia
        },
        theo_su_kien: eventRows.map(r => ({
          ...r,
          ti_le_tham_gia: r.tong_dang_ky > 0 ? Math.round((r.tong_tham_gia / r.tong_dang_ky) * 10000) / 100 : 0
        })),
        theo_sinh_vien: studentRows.map(r => ({
          ...r,
          ti_le_tham_gia: r.tong_dang_ky > 0 ? Math.round((r.tong_tham_gia / r.tong_dang_ky) * 10000) / 100 : 0
        }))
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy thống kê vắng mặt:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách tất cả người dùng
 */
export const layTatCaNguoiDung = async (req, res) => {
  try {
    const users = await NguoiDung.findAll({
      attributes: { 
        exclude: ['mat_khau_bam'] // Không trả về mật khẩu
      },
      order: [['ngay_tao', 'DESC']],
    });

    res.json({ 
      success: true, 
      message: 'Lấy danh sách người dùng thành công',
      data: users 
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

/**
 * Cập nhật vai trò của người dùng
 */
export const capNhatVaiTroNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const { vai_tro } = req.body;

    const roles = normalizeRoles(vai_tro);
    if (!roles.length) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu vai_tro'
      });
    }

    const invalid = roles.filter(r => !ALLOWED_ROLES.includes(r));
    if (invalid.length) {
      return res.status(400).json({
        success: false,
        message: `Vai trò không hợp lệ: ${invalid.join(', ')}`
      });
    }

    const user = await NguoiDung.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng.' 
      });
    }

    // Cập nhật vai trò (DB đang lưu dạng ARRAY)
    user.vai_tro = roles;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Cập nhật vai trò thành công.',
      data: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        ma_sinh_vien: user.ma_sinh_vien,
        vai_tro: user.vai_tro
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật vai trò:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

/**
 * Admin reset mật khẩu người dùng
 */
export const resetMatKhauNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NguoiDung.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.'
      });
    }

    const matKhauTam = taoMatKhauTam(user.ngay_sinh);
    if (!matKhauTam) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng chưa có ngày sinh hợp lệ để reset mật khẩu'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(matKhauTam, salt);

    await user.update({ mat_khau_bam: hashedPassword });

    return res.json({
      success: true,
      message: 'Reset mật khẩu thành công',
      data: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        temp_password: matKhauTam
      }
    });
  } catch (error) {
    console.error('Lỗi khi reset mật khẩu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// ✅ POST /api/admin/users
export const taoNguoiDungAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      ho_ten,
      email,
      ma_sinh_vien,
      ngay_sinh,
      mat_khau,
      vai_tro
    } = req.body;

    if (!ho_ten?.trim() || !email?.trim()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu họ tên hoặc email'
      });
    }

    const roles = normalizeRoles(vai_tro);
    const vaiTroFinal = roles.length ? roles : ['sinh_vien'];

    const existedEmail = await NguoiDung.findOne({ where: { email }, transaction: t });
    if (existedEmail) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    if (ma_sinh_vien) {
      const existedMSV = await NguoiDung.findOne({ where: { ma_sinh_vien }, transaction: t });
      if (existedMSV) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mã sinh viên đã tồn tại'
        });
      }
    }

    const tempPassword = mat_khau?.trim() || taoMatKhauTam(ngay_sinh);
    if (!tempPassword) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Nếu không nhập mật khẩu thì cần cung cấp ngày sinh hợp lệ (YYYY-MM-DD) để tạo mật khẩu tự động'
      });
    }
    const mat_khau_bam = await bcrypt.hash(tempPassword, 10);

    const created = await NguoiDung.create(
      {
        ho_ten: ho_ten.trim(),
        email: email.trim(),
        ma_sinh_vien: ma_sinh_vien?.trim() || null,
        ngay_sinh: ngay_sinh || null,
        mat_khau_bam,
        vai_tro: vaiTroFinal
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: {
        user: {
          id: created.id,
          ho_ten: created.ho_ten,
          email: created.email,
          ma_sinh_vien: created.ma_sinh_vien,
          vai_tro: created.vai_tro
        },
        temp_password: mat_khau?.trim() ? null : tempPassword
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ taoNguoiDungAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ DELETE /api/admin/users/:id
export const xoaNguoiDungAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu id người dùng'
      });
    }

    const user = await NguoiDung.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Chặn tự xóa chính mình (an toàn)
    if (Number(req.user?.id) === Number(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của mình'
      });
    }

    await user.destroy({ transaction: t });
    await t.commit();

    return res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ xoaNguoiDungAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};