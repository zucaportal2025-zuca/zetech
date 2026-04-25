// frontend/src/pages/admin/ChatMonitorPage.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "../../api";
import backgroundImg from "../../assets/background.png";

function ChatMonitorPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeUsers: 0,
    messagesToday: 0,
    topUsers: []
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [activeTab, setActiveTab] = useState("all");
  
  // WhatsApp-style long press
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  
  // Scroll preservation states
  const [userInteracted, setUserInteracted] = useState(false);
  const chatContainerRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);
  
  // Chat input states
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showMediaPreview, setShowMediaPreview] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [user, setUser] = useState(null);

  // Common emojis for reactions
  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

  // Check authentication and get user
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, [token, navigate]);

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Helper function to parse attachments safely
  const parseAttachments = (attachments) => {
    if (!attachments) return [];
    try {
      if (Array.isArray(attachments)) {
        return attachments;
      }
      if (typeof attachments === 'string') {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      if (typeof attachments === 'object') {
        return [attachments];
      }
      return [];
    } catch (e) {
      console.error("Error parsing attachments:", e);
      return [];
    }
  };

  // WhatsApp-style long press handlers
  const handleTouchStart = (e, msg) => {
    e.preventDefault();
    const touch = e.touches[0];
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
    
    const timer = setTimeout(() => {
      setSelectedMessage(msg);
      setShowMessageActions(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
    
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e) => {
    if (longPressTimer) {
      const touch = e.touches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchPosition.x, 2) + 
        Math.pow(touch.clientY - touchPosition.y, 2)
      );
      if (distance > 10) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle right click (desktop)
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setSelectedMessage(msg);
    setShowMessageActions(true);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Fetch messages with WhatsApp-style scroll behavior
  const fetchMessages = async (isInitialLoad = false) => {
    try {
      const container = chatContainerRef.current;
      
      if (container && !isInitialLoad) {
        lastScrollPositionRef.current = container.scrollTop;
      }
      
      const response = await axios.get(`${BASE_URL}/api/chat/enhanced`, { headers });
      
      const parsedMessages = response.data
      .map(msg => ({
        ...msg,
        attachments: parseAttachments(msg.attachments),
        files: msg.files || []
      }))
      .reverse(); 
      
      setMessages(parsedMessages);
      calculateStats(parsedMessages);
      
      setTimeout(() => {
        if (container) {
          if (isInitialLoad) {
            container.scrollTop = container.scrollHeight;
          } else {
            const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (wasNearBottom) {
              container.scrollTop = container.scrollHeight;
            } else {
              container.scrollTop = lastScrollPositionRef.current;
            }
          }
        }
      }, 100);
      
    } catch (err) {
      console.error("Error fetching messages:", err);
      showNotification("Failed to fetch messages", "error");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        hasInitialLoadRef.current = true;
      }
    }
  };

  // Detect user scroll to prevent auto-scroll interference
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScrollStart = () => {
      isUserScrollingRef.current = true;
    };

    const handleScrollEnd = () => {
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener('scroll', handleScrollStart);
    container.addEventListener('scrollend', handleScrollEnd);

    return () => {
      container.removeEventListener('scroll', handleScrollStart);
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, []);

  // Fetch pinned messages
  const fetchPinnedMessages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/pinned`, { headers });
      const parsedPins = response.data.map(pin => ({
        ...pin,
        message: {
          ...pin.message,
          attachments: parseAttachments(pin.message?.attachments)
        }
      }));
      setPinnedMessages(parsedPins);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
    }
  };

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/online`, { headers });
      setOnlineUsers(response.data);
    } catch (err) {
      console.error("Error fetching online users:", err);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/stats`, { headers });
      setStats(prev => ({ ...prev, ...response.data }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchMessages(true);
      fetchPinnedMessages();
      fetchOnlineUsers();
      fetchStats();
    };
    
    loadInitialData();

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        if (hasInitialLoadRef.current) {
          fetchMessages(false);
          fetchOnlineUsers();
        }
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Calculate stats from messages
  const calculateStats = (messageData) => {
    const today = new Date().toDateString();
    const todayMessages = messageData.filter(m => 
      new Date(m.createdAt).toDateString() === today
    ).length;

    const userCount = {};
    messageData.forEach(m => {
      const userId = m.user?.id || 'unknown';
      userCount[userId] = (userCount[userId] || 0) + 1;
    });

    const topUsers = Object.entries(userCount)
      .map(([userId, count]) => ({
        userId,
        name: messageData.find(m => m.user?.id === userId)?.user?.fullName || 'Unknown',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalMessages: messageData.length,
      activeUsers: new Set(messageData.map(m => m.user?.id)).size,
      messagesToday: todayMessages,
      topUsers
    });
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload file
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("files", file);
    
    const uploadId = Date.now().toString();
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

    try {
      const response = await axios.post(`${BASE_URL}/api/chat/upload`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [uploadId]: percentCompleted }));
        },
      });

      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });

      return response.data[0];
    } catch (error) {
      console.error("Upload failed:", error);
      showNotification("Failed to upload file", "error");
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
      return null;
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return;

    setSending(true);

    try {
      const attachments = [];
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const uploaded = await uploadFile(selectedFiles[i]);
          if (uploaded) {
            attachments.push(uploaded);
          }
        }
      }

      const payload = {
        content: newMessage.trim(),
        replyToId: replyTo?.id,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      if (announcementMode) {
        payload.isAnnouncement = true;
      }

      const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, payload, { headers });
      
      const newMsg = {
        ...response.data,
        attachments: parseAttachments(response.data.attachments),
        files: response.data.files || []
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage("");
      setReplyTo(null);
      setSelectedFiles([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUserInteracted(false);
      
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
      showNotification("Message sent", "success");
    } catch (error) {
      console.error("Failed to send message:", error);
      showNotification(error.response?.data?.error || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${BASE_URL}/api/chat/${messageId}`, { headers });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setShowMessageActions(false);
      setSelectedMessage(null);
      setShowDeleteModal(false);
      setMessageToDelete(null);
      showNotification("Message deleted successfully");
    } catch (err) {
      console.error("Error deleting message:", err);
      showNotification("Failed to delete message", "error");
    }
  };

  // Pin/Unpin message
  const handlePinMessage = async (messageId) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/${messageId}/pin`, {}, { headers });
      
      if (response.data.message === "Message unpinned") {
        setPinnedMessages(prev => prev.filter(p => p.messageId !== messageId));
        showNotification("Message unpinned");
      } else {
        fetchPinnedMessages();
        showNotification("Message pinned");
      }
      setShowMessageActions(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error pinning message:", err);
      showNotification("Failed to pin message", "error");
    }
  };

  // Add reaction
  const handleAddReaction = async (messageId, reaction) => {
    try {
      await axios.post(`${BASE_URL}/api/chat/${messageId}/reactions`, { reaction }, { headers });
      fetchMessages(false);
      setShowMessageActions(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  // Reply to message
  const handleReply = (message) => {
    setReplyTo(message);
    setShowMessageActions(false);
    setSelectedMessage(null);
    setTimeout(() => {
      const input = document.querySelector('textarea');
      if (input) input.focus();
    }, 100);
  };

  // Copy message
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    showNotification("Copied to clipboard", "success");
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  // Mute user
  const handleMuteUser = (userId) => {
    setMutedUsers(prev => [...prev, userId]);
    setShowMessageActions(false);
    setSelectedMessage(null);
    showNotification("User muted", "success");
  };

  // Unmute user
  const handleUnmuteUser = (userId) => {
    setMutedUsers(prev => prev.filter(id => id !== userId));
    showNotification("User unmuted", "success");
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    try {
      await Promise.all(
        selectedMessages.map(id => 
          axios.delete(`${BASE_URL}/api/chat/${id}`, { headers })
        )
      );
      setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
      setSelectedMessages([]);
      setSelectAll(false);
      showNotification(`${selectedMessages.length} messages deleted`);
    } catch (err) {
      console.error("Error bulk deleting messages:", err);
      showNotification("Failed to delete messages", "error");
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(m => m.id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle select message
  const toggleSelectMessage = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Export messages
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/chat/search?from=${dateRange.start}&to=${dateRange.end}`,
        { headers }
      );

      const data = response.data;
      const csv = [
        ["Date", "User", "Message", "Reactions", "Replies", "Status"],
        ...data.map(m => [
          new Date(m.createdAt).toLocaleString(),
          m.user?.fullName || "Unknown",
          m.content,
          m.reactions?.length || 0,
          m.replyCount || 0,
          m.isDeleted ? "Deleted" : m.isEdited ? "Edited" : "Active"
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-export-${dateRange.start}-to-${dateRange.end}.csv`;
      a.click();

      showNotification("Export completed");
    } catch (err) {
      console.error("Error exporting messages:", err);
      showNotification("Export failed", "error");
    } finally {
      setExportLoading(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser === "all" || msg.user?.id === filterUser;
    const notMuted = !mutedUsers.includes(msg.user?.id);
    return matchesSearch && matchesUser && notMuted;
  });

  // Get file preview URL
  const getFilePreview = (file) => {
    if (file.type?.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  if (loading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner} />
        <p style={loadingStyles.text}>Loading admin chat console...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            style={{
              ...styles.notification,
              ...(notification.type === "success" ? styles.notificationSuccess : styles.notificationError),
            }}
          >
            {notification.type === "success" ? "✅" : "⚠️"} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp-style Message Actions Modal */}
      <AnimatePresence>
        {showMessageActions && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={actionModalStyles.overlay}
            onClick={() => {
              setShowMessageActions(false);
              setSelectedMessage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              style={actionModalStyles.modal}
              onClick={e => e.stopPropagation()}
            >
              <div style={actionModalStyles.header}>
                <div style={actionModalStyles.avatar}>
                  {selectedMessage.user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div style={actionModalStyles.userInfo}>
                  <span style={actionModalStyles.userName}>{selectedMessage.user?.fullName}</span>
                  <span style={actionModalStyles.time}>{formatTime(selectedMessage.createdAt)}</span>
                </div>
              </div>
              
              <div style={actionModalStyles.preview}>
                {selectedMessage.content || (selectedMessage.files?.length > 0 ? '📎 Attachment' : '')}
              </div>

              <div style={actionModalStyles.grid}>
                {commonReactions.map(emoji => (
                  <button
                    key={emoji}
                    style={actionModalStyles.emoji}
                    onClick={() => handleAddReaction(selectedMessage.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div style={actionModalStyles.divider} />

              <div style={actionModalStyles.list}>
                <button style={actionModalStyles.item} onClick={() => handleReply(selectedMessage)}>
                  <span style={actionModalStyles.icon}>↩️</span>
                  <span>Reply</span>
                </button>

                {selectedMessage.content && (
                  <button style={actionModalStyles.item} onClick={() => handleCopy(selectedMessage.content)}>
                    <span style={actionModalStyles.icon}>📋</span>
                    <span>Copy</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button style={actionModalStyles.item} onClick={() => handlePinMessage(selectedMessage.id)}>
                    <span style={actionModalStyles.icon}>
                      {pinnedMessages.some(p => p.messageId === selectedMessage.id) ? '📌' : '📍'}
                    </span>
                    <span>
                      {pinnedMessages.some(p => p.messageId === selectedMessage.id) ? 'Unpin' : 'Pin'}
                    </span>
                  </button>
                )}

                <button 
                  style={{...actionModalStyles.item, color: '#ff4d6d'}} 
                  onClick={() => {
                    setShowDeleteModal(true);
                    setMessageToDelete(selectedMessage);
                    setShowMessageActions(false);
                  }}
                >
                  <span style={actionModalStyles.icon}>🗑️</span>
                  <span>Delete</span>
                </button>

                {selectedMessage.user?.id !== user?.id && (
                  <button 
                    style={actionModalStyles.item} 
                    onClick={() => mutedUsers.includes(selectedMessage.user?.id) 
                      ? handleUnmuteUser(selectedMessage.user?.id) 
                      : handleMuteUser(selectedMessage.user?.id)
                    }
                  >
                    <span style={actionModalStyles.icon}>
                      {mutedUsers.includes(selectedMessage.user?.id) ? '🔊' : '🔇'}
                    </span>
                    <span>
                      {mutedUsers.includes(selectedMessage.user?.id) ? 'Unmute' : 'Mute'}
                    </span>
                  </button>
                )}
              </div>

              <button 
                style={actionModalStyles.cancel} 
                onClick={() => {
                  setShowMessageActions(false);
                  setSelectedMessage(null);
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={styles.modal}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Delete Message</h3>
              <p style={styles.modalText}>
                Are you sure you want to delete this message?
                {messageToDelete && (
                  <span style={styles.modalPreview}>
                    "{messageToDelete.content?.substring(0, 100)}..."
                  </span>
                )}
              </p>
              <div style={styles.modalActions}>
                <button
                  style={styles.modalCancelBtn}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={styles.modalDeleteBtn}
                  onClick={() => handleDeleteMessage(messageToDelete.id)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
  {showMediaPreview && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.modalOverlay}
      onClick={() => setShowMediaPreview(null)}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        style={styles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        {/* Debug info */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: 0,
          color: '#fff',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.8)',
          padding: '8px',
          borderRadius: '4px',
          zIndex: 9999,
          whiteSpace: 'nowrap'
        }}>
          URL: {showMediaPreview}
        </div>

        <img 
          src={showMediaPreview}
          alt="preview" 
          style={styles.modalImage}
          onError={(e) => {
            console.log("1️⃣ IMAGE FAILED TO LOAD");
            console.log("2️⃣ Failed URL:", showMediaPreview);
            
            const token = localStorage.getItem('token');
            console.log("3️⃣ Token exists:", !!token);
            
            const baseUrl = showMediaPreview.split('?')[0];
            console.log("4️⃣ Base URL:", baseUrl);
            
            // Try fetch
            fetch(baseUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            .then(response => {
              console.log("5️⃣ Fetch response status:", response.status);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return response.blob();
            })
            .then(blob => {
              console.log("6️⃣ Blob received, size:", blob.size);
              const url = URL.createObjectURL(blob);
              console.log("7️⃣ Blob URL created:", url);
              e.target.src = url;
            })
            .catch(err => {
              console.error("8️⃣ Fetch failed:", err);
              e.target.alt = 'Failed to load';
            });
          }}
        />
        <button
          style={styles.modalClose}
          onClick={() => setShowMediaPreview(null)}
        >
          ×
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👑 Admin Chat Console</h1>
          <p style={styles.subtitle}>Full control over chat: monitor, moderate, and participate</p>
        </div>
        <div style={styles.headerControls}>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh ({refreshInterval/1000}s)
          </label>
          <button
            onClick={() => {
              fetchMessages(false);
              fetchOnlineUsers();
              fetchPinnedMessages();
            }}
            style={styles.refreshBtn}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>💬</span>
          <div>
            <span style={styles.statValue}>{stats.totalMessages}</span>
            <span style={styles.statLabel}>Total Messages</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>👥</span>
          <div>
            <span style={styles.statValue}>{onlineUsers.length}</span>
            <span style={styles.statLabel}>Online Now</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📌</span>
          <div>
            <span style={styles.statValue}>{pinnedMessages.length}</span>
            <span style={styles.statLabel}>Pinned</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>👤</span>
          <div>
            <span style={styles.statValue}>{stats.activeUsers}</span>
            <span style={styles.statLabel}>Active Users</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area - WhatsApp Style */}
      <div style={styles.whatsappContainer}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <div style={styles.chatHeaderLeft}>
            <h2 style={styles.chatTitle}>General Chat</h2>
            <span style={styles.onlineCount}>{onlineUsers.length} online</span>
          </div>
          <div style={styles.chatHeaderRight}>
            <input
              type="text"
              placeholder="Search messages..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              style={styles.filterSelect}
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="all">All Users</option>
              {onlineUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} {user.role === 'admin' ? '👑' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Area - WhatsApp Style */}
        <div 
          style={{
            ...styles.messagesArea,
            backgroundImage: `url(${backgroundImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }} 
          ref={chatContainerRef}
        >
          {filteredMessages.length === 0 ? (
            <div style={styles.noMessages}>
              <span style={styles.noMessagesIcon}>💬</span>
              <h3>No messages yet</h3>
              <p>Start a conversation</p>
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isOwn = msg.user?.id === user?.id;
              const isAdmin = msg.user?.role === "admin";
              const isPinned = pinnedMessages.some(p => p.messageId === msg.id);
              const attachments = msg.attachments || [];
              const files = msg.files || [];
              const showAvatar = index === 0 || filteredMessages[index - 1]?.user?.id !== msg.user?.id;

              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageWrapper,
                    ...(isOwn ? styles.messageWrapperOwn : {}),
                  }}
                  onTouchStart={(e) => handleTouchStart(e, msg)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                >
                  {!isOwn && showAvatar && (
                    <div style={styles.messageAvatar}>
                      {msg.user?.fullName?.charAt(0).toUpperCase()}
                      {isAdmin && <span style={styles.messageAdminBadge}>👑</span>}
                    </div>
                  )}

                  <div style={{
                    ...styles.messageContent,
                    ...(isOwn ? styles.messageContentOwn : {}),
                    ...(!showAvatar && !isOwn ? styles.messageContentNested : {}),
                  }}>
                    {!isOwn && showAvatar && (
                      <div style={styles.messageSender}>
                        <span style={styles.messageSenderName}>
                          {msg.user?.fullName}
                          {isAdmin && <span style={styles.adminIndicator}>Admin</span>}
                        </span>
                        <span style={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                      </div>
                    )}

                    {msg.replyTo && (
                      <div style={styles.messageReply}>
                        ↪️ {msg.replyTo.user?.fullName}: {msg.replyTo.content?.substring(0, 30)}...
                      </div>
                    )}

                    <div style={styles.messageBubble}>
                      {msg.content && (
                        <p style={styles.messageText}>{msg.content}</p>
                      )}

                      {/* Files from database - FIXED with token in URL */}
                      {files && files.length > 0 && (
                        <div style={styles.messageAttachments}>
                          {files.map((file) => {
                            const isImage = file.type?.startsWith('image/') || 
                                          file.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|jfif)$/i) ||
                                          false;
                            
                            const token = localStorage.getItem('token');
                            const fileUrl = `${BASE_URL}/api/chat/files/${file.id}?token=${token}`;
                            const debugUrl = `${BASE_URL}/api/chat/debug/public-file/${file.id}`;
                            
                            return isImage ? (
                              <div 
                                key={file.id} 
                                style={styles.imageAttachment}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMediaPreview(fileUrl);
                                }}
                              >
                                <img 
                                  src={fileUrl}
                                  alt={file.name} 
                                  style={styles.attachmentImage}
                                  onError={(e) => {
                                    console.error("Auth failed, trying debug:", fileUrl);
                                    e.target.src = debugUrl;
                                    e.target.onerror = (e2) => {
                                      console.error("Debug also failed:", debugUrl);
                                      e2.target.style.display = 'none';
                                      const parent = e2.target.parentNode;
                                      const fallback = document.createElement('div');
                                      fallback.innerHTML = '🖼️';
                                      fallback.style.fontSize = '40px';
                                      fallback.style.textAlign = 'center';
                                      fallback.style.padding = '20px';
                                      fallback.style.background = 'rgba(255,255,255,0.1)';
                                      fallback.style.borderRadius = '8px';
                                      parent.appendChild(fallback);
                                    };
                                  }}
                                />
                                {file.size && (
                                  <span style={styles.imageSizeBadge}>
                                    {(file.size / 1024).toFixed(0)}KB
                                  </span>
                                )}
                              </div>
                            ) : (
                              <a
                                key={file.id}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.fileAttachment}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span style={styles.fileIcon}>📎</span>
                                <span style={styles.fileName}>{file.name}</span>
                                <span style={styles.fileSize}>
                                  {(file.size / 1024).toFixed(0)}KB
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Legacy attachments */}
                      {attachments.length > 0 && (
                        <div style={styles.messageAttachments}>
                          {attachments.map((att, i) => {
                            const imageUrl = att.url || att;
                            const fullImageUrl = imageUrl.startsWith('http') 
                              ? imageUrl 
                              : `${BASE_URL}${imageUrl}`;
                            const isImage = att.type?.startsWith('image/') || 
                                           att.mimetype?.startsWith('image/') ||
                                           /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl);
                            
                            return isImage ? (
                              <div 
                                key={i} 
                                style={styles.imageAttachment}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMediaPreview(fullImageUrl);
                                }}
                              >
                                <img
                                  src={fullImageUrl}
                                  alt="attachment"
                                  style={styles.attachmentImage}
                                  onError={(e) => {
                                    console.error("Legacy image failed:", fullImageUrl);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <a
                                key={i}
                                href={fullImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.fileAttachment}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span style={styles.fileIcon}>📎</span>
                                <span style={styles.fileName}>{att.name || 'File'}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={styles.messageReactions}>
                          {msg.reactions.map((r, i) => (
                            <span key={i} style={styles.messageReaction}>
                              {r.reaction}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={styles.messageFooter}>
                        {isPinned && <span style={styles.pinnedIcon}>📌</span>}
                        {msg.isEdited && <span style={styles.editedIcon}>edited</span>}
                        
                        {/* Message Actions - Show on hover */}
                        <div style={styles.messageActions}>
                          <button
                            style={styles.messageAction}
                            onClick={() => setReplyTo(msg)}
                            title="Reply"
                          >
                            ↩️
                          </button>
                          <button
                            style={styles.messageAction}
                            onClick={() => handleAddReaction(msg.id, "👍")}
                            title="Like"
                          >
                            👍
                          </button>
                          <button
                            style={styles.messageAction}
                            onClick={() => handleAddReaction(msg.id, "❤️")}
                            title="Love"
                          >
                            ❤️
                          </button>
                          <button
                            style={{
                              ...styles.messageAction,
                              ...(isPinned && styles.messageActionActive)
                            }}
                            onClick={() => handlePinMessage(msg.id)}
                            title={isPinned ? "Unpin" : "Pin"}
                          >
                            📌
                          </button>
                          <button
                            style={{ ...styles.messageAction, color: "#ff4d6d" }}
                            onClick={() => {
                              setMessageToDelete(msg);
                              setShowDeleteModal(true);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview Area - WhatsApp Style */}
        {selectedFiles.length > 0 && (
          <div style={styles.filePreviewArea}>
            {selectedFiles.map((file, index) => {
              const preview = getFilePreview(file);
              return (
                <div key={index} style={styles.filePreview}>
                  {preview ? (
                    <img src={preview} alt="preview" style={styles.previewImage} />
                  ) : (
                    <div style={styles.previewIcon}>📎</div>
                  )}
                  <div style={styles.previewInfo}>
                    <span style={styles.previewName}>{file.name}</span>
                    <span style={styles.previewSize}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    style={styles.removeFileBtn}
                    onClick={() => removeFile(index)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Indicator - WhatsApp Style */}
        {replyTo && (
          <div style={styles.replyContainer}>
            <div style={styles.replyContent}>
              <span style={styles.replyLabel}>Replying to {replyTo.user?.fullName}</span>
              <span style={styles.replyText}>{replyTo.content?.substring(0, 50)}</span>
            </div>
            <button style={styles.cancelReply} onClick={() => setReplyTo(null)}>
              ×
            </button>
          </div>
        )}

        {/* Input Area - WhatsApp Style */}
        <div style={styles.inputContainer}>
          <button
            style={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>
          
          <button
            style={styles.emojiButton}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                style={styles.emojiPicker}
              >
                {["😊", "😂", "❤️", "👍", "🙏", "🎉", "🔥", "✨", "💯", "👏", "🥳", "😢"].map(emoji => (
                  <button
                    key={emoji}
                    style={styles.emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={styles.messageInput}
            rows="1"
          />

          <button
            onClick={handleSendMessage}
            disabled={sending || (newMessage.trim() === "" && selectedFiles.length === 0)}
            style={{
              ...styles.sendButton,
              ...((sending || (newMessage.trim() === "" && selectedFiles.length === 0)) && styles.sendButtonDisabled),
            }}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>

        {/* Upload Progress */}
        {Object.entries(uploadProgress).map(([id, progress]) => (
          <div key={id} style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            <span style={styles.progressText}>Uploading... {progress}%</span>
          </div>
        ))}
      </div>

      {/* ADMIN MONITORING SECTION - BELOW THE CHAT */}
      <div style={styles.adminSection}>
        <h2 style={styles.adminSectionTitle}>🛡️ Admin Monitoring Tools</h2>

        {/* Online Users Grid */}
        <div style={styles.adminGrid}>
          <div style={styles.adminCard}>
            <h3 style={styles.adminCardTitle}>🟢 Online Users ({onlineUsers.length})</h3>
            <div style={styles.onlineUsersGrid}>
              {onlineUsers.length === 0 ? (
                <p style={styles.noData}>No users online</p>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.id} style={styles.adminUserCard}>
                    <div style={styles.adminUserAvatar}>
                      {user.fullName?.charAt(0).toUpperCase()}
                      <span style={styles.onlineDot} />
                    </div>
                    <div style={styles.adminUserInfo}>
                      <span style={styles.adminUserName}>
                        {user.fullName}
                        {user.role === 'admin' && <span style={styles.adminStar}>👑</span>}
                      </span>
                      <span style={styles.adminUserTime}>
                        {formatTime(user.lastActive)}
                      </span>
                    </div>
                    <button
                      style={styles.muteBtn}
                      onClick={() => mutedUsers.includes(user.id) ? handleUnmuteUser(user.id) : handleMuteUser(user.id)}
                      title={mutedUsers.includes(user.id) ? "Unmute" : "Mute"}
                    >
                      {mutedUsers.includes(user.id) ? "🔊" : "🔇"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pinned Messages */}
          <div style={styles.adminCard}>
            <h3 style={styles.adminCardTitle}>📌 Pinned Messages ({pinnedMessages.length})</h3>
            <div style={styles.pinnedMessagesList}>
              {pinnedMessages.length === 0 ? (
                <p style={styles.noData}>No pinned messages</p>
              ) : (
                pinnedMessages.map(pin => (
                  <div key={pin.id} style={styles.adminPinnedItem}>
                    <div style={styles.adminPinnedHeader}>
                      <span style={styles.adminPinnedUser}>{pin.message?.user?.fullName}</span>
                      <span style={styles.adminPinnedTime}>{formatTime(pin.createdAt)}</span>
                    </div>
                    <p style={styles.adminPinnedContent}>
                      {pin.message?.content?.substring(0, 100)}...
                    </p>
                    {pin.message?.attachments?.length > 0 && (
                      <div style={styles.adminPinnedAttachments}>
                        📎 {pin.message.attachments.length} file(s)
                      </div>
                    )}
                    <button
                      style={styles.adminUnpinBtn}
                      onClick={() => handlePinMessage(pin.messageId)}
                    >
                      Unpin
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Users */}
          <div style={styles.adminCard}>
            <h3 style={styles.adminCardTitle}>🏆 Top Users</h3>
            <div style={styles.topUsersList}>
              {stats.topUsers.map((user, index) => (
                <div key={user.userId} style={styles.adminTopUser}>
                  <span style={styles.adminTopRank}>{index + 1}</span>
                  <span style={styles.adminTopName}>{user.name}</span>
                  <span style={styles.adminTopCount}>{user.count} msgs</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.adminCard}>
            <h3 style={styles.adminCardTitle}>📊 Quick Stats</h3>
            <div style={styles.adminStatsList}>
              <div style={styles.adminStatRow}>
                <span>Total Messages:</span>
                <strong>{stats.totalMessages}</strong>
              </div>
              <div style={styles.adminStatRow}>
                <span>Messages Today:</span>
                <strong>{stats.messagesToday}</strong>
              </div>
              <div style={styles.adminStatRow}>
                <span>Active Users:</span>
                <strong>{stats.activeUsers}</strong>
              </div>
              <div style={styles.adminStatRow}>
                <span>Muted Users:</span>
                <strong>{mutedUsers.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions & Export */}
        <div style={styles.bulkActionsSection}>
          <div style={styles.bulkActionsHeader}>
            <h3 style={styles.adminCardTitle}>⚡ Bulk Actions</h3>
            <div style={styles.bulkControls}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
                Select All ({selectedMessages.length})
              </label>
              {selectedMessages.length > 0 && (
                <button
                  style={styles.bulkDeleteBtn}
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedMessages.length})
                </button>
              )}
            </div>
          </div>

          <div style={styles.exportSection}>
            <h4 style={styles.exportTitle}>📅 Export Data</h4>
            <div style={styles.dateRangePicker}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={styles.dateInput}
              />
              <span style={styles.dateSeparator}>→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={styles.dateInput}
              />
              <button
                style={styles.exportBtn}
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? "Exporting..." : "📊 Export CSV"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          textarea {
            resize: none;
            font-family: 'Inter', sans-serif;
          }
          
          textarea:focus {
            outline: none;
          }
          
          .message-wrapper:hover .message-actions {
            opacity: 1 !important;
          }
          
          @media (max-width: 768px) {
            .admin-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </motion.div>
  );
}

// Action Modal Styles (Separate to avoid conflicts)
const actionModalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "400px",
    background: "#202c33",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #3a4a52",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
  },
  header: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #3a4a52",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    display: "block",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px",
  },
  time: {
    fontSize: "12px",
    color: "#8696a0",
  },
  preview: {
    padding: "16px 20px",
    fontSize: "14px",
    color: "#d1d7db",
    borderBottom: "1px solid #3a4a52",
    maxHeight: "100px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    padding: "16px",
    borderBottom: "1px solid #3a4a52",
  },
  emoji: {
    width: "100%",
    aspectRatio: "1/1",
    background: "#2a3942",
    border: "1px solid #3a4a52",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "#374248",
    },
  },
  divider: {
    height: "8px",
    background: "#1e2a32",
  },
  list: {
    padding: "8px",
  },
  item: {
    width: "100%",
    padding: "16px",
    background: "none",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "16px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    "&:hover": {
      background: "#2a3942",
    },
  },
  icon: {
    fontSize: "20px",
    width: "24px",
  },
  cancel: {
    width: "100%",
    padding: "16px",
    background: "#2a3942",
    border: "none",
    borderTop: "1px solid #3a4a52",
    color: "#ff4d6d",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    "&:hover": {
      background: "#3a4a52",
    },
  },
};

// WhatsApp-like Styles with Admin Section Below (Your original styles)
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b141a",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#fff",
    padding: "20px",
  },
  notification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  notificationSuccess: {
    background: "#00a884",
  },
  notificationError: {
    background: "#ea0038",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "15px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    fontSize: "14px",
    color: "#8696a0",
    marginTop: "5px",
  },
  headerControls: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  autoRefreshLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "13px",
    color: "#fff",
    cursor: "pointer",
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #2a3942",
    background: "#202c33",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
    "&:hover": {
      background: "#2a3942",
    },
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#202c33",
    borderRadius: "12px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #2a3942",
  },
  statIcon: {
    fontSize: "28px",
    width: "48px",
    height: "48px",
    background: "#2a3942",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    display: "block",
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1.2",
  },
  statLabel: {
    display: "block",
    fontSize: "12px",
    color: "#8696a0",
  },
  // WhatsApp Chat Container
  whatsappContainer: {
    background: "#202c33",
    borderRadius: "12px",
    border: "1px solid #2a3942",
    overflow: "hidden",
    marginBottom: "30px",
  },
  chatHeader: {
    padding: "16px 20px",
    background: "#202c33",
    borderBottom: "1px solid #2a3942",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  chatTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#fff",
  },
  onlineCount: {
    fontSize: "13px",
    color: "#00a884",
    background: "rgba(0,168,132,0.1)",
    padding: "4px 10px",
    borderRadius: "16px",
  },
  chatHeaderRight: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid #2a3942",
    background: "#2a3942",
    color: "#fff",
    fontSize: "13px",
    width: "200px",
    "::placeholder": {
      color: "#8696a0",
    },
    "&:focus": {
      outline: "none",
      borderColor: "#00a884",
    },
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid #2a3942",
    background: "#2a3942",
    color: "#fff",
    fontSize: "13px",
    minWidth: "150px",
  },
  messagesArea: {
    height: "500px",
    overflowY: "auto",
    padding: "24px",
  },
  noMessages: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#8696a0",
  },
  noMessagesIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  messageWrapper: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    position: "relative",
  },
  messageWrapperOwn: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    position: "relative",
    flexShrink: 0,
  },
  messageAdminBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    fontSize: "10px",
  },
  messageContent: {
    maxWidth: "65%",
  },
  messageContentOwn: {
    alignItems: "flex-end",
  },
  messageContentNested: {
    marginLeft: "44px",
  },
  messageSender: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "2px",
    marginLeft: "4px",
  },
  messageSenderName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#00a884",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  adminIndicator: {
    fontSize: "10px",
    background: "rgba(0,168,132,0.2)",
    color: "#00a884",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  messageTime: {
    fontSize: "11px",
    color: "#8696a0",
  },
  messageReply: {
    fontSize: "12px",
    color: "#8696a0",
    marginBottom: "2px",
    marginLeft: "4px",
    fontStyle: "italic",
  },
  messageBubble: {
    background: "#202c33",
    borderRadius: "12px",
    padding: "8px 12px",
    position: "relative",
    maxWidth: "100%",
    wordWrap: "break-word",
  },
  messageText: {
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 4px 0",
    color: "#d1d7db",
  },
  messageAttachments: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "4px",
  },
  imageAttachment: {
    position: "relative",
    maxWidth: "200px",
    minWidth: "100px",
    minHeight: "100px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #3a4a52",
    background: "#2a3942",
  },
  imageSizeBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "9px",
    padding: "2px 4px",
    borderRadius: "4px",
    zIndex: 2,
  },
  attachmentImage: {
    width: "100%",
    maxHeight: "150px",
    objectFit: "cover",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s",
    "&:hover": {
      transform: "scale(1.02)",
    },
  },
  fileAttachment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    background: "#2a3942",
    borderRadius: "6px",
    color: "#d1d7db",
    textDecoration: "none",
    fontSize: "13px",
    "&:hover": {
      background: "#374248",
    },
  },
  fileIcon: {
    fontSize: "16px",
  },
  fileName: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    fontSize: "10px",
    color: "#8696a0",
    marginLeft: "4px",
  },
  messageReactions: {
    display: "flex",
    gap: "4px",
    marginBottom: "4px",
  },
  messageReaction: {
    fontSize: "12px",
    background: "#2a3942",
    padding: "2px 6px",
    borderRadius: "12px",
  },
  messageFooter: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "#8696a0",
    position: "relative",
  },
  pinnedIcon: {
    fontSize: "12px",
  },
  editedIcon: {
    fontSize: "11px",
    fontStyle: "italic",
  },
  messageActions: {
    position: "absolute",
    top: "-30px",
    right: "0",
    display: "flex",
    gap: "4px",
    background: "#202c33",
    borderRadius: "20px",
    padding: "4px",
    opacity: 0,
    transition: "opacity 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    zIndex: 10,
  },
  messageAction: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    background: "transparent",
    color: "#d1d7db",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "#2a3942",
    },
  },
  messageActionActive: {
    background: "#00a884",
    color: "#fff",
  },
  filePreviewArea: {
    padding: "12px 16px",
    background: "#202c33",
    borderTop: "1px solid #2a3942",
    display: "flex",
    gap: "12px",
    overflowX: "auto",
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#2a3942",
    padding: "8px",
    borderRadius: "8px",
    minWidth: "200px",
    position: "relative",
  },
  previewImage: {
    width: "40px",
    height: "40px",
    borderRadius: "4px",
    objectFit: "cover",
  },
  previewIcon: {
    width: "40px",
    height: "40px",
    background: "#374248",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewName: {
    fontSize: "13px",
    fontWeight: "500",
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  previewSize: {
    fontSize: "11px",
    color: "#8696a0",
  },
  removeFileBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "10px",
    border: "none",
    background: "#ff4d6d",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "4px",
  },
  replyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    background: "#202c33",
    borderTop: "1px solid #2a3942",
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: "12px",
    color: "#00a884",
    display: "block",
    marginBottom: "2px",
  },
  replyText: {
    fontSize: "13px",
    color: "#8696a0",
    fontStyle: "italic",
  },
  cancelReply: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    "&:hover": {
      background: "#2a3942",
    },
  },
  inputContainer: {
    padding: "12px 16px",
    background: "#202c33",
    borderTop: "1px solid #2a3942",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    position: "relative",
  },
  attachButton: {
    width: "36px",
    height: "36px",
    borderRadius: "18px",
    border: "none",
    background: "transparent",
    color: "#8696a0",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "#2a3942",
      color: "#fff",
    },
  },
  emojiButton: {
    width: "36px",
    height: "36px",
    borderRadius: "18px",
    border: "none",
    background: "transparent",
    color: "#8696a0",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "#2a3942",
      color: "#fff",
    },
  },
  emojiPicker: {
    position: "absolute",
    bottom: "70px",
    left: "16px",
    background: "#202c33",
    borderRadius: "12px",
    padding: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "8px",
    border: "1px solid #2a3942",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    zIndex: 100,
  },
  emoji: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "#2a3942",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    "&:hover": {
      background: "#374248",
    },
  },
  messageInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "20px",
    border: "1px solid #2a3942",
    background: "#2a3942",
    color: "#fff",
    fontSize: "14px",
    minHeight: "20px",
    maxHeight: "100px",
    "::placeholder": {
      color: "#8696a0",
    },
    "&:focus": {
      outline: "none",
      borderColor: "#00a884",
    },
  },
  sendButton: {
    padding: "0 20px",
    height: "36px",
    borderRadius: "18px",
    border: "none",
    background: "#00a884",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      background: "#008f72",
    },
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    "&:hover": {
      background: "#00a884",
    },
  },
  progressBar: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "200px",
    height: "40px",
    background: "#202c33",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #2a3942",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    background: "#00a884",
    transition: "width 0.3s ease",
  },
  progressText: {
    position: "relative",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "500",
    zIndex: 1,
  },

  // ADMIN SECTION STYLES (Below Chat)
  adminSection: {
    marginTop: "30px",
    padding: "20px",
    background: "#202c33",
    borderRadius: "12px",
    border: "1px solid #2a3942",
  },
  adminSectionTitle: {
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  adminGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  adminCard: {
    background: "#2a3942",
    borderRadius: "10px",
    padding: "16px",
    border: "1px solid #3a4a52",
  },
  adminCardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  onlineUsersGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  adminUserCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    background: "#202c33",
    borderRadius: "8px",
    position: "relative",
  },
  adminUserAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    position: "relative",
  },
  adminUserInfo: {
    flex: 1,
  },
  adminUserName: {
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  adminUserTime: {
    fontSize: "11px",
    color: "#8696a0",
    display: "block",
  },
  muteBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#8696a0",
    fontSize: "14px",
    cursor: "pointer",
    "&:hover": {
      background: "#3a4a52",
      color: "#fff",
    },
  },
  onlineDot: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#00a884",
    border: "2px solid #202c33",
  },
  adminStar: {
    fontSize: "12px",
  },
  pinnedMessagesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  adminPinnedItem: {
    background: "#202c33",
    borderRadius: "8px",
    padding: "12px",
    borderLeft: "3px solid #ffd700",
  },
  adminPinnedHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    fontSize: "12px",
  },
  adminPinnedUser: {
    fontWeight: "600",
    color: "#00a884",
  },
  adminPinnedTime: {
    color: "#8696a0",
  },
  adminPinnedContent: {
    fontSize: "13px",
    color: "#d1d7db",
    margin: "0 0 8px 0",
  },
  adminPinnedAttachments: {
    fontSize: "11px",
    color: "#8696a0",
    marginBottom: "8px",
  },
  adminUnpinBtn: {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    background: "#3a4a52",
    color: "#fff",
    fontSize: "11px",
    cursor: "pointer",
    "&:hover": {
      background: "#4a5a62",
    },
  },
  topUsersList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  adminTopUser: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    background: "#202c33",
    borderRadius: "6px",
  },
  adminTopRank: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    background: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
  },
  adminTopName: {
    flex: 1,
    fontSize: "13px",
  },
  adminTopCount: {
    fontSize: "12px",
    color: "#8696a0",
  },
  adminStatsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  adminStatRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    padding: "6px 0",
    borderBottom: "1px solid #3a4a52",
  },
  noData: {
    textAlign: "center",
    color: "#8696a0",
    padding: "20px",
    fontStyle: "italic",
  },
  bulkActionsSection: {
    marginTop: "20px",
    padding: "20px",
    background: "#2a3942",
    borderRadius: "10px",
  },
  bulkActionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  bulkControls: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "13px",
    cursor: "pointer",
  },
  bulkDeleteBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    background: "#ea0038",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
    "&:hover": {
      background: "#c40030",
    },
  },
  exportSection: {
    marginTop: "20px",
  },
  exportTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  dateRangePicker: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dateInput: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #3a4a52",
    background: "#202c33",
    color: "#fff",
    fontSize: "13px",
  },
  dateSeparator: {
    color: "#8696a0",
  },
  exportBtn: {
    padding: "8px 20px",
    borderRadius: "20px",
    border: "none",
    background: "#00a884",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
    "&:hover": {
      background: "#008f72",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  modal: {
    background: "#202c33",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "400px",
    width: "100%",
    border: "1px solid #3a4a52",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  modalText: {
    fontSize: "14px",
    color: "#d1d7db",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  modalPreview: {
    display: "block",
    background: "#2a3942",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "10px",
    fontStyle: "italic",
    color: "#8696a0",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    padding: "10px 20px",
    borderRadius: "20px",
    border: "1px solid #3a4a52",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    "&:hover": {
      background: "#2a3942",
    },
  },
  modalDeleteBtn: {
    padding: "10px 20px",
    borderRadius: "20px",
    border: "none",
    background: "#ea0038",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    "&:hover": {
      background: "#c40030",
    },
  },
  modalContent: {
    position: "relative",
    maxWidth: "90vw",
    maxHeight: "90vh",
  },
  modalImage: {
    maxWidth: "100%",
    maxHeight: "90vh",
    objectFit: "contain",
    borderRadius: "12px",
  },
  modalClose: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "40px",
    height: "40px",
    borderRadius: "20px",
    border: "none",
    background: "#ea0038",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    "&:hover": {
      background: "#c40030",
    },
  },
};

const loadingStyles = {
  container: {
    minHeight: "100vh",
    background: "#0b141a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #2a3942",
    borderTopColor: "#00a884",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  text: {
    color: "#fff",
    fontSize: "16px",
  },
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  * {
    box-sizing: border-box;
  }
  
  button {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
  }
  
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1e2a32;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #3e4a52;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #5e6a72;
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    
    .message-content {
      max-width: 85% !important;
    }
    
    .message-actions {
      opacity: 1 !important;
      top: -25px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ChatMonitorPage;