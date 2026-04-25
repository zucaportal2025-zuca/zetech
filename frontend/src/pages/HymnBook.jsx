// frontend/src/pages/HymnBook.jsx
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  FiSearch, 
  FiHeart, 
  FiShare2, 
  FiCopy,
  FiClock
} from "react-icons/fi";
import { 
  BsWhatsapp,
  BsTelegram,
  BsTwitter,
  BsMusicNoteBeamed
} from "react-icons/bs";
import { 
  GiPrayerBeads
} from "react-icons/gi";
import { IoTimeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import BASE_URL from "../api";

export default function HymnBook() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalSongs, setTotalSongs] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [shareModal, setShareModal] = useState(null);

  const token = localStorage.getItem("token");

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("songFavorites");
    if (saved) setFavorites(JSON.parse(saved));
    
    const viewed = localStorage.getItem("recentSongs");
    if (viewed) setRecentlyViewed(JSON.parse(viewed).slice(0, 5));
  }, []);

  // Save favorites
  useEffect(() => {
    localStorage.setItem("songFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch songs with search
  const fetchSongs = useCallback(async (pageNum = 1, search = '', reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams({
        page: pageNum,
        limit: 5
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const res = await axios.get(`${BASE_URL}/api/songs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // SAFETY: Ensure we have an array
      const newSongs = res.data?.songs || [];
      
      if (reset || pageNum === 1) {
        setSongs(newSongs);
      } else {
        setSongs(prev => [...(prev || []), ...newSongs]);
      }
      
      setHasMore(res.data?.hasMore || false);
      
      if (res.data?.total) {
        setTotalSongs(res.data.total);
      }
      
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load songs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchSongs(1, '', true);
  }, []);

  // When search changes, fetch new results
  useEffect(() => {
    setPage(1);
    fetchSongs(1, debouncedSearch, true);
  }, [debouncedSearch]);

  // SAFETY: Ensure songs is always an array
  const safeSongs = songs || [];
  
  // Filter favorites (client-side only)
  const displayedSongs = showFavoritesOnly
    ? safeSongs.filter(song => favorites.includes(song?.id))
    : safeSongs;

  // Load more function
  const loadMore = () => {
    if (!loadingMore && hasMore && !showFavoritesOnly) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, debouncedSearch);
    }
  };

  // Track recently viewed
  const trackView = (song) => {
    if (!song) return;
    const updated = [song, ...(recentlyViewed || []).filter(s => s?.id !== song.id)].slice(0, 5);
    setRecentlyViewed(updated);
    localStorage.setItem("recentSongs", JSON.stringify(updated));
  };

  // Toggle favorite
  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    const newFavorites = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    showToast(newFavorites.includes(id) ? "❤️ Added to favorites" : "❤️ Removed from favorites");
  };

  // Copy to clipboard
  const copyToClipboard = (song) => {
    if (!song) return;
    const text = `${song.title || ''}\n${song.reference ? `(${song.reference})\n` : ''}\n${song.firstLine || ''}`;
    navigator.clipboard.writeText(text);
    showToast("📋 Song info copied!");
  };

  // Share song
  const shareSong = (song, platform) => {
    if (!song) return;
    const text = `Check out this hymn: ${song.title || ''} ${song.reference ? `(${song.reference})` : ''}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      setShareModal(song);
    }
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = toastStyle;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Loading skeletons
  if (loading && page === 1) {
    return (
      <div style={container}>
        <div style={headerSection}>
          <div style={skeletonHeader} />
        </div>
        <div style={skeletonGrid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={skeletonCard}>
              <div style={skeletonIcon} />
              <div style={skeletonContent}>
                <div style={skeletonTitle} />
                <div style={skeletonLine} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={container}
    >
      {/* Header */}
      <div style={headerSection}>
        <div style={headerTop}>
          <div style={titleWrapper}>
            <div style={titleIcon}>🎵</div>
            <div>
              <h1 style={title}>Hymn Book</h1>
              <p style={titleSub}>{totalSongs || safeSongs.length || 0} hymns</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={compactStats}>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowFavoritesOnly(false);
              setSearchTerm("");
              setDebouncedSearch("");
            }}
          >
            <span style={compactStatValue}>{totalSongs || safeSongs.length || 0}</span>
            <span style={compactStatLabel}>Total</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
          >
            <span style={compactStatValue}>{safeSongs.length || 0}</span>
            <span style={compactStatLabel}>Loaded</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <span style={{ ...compactStatValue, color: showFavoritesOnly ? "#ec4899" : "#64748b" }}>
              <FiHeart style={{ fill: showFavoritesOnly ? "#ec4899" : "none" }} />
            </span>
            <span style={compactStatLabel}>Fav</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <span style={compactStatValue}>
              {viewMode === 'grid' ? '☷' : '▦'}
            </span>
            <span style={compactStatLabel}>View</span>
          </motion.div>
        </div>

        {/* Search */}
        <div style={searchContainer}>
          <FiSearch style={searchIcon} />
          <input
            type="text"
            placeholder="Search hymns by title or lyrics..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowFavoritesOnly(false);
            }}
            style={searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={searchClear}>✕</button>
          )}
        </div>

        {/* Results Count - FIXED LINE 225 */}
        <div style={resultsCount}>
          <span style={resultsBold}>{displayedSongs?.length || 0}</span> hymns shown
          {totalSongs > 0 && !searchTerm && ` of ${totalSongs} total`}
          {searchTerm && ` for "${searchTerm}"`}
          {showFavoritesOnly && " • Favorites only"}
        </div>

        {/* Recently Viewed - only show when not searching */}
        {recentlyViewed?.length > 0 && !searchTerm && !showFavoritesOnly && (
          <div style={recentSection}>
            <div style={recentHeader}>
              <IoTimeOutline size={14} />
              <span>Recently viewed</span>
            </div>
            <div style={recentList}>
              {recentlyViewed.map(song => song && (
                <Link
                  to={`/hymn/${song.id}`}
                  key={song.id}
                  style={recentItem}
                  onClick={() => trackView(song)}
                >
                  <span style={recentTitle}>{song.title || ''}</span>
                  {song.reference && <span style={recentRef}>{song.reference}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Songs Grid */}
      <div style={viewMode === 'grid' ? songsGrid : songsList}>
        <AnimatePresence>
          {displayedSongs?.map((song) => song && (
            <motion.div
              key={song.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                ...songCard,
                ...(viewMode === 'list' && songCardList),
              }}
            >
              <Link 
                to={`/hymn/${song.id}`}
                style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                onClick={() => trackView(song)}
              >
                <div style={songCardHeader}>
                  <div style={songIconWrapper}>
                    <GiPrayerBeads style={songCardIcon} />
                  </div>
                  <div style={songCardInfo}>
                    <div style={songCardTitleRow}>
                      <h3 style={songCardTitle}>{song.title || ''}</h3>
                      {favorites.includes(song.id) && (
                        <FiHeart size={12} color="#ec4899" style={{ fill: "#ec4899" }} />
                      )}
                    </div>
                    {song.reference && (
                      <div style={songCardRef}>{song.reference}</div>
                    )}
                    {song.firstLine && (
                      <div style={songCardPreview}>
                        {song.firstLine}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div style={songCardActions}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => toggleFavorite(song.id, e)}
                  style={actionIconButton}
                >
                  <FiHeart style={{ 
                    color: favorites.includes(song.id) ? "#ec4899" : "#94a3b8",
                    fill: favorites.includes(song.id) ? "#ec4899" : "none"
                  }} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(song)}
                  style={actionIconButton}
                >
                  <FiCopy size={14} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => shareSong(song)}
                  style={actionIconButton}
                >
                  <FiShare2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button - only show when not searching and not in favorites mode */}
      {hasMore && !searchTerm && !showFavoritesOnly && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadMore}
          disabled={loadingMore}
          style={loadMoreButton}
        >
          {loadingMore ? (
            <>
              <span style={loadingSpinnerSmall} />
              Loading...
            </>
          ) : (
            "Load More Hymns"
          )}
        </motion.button>
      )}

      {/* Empty State */}
      {(!displayedSongs || displayedSongs.length === 0) && !loading && (
        <div style={emptyState}>
          <div style={emptyIcon}>🎵</div>
          <h3 style={emptyTitle}>No hymns found</h3>
          <p style={emptyText}>
            {searchTerm 
              ? `No hymns matching "${searchTerm}"` 
              : showFavoritesOnly 
                ? "You haven't added any favorites yet"
                : "Try adjusting your search"}
          </p>
          <button 
            onClick={() => {
              setSearchTerm("");
              setShowFavoritesOnly(false);
            }}
            style={emptyButton}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlay}
            onClick={() => setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={modalTitle}>Share Hymn</h3>
              <p style={modalSongTitle}>{shareModal?.title || ''}</p>
              
              <div style={modalOptions}>
                <button onClick={() => shareSong(shareModal, 'whatsapp')} style={modalOption}>
                  <BsWhatsapp size={24} color="#25D366" />
                  <span>WhatsApp</span>
                </button>
                <button onClick={() => shareSong(shareModal, 'telegram')} style={modalOption}>
                  <BsTelegram size={24} color="#0088cc" />
                  <span>Telegram</span>
                </button>
                <button onClick={() => shareSong(shareModal, 'twitter')} style={modalOption}>
                  <BsTwitter size={24} color="#1DA1F2" />
                  <span>Twitter</span>
                </button>
              </div>

              <button onClick={() => setShareModal(null)} style={modalClose}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ... (keep all your styles the same)

// ====== STYLES ======

const container = {
  padding: "12px",
  maxWidth: "100%",
  fontFamily: "'Inter', -apple-system, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
  borderRadius: "25px",
};

// Skeleton Styles
const skeletonCard = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  gap: "12px",
  animation: "pulse 1.5s ease-in-out infinite",
};

const skeletonIcon = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "#e2e8f0",
};

const skeletonContent = {
  flex: 1,
};

const skeletonTitle = {
  width: "70%",
  height: "16px",
  background: "#e2e8f0",
  borderRadius: "4px",
  marginBottom: "8px",
};

const skeletonLine = {
  width: "90%",
  height: "12px",
  background: "#e2e8f0",
  borderRadius: "4px",
};

const skeletonHeader = {
  height: "100px",
  background: "#e2e8f0",
  borderRadius: "12px",
  marginBottom: "16px",
};

const skeletonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
  padding: "12px",
};

// Header
const headerSection = {
  marginBottom: "16px",
};

const headerTop = {
  marginBottom: "12px",
};

const titleWrapper = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const titleIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  color: "#ffffff",
};

const title = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0,
};

const titleSub = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
};

// Compact Stats
const compactStats = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "6px",
  marginBottom: "12px",
};

const compactStat = {
  background: "#ffffff",
  padding: "10px 4px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
  cursor: "pointer",
};

const compactStatValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0f172a",
};

const compactStatLabel = {
  fontSize: "10px",
  color: "#64748b",
  textTransform: "uppercase",
};

// Search
const searchContainer = {
  position: "relative",
  marginBottom: "8px",
};

const searchIcon = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#94a3b8",
  fontSize: "14px",
};

const searchInput = {
  width: "100%",
  padding: "12px 12px 12px 40px",
  borderRadius: "30px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "14px",
  outline: "none",
};

const searchClear = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#94a3b8",
  fontSize: "16px",
  cursor: "pointer",
  padding: "4px 8px",
};

// Results Count
const resultsCount = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "12px",
};

const resultsBold = {
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 2px",
};

// Recently Viewed
const recentSection = {
  marginBottom: "16px",
};

const recentHeader = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "11px",
  color: "#64748b",
  marginBottom: "8px",
  textTransform: "uppercase",
};

const recentList = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const recentItem = {
  padding: "6px 12px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  fontSize: "12px",
  color: "#0f172a",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const recentTitle = {
  fontWeight: "500",
};

const recentRef = {
  fontSize: "9px",
  color: "#64748b",
};

// Songs Grid
const songsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(1, 1fr)",
  gap: "11px",
};

const songsList = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

// Song Card
const songCard = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const songCardList = {
  flexDirection: "row",
  alignItems: "center",
};

const songCardHeader = {
  display: "flex",
  gap: "10px",
};

const songIconWrapper = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const songCardIcon = {
  fontSize: "18px",
  color: "#4f46e5",
};

const songCardInfo = {
  flex: 1,
};

const songCardTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "2px",
};

const songCardTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  margin: 0,
  lineHeight: 1.3,
};

const songCardRef = {
  fontSize: "10px",
  color: "#64748b",
  marginBottom: "4px",
};

const songCardPreview = {
  fontSize: "11px",
  color: "#475569",
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const songCardActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "4px",
};

const actionIconButton = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "8px",
  padding: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#475569",
};

// Load More Button
const loadMoreButton = {
  width: "100%",
  padding: "14px",
  background: "#4f46e5",
  color: "white",
  border: "none",
  borderRadius: "30px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  marginTop: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const loadingSpinnerSmall = {
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "white",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  display: "inline-block",
};

// Empty State
const emptyState = {
  textAlign: "center",
  padding: "40px 20px",
};

const emptyIcon = {
  fontSize: "48px",
  marginBottom: "16px",
  opacity: 0.5,
};

const emptyTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: "8px",
};

const emptyText = {
  fontSize: "14px",
  color: "#64748b",
  marginBottom: "20px",
};

const emptyButton = {
  padding: "10px 20px",
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "30px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
};

// Modal Styles
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
};

const modalContent = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  maxWidth: "320px",
  width: "100%",
};

const modalTitle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "8px",
  textAlign: "center",
};

const modalSongTitle = {
  fontSize: "14px",
  color: "#64748b",
  marginBottom: "20px",
  textAlign: "center",
  padding: "0 10px",
};

const modalOptions = {
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  marginBottom: "20px",
};

const modalOption = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "11px",
  color: "#0f172a",
  flex: 1,
};

const modalClose = {
  width: "100%",
  padding: "12px",
  background: "#4f46e5",
  border: "none",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

// Toast Style
const toastStyle = `
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
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

// Add keyframes to document
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);