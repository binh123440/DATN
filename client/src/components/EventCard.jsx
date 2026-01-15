import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Thêm Link
import { Calendar, MapPin, Users, Gift, QrCode as QrCodeIcon, X, ScanLine, Check, BarChart3 } from 'lucide-react'; // Thêm BarChart3
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { dangKySuKien, kiemTraDangKySuKien, diemDanhSuKien } from '../services/apiService';
import * as geolib from 'geolib';

const parseTargetAudienceFromPlan = (raw) => {
  if (!raw) return { voluntary: true, roles: [], khoa_ids: [] };

  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== 'object') return { voluntary: true, roles: [], khoa_ids: [] };

  const ta = obj.targetAudience || obj.target_audience || {};
  const khoaIds =
    Array.isArray(ta.khoa_ids) ? ta.khoa_ids :
    Array.isArray(ta.khoaIds) ? ta.khoaIds : [];

  return {
    voluntary: ta.voluntary !== false,
    roles: Array.isArray(ta.roles) ? ta.roles : [],
    khoa_ids: khoaIds
  };
};

// --- Component con: QrCodeScanner ---
const QrCodeScanner = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scannerRef.current) return;

    const config = { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true };
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
    scannerRef.current = html5QrcodeScanner;
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          if (error.name !== 'NotFoundError') console.error("Lỗi dọn dẹp scanner:", error);
        });
        scannerRef.current = null;
      }
    };
  }, []); // ✅ Giữ nguyên: Không có dependencies để chỉ chạy 1 lần

  return <div id="reader" className="w-full min-h-[300px] bg-gray-100 rounded-xl"></div>;
};


// --- Component chính: EventCard ---
const EventCard = ({ event: initialEvent, currentUserId, userRole, currentUser, onRefresh }) => {
  // ✅ BƯỚC 1: Tạo state cục bộ cho dữ liệu sự kiện
  const [event, setEvent] = useState(initialEvent);

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttended, setHasAttended] = useState(false); // State mới để theo dõi điểm danh
  const [isRegistering, setIsRegistering] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  const toNumberOrNull = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const hasRole = (roleKey) => {
    if (!userRole) return false;
    if (Array.isArray(userRole)) return userRole.includes(roleKey);
    return String(userRole) === roleKey;
  };

  // ✅ Fix: xác định đúng "người tổ chức"
  const isEventOrganizer = useMemo(() => {
    const creatorIdRaw =
      event?.id_nguoi_tao ??
      event?.nguoi_tao?.id ??
      event?.bai_viet?.id_tac_gia ??
      event?.id_tac_gia ??
      null;

    const creatorId = creatorIdRaw !== null && creatorIdRaw !== undefined ? Number(creatorIdRaw) : null;
    const me = currentUserId !== null && currentUserId !== undefined ? Number(currentUserId) : null;

    const isCreator = creatorId !== null && me !== null && creatorId === me;

    // Nếu bạn muốn BGH/Trưởng phòng (admin/quan_tri_vien) cũng được quyền quét mã, giữ đoạn này:
    const isPrivileged = hasRole('admin') || hasRole('quan_tri_vien') || hasRole('kiem_duyet_vien');

    return isCreator || isPrivileged;
  }, [event, currentUserId, userRole]);

  const currentUserRole = currentUser?.vai_tro || userRole;
  const currentUserKhoaId =
    currentUser?.id_khoa ??
    currentUser?.khoa?.id ??
    currentUser?.nganh?.khoa?.id ??
    null;

  const targetAudience = useMemo(() => {
    return parseTargetAudienceFromPlan(event?.ke_hoach_chi_tiet);
  }, [event?.ke_hoach_chi_tiet]);

  const { canRegisterByAudience, audienceBlockReason } = useMemo(() => {
    const roles = targetAudience?.roles || [];
    const khoaIds = (targetAudience?.khoa_ids || []).map((x) => Number(x)).filter((x) => Number.isFinite(x));

    const hasRoleRule = roles.length > 0;
    const hasKhoaRule = khoaIds.length > 0;

    if (!hasRoleRule && !hasKhoaRule) {
      return { canRegisterByAudience: true, audienceBlockReason: '' };
    }

    if (hasRoleRule && !roles.includes(currentUserRole)) {
      return { canRegisterByAudience: false, audienceBlockReason: 'Không thuộc đối tượng (vai trò)' };
    }

    if (hasKhoaRule) {
      const kId = Number(currentUserKhoaId);
      if (!Number.isFinite(kId) || !khoaIds.includes(kId)) {
        return { canRegisterByAudience: false, audienceBlockReason: 'Không thuộc đối tượng (khoa)' };
      }
    }

    return { canRegisterByAudience: true, audienceBlockReason: '' };
  }, [targetAudience, currentUserRole, currentUserKhoaId]);
  // // Giả sử bạn có thông tin vai trò từ context hoặc props
  // const isAdmin = userRole === 'admin'; 

  // Sử dụng useEffect để quản lý timer và polling
  useEffect(() => {
    let qrExpiryTimer;
    let attendancePollInterval;

    if (showQrModal) {
      // 1. Timer tự động đóng mã QR sau 30 giây
      qrExpiryTimer = setTimeout(() => {
        setShowQrModal(false);
        alert("Mã QR đã hết hạn. Vui lòng tạo mã mới.");
      }, 30000);

      // 2. Bắt đầu polling để kiểm tra trạng thái điểm danh mỗi 3 giây
      attendancePollInterval = setInterval(async () => {
        try {
          const response = await kiemTraDangKySuKien(event.id, currentUserId);
          if (response.data?.da_diem_danh) {
            // Nếu đã điểm danh thành công
            setShowQrModal(false); // Đóng modal QR
            setHasAttended(true);  // Cập nhật UI sang "Đã điểm danh"
            alert('Điểm danh thành công!'); // Thông báo cho sinh viên
            
            //  BƯỚC 2: Cập nhật số lượng người đăng ký cục bộ
            setEvent(prevEvent => ({
              ...prevEvent,
              so_da_dang_ky: (prevEvent.so_da_dang_ky || 0) + 1
            }));
            //  BƯỚC 3: Xóa bỏ onRefresh()
            // if (onRefresh) onRefresh(); 
          }
        } catch (error) {
          console.error("Lỗi khi polling trạng thái điểm danh:", error);
        }
      }, 2000); // Kiểm tra mỗi 2 giây
    }

    // Dọn dẹp khi component unmount hoặc modal bị đóng
    return () => {
      clearTimeout(qrExpiryTimer);
      clearInterval(attendancePollInterval);
    };
  }, [showQrModal, event.id, currentUserId, onRefresh]);

  /**
   * Effect: Kiểm tra trạng thái đăng ký và điểm danh ban đầu
   */
  useEffect(() => {
    const checkStatus = async () => {
      if (isEventOrganizer || !event.id || !currentUserId) {
        setCheckingRegistration(false);
        return;
      }
      try {
        const response = await kiemTraDangKySuKien(event.id, currentUserId);
        setIsRegistered(response.data?.da_dang_ky || false);
        setHasAttended(response.data?.da_diem_danh || false); // Cập nhật trạng thái điểm danh
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái:', error);
      } finally {
        setCheckingRegistration(false);
      }
    };
    checkStatus();
  }, [event.id, currentUserId, isEventOrganizer]);

  /**
   * Xử lý đăng ký sự kiện
   */
  const handleRegisterEvent = async () => {
    if (!event.id || !currentUserId) {
      alert('Thông tin không đầy đủ để đăng ký');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await dangKySuKien(event.id, currentUserId);
      
      if (response.success) {
        setIsRegistered(true);
        alert('Đăng ký sự kiện thành công!');
        
        //  BƯỚC 2: Cập nhật số lượng người đăng ký cục bộ
        setEvent(prevEvent => ({
          ...prevEvent,
          so_da_dang_ky: (prevEvent.so_da_dang_ky || 0) + 1
        }));
        //  BƯỚC 3: Xóa bỏ onRefresh()
        // if (onRefresh) onRefresh();
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Lấy vị trí và tạo mã QR
   */
  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true);
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
      setIsGeneratingQr(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const qrData = {
          eventId: event.id,
          userId: currentUserId,
          timestamp: Date.now(),
          coords: {
            lat: latitude,
            lng: longitude,
          },
        };
        setQrValue(JSON.stringify(qrData));
        setShowQrModal(true);
        setIsGeneratingQr(false);
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        alert("Không thể lấy được vị trí của bạn. Vui lòng bật quyền truy cập vị trí trong trình duyệt và thử lại.");
        setIsGeneratingQr(false);
      }
    );
  };

  const handleOpenScanner = () => {
    setScannerKey(prevKey => prevKey + 1);
    setShowScanner(true);
    setScanResult(null);
    setIsPaused(false);
  };

  const handleScanSuccess = async (decodedText) => {
    if (isPausedRef.current) return;
    setIsPaused(true);

    if (!navigator.geolocation) {
      setScanResult({ success: false, message: 'Trình duyệt không hỗ trợ định vị để xác thực.' });
      return;
    }

    // Lấy vị trí của người quét trước khi gọi API
    navigator.geolocation.getCurrentPosition(
      async (scannerPosition) => {
        const scannerCoords = {
          latitude: scannerPosition.coords.latitude,
          longitude: scannerPosition.coords.longitude,
        };
        
        try {
          // Gọi API để server xử lý toàn bộ logic xác thực
          const response = await diemDanhSuKien(event.id, decodedText, scannerCoords);
          setScanResult({ success: true, message: response.message });
          
          // BƯỚC 2: Cập nhật số lượng người đăng ký cục bộ
          setEvent(prevEvent => ({
            ...prevEvent,
            so_da_dang_ky: (prevEvent.so_da_dang_ky || 0) + 1
          }));
          //  BƯỚC 3: Xóa bỏ onRefresh()
          // if (onRefresh) onRefresh();
        } catch (error) {
          // Hiển thị lỗi từ server cho người quét
          setScanResult({ success: false, message: error.response?.data?.message || 'Điểm danh thất bại. Đã xảy ra lỗi không xác định.' });
        }
      },
      (error) => {
        console.error("Lỗi lấy vị trí người quét:", error);
        setScanResult({ success: false, message: 'Không thể lấy vị trí của bạn để xác thực. Vui lòng cấp quyền truy cập vị trí.' });
      }
    );
  };
  
  const handleCloseResultModal = () => {
    setScanResult(null);
    setIsPaused(false);
  };

  const handleScanFailure = (error) => { /* Bỏ qua lỗi khi không tìm thấy QR */ };

  const slotsRemaining = event.so_luong_toi_da - (event.so_da_dang_ky || 0);
  const isFull = slotsRemaining <= 0;

  return (
    <>
      {/* Card hiển thị thông tin sự kiện */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent order-2 sm:order-1 min-h-[3.5rem] flex items-top">
            {event.ten_su_kien}
          </h3>
          <div className="flex-shrink-0 order-1 sm:order-2 self-end sm:self-start">
            {isEventOrganizer ? (
              <span className="flex-shrink-0 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">👤 Người tổ chức</span>
            ) : checkingRegistration ? (
              <span className="flex-shrink-0 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">Đang kiểm tra...</span>
            ) : isRegistered ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200"><Check size={14} /> Đã đăng ký</span>
            ) : <span className="flex-shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium border border-red-200"><X size={14} /> Chưa đăng ký</span>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-600"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3"><Calendar size={16} className="text-blue-600" /></div><span className="text-sm">{new Date(event.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span></div>
          <div className="flex items-center text-gray-600"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3"><MapPin size={16} className="text-purple-600" /></div><span className="text-sm">{event.dia_diem}</span></div>
          <div className="flex items-center text-gray-600"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3"><Users size={16} className="text-green-600" /></div><span className="text-sm">{event.so_da_dang_ky || 0}/{event.so_luong_toi_da} người</span></div>
          <div className="flex items-center text-orange-600"><div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3"><Gift size={16} className="text-orange-600" /></div><span className="text-sm font-medium">+{event.diem_thuong} điểm</span></div>
        </div>
        
        <div className="flex space-x-3">
          {isEventOrganizer ? (
            <>
              <button
                onClick={handleOpenScanner}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg font-medium"
              >
                <ScanLine size={18} />
                <span>Quét mã</span>
              </button>

              <Link to={`/events/${event.id}/thong-ke`} className="bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-700 transition-all shadow-lg font-medium">
                <BarChart3 size={18} />
              </Link>
            </>
          ) : (
            <>
              {isRegistered ? (
                hasAttended ? (
                  // Hiển thị khi đã điểm danh thành công
                  <div className="flex-1 text-center bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium border border-green-200 flex items-center justify-center gap-2">
                    <Check size={18} />
                    <span>Đã điểm danh</span>
                  </div>
                ) : (
                  // Hiển thị nút lấy mã khi chưa điểm danh
                  <button onClick={handleGenerateQrCode} disabled={isGeneratingQr} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-60">
                    <QrCodeIcon size={18} />
                    <span>{isGeneratingQr ? 'Đang tạo mã...' : 'Lấy mã điểm danh'}</span>
                  </button>
                )
              ) : (
                <button
                  onClick={handleRegisterEvent}
                  disabled={isRegistering || isFull || checkingRegistration || !canRegisterByAudience}
                  title={!canRegisterByAudience ? audienceBlockReason : undefined}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering
                    ? 'Đang đăng ký...'
                    : isFull
                      ? 'Đã hết chỗ'
                      : !canRegisterByAudience
                        ? 'Không thuộc đối tượng'
                        : 'Đăng ký tham gia'}
                </button>
              )}
            </>
          )}
          <button className={`px-4 py-3 border-2 rounded-lg transition-all font-medium ${isFull ? 'border-red-300 text-red-600 bg-red-50' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>{slotsRemaining} chỗ còn lại</button>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-gray-50 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)} className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:text-red-500 hover:scale-110 transition-transform z-10"><X size={24} /></button>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-24 rounded-t-2xl relative">
              <img src="https://i.pravatar.cc/120?img=59" alt="Ảnh đại diện" className="w-24 h-24 rounded-full border-4 border-white absolute -bottom-12 left-1/2 -translate-x-1/2 shadow-lg" />
            </div>
            <div className="pt-16 pb-8 px-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Lê Hà Bình</h2>
              <p className="text-gray-500 font-mono">21115053120105</p>
              <div className="mt-6 mb-6"><div className="p-4 bg-white border-2 border-gray-200 rounded-lg inline-block shadow-inner">
                {qrValue ? <QRCode value={qrValue} size={200} /> : <p>Đang tạo mã QR...</p>}
              </div></div>
              <p className="text-sm text-gray-600">Đưa mã này cho người tổ chức để điểm danh sự kiện:</p>
              <p className="mt-1 text-sm font-semibold text-blue-600 break-all">{event.ten_su_kien}</p>
              <p className="mt-2 text-xs text-red-500 font-mono animate-pulse">Mã sẽ hết hạn sau 30 giây</p>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setShowScanner(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            {scanResult && (
              <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                {scanResult.success ? (
                  <><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"><svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div><h3 className="text-xl font-bold text-gray-800">Thành công!</h3><p className="text-gray-600 mt-2">{scanResult.message}</p></>
                ) : (
                  <><div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"><svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h3 className="text-xl font-bold text-gray-800">Thất bại!</h3><p className="text-gray-600 mt-2">{scanResult.message}</p></>
                )}
                <button onClick={handleCloseResultModal} className="mt-6 bg-blue-500 text-white px-8 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">Quét lại</button>
              </div>
            )}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 relative">
              <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"><X size={20} /></button>
              <div className="pr-8"><h2 className="text-xl font-bold text-white flex items-center gap-2"><ScanLine size={20} />Quét Mã Điểm Danh</h2><p className="text-green-50 text-sm mt-1 truncate">{event.ten_su_kien}</p></div>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 rounded-xl overflow-hidden mb-4"><QrCodeScanner key={scannerKey} onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} /></div>
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">📱 Di chuyển camera đến mã QR của sinh viên</p>
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Users size={18} className="text-blue-600" /></div><div className="text-left"><p className="text-xs text-gray-500">Đã điểm danh</p><p className="text-base font-bold text-gray-800">{event.so_da_dang_ky || 0}/{event.so_luong_toi_da}</p></div></div>
                  <div className="w-px h-10 bg-gray-300"></div>
                  <div className="flex items-center gap-2"><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><Gift size={18} className="text-green-600" /></div><div className="text-left"><p className="text-xs text-gray-500">Điểm thưởng</p><p className="text-base font-bold text-green-600">+{event.diem_thuong}</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;
