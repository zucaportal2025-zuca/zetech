import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import BASE_URL from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      
      if (storedUser && token) {
        try {
          // Fetch latest user data including profile image
          const response = await axios.get(`${BASE_URL}/api/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data;
          setUser(userData);
          
          const imageUrl = userData.profileImage?.startsWith("http")
            ? userData.profileImage
            : userData.profileImage 
              ? `${BASE_URL}/${userData.profileImage}`
              : null;
          setProfileImage(imageUrl);
          
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(userData));

          // Fetch real counts from API
          const [announcementsRes, messagesRes, eventsRes] = await Promise.all([
            axios.get(`${BASE_URL}/api/announcements/unread`, { 
              headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => ({ data: { count: 0 } })),
            axios.get(`${BASE_URL}/api/chat/unread`, { 
              headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => ({ data: { count: 0 } })),
            axios.get(`${BASE_URL}/api/events/upcoming`, { 
              headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => ({ data: { count: 0 } }))
          ]);

          setUnreadAnnouncements(announcementsRes.data.count || 0);
          setUnreadMessages(messagesRes.data.count || 0);
          setUpcomingEvents(eventsRes.data.count || 0);

        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(storedUser);
        }
      }
      setLoading(false);
    };

    fetchUserData();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Set greeting based on time
   
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("👋Good Morning")     
          else if (hour < 16) setGreeting("👋Good Afternoon");
    else setGreeting("👋Good Evening");


    return () => clearInterval(timer);
    
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("profile", file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/users/${user.id}/upload-profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      const updatedUser = response.data.user;
      setUser(updatedUser);
      const imageUrl = updatedUser.profileImage?.startsWith("http")
        ? updatedUser.profileImage
        : `${BASE_URL}/${updatedUser.profileImage}`;
      setProfileImage(imageUrl);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Profile upload failed:", error);
    }
  };

  const handleRemovePhoto = () => {
    if (!user) return;
    setProfileImage(null);
    const updatedUser = { ...user, profileImage: null };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={loadingSpinner} />
        <p style={loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={errorContainer}>
        <div style={errorCard}>
          <span style={errorIcon}>🔐</span>
          <h2 style={errorTitle}>Session Expired</h2>
          <p style={errorText}>Please log in to continue</p>
          <button onClick={() => navigate("/login")} style={errorButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    { 
      title: "Announcements", 
      description: "View latest updates", 
      path: "/announcements",
      icon: "📢",
      badge: unreadAnnouncements > 0 ? `${unreadAnnouncements} new` : null,
      color: "#4361ee"
    },
    { 
      title: "Mass Programs", 
      description: upcomingEvents > 0 ? `${upcomingEvents} upcoming` : "Schedule & events", 
      path: "/mass-programs",
      icon: "⛪",
      badge: null,
      color: "#7209b7"
    },
    { 
      title: "Contributions", 
      description: "Track your pledges", 
      path: "/contributions",
      icon: "📊",
      badge: null,
      color: "#f72585"
    },
    { 
      title: "Community Chat", 
      description: "Connect with members", 
      path: "/chat",
      icon: "💬",
      badge: unreadMessages > 0 ? `${unreadMessages} unread` : null,
      color: "#4cc9f0"
    },
    { 
      title: "Jumuia Groups", 
      description: user.jumuia?.name || "Join a community", 
      path: "/join-jumuia",
      icon: "👥",
      badge: user.jumuia ? "Active" : "Join now",
      color: "#f8961e"
    },
    { 
      title: "Prayer Requests", 
      description: "Share your intentions", 
      path: "/prayer-requests",
      icon: "🙏",
      badge: null,
      color: "#2a9d8f"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={container}
    >
      {/* Header with Gradient */}
      <div style={headerGradient}>
        <div style={headerContent}>
          <div style={headerLeft}>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={greetingStyle}
            >
              {greeting}, <span style={userNameStyle}>{user.fullName?.split(" ")[0]}</span>
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={dateStyle}
            >
              {formatDate(currentTime)}
            </motion.p>
          </div>
          <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleLogout} 
            style={logoutButton}
          >
            <span style={logoutIcon}>🚪➡️</span> Sign out
          </motion.button>
        </div>
      </div>

      {/* Profile Card - Bright & Modern */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={profileCard}
      >
        <div style={profileContent}>
          <div style={avatarSection}>
            <div style={avatarWrapper}>
              {profileImage ? (
                <img src={profileImage} alt={user.fullName} style={avatar} />
              ) : (
                <div style={avatarPlaceholder}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={avatarActions}>
              <label style={uploadButton}>
                <span style={buttonIcon}>👤➕</span> Change
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
              {profileImage && (
                <button onClick={handleRemovePhoto} style={removeButton}>
                  <span style={buttonIcon}>🗑️</span> Remove
                </button>
              )}
            </div>
          </div>

          <div style={infoSection}>
            <div style={infoHeader}>
              <h2 style={fullNameStyle}>{user.fullName}</h2>
              <span style={memberBadge}>
                {user.membership_number || "ZUCA-001"}
              </span>
            </div>
            <p style={emailStyle}>{user.email}</p>
            <div style={badgeContainer}>
              <span style={roleBadge}>
                {user.role?.toUpperCase() || "MEMBER"}
              </span>
              {user.jumuia && (
                <span style={jumuiaBadge}>
                  👥 {user.jumuia.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div style={statsRow}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={statCard}
        >
          <span style={statIcon}>📢</span>
          <div style={statInfo}>
            <span style={statValue}>{unreadAnnouncements}</span>
            <span style={statLabel}>Unread Announcements</span>
          </div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={statCard}
        >
          <span style={statIcon}>⛪</span>
          <div style={statInfo}>
            <span style={statValue}>{upcomingEvents}</span>
            <span style={statLabel}>Upcoming Events</span>
          </div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={statCard}
        >
          <span style={statIcon}>💬</span>
          <div style={statInfo}>
            <span style={statValue}>{unreadMessages}</span>
            <span style={statLabel}>Unread Messages</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div style={sectionHeader}>
        <h2 style={sectionTitle}>Quick Actions</h2>
        <p style={sectionSubtitle}>Navigate to different sections of your dashboard</p>
      </div>

      <div style={grid}>
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            style={{
              ...actionCard,
              borderTop: `4px solid ${action.color}`,
            }}
            onMouseEnter={() => setActiveCard(index)}
            onMouseLeave={() => setActiveCard(null)}
            onClick={() => navigate(action.path)}
            whileHover={{ y: -4 }}
          >
            <div style={actionCardHeader}>
              <span style={{ ...actionIcon, backgroundColor: `${action.color}20`, color: action.color }}>
                {action.icon}
              </span>
              {action.badge && (
                <span style={actionBadge}>{action.badge}</span>
              )}
            </div>
            <h3 style={actionTitle}>{action.title}</h3>
            <p style={actionDescription}>{action.description}</p>
            <div style={actionFooter}>
              <span style={actionLink}>Open →</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={footer}>
        <p style={footerText}>ZUCA Portal • Member Dashboard • v2.0</p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          button {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          button:hover {
            transform: translateY(-1px);
            filter: brightness(1.1);
          }
        `}
      </style>
    </motion.div>
  );
}

// ==================== Bright Modern Styles ====================

const container = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #147ad400 0%, #764ba200 100%)",
  padding: "30px 24px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const loadingContainer = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1c76b2 0%, #151316 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "35px",
};

const loadingSpinner = {
  width: "48px",
  height: "48px",
  border: "4px solid rgba(255,255,255,0.3)",
  borderTop: "4px solid #ffffff",
  borderRadius: "50%",
  animation: "spin 7s linear infinite",
  marginBottom: "20px",
};

const loadingText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  opacity: 0.9,
};

const errorContainer = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const errorCard = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "48px",
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
};

const errorIcon = {
  fontSize: "48px",
  marginBottom: "20px",
  display: "block",
};

const errorTitle = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "8px",
};

const errorText = {
  color: "#666",
  fontSize: "14px",
  marginBottom: "24px",
};

const errorButton = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "14px 32px",
  fontSize: "15px",
  fontWeight: "500",
  cursor: "pointer",
  width: "100%",
};

const headerGradient = {
  background: "rgba(16, 44, 63, 0.61)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "20px 24px",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.2)",
};

const headerContent = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "25px",
};

const headerLeft = {
  flex: 1,
};

const greetingStyle = {
  color: "#ffffff",
  fontSize: "38px",
  fontWeight: "800",
  marginBottom: "7px",
  textShadow: "0 7px 4px rgba(0,0,0,0.1)",
};

const userNameStyle = {
  color: "#ffffffcb",
  fontWeight: "700",
  textDecoration: "underline",
  textDecorationColor: "rgba(255,255,255,0.3)",
};

const dateStyle = {
  color: "rgba(255,255,255,0.9)",
  fontSize: "14px",
  fontWeight: "400",
};

const logoutButton = {
  background: "rgb(255, 0, 0)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "12px",
  padding: "10px 20px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "900",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backdropFilter: "blur(5px)",
};

const logoutIcon = {
  fontSize: "16px",
};

const profileCard = {
  background: "#ffffffcd",
  borderRadius: "24px",
  padding: "30px",
  marginBottom: "39px",
  boxShadow: "0 10px 30px rgb(28, 158, 213)",
};

const profileContent = {
  display: "flex",
  gap: "32px",
  flexWrap: "wrap",
  alignItems: "center",
};

const avatarSection = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
};

const avatarWrapper = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  border: "4px solid #15ff00",
};

const avatar = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarPlaceholder = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "48px",
  fontWeight: "600",
  color: "#ffffff",
};

const avatarActions = {
  display: "flex",
  gap: "8px",
};

const uploadButton = {
  background: "#f0f0f0",
  border: "none",
  borderRadius: "30px",
  padding: "8px 16px",
  color: "#333",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const removeButton = {
  background: "#fee2e2",
  border: "none",
  borderRadius: "30px",
  padding: "8px 16px",
  color: "#ff0000",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const buttonIcon = {
  fontSize: "14px",
};

const infoSection = {
  flex: 1,
};

const infoHeader = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "8px",
};

const fullNameStyle = {
  color: "#3f3e5f",
  fontSize: "30px",
  fontWeight: "800",
};

const memberBadge = {
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  borderRadius: "30px",
  padding: "6px 16px",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "0.3px",
};

const emailStyle = {
  color: "#000000",
  fontSize: "15px",
  marginBottom: "12px",
  fontWeight: "700",
};

const badgeContainer = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const roleBadge = {
  background: "#e9ecef",
  borderRadius: "20px",
  padding: "4px 12px",
  color: "#495057",
  fontSize: "12px",
  fontWeight: "700",
};

const jumuiaBadge = {
  background: "#e3f2fd",
  borderRadius: "20px",
  padding: "4px 12px",
  color: "#1976d2",
  fontSize: "12px",
  fontWeight: "800",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "40px",
};

const statCard = {
  background: "#ffffffb7",
  borderRadius: "20px",
  padding: "24px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
};

const statIcon = {
  fontSize: "25px",
  width: "40px",
  height: "40px",
  background: "#f8f9fa",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statInfo = {
  display: "flex",
  flexDirection: "column",
};

const statValue = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#333",
  lineHeight: "1.2",
};

const statLabel = {
  fontSize: "13px",
  color: "#ffffff",
   fontWeight: "700",
};

const sectionHeader = {
  marginBottom: "24px",
};

const sectionTitle = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "600",
  marginBottom: "4px",
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.9)",
};

const sectionSubtitle = {
  color: "rgba(255,255,255,0.9)",
  fontSize: "14px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  marginBottom: "40px",
};

const actionCard = {
  background: "#ffffffd0",
  borderRadius: "20px",
  padding: "24px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};

const actionCardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const actionIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  marginBottom: "12px",
};

const actionBadge = {
  background: "#ff4757",
  borderRadius: "20px",
  padding: "4px 10px",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "600",
};

const actionTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "6px",
};

const actionDescription = {
  color: "#6c757d",
  fontSize: "13px",
  marginBottom: "16px",
  lineHeight: "1.5",
};

const actionFooter = {
  display: "flex",
  justifyContent: "flex-end",
};

const actionLink = {
  color: "#667eea",
  fontSize: "13px",
  fontWeight: "500",
};

const footer = {
  textAlign: "center",
  padding: "20px",
};

const footerText = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "13px",
};

export default Dashboard;