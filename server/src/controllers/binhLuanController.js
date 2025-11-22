import db from '../models/index.js';
import { taoThongBao } from './thongBaoController.js';

const { BinhLuan, NguoiDung, BaiViet } = db;

/**
 * ✅ HÀM ĐỆ QUY MỚI
 * Hàm này sẽ tải tất cả các cấp trả lời cho một danh sách bình luận.
 */
const loadNestedReplies = async (comments) => {
  for (const comment of comments) {
    // Tìm tất cả các trả lời trực tiếp của bình luận hiện tại
    const replies = await BinhLuan.findAll({
      where: { id_binh_luan_cha: comment.id },
      include: [{
        model: NguoiDung,
        as: 'tac_gia',
        attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
      }],
      order: [['ngay_tao', 'ASC']]
    });

    // Gán các trả lời tìm được vào thuộc tính 'binh_luan_tra_loi'
    // Sequelize sẽ tự động chuyển đổi comment thành JSON, nên ta gán vào dataValues
    comment.dataValues.binh_luan_tra_loi = replies;

    // Nếu có trả lời, tiếp tục gọi đệ quy để tìm trả lời cho các trả lời đó
    if (replies.length > 0) {
      await loadNestedReplies(replies);
    }
  }
};

// Lấy danh sách bình luận của bài viết (CẬP NHẬT LOGIC)
export const layDanhSachBinhLuan = async (req, res) => {
  try {
    const { id_bai_viet } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 1. Chỉ lấy và đếm các bình luận gốc (cấp 1) để phân trang
    const { count: rootCommentCount, rows: rootComments } = await BinhLuan.findAndCountAll({
      where: { 
        id_bai_viet,
        id_binh_luan_cha: null 
      },
      include: [{
        model: NguoiDung,
        as: 'tac_gia',
        attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
      }],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 2. ✅ SỬ DỤNG HÀM ĐỆ QUY để tải tất cả các cấp trả lời
    if (rootComments.length > 0) {
      await loadNestedReplies(rootComments);
    }

    // 3. Đếm tổng số bình luận (bao gồm cả trả lời) để hiển thị
    const totalCommentCount = await BinhLuan.count({
      where: { id_bai_viet }
    });

    res.json({
      success: true,
      message: 'Lấy danh sách bình luận thành công',
      data: {
        binh_luans: rootComments,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(rootCommentCount / limit),
          tong_so_binh_luan: totalCommentCount
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Tạo bình luận mới
export const taoBinhLuan = async (req, res) => {
  try {
    const { id_bai_viet, id_tac_gia, noi_dung, id_binh_luan_cha } = req.body;

    if (!id_bai_viet || !id_tac_gia || !noi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const binhLuan = await BinhLuan.create({
      id_bai_viet,
      id_tac_gia,
      noi_dung,
      id_binh_luan_cha: id_binh_luan_cha || null
    });

    const binhLuanDayDu = await BinhLuan.findByPk(binhLuan.id, {
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    // ✅ Tạo thông báo
    const baiViet = await BaiViet.findByPk(id_bai_viet);
    if (baiViet) {
      if (id_binh_luan_cha) {
        // Thông báo trả lời bình luận
        const binhLuanCha = await BinhLuan.findByPk(id_binh_luan_cha);
        if (binhLuanCha) {
          await taoThongBao({
            id_nguoi_nhan: binhLuanCha.id_tac_gia,
            id_nguoi_hanh_dong: id_tac_gia,
            loai: 'tra_loi_binh_luan',
            id_muc_tieu: id_bai_viet,
            loai_muc_tieu: 'bai_viet'
          });
        }
      } else {
        // Thông báo bình luận bài viết
        await taoThongBao({
          id_nguoi_nhan: baiViet.id_tac_gia,
          id_nguoi_hanh_dong: id_tac_gia,
          loai: 'binh_luan_bai_viet',
          id_muc_tieu: id_bai_viet,
          loai_muc_tieu: 'bai_viet'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo bình luận thành công',
      data: binhLuanDayDu
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Cập nhật bình luận
export const capNhatBinhLuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_dung } = req.body;
    const id_nguoi_dung = req.user?.id;

    if (!noi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung không được để trống'
      });
    }

    const binhLuan = await BinhLuan.findByPk(id);
    
    if (!binhLuan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    if (binhLuan.id_tac_gia !== id_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bình luận này'
      });
    }

    binhLuan.noi_dung = noi_dung;
    await binhLuan.save();

    res.json({
      success: true,
      message: 'Cập nhật bình luận thành công',
      data: binhLuan
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

// Xóa bình luận
export const xoaBinhLuan = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const binhLuan = await BinhLuan.findByPk(id);
    
    if (!binhLuan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    if (binhLuan.id_tac_gia !== id_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }

    await binhLuan.destroy();

    res.json({
      success: true,
      message: 'Xóa bình luận thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa bình luận:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};