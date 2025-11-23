import db from '../models/index.js';

const { CuocHoiThoai, ThanhVienHoiThoai, NguoiDung, BaiViet, TinNhan } = db;

// ✅ Tạo nhóm mới (chỉ cần tên)
export const taoNhom = async (req, res) => {
  try {
    const { ten_hoi_thoai } = req.body;
    const id_nguoi_tao = req.user.id;

    if (!ten_hoi_thoai) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên nhóm'
      });
    }

    const nhom = await CuocHoiThoai.create({
      ten_hoi_thoai,
      loai: 'nhom',
      id_nguoi_tao
    });

    // Tự động thêm người tạo vào nhóm
    await ThanhVienHoiThoai.create({
      id_cuoc_hoi_thoai: nhom.id,
      id_nguoi_dung: id_nguoi_tao,
      vai_tro: 'quan_tri_vien'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm thành công',
      data: nhom
    });
  } catch (error) {
    console.error('❌ Lỗi tạo nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Lấy danh sách nhóm
export const layDanhSachNhom = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const id_nguoi_dung = req.user?.id;

    const whereClause = {
      loai: 'nhom'
    };

    if (search) {
      whereClause.ten_hoi_thoai = {
        [db.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    const { count, rows: nhoms } = await CuocHoiThoai.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
        {
          model: ThanhVienHoiThoai,
          as: 'thanh_vien',
          attributes: ['id_nguoi_dung', 'vai_tro']
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Kiểm tra user đã tham gia chưa
    const nhomsWithStatus = nhoms.map(nhom => {
      const nhomData = nhom.toJSON();
      const isOwner = nhomData.id_nguoi_tao === id_nguoi_dung;
      const thanhVien = nhomData.thanh_vien?.find(tv => tv.id_nguoi_dung === id_nguoi_dung);
      
      return {
        ...nhomData,
        so_thanh_vien: nhomData.thanh_vien?.length || 0,
        da_tham_gia: !!thanhVien || isOwner,
        vai_tro_cua_toi: isOwner ? 'chu_nhom' : thanhVien?.vai_tro || null
      };
    });

    res.json({
      success: true,
      message: 'Lấy danh sách nhóm thành công',
      data: {
        nhoms: nhomsWithStatus,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_so_nhom: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Lấy chi tiết nhóm
export const layChiTietNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user?.id;

    const nhom = await CuocHoiThoai.findOne({
      where: {
        id,
        loai: 'nhom'
      },
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        },
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

    if (!nhom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const nhomData = nhom.toJSON();
    const isOwner = nhomData.id_nguoi_tao === id_nguoi_dung;
    const thanhVien = nhomData.thanh_vien?.find(tv => tv.id_nguoi_dung === id_nguoi_dung);

    res.json({
      success: true,
      data: {
        ...nhomData,
        so_thanh_vien: nhomData.thanh_vien?.length || 0,
        da_tham_gia: !!thanhVien || isOwner,
        vai_tro_cua_toi: isOwner ? 'chu_nhom' : thanhVien?.vai_tro || null
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Tham gia nhóm (công khai, không cần duyệt)
export const thamGiaNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user.id;

    const nhom = await CuocHoiThoai.findOne({
      where: { id, loai: 'nhom' }
    });

    if (!nhom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    // Kiểm tra đã tham gia chưa
    const existing = await ThanhVienHoiThoai.findOne({
      where: { id_cuoc_hoi_thoai: id, id_nguoi_dung }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên nhóm này'
      });
    }

    await ThanhVienHoiThoai.create({
      id_cuoc_hoi_thoai: id,
      id_nguoi_dung,
      vai_tro: 'thanh_vien'
    });

    res.json({
      success: true,
      message: 'Đã tham gia nhóm thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi tham gia nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Rời nhóm
export const roiNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const id_nguoi_dung = req.user.id;

    const nhom = await CuocHoiThoai.findOne({
      where: { id, loai: 'nhom' }
    });

    if (!nhom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    // Không cho phép chủ nhóm rời
    if (nhom.id_nguoi_tao === id_nguoi_dung) {
      return res.status(400).json({
        success: false,
        message: 'Chủ nhóm không thể rời nhóm'
      });
    }

    const deleted = await ThanhVienHoiThoai.destroy({
      where: {
        id_cuoc_hoi_thoai: id,
        id_nguoi_dung
      }
    });

    if (deleted) {
      res.json({ success: true, message: 'Đã rời nhóm thành công' });
    } else {
      res.status(404).json({ success: false, message: 'Bạn không phải thành viên nhóm này' });
    }
  } catch (error) {
    console.error('❌ Lỗi rời nhóm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// ✅ Lấy danh sách thành viên
export const layDanhSachThanhVien = async (req, res) => {
  try {
    const { id } = req.params;

    const thanhViens = await ThanhVienHoiThoai.findAll({
      where: {
        id_cuoc_hoi_thoai: id
      },
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_dung',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ],
      order: [
        ['vai_tro', 'DESC'], // Admin trước
        ['ngay_gio_tham_gia', 'ASC']
      ]
    });

    // Thêm chủ nhóm vào đầu danh sách
    const nhom = await CuocHoiThoai.findByPk(id, {
      include: [
        {
          model: NguoiDung,
          as: 'nguoi_tao',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ]
    });

    const danhSachFull = [
      {
        id_nguoi_dung: nhom.id_nguoi_tao,
        vai_tro: 'chu_nhom',
        nguoi_dung: nhom.nguoi_tao,
        ngay_gio_tham_gia: nhom.ngay_tao
      },
      ...thanhViens.filter(tv => tv.id_nguoi_dung !== nhom.id_nguoi_tao)
    ];

    res.json({
      success: true,
      data: danhSachFull
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ Xóa thành viên (Chủ nhóm và Admin)
export const xoaThanhVien = async (req, res) => {
  try {
    const { id, idNguoiDung } = req.params;
    const id_nguoi_xoa = req.user.id;

    const nhom = await CuocHoiThoai.findByPk(id);
    
    // Kiểm tra quyền: phải là chủ nhóm hoặc admin
    const isOwner = nhom.id_nguoi_tao === id_nguoi_xoa;
    const isAdmin = await ThanhVienHoiThoai.findOne({
      where: {
        id_cuoc_hoi_thoai: id,
        id_nguoi_dung: id_nguoi_xoa,
        vai_tro: 'quan_tri_vien'
      }
    });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xóa thành viên' 
      });
    }

    // Không cho xóa chủ nhóm
    if (nhom.id_nguoi_tao === parseInt(idNguoiDung)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa chủ nhóm' 
      });
    }

    const deleted = await ThanhVienHoiThoai.destroy({
      where: {
        id_cuoc_hoi_thoai: id,
        id_nguoi_dung: idNguoiDung
      }
    });

    if (deleted) {
      res.json({ success: true, message: 'Đã xóa thành viên khỏi nhóm' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
    }
  } catch (error) {
    console.error('❌ Lỗi xóa thành viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// ✅ Cập nhật vai trò (Chỉ chủ nhóm)
export const capNhatVaiTro = async (req, res) => {
  try {
    const { id, idNguoiDung } = req.params;
    const { vai_tro } = req.body;
    const id_chu_nhom = req.user.id;

    const nhom = await CuocHoiThoai.findByPk(id);
    if (nhom.id_nguoi_tao !== id_chu_nhom) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ chủ nhóm mới có quyền thay đổi vai trò'
      });
    }

    const thanhVien = await ThanhVienHoiThoai.findOne({
      where: {
        id_cuoc_hoi_thoai: id,
        id_nguoi_dung: idNguoiDung
      }
    });

    if (!thanhVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
    }

    await thanhVien.update({ vai_tro });
    res.json({ success: true, message: 'Đã cập nhật vai trò thành công' });
  } catch (error) {
    console.error('❌ Lỗi cập nhật vai trò:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// ✅ Cập nhật tên nhóm (Chủ nhóm và Admin)
export const capNhatTenNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_hoi_thoai } = req.body;
    const id_nguoi_dung = req.user.id;

    const nhom = await CuocHoiThoai.findOne({
      where: { id, loai: 'nhom' }
    });

    if (!nhom) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }

    const isOwner = nhom.id_nguoi_tao === id_nguoi_dung;
    const isAdmin = await ThanhVienHoiThoai.findOne({
      where: {
        id_cuoc_hoi_thoai: id,
        id_nguoi_dung,
        vai_tro: 'quan_tri_vien'
      }
    });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền cập nhật nhóm' 
      });
    }

    await nhom.update({ ten_hoi_thoai });

    res.json({ 
      success: true, 
      message: 'Cập nhật tên nhóm thành công', 
      data: nhom 
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật tên nhóm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// ✅ Xóa nhóm (Chỉ chủ nhóm)
export const xoaNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const id_chu_nhom = req.user.id;

    const nhom = await CuocHoiThoai.findOne({
      where: { id, loai: 'nhom' }
    });

    if (!nhom) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }

    if (nhom.id_nguoi_tao !== id_chu_nhom) {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ chủ nhóm mới có quyền xóa nhóm' 
      });
    }

    // Xóa hẳn nhóm và cascade xóa thành viên, tin nhắn
    await nhom.destroy();
    
    res.json({ success: true, message: 'Đã xóa nhóm thành công' });
  } catch (error) {
    console.error('❌ Lỗi xóa nhóm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// ✅ Lấy bài viết trong nhóm
export const layBaiVietTrongNhom = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: baiViets } = await BaiViet.findAndCountAll({
      where: {
        id_cuoc_hoi_thoai: id,
        trang_thai: 'da_duyet'
      },
      include: [
        {
          model: NguoiDung,
          as: 'tac_gia',
          attributes: ['id', 'ho_ten', 'anh_dai_dien_url']
        }
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        bai_viets: baiViets,
        pagination: {
          trang_hien_tai: parseInt(page),
          tong_so_trang: Math.ceil(count / limit),
          tong_so_bai_viet: count
        }
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy bài viết trong nhóm:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};