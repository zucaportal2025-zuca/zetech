// frontend/src/pages/admin/Hymns.jsx
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus,
  FiSearch,
  FiX,
  FiSave,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiMaximize2,
  FiMinimize2,
  FiCopy,
  FiRefreshCw,
  FiLoader
} from "react-icons/fi";
import { GiPrayerBeads } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../api";

export default function AdminHymns() {
  const navigate = useNavigate();
  const [hymns, setHymns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalHymns, setTotalHymns] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    reference: "",
    lyrics: ""
  });
  const [previewMode, setPreviewMode] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsFullScreen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin" || user?.specialRole === "secretary" || user?.specialRole === "choir_moderator";

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch hymns
  const fetchHymns = useCallback(async (pageNum = 1, search = '', reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (search) params.append('search', search);
      
      const res = await axios.get(`${BASE_URL}/api/admin/songs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (reset || pageNum === 1) {
        setHymns(res.data.songs || []);
      } else {
        setHymns(prev => [...prev, ...(res.data.songs || [])]);
      }
      
      setHasMore(res.data.hasMore || false);
      if (res.data.total) setTotalHymns(res.data.total);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => { fetchHymns(1, '', true); }, []);

  // Search effect
  useEffect(() => {
    setPage(1);
    fetchHymns(1, debouncedSearch, true);
  }, [debouncedSearch]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
      fetchHymns(page + 1, debouncedSearch);
    }
  };

  // Add hymn with loading effect
  const handleAdd = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/admin/songs`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHymns(prev => [res.data, ...prev]);
      setTotalHymns(prev => prev + 1);
      setShowAddModal(false);
      resetForm();
      showToast("✅ Hymn added successfully");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to add hymn");
    } finally {
      setSaving(false);
    }
  };

  // Edit hymn with loading effect
  const handleEdit = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/songs/${selectedHymn.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHymns(prev => prev.map(h => h.id === selectedHymn.id ? res.data : h));
      setShowEditModal(false);
      resetForm();
      showToast("✅ Hymn updated successfully");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to update hymn");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/admin/songs/${selectedHymn.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHymns(prev => prev.filter(h => h.id !== selectedHymn.id));
      setTotalHymns(prev => prev - 1);
      setShowDeleteModal(false);
      setSelectedHymn(null);
      showToast("✅ Hymn deleted");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to delete hymn");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", reference: "", lyrics: "" });
    setSelectedHymn(null);
  };

  const openEditModal = (hymn) => {
    setSelectedHymn(hymn);
    setFormData({
      title: hymn.title || "",
      reference: hymn.reference || "",
      lyrics: hymn.lyrics || ""
    });
    setShowEditModal(true);
    setIsFullScreen(isMobile);
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = toastStyle;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatLyrics = (lyrics) => {
    if (!lyrics) return [];
    return lyrics.split('\n\n').filter(v => v.trim() !== '');
  };

  const getVerseCount = () => {
    return formatLyrics(formData.lyrics).length;
  };

  const getLineCount = () => {
    if (!formData.lyrics) return 0;
    return formData.lyrics.split('\n').length;
  };

  const cleanFormatting = () => {
    if (formData.lyrics) {
      const cleaned = formData.lyrics
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[^\S\n]+/g, ' ')
        .trim();
      setFormData({ ...formData, lyrics: cleaned });
      showToast("✨ Formatting cleaned");
    }
  };

  const insertSample = () => {
    const sample = `Verse 1 line 1
Verse 1 line 2
Verse 1 line 3

Verse 2 line 1
Verse 2 line 2

Verse 3 line 1
Verse 3 line 2
Verse 3 line 3`;
    setFormData({ ...formData, lyrics: sample });
  };

  if (loading && page === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.skeletonHeader} />
        <div style={styles.skeletonGrid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.skeletonCard}>
              <div style={styles.skeletonIcon} />
              <div style={styles.skeletonContent}>
                <div style={styles.skeletonTitle} />
                <div style={styles.skeletonLine} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.container}>
      
      {/* Header */}
      <div style={styles.headerSection}>
        <div style={styles.headerTop}>
          <div style={styles.titleWrapper}>
            <div style={styles.titleIcon}>📚</div>
            <div>
              <h1 style={styles.title}>Hymn Management</h1>
              <p style={styles.titleSub}>{totalHymns || 0} total hymns • {hymns.length} loaded</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
            <FiPlus size={20} /> Add Hymn
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{totalHymns || 0}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{hymns.length}</span>
            <span style={styles.statLabel}>Loaded</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{hymns.filter(h => h.reference).length}</span>
            <span style={styles.statLabel}>With Ref</span>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search hymns by title or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={styles.searchClear}>✕</button>
          )}
        </div>

        <div style={styles.resultsCount}>
          <span style={styles.resultsBold}>{hymns.length}</span> shown
          {totalHymns > 0 && !searchTerm && ` of ${totalHymns}`}
        </div>
      </div>

      {/* Hymns List */}
      <div style={styles.list}>
        {hymns.map(hymn => (
          <motion.div
            key={hymn.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={styles.card}
          >
            <div style={styles.cardContent}>
              <div style={styles.icon}><GiPrayerBeads /></div>
              <div style={styles.info}>
                <div style={styles.titleRow}>
                  <h3 style={styles.hymnTitle}>{hymn.title}</h3>
                  {hymn.reference && <span style={styles.ref}>{hymn.reference}</span>}
                </div>
                {hymn.firstLine && <p style={styles.preview}>{hymn.firstLine}</p>}
                {hymn.lyrics && (
                  <div style={styles.metaInfo}>
                    <span style={styles.metaItem}>📝 Has lyrics</span>
                    <span style={styles.metaItem}>📊 {hymn.lyrics.split('\n\n').length} verses</span>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.actions}>
              <button onClick={() => openEditModal(hymn)} style={styles.editBtn} title="Edit">
                <FiEdit2 size={16} />
              </button>
              <button onClick={() => {
                setSelectedHymn(hymn);
                setShowDeleteModal(true);
              }} style={styles.deleteBtn} title="Delete">
                <FiTrash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && !searchTerm && (
        <button onClick={loadMore} disabled={loadingMore} style={styles.loadMore}>
          {loadingMore ? "Loading..." : "Load More Hymns"}
        </button>
      )}

      {/* Empty State */}
      {hymns.length === 0 && !loading && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🎵</div>
          <h3 style={styles.emptyTitle}>No hymns found</h3>
          <p style={styles.emptyText}>
            {searchTerm ? `No results for "${searchTerm}"` : "Add your first hymn"}
          </p>
          <button onClick={() => setShowAddModal(true)} style={styles.emptyBtn}>
            Add Hymn
          </button>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={isFullScreen ? styles.fullModalOverlay : styles.modalOverlay}
            onClick={() => {
              if (!isFullScreen) {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }
            }}
          >
            <motion.div
              initial={isFullScreen ? { y: 0 } : { scale: 0.9, y: 20 }}
              animate={isFullScreen ? { y: 0 } : { scale: 1, y: 0 }}
              exit={isFullScreen ? { y: 0 } : { scale: 0.9, y: 20 }}
              style={isFullScreen ? styles.fullModal : styles.largeModal}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with SAVE BUTTON at TOP */}
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>
                    {showAddModal ? "Add New Hymn" : "Edit Hymn"}
                  </h2>
                  {selectedHymn && (
                    <p style={styles.modalSubtitle}>
                      Last updated: {new Date(selectedHymn.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div style={styles.modalHeaderActions}>
                  {/* SAVE BUTTON - ALWAYS VISIBLE AT TOP */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={showAddModal ? handleAdd : handleEdit}
                    disabled={!formData.title.trim() || saving}
                    style={{
                      ...styles.saveButton,
                      opacity: !formData.title.trim() || saving ? 0.7 : 1,
                      cursor: !formData.title.trim() || saving ? 'not-allowed' : 'pointer',
                      padding: isMobile ? "8px 16px" : "10px 24px",
                      marginRight: "8px",
                    }}
                  >
                    {saving ? (
                      <>
                        <FiLoader style={styles.spinningIcon} size={16} />
                        {showAddModal ? "Adding..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {showAddModal ? "Add" : "Save"}
                      </>
                    )}
                  </motion.button>
                  
                  {!isMobile && (
                    <button 
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      style={styles.modalSizeToggle}
                      title={isFullScreen ? "Exit full screen" : "Full screen"}
                    >
                      {isFullScreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                    </button>
                  )}
                  <button 
                    onClick={() => { 
                      setShowAddModal(false); 
                      setShowEditModal(false); 
                      resetForm(); 
                      setIsFullScreen(false);
                    }}
                    style={styles.modalClose}
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Toggle & Tools - HIDE ON MOBILE */}
              {!isMobile && (
                <div style={styles.modalToolbar}>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    style={{
                      ...styles.toolbarButton,
                      background: previewMode ? '#4f46e5' : '#f1f5f9',
                      color: previewMode ? 'white' : '#475569'
                    }}
                  >
                    {previewMode ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    {previewMode ? "Hide Preview" : "Show Preview"}
                  </button>
                  <button onClick={cleanFormatting} style={styles.toolbarButton}>
                    <FiRefreshCw size={14} /> Clean
                  </button>
                  <button onClick={insertSample} style={styles.toolbarButton}>
                    <FiCopy size={14} /> Sample
                  </button>
                </div>
              )}

              {/* MODAL BODY - RESPONSIVE LAYOUT */}
              <div style={
                isMobile 
                  ? styles.mobileModalBody      // Mobile: full width, no grid
                  : (isFullScreen ? styles.fullModalBody : styles.largeModalBody)
              }>
                {/* LEFT COLUMN - BIG EDITING FORM (takes full width on mobile) */}
                <div style={isMobile ? styles.mobileFormColumn : styles.formColumn}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Title <span style={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter hymn title"
                      style={styles.formInput}
                      autoFocus
                      disabled={saving}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Reference</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="e.g., AGJ 451/134, NAGJ 188/52"
                      style={styles.formInput}
                      disabled={saving}
                    />
                  </div>

                  {/* BIG LYRICS EDITING AREA - FILLS REMAINING SPACE */}
                  <div style={isMobile ? styles.mobileLyricsGroup : styles.lyricsGroup}>
                    <div style={styles.textareaHeader}>
                      <label style={styles.formLabel}>Lyrics</label>
                      <div style={styles.textareaStats}>
                        <span>{getLineCount()} lines</span>
                        <span>•</span>
                        <span>{getVerseCount()} verses</span>
                      </div>
                    </div>
                    <textarea
                      value={formData.lyrics}
                      onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                      placeholder="Enter hymn lyrics...&#10;&#10;Use blank lines between verses"
                      rows={isMobile ? 18 : (isFullScreen ? 30 : 22)}
                      style={isMobile ? styles.mobileTextarea : styles.bigTextarea}
                      disabled={saving}
                    />
                    <div style={styles.formHint}>
                      💡 Separate verses with a blank line for proper formatting
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - PREVIEW (HIDDEN ON MOBILE) */}
                {!isMobile && previewMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={styles.previewColumn}
                  >
                    <div style={styles.previewHeader}>
                      <h3 style={styles.previewTitle}>Live Preview</h3>
                      <span style={styles.previewBadge}>
                        {getVerseCount()} verses
                      </span>
                    </div>
                    <div style={styles.previewContent}>
                      <h4 style={styles.previewHymnTitle}>
                        {formData.title || "Untitled Hymn"}
                      </h4>
                      {formData.reference && (
                        <p style={styles.previewRef}>{formData.reference}</p>
                      )}
                      <div style={styles.previewLyrics}>
                        {formatLyrics(formData.lyrics).length > 0 ? (
                          formatLyrics(formData.lyrics).map((verse, i) => (
                            <div key={i} style={styles.previewVerse}>
                              {verse.split('\n').map((line, j) => (
                                <p key={j} style={styles.previewLine}>
                                  {line || <br/>}
                                </p>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div style={styles.previewEmpty}>
                            {formData.lyrics ? (
                              <>
                                <p>Invalid format or empty lines</p>
                                <small>Use blank lines between verses</small>
                              </>
                            ) : (
                              <p>No lyrics to preview</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer with cancel button only */}
              <div style={styles.modalFooter}>
                <div style={styles.modalFooterLeft}>
                  {selectedHymn && (
                    <span style={styles.footerInfo}>
                      ID: {selectedHymn.id.substring(0, 8)}...
                    </span>
                  )}
                </div>
                <div style={styles.modalFooterRight}>
                  <button
                    onClick={() => { 
                      setShowAddModal(false); 
                      setShowEditModal(false); 
                      resetForm(); 
                      setIsFullScreen(false);
                    }}
                    style={styles.cancelButton}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedHymn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={styles.deleteModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.deleteIcon}>⚠️</div>
              <h3 style={styles.deleteTitle}>Delete Hymn?</h3>
              <p style={styles.deleteText}>
                Are you sure you want to delete "<strong>{selectedHymn.title}</strong>"? 
                This action cannot be undone.
              </p>
              <div style={styles.deleteActions}>
                <button onClick={() => setShowDeleteModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleDelete} style={styles.deleteConfirmBtn}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ====== STYLES ======
const styles = {
  container: {
    padding: "16px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  
  // Header
  headerSection: { marginBottom: "24px" },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  titleWrapper: { display: "flex", alignItems: "center", gap: "16px" },
  titleIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#fff",
  },
  title: { fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 },
  titleSub: { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(79, 70, 229, 0.25)",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#fff",
    padding: "20px 12px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  statValue: { fontSize: "28px", fontWeight: "700", color: "#4f46e5" },
  statLabel: { fontSize: "12px", color: "#64748b", textTransform: "uppercase" },

  // Search
  searchContainer: {
    position: "relative",
    marginBottom: "12px",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "14px",
    color: "#94a3b8",
    fontSize: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    borderRadius: "40px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: "15px",
    outline: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  searchClear: {
    position: "absolute",
    right: "16px",
    top: "14px",
    background: "#f1f5f9",
    border: "none",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    color: "#64748b",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Results
  resultsCount: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "16px",
  },
  resultsBold: { fontWeight: "700", color: "#0f172a" },

  // List
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  cardContent: { display: "flex", alignItems: "center", gap: "16px", flex: 1 },
  icon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#4f46e5",
  },
  info: { flex: 1 },
  titleRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" },
  hymnTitle: { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 },
  ref: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  preview: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  metaInfo: {
    display: "flex",
    gap: "12px",
    marginTop: "6px",
  },
  metaItem: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  actions: { display: "flex", gap: "8px" },
  editBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f1f5f9",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#475569",
  },
  deleteBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f1f5f9",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ef4444",
  },

  // Load More
  loadMore: {
    width: "100%",
    padding: "16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "24px",
    boxShadow: "0 4px 6px rgba(79, 70, 229, 0.25)",
  },

  // Empty State
  empty: {
    textAlign: "center",
    padding: "80px 20px",
  },
  emptyIcon: { fontSize: "64px", marginBottom: "20px", opacity: 0.7 },
  emptyTitle: { fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" },
  emptyText: { fontSize: "14px", color: "#64748b", marginBottom: "24px" },
  emptyBtn: {
    padding: "12px 28px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "40px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // MODAL STYLES
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    backdropFilter: "blur(5px)",
  },
  
  fullModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#f8fafc",
    zIndex: 1000,
  },

  largeModal: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    maxWidth: "1200px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },

  fullModal: {
    background: "#ffffff",
    padding: window.innerWidth <= 768 ? "16px" : "32px",
    width: "100%",
    minHeight: "100vh",
    overflowY: "auto",
  },

  // Modal Header
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: window.innerWidth <= 768 ? "20px" : "26px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0",
  },
  modalHeaderActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  spinningIcon: {
    animation: "spin 1s linear infinite",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    background: "#4f46e5",
    border: "none",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  modalSizeToggle: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f1f5f9",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalClose: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f1f5f9",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal Toolbar
  modalToolbar: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  toolbarButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
  },

  // Modal Body - Desktop layouts
  largeModalBody: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "28px",
    marginBottom: "24px",
    minHeight: "600px",
  },
  
  fullModalBody: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "32px",
    marginBottom: "24px",
    height: "calc(100vh - 200px)",
    overflowY: "auto",
  },

  // MOBILE SPECIFIC STYLES
  mobileModalBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "16px",
    height: "calc(100vh - 200px)",
    overflowY: "auto",
  },

  mobileFormColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
    width: "100%",
  },

  mobileLyricsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    minHeight: "300px",
  },

  mobileTextarea: {
    padding: "16px 20px",
    borderRadius: "16px",
    border: "2px solid #d1d5db",
    fontSize: "18px",
    fontFamily: "'Inter', monospace",
    lineHeight: "1.8",
    minHeight: "400px",
    maxHeight: "none",
    resize: "vertical",
    width: "100%",
    backgroundColor: "#fafafa",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
    outline: "none",
    flex: 1,
    ':focus': {
      borderColor: "#4f46e5",
      borderWidth: "2px",
      backgroundColor: "#ffffff",
    },
  },

  // Desktop Form Column
  formColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formLabel: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  required: {
    color: "#ef4444",
    marginLeft: "2px",
  },
  formInput: {
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.2s",
    ':focus': {
      borderColor: "#4f46e5",
      boxShadow: "0 0 0 3px rgba(79,70,229,0.1)",
    },
  },

  // Desktop Lyrics Area
  lyricsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  textareaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textareaStats: {
    display: "flex",
    gap: "8px",
    fontSize: "14px",
    color: "#4f46e5",
    background: "#e0e7ff",
    padding: "6px 14px",
    borderRadius: "30px",
    fontWeight: "500",
  },
  bigTextarea: {
    padding: "20px 24px",
    borderRadius: "16px",
    border: "2px solid #d1d5db",
    fontSize: "18px",
    fontFamily: "'Inter', monospace",
    lineHeight: "1.8",
    minHeight: "500px",
    maxHeight: "700px",
    resize: "vertical",
    width: "100%",
    backgroundColor: "#fafafa",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
    outline: "none",
    ':focus': {
      borderColor: "#4f46e5",
      borderWidth: "2px",
      backgroundColor: "#ffffff",
    },
  },
  formHint: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "6px",
  },

  // Preview Column
  previewColumn: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    overflowY: "auto",
    height: "100%",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  previewTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  previewBadge: {
    fontSize: "12px",
    padding: "4px 12px",
    background: "#4f46e5",
    color: "white",
    borderRadius: "30px",
  },
  previewContent: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "28px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  previewHymnTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#4f46e5",
    textAlign: "center",
    margin: "0 0 12px 0",
  },
  previewRef: {
    fontSize: "15px",
    color: "#64748b",
    textAlign: "center",
    margin: "0 0 28px 0",
    padding: "4px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  previewLyrics: {
    lineHeight: "2",
  },
  previewVerse: {
    marginBottom: "28px",
  },
  previewLine: {
    margin: "6px 0",
    fontSize: "16px",
    color: "#1e293b",
    textAlign: "center",
  },
  previewEmpty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px 0",
    '& small': {
      fontSize: "13px",
      display: "block",
      marginTop: "8px",
    },
  },

  // Modal Footer
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  modalFooterLeft: {
    color: "#64748b",
    fontSize: "12px",
  },
  footerInfo: {
    fontFamily: "monospace",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  modalFooterRight: {
    display: "flex",
    gap: "12px",
  },
  cancelButton: {
    padding: "12px 28px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  // Delete Modal
  deleteModal: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
  },
  deleteIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  deleteTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  deleteText: {
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "24px",
    lineHeight: 1.6,
  },
  deleteActions: {
    display: "flex",
    gap: "12px",
  },
  deleteConfirmBtn: {
    flex: 1,
    padding: "14px",
    background: "#ef4444",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
  },

  // Skeleton
  skeletonHeader: {
    height: "120px",
    background: "#e2e8f0",
    borderRadius: "16px",
    marginBottom: "20px",
    animation: "pulse 1.5s infinite",
  },
  skeletonCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    gap: "16px",
  },
  skeletonIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#e2e8f0",
  },
  skeletonContent: { flex: 1 },
  skeletonTitle: {
    width: "70%",
    height: "18px",
    background: "#e2e8f0",
    borderRadius: "4px",
    marginBottom: "10px",
  },
  skeletonLine: {
    width: "90%",
    height: "14px",
    background: "#e2e8f0",
    borderRadius: "4px",
  },
  skeletonGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

// Toast Style
const toastStyle = `
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: white;
  padding: 14px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  z-index: 9999;
  animation: slideIn 0.3s ease;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Add keyframes
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);