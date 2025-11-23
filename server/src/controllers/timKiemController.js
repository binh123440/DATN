import db from '../models/index.js';
import { Op } from 'sequelize';

const { NguoiDung, CuocHoiThoai, BaiViet, SuKien, ThanhVienHoiThoai } = db;

export const timKiemTongHop = async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    if (!q.trim()) {
      return res.json({ 
        success: true, 
        data: { users: [], groups: [], posts: [], events: [] } 
      });
    }

    const likeCond = { [Op.iLike]: `%${q.trim()}%` };

    const [users, groups, posts, events] = await Promise.all([
      // Tìm người dùng
      NguoiDung.findAll({
        where: { ho_ten: likeCond },
        attributes: ['id', 'ho_ten', 'anh_dai_dien_url', 'email'],
        limit: 5
      }),
      
      // Tìm nhóm - Đếm thành viên bằng subquery
      CuocHoiThoai.findAll({
        where: { 
          ten_hoi_thoai: likeCond, 
          loai: 'nhom' 
        },
        attributes: [
          'id', 
          'ten_hoi_thoai',
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM "ThanhVienHoiThoai"
              WHERE "ThanhVienHoiThoai"."id_cuoc_hoi_thoai" = "CuocHoiThoai"."id"
            )`),
            'so_thanh_vien'
          ]
        ],
        limit: 5,
        raw: true
      }),
      
      // Tìm bài viết
      BaiViet.findAll({
        where: { noi_dung: likeCond },
        attributes: ['id', 'noi_dung', 'id_cuoc_hoi_thoai', 'ngay_tao'],
        include: [
          { 
            model: CuocHoiThoai, 
            as: 'nhom', 
            attributes: ['id', 'ten_hoi_thoai'] 
          },
          {
            model: NguoiDung,
            as: 'tac_gia',
            attributes: ['id', 'ho_ten']
          }
        ],
        order: [['ngay_tao', 'DESC']],
        limit: 5
      }),
      
      // Tìm sự kiện
      SuKien.findAll({
        where: { ten_su_kien: likeCond },
        attributes: ['id', 'ten_su_kien', 'thoi_gian_bat_dau', 'dia_diem'],
        limit: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        users,
        groups,
        posts,
        events
      }
    });
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};