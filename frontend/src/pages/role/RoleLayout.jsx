// frontend/src/pages/role/RoleLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function RoleLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user.role) {
      navigate("/login");
    }
  }, []);

  const getRoleInfo = () => {
    switch(user.role) {
      case "secretary":
        return { 
          icon: "📝", 
          name: "Secretary", 
          color: "#10b981",
          description: "Manage announcements"
        };
      case "treasurer":
        return { 
          icon: "💰", 
          name: "Treasurer", 
          color: "#f59e0b",
          description: "Manage contributions"
        };
      case "choir_moderator":
        return { 
          icon: "🎵", 
          name: "Choir Moderator", 
          color: "#ec4899",
          description: "Manage mass programs & songs"
        };
      case "jumuia_leader":
        return { 
          icon: "👑", 
          name: "Jumuia Leader", 
          color: "#8b5cf6",
          description: "Manage your jumuia"
        };
      case "media_moderator":  // ← ADD THIS
        return { 
          icon: "📸", 
          name: "Media Moderator", 
          color: "#3b82f6",
          description: "Manage gallery & media"
        };
      default:
        return { 
          icon: "👤", 
          name: "Member", 
          color: "#64748b",
          description: "Welcome back"
        };
    }
  };

  const roleInfo = getRoleInfo();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="role-layout">
      {/* Header with role badge */}
      <div className="role-header" style={{ borderBottomColor: roleInfo.color }}>
        <div className="role-header-left">
          <div 
            className="role-badge" 
            style={{ 
              background: `${roleInfo.color}15`, 
              color: roleInfo.color,
              borderColor: `${roleInfo.color}30`
            }}
          >
            <span className="role-icon">{roleInfo.icon}</span>
            <span className="role-name">{roleInfo.name}</span>
          </div>
          <div className="role-description">{roleInfo.description}</div>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          Sign Out
        </button>
      </div>

      {/* Main content area where child routes will render */}
      <div className="role-content">
        <Outlet />
      </div>

      <style>{`
        .role-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .role-header {
          background: white;
          padding: 20px 32px;
          border-bottom: 4px solid;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(8px);
          background: rgba(255,255,255,0.95);
        }

        .role-header-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .role-badge {
          padding: 10px 24px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 16px;
          border: 2px solid;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .role-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .role-icon {
          font-size: 24px;
        }

        .role-description {
          color: #64748b;
          font-size: 14px;
          font-style: italic;
          padding: 6px 12px;
          background: #f8fafc;
          border-radius: 20px;
        }

        .logout-btn {
          padding: 10px 24px;
          background: #fee2e2;
          color: #ef4444;
          border: none;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          border: 1px solid #fecaca;
        }

        .logout-btn:hover {
          background: #fecaca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.2);
        }

        .logout-icon {
          font-size: 18px;
        }

        .role-content {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .role-header {
            padding: 16px 20px;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .role-header-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .role-badge {
            width: 100%;
            justify-content: center;
          }

          .role-description {
            width: 100%;
            text-align: center;
          }

          .logout-btn {
            width: 100%;
            justify-content: center;
          }

          .role-content {
            padding: 20px 16px;
          }
        }

        @media (max-width: 480px) {
          .role-badge {
            padding: 8px 16px;
            font-size: 14px;
          }

          .role-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}