import db from '../models/index.js';
const { TinNhan, CuocHoiThoai, NguoiDung, ThanhVienHoiThoai } = db;

export const layDanhSachCuocHoiThoai = async (req, res) => {
  try {
    const idNguoiDung = req.user.id;

    // Lấy danh sách cuộc hội thoại của user
    const thanhVien = await ThanhVienHoiThoai.findAll({
      where: { id_nguoi_dung: idNguoiDung },
      include: [
        {
          model: CuocHoiThoai,
          as: 'cuoc_hoi_thoai',
          include: [
            {
              model: ThanhVienHoiThoai,
              as: 'thanh_vien',
              include: [
                {
                  model: NguoiDung,
                  as: 'nguoi_dung',
                  attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
                }
              ]
            }
          ]
        }
      ]
    });

    // Lấy tin nhắn cuối cùng cho mỗi cuộc hội thoại
    const cuocHoiThoaisWithLastMessage = await Promise.all(
      thanhVien.map(async (tv) => {
        const cuocHoiThoai = tv.cuoc_hoi_thoai;
        
        const lastMessage = await TinNhan.findOne({
          where: { id_cuoc_hoi_thoai: cuocHoiThoai.id },
          include: [
            {
              model: NguoiDung,
              as: 'nguoi_gui',
              attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
            }
          ],
          order: [['thoi_gian_gui', 'DESC']], // ✅ Đổi từ ngay_gui thành thoi_gian_gui
          limit: 1
        });

        return {
          ...cuocHoiThoai.toJSON(),
          tin_nhan: lastMessage ? [lastMessage] : []
        };
      })
    );

    // Sắp xếp theo tin nhắn mới nhất
    cuocHoiThoaisWithLastMessage.sort((a, b) => {
      const aTime = a.tin_nhan[0]?.thoi_gian_gui || a.ngay_tao; // ✅ Đổi từ ngay_gui
      const bTime = b.tin_nhan[0]?.thoi_gian_gui || b.ngay_tao; // ✅ Đổi từ ngay_gui
      return new Date(bTime) - new Date(aTime);
    });

    res.json({
      success: true,
      data: cuocHoiThoaisWithLastMessage
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách cuộc hội thoại:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const layTinNhanTrongCuocHoiThoai = async (req, res) => {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Kiểm tra quyền truy cập
    const isMember = await ThanhVienHoiThoai.findOne({
      where: { id_cuoc_hoi_thoai: id, id_nguoi_dung: idNguoiDung }
    });

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xem cuộc hội thoại này' 
      });
    }

    const offset = (page - 1) * limit;

    const { rows: tinNhans, count } = await TinNhan.findAndCountAll({
      where: { id_cuoc_hoi_thoai: id },
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_gui',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ],
      order: [['thoi_gian_gui', 'DESC']], // ✅ Đổi từ ngay_gui
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        tin_nhans: tinNhans.reverse(),
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_tin_nhan: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tin nhắn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const guiTinNhan = async (req, res) => {
  try {
    const { id_cuoc_hoi_thoai, noi_dung } = req.body;
    const id_nguoi_gui = req.user.id;

    if (!noi_dung?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung tin nhắn không được để trống' 
      });
    }

    // Kiểm tra quyền
    const isMember = await ThanhVienHoiThoai.findOne({
      where: { id_cuoc_hoi_thoai, id_nguoi_dung: id_nguoi_gui }
    });

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này' 
      });
    }

    const tinNhan = await TinNhan.create({
      id_cuoc_hoi_thoai,
      id_nguoi_gui,
      noi_dung: noi_dung.trim(),
      thoi_gian_gui: new Date() // ✅ Đổi từ ngay_gui
    });

    const tinNhanMoi = await TinNhan.findByPk(tinNhan.id, {
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_gui',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    res.json({ success: true, data: tinNhanMoi });
  } catch (error) {
    console.error('❌ Lỗi gửi tin nhắn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const taoCuocHoiThoaiRiengTu = async (req, res) => {
  try {
    const { id_nguoi_nhan } = req.body;
    const id_nguoi_gui = req.user.id;

    if (!id_nguoi_nhan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng chọn người nhận' 
      });
    }

    if (id_nguoi_gui === id_nguoi_nhan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể tạo cuộc hội thoại với chính mình' 
      });
    }

    // Kiểm tra người nhận có tồn tại không
    const nguoiNhan = await NguoiDung.findByPk(id_nguoi_nhan);
    if (!nguoiNhan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }

    // Kiểm tra cuộc hội thoại đã tồn tại chưa
    const existingConversations = await ThanhVienHoiThoai.findAll({
      where: { id_nguoi_dung: id_nguoi_gui },
      include: [
        {
          model: CuocHoiThoai,
          as: 'cuoc_hoi_thoai',
          where: { loai: 'rieng_tu' }
        }
      ]
    });

    for (const conv of existingConversations) {
      const members = await ThanhVienHoiThoai.findAll({
        where: { id_cuoc_hoi_thoai: conv.id_cuoc_hoi_thoai },
        attributes: ['id_nguoi_dung']
      });

      const memberIds = members.map(m => m.id_nguoi_dung);
      if (memberIds.length === 2 && memberIds.includes(id_nguoi_nhan)) {
        // Cuộc hội thoại đã tồn tại
        const existingConv = await CuocHoiThoai.findByPk(conv.id_cuoc_hoi_thoai, {
          include: [
            {
              model: ThanhVienHoiThoai,
              as: 'thanh_vien',
              include: [
                {
                  model: NguoiDung,
                  as: 'nguoi_dung',
                  attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
                }
              ]
            }
          ]
        });
        return res.json({ success: true, data: existingConv });
      }
    }

    // Tạo cuộc hội thoại mới
    const cuocHoiThoai = await CuocHoiThoai.create({
      ten_hoi_thoai: `${nguoiNhan.ho_ten}`,
      loai: 'rieng_tu',
      id_nguoi_tao: id_nguoi_gui,
      ngay_tao: new Date()
    });

    await Promise.all([
      ThanhVienHoiThoai.create({ 
        id_cuoc_hoi_thoai: cuocHoiThoai.id, 
        id_nguoi_dung: id_nguoi_gui,
        ngay_gio_tham_gia: new Date()
      }),
      ThanhVienHoiThoai.create({ 
        id_cuoc_hoi_thoai: cuocHoiThoai.id, 
        id_nguoi_dung: id_nguoi_nhan,
        ngay_gio_tham_gia: new Date()
      })
    ]);

    // Load đầy đủ thông tin
    const cuocHoiThoaiMoi = await CuocHoiThoai.findByPk(cuocHoiThoai.id, {
      include: [
        {
          model: ThanhVienHoiThoai,
          as: 'thanh_vien',
          include: [
            {
              model: NguoiDung,
              as: 'nguoi_dung',
              attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
            }
          ]
        }
      ]
    });

    res.json({ success: true, data: cuocHoiThoaiMoi });
  } catch (error) {
    console.error('❌ Lỗi tạo cuộc hội thoại:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};