// frontend/src/pages/Chat.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "../api";
import backgroundImg from "../assets/background.webp";

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  // Chat input states
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showMediaPreview, setShowMediaPreview] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // WhatsApp-style long press
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

  // Reactions and pins
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Check authentication
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

  // Parse attachments
  const parseAttachments = (attachments) => {
    if (!attachments) return [];
    try {
      if (Array.isArray(attachments)) return attachments;
      if (typeof attachments === 'string') {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return [];
    } catch (e) {
      console.error("Error parsing attachments:", e);
      return [];
    }
  };

  // Fetch pinned messages
  const fetchPinnedMessages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/pinned`, { headers });
      setPinnedMessages(response.data);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
    }
  };

  // Pin/Unpin message
  const togglePinMessage = async (messageId) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/${messageId}/pin`, {}, { headers });
      if (response.data.message === "Message unpinned") {
        showNotification("Message unpinned", "success");
        setPinnedMessages(prev => prev.filter(p => p.messageId !== messageId));
      } else {
        showNotification("Message pinned", "success");
        fetchPinnedMessages(); // Refresh pins
      }
      setShowMessageActions(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error pinning message:", err);
      showNotification("Failed to pin message", "error");
    }
  };

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/blocked`, { headers });
      setBlockedUsers(response.data);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    }
  };

  // Block/Unblock user
  const toggleBlockUser = async (userId) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/block/${userId}`, {}, { headers });
      showNotification(response.data.message, "success");
      fetchBlockedUsers(); // Refresh blocked list
    } catch (err) {
      console.error("Error blocking user:", err);
      showNotification("Failed to block user", "error");
    }
  };

  // Search messages
  const searchMessages = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/search?q=${encodeURIComponent(query)}`, { headers });
      setSearchResults(response.data);
    } catch (err) {
      console.error("Error searching messages:", err);
      showNotification("Search failed", "error");
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery) {
      const timeout = setTimeout(() => {
        searchMessages(searchQuery);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // WhatsApp-style long press handlers
  const handleTouchStart = (e, message) => {
    e.preventDefault();
    const touch = e.touches[0];
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
    
    const timer = setTimeout(() => {
      setSelectedMessage(message);
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

  // Edit message
  const handleEditMessage = async () => {
    if (!editMessage || !editMessage.content.trim()) return;

    try {
      const response = await axios.put(
        `${BASE_URL}/api/chat/${editMessage.id}`,
        { content: editMessage.content },
        { headers }
      );

      setMessages(prev => prev.map(msg => 
        msg.id === editMessage.id ? { ...msg, content: response.data.content, isEdited: true } : msg
      ));
      setEditMessage(null);
      showNotification("Message edited", "success");
    } catch (err) {
      console.error("Error editing message:", err);
      showNotification("Failed to edit message", "error");
    }
  };

  // Delete message (soft delete)
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await axios.delete(`${BASE_URL}/api/chat/${messageId}`, { headers });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowMessageActions(false);
      setSelectedMessage(null);
      showNotification("Message deleted", "success");
    } catch (err) {
      console.error("Error deleting message:", err);
      showNotification("Failed to delete message", "error");
    }
  };

  // Hard delete message (admin only)
  const handleHardDeleteMessage = async (messageId) => {
    if (!window.confirm("Permanently delete this message and its files? This cannot be undone!")) return;

    try {
      await axios.delete(`${BASE_URL}/api/chat/${messageId}/hard`, { headers });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowMessageActions(false);
      setSelectedMessage(null);
      showNotification("Message permanently deleted", "success");
    } catch (err) {
      console.error("Error hard deleting message:", err);
      showNotification("Failed to delete message", "error");
    }
  };

  // Add reaction
  const addReaction = async (messageId, reaction) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/chat/${messageId}/reactions`,
        { reaction },
        { headers }
      );

      if (response.data.action === "removed") {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => r.userId !== user.id || r.reaction !== reaction)
            };
          }
          return msg;
        }));
      } else {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), response.data]
            };
          }
          return msg;
        }));
      }
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
    document.querySelector('textarea')?.focus();
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await axios.post(`${BASE_URL}/api/chat/${messageId}/read`, {}, { headers });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Fetch messages
  const fetchMessages = async (isInitialLoad = false) => {
    try {
      const container = chatContainerRef.current;
      
      if (container && !isInitialLoad) {
        lastScrollPositionRef.current = container.scrollTop;
      }
      
      const response = await axios.get(`${BASE_URL}/api/chat/enhanced`, { headers });
      
      const parsedMessages = response.data.reverse().map(msg => ({
  ...msg,
  attachments: parseAttachments(msg.attachments),
  files: msg.files || [],
  isOwn: msg.userId === user?.id
}));

setMessages(parsedMessages);
      
      parsedMessages.forEach(msg => {
        if (!msg.isOwn && !msg.readReceipts?.some(r => r.userId === user?.id)) {
          markAsRead(msg.id);
        }
      });
      
      setTimeout(() => {
        if (container) {
          if (isInitialLoad) {
            container.scrollTop = container.scrollHeight;
          } else {
            if (isUserScrollingRef.current) {
              container.scrollTop = lastScrollPositionRef.current;
            } else {
              const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              if (wasNearBottom) {
                container.scrollTop = container.scrollHeight;
              } else {
                container.scrollTop = lastScrollPositionRef.current;
              }
            }
          }
        }
      }, 0);
      
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setHasInitialLoad(true);
      }
    }
  };

  // Detect user scroll
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

  // Fetch online users
  const fetchOnlineCount = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/online`, { headers });
      setOnlineUsers(response.data);
      setOnlineCount(response.data.length);
    } catch (err) {
      console.error("Error fetching online users:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchMessages(true);
      fetchOnlineCount();
      fetchPinnedMessages();
      fetchBlockedUsers();
    }

    refreshTimerRef.current = setInterval(() => {
      if (user && hasInitialLoad) {
        fetchMessages(false);
        fetchOnlineCount();
      }
    }, 5000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [user, hasInitialLoad]);

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
    if (selectedFiles.length === 0 && !newMessage.trim()) return;
    if (sending) return;

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
        content: newMessage.trim() || "",
        replyToId: replyTo?.id,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, payload, { headers });
      
      const newMsg = {
        ...response.data,
        attachments: parseAttachments(response.data.attachments),
        files: response.data.files || [],
        isOwn: true,
        user: {
          ...response.data.user,
          fullName: "You"
        }
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage("");
      setReplyTo(null);
      setSelectedFiles([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editMessage) {
        handleEditMessage();
      } else {
        handleSendMessage();
      }
    }
  };

  // Format time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffHours = diff / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  // Get file preview URL
  const getFilePreview = (file) => {
    if (file.type?.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  // Get reactions for a message
  const getReactionsForMessage = (messageId) => {
    const msg = messages.find(m => m.id === messageId);
    return msg?.reactions || [];
  };

  const messageGroups = groupMessagesByDate();

  // Common emojis for reactions
  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

  if (loading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner} />
        <p style={loadingStyles.text}>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            style={{
              ...styles.notification,
              ...(notification.type === "success" ? styles.notificationSuccess : styles.notificationError),
            }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {showMediaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowMediaPreview(null)}
          >
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <img src={showMediaPreview} alt="preview" style={styles.modalImage} />
              <button style={styles.modalClose} onClick={() => setShowMediaPreview(null)}>×</button>
            </div>
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
            style={styles.actionOverlay}
            onClick={() => {
              setShowMessageActions(false);
              setSelectedMessage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              style={styles.actionModal}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.actionHeader}>
                <div style={styles.actionAvatar}>
                  {selectedMessage.user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div style={styles.actionUserInfo}>
                  <span style={styles.actionUserName}>{selectedMessage.user?.fullName}</span>
                  <span style={styles.actionTime}>{formatMessageTime(selectedMessage.createdAt)}</span>
                </div>
              </div>
              
              <div style={styles.actionPreview}>
                {selectedMessage.content || (selectedMessage.files?.length > 0 ? '📎 Attachment' : '')}
              </div>

              <div style={styles.actionGrid}>
                {commonReactions.map(emoji => (
                  <button
                    key={emoji}
                    style={styles.actionEmoji}
                    onClick={() => addReaction(selectedMessage.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div style={styles.actionDivider} />

              <div style={styles.actionList}>
                <button style={styles.actionItem} onClick={() => handleReply(selectedMessage)}>
                  <span style={styles.actionIcon}>↩️</span>
                  <span>Reply</span>
                </button>

                {selectedMessage.content && (
                  <button style={styles.actionItem} onClick={() => {
                    navigator.clipboard.writeText(selectedMessage.content);
                    showNotification("Copied to clipboard", "success");
                    setShowMessageActions(false);
                    setSelectedMessage(null);
                  }}>
                    <span style={styles.actionIcon}>📋</span>
                    <span>Copy</span>
                  </button>
                )}

                {selectedMessage.isOwn && (
                  <button style={styles.actionItem} onClick={() => {
                    setEditMessage(selectedMessage);
                    setShowMessageActions(false);
                    setSelectedMessage(null);
                  }}>
                    <span style={styles.actionIcon}>✏️</span>
                    <span>Edit</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button style={styles.actionItem} onClick={() => togglePinMessage(selectedMessage.id)}>
                    <span style={styles.actionIcon}>
                      {pinnedMessages.some(p => p.messageId === selectedMessage.id) ? '📌' : '📍'}
                    </span>
                    <span>
                      {pinnedMessages.some(p => p.messageId === selectedMessage.id) ? 'Unpin' : 'Pin'}
                    </span>
                  </button>
                )}

                {(selectedMessage.isOwn || user?.role === 'admin') && (
                  <button style={{...styles.actionItem, color: '#ff4444'}} onClick={() => handleDeleteMessage(selectedMessage.id)}>
                    <span style={styles.actionIcon}>🗑️</span>
                    <span>Delete</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button style={{...styles.actionItem, color: '#ff0000'}} onClick={() => handleHardDeleteMessage(selectedMessage.id)}>
                    <span style={styles.actionIcon}>⚠️</span>
                    <span>Delete Permanently</span>
                  </button>
                )}

                {!selectedMessage.isOwn && (
                  <button style={styles.actionItem} onClick={() => toggleBlockUser(selectedMessage.userId)}>
                    <span style={styles.actionIcon}>
                      {blockedUsers.some(b => b.id === selectedMessage.userId) ? '🔓' : '🔒'}
                    </span>
                    <span>
                      {blockedUsers.some(b => b.id === selectedMessage.userId) ? 'Unblock' : 'Block'}
                    </span>
                  </button>
                )}
              </div>

              <button style={styles.actionCancel} onClick={() => {
                setShowMessageActions(false);
                setSelectedMessage(null);
              }}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Message Modal */}
      <AnimatePresence>
        {editMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setEditMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              style={styles.editModal}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={styles.editModalTitle}>Edit Message</h3>
              <textarea
                value={editMessage.content}
                onChange={(e) => setEditMessage({ ...editMessage, content: e.target.value })}
                style={styles.editModalInput}
                rows="3"
                autoFocus
              />
              <div style={styles.editModalButtons}>
                <button onClick={() => setEditMessage(null)} style={styles.editModalCancel}>Cancel</button>
                <button onClick={handleEditMessage} style={styles.editModalSave}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Messages Panel */}
      <AnimatePresence>
        {showPinned && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            style={styles.pinnedPanel}
          >
            <div style={styles.pinnedHeader}>
              <h3>📌 Pinned Messages</h3>
              <button onClick={() => setShowPinned(false)}>✕</button>
            </div>
            <div style={styles.pinnedList}>
              {pinnedMessages.length === 0 ? (
                <p style={styles.noPinned}>No pinned messages</p>
              ) : (
                pinnedMessages.map(pin => (
                  <div key={pin.id} style={styles.pinnedItem}>
                    <div style={styles.pinnedItemHeader}>
                      <span style={styles.pinnedItemUser}>{pin.message.user.fullName}</span>
                      <span style={styles.pinnedItemTime}>{formatMessageTime(pin.message.createdAt)}</span>
                    </div>
                    <p style={styles.pinnedItemContent}>
                      {pin.message.content || (pin.message.files?.length > 0 ? '📎 Attachments' : '')}
                    </p>
                    <button 
                      onClick={() => {
                        togglePinMessage(pin.message.id);
                        setShowPinned(false);
                      }}
                      style={styles.pinnedItemUnpin}
                    >
                      Unpin
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            style={styles.searchPanel}
          >
            <div style={styles.searchHeader}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />
              <button onClick={() => setShowSearch(false)} style={styles.searchClose}>✕</button>
            </div>
            {searching && <div style={styles.searchSpinner} />}
            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map(msg => (
                  <div key={msg.id} style={styles.searchResult} onClick={() => {
                    const element = document.getElementById(`msg-${msg.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      setShowSearch(false);
                    }
                  }}>
                    <div style={styles.searchResultHeader}>
                      <span style={styles.searchResultUser}>{msg.user.fullName}</span>
                      <span style={styles.searchResultTime}>{formatMessageTime(msg.createdAt)}</span>
                    </div>
                    <p style={styles.searchResultContent}>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div style={styles.headerActions}>
        <button 
          style={styles.headerButton}
          onClick={() => setShowSearch(!showSearch)}
        >
          🔍
        </button>

        <button 
          style={styles.headerButton}
          onClick={() => setShowPinned(!showPinned)}
        >
          📌
          {pinnedMessages.length > 0 && (
            <span style={styles.headerBadge}>{pinnedMessages.length}</span>
          )}
        </button>

        <button 
          style={styles.onlineButton}
          onClick={() => setShowOnlineList(!showOnlineList)}
        >
          <span style={styles.onlineButtonDot}></span>
          <span>{onlineCount}</span>
        </button>
      </div>

      {/* Online Users Dropdown */}
      <AnimatePresence>
        {showOnlineList && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={styles.onlineDropdown}
          >
            <div style={styles.onlineDropdownHeader}>
              <h3>Online Members</h3>
              <button onClick={() => setShowOnlineList(false)}>✕</button>
            </div>
            <div style={styles.onlineList}>
              {onlineUsers.length === 0 ? (
                <p style={styles.noOnline}>No one online</p>
              ) : (
                onlineUsers.map(u => {
                  const isBlocked = blockedUsers.some(b => b.id === u.id);
                  return (
                    <div key={u.id} style={styles.onlineItem}>
                      <div style={styles.onlineItemAvatar}>
                        {u.fullName?.charAt(0).toUpperCase()}
                        <span style={styles.onlineItemDot}></span>
                      </div>
                      <span style={styles.onlineItemName}>{u.fullName}</span>
                      {u.role === 'admin' && <span style={styles.adminChip}>Admin</span>}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Messages Area */}
      <div style={styles.messagesWrapper}>
        <div style={styles.messagesContainer} ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <h3>Welcome to ZUCA Chat</h3>
              <p>Send a message to start the conversation</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date}>
                <div style={styles.dateHeader}>
                  <span style={styles.dateText}>{date}</span>
                </div>

                {msgs.map((msg) => {
                  const isOwn = msg.userId === user?.id;
                  const isAdmin = msg.user?.role === "admin" || msg.user?.role === "ADMIN";
                  const attachments = msg.attachments || [];
                  const files = msg.files || [];
                  const reactions = getReactionsForMessage(msg.id);
                  const isPinned = pinnedMessages.some(p => p.messageId === msg.id);
                  const isBlocked = blockedUsers.some(b => b.id === msg.userId);

                  if (isBlocked && !isOwn) return null;

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      style={{
                        ...styles.messageRow,
                        ...(isOwn ? styles.messageRowOwn : {}),
                      }}
                      onTouchStart={(e) => handleTouchStart(e, msg)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedMessage(msg);
                        setShowMessageActions(true);
                        if (navigator.vibrate) {
                          navigator.vibrate(50);
                        }
                      }}
                    >
                      {!isOwn && (
                        <div style={styles.messageAvatar}>
                          {msg.user?.fullName?.charAt(0).toUpperCase()}
                          {isAdmin && <span style={styles.adminCrown}>👑</span>}
                        </div>
                      )}

                      <div style={{
                        ...styles.messageBubbleWrapper,
                        ...(isOwn ? styles.messageBubbleWrapperOwn : {}),
                      }}>
                        {!isOwn && (
                          <span style={styles.messageSenderName}>
                            {msg.user?.fullName}
                          </span>
                        )}
                        {isOwn && (
                          <span style={{...styles.messageSenderName, textAlign: 'right', color: '#00a884'}}>
                            You
                          </span>
                        )}

                        {isPinned && (
                          <div style={styles.pinIndicator}>
                            📌 Pinned
                          </div>
                        )}

                        {msg.replyTo && (
                          <div style={styles.replyPreview}>
                            <span style={styles.replyIcon}>↪️</span>
                            <span style={styles.replyText}>
                              {msg.replyTo.user?.fullName}: {msg.replyTo.content?.substring(0, 30)}
                            </span>
                          </div>
                        )}

                        <div style={{
                          ...styles.messageBubble,
                          ...(isOwn ? styles.messageBubbleOwn : {}),
                        }}>
                          {msg.isEdited && (
                            <span style={styles.editedIndicator}>(edited) </span>
                          )}

                          {msg.content && (
                            <p style={styles.messageText}>{msg.content}</p>
                          )}

                          {/* Files from database */}
                          {files.length > 0 && (
                            <div style={styles.attachments}>
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
                                    style={styles.imageWrapper}
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
                                          parent.appendChild(fallback);
                                        };
                                      }}
                                    />
                                    <span style={styles.imageSizeBadge}>
                                      {(file.size / 1024).toFixed(0)}KB
                                    </span>
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
                            <div style={styles.attachments}>
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
                                    style={styles.imageWrapper}
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

                          {reactions.length > 0 && (
                            <div style={styles.reactions}>
                              {reactions.map((reaction, i) => (
                                <span key={i} style={styles.reaction}>
                                  {reaction.reaction}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={styles.messageFooter}>
                            <span style={styles.messageTime}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isOwn && (
                              <span style={styles.messageStatus}>
                                {msg.readReceipts?.length > 0 ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div> {/* Closes messageBubble */}
                      </div> {/* Closes messageBubbleWrapper */}
                    </div> // Closes messageRow
                  );
                })}
              </div> // Closes date group
            ))
          )}
          <div ref={messagesEndRef} />
        </div> // Closes messagesContainer
      </div> 
      
      
      

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          style={styles.previewContainer}
        >
          <div style={styles.previewScroller}>
            {selectedFiles.map((file, index) => {
              const preview = getFilePreview(file);
              return (
                <div key={index} style={styles.previewItem}>
                  {preview ? (
                    <img src={preview} alt="preview" style={styles.previewImage} />
                  ) : (
                    <div style={styles.previewIcon}>📎</div>
                  )}
                  <button style={styles.previewRemove} onClick={() => removeFile(index)}>×</button>
                  <div style={styles.previewName}>{file.name}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Reply Bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={styles.replyBar}
          >
            <div style={styles.replyBarContent}>
              <span style={styles.replyBarLabel}>
                Replying to {replyTo.user?.fullName}
              </span>
              <span style={styles.replyBarText}>
                {replyTo.content || (replyTo.attachments?.length > 0 ? '📎 Attachment' : '')}
              </span>
            </div>
            <button style={styles.replyBarClose} onClick={() => setReplyTo(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div style={styles.inputWrapper}>
        <div style={styles.inputContainer}>
          <button style={styles.attachButton} onClick={() => fileInputRef.current?.click()}>
            📎
          </button>
          
          <button style={styles.emojiButton} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
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

          <textarea
            value={editMessage ? editMessage.content : newMessage}
            onChange={editMessage ? 
              (e) => setEditMessage({ ...editMessage, content: e.target.value }) : 
              handleTyping
            }
            onKeyPress={handleKeyPress}
            placeholder={editMessage ? "Edit message..." : "Type a message"}
            style={styles.messageInput}
            rows="1"
          />

          <button
            onClick={editMessage ? handleEditMessage : handleSendMessage}
            disabled={sending || (selectedFiles.length === 0 && !newMessage.trim() && !editMessage)}
            style={{
              ...styles.sendButton,
              ...((sending || (selectedFiles.length === 0 && !newMessage.trim() && !editMessage)) && styles.sendButtonDisabled),
            }}
          >
            {sending ? "..." : (editMessage ? "Save" : "Send")}
          </button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              style={styles.emojiPicker}
            >
              {["😊", "😂", "❤️", "👍", "🙏", "🎉", "🔥", "✨", "💯", "👏", "🥳", "😢", "😍", "🤔", "👀"].map(emoji => (
                <button
                  key={emoji}
                  style={styles.emoji}
                  onClick={() => {
                    if (editMessage) {
                      setEditMessage({ ...editMessage, content: editMessage.content + emoji });
                    } else {
                      setNewMessage(prev => prev + emoji);
                    }
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([id, progress]) => (
        <motion.div 
          key={id} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={styles.progressOverlay}
        >
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            <span style={styles.progressText}>{progress}%</span>
          </div>
        </motion.div>
      ))}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .attach-button:hover, .emoji-button:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        
        .emoji:hover {
          transform: scale(1.1);
          background: rgba(255,255,255,0.1) !important;
        }
        
        .send-button:hover:not(:disabled) {
          background: #008f72 !important;
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }

        .message-row {
          touch-action: pan-y pinch-zoom;
        }
      `}</style>
    </div>
  );
}

// WhatsApp-like Styles
const styles = {
  container: {
    width: "100%",
    height: "calc(100vh - 120px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#fff",
    borderRadius: "16px",
    position: "relative",
    background: "rgba(30, 119, 179, 0.47)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  notification: {
    position: "fixed",
    top: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "8px 20px",
    borderRadius: "30px",
    zIndex: 999999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    whiteSpace: "nowrap",
    fontSize: "13px",
    fontWeight: "500",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  notificationSuccess: {
    background: "rgb(0, 255, 106)",
  },
  notificationError: {
    background: "rgba(234, 0, 56, 0.9)",
  },
  headerActions: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "8px",
    zIndex: 10,
  },
  headerButton: {
    width: "40px",
    height: "40px",
    borderRadius: "20px",
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    width: "16px",
    height: "16px",
    borderRadius: "8px",
    background: "#ff4444",
    color: "#fff",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineButton: {
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "30px",
    padding: "6px 14px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  onlineButtonDot: {
    width: "8px",
    height: "8px",
    background: "#00ff62",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  onlineDropdown: {
    position: "absolute",
    top: "60px",
    right: "12px",
    width: "280px",
    background: "rgba(32, 44, 51, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 100,
    overflow: "hidden",
  },
  onlineDropdownHeader: {
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "& h3": {
      fontSize: "16px",
      fontWeight: "600",
      margin: 0,
      color: "#fff",
    },
    "& button": {
      background: "none",
      border: "none",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px 8px",
      color: "rgba(255,255,255,0.6)",
    },
  },
  onlineList: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "8px",
  },
  onlineItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "8px",
    "&:hover": {
      background: "rgba(255,255,255,0.05)",
    },
  },
  onlineItemAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    position: "relative",
    flexShrink: 0,
  },
  onlineItemDot: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "10px",
    height: "10px",
    background: "#00a884",
    borderRadius: "50%",
    border: "2px solid rgba(32,44,51,0.9)",
  },
  onlineItemName: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  adminChip: {
    fontSize: "11px",
    background: "rgba(255,215,0,0.2)",
    color: "#ffd700",
    padding: "2px 8px",
    borderRadius: "12px",
    flexShrink: 0,
  },
  noOnline: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    padding: "20px",
    fontSize: "14px",
  },
  actionOverlay: {
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
  actionModal: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(32, 44, 51, 0.95)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
  },
  actionHeader: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  actionAvatar: {
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
  actionUserInfo: {
    flex: 1,
  },
  actionUserName: {
    display: "block",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px",
  },
  actionTime: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
  },
  actionPreview: {
    padding: "16px 20px",
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    maxHeight: "100px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  actionEmoji: {
    width: "100%",
    aspectRatio: "1/1",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "rgba(255,255,255,0.1)",
    },
  },
  actionDivider: {
    height: "8px",
    background: "rgba(255,255,255,0.03)",
  },
  actionList: {
    padding: "8px",
  },
  actionItem: {
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
      background: "rgba(255,255,255,0.05)",
    },
  },
  actionIcon: {
    fontSize: "20px",
    width: "24px",
  },
  actionCancel: {
    width: "100%",
    padding: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    color: "#ff4444",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(255,68,68,0.1)",
    },
  },
  pinnedPanel: {
    position: "absolute",
    top: "60px",
    right: "12px",
    width: "300px",
    height: "400px",
    background: "rgba(32, 44, 51, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  pinnedHeader: {
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "& h3": {
      fontSize: "16px",
      fontWeight: "600",
      margin: 0,
      color: "#fff",
    },
    "& button": {
      background: "none",
      border: "none",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px 8px",
      color: "rgba(255,255,255,0.6)",
    },
  },
  pinnedList: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  noPinned: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    padding: "20px",
    fontSize: "14px",
  },
  pinnedItem: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    position: "relative",
  },
  pinnedItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  pinnedItemUser: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#00a884",
  },
  pinnedItemTime: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
  },
  pinnedItemContent: {
    fontSize: "13px",
    color: "#fff",
    margin: "4px 0",
    wordBreak: "break-word",
  },
  pinnedItemUnpin: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    padding: "4px 8px",
    color: "#fff",
    fontSize: "11px",
    cursor: "pointer",
    marginTop: "8px",
  },
  searchPanel: {
    position: "absolute",
    top: "60px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "400px",
    background: "rgba(32, 44, 51, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 100,
    overflow: "hidden",
  },
  searchHeader: {
    padding: "12px",
    display: "flex",
    gap: "8px",
  },
  searchInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  searchClose: {
    width: "36px",
    height: "36px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  searchSpinner: {
    width: "24px",
    height: "24px",
    margin: "12px auto",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: "#00a884",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  searchResults: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "8px",
  },
  searchResult: {
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "8px",
    marginBottom: "4px",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(255,255,255,0.08)",
    },
  },
  searchResultHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  searchResultUser: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#00a884",
  },
  searchResultTime: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
  },
  searchResultContent: {
    fontSize: "13px",
    color: "#fff",
    wordBreak: "break-word",
  },
  editModal: {
    width: "400px",
    background: "rgba(32, 44, 51, 0.95)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  editModalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "16px",
  },
  editModalInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
  },
  editModalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  editModalCancel: {
    padding: "8px 16px",
    borderRadius: "20px",
    background: "none",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  },
  editModalSave: {
    padding: "8px 16px",
    borderRadius: "20px",
    background: "#00a884",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  messagesWrapper: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  messagesContainer: {
    height: "100%",
    width: "100%",
    overflowY: "auto",
    padding: "16px 12px",
    boxSizing: "border-box",
    position: "relative",
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
    color: "rgba(255,255,255,0.6)",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "12px",
    maxWidth: "300px",
    margin: "0 auto",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.7,
  },
  dateHeader: {
    display: "flex",
    justifyContent: "center",
    margin: "16px 0",
  },
  dateText: {
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#d1d7db",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  messageRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    position: "relative",
    width: "100%",
    padding: "0 4px",
    boxSizing: "border-box",
    touchAction: "pan-y pinch-zoom",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #17d356, #c9dde6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    color: "#fff",
    flexShrink: 0,
    position: "relative",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  adminCrown: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    fontSize: "10px",
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
  },
  messageBubbleWrapper: {
    maxWidth: "70%",
    position: "relative",
  },
  messageBubbleWrapperOwn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  messageSenderName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#181414",
    marginBottom: "2px",
    marginLeft: "4px",
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
  },
  pinIndicator: {
    fontSize: "11px",
    color: "#ffd700",
    marginLeft: "4px",
    marginBottom: "2px",
  },
  replyPreview: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "2px",
    marginLeft: "4px",
    background: "rgba(42, 57, 66, 0.5)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    padding: "4px 8px",
    borderRadius: "8px",
    maxWidth: "200px",
  },
  replyIcon: {
    fontSize: "10px",
  },
  replyText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  messageBubble: {
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    borderRadius: "12px",
    padding: "8px 12px",
    position: "relative",
    wordWrap: "break-word",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    maxWidth: "100%",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  messageBubbleOwn: {
    background: "rgba(7, 150, 233, 0.63)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  editedIndicator: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
    marginRight: "4px",
  },
  messageText: {
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 4px 0",
    color: "#fff",
    wordBreak: "break-word",
    fontWeight: "600",
    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  attachments: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "4px",
  },
  imageWrapper: {
    position: "relative",
    maxWidth: "200px",
    minWidth: "100px",
    minHeight: "100px",
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentImage: {
    width: "100%",
    height: "auto",
    maxHeight: "150px",
    objectFit: "cover",
    display: "block",
    backgroundColor: "#f0f0f0",
  },
  imageSizeBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    color: "#fff",
    fontSize: "9px",
    padding: "2px 4px",
    borderRadius: "4px",
    zIndex: 2,
  },
  fileAttachment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    background: "rgba(19, 20, 20, 0.98)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    borderRadius: "8px",
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    maxWidth: "200px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  fileIcon: {
    fontSize: "16px",
  },
  fileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  fileSize: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    marginLeft: "4px",
  },
  reactions: {
    display: "flex",
    gap: "4px",
    marginTop: "4px",
  },
  reaction: {
    fontSize: "12px",
    background: "rgba(255,255,255,0.1)",
    padding: "2px 6px",
    borderRadius: "12px",
  },
  messageFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "4px",
  },
  messageTime: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.5)",
  },
  messageStatus: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
  },
  previewContainer: {
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    padding: "12px",
    overflowX: "auto",
    width: "100%",
    boxSizing: "border-box",
  },
  previewScroller: {
    display: "flex",
    gap: "12px",
  },
  previewItem: {
    position: "relative",
    width: "70px",
    height: "70px",
    borderRadius: "8px",
    overflow: "hidden",
    flexShrink: 0,
    background: "rgba(42, 57, 66, 0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  previewIcon: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    background: "rgba(55, 66, 77, 0.6)",
    color: "#fff",
  },
  previewRemove: {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "20px",
    height: "20px",
    borderRadius: "10px",
    background: "rgba(255, 77, 109, 0.9)",
    color: "#fff",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  previewName: {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    color: "#fff",
    fontSize: "9px",
    padding: "2px 4px",
    textAlign: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  replyBar: {
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
  },
  replyBarContent: {
    flex: 1,
    minWidth: 0,
  },
  replyBarLabel: {
    fontSize: "11px",
    color: "#00a884",
    display: "block",
    marginBottom: "2px",
    fontWeight: "500",
  },
  replyBarText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    fontStyle: "italic",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
  },
  replyBarClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    color: "rgba(255,255,255,0.6)",
    flexShrink: 0,
  },
  inputWrapper: {
    background: "rgba(250, 244, 244, 0.44)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 12px",
    position: "relative",
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
  },
  inputContainer: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    width: "100%",
  },
  attachButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(14, 13, 13, 0.88)",
    color: "rgb(255, 255, 255)",
    fontSize: "30px",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  emojiButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255, 255, 255, 0.94)",
    color: "rgba(255, 255, 255, 0.98)",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  emojiPicker: {
    position: "absolute",
    bottom: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(32, 44, 51, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "12px",
    padding: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    zIndex: 100,
    width: "90%",
    maxWidth: "320px",
  },
  emoji: {
    width: "100%",
    aspectRatio: "1/1",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  messageInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgb(241, 244, 246)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    color: "#000000",
    fontSize: "15px",
    minHeight: "20px",
    maxHeight: "100px",
    fontFamily: "inherit",
    fontWeight: "600",
    minWidth: 0,
    width: "100%",
    resize: "none",
    "::placeholder": {
      color: "rgb(12, 12, 12)",
    },
    "&:focus": {
      outline: "none",
      borderColor: "#00a884",
    },
  },
  sendButton: {
    padding: "0 16px",
    height: "40px",
    borderRadius: "24px",
    border: "none",
    background: "#04f741",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background 0.2s",
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  progressOverlay: {
    position: "absolute",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
  },
  progressBar: {
    width: "200px",
    height: "40px",
    background: "rgba(32, 44, 51, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    background: "rgba(0, 168, 132, 0.8)",
    transition: "width 0.3s ease",
  },
  progressText: {
    position: "relative",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    zIndex: 1,
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  modalContent: {
    position: "relative",
    maxWidth: "95vw",
    maxHeight: "95vh",
  },
  modalImage: {
    maxWidth: "100%",
    maxHeight: "95vh",
    objectFit: "contain",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  modalClose: {
    position: "absolute",
    top: "-40px",
    right: "0",
    width: "40px",
    height: "40px",
    borderRadius: "20px",
    border: "none",
    background: "rgba(234, 0, 56, 0.8)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
};

const loadingStyles = {
  container: {
    width: "100%",
    height: "calc(100vh - 120px)",
    background: "rgba(11, 20, 26, 0.75)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTopColor: "#00a884",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  text: {
    color: "#fff",
    fontSize: "16px",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
};

export default Chat;