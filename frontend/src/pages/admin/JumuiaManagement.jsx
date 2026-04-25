// frontend/src/pages/admin/JumuiaManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Add this import
import { api } from "../../api";

// Professional icon components
const Icons = {
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  More: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, // Add this icon
};

export default function JumuiaManagement() {
  const navigate = useNavigate(); // Add this hook
  
  const [jumuiaList, setJumuiaList] = useState([]);
  const [expandedJumuia, setExpandedJumuia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showNewJumuiaModal, setShowNewJumuiaModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [newJumuia, setNewJumuia] = useState({ name: "", description: "", location: "" });
  const [processingId, setProcessingId] = useState(null);

  // Professional color palette
  const colors = {
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    secondary: "#7c3aed",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    }
  };

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jumuiaRes = await api.get("/api/jumuia");
        
        const dataWithMembers = await Promise.all(
          jumuiaRes.data.map(async (j) => {
            try {
              const membersRes = await api.get(`/api/admin/jumuia/${j.id}/users`);
              return { 
                ...j, 
                members: membersRes.data,
                stats: {
                  totalContributions: membersRes.data.reduce((sum, m) => sum + (m.contributions || 0), 0),
                  activeMembers: membersRes.data.filter(m => m.lastActive && new Date(m.lastActive) > new Date(Date.now() - 30*24*60*60*1000)).length
                }
              };
            } catch (err) {
              console.error(`Failed to fetch members for ${j.name}:`, err);
              return { ...j, members: [], stats: { totalContributions: 0, activeMembers: 0 } };
            }
          })
        );
        
        setJumuiaList(dataWithMembers);
        showNotification("Data loaded successfully", "success");
      } catch (err) {
        console.error("Fetch error:", err);
        showNotification("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter and search logic
  const filteredJumuia = useMemo(() => {
    return jumuiaList.map(j => ({
      ...j,
      filteredMembers: j.members.filter(m => {
        const matchesSearch = m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || m.role === roleFilter;
        return matchesSearch && matchesRole;
      })
    }));
  }, [jumuiaList, searchQuery, roleFilter]);

  const handleCreateJumuia = async () => {
    if (!newJumuia.name) {
      showNotification("Jumuia name is required", "error");
      return;
    }

    try {
      setProcessingId("new");
      const response = await api.post("/api/admin/jumuia", newJumuia);
      setJumuiaList([...jumuiaList, { ...response.data, members: [], stats: { totalContributions: 0, activeMembers: 0 } }]);
      setShowNewJumuiaModal(false);
      setNewJumuia({ name: "", description: "", location: "" });
      showNotification("Jumuia created successfully", "success");
    } catch (err) {
      console.error("Create error:", err);
      showNotification("Failed to create Jumuia", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (userId, memberName, jumuiaId) => {
    if (!window.confirm(`Remove ${memberName} from this Jumuia?`)) return;
    
    setProcessingId(userId);
    try {
      await api.patch(`/api/admin/jumuia/${userId}`, { jumuiaId: null });
      
      setJumuiaList(prev => prev.map(j => 
        j.id === jumuiaId 
          ? { ...j, members: j.members.filter(m => m.id !== userId) }
          : j
      ));
      
      showNotification(`${memberName} removed successfully`, "success");
    } catch (err) {
      console.error("Remove error:", err);
      showNotification("Failed to remove member", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMoveMember = async (userId, targetJumuiaId, sourceJumuiaId, memberName) => {
    if (targetJumuiaId === sourceJumuiaId) {
      showNotification("Select a different Jumuia", "warning");
      return;
    }

    setProcessingId(userId);
    try {
      await api.patch(`/api/admin/jumuia/${userId}`, { jumuiaId: targetJumuiaId });
      
      // Refresh both source and target Jumuia members
      const [targetMembers, sourceMembers] = await Promise.all([
        api.get(`/api/admin/jumuia/${targetJumuiaId}/users`),
        api.get(`/api/admin/jumuia/${sourceJumuiaId}/users`)
      ]);

      setJumuiaList(prev => prev.map(j => {
        if (j.id === targetJumuiaId) return { ...j, members: targetMembers.data };
        if (j.id === sourceJumuiaId) return { ...j, members: sourceMembers.data };
        return j;
      }));

      showNotification(`${memberName} moved successfully`, "success");
    } catch (err) {
      console.error("Move error:", err);
      showNotification("Failed to move member", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkAssign = async (targetJumuiaId) => {
    if (selectedMembers.length === 0) {
      showNotification("No members selected", "warning");
      return;
    }

    try {
      await Promise.all(
        selectedMembers.map(memberId =>
          api.patch(`/api/admin/jumuia/${memberId}`, { jumuiaId: targetJumuiaId })
        )
      );

      // Refresh all Jumuia data
      const updatedJumuia = await Promise.all(
        jumuiaList.map(async (j) => {
          const membersRes = await api.get(`/api/admin/jumuia/${j.id}/users`);
          return { ...j, members: membersRes.data };
        })
      );

      setJumuiaList(updatedJumuia);
      setSelectedMembers([]);
      setBulkMode(false);
      showNotification(`${selectedMembers.length} members assigned`, "success");
    } catch (err) {
      console.error("Bulk assign error:", err);
      showNotification("Failed to assign members", "error");
    }
  };

  const handleExport = () => {
    const data = jumuiaList.map(j => ({
      Jumuia: j.name,
      Description: j.description || "",
      Location: j.location || "",
      Members: j.members.length,
      Admins: j.members.filter(m => m.role === "admin").length,
      ActiveMembers: j.stats?.activeMembers || 0,
      MemberList: j.members.map(m => `${m.fullName} (${m.role})`).join(", ")
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jumuia-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification("Export completed", "success");
  };

  const handleViewJumuia = (e, jumuia) => {
    e.stopPropagation(); // Prevent triggering the expand/collapse
    navigate(`/jumuia/${jumuia.code || jumuia.id}`);
  };

  const stats = useMemo(() => ({
    totalJumuia: jumuiaList.length,
    totalMembers: jumuiaList.reduce((sum, j) => sum + j.members.length, 0),
    totalAdmins: jumuiaList.reduce((sum, j) => sum + j.members.filter(m => m.role === "admin").length, 0),
    activeMembers: jumuiaList.reduce((sum, j) => sum + (j.stats?.activeMembers || 0), 0)
  }), [jumuiaList]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading management data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Notification System */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              ...styles.notification,
              ...(notification.type === "success" ? styles.notificationSuccess : styles.notificationError),
            }}
          >
            <span style={styles.notificationIcon}>
              {notification.type === "success" ? "✓" : "⚠"}
            </span>
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Jumuia Management</h1>
          <p style={styles.subtitle}>Manage church communities and members with full control</p>
        </div>
        <div style={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.exportBtn}
            onClick={handleExport}
          >
            <Icons.Download />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.primaryBtn}
            onClick={() => setShowNewJumuiaModal(true)}
          >
            <Icons.Plus />
            New Jumuia
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
            <Icons.Building />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.totalJumuia}</span>
            <span style={styles.statLabel}>Jumuia Groups</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>
            <Icons.Users />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.totalMembers}</span>
            <span style={styles.statLabel}>Total Members</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #10b981, #34d399)" }}>
            <Icons.Shield />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.totalAdmins}</span>
            <span style={styles.statLabel}>Admins</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.activeMembers}</span>
            <span style={styles.statLabel}>Active (30d)</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={styles.filtersBar}>
        <div style={styles.searchWrapper}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Search members by name or email..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={styles.filterWrapper}>
          <Icons.Filter />
          <select
            style={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="admin">Admins</option>
            <option value="treasurer">Treasurers</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            ...styles.bulkToggle,
            ...(bulkMode && styles.bulkToggleActive)
          }}
          onClick={() => setBulkMode(!bulkMode)}
        >
          <Icons.Check />
          Bulk Mode
        </motion.button>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {bulkMode && selectedMembers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={styles.bulkBar}
          >
            <span style={styles.bulkSelected}>
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </span>
            <div style={styles.bulkActions}>
              <select
                style={styles.bulkSelect}
                onChange={(e) => handleBulkAssign(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Move to Jumuia...</option>
                {jumuiaList.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
              <button
                style={styles.bulkClear}
                onClick={() => setSelectedMembers([])}
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jumuia List */}
      <div style={styles.jumuiaList}>
        {filteredJumuia.map((jumuia) => (
          <motion.div
            key={jumuia.id}
            layout
            style={styles.jumuiaCard}
          >
            {/* Jumuia Header */}
            <div style={styles.jumuiaHeader}>
              <div 
                style={styles.jumuiaHeaderLeft}
                onClick={() => setExpandedJumuia(expandedJumuia === jumuia.id ? null : jumuia.id)}
              >
                <div style={styles.jumuiaIcon}>
                  <Icons.Building />
                </div>
                <div style={styles.jumuiaInfo}>
                  <h3 style={styles.jumuiaName}>{jumuia.name}</h3>
                  <div style={styles.jumuiaMeta}>
                    <span style={styles.metaBadge}>
                      {jumuia.members.length} members
                    </span>
                    {jumuia.description && (
                      <span style={styles.metaText}>{jumuia.description}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={styles.jumuiaHeaderRight}>
                {/* ADDED: View Full Page Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={styles.viewFullBtn}
                  onClick={(e) => handleViewJumuia(e, jumuia)}
                >
                  <Icons.Eye />
                  View Full Page
                </motion.button>
                
                <span 
                  style={styles.expandIcon}
                  onClick={() => setExpandedJumuia(expandedJumuia === jumuia.id ? null : jumuia.id)}
                >
                  {expandedJumuia === jumuia.id ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                </span>
              </div>
            </div>

            {/* Members Table */}
            <AnimatePresence>
              {expandedJumuia === jumuia.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={styles.membersContainer}
                >
                  {jumuia.filteredMembers.length === 0 ? (
                    <div style={styles.noMembers}>
                      <Icons.Users />
                      <p>No members found in this Jumuia</p>
                    </div>
                  ) : (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead style={styles.tableHead}>
                          <tr>
                            {bulkMode && <th style={styles.checkboxCell}></th>}
                            <th style={styles.tableHeader}>Member</th>
                            <th style={styles.tableHeader}>Role</th>
                            <th style={styles.tableHeader}>Contact</th>
                            <th style={styles.tableHeader}>Status</th>
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jumuia.filteredMembers.map((member) => (
                            <tr key={member.id} style={styles.tableRow}>
                              {bulkMode && (
                                <td style={styles.checkboxCell}>
                                  <input
                                    type="checkbox"
                                    style={styles.checkbox}
                                    checked={selectedMembers.includes(member.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMembers([...selectedMembers, member.id]);
                                      } else {
                                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                      }
                                    }}
                                  />
                                </td>
                              )}
                              <td style={styles.tableCell}>
                                <div style={styles.memberInfo}>
                                  <div style={styles.memberAvatar}>
                                    {member.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={styles.memberName}>{member.fullName}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={styles.tableCell}>
                                <span style={{
                                  ...styles.roleBadge,
                                  ...(member.role === "admin" && styles.roleAdmin),
                                  ...(member.role === "treasurer" && styles.roleTreasurer),
                                }}>
                                  {member.role}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <div style={styles.contactInfo}>
                                  <Icons.Mail />
                                  <span style={styles.contactEmail}>{member.email}</span>
                                </div>
                              </td>
                              <td style={styles.tableCell}>
                                <span style={{
                                  ...styles.statusBadge,
                                  ...(member.lastActive && new Date(member.lastActive) > new Date(Date.now() - 7*24*60*60*1000) 
                                    ? styles.statusActive 
                                    : styles.statusInactive)
                                }}>
                                  {member.lastActive && new Date(member.lastActive) > new Date(Date.now() - 7*24*60*60*1000) 
                                    ? "Active" 
                                    : "Inactive"}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <div style={styles.actionGroup}>
                                  <select
                                    style={styles.moveSelect}
                                    onChange={(e) => handleMoveMember(
                                      member.id,
                                      e.target.value,
                                      jumuia.id,
                                      member.fullName
                                    )}
                                    defaultValue=""
                                    disabled={processingId === member.id}
                                  >
                                    <option value="" disabled>Move to...</option>
                                    {jumuiaList.filter(j => j.id !== jumuia.id).map(j => (
                                      <option key={j.id} value={j.id}>{j.name}</option>
                                    ))}
                                  </select>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={styles.removeBtn}
                                    onClick={() => handleRemoveMember(
                                      member.id,
                                      member.fullName,
                                      jumuia.id
                                    )}
                                    disabled={processingId === member.id}
                                  >
                                    {processingId === member.id ? "..." : "Remove"}
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* New Jumuia Modal */}
      <AnimatePresence>
        {showNewJumuiaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowNewJumuiaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modal}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Create New Jumuia</h2>
                <button style={styles.modalClose} onClick={() => setShowNewJumuiaModal(false)}>
                  <Icons.X />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Name *</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={newJumuia.name}
                    onChange={(e) => setNewJumuia({ ...newJumuia, name: e.target.value })}
                    placeholder="e.g., St. Joseph Jumuia"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    style={styles.formTextarea}
                    value={newJumuia.description}
                    onChange={(e) => setNewJumuia({ ...newJumuia, description: e.target.value })}
                    placeholder="Brief description of the Jumuia"
                    rows="3"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={newJumuia.location}
                    onChange={(e) => setNewJumuia({ ...newJumuia, location: e.target.value })}
                    placeholder="e.g., Nairobi Central"
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.modalCancelBtn}
                  onClick={() => setShowNewJumuiaModal(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.modalCreateBtn}
                  onClick={handleCreateJumuia}
                  disabled={processingId === "new"}
                >
                  {processingId === "new" ? "Creating..." : "Create Jumuia"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Professional, clean styles
const styles = {
  container: {
    padding: "32px",
    minHeight: "100vh",
    background: "#8ce1dc99",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#1e293b",
    borderRadius: "30px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f8fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    color: "#64748b",
    fontSize: "14px",
  },
  notification: {
    position: "fixed",
    top: "24px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
  },
  notificationSuccess: {
    background: "#10b981",
  },
  notificationError: {
    background: "#ef4444",
  },
  notificationIcon: {
    fontSize: "16px",
    fontWeight: "600",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "25px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#ffffff",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  exportBtn: {
    padding: "9px 9px",
    borderRadius: "9px",
    marginTop: "30px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  primaryBtn: {
    padding: "9px 9px",
    borderRadius: "9px",
    marginTop: "30px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: "1.2",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  filtersBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    flex: 1,
    minWidth: "300px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    "::placeholder": {
      color: "#94a3b8",
    },
  },
  filterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
  },
  filterSelect: {
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    background: "transparent",
    cursor: "pointer",
  },
  bulkToggle: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  bulkToggleActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
  },
  bulkBar: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  bulkSelected: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
  },
  bulkActions: {
    display: "flex",
    gap: "8px",
  },
  bulkSelect: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#1e293b",
    minWidth: "200px",
    outline: "none",
  },
  bulkClear: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: "13px",
    cursor: "pointer",
  },
  jumuiaList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  jumuiaCard: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  jumuiaHeader: {
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#5af2f8",
    transition: "background 0.2s",
    "&:hover": {
      background: "#f8fafc",
    },
  },
  jumuiaHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    flex: 1,
  },
  jumuiaIcon: {
    width: "40px",
    height: "40px",
    
    borderRadius: "10px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
  },
  jumuiaInfo: {
    flex: 1,
  },
  jumuiaName: {
  fontSize: "14px",           // ← Extra large
  fontWeight: "800",          // ← Extra bold
  color: "#0f172a",
  margin: "0 0 12px 0",
  letterSpacing: "-0.03em",
  lineHeight: "1.1",
  display: "block",
  borderBottom: "3px solid #3b82f6",  // ← Solid blue underline
  paddingBottom: "10px",
  textTransform: "uppercase",  // ← Optional: all caps
  fontFamily: "'Inter', -apple-system, sans-serif" // ← Optional: clean font
},
  
  jumuiaMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  metaBadge: {
    padding: "4px 3px",
    borderRadius: "20px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "500",
  },
  metaText: {
    fontSize: "13px",
    color: "#64748b",
  },
  jumuiaHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  // ADDED: View Full Page button style
  viewFullBtn: {
   
    padding: "3px 5px",
    borderRadius: "9px",
    
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
  },
  expandIcon: {
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  membersContainer: {
    borderTop: "1px solid #e2e8f0d9",
    padding: "20px",
    overflow: "hidden",
  },
  noMembers: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHead: {
    background: "#148c8c",
    borderBottom: "2px solid #e2e8f0",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  checkboxCell: {
    width: "40px",
    padding: "12px",
    textAlign: "center",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#2563eb",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    "&:hover": {
      background: "#f8fafc",
    },
  },
  tableCell: {
    padding: "12px 16px",
    color: "#1e293b",
  },
  memberInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  memberAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  memberName: {
    fontWeight: "700",
    color: "#0f172a",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
    background: "#f1f5f9",
    color: "#475569",
  },
  roleAdmin: {
    background: "#fee2e2",
    color: "#dc2626",
  },
  roleTreasurer: {
    background: "#fef3c7",
    color: "#d97706",
  },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
  },
  contactEmail: {
    fontSize: "13px",
    color: "#1e293b",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
  },
  statusActive: {
    background: "#dcfce7",
    color: "#059669",
  },
  statusInactive: {
    background: "#f1f5f9",
    color: "#64748b",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  moveSelect: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#1e293b",
    outline: "none",
    minWidth: "100px",
  },
  removeBtn: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    marginBottom: "6px",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: "#2563eb",
    },
  },
  formTextarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: "#2563eb",
    },
  },
  modalFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  modalCancelBtn: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  modalCreateBtn: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
  },
};

// Add global keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);