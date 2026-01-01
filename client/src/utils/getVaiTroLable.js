export const getVaiTroLabel = (vaiTro) => {
  const map = {
    sinh_vien: 'Sinh viên',
    giao_vien: 'Giảng viên',
    doanh_nghiep: 'Doanh nghiệp',

    // Bạn yêu cầu đổi hiển thị:
    dieu_phoi_vien: 'Nhân viên Phòng Công tác Sinh viên',
    kiem_duyet_vien: 'Nhân viên Phòng Công tác Sinh viên',

    quan_tri_vien: 'Trưởng Phòng Công tác Sinh viên',
    admin: 'Trưởng Phòng Công tác Sinh viên'
  };

  if (!vaiTro) return 'Người dùng';

  // Hệ thống của bạn có chỗ vai_tro là mảng (ARRAY enum) -> ưu tiên role "cao" nhất
  const pickHighest = (roles) => {
    const priority = ['admin', 'quan_tri_vien', 'kiem_duyet_vien', 'dieu_phoi_vien', 'giao_vien', 'doanh_nghiep', 'sinh_vien'];
    const set = new Set(roles.filter(Boolean));
    return priority.find((r) => set.has(r)) || roles[0];
  };

  const roleKey = Array.isArray(vaiTro) ? pickHighest(vaiTro) : vaiTro;

  return map[roleKey] || String(roleKey);
};

export const getVaiTroLabelList = (vaiTro) => {
  if (!vaiTro) return [];
  if (!Array.isArray(vaiTro)) return [getVaiTroLabel(vaiTro)];
  return vaiTro.map(getVaiTroLabel);
};