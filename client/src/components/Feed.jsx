import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCode } from 'react-qr-code'; // Thư viện tạo mã QR code
import { Html5QrcodeScanner } from 'html5-qrcode'; // Thư viện quét mã QR từ camera
import { Home, Calendar, MapPin, Users, Gift, QrCode as QrCodeIcon, Heart, MessageCircle, Share, ImagePlus, SmilePlus, X, ScanLine } from 'lucide-react'; // Import các icon từ Lucide
import { layDanhSachBaiViet, taoBaiViet, taoSuKien, thichBaiViet, dangKySuKien, kiemTraDangKySuKien } from '../services/apiService'; // Import các hàm gọi API

/**
 * Component PostComposer - Khung soạn bài viết và tạo sự kiện
 * @param {Function} onCreatePost - Callback khi tạo bài viết/sự kiện thành công
 * @param {Number} currentUserId - ID của người dùng hiện tại
 */
const PostComposer = ({ onCreatePost, currentUserId }) => {
  // State quản lý loại bài viết đang tạo (null, 'image', 'event', 'feeling')
  const [activeType, setActiveType] = useState(null);
  
  // State lưu nội dung bài viết
  const [content, setContent] = useState('');
  
  // State lưu chi tiết sự kiện khi tạo sự kiện
  const [eventDetails, setEventDetails] = useState({
    name: '',           // Tên sự kiện
    location: '',       // Địa điểm
    date: '',          // Ngày
    time: '',          // Giờ
    maxParticipants: '', // Số người tối đa
    points: ''         // Điểm thưởng
  });
  
  // State quản lý trạng thái đang submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Xử lý khi thay đổi thông tin sự kiện
   */
  const handleEventDetailChange = (e) => {
    const { name, value } = e.target;
    // Cập nhật state eventDetails, giữ nguyên các field khác
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Xử lý khi submit form (tạo bài viết hoặc sự kiện)
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    setIsSubmitting(true); // Bật trạng thái đang submit

    try {
      if (activeType === 'event') {
        // TẠO SỰ KIỆN
        const eventData = {
          id_nguoi_tao: currentUserId,
          ten_su_kien: eventDetails.name,
          mo_ta: content || eventDetails.name,
          dia_diem: eventDetails.location,
          thoi_gian_bat_dau: `${eventDetails.date} ${eventDetails.time}`, // Ghép ngày và giờ
          so_luong_toi_da: parseInt(eventDetails.maxParticipants),
          diem_thuong: parseInt(eventDetails.points),
          noi_dung_bai_viet: content
        };

        const response = await taoSuKien(eventData);
        
        if (response.success) {
          alert('Tạo sự kiện thành công! Đang chờ duyệt.');
          onCreatePost(); // Gọi callback để refresh danh sách bài viết
        }
      } else if (content.trim()) {
        // TẠO BÀI VIẾT THƯỜNG
        const postData = {
          id_tac_gia: currentUserId,
          noi_dung: content
        };

        const response = await taoBaiViet(postData);
        
        if (response.success) {
          onCreatePost(); // Refresh danh sách bài viết
        }
      }

      // Reset form về trạng thái ban đầu
      setContent('');
      setActiveType(null);
      setEventDetails({ name: '', location: '', date: '', time: '', maxParticipants: '', points: '' });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false); // Tắt trạng thái đang submit
    }
  };

  // Danh sách các nút action (Ảnh/Video, Sự kiện, Cảm xúc)
  const actionButtons = [
    {
      type: 'image',
      label: 'Ảnh/Video',
      Icon: ImagePlus,
      activeClasses: 'text-purple-600 bg-purple-100', // Style khi active
      hoverClasses: 'hover:bg-purple-50' // Style khi hover
    },
    {
      type: 'event',
      label: 'Sự kiện',
      Icon: Calendar,
      activeClasses: 'text-cyan-600 bg-cyan-100',
      hoverClasses: 'hover:bg-cyan-50'
    },
    {
      type: 'feeling',
      label: 'Cảm xúc',
      Icon: SmilePlus,
      activeClasses: 'text-yellow-600 bg-yellow-100',
      hoverClasses: 'hover:bg-yellow-50'
    }
  ];

  // Kiểm tra điều kiện disable nút submit
  const isSubmitDisabled = isSubmitting || (activeType === 'event' 
    ? !eventDetails.name || !eventDetails.location || !eventDetails.date // Nếu là sự kiện: phải có tên, địa điểm, ngày
    : !content.trim()); // Nếu là bài viết: phải có nội dung

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Ô nhập nội dung */}
      <div className="flex items-center space-x-3 mb-4">
        {/* Avatar người dùng */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          SV
        </div>
        {/* Input nhập nội dung */}
        <input
          type="text"
          placeholder={activeType === 'event' ? "Mô tả về sự kiện của bạn..." : "Bạn đang nghĩ gì?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 transition-all"
        />
      </div>

      {/* Form tạo sự kiện - Chỉ hiện khi activeType === 'event' */}
      {activeType === 'event' && (
        <div className="mt-4 p-5 bg-cyan-50/50 border border-cyan-200 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="text-md font-semibold text-cyan-800 flex items-center mb-4">
            <Calendar size={18} className="mr-2" />
            Tạo sự kiện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {/* Tên sự kiện */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tên sự kiện</label>
              <input 
                type="text" 
                name="name" 
                value={eventDetails.name} 
                onChange={handleEventDetailChange} 
                placeholder="Ví dụ: Hội thảo AI trong giáo dục" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            
            {/* Địa điểm */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Địa điểm</label>
              <input 
                type="text" 
                name="location" 
                value={eventDetails.location} 
                onChange={handleEventDetailChange} 
                placeholder="Ví dụ: Hội trường A, Tòa nhà B" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            
            {/* Ngày */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày</label>
              <input 
                type="date" 
                name="date" 
                value={eventDetails.date} 
                onChange={handleEventDetailChange} 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            
            {/* Giờ */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Giờ</label>
              <input 
                type="time" 
                name="time" 
                value={eventDetails.time} 
                onChange={handleEventDetailChange} 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            
            {/* Số người tối đa */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Số người tối đa</label>
              <input 
                type="number" 
                name="maxParticipants" 
                value={eventDetails.maxParticipants} 
                onChange={handleEventDetailChange} 
                placeholder="100" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
            
            {/* Điểm thưởng */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Điểm thưởng</label>
              <input 
                type="number" 
                name="points" 
                value={eventDetails.points} 
                onChange={handleEventDetailChange} 
                placeholder="50" 
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons và nút submit */}
      <div className="flex items-center justify-between mt-4">
        {/* Các nút Ảnh/Video, Sự kiện, Cảm xúc */}
        <div className="flex space-x-2">
          {actionButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => setActiveType(activeType === button.type ? null : button.type)} // Toggle active type
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                activeType === button.type
                  ? button.activeClasses // Style khi active
                  : `text-gray-600 ${button.hoverClasses}` // Style khi không active
              }`}
            >
              <button.Icon size={20} />
              <span className="hidden sm:inline">{button.label}</span>
            </button>
          ))}
        </div>
        
        {/* Nút Đăng bài / Tạo sự kiện */}
        <button 
          onClick={handleSubmit}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? 'Đang tạo...' : (activeType === 'event' ? 'Tạo sự kiện' : 'Đăng bài')}
        </button>
      </div>
    </div>
  );
};

/**
 * Component QrCodeScanner - Quét mã QR từ camera
 * @param {Function} onScanSuccess - Callback khi quét thành công
 * @param {Function} onScanFailure - Callback khi quét thất bại
 */
const QrCodeScanner = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef(null); // Ref để tham chiếu đến div chứa scanner

  useEffect(() => {
    if (!scannerRef.current) return; // Nếu chưa có ref thì bỏ qua

    // Khởi tạo scanner từ thư viện html5-qrcode
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader", // ID của element chứa scanner
      { fps: 10, qrbox: { width: 250, height: 250 } }, // Cấu hình: 10 frame/giây, khung quét 250x250px
      false // Không hiển thị verbose logs
    );

    // Render scanner lên UI
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Cleanup: Xóa scanner khi component unmount
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="reader" ref={scannerRef} className="w-full h-full"></div>;
};

/**
 * Component EventCard - Thẻ hiển thị sự kiện
 * @param {Object} event - Thông tin sự kiện
 * @param {Number} currentUserId - ID người dùng hiện tại
 * @param {String} userRole - Vai trò người dùng (sinh_vien, giang_vien, quan_tri_vien)
 * @param {Function} onRefresh - Callback để refresh danh sách bài viết
 */
const EventCard = ({ event, currentUserId, userRole, onRefresh }) => {
  // State quản lý hiển thị modal QR code
  const [showQrModal, setShowQrModal] = useState(false);
  
  // State quản lý hiển thị modal quét QR
  const [showScanner, setShowScanner] = useState(false);
  
  // State kiểm tra đã đăng ký sự kiện chưa
  const [isRegistered, setIsRegistered] = useState(false);
  
  // State quản lý trạng thái đang đăng ký
  const [isRegistering, setIsRegistering] = useState(false);
  
  // State quản lý trạng thái đang kiểm tra đăng ký
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  /**
   * Effect: Kiểm tra trạng thái đăng ký khi component mount
   */
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // Validate input
      if (!event.id || !currentUserId) {
        setCheckingRegistration(false);
        return;
      }

      try {
        // Gọi API kiểm tra đã đăng ký chưa
        const response = await kiemTraDangKySuKien(event.id, currentUserId);
        setIsRegistered(response.data?.da_dang_ky || false);
      } catch (error) {
        console.error('Lỗi khi kiểm tra đăng ký:', error);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, [event.id, currentUserId]); // Chạy lại khi event.id hoặc currentUserId thay đổi

  /**
   * Xử lý đăng ký sự kiện
   */
  const handleRegisterEvent = async () => {
    // Validate input
    if (!event.id || !currentUserId) {
      alert('Thông tin không đầy đủ để đăng ký');
      return;
    }

    setIsRegistering(true);
    try {
      // Gọi API đăng ký sự kiện
      const response = await dangKySuKien(event.id, currentUserId);
      
      if (response.success) {
        setIsRegistered(true); // Cập nhật trạng thái đã đăng ký
        alert('Đăng ký sự kiện thành công!');
        if (onRefresh) onRefresh(); // Refresh danh sách để cập nhật số người đã đăng ký
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Dữ liệu mã QR - Chứa thông tin để điểm danh
   * Format JSON: { eventId, userId, timestamp }
   */
  const qrValue = JSON.stringify({ 
    eventId: event.id,
    userId: currentUserId,
    timestamp: Date.now() // Thời gian tạo QR để tránh duplicate
  });

  /**
   * Xử lý khi quét QR thành công (dành cho người tổ chức)
   */
  const handleScanSuccess = useCallback((decodedText) => {
    try {
      const data = JSON.parse(decodedText); // Parse JSON từ QR code
      console.log("Đã quét được:", data);
      
      // TODO: Gọi API để xác thực và điểm danh
      // await xacThucDiemDanh(event.id, data.userId);
      
      setShowScanner(false);
      alert(`Điểm danh thành công cho user ID: ${data.userId}`);
    } catch (error) {
      alert('Mã QR không hợp lệ');
    }
  }, [event.id]);

  /**
   * Xử lý khi quét QR thất bại
   * Không cần làm gì đặc biệt, chỉ log nếu cần debug
   */
  const handleScanFailure = useCallback((error) => {
    // Có thể log lỗi nếu cần
  }, []);

  // Tính số chỗ còn lại
  const slotsRemaining = event.so_luong_toi_da - (event.so_da_dang_ky || 0);
  const isFull = slotsRemaining <= 0; // Kiểm tra đã hết chỗ chưa

  return (
    <>
      {/* Card hiển thị thông tin sự kiện */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4 shadow-sm">
        {/* Tiêu đề và badge trạng thái */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {event.ten_su_kien}
          </h3>
          {/* Badge hiển thị trạng thái đăng ký */}
          {checkingRegistration ? (
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">
              Đang kiểm tra...
            </span>
          ) : isRegistered ? (
            <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              ✓ Đã đăng ký
            </span>
          ) : null}
        </div>
        
        {/* Grid hiển thị thông tin sự kiện */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Thời gian */}
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar size={16} className="text-blue-600" />
            </div>
            <span className="text-sm">{new Date(event.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
          </div>
          
          {/* Địa điểm */}
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <MapPin size={16} className="text-purple-600" />
            </div>
            <span className="text-sm">{event.dia_diem}</span>
          </div>
          
          {/* Số người tham gia */}
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Users size={16} className="text-green-600" />
            </div>
            <span className="text-sm">{event.so_da_dang_ky || 0}/{event.so_luong_toi_da} người</span>
          </div>
          
          {/* Điểm thưởng */}
          <div className="flex items-center text-orange-600">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Gift size={16} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium">+{event.diem_thuong} điểm</span>
          </div>
        </div>
        
        {/* Nút action */}
        <div className="flex space-x-3">
          {/* Nếu là người tổ chức/giảng viên/admin → Hiển thị nút Quét mã */}
          {userRole === 'organizer' || userRole === 'giang_vien' || userRole === 'quan_tri_vien' ? (
            <button 
              onClick={() => setShowScanner(true)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg font-medium"
            >
              <ScanLine size={18} />
              <span>Quét mã điểm danh</span>
            </button>
          ) : (
            /* Nếu là sinh viên → Hiển thị nút Đăng ký hoặc Lấy mã điểm danh */
            <>
              {isRegistered ? (
                /* Đã đăng ký → Hiển thị nút Lấy mã điểm danh */
                <button 
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium"
                >
                  <QrCodeIcon size={18} />
                  <span>Lấy mã điểm danh</span>
                </button>
              ) : (
                /* Chưa đăng ký → Hiển thị nút Đăng ký tham gia */
                <button 
                  onClick={handleRegisterEvent}
                  disabled={isRegistering || isFull || checkingRegistration}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Đang đăng ký...' : isFull ? 'Đã hết chỗ' : 'Đăng ký tham gia'}
                </button>
              )}
            </>
          )}
          
          {/* Hiển thị số chỗ còn lại */}
          <button className={`px-4 py-3 border-2 rounded-lg transition-all font-medium ${
            isFull 
              ? 'border-red-300 text-red-600 bg-red-50' // Style khi hết chỗ
              : 'border-blue-300 text-blue-600 hover:bg-blue-50' // Style bình thường
          }`}>
            {slotsRemaining} chỗ còn lại
          </button>
        </div>
      </div>

      {/* Modal hiển thị QR Code cho sinh viên */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)} // Click vào backdrop để đóng modal
        >
          <div 
            className="bg-gray-50 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative transform transition-all"
            onClick={(e) => e.stopPropagation()} // Ngăn đóng modal khi click vào content
          >
            {/* Nút đóng modal */}
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:text-red-500 hover:scale-110 transition-transform z-10"
            >
              <X size={24} />
            </button>

            {/* Header thẻ sinh viên - Phần màu xanh phía trên */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-24 rounded-t-2xl relative">
              {/* Avatar sinh viên */}
              <img 
                src="https://i.pravatar.cc/120?img=59" // TODO: Thay bằng ảnh thật từ currentUser
                alt="Ảnh đại diện"
                className="w-24 h-24 rounded-full border-4 border-white absolute -bottom-12 left-1/2 -translate-x-1/2 shadow-lg"
              />
            </div>

            {/* Body thẻ - Chứa thông tin và QR code */}
            <div className="pt-16 pb-8 px-6 text-center">
              {/* Thông tin sinh viên */}
              <h2 className="text-2xl font-bold text-gray-800">Lê Hà Bình</h2> {/* TODO: Lấy từ currentUser */}
              <p className="text-gray-500 font-mono">21115053120105</p> {/* TODO: Lấy MSSV từ currentUser */}

              {/* Mã QR code */}
              <div className="mt-6 mb-6">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg inline-block shadow-inner">
                  <QRCode value={qrValue} size={200} /> {/* Tạo QR code với dữ liệu qrValue */}
                </div>
              </div>
              
              {/* Hướng dẫn sử dụng */}
              <p className="text-sm text-gray-600">Đưa mã này cho người tổ chức để điểm danh sự kiện:</p>
              <p className="mt-1 text-sm font-semibold text-blue-600 break-all">{event.ten_su_kien}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal quét mã QR cho người tổ chức */}
      {showScanner && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScanner(false)} // Click backdrop để đóng
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl relative transform transition-all p-6"
            onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click vào content
          >
            {/* Nút đóng */}
            <button 
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Quét Mã Điểm Danh</h2>
            
            {/* Khung chứa scanner */}
            <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden border-4 border-gray-300">
              <QrCodeScanner
                onScanSuccess={handleScanSuccess}
                onScanFailure={handleScanFailure}
              />
            </div>
            
            <p className="text-center text-gray-500 mt-4 text-sm">Di chuyển camera đến mã QR của sinh viên</p>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Component PostCard - Thẻ hiển thị bài viết thường
 * @param {Object} post - Thông tin bài viết
 * @param {Number} currentUserId - ID người dùng hiện tại
 */
const PostCard = ({ post, currentUserId }) => {
  // State quản lý trạng thái đã thích bài viết
  const [liked, setLiked] = useState(false);
  
  // State lưu số lượt thích
  const [likes, setLikes] = useState(post.so_luot_thich || 0);
  
  // State quản lý trạng thái đang xử lý like
  const [isLiking, setIsLiking] = useState(false);

  /**
   * Xử lý khi click nút thích
   * Sử dụng Optimistic Update: Cập nhật UI trước, gọi API sau
   */
  const handleLike = async () => {
    if (isLiking) return; // Ngăn spam click

    setIsLiking(true);
    
    // Tính trạng thái mới
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;

    // Cập nhật UI ngay lập tức (Optimistic Update)
    setLiked(newLiked);
    setLikes(newLikes);

    try {
      // Gọi API like bài viết
      await thichBaiViet(post.id, currentUserId);
    } catch (error) {
      // Nếu API fail → Rollback lại trạng thái cũ
      setLiked(!newLiked);
      setLikes(likes);
      console.error('Lỗi khi thích bài viết:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Header bài viết: Avatar + Tên + Thời gian */}
      <div className="flex items-center space-x-3 mb-4">
        {/* Avatar tác giả - Lấy 2 chữ cái đầu của tên */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
          <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
        </div>
        
        {/* Menu 3 chấm (chưa implement) */}
        <button className="text-gray-400 hover:text-gray-600 p-2">
          <span className="text-lg">⋯</span>
        </button>
      </div>
      
      {/* Nội dung bài viết */}
      <p className="text-gray-800 mb-4 leading-relaxed">{post.noi_dung}</p>
      
      {/* Action buttons: Thích, Bình luận, Chia sẻ */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {/* Nút Thích */}
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg font-medium transition-colors duration-200 ${
              liked 
                ? 'text-red-600 bg-red-50' // Style khi đã thích
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600' // Style khi chưa thích
            } disabled:opacity-50`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likes} Thích</span>
          </button>
          
          {/* Nút Bình luận (chưa implement) */}
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
            <MessageCircle size={18} />
            <span>{post.so_binh_luan || 0} Bình luận</span>
          </button>
          
          {/* Nút Chia sẻ (chưa implement) */}
          <button className="flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors duration-200">
            <Share size={18} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component Feed - Component chính hiển thị trang chủ
 * @param {Object} currentUser - Thông tin người dùng hiện tại
 */
const Feed = ({ currentUser }) => {
  // State lưu danh sách bài viết
  const [posts, setPosts] = useState([]);
  
  // State quản lý trạng thái loading
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý trang hiện tại (cho phân trang)
  const [currentPage, setCurrentPage] = useState(1);
  
  // Lấy thông tin user hiện tại với giá trị mặc định
  const currentUserId = currentUser?.id || 1;
  const userRole = currentUser?.vai_tro || 'sinh_vien';

  /**
   * Hàm fetch danh sách bài viết từ API
   */
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Gọi API lấy danh sách bài viết
      // Params: page (trang hiện tại), limit (số bài viết mỗi trang)
      const response = await layDanhSachBaiViet(currentPage, 10);
      
      if (response.success) {
        setPosts(response.data.bai_viets || []); // Cập nhật state posts
      }
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
    } finally {
      setIsLoading(false); // Tắt loading sau khi xong
    }
  };

  /**
   * Effect: Fetch bài viết khi component mount hoặc currentPage thay đổi
   */
  useEffect(() => {
    fetchPosts();
  }, [currentPage]); // Dependencies: chạy lại khi currentPage thay đổi

  /**
   * Callback khi tạo bài viết/sự kiện thành công
   * Gọi lại fetchPosts để refresh danh sách
   */
  const handleCreatePost = () => {
    fetchPosts();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Banner chào mừng */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-400 bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg">
            <Home className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-2xl font-bold">Chào mừng, {currentUser?.name || 'bạn'}!</h2>
            <p className="text-cyan-100 text-sm">Kết nối và chia sẻ với cộng đồng UTE</p>
          </div>
        </div>
      </div>

      {/* Khung soạn bài viết */}
      <PostComposer onCreatePost={handleCreatePost} currentUserId={currentUserId} />

      {/* Danh sách bài viết */}
      {isLoading ? (
        /* Loading state */
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Đang tải bài viết...</p>
        </div>
      ) : posts.length === 0 ? (
        /* Empty state */
        <div className="text-center py-8 bg-white rounded-xl">
          <p className="text-gray-500">Chưa có bài viết nào</p>
        </div>
      ) : (
        /* Render danh sách bài viết */
        posts.map(post => (
          <div key={post.id}>
            {post.su_kien ? (
              /* Nếu bài viết có sự kiện → Hiển thị EventCard */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
                {/* Header bài viết */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.tac_gia.ho_ten.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{post.tac_gia.ho_ten}</h4>
                    <p className="text-sm text-gray-500">{new Date(post.ngay_tao).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                
                {/* Nội dung bài viết (nếu có) */}
                {post.noi_dung && <p className="text-gray-800 mb-4">{post.noi_dung}</p>}
                
                {/* Thẻ sự kiện */}
                <EventCard 
                  event={post.su_kien} 
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onRefresh={fetchPosts} // Callback để refresh sau khi đăng ký
                />
              </div>
            ) : (
              /* Nếu là bài viết thường → Hiển thị PostCard */
              <PostCard post={post} currentUserId={currentUserId} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;