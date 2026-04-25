// frontend/src/pages/JumuiaDashboard.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "../api";
import io from "socket.io-client";
import SimpleMessageModal from "./SimpleMessageModal";

function JumuiaDashboard() {
  const [activeTab, setActiveTab] = useState("contributions");
  const [jumuiaName, setJumuiaName] = useState("");
  const [jumuiaId, setJumuiaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // Contributions state
  const [contributions, setContributions] = useState([]);
  const [pledgeInputs, setPledgeInputs] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [filter, setFilter] = useState("all");
  const [messageThread, setMessageThread] = useState(null);
  
  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoom, setChatRoom] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const fetchAttempted = useRef(false);
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const messagesEndRef = useRef(null);

  // Get user's jumuia info
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.jumuia) {
          setJumuiaName(userData.jumuia);
          // Get jumuia ID from code or name
          const jumuiaCode = userData.jumuiaCode || 
            userData.jumuia.toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
          fetchJumuiaId(jumuiaCode);
        }
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const fetchJumuiaId = async (code) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/jumuia/${code}`, { headers });
      setJumuiaId(res.data.id);
    } catch (err) {
      console.error("Failed to fetch jumuia ID:", err);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // ==================== CONTRIBUTIONS ====================

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(BASE_URL);
    
    socket.on('connect', () => {
      console.log('Connected to real-time updates');
    });

    socket.on('pledge_updated', (updatedPledge) => {
      setContributions(prev => 
        prev.map(pledge => 
          pledge.id === updatedPledge.id ? updatedPledge : pledge
        )
      );
      
      if (updatedPledge.status === "APPROVED") {
        const paidAmount = updatedPledge.amountPaid;
        const remaining = updatedPledge.amountRequired - paidAmount;
        showNotification(
          `✅ Your pledge of ${updatedPledge.pendingAmount} has been approved! ${
            remaining > 0 ? `Remaining: KES ${remaining.toLocaleString()}` : 'Fully paid!'
          }`, 
          "success"
        );
      } else if (updatedPledge.status === "COMPLETED") {
        showNotification(
          `🎉 Congratulations! Your contribution of KES ${updatedPledge.amountRequired.toLocaleString()} is complete!`, 
          "success"
        );
      }
    });

    socket.on('pledge_created', (newPledge) => {
      setContributions(prev => [newPledge, ...prev]);
    });

    socket.on('new_message', (message) => {
      const pledge = contributions.find(p => p.id === message.pledgeId);
      if (pledge) {
        showNotification(
          `💬 New message about "${pledge.title}"`,
          "info"
        );
      }
    });

    return () => socket.disconnect();
  }, [contributions]);

  // Silent background refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && activeTab === "contributions") {
        silentRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const silentRefresh = useCallback(async () => {
    if (!token || refreshing) return;
    
    try {
      const res = await axios.get(`${BASE_URL}/api/contributions/jumuia`, { headers });
      setContributions(res.data);
      console.log('Background refresh completed');
    } catch (err) {
      console.error("Background refresh error:", err);
    }
  }, [token, headers, refreshing]);

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  const fetchContributions = useCallback(async (isRefresh = false) => {
    if (!token) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const res = await axios.get(`${BASE_URL}/api/contributions/jumuia`, { headers });
      setContributions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch contributions");
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchAttempted.current = true;
    }
  }, [token, headers]);

  useEffect(() => {
    if (token && !fetchAttempted.current && activeTab === "contributions") {
      fetchContributions();
    }
  }, [token, fetchContributions, activeTab]);

  const calculateRemaining = (contribution) => {
    return contribution.amountRequired - contribution.amountPaid;
  };

  const handleOpenMessage = (pledgeId, pledgeTitle) => {
    setMessageThread({ pledgeId, pledgeTitle });
  };

  const optimisticUpdate = (contributionId, updates) => {
    setContributions(prev => 
      prev.map(c => 
        c.id === contributionId ? { ...c, ...updates } : c
      )
    );
  };

  const handlePledge = async (contributionId) => {
  const { amount, message } = pledgeInputs[contributionId] || {};
  const parsedAmount = parseFloat(amount);

  const contribution = contributions.find((c) => c.id === contributionId);
  if (!contribution) return;

  console.log("Pledge attempt:", {
    contributionId,
    contribution,
    amount: parsedAmount,
    message: message?.trim()
  });

  if (!amount || parsedAmount <= 0) {
    showNotification("Please enter a valid amount", "error");
    return;
  }
  
  const remaining = calculateRemaining(contribution);
  if (parsedAmount > remaining) {
    showNotification(`Amount cannot exceed KES ${remaining.toLocaleString()}`, "error");
    return;
  }

  setSubmitting(prev => ({ ...prev, [contributionId]: true }));

  // Store original values in case we need to revert
  const originalContribution = { ...contribution };

  // Optimistic update - show immediately
  optimisticUpdate(contributionId, {
    pendingAmount: (contribution.pendingAmount || 0) + parsedAmount,
    message: message?.trim() || contribution.message
  });

  setPledgeInputs(prev => ({
    ...prev,
    [contributionId]: { amount: "", message: "" }
  }));

  try {
    console.log("Sending pledge request to:", `${BASE_URL}/api/pledges/${contribution.id}`);
    console.log("Request payload:", { 
      amount: parsedAmount, 
      message: message?.trim() || "" 
    });

    const response = await axios.post(
      `${BASE_URL}/api/pledges/${contribution.id}`,
      { 
        amount: parsedAmount, 
        message: message?.trim() || "" 
      },
      { headers }
    );
    
    console.log("Pledge response:", response.data);
    
    // Instead of replacing with response.data, update the specific fields
    setContributions(prev => 
      prev.map(c => {
        if (c.id === contributionId) {
          // Create updated contribution preserving all fields
          return {
            ...c,
            // Update with response data if available, otherwise keep optimistic update
            pendingAmount: response.data.pendingAmount ?? c.pendingAmount,
            amountPaid: response.data.amountPaid ?? c.amountPaid,
            status: response.data.status ?? c.status,
            message: response.data.message ?? c.message
          };
        }
        return c;
      })
    );
    
    showNotification("Pledge submitted successfully!", "success");
  } catch (err) {
    console.error("Full error object:", err);
    console.error("Error response data:", err.response?.data);
    console.error("Error status:", err.response?.status);
    
    // Revert to original values on error
    setContributions(prev => 
      prev.map(c => 
        c.id === contributionId ? originalContribution : c
      )
    );
    
    showNotification(err.response?.data?.error || "Failed to submit pledge", "error");
  } finally {
    setSubmitting(prev => ({ ...prev, [contributionId]: false }));
  }
};

  const handleInputChange = (contributionId, field, value) => {
    setPledgeInputs(prev => ({
      ...prev,
      [contributionId]: {
        ...prev[contributionId],
        [field]: value
      }
    }));
  };

  const filteredContributions = contributions.filter(c => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "PENDING" && c.pendingAmount > 0;
    if (filter === "approved") return c.status === "APPROVED";
    if (filter === "completed") return c.amountPaid >= c.amountRequired;
    return true;
  });

  const stats = {
    totalPledged: contributions.reduce((sum, c) => sum + (c.amountPaid || 0) + (c.pendingAmount || 0), 0),
    totalPaid: contributions.reduce((sum, c) => sum + (c.amountPaid || 0), 0),
    totalPending: contributions.reduce((sum, c) => sum + (c.pendingAmount || 0), 0),
    completedCount: contributions.filter(c => c.amountPaid >= c.amountRequired).length,
    pendingCount: contributions.filter(c => c.status === "PENDING" && c.pendingAmount > 0).length,
    totalRequired: contributions.reduce((sum, c) => sum + (c.amountRequired || 0), 0),
    progressPercentage: contributions.length > 0 
      ? (contributions.reduce((sum, c) => sum + (c.amountPaid || 0), 0) / 
         contributions.reduce((sum, c) => sum + (c.amountRequired || 0), 0) * 100).toFixed(1)
      : 0
  };

  // ==================== ANNOUNCEMENTS ====================

  const fetchAnnouncements = async () => {
    if (!jumuiaId) {
      console.log("Cannot fetch: jumuiaId is:", jumuiaId);
      return;
    }
    
    setLoadingAnnouncements(true);
    try {
      console.log("Fetching announcements for jumuiaId:", jumuiaId);
      const res = await axios.get(`${BASE_URL}/api/jumuia/${jumuiaId}/announcements`, { headers });
      console.log("Announcements received:", res.data);
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      showNotification("Failed to load announcements", "error");
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (jumuiaId && activeTab === "announcements") {
      fetchAnnouncements();
    }
  }, [jumuiaId, activeTab]);

  // ==================== CHAT ====================

  // Function to get or create chat room
  const getOrCreateChatRoom = async () => {
    if (!jumuiaId) return null;
    
    try {
      // Try to get existing rooms
      const res = await axios.get(`${BASE_URL}/api/jumuia/${jumuiaId}/chat/rooms`, { headers });
      
      // If rooms exist, use the first one
      if (res.data && res.data.length > 0) {
        return res.data[0];
      }
      
      // If no rooms, create one
      const createRes = await axios.post(
        `${BASE_URL}/api/jumuia/${jumuiaId}/chat/rooms`,
        { name: 'general', description: 'General chat' },
        { headers }
      );
      return createRes.data;
    } catch (err) {
      console.error("Chat room error:", err);
      return null;
    }
  };

  // Load chat when tab changes
  useEffect(() => {
    const loadChat = async () => {
      if (activeTab !== 'chat' || !jumuiaId) return;
      
      setLoadingChat(true);
      const room = await getOrCreateChatRoom();
      
      if (room) {
        setChatRoom(room);
        // Load messages
        try {
          const msgRes = await axios.get(`${BASE_URL}/api/jumuia/chat/rooms/${room.id}/messages`, { headers });
          setChatMessages(msgRes.data.messages || []);
          scrollToBottom();
        } catch (err) {
          console.error("Failed to load messages:", err);
        }
      }
      setLoadingChat(false);
    };
    
    loadChat();
  }, [activeTab, jumuiaId]);

  // Socket for chat
  useEffect(() => {
    if (!jumuiaId) return;

    console.log("Setting up socket connection for jumuia:", jumuiaId);
    const socket = io(BASE_URL);
    
    socket.on('connect', () => {
      console.log("Socket connected, joining jumuia room:", jumuiaId);
      socket.emit('join-jumuia', jumuiaId);
    });

    socket.on('new_jumuia_message', (message) => {
      console.log("New message received:", message);
      setChatMessages(prev => [message, ...prev]);
      scrollToBottom();
      
      if (message.userId !== getCurrentUserId()) {
        showNotification(`💬 New message from ${message.user?.fullName}`, "info");
      }
    });

    socket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
    };
  }, [jumuiaId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch (e) {
      console.error("Failed to get user ID from token:", e);
      return null;
    }
  };

  const handleSendMessage = async () => {
    console.log("1. Send button clicked");
    console.log("2. Message content:", newMessage);
    console.log("3. Chat room:", chatRoom);
    
    if (!newMessage.trim() || !chatRoom || sendingMessage) {
      console.log("4. Validation failed - returning early");
      return;
    }

    setSendingMessage(true);
    console.log("5. Sending message...");

    // Create temp message for instant display
    const tempMessage = {
      id: 'temp-' + Date.now(),
      content: newMessage,
      userId: getCurrentUserId(),
      user: { fullName: 'You' },
      createdAt: new Date().toISOString(),
      isTemp: true
    };

    // Show temp message immediately
    setChatMessages(prev => [tempMessage, ...prev]);
    setNewMessage('');
    scrollToBottom();

    try {
      console.log("6. Making API call to:", `${BASE_URL}/api/jumuia/chat/rooms/${chatRoom.id}/messages`);
      
      const res = await axios.post(
        `${BASE_URL}/api/jumuia/chat/rooms/${chatRoom.id}/messages`,
        { content: newMessage },
        { headers }
      );
      
      console.log("7. API response:", res.data);
      
      // Replace temp message with real one from server
      setChatMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? res.data : msg)
      );
      console.log("8. Message sent successfully");
      
    } catch (err) {
      console.error("9. Error sending message:", err);
      console.error("10. Error response:", err.response?.data);
      
      // Remove temp message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      showNotification("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
      console.log("11. Done");
    }
  };

  if (!token) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="jumuia-dashboard"
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`notification ${notification.type}`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1 className="title">{jumuiaName || 'My Jumuia'}</h1>
          <p className="subtitle">Your jumuia community dashboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
          onClick={() => setActiveTab('contributions')}
        >
          💰 Contributions
        </button>
       
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* CONTRIBUTIONS TAB */}
        {activeTab === 'contributions' && (
          <div className="contributions-tab">
            {/* Stats Cards */}
            {contributions.length > 0 && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <span className="stat-value">KES {stats.totalPledged.toLocaleString()}</span>
                    <span className="stat-label">Total Pledged</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <span className="stat-value">KES {stats.totalPaid.toLocaleString()}</span>
                    <span className="stat-label">Amount Paid</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <span className="stat-value">KES {stats.totalPending.toLocaleString()}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.completedCount}/{contributions.length}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            {contributions.length > 0 && (
              <div className="filters">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All <span className="filter-count">{contributions.length}</span>
                </button>
                <button 
                  className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending <span className="filter-count">{stats.pendingCount}</span>
                </button>
                <button 
                  className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                  onClick={() => setFilter('approved')}
                >
                  Approved
                </button>
                <button 
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed <span className="filter-count">{stats.completedCount}</span>
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your contributions...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Unable to Load Contributions</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={() => fetchContributions()}>
                  Try Again
                </button>
              </div>
            )}

            {/* Refresh Indicator */}
            {refreshing && (
              <div className="refresh-indicator">
                <div className="refresh-spinner"></div>
                <span>Updating...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredContributions.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  {filter === 'pending' ? '⏳' : filter === 'approved' ? '✓' : filter === 'completed' ? '🎉' : '📋'}
                </div>
                <h3>No {filter === 'all' ? '' : filter} contributions</h3>
                <p>
                  {filter === 'all' 
                    ? "Your jumuia hasn't created any contributions yet." 
                    : filter === 'pending'
                    ? "You have no pledges awaiting approval."
                    : filter === 'approved'
                    ? "You have no approved pledges."
                    : "You have no completed contributions."}
                </p>
                {filter !== 'all' && (
                  <button className="reset-filter-btn" onClick={() => setFilter('all')}>
                    View All
                  </button>
                )}
              </div>
            )}

            {/* Contributions List */}
            {!loading && !error && filteredContributions.length > 0 && (
              <div className="contributions-list">
                {filteredContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    pledgeInput={pledgeInputs[contribution.id] || {}}
                    onPledgeChange={(field, value) => 
                      handleInputChange(contribution.id, field, value)
                    }
                    onPledge={() => handlePledge(contribution.id)}
                    isSubmitting={submitting[contribution.id]}
                    remainingAmount={calculateRemaining(contribution)}
                    isExpanded={expandedCard === contribution.id}
                    onToggle={() => setExpandedCard(
                      expandedCard === contribution.id ? null : contribution.id
                    )}
                    onOpenMessage={() => handleOpenMessage(contribution.id, contribution.title)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="announcements-tab">
            {loadingAnnouncements ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📢</div>
                <h3>No Announcements</h3>
                <p>There are no announcements for your jumuia yet.</p>
              </div>
            ) : (
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <div className="announcement-header">
                      <h3 className="announcement-title">{announcement.title}</h3>
                      <span className="announcement-category">{announcement.category}</span>
                    </div>
                    <p className="announcement-content">{announcement.content}</p>
                    <div className="announcement-footer">
                      <span className="announcement-author">
                        By: {announcement.author?.fullName || 'Unknown'}
                      </span>
                      <span className="announcement-date">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="chat-tab">
            {loadingChat ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading chat...</p>
              </div>
            ) : (
              <div className="chat-container">
                <div className="messages-list">
                  {chatMessages.length === 0 ? (
                    <div className="empty-chat">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-bubble ${message.userId === getCurrentUserId() ? 'own-message' : ''} ${message.isTemp ? 'temp-message' : ''}`}
                      >
                        <div className="message-header">
                          <strong>{message.user?.fullName || 'Unknown'}</strong>
                          <span className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="message-content">{message.content}</p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="chat-input"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="send-button"
                  >
                    {sendingMessage ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {messageThread && (
        <SimpleMessageModal
          pledgeId={messageThread.pledgeId}
          userName={messageThread.pledgeTitle}
          onClose={() => setMessageThread(null)}
        />
      )}

      <style>{`
        .jumuia-dashboard {
          min-height: 100vh;
          padding: 40px 15px;
          border-radius: 35px;
          background: linear-gradient(135deg, #1f1f21 0%, #264664 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Notification - Positioned below header */
        .notification {
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 90%;
        }
        .notification.success {
          background: #10b981;
        }
        .notification.error {
          background: #ef4444;
        }
        .notification.info {
          background: #3b82f6;
        }

        /* Header */
        .header {
          max-width: 1200px;
          margin: 0 auto 24px;
          position: relative;
          z-index: 10;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          margin: 0;
        }

        /* Tabs */
        .tabs {
          max-width: 1200px;
          margin: 0 auto 24px;
          display: flex;
          gap: 8px;
          border-bottom: 2px solid rgba(255,255,255,0.2);
          padding-bottom: 8px;
        }
        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: none;
          font-size: 16px;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }
        .tab-btn.active {
          color: white;
          border-bottom: 2px solid white;
          margin-bottom: -10px;
        }

        /* Stats Grid */
        .stats-grid {
          max-width: 1200px;
          margin: 0 auto 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .stat-content {
          flex: 1;
        }
        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .stat-label {
          display: block;
          font-size: 12px;
          color: #64748b;
        }

        /* Filters */
        .filters {
          max-width: 1200px;
          margin: 0 auto 24px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 8px 16px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .filter-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.5);
        }
        .filter-btn.active {
          background: white;
          border-color: white;
          color: #0f172a;
        }
        .filter-count {
          font-size: 12px;
          background: rgba(255,255,255,0.2);
          padding: 2px 6px;
          border-radius: 12px;
        }
        .filter-btn.active .filter-count {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Loading State */
        .loading-state {
          max-width: 1200px;
          margin: 80px auto;
          text-align: center;
          color: white;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Error State */
        .error-state {
          max-width: 400px;
          margin: 60px auto;
          text-align: center;
          padding: 32px 24px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .error-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .error-state p {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 20px;
        }
        .retry-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 10px;
          background: #0f172a;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        /* Refresh Indicator */
        .refresh-indicator {
          max-width: 1200px;
          margin: 0 auto 16px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .refresh-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Empty State */
        .empty-state {
          max-width: 400px;
          margin: 60px auto;
          text-align: center;
          padding: 48px 32px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          color: white;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px 0;
        }
        .empty-state p {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          margin-bottom: 24px;
        }
        .reset-filter-btn {
          padding: 10px 24px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .reset-filter-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Contributions List */
        .contributions-list {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Announcements */
        .announcements-list {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .announcement-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .announcement-title {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .announcement-category {
          padding: 4px 12px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 12px;
          color: #64748b;
        }
        .announcement-content {
          font-size: 14px;
          line-height: 1.6;
          color: #1e293b;
          margin: 0 0 16px 0;
        }
        .announcement-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }

        /* Chat */
        .chat-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          height: 600px;
          display: flex;
          flex-direction: column;
        }
        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message-bubble {
          max-width: 70%;
          padding: 12px;
          background: #f1f5f9;
          border-radius: 12px;
          align-self: flex-start;
        }
        .message-bubble.own-message {
          align-self: flex-end;
          background: #2563eb;
          color: white;
        }
        .message-bubble.temp-message {
          opacity: 0.7;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .own-message .message-header {
          color: rgba(255,255,255,0.8);
        }
        .message-time {
          font-size: 10px;
          opacity: 0.7;
        }
        .message-content {
          font-size: 14px;
          margin: 0;
        }
        .empty-chat {
          text-align: center;
          color: #94a3b8;
          padding: 40px;
        }
        .chat-input-area {
          display: flex;
          padding: 16px;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
          background: white;
        }
        .chat-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }
        .chat-input:focus {
          border-color: #2563eb;
        }
        .send-button {
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

// Contribution Card Component
const ContributionCard = ({ 
  contribution, 
  pledgeInput, 
  onPledgeChange, 
  onPledge, 
  isSubmitting,
  remainingAmount,
  isExpanded,
  onToggle,
  onOpenMessage
}) => {
  // Safely access properties with defaults
  const amountPaid = contribution.amountPaid || 0;
  const pendingAmount = contribution.pendingAmount || 0;
  const amountRequired = contribution.amountRequired || 0;
  
  const completed = amountPaid >= amountRequired;
  const status = completed ? "COMPLETED" : contribution.status || "PENDING";
  
  const paidPercentage = amountRequired > 0 ? Math.min((amountPaid / amountRequired) * 100, 100) : 0;
  const pendingPercentage = amountRequired > 0 ? Math.min((pendingAmount / amountRequired) * 100, 100) : 0;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getStatusColor = () => {
    if (completed) return '#059669';
    if (contribution.status === "APPROVED") return '#2563eb';
    if (contribution.status === "PENDING" && pendingAmount > 0) return '#d97706';
    return '#64748b';
  };

  const getStatusBg = () => {
    if (completed) return '#d1fae5';
    if (contribution.status === "APPROVED") return '#dbeafe';
    if (contribution.status === "PENDING" && pendingAmount > 0) return '#fef3c7';
    return '#f1f5f9';
  };

  const getStatusText = () => {
    if (completed) return 'Completed';
    if (contribution.status === "APPROVED") return 'Approved';
    if (contribution.status === "PENDING" && pendingAmount > 0) return 'Pending';
    return 'No Pledge';
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`contribution-card ${isSubmitting ? 'submitting' : ''}`}
    >
      {/* Card Header */}
      <div className="card-header" onClick={onToggle}>
        <div className="header-main">
          <h3 className="card-title">{contribution.title}</h3>
          {contribution.description && (
            <p className="card-description">{contribution.description}</p>
          )}
        </div>
        
        <div className="header-right">
          <span 
            className="status-badge"
            style={{ 
              background: getStatusBg(),
              color: getStatusColor()
            }}
          >
            {getStatusText()}
          </span>
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="stat-label">Required</span>
            <span className="stat-number">KES {formatNumber(amountRequired)}</span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Paid</span>
            <span className="stat-number paid">KES {formatNumber(amountPaid)}</span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Pending</span>
            <span className="stat-number pending">KES {formatNumber(pendingAmount)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-segment paid" 
              style={{ width: `${paidPercentage}%` }}
            />
            <div 
              className="progress-segment pending" 
              style={{ width: `${pendingPercentage}%` }}
            />
          </div>
          <div className="progress-labels">
            <span className="progress-label">
              <span className="dot paid"></span>
              Paid: {paidPercentage.toFixed(0)}%
            </span>
            <span className="progress-label">
              <span className="dot pending"></span>
              Pending: {pendingPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="expanded-content"
          >
            {/* Full Description */}
            {contribution.description && (
              <div className="detail-section">
                <h4 className="section-title">About</h4>
                <p className="section-text">{contribution.description}</p>
              </div>
            )}

            {/* Detailed Breakdown */}
            <div className="detail-section">
              <h4 className="section-title">Breakdown</h4>
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span>Amount Required</span>
                  <span className="breakdown-value">KES {formatNumber(amountRequired)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Amount Paid</span>
                  <span className="breakdown-value paid">KES {formatNumber(amountPaid)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Pending Approval</span>
                  <span className="breakdown-value pending">KES {formatNumber(pendingAmount)}</span>
                </div>
                <div className="breakdown-item total">
                  <span>Remaining to Pay</span>
                  <span className="breakdown-value">KES {formatNumber(remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Pledge Form */}
            {!completed && (
              <div className="detail-section">
                <h4 className="section-title">Make a Pledge</h4>
                <div className="pledge-form">
                  <div className="input-group">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="pledge-input"
                      value={pledgeInput.amount || ""}
                      onChange={(e) => onPledgeChange("amount", e.target.value)}
                      max={remainingAmount}
                      min={1}
                      disabled={isSubmitting}
                    />
                    <span className="input-hint">Max: KES {formatNumber(remainingAmount)}</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Add a message (optional)"
                    className="pledge-input message"
                    value={pledgeInput.message || ""}
                    onChange={(e) => onPledgeChange("message", e.target.value)}
                    disabled={isSubmitting}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`pledge-btn ${isSubmitting ? 'submitting' : ''}`}
                      onClick={onPledge}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Pledge'}
                    </button>
                    
                    <button 
                      className="message-btn"
                      onClick={onOpenMessage}
                      disabled={isSubmitting}
                      title="Ask a question about this pledge"
                    >
                      💬
                    </button>
                  </div>
                </div>
                <p className="form-note">
                  Your pledge will be pending until approved by an administrator.
                </p>
              </div>
            )}

            {/* Completed Message */}
            {completed && (
              <div className="completed-message">
                <span className="completed-icon">🎉</span>
                <div>
                  <h4>Contribution Completed!</h4>
                  <p>Thank you for your generous contribution.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .contribution-card {
          background: white;
          border-radius: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.2s;
        }
        .contribution-card.submitting {
          opacity: 0.7;
          pointer-events: none;
        }

        .card-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .card-header:hover {
          background: #f8fafc;
        }
        .header-main {
          flex: 1;
          min-width: 0;
        }
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .card-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .expand-icon {
          width: 24px;
          height: 24px;
          border-radius: 30px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 500;
          color: #64748b;
        }

        .progress-overview {
          padding: 0 20px 20px;
        }
        .progress-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .progress-stat {
          text-align: center;
        }
        .stat-label {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 2px;
        }
        .stat-number {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .stat-number.paid {
          color: #10b981;
        }
        .stat-number.pending {
          color: #f59e0b;
        }
        .progress-bar-container {
          margin-top: 8px;
        }
        .progress-bar {
          display: flex;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-segment {
          height: 100%;
          transition: width 0.3s;
        }
        .progress-segment.paid {
          background: #10b981;
        }
        .progress-segment.pending {
          background: #f59e0b;
        }
        .progress-labels {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
        }
        .progress-label {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot.paid {
          background: #10b981;
        }
        .dot.pending {
          background: #f59e0b;
        }

        .expanded-content {
          border-top: 1px solid #f1f5f9;
          padding: 20px;
        }
        .detail-section {
          margin-bottom: 24px;
        }
        .detail-section:last-child {
          margin-bottom: 0;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 12px 0;
        }
        .section-text {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        .breakdown-list {
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px;
        }
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        .breakdown-item:last-child {
          border-bottom: none;
        }
        .breakdown-item.total {
          margin-top: 4px;
          padding-top: 12px;
          border-top: 2px solid #e2e8f0;
          font-weight: 600;
          color: #0f172a;
        }
        .breakdown-value {
          font-weight: 500;
        }
        .breakdown-value.paid {
          color: #10b981;
        }
        .breakdown-value.pending {
          color: #f59e0b;
        }

        .pledge-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .input-group {
          position: relative;
        }
        .pledge-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .pledge-input:focus {
          outline: none;
          border-color: #0f172a;
        }
        .input-hint {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: #94a3b8;
        }
        .pledge-btn {
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #0f172a;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pledge-btn:hover:not(:disabled) {
          background: #1e293b;
        }
        .pledge-btn.submitting {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .message-btn {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 10px;
          background: #8b5cf6;
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .message-btn:hover:not(:disabled) {
          background: #7c3aed;
        }
        .form-note {
          margin-top: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .completed-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f0fdf4;
          border-radius: 12px;
        }
        .completed-icon {
          font-size: 24px;
        }
        .completed-message h4 {
          font-size: 14px;
          font-weight: 600;
          color: #059669;
          margin: 0 0 2px 0;
        }
        .completed-message p {
          font-size: 13px;
          color: #475569;
          margin: 0;
        }
      `}</style>
    </motion.div>
  );
};

export default JumuiaDashboard;