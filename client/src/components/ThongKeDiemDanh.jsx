import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { layThongKeDiemDanh } from '../services/apiService';
import { Download, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

const ThongKeDiemDanh = () => {
  const { id } = useParams();
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await layThongKeDiemDanh(id);
        if (response.success) {
          setDanhSach(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExportExcel = () => {
    const dataToExport = danhSach.map(item => ({
      'Họ và Tên': item.nguoi_dang_ky.ho_ten,
      'MSSV': item.nguoi_dang_ky.ma_sinh_vien,
      'Email': item.nguoi_dang_ky.email,
      'Thời gian đăng ký': new Date(item.ngay_gio_dang_ky).toLocaleString('vi-VN'),
      'Trạng thái điểm danh': item.ngay_gio_diem_danh ? 'Đã điểm danh' : 'Chưa điểm danh',
      'Thời gian điểm danh': item.ngay_gio_diem_danh ? new Date(item.ngay_gio_diem_danh).toLocaleString('vi-VN') : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThongKeDiemDanh');
    XLSX.writeFile(workbook, `ThongKe_SuKien_${id}.xlsx`);
  };

  if (loading) return <div className="text-center p-10">Đang tải dữ liệu thống kê...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link to="/" className="text-blue-600 hover:underline flex items-center gap-2 mb-2">
            <ArrowLeft size={18} /> Quay lại trang sự kiện
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Thống Kê Điểm Danh</h1>
          <p className="text-gray-500">Sự kiện ID: {id}</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Download size={18} />
          Xuất file Excel
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ Tên</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời Gian Điểm Danh</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {danhSach.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nguoi_dang_ky.ho_ten}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nguoi_dang_ky.ma_sinh_vien}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.ngay_gio_diem_danh ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã điểm danh</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Chưa điểm danh</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.ngay_gio_diem_danh ? new Date(item.ngay_gio_diem_danh).toLocaleString('vi-VN') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThongKeDiemDanh;