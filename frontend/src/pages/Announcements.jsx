// frontend/src/pages/Announcements.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "../api";

// Professional Icon Set
const Icons = {
  Announcement: () => <span style={iconStyle}>📢</span>,
  Calendar: () => <span style={iconStyle}>📅</span>,
  Clock: () => <span style={iconStyle}>⏰</span>,
  Search: () => <span style={iconStyle}>🔍</span>,
  Clear: () => <span style={iconStyle}>✕</span>,
  Filter: () => <span style={iconStyle}>⚙️</span>,
  Sort: () => <span style={iconStyle}>↕️</span>,
  Pin: () => <span style={iconStyle}>📍</span>,
  New: () => <span style={iconStyle}>🆕</span>,
  Hot: () => <span style={iconStyle}>🔥</span>,
  Empty: () => <span style={iconStyle}>📭</span>,
  Error: () => <span style={iconStyle}>⚠️</span>,
  Refresh: () => <span style={iconStyle}>↻</span>,
  ChevronDown: () => <span style={iconStyle}>▼</span>,
  ChevronUp: () => <span style={iconStyle}>▲</span>,
  Close: () => <span style={iconStyle}>✖</span>,
  Trending: () => <span style={iconStyle}>📈</span>,
  Category: () => <span style={iconStyle}>🏷️</span>,
  Time: () => <span style={iconStyle}>⌛</span>,
  Check: () => <span style={iconStyle}>✓</span>,
  Grid: () => <span style={iconStyle}>⊞</span>,
  List: () => <span style={iconStyle}>☰</span>,
};

export default function UserAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'new', 'old'
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    recent: 0,
    categories: 0,
    latestUpdate: null,
    oldestUpdate: null,
  });
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  
  const token = localStorage.getItem("token");

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const res = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const allAnnouncements = res.data;
    const globalAnnouncements = allAnnouncements.filter(a => !a.jumuiaId);
      const data = res.data;
    
      setAnnouncements(globalAnnouncements);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(a => a.category || "General").filter(Boolean))];
      setCategories(["all", ...uniqueCategories]);
      
      // Calculate detailed stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Count new items (less than 48 hours old)
      const newCount = data.filter(a => {
        const date = new Date(a.createdAt);
        const diffHours = (now - date) / (1000 * 60 * 60);
        return diffHours <= 48;
      }).length;
      
      setStats({
        total: data.length,
        new: newCount,
        recent: data.filter(a => new Date(a.createdAt) > weekAgo).length,
        categories: uniqueCategories.length,
        latestUpdate: data.length > 0 ? new Date(Math.max(...data.map(a => new Date(a.createdAt)))) : null,
        oldestUpdate: data.length > 0 ? new Date(Math.min(...data.map(a => new Date(a.createdAt)))) : null,
      });
      
      setError(null);
    } catch (err) {
      console.error("Announcements Error:", err);
      setError("Unable to load announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filter and sort announcements
  useEffect(() => {
    let filtered = [...announcements];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(a => (a.category || "General") === selectedCategory);
    }

    // Apply time filter - FULLY FUNCTIONAL
    if (timeFilter !== "all") {
      const now = new Date();
      const hours48 = 48 * 60 * 60 * 1000;
      
      filtered = filtered.filter(a => {
        const date = new Date(a.createdAt);
        const age = now - date;
        
        if (timeFilter === "new") {
          return age <= hours48; // Less than 48 hours old
        } else if (timeFilter === "old") {
          return age > hours48; // More than 48 hours old
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, selectedCategory, timeFilter, sortOrder]);

  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAnnouncements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnnouncements.map(a => a.id));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const getAnnouncementAge = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours <= 24) return "hot";
    if (diffHours <= 48) return "new";
    if (diffHours <= 168) return "week"; // 7 days
    return "old";
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
      },
    },
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={loadingContainer}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={loadingSpinner}
        >
          <Icons.Announcement />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={loadingTextContainer}
        >
          <p style={loadingTitle}>Loading announcements</p>
          <p style={loadingSubtitle}>Please wait while we fetch the latest updates</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={container}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} style={headerSection}>
        <div style={headerTop}>
          <div style={titleWrapper}>
            <div style={titleIcon}>
              <Icons.Announcement />
            </div>
            <div>
              <h1 style={title}>
                Announcements
              </h1>
              <p style={titleSub}>
                Stay informed with the latest updates from your community
              </p>
            </div>
          </div>
          
          {/* Interactive Stats Cards */}
          <div style={statsContainer}>
            <motion.div 
              style={statCard}
              whileHover={{ y: -2, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeFilter("all")}
            >
              <span style={statValue}>{stats.total}</span>
              <span style={statLabel}>Total</span>
            </motion.div>
            <motion.div 
              style={{
                ...statCard,
                borderColor: timeFilter === "new" ? "#3b82f6" : "#e2e8f0",
                backgroundColor: timeFilter === "new" ? "#eff6ff" : "#ffffff",
              }}
              whileHover={{ y: -2, boxShadow: "0 10px 20px -5px rgba(59,130,246,0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTimeFilterChange(timeFilter === "new" ? "all" : "new")}
            >
              <span style={{ ...statValue, color: "#3b82f6" }}>{stats.new}</span>
              <span style={statLabel}>New (48h)</span>
              {timeFilter === "new" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={activeFilterIndicator}
                >
                  <Icons.Check />
                </motion.div>
              )}
            </motion.div>
            <motion.div 
              style={{
                ...statCard,
                borderColor: timeFilter === "old" ? "#ef4444" : "#e2e8f0",
                backgroundColor: timeFilter === "old" ? "#fef2f2" : "#ffffff",
              }}
              whileHover={{ y: -2, boxShadow: "0 10px 20px -5px rgba(239,68,68,0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTimeFilterChange(timeFilter === "old" ? "all" : "old")}
            >
              <span style={{ ...statValue, color: "#ef4444" }}>{stats.total - stats.new}</span>
              <span style={statLabel}>Older</span>
              {timeFilter === "old" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={activeFilterIndicator}
                >
                  <Icons.Check />
                </motion.div>
              )}
            </motion.div>
            <motion.div 
              style={statCard}
              whileHover={{ y: -2 }}
            >
              <span style={statValue}>{stats.categories}</span>
              <span style={statLabel}>Categories</span>
            </motion.div>
          </div>
        </div>

        {/* Controls Bar */}
        <div style={controlsBar}>
          {/* Search */}
          <div style={searchWrapper}>
            <span style={searchIcon}>
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInput}
            />
            {searchTerm && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleClearSearch}
                style={searchClear}
                whileHover={{ scale: 1.1, backgroundColor: "#e2e8f0" }}
                whileTap={{ scale: 0.9 }}
              >
                <Icons.Clear />
              </motion.button>
            )}
          </div>

          {/* Filter Controls */}
          <div style={filterWrapper}>
            {/* Category Filter */}
            <motion.div 
              style={filterGroup}
              whileHover={{ scale: 1.02 }}
            >
              <span style={filterIcon}><Icons.Category /></span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={filterSelect}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Sort Button */}
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              style={sortButton}
            >
              <span style={sortIcon}><Icons.Sort /></span>
              <span style={sortText}>
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </span>
              <motion.span
                animate={{ rotate: sortOrder === "desc" ? 0 : 180 }}
                style={sortArrow}
              >
                <Icons.ChevronDown />
              </motion.span>
            </motion.button>

            {/* View Mode Toggle */}
            <motion.div style={viewToggle}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode("grid")}
                style={{
                  ...viewToggleButton,
                  backgroundColor: viewMode === "grid" ? "#3b82f6" : "transparent",
                  color: viewMode === "grid" ? "#ffffff" : "#64748b",
                }}
              >
                <Icons.Grid />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode("list")}
                style={{
                  ...viewToggleButton,
                  backgroundColor: viewMode === "list" ? "#3b82f6" : "transparent",
                  color: viewMode === "list" ? "#ffffff" : "#64748b",
                }}
              >
                <Icons.List />
              </motion.button>
            </motion.div>

            {/* Select Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectMode(!selectMode)}
              style={{
                ...selectModeButton,
                backgroundColor: selectMode ? "#3b82f6" : "#ffffff",
                color: selectMode ? "#ffffff" : "#1e293b",
              }}
            >
              {selectMode ? "Cancel" : "Select"}
            </motion.button>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "#f8fafc" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              style={refreshButton}
              disabled={refreshing}
            >
              <motion.span
                animate={refreshing ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                style={refreshIcon}
              >
                <Icons.Refresh />
              </motion.span>
            </motion.button>
          </div>
        </div>

        {/* Results Info with Timeline */}
        {!loading && (
          <motion.div 
            variants={itemVariants}
            style={resultsInfo}
          >
            <div style={resultsLeft}>
              <span style={resultsBold}>{filteredAnnouncements.length}</span>
              <span style={resultsText}>
                {filteredAnnouncements.length === 1 ? 'announcement' : 'announcements'} found
              </span>
              {timeFilter !== "all" && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    ...resultsBadge,
                    backgroundColor: timeFilter === "new" ? "#eff6ff" : "#fef2f2",
                    borderColor: timeFilter === "new" ? "#3b82f6" : "#ef4444",
                    color: timeFilter === "new" ? "#2563eb" : "#dc2626",
                  }}
                >
                  {timeFilter === "new" ? <Icons.New /> : <Icons.Time />}
                  {timeFilter === "new" ? "New (48h)" : "Older"}
                  <motion.span
                    style={resultsBadgeClose}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeFilter("all");
                    }}
                  >
                    <Icons.Close />
                  </motion.span>
                </motion.span>
              )}
              {selectedCategory !== "all" && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={resultsBadge}
                >
                  <Icons.Category /> {selectedCategory}
                  <motion.span
                    style={resultsBadgeClose}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory("all");
                    }}
                  >
                    <Icons.Close />
                  </motion.span>
                </motion.span>
              )}
            </div>
            
            {/* Timeline Indicator */}
            <div style={resultsRight}>
              {stats.latestUpdate && (
                <motion.div 
                  style={timelineIndicator}
                  whileHover={{ scale: 1.02 }}
                >
                  
                  <span style={timelineText}>
                    Latest: {formatDate(stats.latestUpdate)}
                  </span>
                </motion.div>
              )}
              {stats.oldestUpdate && stats.oldestUpdate !== stats.latestUpdate && (
                <motion.div 
                  style={timelineIndicator}
                  whileHover={{ scale: 1.02 }}
                >
                  <span style={{ ...timelineDot, backgroundColor: "#94a3b8" }} />
                  <span style={timelineText}>
                    Oldest: {formatDate(stats.oldestUpdate)}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Select Mode Toolbar */}
      <AnimatePresence>
        {selectMode && filteredAnnouncements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={selectToolbar}
          >
            <div style={selectToolbarLeft}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSelectAll}
                style={selectToolbarButton}
              >
                {selectedIds.length === filteredAnnouncements.length ? "Deselect All" : "Select All"}
              </motion.button>
              <span style={selectCount}>
                {selectedIds.length} selected
              </span>
            </div>
            {selectedIds.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#ef4444" }}
                whileTap={{ scale: 0.95 }}
                style={selectToolbarAction}
              >
                Archive Selected
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants} style={errorContainer}>
          <div style={errorCard}>
            <div style={errorIcon}>
              <Icons.Error />
            </div>
            <h3 style={errorTitle}>Unable to load announcements</h3>
            <p style={errorText}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              style={errorButton}
            >
              <span style={errorButtonIcon}><Icons.Refresh /></span>
              Try Again
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!error && filteredAnnouncements.length === 0 && (
        <motion.div variants={itemVariants} style={emptyContainer}>
          <div style={emptyCard}>
            <div style={emptyIcon}>
              <Icons.Empty />
            </div>
            <h3 style={emptyTitle}>No announcements found</h3>
            <p style={emptyText}>
              {searchTerm 
                ? `No results matching "${searchTerm}"`
                : timeFilter !== "all"
                ? `No ${timeFilter === "new" ? "new" : "older"} announcements available`
                : "There are no announcements at the moment"}
            </p>
            {(searchTerm || timeFilter !== "all" || selectedCategory !== "all") && (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchTerm("");
                  setTimeFilter("all");
                  setSelectedCategory("all");
                }}
                style={emptyButton}
              >
                Clear All Filters
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Announcements Grid/List */}
      {!error && filteredAnnouncements.length > 0 && (
        <div style={viewMode === "grid" ? grid : listView}>
          <AnimatePresence mode="popLayout">
            {filteredAnnouncements.map((a, index) => {
              const age = getAnnouncementAge(a.createdAt);
              const isExpanded = expandedId === a.id;
              const isSelected = selectedIds.includes(a.id);
              
              return (
                <motion.div
                  key={a.id}
                  layout
                  variants={itemVariants}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    borderColor: isSelected ? "#3b82f6" : 
                                age === "hot" ? "#ef4444" :
                                age === "new" ? "#3b82f6" :
                                age === "week" ? "#f59e0b" : "#e2e8f0",
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20 }}
                  style={{
                    ...(viewMode === "grid" ? card : listCard),
                    backgroundColor: isSelected ? "#f0f9ff" : "#ffffff",
                    borderWidth: isSelected ? "3px" : "2px",
                    cursor: selectMode ? "default" : "pointer",
                  }}
                  onClick={() => {
                    if (selectMode) {
                      handleSelectOne(a.id);
                    } else {
                      setExpandedId(isExpanded ? null : a.id);
                    }
                  }}
                  whileHover={!selectMode ? { 
                    y: viewMode === "grid" ? -4 : -2,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
                  } : {}}
                >
                  {/* Select Checkbox */}
                  {selectMode && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={selectCheckbox}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOne(a.id);
                      }}
                    >
                      <div style={{
                        ...checkboxInner,
                        backgroundColor: isSelected ? "#3b82f6" : "#ffffff",
                        borderColor: isSelected ? "#3b82f6" : "#cbd5e1",
                      }}>
                        {isSelected && <Icons.Check />}
                      </div>
                    </motion.div>
                  )}

                  {/* Card Header */}
                  <div style={viewMode === "grid" ? cardHeader : listCardHeader}>
                    <div style={viewMode === "grid" ? cardHeaderLeft : listCardHeaderLeft}>
                      <div style={{
                        ...cardIcon,
                        backgroundColor: age === "hot" ? "#fee2e2" :
                                      age === "new" ? "#dbeafe" :
                                      age === "week" ? "#fef3c7" : "#f1f5f9",
                        color: age === "hot" ? "#dc2626" :
                               age === "new" ? "#2563eb" :
                               age === "week" ? "#d97706" : "#475569",
                      }}>
                        {age === "hot" ? <Icons.Hot /> :
                         age === "new" ? <Icons.New /> :
                         age === "week" ? <Icons.Time /> :
                         <Icons.Announcement />}
                      </div>
                      <div style={cardTitleSection}>
                        <div style={cardTitleRow}>
                          <h3 style={cardTitle}>{a.title}</h3>
                          {age === "hot" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={hotBadge}
                            >
                              <Icons.Hot /> HOT
                            </motion.div>
                          )}
                          {age === "new" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={newBadge}
                            >
                              <Icons.New /> NEW
                            </motion.div>
                          )}
                          {age === "week" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={weekBadge}
                            >
                              <Icons.Time /> WEEK
                            </motion.div>
                          )}
                        </div>
                        <div style={cardMeta}>
                          {a.category && (
                            <span style={cardCategory}>
                              <Icons.Category /> {a.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={viewMode === "grid" ? cardContent : listCardContent}>
                    <p style={{
                      ...cardDescription,
                      ...(viewMode === "grid" && !isExpanded && a.content.length > 150 ? cardDescriptionClamped : {}),
                      fontWeight: age === "hot" ? "600" : "500",
                    }}>
                      {a.content}
                    </p>
                    {!isExpanded && a.content.length > 150 && viewMode === "grid" && (
                      <motion.button
                        whileHover={{ x: 5 }}
                        style={readMoreButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(a.id);
                        }}
                      >
                        Read more →
                      </motion.button>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div style={viewMode === "grid" ? cardFooter : listCardFooter}>
                    <div style={dateInfo}>
                      <span style={dateIcon}><Icons.Time /></span>
                      <span style={dateText}>{formatDate(a.createdAt)}</span>
                    </div>
                    {!selectMode && (
                      <motion.div 
                        style={expandIcon}
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                      >
                        {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Stats Footer */}
      {!error && filteredAnnouncements.length > 0 && (
        <motion.div 
          variants={itemVariants}
          style={quickStatsFooter}
        >
          <div style={quickStatsLeft}>
            <span style={quickStatsBold}>{filteredAnnouncements.length}</span>
            <span style={quickStatsText}>announcements displayed</span>
          </div>
          <div style={quickStatsRight}>
            <motion.div 
              style={quickStatsItem}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTimeFilterChange(timeFilter === "hot" ? "all" : "hot")}
            >
              <span style={{ ...quickStatsDot, backgroundColor: "#ef4444" }} />
              <span style={{
                fontWeight: timeFilter === "hot" ? "700" : "500",
                color: timeFilter === "hot" ? "#ef4444" : "#475569",
              }}>Hot (24h)</span>
            </motion.div>
            <motion.div 
              style={quickStatsItem}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTimeFilterChange(timeFilter === "new" ? "all" : "new")}
            >
              <span style={{ ...quickStatsDot, backgroundColor: "#3b82f6" }} />
              <span style={{
                fontWeight: timeFilter === "new" ? "700" : "500",
                color: timeFilter === "new" ? "#3b82f6" : "#475569",
              }}>New (48h)</span>
            </motion.div>
            <motion.div 
              style={quickStatsItem}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTimeFilterChange(timeFilter === "week" ? "all" : "week")}
            >
              <span style={{ ...quickStatsDot, backgroundColor: "#f59e0b" }} />
              <span style={{
                fontWeight: timeFilter === "week" ? "700" : "500",
                color: timeFilter === "week" ? "#f59e0b" : "#475569",
              }}>This Week</span>
            </motion.div>
            <motion.div 
              style={quickStatsItem}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTimeFilterChange("all")}
            >
              <span style={{ ...quickStatsDot, backgroundColor: "#94a3b8" }} />
              <span style={{
                fontWeight: timeFilter === "all" ? "700" : "500",
                color: timeFilter === "all" ? "#0f172a" : "#475569",
              }}>All</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Scroll to top button */}
      <AnimatePresence>
        {filteredAnnouncements.length > 8 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={scrollTopButton}
            whileHover={{ scale: 1.1, backgroundColor: "#2563eb" }}
            whileTap={{ scale: 0.9 }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          select, input, button {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </motion.div>
  );
}

// ====== PROFESSIONAL STYLES ======

const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.2em",
  fontWeight: "700",
};

// Container
const container = {
  padding: "0rem",
  maxWidth: "1400px",
  margin: "0 auto",
  marginRight: "9px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  minHeight: "80vh",
  position: "relative",
};

// Loading
const loadingContainer = {
  minHeight: "600px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2rem",
};

const loadingSpinner = {
  width: "80px",
  height: "80px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2.5rem",
  color: "#3b82f6",
  animation: "spin 1s linear infinite",
  background: "#f8fafc",
  borderRadius: "50%",
  boxShadow: "0 10px 25px -5px rgba(59,130,246,0.2)",
};

const loadingTextContainer = {
  textAlign: "center",
};

const loadingTitle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  color: "#1e293b",
  marginBottom: "0.5rem",
};

const loadingSubtitle = {
  fontSize: "1rem",
  color: "#64748b",
};

// Header Section
const headerSection = {
  marginTop: "1rem",
};

const headerTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2rem",
  marginBottom: "1rem",
};

const titleWrapper = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const titleIcon = {
  width: "50px",
  height: "60px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #3b83f600, #2564eb00)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  color: "#ffffff",
  boxShadow: "0 10px 20px -5px rgba(59,130,246,0.3)",
};

const title = {
  fontSize: "34px",
  fontWeight: "800",
  color: "#f3f6fd",
  marginRight: "2px",
  margin: 0,
  letterSpacing: "-0.02em",
};

const titleSub = {
  fontSize: "1rem",
  color: "#c7d0db",
  marginTop: "0.25rem",
  fontWeight: "500",
};

// Stats
const statsContainer = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap",
};

const statCard = {
  background: "#ffffff",
  padding: "0rem 0.5rem",
  borderRadius: "16px",
  border: "2px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  
  minWidth: "100px",
  cursor: "pointer",
  transition: "all 0.2s",
  position: "relative",
};

const statValue = {
  fontSize: "2rem",
  fontWeight: "800",
  color: "#0f172a",
  lineHeight: 1,
  marginBottom: "0.25rem",
};

const statLabel = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const activeFilterIndicator = {
  position: "absolute",
  top: "-8px",
  right: "-8px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  background: "#3b82f6",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.8rem",
  border: "2px solid #ffffff",
};

// Controls
const controlsBar = {
  display: "flex",
  gap: "01rem",
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: "0rem",
};

// Search
const searchWrapper = {
  position: "relative",
  flex: "2",
  minWidth: "350px",
};

const searchIcon = {
  position: "absolute",
  left: "1.25rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#64748b",
  fontSize: "1.0rem",
};

const searchInput = {
  width: "100%",
  padding: "1rem 1rem 1rem 3.5rem",
  borderRadius: "16px",
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "1rem",
  fontWeight: "500",
  outline: "none",
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
};

const searchClear = {
  position: "absolute",
  right: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#f1f5f9",
  border: "none",
  borderRadius: "10px",
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#475569",
  fontSize: "0.9rem",
  cursor: "pointer",
  fontWeight: "bold",
};

// Filter Controls
const filterWrapper = {
  display: "flex",
  gap: "0.75rem",
  marginTop: "0px",
  alignItems: "center",
  flexWrap: "wrap",
};

const filterGroup = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 1rem",
  background: "#ffffff",
  borderRadius: "14px",
  border: "2px solid #e2e8f0",
  cursor: "pointer",
};

const filterIcon = {
  color: "#475569",
  fontSize: "1rem",
  fontWeight: "600",
};

const filterSelect = {
  padding: "0.5rem 2rem 0.5rem 0.5rem",
  borderRadius: "12px",
  border: "none",
  background: "transparent",
  color: "#0f172a",
  fontSize: "0.95rem",
  fontWeight: "600",
  outline: "none",
  cursor: "pointer",
};

const sortButton = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem 1.25rem",
  background: "#ffffff",
  border: "2px solid #e2e8f0",
  borderRadius: "14px",
  color: "#1e293b",
  fontSize: "0.95rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
};

const sortIcon = {
  color: "#475569",
  fontSize: "1rem",
};

const sortText = {
  fontWeight: "600",
};

const sortArrow = {
  fontSize: "0.9rem",
  color: "#94a3b8",
};

const viewToggle = {
  display: "flex",
  gap: "0.25rem",
  background: "#f1f5f9",
  padding: "0.25rem",
  borderRadius: "12px",
  border: "2px solid #e2e8f0",
};

const viewToggleButton = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  border: "none",
  fontSize: "1.2rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const selectModeButton = {
  padding: "0.75rem 1.25rem",
  borderRadius: "14px",
  border: "2px solid #e2e8f0",
  fontSize: "0.95rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  background: "#ffffff",
};

const refreshButton = {
  padding: "0.75rem",
  background: "#ffffff",
  border: "2px solid #e2e8f0",
  borderRadius: "14px",
  color: "#475569",
  fontSize: "1.2rem",
  cursor: "pointer",
  width: "48px",
  height: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

const refreshIcon = {
  display: "inline-block",
  fontSize: "1.2rem",
};

// Results Info
const resultsInfo = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "0px",
  alignItems: "center",
  padding: "1rem 0",
  borderBottom: "2px solid #e2e8f0",
  flexWrap: "wrap",
  gap: "0",
  marginBottom: "0px",
};

const resultsLeft = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const resultsBold = {
  fontSize: "1.5rem",
  fontWeight: "800",
  color: "#0f172a",
};

const resultsText = {
  fontSize: "1rem",
  color: "#475569",
  fontWeight: "500",
};

const resultsBadge = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 1rem",
  background: "#f1f5f9",
  borderRadius: "30px",
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#1e293b",
  border: "2px solid #e2e8f0",
};

const resultsBadgeClose = {
  marginLeft: "0.25rem",
  cursor: "pointer",
  fontSize: "0.8rem",
  opacity: 0.7,
};

const resultsRight = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
};

const timelineIndicator = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
};

const timelineDot = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
};

const timelineText = {
  fontSize: "0.9rem",
  color: "#475569",
  fontWeight: "500",
};

// Select Toolbar
const selectToolbar = {
  background: "#ffffff",
  border: "2px solid #3b82f6",
  borderRadius: "16px",
  padding: "1rem",
  marginBottom: "0rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
  boxShadow: "0 10px 20px -5px rgba(59,130,246,0.2)",
};

const selectToolbarLeft = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
};

const selectToolbarButton = {
  padding: "0.5rem 1rem",
  borderRadius: "10px",
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  color: "#1e293b",
  fontSize: "0.9rem",
  fontWeight: "600",
  cursor: "pointer",
};

const selectCount = {
  fontSize: "0.95rem",
  color: "#475569",
  fontWeight: "500",
};

const selectToolbarAction = {
  padding: "0.5rem 1.5rem",
  borderRadius: "10px",
  border: "none",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "0.9rem",
  fontWeight: "600",
  cursor: "pointer",
};

// Select Checkbox
const selectCheckbox = {
  position: "absolute",
  top: "1rem",
  left: "1rem",
  zIndex: 10,
  cursor: "pointer",
};

const checkboxInner = {
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  border: "2px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.8rem",
  color: "#ffffff",
  transition: "all 0.2s",
};

// Error State
const errorContainer = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "400px",
};

const errorCard = {
  textAlign: "center",
  padding: "3rem",
  background: "#ffffff",
  borderRadius: "24px",
  border: "2px solid #fee2e2",
  boxShadow: "0 10px 25px -5px rgba(239,68,68,0.1)",
  maxWidth: "500px",
};

const errorIcon = {
  fontSize: "3rem",
  marginBottom: "1rem",
};

const errorTitle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  color: "#b91c1c",
  marginBottom: "0.5rem",
};

const errorText = {
  color: "#64748b",
  marginBottom: "2rem",
  fontSize: "1rem",
};

const errorButton = {
  padding: "0.75rem 2rem",
  borderRadius: "12px",
  border: "none",
  background: "#3b82f6",
  color: "#ffffff",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
};

const errorButtonIcon = {
  fontSize: "1.1rem",
};

// Empty State
const emptyContainer = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "500px",
};

const emptyCard = {
  textAlign: "center",
  padding: "4rem",
  background: "#ffffff",
  borderRadius: "32px",
  border: "2px solid #e2e8f0",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)",
  maxWidth: "600px",
};

const emptyIcon = {
  fontSize: "4rem",
  color: "#94a3b8",
  marginBottom: "1.5rem",
};

const emptyTitle = {
  fontSize: "1.8rem",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "0.5rem",
};

const emptyText = {
  color: "#64748b",
  fontSize: "1.1rem",
  marginBottom: "2rem",
};

const emptyButton = {
  padding: "0.75rem 2rem",
  borderRadius: "12px",
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  color: "#1e293b",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
};

// Grid and List Views
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
  gap: "1.5rem",
  marginTop: "1.5rem",
};

const listView = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  marginTop: "1.5rem",
};

// Cards
const card = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "0.75rem",
  border: "2px solid #e2e8f0",
  marginBottom: "0px",
  marginRight: "25px",
  marginLeft: "0px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  transition: "all 0.2s ease",
  position: "relative",
};

const listCard = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "1.5rem",
  border: "2px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  transition: "all 0.2s",
  position: "relative",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const listCardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const cardHeaderLeft = {
  display: "flex",
  gap: "1rem",
  alignItems: "flex-start",
  flex: 1,
};

const listCardHeaderLeft = {
  display: "flex",
  gap: "1rem",
  alignItems: "center",
  flex: 1,
};

const cardIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  border: "2px solid #e2e8f0",
  flexShrink: 0,
};

const cardTitleSection = {
  flex: 1,
};

const cardTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "0.5rem",
};

const cardTitle = {
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.01em",
};

const hotBadge = {
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.25rem 0.75rem",
  background: "#fee2e2",
  borderRadius: "30px",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#dc2626",
  border: "1px solid #fecaca",
};

const newBadge = {
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.25rem 0.75rem",
  background: "#dbeafe",
  borderRadius: "30px",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
};

const weekBadge = {
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.25rem 0.75rem",
  background: "#fef3c7",
  borderRadius: "30px",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#d97706",
  border: "1px solid #fde68a",
};

const cardMeta = {
  display: "flex",
  gap: "0.5rem",
};

const cardCategory = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.25rem 0.75rem",
  background: "#f1f5f9",
  borderRadius: "30px",
  fontSize: "0.75rem",
  fontWeight: "600",
  color: "#475569",
  border: "1px solid #e2e8f0",
};

const cardContent = {
  flex: 1,
};

const listCardContent = {
  flex: 1,
  paddingLeft: "4rem",
};

const cardDescription = {
  fontSize: "1rem",
  color: "#334155",
  lineHeight: "1.6",
  margin: 0,
  whiteSpace: "pre-line",
};

const cardDescriptionClamped = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const readMoreButton = {
  background: "none",
  border: "none",
  color: "#3b82f6",
  fontSize: "0.9rem",
  fontWeight: "600",
  cursor: "pointer",
  padding: "0.5rem 0",
  marginTop: "0.25rem",
};

const cardFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "0.5rem",
  paddingTop: "1rem",
  borderTop: "2px solid #f1f5f9",
};

const listCardFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingLeft: "4rem",
};

const dateInfo = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "#64748b",
  fontSize: "0.9rem",
};

const dateIcon = {
  color: "#94a3b8",
  fontSize: "1rem",
};

const dateText = {
  color: "#475569",
  fontWeight: "500",
};

const expandIcon = {
  color: "#94a3b8",
  fontSize: "1rem",
  fontWeight: "bold",
};

// Quick Stats Footer
const quickStatsFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "2rem",
  padding: "1rem 1.5rem",
  background: "#f8fafc",
  borderRadius: "16px",
  border: "2px solid #e2e8f0",
  flexWrap: "wrap",
  gap: "1rem",
};

const quickStatsLeft = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const quickStatsBold = {
  fontSize: "1.2rem",
  fontWeight: "700",
  color: "#0f172a",
};

const quickStatsText = {
  fontSize: "0.95rem",
  color: "#475569",
  fontWeight: "500",
};

const quickStatsRight = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
};

const quickStatsItem = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.9rem",
  cursor: "pointer",
  padding: "0.25rem 0.5rem",
  borderRadius: "8px",
  transition: "all 0.2s",
};

const quickStatsDot = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  display: "inline-block",
};

// Scroll to top button
const scrollTopButton = {
  position: "fixed",
  bottom: "2rem",
  right: "2rem",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "#3b82f6",
  border: "none",
  color: "#ffffff",
  fontSize: "1.8rem",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 10px 25px -5px rgba(59,130,246,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};