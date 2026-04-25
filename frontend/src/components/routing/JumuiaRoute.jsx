import { Navigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function JumuiaRoute({ children }) {
  const { jumuiaCode } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    console.log('=== JumuiaRoute Debug ===');
    console.log('URL jumuiaCode:', jumuiaCode);
    console.log('Token exists:', !!token);
    console.log('User string exists:', !!userStr);
    
    if (userStr) {
      console.log('Raw user string:', userStr);
    }

    if (!token || !userStr) {
      console.log('No token or user, redirecting to login');
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      console.log('Parsed user data:', userData);
      console.log('user.jumuiaCode:', userData.jumuiaCode);
      console.log('user.role:', userData.role);
      console.log('user.specialRole:', userData.specialRole);
      setUser(userData);
    } catch (e) {
      console.error('Failed to parse user', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [jumuiaCode]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Admin can access any jumuia
  if (user.role === 'admin') {
    console.log('Admin access granted');
    return children;
  }

  // Jumuia leader can only access their own jumuia
  if (user.specialRole === 'jumuia_leader') {
    console.log('Checking jumuia leader access:');
    console.log('user.jumuiaCode:', user.jumuiaCode);
    console.log('URL jumuiaCode:', jumuiaCode);
    console.log('Match:', user.jumuiaCode === jumuiaCode);
    
    if (user.jumuiaCode === jumuiaCode) {
      console.log('Access granted - leader of this jumuia');
      return children;
    }
    console.log('Access denied - not leader of this jumuia');
    return <Navigate to="/unauthorized" />;
  }

  // Regular members can view their jumuia
  if (user.jumuiaCode === jumuiaCode) {
    console.log('Access granted - member of this jumuia');
    return children;
  }

  console.log('Access denied - no matching criteria');
  return <Navigate to="/unauthorized" />;
}

// Styles
const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
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
if (document.head) {
  document.head.appendChild(styleSheet);
}