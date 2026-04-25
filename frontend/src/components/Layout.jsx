// frontend/src/components/Layout.jsx
import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/zuca-logo.png";
import bg from "../assets/background1.webp";
import Notifications from "./Notifications";
import BASE_URL from "../api";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarShadow, setSidebarShadow] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const scrollContainerRef = useRef(null);
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
  }, []);

  // Handle resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile when resizing from desktop to mobile
      if (mobile) {
        setMenuOpen(false);
      } else {
        // Auto-open on desktop
        setMenuOpen(true);
      }
    };
    
    window.addEventListener("resize", handleResize);
    // Set initial state
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          !event.target.closest('.mobile-hamburger')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Handle click outside user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add scroll shadow effect
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setSidebarShadow(scrollContainerRef.current.scrollTop > 5);
      }
    };
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const profileImageUrl =
    user.profileImage
      ? user.profileImage.startsWith("http")
        ? user.profileImage
        : `${BASE_URL}/${user.profileImage}`
      : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/liturgical-calendar", label: "Liturgical Calendar", icon: "🗓️" },
    { path: "/gallery", label: "gallery", icon: "💾"},
  
    { path: "/join-jumuia", label: "Join Jumuia", icon: "👥" },
    { path: "/announcements", label: "Announcements", icon: "📢" },
  
    { path: "/mass-programs", label: "Mass Programs", icon: "⛪" },
    { path: "/contributions", label: "Contributions", icon: "💰" },
    { path: "/hymns", label: "Hymn Book", icon: "🎵" },
    { path: "/jumuia-contributions", label: "My Jumuia", icon: "🏠" },    
    { path: "/chat", label: "Chat", icon: "💬" },
  ];

  return (
    <div style={containerStyle(bg)}>
      {/* Gradient Overlay - Lower z-index */}
      <div style={overlayStyle} />

      {/* Backdrop for mobile only - Medium z-index */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={backdropStyle}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Medium z-index */}
      <motion.aside
        ref={sidebarRef}
        className="sidebar"
        initial={false}
        animate={{ 
          x: menuOpen ? 0 : (isMobile ? "-100%" : 0),
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={sidebarStyle}
      >
        {/* Logo Section */}
        <div style={logoSection}>
          <motion.img 
            src={logo} 
            alt="ZUCA Logo" 
            style={logoStyle}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div style={logoText}>
            <h3 style={logoTitle}>ZETECH UNIVERSITY</h3>
            <p style={logoSubtitle}>Catholic Action</p>
          </div>
        </div>

        {/* User Info Badge */}
        <div style={userBadgeStyle}>
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={user.fullName} style={userBadgeAvatar} />
          ) : (
            <div style={userBadgeFallback}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={userBadgeInfo}>
            <span style={userBadgeName}>{user.fullName.split(" ")[0]}</span>
            <span style={userBadgeRole}>{user.role || "Member"}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div
          ref={scrollContainerRef}
          style={navContainer(sidebarShadow)}
        >
          <nav style={navStyle}>
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobile) setMenuOpen(false);
                }}
              >
                {({ isActive }) => (
                  <motion.div
                    style={navItemStyle(isActive)}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span style={navIconStyle}>{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        style={activeIndicatorStyle}
                        transition={{ type: "spring", damping: 20 }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={sidebarFooterStyle}>
          <div style={sidebarFooterDivider} />
          <motion.button
            onClick={handleLogout}
            style={sidebarLogoutButton}
            whileHover={{ backgroundColor: "rgba(239,68,68,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={logoutIconStyle}>🚪</span>
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main style={mainContentStyle(isMobile, menuOpen)}>
        {/* Top Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={headerStyle}
        >
          <div style={headerLeftStyle}>
            {/* Hamburger Menu Button - visible on mobile only */}
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              style={hamburgerStyle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="mobile-hamburger"
            >
              <span style={hamburgerIconStyle}>{menuOpen ? "✕" : "☰"}</span>
            </motion.button>

            {/* Page Title - can be dynamic based on route */}
            <span style={pageTitleStyle}>Dashboard</span>
          </div>

          <div style={headerRightStyle}>
            {/* Notifications - Highest z-index component */}
            <div style={notificationWrapperStyle}>
              <Notifications userId={user.id} />
            </div>

            {/* User Menu */}
            <div ref={userMenuRef} style={userMenuContainerStyle}>
              <motion.div
                style={userMenuTriggerStyle}
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={user.fullName} style={headerAvatarStyle} />
                ) : (
                  <div style={headerAvatarFallbackStyle}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={userNameStyle}>{user.fullName.split(" ")[0]}</span>
                <span style={dropdownArrowStyle}>▼</span>
              </motion.div>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={userDropdownStyle}
                  >
                    <div style={userDropdownHeader}>
                      <strong>{user.fullName}</strong>
                      <span style={userDropdownEmail}>{user.email}</span>
                    </div>
                    <div style={userDropdownDivider} />
                    <motion.button
                      onClick={handleLogout}
                      style={userDropdownLogout}
                      whileHover={{ backgroundColor: "#fee2e2", color: "#ef4444" }}
                    >
                      <span style={dropdownLogoutIcon}>🚪</span>
                      Sign Out
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Page Content - This is where your pages render */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={contentStyle}
          className="page-content"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Global styles - FIXED FOR NO MARGINS AND OPTIMAL SPACE USAGE */}
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          /* CRITICAL FIXES: Remove all margins and optimize space */
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          /* Remove default margins from all elements inside content */
          .page-content * {
            max-width: 100%;
          }

          /* FIX: Hide scrollbars but keep functionality */
          main {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: transparent transparent; /* Firefox */
            -ms-overflow-style: none;  /* IE and Edge */
          }
          
          main::-webkit-scrollbar {
            width: 0px;  /* Remove scrollbar space */
            height: 0px;
            background: transparent;  /* Optional: just make scrollbar invisible */
          }
          
          /* For the inner content container */
          .page-content {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.2) transparent;
            -ms-overflow-style: -ms-autohiding-scrollbar;
          }
          
          .page-content::-webkit-scrollbar {
            width: 4px;  /* Thin scrollbar */
            height: 4px;
          }
          
          .page-content::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
          }
          
          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          /* Mobile-specific fixes */
          @media (max-width: 900px) {
            /* Show hamburger menu on mobile */
            .mobile-hamburger {
              display: flex !important;
            }
            
            /* Remove all padding/margins on mobile */
            main {
              padding: 0 !important;
              margin: 0 !important;
            }
            
            .page-content {
              padding: 12px !important; /* Minimal padding for content, not margins */
            }
            
            /* Make cards and tables use full width */
            .page-content .card,
            .page-content .table-container,
            .page-content [class*="card"],
            .page-content [class*="Card"],
            .page-content [class*="table"],
            .page-content [class*="Table"] {
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 8px !important; /* Slightly smaller radius on mobile */
            }
            
            /* Force tables to not overflow */
            .page-content table {
              display: block;
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              white-space: nowrap;
            }
            
            /* Make table cells more compact on mobile if needed */
            .page-content th,
            .page-content td {
              padding: 8px !important;
              white-space: nowrap;
            }
            
            /* Grid layouts should use full width */
            .page-content .grid,
            .page-content [class*="grid"] {
              margin: 0 !important;
              width: 100% !important;
            }
          }

          /* Desktop scrollbar styling - minimal but visible */
          @media (min-width: 901px) {
            .page-content::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
          }

          /* Sidebar scrollbar - minimal */
          .sidebar-scroll::-webkit-scrollbar {
            width: 3px;
          }

          /* Z-index hierarchy */
          .sidebar {
            z-index: 50 !important;
          }

          .mobile-backdrop {
            z-index: 40 !important;
          }

          header {
            z-index: 30 !important;
          }

          /* Notifications - highest */
          .notifications-dropdown,
          [class*="Notifications"] [style*="position: fixed"],
          [class*="Notifications"] [style*="position: absolute"] {
            z-index: 9999999 !important;
          }
        `}
      </style>
    </div>
  );
}

// ==================== Styles ====================

const containerStyle = (bg) => ({
  height: "100vh",
  width: "100vw",
  backgroundImage: `url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  position: "relative",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  overflow: "hidden",
  margin: 0,
  padding: 0,
});

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(-45deg, rgba(49,15,221,0.7), rgba(0,0,0,0.8), rgba(49,15,221,0.7))",
  backgroundSize: "400% 400%",
  animation: "gradientMove 15s ease infinite",
  zIndex: 0,
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(13, 13, 13, 0.28)",
  backdropFilter: "blur(4px)",
  zIndex: 40,
};

const sidebarStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  height: "100vh",
  width: "280px",
  background: "rgba(22, 82, 210, 0.43)",
  backdropFilter: "blur(10px)",
  borderRight: "1px solid rgba(255, 255, 255, 0.86)",
  padding: "24px 16px",
  display: "flex",
  flexDirection: "column",
  zIndex: 50,
  boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
  overflowY: "hidden",
};

const logoSection = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 12px",
  marginBottom: "20px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const logoStyle = {
  width: "48px",
  height: "auto",
  borderRadius: "12px",
};

const logoText = {
  flex: 1,
};

const logoTitle = {
  color: "#fff",
  fontSize: "14px",
  fontWeight: "700",
  margin: 0,
  lineHeight: "1.4",
};

const logoSubtitle = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "15px",
  margin: "4px 0 0",
  fontWeight: "600"
};

const userBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "12px",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.05)",
};

const userBadgeAvatar = {
  width: "40px",
  height: "40px",
  borderRadius: "40px",
  objectFit: "cover",
  border: "2px solid #00c6ff",
};

const userBadgeFallback = {
  width: "40px",
  height: "40px",
  borderRadius: "40px",
  background: "linear-gradient(135deg, #00c6ff, #007bff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "600",
  color: "#fff",
};

const userBadgeInfo = {
  flex: 1,
};

const userBadgeName = {
  display: "block",
  color: "#fff",
  fontSize: "18px",
  fontWeight: "500",
  marginBottom: "2px",
};

const userBadgeRole = {
  display: "block",
  color: "rgba(255,255,255,0.5)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const navContainer = (shadow) => ({
  flex: 1,
  overflowY: "auto",
  paddingRight: "4px",
  transition: "box-shadow 0.3s",
  boxShadow: shadow ? "inset 0 8px 10px -8px rgba(0,0,0,0.3)" : "none",
});

const navStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const navItemStyle = (isActive) => ({
  padding: "11px 16px",
  borderRadius: "12px",
  textDecoration: "none",
  color: isActive ? "#fff" : "#fff",
  fontWeight: "600",
  fontSize: "16px",
  fontFamily: "'Inter', 'Tahoma', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
  backgroundColor: isActive ? "rgba(0, 200, 255, 0.63)" : "transparent",
  border: isActive ? "1px solid rgba(0,198,255,0.3)" : "1px solid transparent",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  position: "relative",
  transition: "all 0.2s",
  cursor: "pointer",
});

const navIconStyle = {
  fontSize: "18px",
  width: "24px",
};

const activeIndicatorStyle = {
  position: "absolute",
  left: 0,
  top: "50%",
  transform: "translateY(-50%)",
  width: "3px",
  height: "20px",
  background: "linear-gradient(180deg, #00c6ff, #007bff)",
  borderRadius: "0 3px 3px 0",
};

const sidebarFooterStyle = {
  marginTop: "20px",
};

const sidebarFooterDivider = {
  height: "3px",
  background: "rgba(255, 255, 255, 0.9)",
  margin: "19px 0",
};

const sidebarLogoutButton = {
  width: "70%",
  padding: "8px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgb(229, 26, 26)",
  color: "rgba(255, 255, 255, 0.96)",
  fontSize: "14px",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "all 0.2s",
};

const logoutIconStyle = {
  fontSize: "16px",
};

// FIXED: Main content style - NO MARGINS ON MOBILE
const mainContentStyle = (isMobile, menuOpen) => ({
  marginLeft: isMobile ? 0 : "280px",
  padding: isMobile ? 0 : "24px", // No padding on mobile
  position: "relative",
  zIndex: 1,
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  transition: "margin-left 0.3s ease",
  width: isMobile ? "100%" : `calc(100% - 280px)`,
});

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "rgba(69, 63, 63, 0.36)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  padding: "12px 20px",
  marginBottom: "24px",
  border: "1px solid rgba(27, 25, 25, 0.83)",
  position: "relative",
  zIndex: 30,
  flexShrink: 0,
  // Mobile header fixes
  marginLeft: 0,
  marginRight: 0,
  width: "auto",
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

// FIXED: Hamburger style - now visible on mobile
const hamburgerStyle = {
  display: "none", // Hidden by default
  background: "rgba(145, 137, 137, 0.35)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "10px",
  width: "40px",
  height: "40px",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
  // This media query makes it visible on mobile
  "@media (max-width: 900px)": {
    display: "flex",
  },
};

const hamburgerIconStyle = {
  color: "#ffffff",
  fontSize: "30px",
};

const pageTitleStyle = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  "@media (max-width: 900px)": {
    fontSize: "16px",
  },
};

const headerRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  position: "relative",
  zIndex: 31,
  "@media (max-width: 900px)": {
    gap: "10px",
  },
};

const notificationWrapperStyle = {
  position: "relative",
  zIndex: 999999,
  isolation: "isolate",
};

const userMenuContainerStyle = {
  position: "relative",
  zIndex: 100,
};

const userMenuTriggerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "6px 12px",
  borderRadius: "40px",
  background: "rgba(255, 255, 255, 0.22)",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  position: "relative",
  zIndex: 101,
  "@media (max-width: 900px)": {
    padding: "4px 8px",
    gap: "4px",
  },
};

const headerAvatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "36px",
  objectFit: "cover",
  border: "2px solid #00c6ff",
  "@media (max-width: 900px)": {
    width: "32px",
    height: "32px",
  },
};

const headerAvatarFallbackStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "36px",
  background: "linear-gradient(135deg, #00c6ff, #007bff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  fontWeight: "600",
  color: "#fff",
  "@media (max-width: 900px)": {
    width: "32px",
    height: "32px",
    fontSize: "14px",
  },
};

const userNameStyle = {
  color: "#00b2f8",
  fontSize: "14px",
  fontWeight: "800",
  "@media (max-width: 900px)": {
    display: "none", // Hide username on mobile to save space
  },
};

const dropdownArrowStyle = {
  color: "rgba(255, 255, 255, 0.16)",
  fontSize: "10px",
  "@media (max-width: 900px)": {
    display: "none", // Hide arrow on mobile
  },
};

const userDropdownStyle = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: "240px",
  background: "#1a658d",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
  zIndex: 102,
  overflow: "hidden",
  "@media (max-width: 900px)": {
    width: "200px",
    right: "-10px",
  },
};

const userDropdownHeader = {
  padding: "12px 16px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.72)",
};

const userDropdownEmail = {
  display: "block",
  color: "rgba(255, 255, 255, 0.93)",
  fontSize: "12px",
  marginTop: "4px",
};

const userDropdownDivider = {
  height: "1px",
  background: "rgba(255,255,255,0.1)",
};

const userDropdownLogout = {
  width: "100%",
  padding: "12px 16px",
  background: "transparent",
  border: "none",
  color: "#ed1717",
  fontSize: "14px",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "all 0.2s",
};

const dropdownLogoutIcon = {
  fontSize: "16px",
};

// FIXED: Content style - minimal padding, full width
const contentStyle = {
  height: "calc(100vh - 80px)", // Full height minus header
  overflowY: "auto",
  overflowX: "hidden",
  position: "relative",
  zIndex: 1,
  padding: 0, // No padding by default
  // Mobile specific overrides will be in the global styles
  "@media (max-width: 900px)": {
    padding: "12px", // Minimal padding for content on mobile
    height: "calc(100vh - 70px)", // Slightly adjust for mobile header
  },
};

export default Layout;