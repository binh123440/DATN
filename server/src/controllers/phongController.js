import db from '../models/index.js';
import { Op } from 'sequelize';

const { Phong } = db;

export const layDanhSachPhong = async (req, res) => {
  const q = req.query.q || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  try {
    const where = q ? { ten_phong: { [Op.iLike]: `%${q}%` } } : {};
    const { count, rows } = await Phong.findAndCountAll({
      where,
      limit,
      offset,
      order: [['ten_phong', 'ASC']]
    });

    return res.json({
      success: true,
      message: 'Lấy danh sách phòng thành công',
      data: rows,
      meta: { total: count, page, limit }
    });
  } catch (error) {
    console.error('phongController.layDanhSachPhong error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phòng' });
  }
};

export const layChiTietPhong = async (req, res) => {
  const id = req.params.id;
  try {
    const phong = await Phong.findByPk(id);
    if (!phong) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
    return res.json({ success: true, message: 'Lấy chi tiết phòng thành công', data: phong });
  } catch (error) {
    console.error('phongController.layChiTietPhong error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết phòng' });
  }
};

export default { layDanhSachPhong, layChiTietPhong };