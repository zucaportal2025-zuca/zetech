// frontend/src/components/NotificationPrompt.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck, FaMobileAlt } from 'react-icons/fa';
import pushService from '../services/pushService';

export default function NotificationPrompt({ onClose }) {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    
    try {
      const granted = await pushService.requestPermission();
      if (granted) {
        await pushService.registerServiceWorker();
        await pushService.subscribe();
        setVisible(false);
        if (onClose) onClose();
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible || permission === 'granted') return null;

  return (
    <motion.div
      className="notification-prompt"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="icon-wrapper">
        <FaBell size={24} color="#3b82f6" />
      </div>
      <div className="content">
        <h4 className="title">Stay Updated</h4>
        <p className="message">
          Get notified about new announcements, mass programs, and contribution updates
        </p>
        <div className="badge">
          <FaMobileAlt size={12} />
          <span>Works even when app is closed</span>
        </div>
      </div>
      <div className="actions">
        <button onClick={handleDismiss} className="dismiss-btn" title="Not now">
          <FaTimes />
        </button>
        <button 
          onClick={handleEnable} 
          className="enable-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              <FaCheck size={12} />
              <span>Enable</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        .notification-prompt {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 360px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1);
          padding: 20px;
          display: flex;
          gap: 16px;
          z-index: 9999;
          border: 1px solid #e2e8f0;
          backdrop-filter: blur(10px);
        }

        .icon-wrapper {
          width: 48px;
          height: 48px;
          background: #eff6ff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .content {
          flex: 1;
        }

        .title {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .message {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .actions {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .dismiss-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dismiss-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .enable-btn {
          padding: 0 16px;
          height: 36px;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .enable-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .enable-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .notification-prompt {
            width: calc(100% - 32px);
            bottom: 16px;
            right: 16px;
            left: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
}