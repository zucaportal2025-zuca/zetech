// frontend/src/pages/admin/UsersPage.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import BASE_URL from "../../api";
import backgroundImg from "../../assets/background.png";

// Professional icon components
const Icons = {
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/></svg>,
  Refresh: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Delete: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Online: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>,
  Offline: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Excel: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
  Doc: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Membership: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-4.5L15 4H9L8.5 7H4v2h16V7z"/><rect x="4" y="9" width="16" height="10" rx="2"/></svg>,
  Copy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  Id: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState(false);

  // Helper functions for special roles
  const formatSpecialRole = (role) => {
    const roles = {
      'jumuia_leader': 'Jumuia Leader',
      'treasurer': 'Treasurer',
      'secretary': 'Secretary',
      'choir_moderator': 'Choir Moderator'
    };
    return roles[role] || role;
  };

  const getSpecialRoleStyle = (role) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
    };
    
    switch(role) {
      case 'jumuia_leader':
        return { ...baseStyle, background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' };
      case 'treasurer':
        return { ...baseStyle, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' };
      case 'secretary':
        return { ...baseStyle, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' };
      case 'choir_moderator':
        return { ...baseStyle, background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' };
      default:
        return { ...baseStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' };
    }
  };
  
  const exportMenuRef = useRef(null);
  const token = localStorage.getItem("token");

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type, id: Date.now() });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification("Copied to clipboard", "success");
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched users:", res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError("Failed to fetch users. Are you logged in as admin?");
      setUsers([]);
      showNotification("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const deleteUser = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;
    
    setUpdatingUserId(id);
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(u => u.id !== id));
      showNotification(`${userName} deleted successfully`, "success");
    } catch (err) {
      console.error("Delete User Error:", err);
      showNotification(err.response?.data?.error || "Delete failed", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const changeRole = async (id, newRole, userName) => {
    setUpdatingUserId(id);
    try {
      await axios.put(
        `${BASE_URL}/api/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      showNotification(`${userName} is now ${newRole}`, "success");
    } catch (err) {
      console.error("Change Role Error:", err);
      showNotification(err.response?.data?.error || "Role change failed", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      showNotification("No users selected", "error");
      return;
    }

    if (!window.confirm(`Delete ${selectedUsers.length} selected users?`)) return;

    try {
      await Promise.all(
        selectedUsers.map(id => 
          axios.delete(`${BASE_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setUsers(users.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setSelectAll(false);
      showNotification(`${selectedUsers.length} users deleted`, "success");
    } catch (err) {
      console.error("Bulk delete error:", err);
      showNotification("Failed to delete some users", "error");
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle select user
  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.membership_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "online" && user.online) ||
                           (statusFilter === "offline" && !user.online);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    online: users.filter(u => u.online).length,
    admins: users.filter(u => u.role === "admin").length,
    members: users.filter(u => u.role === "member").length,
  }), [users]);

  // Export functions
  const exportToExcel = (data, filename) => {
    const exportData = data.map(user => ({
      Name: user.fullName,
      "Membership Number": user.membership_number || "N/A",
      Email: user.email,
      Role: user.role,
      "Special Role": user.specialRole ? formatSpecialRole(user.specialRole) : "None",
      "Home Jumuia": user.homeJumuia?.name || "N/A",
      "Leading Jumuia": user.leadingJumuia?.name || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [];
    const headers = Object.keys(exportData[0] || {});
    headers.forEach(header => {
      let maxLength = header.length;
      exportData.forEach(row => {
        const cellValue = String(row[header] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToDoc = (data, filename) => {
    const exportData = data.map(user => ({
      Name: user.fullName,
      "Membership Number": user.membership_number || "N/A",
      Email: user.email,
      Role: user.role,
      "Special Role": user.specialRole ? formatSpecialRole(user.specialRole) : "None",
      "Home Jumuia": user.homeJumuia?.name || "N/A",
      "Leading Jumuia": user.leadingJumuia?.name || "N/A",
    }));

    let htmlContent = `
      <!DOCTYPE html>
<html>
<head>
<title>${filename}</title>
<style>
@page {
  size: A4;
  margin: 1in;
}
body { 
  font-family: "Times New Roman", Times, serif;
  margin: 0;
  padding: 0;
  color: #000;
  line-height: 1.4;
}
.container{
  width: 90%;
  margin: 0 auto;
}
h1 { 
  color: #000;
  border-bottom: 2px solid #000;
  padding-bottom: 6px;
  font-size: 24pt;
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.header-info{
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  font-size: 12pt;
}
table{
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
  border: 1px solid #999;
  table-layout: fixed;
}
th{
  background: #e0e0e0;
  padding: 10px 8px;
  border: 1px solid #999;
  font-weight: bold;
  text-align: left;
  font-size: 12pt;
}
td{
  padding: 8px;
  border: 1px solid #999;
  word-wrap: break-word;
  font-size: 11pt;
}
tr:nth-child(even){
  background: #f9f9f9;
}
tr{
  page-break-inside: avoid;
}
thead{
  display: table-header-group;
}
.footer{
  margin-top: 30px;
  text-align: right;
  font-size: 10pt;
  color: #666;
  border-top: 1px solid #ccc;
  padding-top: 10px;
}
th:nth-child(1){ width:15%; } /* Name */
th:nth-child(2){ width:10%; } /* Membership Number */
th:nth-child(3){ width:15%; } /* Email */
th:nth-child(4){ width:8%; } /* Role */
th:nth-child(5){ width:12%; } /* Special Role */
th:nth-child(6){ width:10%; } /* Home Jumuia */
th:nth-child(7){ width:10%; } /* Leading Jumuia */
</style>
</head>
<body>
        <h1>USERS REPORT</h1>
        <div class="header-info">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Users:</strong> ${exportData.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${Object.keys(exportData[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.map(row => `
              <tr>
                ${Object.values(row).map(val => {
                  if (val && val.toString().length > 50) {
                    return `<td>${val.toString().substring(0, 50)}...</td>`;
                  }
                  return `<td>${val || '-'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by ZUCA Portal - User Management System</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `${filename}.doc`);
  };

  const handleExport = (format) => {
    const dataToExport = selectedUsers.length > 0 
      ? users.filter(u => selectedUsers.includes(u.id))
      : filteredUsers;

    if (dataToExport.length === 0) {
      showNotification("No users to export", "error");
      return;
    }

    const filename = `users_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      exportToExcel(dataToExport, filename);
    } else if (format === 'doc') {
      exportToDoc(dataToExport, filename);
    }

    setShowExportMenu(false);
    showNotification(`Exported ${dataToExport.length} users`, "success");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading users...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ ...styles.container, backgroundImage: `url(${backgroundImg})` }}
    >
      {/* Background Overlay */}
      <div style={styles.overlay} />

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            style={{
              ...styles.notification,
              ...(notification.type === "success" ? styles.notificationSuccess : styles.notificationError),
            }}
          >
            {notification.type === "success" ? "✓" : "⚠"} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>Manage system users, roles, and permissions</p>
        </div>
        <div style={styles.headerActions}>
          {/* Export Dropdown */}
          <div style={styles.exportWrapper} ref={exportMenuRef}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.exportBtn}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Icons.Download />
              Export
              <span style={styles.chevron}>{showExportMenu ? "▼" : "▶"}</span>
            </motion.button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={styles.exportMenu}
                >
                  <button style={styles.exportMenuItem} onClick={() => handleExport('excel')}>
                    <Icons.Excel /> Excel Spreadsheet
                  </button>
                  <button style={styles.exportMenuItem} onClick={() => handleExport('doc')}>
                    <Icons.Doc /> Word Document
                  </button>
                  <div style={styles.exportMenuNote}>
                    {selectedUsers.length > 0 
                      ? `Exporting ${selectedUsers.length} selected users`
                      : `Exporting all ${filteredUsers.length} filtered users`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.refreshBtn}
            onClick={fetchUsers}
          >
            <Icons.Refresh /> Refresh
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <motion.div 
          whileHover={{ y: -2 }}
          style={styles.statCard}
        >
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
            <Icons.User />
          </div>
          <div>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Total Users</span>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          style={styles.statCard}
        >
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #10b981, #34d399)" }}>
            <Icons.Online />
          </div>
          <div>
            <span style={styles.statValue}>{stats.online}</span>
            <span style={styles.statLabel}>Online Now</span>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          style={styles.statCard}
        >
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>
            <Icons.Shield />
          </div>
          <div>
            <span style={styles.statValue}>{stats.admins}</span>
            <span style={styles.statLabel}>Admins</span>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          style={styles.statCard}
        >
          <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
            <Icons.Membership />
          </div>
          <div>
            <span style={styles.statValue}>{stats.members}</span>
            <span style={styles.statLabel}>Members</span>
          </div>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div style={styles.filtersBar}>
        <div style={styles.searchWrapper}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Search by name, email or membership number..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <option value="admin">Admins</option>
            <option value="member">Members</option>
          </select>
        </div>

        <div style={styles.filterWrapper}>
          <select
            style={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Mobile Toggle */}
        <button 
          style={styles.mobileToggle}
          onClick={() => setExpandedMobileMenu(!expandedMobileMenu)}
        >
          <Icons.ChevronDown />
        </button>

        {/* Bulk Actions - Desktop */}
        {selectedUsers.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={styles.bulkDeleteBtn}
            onClick={handleBulkDelete}
          >
            <Icons.Delete /> Delete ({selectedUsers.length})
          </motion.button>
        )}
      </div>

      {/* Mobile Bulk Actions */}
      <AnimatePresence>
        {expandedMobileMenu && selectedUsers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={styles.mobileBulkBar}
          >
            <span>{selectedUsers.length} users selected</span>
            <button style={styles.mobileBulkDelete} onClick={handleBulkDelete}>
              <Icons.Delete /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={styles.tableHeader}>User</th>
                <th style={styles.tableHeader}>Membership #</th>
                <th style={styles.tableHeader}>Contact</th>
                <th style={styles.tableHeader}>Role</th>
                <th style={styles.tableHeader}>Special Role</th>
                <th style={styles.tableHeader}>Home Jumuia</th>
                <th style={styles.tableHeader}>Leading Jumuia</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Last Active</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onHoverStart={() => setHoveredRow(user.id)}
                  onHoverEnd={() => setHoveredRow(null)}
                  style={{
                    ...styles.tableRow,
                    ...(updatingUserId === user.id && styles.tableRowUpdating),
                    ...(hoveredRow === user.id && styles.tableRowHover),
                  }}
                >
                  <td style={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.userInfo}>
                      {user.profileImage ? (
                        <img
                          src={
                            user.profileImage.startsWith("http")
                              ? user.profileImage
                              : `${BASE_URL}/${user.profileImage}`
                          }
                          alt={user.fullName}
                          style={styles.userAvatar}
                          onClick={() => setModalUser(user)}
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          style={styles.userAvatarFallback}
                          onClick={() => setModalUser(user)}
                        >
                          {user.fullName?.charAt(0).toUpperCase() || "?"}
                        </motion.div>
                      )}
                      <div>
                        <div style={styles.userName}>{user.fullName}</div>
                        <div style={styles.userId}>ID: {user.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.membershipCell}>
                      <span style={styles.membershipNumber}>
                        {user.membership_number || "—"}
                      </span>
                      {user.membership_number && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          style={styles.copyBtn}
                          onClick={() => copyToClipboard(user.membership_number, `mem-${user.id}`)}
                        >
                          {copiedId === `mem-${user.id}` ? "✓" : <Icons.Copy />}
                        </motion.button>
                      )}
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.contactInfo}>
                      <Icons.Mail />
                      <span style={styles.userEmail}>{user.email}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        style={styles.copyBtn}
                        onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                      >
                        {copiedId === `email-${user.id}` ? "✓" : <Icons.Copy />}
                      </motion.button>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      style={{
                        ...styles.roleBadge,
                        ...(user.role === "admin" && styles.roleAdmin),
                        ...(user.role === "member" && styles.roleMember),
                      }}
                    >
                      {user.role}
                    </motion.span>
                  </td>
                  <td style={styles.tableCell}>
                    {user.specialRole ? (
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        style={getSpecialRoleStyle(user.specialRole)}
                      >
                        {formatSpecialRole(user.specialRole)}
                      </motion.span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.jumuiaBadge}>
                      {user.homeJumuia?.name || "—"}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    {user.specialRole === "jumuia_leader" ? (
                      <span style={styles.jumuiaBadge}>
                        {user.leadingJumuia?.name || "—"}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.statusInfo}>
                      <motion.span
                        animate={{ scale: user.online ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: user.online ? Infinity : 0, duration: 2 }}
                        style={{
                          ...styles.statusDot,
                          background: user.online ? "#10b981" : "#ef4444"
                        }}
                      />
                      <span>{user.online ? "Online" : "Offline"}</span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.lastActive}>
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      {user.role === "member" ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={styles.promoteBtn}
                          onClick={() => changeRole(user.id, "admin", user.fullName)}
                          disabled={updatingUserId === user.id}
                        >
                          {updatingUserId === user.id ? "..." : "Promote"}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={styles.demoteBtn}
                          onClick={() => changeRole(user.id, "member", user.fullName)}
                          disabled={updatingUserId === user.id}
                        >
                          {updatingUserId === user.id ? "..." : "Demote"}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={styles.deleteBtn}
                        onClick={() => deleteUser(user.id, user.fullName)}
                        disabled={updatingUserId === user.id}
                      >
                        <Icons.Delete />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.noResults}
            >
              <Icons.Search />
              <p>No users found matching your filters</p>
              <button style={styles.clearFiltersBtn} onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}>
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {modalUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setModalUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                style={styles.modalClose}
                onClick={() => setModalUser(null)}
              >
                ×
              </motion.button>
              
              <div style={styles.modalHeader}>
                {modalUser.profileImage ? (
                  <img
                    src={
                      modalUser.profileImage.startsWith("http")
                        ? modalUser.profileImage
                        : `${BASE_URL}/${modalUser.profileImage}`
                    }
                    alt={modalUser.fullName}
                    style={styles.modalAvatar}
                  />
                ) : (
                  <div style={styles.modalAvatarFallback}>
                    {modalUser.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div style={styles.modalTitleInfo}>
                  <h2 style={styles.modalName}>{modalUser.fullName}</h2>
                  <p style={styles.modalEmail}>{modalUser.email}</p>
                </div>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Membership #</span>
                  <span style={styles.modalInfoValue}>
                    {modalUser.membership_number || "Not assigned"}
                    {modalUser.membership_number && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        style={styles.modalCopyBtn}
                        onClick={() => copyToClipboard(modalUser.membership_number, `modal-${modalUser.id}`)}
                      >
                        {copiedId === `modal-${modalUser.id}` ? "✓" : <Icons.Copy />}
                      </motion.button>
                    )}
                  </span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>User ID</span>
                  <span style={styles.modalInfoValue}>{modalUser.id}</span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Role</span>
                  <span style={{
                    ...styles.modalRole,
                    ...(modalUser.role === "admin" && styles.roleAdmin),
                  }}>
                    {modalUser.role}
                  </span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Special Role</span>
                  <span>{modalUser.specialRole ? formatSpecialRole(modalUser.specialRole) : "None"}</span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Home Jumuia</span>                  
                  <span>{modalUser.homeJumuia?.name || "Not assigned"}</span>
                </div>
                {modalUser.specialRole === "jumuia_leader" && (
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Leading Jumuia</span>                  
                    <span>{modalUser.leadingJumuia?.name || "Not assigned"}</span>
                  </div>
                )}
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Status</span>
                  <span style={styles.modalStatus}>
                    <motion.span
                      animate={{ scale: modalUser.online ? [1, 1.2, 1] : 1 }}
                      transition={{ repeat: modalUser.online ? Infinity : 0, duration: 2 }}
                      style={{
                        ...styles.statusDot,
                        background: modalUser.online ? "#10b981" : "#ef4444",
                        marginRight: "8px",
                      }}
                    />
                    {modalUser.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Last Active</span>
                  <span>{modalUser.lastActive ? new Date(modalUser.lastActive).toLocaleString() : "Never"}</span>
                </div>
                <div style={styles.modalInfoRow}>
                  <span style={styles.modalInfoLabel}>Member Since</span>
                  <span>{modalUser.createdAt ? new Date(modalUser.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={styles.modalActionBtn}
                  onClick={() => {
                    if (modalUser.role === "member") {
                      changeRole(modalUser.id, "admin", modalUser.fullName);
                    } else {
                      changeRole(modalUser.id, "member", modalUser.fullName);
                    }
                    setModalUser(null);
                  }}
                >
                  {modalUser.role === "member" ? "Make Admin" : "Make Member"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={styles.modalDeleteBtn}
                  onClick={() => {
                    deleteUser(modalUser.id, modalUser.fullName);
                    setModalUser(null);
                  }}
                >
                  Delete User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.4);
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .filters-bar {
              flex-direction: column;
              align-items: stretch !important;
            }
            
            .search-wrapper {
              width: 100%;
            }
          }
        `}
      </style>
    </motion.div>
  );
}

// Professional, clean styles with main background
const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    position: "relative",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#fff",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(11, 20, 26, 0.85)",
    backdropFilter: "blur(8px)",
    zIndex: 0,
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
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  notificationSuccess: {
    background: "#10b981",
  },
  notificationError: {
    background: "#ef4444",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b141a",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    color: "#fff",
    fontSize: "14px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    position: "relative",
    zIndex: 10,
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#fff",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    position: "relative",
    zIndex: 100,
  },
  exportWrapper: {
    position: "relative",
    zIndex: 1000,
  },
  exportBtn: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  exportMenu: {
    position: "absolute",
    top: "100%",
    right: -30,
    left: 10,
    marginTop: "8px",
    width: "260px",
    background: "rgba(30, 30, 40, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "8px",
    zIndex: 2000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  exportMenuItem: {
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    "&:hover": {
      background: "rgba(255,255,255,0.1)",
    },
  },
  exportMenuNote: {
    padding: "12px 16px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: "8px",
  },
  refreshBtn: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  chevron: {
    fontSize: "12px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1,
  },
  statCard: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "all 0.2s",
    cursor: "default",
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
  statValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "600",
    color: "#fff",
    lineHeight: "1.2",
  },
  statLabel: {
    display: "block",
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
  },
  filtersBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  searchWrapper: {
    flex: 1,
    minWidth: "280px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.5)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#fff",
    background: "transparent",
    "::placeholder": {
      color: "rgba(255,255,255,0.5)",
    },
  },
  filterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.7)",
    minWidth: "140px",
  },
  filterSelect: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#fff",
    background: "transparent",
    cursor: "pointer",
    option: {
      background: "#1e293b",
    },
  },
  mobileToggle: {
    display: "none",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    "@media (max-width: 768px)": {
      display: "flex",
    },
  },
  bulkDeleteBtn: {
    padding: "8px 16px",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    "&:hover": {
      background: "#dc2626",
    },
  },
  mobileBulkBar: {
    padding: "12px",
    background: "rgba(239, 68, 68, 0.2)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff",
  },
  mobileBulkDelete: {
    padding: "6px 12px",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  tableContainer: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
    width: "100%",
    position: "relative",
    zIndex: 1,
  },
  tableWrapper: {
    maxHeight: "600px",
    overflowY: "auto",
    overflowX: "auto",
    width: "100%",
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1400px",
    fontSize: "14px",
  },
  tableHead: {
    background: "rgba(0,0,0,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  tableHeader: {
    padding: "16px 12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  checkboxCell: {
    width: "40px",
    padding: "12px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#2563eb",
  },
  tableRow: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.2s",
  },
  tableRowHover: {
    background: "rgba(255,255,255,0.1)",
  },
  tableRowUpdating: {
    opacity: 0.6,
    pointerEvents: "none",
  },
  tableCell: {
    padding: "12px",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "40px",
    objectFit: "cover",
    cursor: "pointer",
    border: "2px solid rgba(255,255,255,0.3)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  userAvatarFallback: {
    width: "40px",
    height: "40px",
    borderRadius: "40px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    border: "2px solid rgba(255,255,255,0.3)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  userName: {
    fontWeight: "600",
    color: "#fff",
    marginBottom: "2px",
  },
  userId: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
  },
  membershipCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  membershipNumber: {
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    color: "#fff",
    background: "rgba(37,99,235,0.2)",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "rgba(255,255,255,0.7)",
  },
  userEmail: {
    fontSize: "13px",
    color: "#fff",
  },
  copyBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    textTransform: "uppercase",
  },
  roleAdmin: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
  },
  roleMember: {
    background: "rgba(37, 99, 235, 0.2)",
    color: "#3b82f6",
  },
  jumuiaBadge: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  statusInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 8px currentColor",
  },
  lastActive: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  promoteBtn: {
    padding: "6px 12px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "#059669",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  demoteBtn: {
    padding: "6px 12px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "#d97706",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  deleteBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "rgba(239, 68, 68, 0.3)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  noResults: {
    padding: "60px 20px",
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  clearFiltersBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    background: "rgba(30,30,40,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  modalClose: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "32px",
    height: "32px",
    borderRadius: "16px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  modalHeader: {
    padding: "32px 32px 24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  modalAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "40px",
    objectFit: "cover",
    border: "3px solid rgba(255,255,255,0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  modalAvatarFallback: {
    width: "80px",
    height: "80px",
    borderRadius: "40px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "600",
  },
  modalTitleInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
    margin: "0 0 4px 0",
  },
  modalEmail: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },
  modalBody: {
    padding: "24px 32px",
  },
  modalInfoRow: {
    display: "flex",
    marginBottom: "16px",
    fontSize: "14px",
  },
  modalInfoLabel: {
    width: "120px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  modalInfoValue: {
    flex: 1,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  modalCopyBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  modalRole: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
  },
  modalStatus: {
    display: "flex",
    alignItems: "center",
  },
  modalFooter: {
    padding: "24px 32px 32px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  modalActionBtn: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    "&:hover": {
      background: "#1d4ed8",
    },
  },
  modalDeleteBtn: {
    padding: "10px 20px",
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(239, 68, 68, 0.3)",
    },
  },
};