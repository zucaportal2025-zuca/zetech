// frontend/src/components/Notifications.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiCheck, FiClock, FiEyeOff } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../api";
import io from "socket.io-client";

export default function Notifications({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const hasMarkedReadForCurrentPage = useRef(new Set());
  
  // Store dismissed notifications in localStorage (persists across refreshes)
  const [dismissedIds, setDismissedIds] = useState(() => {
    if (!userId) return new Set();
    const saved = localStorage.getItem(`dismissed_notifications_${userId}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save dismissed IDs to localStorage whenever they change
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(
      `dismissed_notifications_${userId}`, 
      JSON.stringify([...dismissedIds])
    );
  }, [dismissedIds, userId]);

  // Fetch notifications - FILTER OUT DISMISSED ONES
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out dismissed notifications
      const filtered = res.data.filter(n => !dismissedIds.has(n.id));
      setNotifications(filtered);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dismissedIds]);

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(BASE_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join', userId);
    });

    socketRef.current.on('new_notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Don't add if it was previously dismissed
      if (dismissedIds.has(notification.id)) {
        console.log('Notification was previously dismissed, ignoring');
        return;
      }
      
      setNotifications(prev => {
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        
        if (Notification.permission === "granted") {
          new Notification(notification.title || "New Notification", {
            body: notification.message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: notification.id
          });
        }
        
        return [notification, ...prev];
      });
    });

    socketRef.current.on('new_notification_batch', () => {
      fetchNotifications();
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, dismissedIds, fetchNotifications]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Auto-mark notifications as read when viewing their pages
  useEffect(() => {
    if (!userId || !location.pathname) return;

    const markNotificationsForCurrentPage = async () => {
      let pageType = null;
      let pagePath = location.pathname;

      if (pagePath.includes('/announcements')) {
        pageType = 'announcement';
      } else if (pagePath.includes('/mass-programs')) {
        pageType = 'program';
      } else if (pagePath.includes('/chat')) {
        pageType = 'message';
      } else if (pagePath.includes('/contributions')) {
        pageType = 'contribution';
      } else if (pagePath.includes('/jumuia-contributions')) {
        pageType = 'contribution';
      } else if (pagePath.includes('/gallery')) {
        pageType = 'new_media';
      } else if (pagePath.includes('/dashboard')) {
        return;
      }

      if (!pageType) return;

      const pageKey = `${pageType}-${pagePath}`;
      
      if (hasMarkedReadForCurrentPage.current.has(pageKey)) return;

      const unreadForThisPage = notifications.filter(
        n => !n.read && n.type === pageType
      );

      if (unreadForThisPage.length === 0) return;

      console.log(`Auto-marking ${unreadForThisPage.length} ${pageType} notifications as read`);

      try {
        const token = localStorage.getItem("token");
        
        await axios.put(
          `${BASE_URL}/api/notifications/mark-by-type/${userId}`,
          { type: pageType },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setNotifications(prev =>
          prev.map(n => 
            n.type === pageType ? { ...n, read: true } : n
          )
        );

        hasMarkedReadForCurrentPage.current.add(pageKey);
        
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    };

    const timer = setTimeout(() => {
      markNotificationsForCurrentPage();
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, userId, notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
    } catch (err) {
      console.error("Error marking as read:", err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/api/notifications/${userId}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
    } catch (err) {
      console.error("Error marking all as read:", err);
      fetchNotifications();
    }
  };

  // Dismiss all notifications PERMANENTLY (stored in localStorage)
  const dismissAllFromDropdown = () => {
    const newDismissed = new Set(dismissedIds);
    notifications.forEach(n => newDismissed.add(n.id));
    setDismissedIds(newDismissed);
    
    setNotifications([]);
    setShowDropdown(false);
    console.log("All notifications permanently dismissed");
  };

  // Dismiss single notification PERMANENTLY
  const dismissNotification = (notificationId) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(notificationId);
    setDismissedIds(newDismissed);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    
    let path = '/dashboard';
    switch(notif.type) {
      case 'announcement':
        path = '/announcements';
        break;
      case 'program':
        path = '/mass-programs';
        break;
      case 'message':
        path = '/chat';
        break;
      case 'contribution':
        path = '/contributions';
        break;
      case 'new_media':
        path = '/gallery';
        break;
      case 'media_comment':
        if (notif.data?.mediaId) {
          path = `/gallery?media=${notif.data.mediaId}`;
        } else {
          path = '/gallery';
        }
        break;
      case 'media_like':
        path = '/gallery';
        break;
    }
    
    navigate(path);
    setShowDropdown(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'announcement': return '📢';
      case 'message': return '💬';
      case 'program': return '⛪';
      case 'event': return '📅';
      case 'contribution': return '💰';
      case 'new_media': return '📸';
      case 'media_comment': return '💬';
      case 'media_like': return '❤️';
      default: return '🔔';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div style={styles.container} ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        style={styles.bellButton}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={styles.badge}
          >
            {unreadCount}
          </motion.span>
        )}
        {isLoading && unreadCount === 0 && (
          <span style={styles.loadingDot} />
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={styles.dropdown}
          >
            <div style={styles.dropdownHeader}>
              <h3 style={styles.dropdownTitle}>
                Notifications
                {unreadCount > 0 && (
                  <span style={styles.unreadCountBadge}>{unreadCount} new</span>
                )}
              </h3>
              <div style={styles.headerActions}>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={styles.markAllButton} title="Mark all as read">
                    <FiCheck size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={dismissAllFromDropdown} style={styles.dismissAllButton} title="Dismiss all from view">
                    <FiEyeOff size={14} />
                  </button>
                )}
              </div>
            </div>

            <div style={styles.notificationList}>
              {/* Unread Section */}
              {unreadNotifications.length > 0 && (
                <>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionTitle}>NEW</span>
                  </div>
                  {unreadNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      style={styles.notificationItemWrapper}
                    >
                      <div 
                        style={styles.unreadNotificationItem}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div style={styles.notificationIcon}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div style={styles.notificationContent}>
                          <div style={styles.notificationTitle}>{notif.title}</div>
                          <div style={styles.notificationMessage}>{notif.message}</div>
                          <div style={styles.notificationTime}>
                            <FiClock size={10} />
                            {formatTime(notif.createdAt)}
                          </div>
                        </div>
                        <div style={styles.unreadDot} />
                      </div>
                      <button 
                        style={styles.dismissButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notif.id);
                        }}
                        title="Dismiss permanently"
                      >
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  ))}
                </>
              )}

              {/* Read Section */}
              {readNotifications.length > 0 && (
                <>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionTitle}>EARLIER</span>
                  </div>
                  {readNotifications.slice(0, 5).map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={styles.notificationItemWrapper}
                    >
                      <div 
                        style={styles.readNotificationItem}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div style={styles.notificationIcon}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div style={styles.notificationContent}>
                          <div style={styles.notificationTitle}>{notif.title}</div>
                          <div style={styles.notificationMessage}>{notif.message}</div>
                          <div style={styles.notificationTime}>
                            <FiClock size={10} />
                            {formatTime(notif.createdAt)}
                          </div>
                        </div>
                      </div>
                      <button 
                        style={styles.dismissButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notif.id);
                        }}
                        title="Dismiss permanently"
                      >
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  ))}
                  {readNotifications.length > 5 && (
                    <div style={styles.viewAllContainer}>
                      <button style={styles.viewAllButton}>
                        View all read notifications
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {notifications.length === 0 && (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>🔔</span>
                  <p style={styles.emptyText}>No notifications</p>
                </div>
              )}
            </div>

            <div style={styles.dropdownFooter}>
              <button onClick={() => setShowDropdown(false)} style={styles.closeButton}>
                <FiX size={14} /> Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 999999,
  },
  
  bellButton: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    minWidth: "44px",
    minHeight: "44px",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  
  badge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "#ef4444",
    color: "white",
    fontSize: "11px",
    fontWeight: "bold",
    minWidth: "20px",
    height: "20px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #1e293b",
    zIndex: 1000000,
  },
  
  loadingDot: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#4f46e5",
    border: "2px solid #1e293b",
    animation: "pulse 1.5s infinite",
    zIndex: 1000000,
  },
  
  dropdown: {
    position: "fixed",
    top: "70px",
    right: "20px",
    width: "380px",
    maxWidth: "calc(100vw - 40px)",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 20px 35px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
    zIndex: 9999999,
    overflow: "hidden",
    "@media (max-width: 480px)": {
      right: "10px",
      left: "10px",
      width: "calc(100vw - 20px)",
      maxWidth: "calc(100vw - 20px)",
      top: "60px",
    },
  },
  
  dropdownHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    flexWrap: "wrap",
    gap: "10px",
  },
  
  dropdownTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  
  unreadCountBadge: {
    background: "#4f46e5",
    color: "white",
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 8px",
    borderRadius: "12px",
  },
  
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  
  markAllButton: {
    background: "#eef2ff",
    border: "none",
    color: "#4f46e5",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s",
    minWidth: "36px",
    minHeight: "36px",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  
  dismissAllButton: {
    background: "#f1f5f9",
    border: "none",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s",
    minWidth: "36px",
    minHeight: "36px",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  
  notificationItemWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  
  dismissButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ":hover": {
      background: "#fee2e2",
      color: "#ef4444",
    },
  },
  
  notificationList: {
    maxHeight: "min(450px, 70vh)",
    overflowY: "auto",
    background: "#ffffff",
    WebkitOverflowScrolling: "touch",
  },
  
  sectionHeader: {
    padding: "8px 20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderTop: "1px solid #e2e8f0",
  },
  
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  unreadNotificationItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    paddingRight: "48px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
    position: "relative",
    background: "#f0f9ff",
    borderLeft: "4px solid #4f46e5",
    minHeight: "70px",
    width: "100%",
  },
  
  readNotificationItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    paddingRight: "48px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
    position: "relative",
    background: "#ffffff",
    opacity: 0.8,
    width: "100%",
  },
  
  notificationIcon: {
    fontSize: "24px",
    minWidth: "32px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  
  notificationContent: {
    flex: 1,
  },
  
  notificationTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px",
    lineHeight: 1.3,
  },
  
  notificationMessage: {
    fontSize: "14px",
    color: "#475569",
    marginBottom: "8px",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  
  notificationTime: {
    fontSize: "12px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  
  unreadDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4f46e5",
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 1000,
  },
  
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    background: "#ffffff",
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  
  emptyText: {
    fontSize: "16px",
    color: "#94a3b8",
  },
  
  viewAllContainer: {
    padding: "12px 20px",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
  },
  
  viewAllButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px",
  },
  
  dropdownFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #e2e8f0",
    textAlign: "center",
    background: "#ffffff",
  },
  
  closeButton: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "30px",
    padding: "12px 24px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
    width: "100%",
    minHeight: "48px",
    fontWeight: "500",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
};

// Add global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  .notifications-dropdown {
    z-index: 9999999 !important;
  }
  
  @media (max-width: 480px) {
    .notification-item {
      padding: 16px !important;
    }
    .notification-title {
      font-size: 15px !important;
    }
    .notification-message {
      font-size: 14px !important;
    }
  }
  
  button, div[role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
  
  .notifications-list {
    -webkit-overflow-scrolling: touch;
  }

  .mark-all-button:hover {
    background: #dbeafe !important;
  }
  
  .dismiss-all-button:hover {
    background: #e2e8f0 !important;
    color: #475569 !important;
  }
  
  .dismiss-button:hover {
    background: #fee2e2 !important;
    color: #ef4444 !important;
  }
`;
document.head.appendChild(style);