// frontend/src/pages/Contributions.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "../api";
import io from "socket.io-client";
import SimpleMessageModal from "./SimpleMessageModal";

function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pledgeInputs, setPledgeInputs] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [expandedCard, setExpandedCard] = useState(null);
  const [filter, setFilter] = useState("all");
  // NEW: State for message modal
  const [messageThread, setMessageThread] = useState(null);
  
  const fetchAttempted = useRef(false);
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
      
      // Better messages based on what changed
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

    // NEW: Listen for new messages
    socket.on('new_message', (message) => {
      // Find which pledge this message belongs to
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
      if (!refreshing) {
        silentRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const silentRefresh = useCallback(async () => {
    if (!token || refreshing) return;
    
    try {
      const res = await axios.get(`${BASE_URL}/api/my-pledges`, { headers });
      setContributions(res.data);
      console.log('Background refresh completed');
    } catch (err) {
      console.error("Background refresh error:", err);
    }
  }, [token, headers, refreshing]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

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
    const res = await axios.get(`${BASE_URL}/api/my-pledges`, { headers });
    
    // Filter out jumuia-specific contributions
    const userContributions = res.data.filter(c => !c.jumuiaId);
    
    setContributions(userContributions);
  } catch (err) {
    setError(err.response?.data?.error || "Failed to fetch contributions");
  } finally {
    setLoading(false);
    setRefreshing(false);
    fetchAttempted.current = true;
  }
}, [token, headers]);

  useEffect(() => {
    if (token && !fetchAttempted.current) {
      fetchContributions();
    }
  }, [token, fetchContributions]);

  // FIXED: calculateRemaining now correctly shows what's left to pay
  const calculateRemaining = (contribution) => {
    return contribution.amountRequired - contribution.amountPaid;
  };

  // NEW: Handle opening message thread
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

    if (!amount || parsedAmount <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }
    
    // FIXED: Check against correct remaining amount
    const remaining = calculateRemaining(contribution);
    if (parsedAmount > remaining) {
      showNotification(`Amount cannot exceed KES ${remaining.toLocaleString()}`, "error");
      return;
    }

    setSubmitting(prev => ({ ...prev, [contributionId]: true }));

    optimisticUpdate(contributionId, {
      pendingAmount: contribution.pendingAmount + parsedAmount,
      message: message?.trim() || contribution.message
    });

    setPledgeInputs(prev => ({
      ...prev,
      [contributionId]: { amount: "", message: "" }
    }));

    try {
      await axios.post(
        `${BASE_URL}/api/pledges/${contribution.contributionTypeId}`,
        { 
          amount: parsedAmount, 
          message: message?.trim() || "" 
        },
        { headers }
      );

      showNotification("Pledge submitted successfully!", "success");
    } catch (err) {
      await fetchContributions(true);
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

  // FIXED: Added totalRequired and progressPercentage to stats
  const stats = {
    totalPledged: contributions.reduce((sum, c) => sum + c.amountPaid + c.pendingAmount, 0),
    totalPaid: contributions.reduce((sum, c) => sum + c.amountPaid, 0),
    totalPending: contributions.reduce((sum, c) => sum + c.pendingAmount, 0),
    completedCount: contributions.filter(c => c.amountPaid >= c.amountRequired).length,
    pendingCount: contributions.filter(c => c.status === "PENDING" && c.pendingAmount > 0).length,
    totalRequired: contributions.reduce((sum, c) => sum + c.amountRequired, 0),
    progressPercentage: contributions.length > 0 
      ? (contributions.reduce((sum, c) => sum + c.amountPaid, 0) / 
         contributions.reduce((sum, c) => sum + c.amountRequired, 0) * 100).toFixed(1)
      : 0
  };

  if (!token) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="contributions-page"
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
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
          <h1 className="title">My Contributions</h1>
          <p className="subtitle">Track and manage your pledges</p>
        </div>
        <button 
          onClick={() => fetchContributions(true)}
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          disabled={refreshing}
        >
          <span className="refresh-icon">↻</span>
        </button>
      </div>

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
              ? "You haven't made any contributions yet." 
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

      {/* Message Modal */}
      {messageThread && (
        <SimpleMessageModal
          pledgeId={messageThread.pledgeId}
          userName={messageThread.pledgeTitle}
          onClose={() => setMessageThread(null)}
        />
      )}

     <style>{`
        .contributions-page {
          min-height: 10vh;
          padding: 40px 15px;
          background: #f8fafc87;
          border-radius: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Notification */
        .notification {
          position: fixed;
          top: 20px;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left {
          flex: 1;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        .refresh-btn {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: white;
          color: #64748b;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .refresh-btn:hover {
          background: #f1f5f9;
          transform: rotate(90deg);
        }
        .refresh-btn.refreshing .refresh-icon {
          animation: spin 1s linear infinite;
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Stats Grid */
        .stats-grid {
          max-width: 1200px;
          margin: 0 auto 24px;

        margin-bottom: 20px;
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
          margin-bottom: 10px;
          border-radius: 16px;
          padding: 16px;
          margintop: 43px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          background: #45e41dab;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .stat-content {
          flex: 1;
          min-width: 0;
        }
        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .filter-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .filter-btn.active {
          background: #0f172a;
          border-color: #0f172a;
          gap: 6px;
          color: white;
        }
        .filter-count {
          font-size: 12px;
          background: rgba(255,255,255,0.2);
          padding: 1px 6px;
          gap: 6px;
          margin-Top: 80px;
          margin: 0px auto;
          border-radius: 12px;
        }
        .filter-btn.active .filter-count {
          background: rgba(255,255,255,0.2);
        }

        /* Loading State */
        .loading-state {
          max-width: 1200px;
          margin: 80px auto;
          text-align: center;
          color: #64748b;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 3px solid #e2e8f0;
          border-top-color: #0f172a;
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0f172a;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .refresh-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Empty State */
        .empty-state {
          max-width: 400px;
          margin: 60px auto;
          text-align: center;
          padding: 48px 32px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .empty-state p {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .reset-filter-btn {
          padding: 10px 24px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        /* Contributions List */
        .contributions-list {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .title {
            font-size: 24px;
          }
          .stat-card {
            padding: 12px;
          }
          .stat-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
          .stat-value {
            font-size: 16px;
          }
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
  onOpenMessage  // NEW prop
}) => {
  const completed = contribution.amountPaid >= contribution.amountRequired;
  const status = completed ? "COMPLETED" : contribution.status;
  
  const paidPercentage = Math.min((contribution.amountPaid / contribution.amountRequired) * 100, 100);
  const pendingPercentage = Math.min((contribution.pendingAmount / contribution.amountRequired) * 100, 100);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = () => {
    if (completed) return '#059669';
    if (contribution.status === "APPROVED") return '#2563eb';
    if (contribution.status === "PENDING" && contribution.pendingAmount > 0) return '#d97706';
    return '#64748b';
  };

  const getStatusBg = () => {
    if (completed) return '#d1fae5';
    if (contribution.status === "APPROVED") return '#dbeafe';
    if (contribution.status === "PENDING" && contribution.pendingAmount > 0) return '#fef3c7';
    return '#f1f5f9';
  };

  const getStatusText = () => {
    if (completed) return 'Completed';
    if (contribution.status === "APPROVED") return 'Approved';
    if (contribution.status === "PENDING" && contribution.pendingAmount > 0) return 'Pending';
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
            <span className="stat-number">KES {formatNumber(contribution.amountRequired)}</span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Paid</span>
            <span className="stat-number paid">KES {formatNumber(contribution.amountPaid)}</span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Pending</span>
            <span className="stat-number pending">KES {formatNumber(contribution.pendingAmount)}</span>
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
                  <span className="breakdown-value">KES {formatNumber(contribution.amountRequired)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Amount Paid</span>
                  <span className="breakdown-value paid">KES {formatNumber(contribution.amountPaid)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Pending Approval</span>
                  <span className="breakdown-value pending">KES {formatNumber(contribution.pendingAmount)}</span>
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
                    
                    {/* NEW: Message button */}
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: all 0.2s;
        }
        .contribution-card.submitting {
          opacity: 0.7;
          pointer-events: none;
        }

        /* Card Header */
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
          font-weight: 800;
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

        /* Progress Overview */
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
          background: #f1f5f9f4;
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

        /* Expanded Content */
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

        /* Breakdown List */
        .breakdown-list {
          background: #f8fafc23;
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

        /* Pledge Form */
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
        .pledge-input.message {
          padding: 12px;
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
        .message-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-note {
          margin-top: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        /* Completed Message */
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

        @media (max-width: 480px) {
          .card-header {
            padding: 16px;
            flex-wrap: wrap;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          .progress-stats {
            gap: 8px;
          }
          .stat-number {
            font-size: 14px;
          }
          .expanded-content {
            padding: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Contributions;