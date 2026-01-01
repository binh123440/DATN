import db from '../models/index.js';

const { Khoa } = db;

export const layDanhSachKhoa = async (req, res) => {
  try {
    const ds = await Khoa.findAll({
      attributes: ['id', 'ten_khoa'],
      order: [['ten_khoa', 'ASC']]
    });

    return res.json({
      success: true,
      message: 'Lấy danh sách khoa thành công.',
      data: ds
    });
  } catch (error) {
    console.error('layDanhSachKhoa error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.'
    });
  }
};