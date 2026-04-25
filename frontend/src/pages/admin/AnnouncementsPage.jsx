// frontend/src/pages/admin/AnnouncementsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiX, FiEdit2, FiTrash2, FiBell, 
  FiClock, FiCalendar, FiCheck, FiAlertCircle,
  FiRefreshCw, FiSearch, FiFilter, FiTag, FiLoader
} from "react-icons/fi";
import { MdOutlineAnnouncement } from "react-icons/md";
import { BsMegaphone } from "react-icons/bs";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import backgroundImg from "../../assets/background.png";
import BASE_URL from "../../api";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const socketRef = useRef(null);

  // Socket connection for real-time updates
  useEffect(() => {
    const initSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        const socket = io(BASE_URL, {
          withCredentials: true,
          transports: ['polling', 'websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to announcements feed');
        });

        socket.on('new_announcement', (announcement) => {
          setAnnouncements(prev => [announcement, ...prev]);
          toast.success("New announcement posted!", {
            icon: '🔔',
            duration: 3000,
          });
        });

        socket.on('announcement_updated', (updated) => {
          setAnnouncements(prev => 
            prev.map(a => a.id === updated.id ? updated : a)
          );
        });

        socket.on('announcement_deleted', (id) => {
          setAnnouncements(prev => prev.filter(a => a.id !== id));
        });

        socket.on('connect_error', (error) => {
          console.log('Socket connection error:', error.message);
        });
      } catch (err) {
        console.log('Socket.IO not available, falling back to polling');
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch announcements
  const fetchAnnouncements = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Fetch Announcements Error:", err);
      setError("Failed to load announcements.");
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAdd = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    
    const newAnnouncement = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category: category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setTitle("");
    setContent("");
    setCategory("General");
    setShowForm(false);
    
    const loadingToast = toast.loading("Publishing announcement...");

    try {
      const res = await axios.post(
        `${BASE_URL}/api/announcements`,
        { 
          title: title.trim(), 
          content: content.trim(),
          category: category 
        },
        { headers }
      );
      
      // Replace optimistic with real data
      setAnnouncements(prev => 
        prev.map(a => a.id === newAnnouncement.id ? res.data : a)
      );
      
      toast.success("Announcement published!", { id: loadingToast });
    } catch (err) {
      console.error("Add Announcement Error:", err);
      // Remove optimistic on error
      setAnnouncements(prev => prev.filter(a => a.id !== newAnnouncement.id));
      toast.error("Failed to publish announcement", { id: loadingToast });
      // Re-open form on error
      setShowForm(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    // Prevent double submission
    if (isUpdating) return;
    
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsUpdating(true);
    
    const originalAnnouncement = announcements.find(a => a.id === id);
    
    // Optimistic update
    setAnnouncements(prev => 
      prev.map(a => a.id === id ? {
        ...a,
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        updatedAt: new Date().toISOString()
      } : a)
    );
    
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditCategory("");
    
    const loadingToast = toast.loading("Updating announcement...");

    try {
      await axios.put(
        `${BASE_URL}/api/announcements/${id}`,
        { 
          title: editTitle.trim(), 
          content: editContent.trim(),
          category: editCategory 
        },
        { headers }
      );
      
      toast.success("Announcement updated!", { id: loadingToast });
    } catch (err) {
      console.error("Update Announcement Error:", err);
      // Revert optimistic update
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? originalAnnouncement : a)
      );
      toast.error("Failed to update announcement", { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteConfirmId(null);
    
    const originalAnnouncement = announcements.find(a => a.id === id);
    
    // Optimistic delete
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    
    const loadingToast = toast.loading("Deleting announcement...");

    try {
      await axios.delete(`${BASE_URL}/api/announcements/${id}`, { headers });
      toast.success("Announcement deleted", { id: loadingToast });
    } catch (err) {
      console.error("Delete Announcement Error:", err);
      // Revert optimistic delete
      setAnnouncements(prev => [originalAnnouncement, ...prev]);
      toast.error("Failed to delete announcement", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (announcement) => {
    setEditingId(announcement.id);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditCategory(announcement.category || 'General');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditCategory("");
  };

  // Calculate stats
  const stats = {
    total: announcements.length,
    categories: new Set(announcements.map(a => a.category || 'General')).size
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(announcements.map(a => a.category || 'General'))];

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
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
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Mass': return { bg: '#8b5cf6', light: '#ede9fe' };
      case 'Event': return { bg: '#10b981', light: '#d1fae5' };
      case 'Urgent': return { bg: '#ef4444', light: '#fee2e2' };
      case 'Reminder': return { bg: '#f59e0b', light: '#fef3c7' };
      default: return { bg: '#3b82f6', light: '#dbeafe' };
    }
  };

  // Delete confirmation modal
  const DeleteConfirmModal = ({ id, onConfirm, onCancel }) => (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <FiAlertCircle />
        </div>
        <h3>Delete Announcement</h3>
        <p>Are you sure you want to delete this announcement? This action cannot be undone.</p>
        <div className="confirm-buttons">
          <button className="btn-cancel" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button className="btn-confirm-delete" onClick={() => onConfirm(id)} disabled={isDeleting}>
            {isDeleting ? <FiLoader className="spinning" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="announcements-page"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      
      <div className="overlay"></div>

      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="title-icon">
              <BsMegaphone />
            </div>
            <div>
              <h1 className="page-title">Announcements</h1>
              <p className="page-subtitle">Manage and publish announcements</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={() => fetchAnnouncements(true)}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
              disabled={isSubmitting}
            >
              {showForm ? <FiX /> : <FiPlus />}
              <span>{showForm ? 'Cancel' : 'New Announcement'}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <MdOutlineAnnouncement />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Announcements</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon categories">
              <FiTag />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.categories}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              className="form-card"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="form-title">Create New Announcement</h3>
              
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Sunday Service Update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  <option value="General">General</option>
                  <option value="Mass">Mass</option>
                  <option value="Event">Event</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Reminder">Reminder</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  placeholder="Write your announcement here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="form-textarea"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className={`btn-primary ${isSubmitting ? 'loading' : ''}`}
                  onClick={handleAdd}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="spinning" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      Publish Announcement
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="content-area">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading announcements...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <FiAlertCircle className="error-icon" />
              <p>{error}</p>
              <button 
                className="btn-secondary"
                onClick={() => fetchAnnouncements()}
              >
                Try Again
              </button>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <BsMegaphone />
              </div>
              <h3>No announcements found</h3>
              <p>
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first announcement to get started'}
              </p>
              {!searchTerm && filterCategory === 'all' && (
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <FiPlus /> Create Announcement
                </button>
              )}
            </div>
          ) : (
            <div className="announcements-list">
              {filteredAnnouncements.map((announcement, index) => {
                const categoryColor = getCategoryColor(announcement.category);
                return (
                  <motion.div
                    key={announcement.id}
                    className="announcement-card"
                    style={{ borderLeftColor: categoryColor.bg }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {editingId === announcement.id ? (
                      // Edit Mode
                      <div className="edit-mode">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="edit-input"
                          placeholder="Title"
                          disabled={isUpdating}
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="edit-select"
                          disabled={isUpdating}
                        >
                          <option value="General">General</option>
                          <option value="Mass">Mass</option>
                          <option value="Event">Event</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Reminder">Reminder</option>
                        </select>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="edit-textarea"
                          placeholder="Content"
                          disabled={isUpdating}
                        />
                        <div className="edit-actions">
                          <button 
                            className="btn-secondary btn-small"
                            onClick={cancelEdit}
                            disabled={isUpdating}
                          >
                            Cancel
                          </button>
                          <button 
                            className={`btn-primary btn-small ${isUpdating ? 'loading' : ''}`}
                            onClick={() => handleUpdate(announcement.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <>
                                <FiLoader className="spinning" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="card-header">
                          <div className="card-meta">
                            <span 
                              className="card-category"
                              style={{ 
                                background: categoryColor.light,
                                color: categoryColor.bg
                              }}
                            >
                              {announcement.category || 'General'}
                            </span>
                            <span className="card-date">
                              <FiClock /> {formatDate(announcement.createdAt)}
                            </span>
                          </div>
                          <div className="card-actions">
                            <button 
                              className="action-btn edit"
                              onClick={() => startEdit(announcement)}
                              title="Edit"
                              disabled={isUpdating || isDeleting}
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="action-btn delete"
                              onClick={() => setDeleteConfirmId(announcement.id)}
                              title="Delete"
                              disabled={isUpdating || isDeleting}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="card-title">{announcement.title}</h3>
                        <p className="card-content">{announcement.content}</p>
                        
                        {announcement.updatedAt !== announcement.createdAt && (
                          <span className="edited-badge">
                            Edited {formatDate(announcement.updatedAt)}
                          </span>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal 
          id={deleteConfirmId}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      <style>{`
        .announcements-page {
          min-height: 100vh;
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          padding: 20px;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%);
          z-index: 0;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .title-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .page-title {
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .page-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .refresh-btn {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 20px;
        }
        .refresh-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.25);
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: white;
          color: #1e293b;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 10px -1px rgba(0,0,0,0.15);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .btn-primary.loading {
          opacity: 0.8;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 13px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .stat-icon.total {
          background: rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }
        .stat-icon.categories {
          background: rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .stat-label {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,0.9);
        }

        /* Search and Filter */
        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.7);
          font-size: 18px;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.2);
        }
        .search-input::placeholder {
          color: rgba(255,255,255,0.6);
        }

        .filter-select {
          padding: 12px 20px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          min-width: 150px;
        }
        .filter-select option {
          background: #1e293b;
          color: white;
        }

        /* Form Card */
        .form-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
          border: 1px solid #e2e8f0;
        }

        .form-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #1e293b;
          font-size: 14px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-input:disabled,
        .form-select:disabled,
        .form-textarea:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        /* Content Area */
        .content-area {
          min-height: 400px;
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          color: white;
        }

        .spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error State */
        .error-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          color: #1e293b;
          border: 1px solid #fee2e2;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #ef4444;
        }

        .error-state p {
          margin-bottom: 20px;
          font-size: 16px;
          color: #64748b;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          color: #1e293b;
          border: 2px dashed #e2e8f0;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #1e293b;
        }

        .empty-state p {
          color: #64748b;
          margin-bottom: 20px;
        }

        /* Announcements List */
        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .announcement-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
          position: relative;
          border-left-width: 4px;
          border-left-style: solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .announcement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .card-category {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-date {
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .card-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .announcement-card:hover .card-actions {
          opacity: 1;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.edit:hover:not(:disabled) {
          background: #dbeafe;
          color: #2563eb;
        }
        .action-btn.delete:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px;
          line-height: 1.4;
        }

        .card-content {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 12px;
          white-space: pre-wrap;
        }

        .edited-badge {
          font-size: 11px;
          color: #94a3b8;
          font-style: italic;
          display: block;
        }

        /* Edit Mode */
        .edit-mode {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-input,
        .edit-select,
        .edit-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #1e293b;
          font-size: 14px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .edit-input:focus,
        .edit-select:focus,
        .edit-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .edit-input:disabled,
        .edit-select:disabled,
        .edit-textarea:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .edit-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        /* Delete Confirmation Modal */
        .confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .confirm-modal {
          background: white;
          border-radius: 20px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: fadeInUp 0.2s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .confirm-icon {
          width: 56px;
          height: 56px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          color: #ef4444;
        }

        .confirm-modal h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px;
        }

        .confirm-modal p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px;
        }

        .confirm-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-cancel {
          padding: 10px 20px;
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }
        .btn-cancel:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-confirm-delete {
          padding: 10px 20px;
          background: #ef4444;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-confirm-delete:hover:not(:disabled) {
          background: #dc2626;
        }
        .btn-confirm-delete:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .search-filter-bar {
            flex-direction: column;
          }

          .filter-select {
            width: 100%;
          }

          .card-actions {
            opacity: 1;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .card-header {
            flex-direction: column;
            gap: 8px;
          }

          .card-meta {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}