import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import RightSidebar from './components/RightSidebar'
import Feed from './components/Feed'
import Groups from './components/Groups'
import Events from './components/Events'
import Chat from './components/Chat'
import Profile from './components/Profile'
// import NostrRelay from './components/NostrRelay'

function App() {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Lê Hà Bình',
    avatar: 'LH',
    points: 1250
  })

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header onToggleSidebar={toggleMobileSidebar} isSidebarOpen={isMobileSidebarOpen} />
        
        {/* Left Sidebar - Fixed */}
        <Sidebar isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />
        
        {/* Right Sidebar - Fixed on desktop */}
        <aside className="w-80 fixed top-0 right-0 h-screen pt-16 pb-6 pr-4 pl-2 hidden xl:block">
          <RightSidebar currentUser={currentUser} />
        </aside>

        {/* Main Content */}
        <div className="xl:ml-64 xl:mr-80 pt-16">
          <main className="max-w-2xl mx-auto px-0 py-6">
            <Routes>
              <Route path="/" element={<Feed currentUser={currentUser} />} />
              <Route path="/groups" element={<Groups currentUser={currentUser} />} />
              <Route path="/events" element={<Events currentUser={currentUser} />} />
              <Route path="/chat" element={<Chat currentUser={currentUser} />} />
              <Route path="/profile" element={<Profile currentUser={currentUser} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
