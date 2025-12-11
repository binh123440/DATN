import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import RightSidebar from './components/RightSidebar'
import Feed from './components/Feed'
import Groups from './components/Groups'
import Events from './components/Events'
import Chat from './components/Chat'
import Profile from './components/Profile'
import Login from './components/Login'
import ThongKeDiemDanh from './components/ThongKeDiemDanh'
import DuyetBai from './components/DuyetBai';
import GroupDetail from './components/GroupDetail';
import socketService from './services/tinNhanService';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import EventPlanForm from './components/EventPlanForm';
import TaskManager from './components/TaskManager';
import EventApprovalList from './components/EventApprovalList';
import NhiemVu from './components/NhiemVu';

// Component bảo vệ route - chỉ cho phép truy cập khi đã đăng nhập
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Component Layout chính (có Header và Sidebar)
const MainLayout = ({ children, currentUser, isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header onToggleSidebar={toggleMobileSidebar} isSidebarOpen={isMobileSidebarOpen} />
      
      {/* Left Sidebar - Fixed */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />
      
      {/* Right Sidebar - Fixed on desktop */}
      <aside className="w-80 fixed top-0 right-0 h-screen pt-22 pb-6 pr-4 pl-2 hidden xl:block">
        <RightSidebar currentUser={currentUser} />
      </aside>

      {/* Main Content */}
      <div className="xl:ml-64 xl:mr-80 pt-16">
        <main className="max-w-4xl mx-auto px-0 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Lấy thông tin user từ localStorage khi component mount
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser({
          id: user.id,
          name: user.ho_ten || 'Người dùng',
          avatar: user.ho_ten ? user.ho_ten.substring(0, 2).toUpperCase() : 'ND',
          points: user.tong_diem || 0,
          email: user.email,
          vai_tro: user.vai_tro
        });
        
        // Connect socket when user logged in
        socketService.connect();
      } catch (error) {
        console.error('Lỗi khi parse user từ localStorage:', error);
        localStorage.removeItem('user');
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <Router>
      <Routes>
        {/* Route đăng nhập - không cần layout */}
        <Route path="/login" element={<Login />} />

        {/* Routes được bảo vệ - có layout đầy đủ */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout
                currentUser={currentUser}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
                closeMobileSidebar={closeMobileSidebar}
              >
                <Routes>
                  <Route path="/" element={<Feed currentUser={currentUser} />} />
                  <Route path="/groups" element={<Groups currentUser={currentUser} />} />
                  <Route path="/nhom/:id" element={<GroupDetail />} />
                  <Route path="/events" element={<Events currentUser={currentUser} />} />
                  <Route path="/chat" element={<Chat currentUser={currentUser} />} />
                  <Route path="/profile" element={<Profile currentUser={currentUser} />} />
                  <Route path="/profile/:id" element={<UserProfile currentUser={currentUser} />} />
                  <Route path="/events/:id/thong-ke" element={<ThongKeDiemDanh />} />
                  <Route path="/su-kien/:id/thong-ke" element={<ThongKeDiemDanh />} />
                  <Route path="/duyet-bai" element={<DuyetBai />} />
                  <Route path="/events/:id/plan" element={<EventPlanForm />} />
                  <Route path="/events/:id/tasks" element={<TaskManager />} />
                  <Route path="/admin/event-approvals" element={<EventApprovalList />} />
                  <Route path="/nhiem-vu" element={<NhiemVu />} />
                  {/* Redirect về trang chủ nếu route không tồn tại */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                  
                  {currentUser?.vai_tro.includes('quan_tri_vien') && (
                    <Route path="/admin" element={<AdminDashboard />} />
                  )}
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
