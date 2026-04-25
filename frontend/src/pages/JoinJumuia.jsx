// frontend/src/pages/JoinJumuia.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

// Icons as simple components
const Icons = {
  Search: () => <span style={iconStyle}>🔍</span>,
  Clear: () => <span style={iconStyle}>✕</span>,
  Group: () => <span style={iconStyle}>👥</span>,
  Check: () => <span style={iconStyle}>✓</span>,
  Loading: () => <span style={iconStyle}>⋯</span>,
  Info: () => <span style={iconStyle}>ℹ️</span>,
  Error: () => <span style={iconStyle}>⚠️</span>,
  Empty: () => <span style={iconStyle}>📋</span>,
  WhatsApp: () => <span style={iconStyle}>💬</span>,
  Link: () => <span style={iconStyle}>🔗</span>,
};

function JoinJumuia() {
  const [jumuiaList, setJumuiaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinedJumuia, setJoinedJumuia] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    available: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const jRes = await api.get("/api/jumuia");
        setJumuiaList(jRes.data);
        setStats({
          total: jRes.data.length,
          available: jRes.data.length
        });

        const uRes = await api.get("/api/me");
        setJoinedJumuia(uRes.data?.jumuiaId || null);

      } catch (err) {
        console.error(err);
        setError("Unable to load jumuia groups");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleJoin = async (id, name) => {
    setJoiningId(id);
    try {
      await api.patch("/api/join-jumuia", { jumuiaId: id });
      setJoinedJumuia(id);
    } catch (err) {
      console.error("Join Jumuia Error:", err.response || err);
      alert(err.response?.data?.error || "Unable to join. Please try again.");
    } finally {
      setJoiningId(null);
    }
  };

  // Handle WhatsApp link click - only works if user has joined this jumuia
  const handleWhatsAppClick = (jumuia, e) => {
    if (joinedJumuia !== jumuia.id) {
      e.preventDefault();
      alert(`Please join ${jumuia.name} first to access their WhatsApp group.`);
      return;
    }
    
    if (!jumuia.whatsappLink) {
      e.preventDefault();
      alert("No WhatsApp group link available for this jumuia.");
    }
  };

  // Filter based on search
  const filteredJumuia = jumuiaList.filter(j => 
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.description && j.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
      },
    },
  };

  if (loading) {
    return (
      <div style={loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={loadingSpinner}
        >
          <Icons.Loading />
        </motion.div>
        <p style={loadingText}>Loading jumuia groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorContainer}>
        <div style={errorCard}>
          <Icons.Error />
          <p style={errorText}>{error}</p>
          <button onClick={() => window.location.reload()} style={errorButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={container}
    >
      {/* Header Section with Stats */}
      <motion.div variants={itemVariants} style={headerSection}>
        <div style={headerTop}>
          <h1 style={title}>
            Join a <span style={highlight}>Jumuia</span>
          </h1>
          <div style={statsBadge}>
            <Icons.Group />
            <span>{stats.total} Groups</span>
          </div>
        </div>
        <p style={subtitle}>
          Find your spiritual family. You can only join one jumuia at a time.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants} style={searchContainer}>
        <div style={searchWrapper}>
          <span style={searchIcon}>
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInput}
          />
          {searchTerm && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSearchTerm("")}
              style={searchClear}
            >
              <Icons.Clear />
            </motion.button>
          )}
        </div>
        {searchTerm && (
          <p style={searchResults}>
            Found {filteredJumuia.length} {filteredJumuia.length === 1 ? 'group' : 'groups'}
          </p>
        )}
      </motion.div>

      {/* Jumuia Grid */}
      {filteredJumuia.length === 0 ? (
        <motion.div variants={itemVariants} style={emptyState}>
          <div style={emptyIcon}>
            <Icons.Empty />
          </div>
          <h3 style={emptyTitle}>No groups found</h3>
          <p style={emptyText}>
            {searchTerm 
              ? `No jumuia matching "${searchTerm}"`
              : "No jumuia groups available"}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={emptyButton}>
              Clear Search
            </button>
          )}
        </motion.div>
      ) : (
        <div style={grid}>
          <AnimatePresence mode="popLayout">
            {filteredJumuia.map((j) => (
              <motion.div
                key={j.id}
                layout
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 20 }}
                style={{
                  ...card,
                  ...(joinedJumuia === j.id && cardJoined),
                  opacity: joinedJumuia && joinedJumuia !== j.id ? 0.6 : 1,
                }}
              >
                {/* Card Header with Icon */}
                <div style={cardHeader}>
                  <div style={cardIcon}>
                    <Icons.Group />
                  </div>
                  {joinedJumuia === j.id && (
                    <div style={joinedIndicator}>
                      <Icons.Check /> Active
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div style={cardContent}>
                  <h3 style={cardTitle}>{j.name}</h3>
                  {j.description && (
                    <p style={cardDescription}>{j.description}</p>
                  )}
                  
                  {/* WhatsApp Group Link Section */}
                  {j.whatsappLink && (
                    <div style={whatsappSection}>
                      <div style={whatsappHeader}>
                        <Icons.WhatsApp />
                        <span style={whatsappLabel}>WhatsApp Group</span>
                      </div>
                      <a
                        href={j.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleWhatsAppClick(j, e)}
                        style={{
                          ...whatsappLink,
                          ...(joinedJumuia !== j.id && whatsappLinkDisabled),
                        }}
                      >
                        <Icons.Link />
                        <span>
                          {joinedJumuia === j.id 
                            ? "Join WhatsApp Group →" 
                            : "Join this jumuia first to access"}
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Footer with Action */}
                <div style={cardFooter}>
                  <button
                    disabled={joinedJumuia && joinedJumuia !== j.id || joiningId === j.id}
                    onClick={() => handleJoin(j.id, j.name)}
                    style={{
                      ...button,
                      ...(joinedJumuia === j.id ? buttonJoined : {}),
                      ...(joinedJumuia && joinedJumuia !== j.id ? buttonDisabled : {}),
                    }}
                  >
                    {joiningId === j.id ? (
                      <span style={buttonContent}>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={buttonIcon}
                        >
                          ⋯
                        </motion.span>
                        Joining...
                      </span>
                    ) : joinedJumuia === j.id ? (
                      <span style={buttonContent}>
                        <span style={buttonIcon}><Icons.Check /></span>
                        Joined
                      </span>
                    ) : joinedJumuia ? (
                      <span style={buttonContent}>
                        <span style={buttonIcon}>🔒</span>
                        Unavailable
                      </span>
                    ) : (
                      <span style={buttonContent}>
                        Join Group
                        <span style={buttonArrow}>→</span>
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Note */}
      {!joinedJumuia && jumuiaList.length > 0 && (
        <motion.div variants={itemVariants} style={infoNote}>
          <span style={infoIcon}><Icons.Info /></span>
          <span>Choose one jumuia to join. After joining, you'll be able to access their WhatsApp group link.</span>
        </motion.div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </motion.div>
  );
}

// ====== ADDITIONAL STYLES FOR WHATSAPP SECTION ======

const whatsappSection = {
  marginTop: "1rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid #e5e7eb",
};

const whatsappHeader = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.5rem",
  fontSize: "0.8rem",
  color: "#6b7280",
  fontWeight: "500",
};

const whatsappLabel = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const whatsappLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0.75rem",
  backgroundColor: "#25D366",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
  cursor: "pointer",
  width: "100%",
  justifyContent: "center",
};

const whatsappLinkDisabled = {
  backgroundColor: "#d1d5db",
  color: "#6b7280",
  cursor: "not-allowed",
  pointerEvents: "auto", // Still allows click to show alert
};

// ====== PROFESSIONAL STYLES ======

const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.1em",
};

const container = {
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  minHeight: "80vh",
};

// Loading States
const loadingContainer = {
  minHeight: "400px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
};

const loadingSpinner = {
  width: "48px",
  height: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  color: "#3b82f6",
  animation: "spin 1s linear infinite",
};

const loadingText = {
  color: "#6b7280",
  fontSize: "0.95rem",
};

// Error States
const errorContainer = {
  minHeight: "400px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const errorCard = {
  background: "#fef2f2",
  padding: "2rem",
  borderRadius: "12px",
  textAlign: "center",
  maxWidth: "400px",
  border: "1px solid #fee2e2",
};

const errorText = {
  color: "#b91c1c",
  margin: "1rem 0",
  fontSize: "0.95rem",
};

const errorButton = {
  padding: "0.5rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "all 0.2s",
};

// Header Section
const headerSection = {
  marginBottom: "2rem",
};

const headerTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
  marginBottom: "0.5rem",
};

const title = {
  fontSize: "1.875rem",
  fontWeight: "800",
  color: "#ffffff",
  margin: 0,
};

const highlight = {
  color: "#1464e5",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const statsBadge = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 1rem",
  background: "#f3f4f6",
  borderRadius: "40px",
  fontSize: "0.9rem",
  color: "#000000",
  border: "1px solid #e5e7eb",
  fontWeight: "700"
};

const subtitle = {
  fontSize: "1rem",
  color: "#e1e5ec",
  margin: 0,
  fontWeight: "700"
};

// Search Bar
const searchContainer = {
  marginBottom: "2rem",
};

const searchWrapper = {
  position: "relative",
  maxWidth: "500px",
};

const searchIcon = {
  position: "absolute",
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
  fontSize: "1.1rem",
};

const searchInput = {
  width: "100%",
  padding: "0.875rem 1rem 0.875rem 3rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontSize: "0.95rem",
  outline: "none",
  transition: "all 0.2s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const searchClear = {
  position: "absolute",
  right: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6b7280",
  fontSize: "0.8rem",
  cursor: "pointer",
  transition: "all 0.2s",
};

const searchResults = {
  fontSize: "0.85rem",
  color: "#6b7280",
  marginTop: "0.5rem",
};

// Grid Layout
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2rem",
};

// Cards - Clean and Visible
const card = {
  background: "#ffffffbb",
  borderRadius: "16px",
  padding: "1.5rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  transition: "all 0.2s ease",
};

const cardJoined = {
  borderColor: "#22c55e",
  background: "#f0fdf4",
  boxShadow: "0 4px 6px -1px rgba(34,197,94,0.1)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const cardIcon = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.25rem",
  color: "#d4dce7",
  border: "1px solid #e5e7eb",
  fontWeight: "700"
};

const joinedIndicator = {
  padding: "0.25rem 0.75rem",
  background: "#22c55e",
  color: "#ffffff",
  fontSize: "0.75rem",
  fontWeight: "900",
  borderRadius: "40px",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
};

const cardContent = {
  flex: 1,
};

const cardTitle = {
  fontSize: "1.25rem",
  fontWeight: "800",
  color: "#111827",
  marginBottom: "0.5rem",
};

const cardDescription = {
  fontSize: "0.95rem",
  color: "#6b7280",
  lineHeight: "1.5",
  margin: 0,
};

const cardFooter = {
  marginTop: "0.5rem",
};

// Buttons
const button = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "10px",
  border: "none",
  background: "#3b82f6",
  color: "#ffffff",
  fontSize: "0.95rem",
  fontWeight: "900",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const buttonJoined = {
  background: "#22c55e",
};

const buttonDisabled = {
  background: "#e5e7eb",
  color: "#9ca3af",
  cursor: "not-allowed",
};

const buttonContent = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const buttonIcon = {
  fontSize: "1rem",
  display: "inline-flex",
};

const buttonArrow = {
  fontSize: "1.1rem",
  marginLeft: "0.25rem",
};

// Empty State
const emptyState = {
  textAlign: "center",
  padding: "4rem 2rem",
  background: "#f9fafb",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  maxWidth: "500px",
  margin: "2rem auto",
};

const emptyIcon = {
  fontSize: "3rem",
  color: "#9ca3af",
  marginBottom: "1rem",
};

const emptyTitle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.5rem",
};

const emptyText = {
  color: "#6b7280",
  fontSize: "0.95rem",
  marginBottom: "1.5rem",
};

const emptyButton = {
  padding: "0.5rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: "0.9rem",
  cursor: "pointer",
};

// Info Note
const infoNote = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "1rem",
  background: "#f3f4f6",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  color: "#fdfefe",
  fontSize: "0.9rem",
  marginTop: "2rem",
};

const infoIcon = {
  color: "#3b82f6",
  fontSize: "1.1rem",
};

export default JoinJumuia;