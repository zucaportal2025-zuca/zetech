// frontend/src/layouts/AdminLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import logoImg from "../../assets/zuca-logo.png";
import BASE_URL from "../../api";
import RoleManagement from "./RoleManagement";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState(0);
  const notificationRef = useRef(null);

  // Socket connection for real-time updates
useEffect(() => {
  const socket = io(BASE_URL);
  
  socket.on('connect', () => {
    console.log('Admin connected');
  });

  // Listen for pledge-related notifications
  socket.on('new_notification', (notification) => {
    console.log('Admin notification received:', notification);
    setNotifications(prev => [notification, ...prev].slice(0, 20));
    
    // Play sound for new notifications (optional)
    // new Audio('/notification.mp3').play().catch(e => console.log('Audio play failed:', e));
  });

  // Listen for pledge updates
  socket.on('pledge_updated', (updatedPledge) => {
    console.log('Pledge updated:', updatedPledge);
    // You could add a notification here if needed
  });

  // Listen for new pledges
  socket.on('pledge_created', (newPledge) => {
    console.log('New pledge created:', newPledge);
    // The notification will come through 'new_notification' channel
  });

  // Listen for new messages
  socket.on('new_message', (message) => {
    console.log('New message:', message);
    // Add a notification for new messages
    setNotifications(prev => [{
      id: Date.now(),
      type: 'message',
      title: '💬 New Message',
      message: `New message about a pledge`,
      icon: '💬',
      read: false,
      createdAt: new Date().toISOString()
    }, ...prev].slice(0, 20));
  });


  

  // Listen for online members count
  socket.on('online_members', (data) => {
    setOnlineMembers(data.count);
  });

  return () => socket.disconnect();
}, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "", icon: "📊" },
    { label: "Users", path: "users", icon: "👥" },
    { label: "Role Management", path: "roles", icon: "👑" },
    { label: "Manage Jumuia", path: "jumuia-management", icon: "⛪" },
    { label: "ZUCA Media", path: "media", icon: "🎥" },
    { label: "YouTube Analytics", path: "analytics", icon: "▶️" },
    { label: "Songs Program", path: "songs", icon: "🎵" },
    { label: "Hymn Book", path: "hymns", icon: "📖" }, 
    { label: "Announcements", path: "announcements", icon: "📢" },
    { label: "Contributions", path: "contributions", icon: "💰" },
    { label: "Chat Monitor", path: "chat", icon: "💬" },
    { label: "Security", path: "security", icon: "🔒" },
  ];

  return (
    <div className="admin-layout">
      {/* Floating Background Elements */}
      <div className="floating-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Top Bar */}
      <motion.header 
        className="top-bar glass-effect"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="top-bar-left">
          {isMobile && (
            <motion.button 
              className="menu-btn glass-effect"
              onClick={() => setMenuOpen(true)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              ☰
            </motion.button>
          )}
          <img src={logoImg} alt="ZUCA" className="logo-small" />
          <span className="university-name gradient-text">ZETECH UNIVERSITY</span>
        </div>

        <div className="top-bar-right">
          {/* Online Members Count - Always Visible */}
          <div className="online-indicator glass-effect">
            <span className="online-dot"></span>
            <span className="online-count">{onlineMembers} online</span>
          </div>

          {/* Notifications */}
          <div className="notification-container" ref={notificationRef}>
            <motion.button 
              className="notification-btn glass-effect"
              onClick={() => setShowNotifications(!showNotifications)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="notification-dropdown glass-card"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="notification-header">
                    <h3 className="gradient-text">Notifications</h3>
                    {notifications.length > 0 && (
                      <motion.button 
                        onClick={() => setNotifications([])}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear
                      </motion.button>
                    )}
                  </div>
                  <div className="notification-list">
  {notifications.length === 0 ? (
    <div className="notification-empty">No new notifications</div>
  ) : (
    notifications.map((notif, index) => (
      <motion.div 
        key={index} 
        className={`notification-item glass-effect ${notif.type || ''}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 5 }}
      >
        <div className="notification-icon">
          {notif.icon || (notif.type === 'message' ? '💬' : '📌')}
        </div>
        <div className="notification-content">
          <div className="notification-title">{notif.title}</div>
          <div className="notification-message">{notif.message}</div>
          <div className="notification-time">
            {new Date(notif.createdAt).toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    ))
  )}
</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Profile */}
          <motion.div 
            className="admin-profile glass-effect"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="admin-avatar">AD</div>
          </motion.div>
        </div>
      </motion.header>

      {/* Sidebar */}
      <motion.aside
        className={`sidebar glass-card ${isMobile ? 'sidebar-mobile' : ''}`}
        initial={false}
        animate={{ 
          x: isMobile ? (menuOpen ? 0 : "-100%") : 0,
        }}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className="sidebar-header">
          <img src={logoImg} alt="ZUCA" className="sidebar-logo" />
          <h2 className="sidebar-title gradient-text">ZETECH UNIVERSITY</h2>
          <p className="sidebar-subtitle">Catholic Action</p>
          {isMobile && (
            <motion.button 
              className="sidebar-close glass-effect"
              onClick={() => setMenuOpen(false)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              ✕
            </motion.button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              end={item.path === ""}
              onClick={() => isMobile && setMenuOpen(false)}
            >
              {({ isActive }) => (
                <motion.div
                  className={`nav-item glass-effect ${isActive ? 'active' : ''}`}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {isActive && <span className="active-indicator"></span>}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <motion.button 
          className="logout-btn glass-effect"
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🚪 Sign Out
        </motion.button>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div 
            className="mobile-overlay glass-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper glass-card">
          <Outlet />
        </div>
      </main>

      {/* Copyright Footer */}
      <div className="copyright-footer">
        <p>© {new Date().getFullYear()} ZUCA Portal | Built for Unity & Faith</p>
        <p>Portal Built By | CHRISTECH WEBSYS</p>
      </div>

      <style>{`
        .admin-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #0a0a1e 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Floating Background Elements */
        .floating-bg {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .blob {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s infinite;
        }

        .blob-1 {
          top: -100px;
          right: -100px;
          background: #ff0000;
          animation-delay: 0s;
        }

        .blob-2 {
          bottom: -100px;
          left: -100px;
          background: #007bff;
          animation-delay: -5s;
        }

        .blob-3 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: #8b5cf6;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Glass Effect Classes */
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 0px solid rgba(255, 255, 255, 0.1);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 0px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .gradient-text {
          background: linear-gradient(135deg, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Top Bar */
        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 200px;
        }

        .menu-btn {
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 22px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .logo-small {
          height: 36px;
          width: auto;
          flex-shrink: 0;
          filter: drop-shadow(0 0 12px rgba(0, 198, 255, 0.5));
        }

        .university-name {
          font-size: 16px;
          font-weight: 700;
          white-space: nowrap;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 200px;
          justify-content: flex-end;
        }

        /* Online Indicator */
        .online-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 30px;
        }

        .online-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 12px #10b981;
        }

        .online-count {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        /* Notifications */
        .notification-container {
          position: relative;
        }

        .notification-btn {
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 20px;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 11px;
          font-weight: 600;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }

        .notification-dropdown {
          position: fixed;
          top: 80px;
          right: 0;
          width: 340px;
          border-radius: 20px;
          z-index: 1000;
          overflow: hidden;
        }

        .notification-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .notification-header button {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .notification-header button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-empty {
          padding: 40px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.84);
          transition: all 0.2s;
          cursor: pointer;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.94);
        }

        .notification-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .notification-message {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.01);
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }

        /* Admin Profile */
        .admin-profile {
          cursor: pointer;
          flex-shrink: 0;
        }

        .admin-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #007bff, #00c6ff);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3);
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 70px;
          left: 0;
          width: 280px;
          height: calc(100vh - 70px);
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          z-index: 90;
          overflow-y: auto;
          border-right: 1px solid rgba(255, 255, 255, 0.14);
        }

        .sidebar-mobile {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 1000;
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.93);
        }

        .sidebar-header {
          position: relative;
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 24px;
        }

        .sidebar-logo {
          width: 70px;
          height: auto;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 12px rgba(0, 198, 255, 0.5));
        }

        .sidebar-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .sidebar-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.93);
          margin: 0;
        }

        .sidebar-close {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 16px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nav-item {
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgb(255, 255, 255);
          transition: all 0.2s;
        
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(0, 123, 255, 0.2), rgba(0, 198, 255, 0.2));
          color: white;
          border: 1px solid rgba(0, 198, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 198, 255, 0.2);
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(135deg, #007bff, #00c6ff);
        }

        .nav-icon {
          font-size: 20px;
          width: 24px;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
        }

        .active-indicator {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          background: #00c6ff;
          border-radius: 50%;
          box-shadow: 0 0 10px #00c6ff;
        }

        /* Logout Button */
        .logout-btn {
          margin-top: 20px;
          padding: 14px;
          border: 1px solid rgb(255, 0, 0);
          border-radius: 12px;
          background: linear-gradient(135deg, rgb(255, 0, 0), rgba(50, 19, 19, 0.2));
          color: #fca5a5;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3));
          color: white;
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* Mobile Overlay */
        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 95;
        }

        /* Main Content */
        .main-content {
          margin-left: 280px;
          padding: 90px 24px 24px;
          border-radius: 0px;
          min-height: 100vh;
          transition: margin-left 0.3s;
          position: relative;
          z-index: 1;
        }

        

       .content-wrapper {
  border-radius: 0px;           /* Remove border radius for edge-to-edge */
  padding: 0px;                 /* Remove padding */
  margin: 0;                    /* Remove all margins */
  position: relative;
  min-height: calc(100vh - 114px);
  width: 100%;                  /* Force full width */
  max-width: 100%;              /* Ensure it never constrains */
  box-sizing: border-box;
  border-radius: 40px;
  left: 0;
  right: 0;
}

        /* Copyright Footer */
        .copyright-footer {
          position: fixed;
          bottom: 10px;
          right: 24px;
          text-align: right;
          color: rgba(255, 255, 255, 0.3);
          font-size: 11px;
          z-index: 50;
          pointer-events: none;
        }

        .copyright-footer p {
          margin: 2px 0;
        }

        /* Animations */
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 20px #10b981; }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 852px) {
          .main-content {
            margin-left: -0;
            margin-right: 0;
            padding: 80px 0px 20px;
          }

          .copyright-footer {
            right: 16px;
          }

          .top-bar-left {
            min-width: auto;
          }

          .top-bar-right {
            min-width: auto;
            gap: 12px;
          }

          .university-name {
            font-size: 15px;
          }

          .online-indicator {
            padding: 4px 10px;
          }

          .online-count {
            font-size: 13px;
          }

          .notification-dropdown {
            width: 320px;
            right: -10px;
          }
        }

        @media (max-width: 480px) {
          .top-bar {
            padding: 0 0px;
          }

          .university-name {
            font-size: 14px;
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .online-indicator {
            padding: 4px 8px;
          }

          .online-count {
            font-size: 12px;
          }

          .online-dot {
            width: 8px;
            height: 8px;
          }

          .notification-btn, .admin-avatar, .menu-btn {
            width: 40px;
            height: 40px;
          }

          .notification-dropdown {
            width: calc(100vw - 32px);
            right: -8px;
          }

          .sidebar {
            width: 260px;
          }
        }

        @media (max-width: 360px) {
          .university-name {
            display: none;
          }
          
          .online-count {
            display: none;
          }
          
          .online-indicator {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}