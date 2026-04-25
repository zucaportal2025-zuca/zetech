// frontend/src/pages/admin/SimpleMessageModal.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import BASE_URL from "../api";

const SimpleMessageModal = ({ pledgeId, userName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [pledgeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/pledges/${pledgeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      
      // Mark as read
      await axios.put(`${BASE_URL}/api/pledges/${pledgeId}/messages/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      content: newMessage,
      userId: user.id,
      isAdmin,
      createdAt: new Date().toISOString(),
      user: { fullName: user.fullName, role: user.role },
      temp: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    scrollToBottom();

    try {
      const res = await axios.post(
        `${BASE_URL}/api/pledges/${pledgeId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? res.data : msg)
      );
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date().toDateString();
    const msgDate = new Date(date).toDateString();
    
    if (today === msgDate) return "Today";
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === msgDate) return "Yesterday";
    
    return new Date(date).toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="message-modal-overlay">
      <div className="message-modal">
        <div className="modal-header">
          <h3>Messages - {userName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading-spinner">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start a conversation!</div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="date-divider">{date}</div>
                {msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.isAdmin ? 'admin' : 'user'} ${msg.temp ? 'temp' : ''}`}
                  >
                    <div className="message-header">
                      <span className="sender">
                        {msg.isAdmin ? '👑 Admin' : msg.user?.fullName || 'User'}
                      </span>
                      <span className="time">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                    {msg.temp && <div className="sending-indicator">Sending...</div>}
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input-area">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`${isAdmin ? 'Reply to user...' : 'Ask a question...'}`}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="send-btn"
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        .message-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .message-modal {
          width: 500px;
          max-width: 90%;
          height: 600px;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .close-btn:hover {
          background: #f1f5f9;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8fafc;
        }
        .date-divider {
          text-align: center;
          margin: 16px 0;
          font-size: 11px;
          color: #64748b;
          position: relative;
        }
        .date-divider::before,
        .date-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: #e2e8f0;
        }
        .date-divider::before { left: 0; }
        .date-divider::after { right: 0; }
        .message {
          margin-bottom: 12px;
          max-width: 80%;
        }
        .message.user {
          margin-right: auto;
        }
        .message.admin {
          margin-left: auto;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 11px;
          padding: 0 4px;
        }
        .sender {
          font-weight: 600;
        }
        .message.user .sender {
          color: #2563eb;
        }
        .message.admin .sender {
          color: #059669;
        }
        .time {
          color: #64748b;
        }
        .message-content {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          word-wrap: break-word;
          background: white;
          border: 1px solid #e2e8f0;
        }
        .message.admin .message-content {
          background: #2563eb;
          color: white;
          border: none;
        }
        .message.temp {
          opacity: 0.6;
        }
        .sending-indicator {
          font-size: 10px;
          color: #64748b;
          margin-top: 4px;
          text-align: right;
        }
        .message-input-area {
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
        }
        .message-input-area textarea {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: none;
          min-height: 40px;
          max-height: 100px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
        }
        .message-input-area textarea:focus {
          outline: none;
          border-color: #2563eb;
        }
        .send-btn {
          padding: 0 20px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          align-self: flex-end;
          height: 40px;
        }
        .send-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .loading-spinner, .no-messages {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default SimpleMessageModal;