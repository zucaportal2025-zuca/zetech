import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BASE_URL from "../../api";
import { motion, AnimatePresence } from "framer-motion";

export default function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [jumuias, setJumuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    special: false,
    admin: false,
    regular: false
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, jumuiaRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/api/jumuia`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setJumuias(jumuiaRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, role, specialRole, assignedJumuiaId = null) => {
    setUpdating(userId);
    try {
      await axios.put(
        `${BASE_URL}/api/users/${userId}/role`,
        { role, specialRole, assignedJumuiaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.fullName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.membership_number?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Separate users into categories
  const usersWithSpecialRoles = filteredUsers.filter(user => user.specialRole);
  const admins = filteredUsers.filter(user => user.role === "admin" && !user.specialRole);
  const regularMembers = filteredUsers.filter(user => user.role === "member" && !user.specialRole);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading users...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="role-management"
    >
      <div className="header">
        <div>
          <h1>Role Management</h1>
          <p className="subtitle">Assign special roles to users (Jumuia Leaders, Treasurer, Secretary, Choir Moderator, Media Moderator)</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, email or membership number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm("")}>
            ×
          </button>
        )}
      </div>

      {/* Users with Special Roles Section - Always open */}
      {usersWithSpecialRoles.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('special')}>
            <div className="section-title">
              <span className="section-icon">👑</span>
              <h2>Users with Special Roles</h2>
              <span className="section-count">{usersWithSpecialRoles.length}</span>
            </div>
            <button className="section-toggle">
              {expandedSections.special ? '▼' : '▶'}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.special && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="section-content"
              >
                <div className="users-grid">
                  {usersWithSpecialRoles.map(user => (
                    <UserRoleCard
                      key={user.id}
                      user={user}
                      jumuias={jumuias}
                      onUpdate={updateUserRole}
                      updating={updating === user.id}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Admins Section - Closed by default */}
      {admins.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('admin')}>
            <div className="section-title">
              <span className="section-icon">🛡️</span>
              <h2>Administrators</h2>
              <span className="section-count">{admins.length}</span>
            </div>
            <button className="section-toggle">
              {expandedSections.admin ? '▼' : '▶'}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.admin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="section-content"
              >
                <div className="users-grid">
                  {admins.map(user => (
                    <UserRoleCard
                      key={user.id}
                      user={user}
                      jumuias={jumuias}
                      onUpdate={updateUserRole}
                      updating={updating === user.id}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Regular Members Section - Closed by default */}
      {regularMembers.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('regular')}>
            <div className="section-title">
              <span className="section-icon">👤</span>
              <h2>Regular Members</h2>
              <span className="section-count">{regularMembers.length}</span>
            </div>
            <button className="section-toggle">
              {expandedSections.regular ? '▼' : '▶'}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.regular && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="section-content"
              >
                <div className="users-grid">
                  {regularMembers.map(user => (
                    <UserRoleCard
                      key={user.id}
                      user={user}
                      jumuias={jumuias}
                      onUpdate={updateUserRole}
                      updating={updating === user.id}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No Results */}
      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found matching "{searchTerm}"</p>
          <button className="clear-btn" onClick={() => setSearchTerm("")}>
            Clear Search
          </button>
        </div>
      )}

      <style>{`
        .role-management {
          min-height: 100vh;
          padding: 32px;
          background: linear-gradient(135deg, #141724 0%, #525e81 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #141519c7 0%, #764ba2 100%);
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .header {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Search Bar */
        .search-container {
          position: relative;
          margin-bottom: 24px;
        }

        .search-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          border: none;
          border-radius: 12px;
          background: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }

        .clear-search {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .clear-search:hover {
          background: #f1f5f9;
          color: #64748b;
        }

        /* Sections */
        .section {
          background: white;
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .section-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-header:hover {
          background: #f8fafc;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          font-size: 24px;
        }

        .section-title h2 {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .section-count {
          background: #e2e8f0;
          color: #475569;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .section-toggle {
          background: none;
          border: none;
          font-size: 18px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .section-toggle:hover {
          background: #f1f5f9;
        }

        .section-content {
          padding: 24px;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        /* No Results */
        .no-results {
          background: white;
          border-radius: 16px;
          padding: 60px 24px;
          text-align: center;
          color: #64748b;
        }

        .no-results p {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .clear-btn {
          padding: 10px 20px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .clear-btn:hover {
          background: #1d4ed8;
        }

        @media (max-width: 768px) {
          .role-management {
            padding: 16px;
          }

          .section-header {
            padding: 16px;
          }

          .section-content {
            padding: 16px;
          }

          .users-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );
}

function UserRoleCard({ user, jumuias, onUpdate, updating }) {
  const [role, setRole] = useState(user.role || "member");
  const [specialRole, setSpecialRole] = useState(user.specialRole || "");
  const [assignedJumuia, setAssignedJumuia] = useState(user.assignedJumuiaId || "");

  const handleSave = () => {
    onUpdate(
      user.id,
      role,
      specialRole || null,
      specialRole === "jumuia_leader" ? assignedJumuia : null
    );
  };

  // Get current special role display
  const getCurrentSpecialRole = () => {
    if (!user.specialRole) return null;
    const roles = {
      'jumuia_leader': 'Jumuia Leader',
      'treasurer': 'Treasurer',
      'secretary': 'Secretary',
      'choir_moderator': 'Choir Moderator',
      'media_moderator': 'Media Moderator'
    };
    return roles[user.specialRole];
  };

  return (
    <motion.div 
      className="user-card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="user-header">
        <div className="user-avatar">
          {user.fullName?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <h3>{user.fullName}</h3>
          <p className="user-email">{user.email}</p>
          <p className="membership">📋 {user.membership_number}</p>
          {user.specialRole && (
            <p className="current-role">
              <span className="role-badge" style={getSpecialRoleStyle(user.specialRole)}>
                {getCurrentSpecialRole()}
              </span>
            </p>
          )}
          {user.role === "admin" && !user.specialRole && (
            <p className="admin-badge">🛡️ Admin</p>
          )}
        </div>
      </div>

      <div className="role-fields">
        <div className="field-group">
          <label>Account Type</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            disabled={updating}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="field-group">
          <label>Special Role</label>
          <select 
            value={specialRole} 
            onChange={(e) => setSpecialRole(e.target.value)}
            disabled={updating}
          >
            <option value="">None</option>
            <option value="jumuia_leader">Jumuia Leader</option>
            <option value="treasurer">Treasurer</option>
            <option value="secretary">Secretary</option>
            <option value="choir_moderator">Choir Moderator</option>
            <option value="media_moderator">Media Moderator</option>
          </select>
        </div>

        {specialRole === "jumuia_leader" && (
          <div className="field-group">
            <label>Assign Jumuia</label>
            <select 
              value={assignedJumuia} 
              onChange={(e) => setAssignedJumuia(e.target.value)}
              disabled={updating}
            >
              <option value="">Select Jumuia</option>
              {jumuias.map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={updating}
        >
          {updating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <style jsx>{`
        .user-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .user-header {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .user-avatar {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .user-email {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0;
          word-break: break-word;
        }
        .membership {
          font-family: monospace;
          font-size: 12px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          margin: 4px 0;
        }
        .current-role {
          margin: 8px 0 0 0;
        }
        .role-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .admin-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          margin-top: 8px;
        }
        .role-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-group label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }
        .field-group select {
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        .field-group select:focus {
          outline: none;
          border-color: #2563eb;
        }
        .save-btn {
          margin-top: 8px;
          padding: 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .save-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
}

// Helper function for role badge colors
function getSpecialRoleStyle(role) {
  const styles = {
    'jumuia_leader': { background: 'rgba(139, 92, 246, 0.2)', color: '#7c3aed' },
    'treasurer': { background: 'rgba(245, 158, 11, 0.2)', color: '#d97706' },
    'secretary': { background: 'rgba(16, 185, 129, 0.2)', color: '#059669' },
    'choir_moderator': { background: 'rgba(236, 72, 153, 0.2)', color: '#db2777' },
    'media_moderator': { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }
  };
  return styles[role] || {};
}