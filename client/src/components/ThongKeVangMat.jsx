import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, Percent, UserX } from 'lucide-react';
import { layThongKeVangMatTongHop } from '../services/apiService';
import PostModal from './PostModal';
import PostCard from './PostCard';
import EventPostCard from './EventPostCard';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('vi-VN');
};

const StatCard = ({ icon: Icon, title, value, subtitle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 font-medium">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
          <Icon size={20} className="text-blue-600" />
        </div>
      </div>
    </div>
  );
};

const ThongKeVangMat = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [modalPostId, setModalPostId] = useState(null);

  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = Array.isArray(currentUser?.vai_tro)
    ? currentUser.vai_tro.includes('quan_tri_vien')
    : currentUser?.vai_tro === 'quan_tri_vien';

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await layThongKeVangMatTongHop({ limit: 20 });
        setData(res?.data?.data || null);
      } catch (e) {
        console.error('❌ Lỗi lấy thống kê vắng mặt:', e);
        setError(e?.response?.data?.message || 'Không thể tải thống kê. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) run();
    else {
      setLoading(false);
      setError('Bạn không có quyền truy cập trang này.');
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div>
            <div className="font-semibold text-gray-900">Không thể hiển thị thống kê</div>
            <div className="text-sm text-gray-600 mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const tongHop = data?.tong_hop || { tong_dang_ky: 0, tong_tham_gia: 0, tong_vang: 0, ti_le_tham_gia: 0 };
  const theoSuKien = data?.theo_su_kien || [];
  const theoSinhVien = data?.theo_sinh_vien || [];

  const handleOpenEventModal = (idBaiViet) => {
    if (!idBaiViet) return;
    setModalPostId(idBaiViet);
    setIsPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setModalPostId(null);
  };

  const handleGoToProfile = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Thống kê vắng mặt & tỉ lệ tham gia</h1>
        <p className="text-sm text-gray-600 mt-1">
          Thống kê dựa trên các sự kiện đã kết thúc: đăng ký nhưng chưa điểm danh được tính là vắng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={CalendarDays} title="Tổng lượt đăng ký" value={tongHop.tong_dang_ky} />
        <StatCard icon={UserX} title="Tổng lượt vắng" value={tongHop.tong_vang} subtitle="Đăng ký nhưng chưa điểm danh" />
        <StatCard icon={Percent} title="Tỉ lệ tham gia" value={`${tongHop.ti_le_tham_gia}%`} subtitle="Tham gia / Đăng ký" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Sự kiện có nhiều lượt vắng</h2>
          <p className="text-sm text-gray-600 mt-1">Top 20 theo số lượt vắng.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đăng ký</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tham gia</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vắng</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {theoSuKien.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-gray-600" colSpan={6}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                theoSuKien.map((item) => (
                  <tr key={item.id_su_kien} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => handleOpenEventModal(item.id_bai_viet)}
                        disabled={!item.id_bai_viet}
                        className={`font-medium text-left ${
                          item.id_bai_viet
                            ? 'text-blue-600 hover:text-blue-700 hover:underline'
                            : 'text-gray-900 cursor-not-allowed'
                        }`}
                        title={item.id_bai_viet ? 'Xem chi tiết sự kiện' : 'Không có bài viết sự kiện để mở'}
                      >
                        {item.ten_su_kien}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      <div>BĐ: {formatDateTime(item.thoi_gian_bat_dau)}</div>
                      <div>KT: {formatDateTime(item.thoi_gian_ket_thuc)}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.tong_dang_ky}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.tong_tham_gia}</td>
                    <td className="px-5 py-4 text-sm text-red-600 font-semibold text-right">{item.tong_vang}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.ti_le_tham_gia}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Sinh viên thường xuyên vắng</h2>
          <p className="text-sm text-gray-600 mt-1">Top 20 theo số lượt vắng (chỉ tính người có mã sinh viên).</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đăng ký</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tham gia</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vắng</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {theoSinhVien.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-gray-600" colSpan={6}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                theoSinhVien.map((item) => (
                  <tr key={item.id_nguoi_dung} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleGoToProfile(item.id_nguoi_dung)}
                        className="font-medium text-left text-blue-600 hover:text-blue-700 hover:underline"
                        title="Xem trang cá nhân"
                      >
                        {item.ho_ten}
                      </button>
                      <div className="text-xs text-gray-500">{item.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{item.ma_sinh_vien || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.tong_dang_ky}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.tong_tham_gia}</td>
                    <td className="px-5 py-4 text-sm text-red-600 font-semibold text-right">{item.tong_vang}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 text-right">{item.ti_le_tham_gia}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PostModal
        postId={modalPostId}
        isOpen={isPostModalOpen}
        onClose={handleClosePostModal}
        currentUser={currentUser}
        PostCardComponent={({ post, ...props }) => {
          return post?.su_kien && typeof post.su_kien === 'object' && post.su_kien.id ? (
            <EventPostCard
              post={post}
              {...props}
              currentUserId={currentUser?.id}
              userRole={currentUser?.vai_tro}
              currentUser={currentUser}
              isInModal={true}
            />
          ) : (
            <PostCard
              post={post}
              {...props}
              currentUserId={currentUser?.id}
              isInModal={true}
            />
          );
        }}
      />
    </div>
  );
};

export default ThongKeVangMat;
