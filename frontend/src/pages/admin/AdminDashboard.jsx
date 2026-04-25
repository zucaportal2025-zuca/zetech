// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers, FiBell, FiMusic, FiDollarSign, 
  FiUserCheck, FiCalendar, FiMessageCircle,
  FiActivity, FiTrash2, FiEdit2, FiPieChart, 
  FiBarChart2, FiRefreshCw,
  FiClock, FiCheckCircle, FiArrowUp,
  FiUsers as FiUsersIcon
} from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { FaDonate, FaChurch } from "react-icons/fa";
import { GiPrayer } from "react-icons/gi";
import axios from "axios";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import io from "socket.io-client";
import backgroundImg from "../../assets/background.png";
import BASE_URL from "../../api";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnnouncements: 0,
    totalPrograms: 0,
    totalMessages: 0,
    totalPledged: 0,
    activeJumuia: 0,
    onlineUsers: 0,
    recentUsers: 0,
    unreadMessages: 0,
    upcomingEvents: 0,
    completedPledges: 0,
    pendingPledges: 0,
    totalContributions: 0,
    totalSongs: 0
  });
  
  const [users, setUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [massPrograms, setMassPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedContribution, setSelectedContribution] = useState("all");
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(BASE_URL);
    
    socket.on('connect', () => {
      console.log('Dashboard connected');
    });

    socket.on('user_online', (data) => {
      setStats(prev => ({ ...prev, onlineUsers: data.count }));
    });

    socket.on('stats_updated', (newStats) => {
      setStats(prev => ({ ...prev, ...newStats }));
      refreshData();
    });

    return () => socket.disconnect();
  }, []);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  // Calculate user growth data from real users
  const calculateUserGrowth = (usersList) => {
    const now = new Date();
    const months = [];
    const counts = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      months.push(monthName);
      
      const count = usersList.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt.getMonth() === month.getMonth() && 
               createdAt.getFullYear() === month.getFullYear();
      }).length;
      
      counts.push(count);
    }
    
    return { months, counts };
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchDashboardData();
    } catch (err) {
      setError("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all real data from your backend
      const [
        statsRes,
        usersRes,
        contributionsRes,
        announcementsRes,
        programsRes,
        messagesRes,
        eventsRes,
        songsRes
      ] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/admin/stats`, { headers }),
        axios.get(`${BASE_URL}/api/users`, { headers }),
        axios.get(`${BASE_URL}/api/contribution-types`, { headers }),
        axios.get(`${BASE_URL}/api/announcements`, { headers }),
        axios.get(`${BASE_URL}/api/songs`, { headers }),
        axios.get(`${BASE_URL}/api/chat/unread`, { headers }),
        axios.get(`${BASE_URL}/api/events/upcoming`, { headers }),
        axios.get(`${BASE_URL}/api/songs`, { headers })
      ]);

      // Process stats
      if (statsRes.status === 'fulfilled') {
        setStats(prev => ({ ...prev, ...statsRes.value.data }));
      }

      // Process users - REAL DATA
      if (usersRes.status === 'fulfilled') {
        const userData = usersRes.value.data || [];
        setUsers(userData);
        
        const onlineUsers = userData.filter(u => u.online).length;
        const activeJumuia = new Set(userData
          .filter(u => u.jumuiaId)
          .map(u => u.jumuiaId)).size;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = userData.filter(u => 
          new Date(u.createdAt) >= sevenDaysAgo
        ).length;

        const growth = calculateUserGrowth(userData);
        setUserGrowthData(growth);

        setStats(prev => ({ 
          ...prev, 
          onlineUsers,
          activeJumuia,
          recentUsers,
          totalUsers: userData.length 
        }));
      }

      // Process contributions - REAL DATA
      if (contributionsRes.status === 'fulfilled') {
        const contribData = contributionsRes.value.data || [];
        setContributions(contribData);

        const totalPledged = contribData.reduce((sum, c) => 
          sum + (c.pledges?.reduce((s, p) => s + (p.amountPaid || 0), 0) || 0), 0);
        
        const pendingPledges = contribData.reduce((sum, c) => 
          sum + (c.pledges?.filter(p => p.status === "PENDING" && p.pendingAmount > 0).length || 0), 0);
        
        const completedPledges = contribData.reduce((sum, c) => 
          sum + (c.pledges?.filter(p => p.status === "COMPLETED" || p.amountPaid >= c.amountRequired).length || 0), 0);

        setStats(prev => ({ 
          ...prev, 
          totalPledged,
          pendingPledges,
          completedPledges,
          totalContributions: contribData.length 
        }));
      }

      // Process announcements - REAL DATA
      if (announcementsRes.status === 'fulfilled') {
        const announcementData = announcementsRes.value.data || [];
setAnnouncements(Array.isArray(announcementData) ? announcementData.slice(0, 5) : []);
        setStats(prev => ({ 
          ...prev, 
          totalAnnouncements: announcementData.length 
        }));
      }

      // Process programs - REAL DATA
      if (programsRes.status === 'fulfilled') {
        const programData = programsRes.value.data || [];
setMassPrograms(Array.isArray(programData) ? programData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          totalPrograms: programData.length 
        }));
      }

      // Process messages - REAL DATA
      if (messagesRes.status === 'fulfilled') {
        setStats(prev => ({ 
          ...prev, 
          unreadMessages: messagesRes.value.data?.count || 0,
          totalMessages: messagesRes.value.data?.total || 0
        }));
      }

      // Process events - REAL DATA
      if (eventsRes.status === 'fulfilled') {
        setStats(prev => ({ 
          ...prev, 
          upcomingEvents: eventsRes.value.data?.length || 0 
        }));
      }

      // Process songs - REAL DATA
      if (songsRes.status === 'fulfilled') {
        setStats(prev => ({ 
          ...prev, 
          totalSongs: songsRes.value.data?.length || 0 
        }));
      }

      // Create recent activities from REAL data
      const activities = [];

      // Add recent user registrations
      if (usersRes.status === 'fulfilled') {
        const userData = usersRes.value.data || [];
(Array.isArray(userData) ? userData.slice(0, 3) : []).forEach(user => {
          if (user.createdAt) {
            activities.push({
              id: `user-${user.id}`,
              type: 'user',
              icon: '👤',
              user: user.fullName,
              action: 'joined',
              target: 'ZUCA community',
              details: `${user.fullName} joined ZUCA community`,
              time: user.createdAt,
              avatar: user.profileImage
            });
          }
        });
      }

      // Add recent pledges from REAL data
      if (contributionsRes.status === 'fulfilled') {
        const contribData = contributionsRes.value.data || [];
(Array.isArray(contribData) ? contribData.slice(0, 3) : []).forEach(contribution => {
          if (contribution.pledges) {
            contribution.pledges.slice(0, 2).forEach(pledge => {
              if (pledge.createdAt && pledge.user) {
                let actionText = '';
                if (pledge.amountPaid > 0 && pledge.amountPaid >= contribution.amountRequired) {
                  actionText = `completed payment of KES sh{pledge.amountPaid.toLocaleString()}`;
                } else if (pledge.amountPaid > 0) {
                  actionText = `paid KES sh{pledge.amountPaid.toLocaleString()}`;
                } else if (pledge.pendingAmount > 0) {
                  actionText = `pledged KES sh{pledge.pendingAmount.toLocaleString()}`;
                }
                
                if (actionText) {
                  activities.push({
                    id: `pledge-${pledge.id}`,
                    type: 'pledge',
                    icon: '💰',
                    user: pledge.user?.fullName || 'A member',
                    action: actionText,
                    target: `for ${contribution.title}`,
                    details: `${pledge.user?.fullName || 'A member'} ${actionText} for ${contribution.title}`,
                    time: pledge.createdAt,
                    avatar: pledge.user?.profileImage
                  });
                }
              }
            });
          }
        });
      }

      // Add recent announcements from REAL data
      if (announcementsRes.status === 'fulfilled') {
        const announcementData = announcementsRes.value.data || [];
        announcementData.slice(0, 3).forEach(ann => {
          if (ann.createdAt) {
            activities.push({
              id: `ann-${ann.id}`,
              type: 'announcement',
              icon: '📢',
              user: 'Admin',
              action: 'posted',
              target: 'new announcement',
              details: `New announcement: ${ann.title}`,
              time: ann.createdAt,
              avatar: null
            });
          }
        });
      }

      // Add recent programs from REAL data
      if (programsRes.status === 'fulfilled') {
        const programData = programsRes.value.data || [];
        programData.slice(0, 3).forEach(program => {
          if (program.createdAt) {
            activities.push({
              id: `program-${program.id}`,
              type: 'program',
              icon: '⛪',
              user: 'Liturgy Team',
              action: 'scheduled',
              target: 'mass program',
              details: `Mass scheduled at ${program.venue || 'Church'} on ${new Date(program.date).toLocaleDateString()}`,
              time: program.createdAt,
              avatar: null
            });
          }
        });
      }

      // Sort by date and take latest 8
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 8);
      
      setRecentActivities(sortedActivities);

    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`, { headers });
      setUsers(users.filter((u) => u.id !== id));
      refreshData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.put(`${BASE_URL}/api/users/${id}/role`, 
        { role: newRole }, 
        { headers }
      );
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      refreshData();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const filteredUsers = userRoleFilter === "all" 
    ? users 
    : users.filter(u => u.role === userRoleFilter);

  const getContributionChartData = () => {
    if (selectedContribution === "all") {
      const totalRequired = stats.totalUsers * 5000; // Average pledge amount
      return {
        labels: ['Paid', 'Pending', 'Remaining'],
        data: [
          stats.totalPledged || 0,
          stats.pendingPledges * 1000 || 0,
          Math.max(0, totalRequired - stats.totalPledged) || 0
        ],
        colors: ['#10b981', '#f59e0b', '#94a3b8']
      };
    } else {
      const contribution = contributions.find(c => c.id === selectedContribution);
      if (!contribution) return null;
      
      const totalPaid = contribution.pledges?.reduce((sum, p) => sum + (p.amountPaid || 0), 0) || 0;
      const totalPending = contribution.pledges?.reduce((sum, p) => sum + (p.pendingAmount || 0), 0) || 0;
      const totalRequired = (contribution.pledges?.length || 0) * contribution.amountRequired;
      
      return {
        labels: ['Paid', 'Pending', 'Remaining'],
        data: [totalPaid, totalPending, Math.max(0, totalRequired - totalPaid - totalPending)],
        colors: ['#10b981', '#f59e0b', '#94a3b8'],
        title: contribution.title
      };
    }
  };

  const chartData = getContributionChartData();

  const growthChartData = {
    labels: userGrowthData.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Users',
        data: userGrowthData.counts || [0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };

  const contributionChartData = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.colors,
        borderWidth: 0,
        hoverOffset: 4,
      }
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { 
          color: '#64748b',
          callback: (value) => value 
        }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 11, weight: '500' },
          color: '#334155'
        }
      }
    },
    cutout: '65%',
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
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
      return date.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      style={{...styles.dashboard, backgroundImage: `url(${backgroundImg})`}}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dark Overlay */}
      <div style={styles.overlay}></div>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              {error ? 'welcome Admin' : 'Welcome back, Administrator'}
            </p>
          </div>
          
          <div style={styles.headerActions}>
            {/* Refresh Button */}
            <button 
              style={styles.refreshBtn}
              onClick={refreshData}
              disabled={refreshing}
            >
              <FiRefreshCw style={{ ...styles.refreshIcon, ...(refreshing ? styles.spinning : {}) }} />
            </button>

            {/* Admin Profile */}
            <div style={styles.adminProfile}>
              <div style={styles.adminAvatar}>
                <RiAdminLine />
              </div>
              <div style={styles.adminInfo}>
                <span style={styles.adminName}>Admin</span>
                <span style={styles.adminRole}>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid - 6 columns on desktop, 3 on mobile */}
        <div style={styles.statsGrid}>
          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconUsers}}>
              <FiUsers />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalUsers || 0}</span>
              <span style={styles.statLabel}>Users</span>
              <div style={styles.statFooter}>
                <FiUserCheck style={styles.footerIcon} />
                <span>{stats.onlineUsers || 0} online</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconAnnouncements}}>
              <FiBell />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalAnnouncements || 0}</span>
              <span style={styles.statLabel}>Announce</span>
              <div style={styles.statFooter}>
                <FiClock style={styles.footerIcon} />
                <span>{announcements.length} new</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconContributions}}>
              <FaDonate />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>
                KES {(stats.totalPledged || 0).toLocaleString()}
              </span>
              <span style={styles.statLabel}>Pledged</span>
              <div style={styles.statFooter}>
                <FiCheckCircle style={{...styles.footerIcon, ...styles.successColor}} />
                <span>{stats.completedPledges || 0} done</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconPrograms}}>
              <GiPrayer />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalPrograms || 0}</span>
              <span style={styles.statLabel}>Programs</span>
              <div style={styles.statFooter}>
                <FiCalendar style={styles.footerIcon} />
                <span>{stats.upcomingEvents || 0} upcoming</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconMessages}}>
              <FiMessageCircle />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalMessages || 0}</span>
              <span style={styles.statLabel}>Messages</span>
              <div style={styles.statFooter}>
                <span>{stats.unreadMessages || 0} unread</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={styles.statCard}
            whileHover={{ y: -5 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{...styles.statIcon, ...styles.statIconJumuia}}>
              <FaChurch />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.activeJumuia || 0}</span>
              <span style={styles.statLabel}>Jumuia</span>
              <div style={styles.statFooter}>
                <FiUsersIcon style={styles.footerIcon} />
                <span>{stats.recentUsers || 0} new</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts - Stack vertically on mobile */}
        <div style={styles.chartsStack}>
          {/* User Growth Chart */}
          <motion.div 
            style={styles.chartCard}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>User Growth</h3>
                <p style={styles.chartSubtitle}>Last 6 months</p>
              </div>
              <FiBarChart2 style={styles.chartIcon} />
            </div>
            <div style={styles.chartContainer}>
              {userGrowthData.counts?.some(v => v > 0) ? (
                <Line data={growthChartData} options={chartOptions} />
              ) : (
                <div style={styles.noData}>No data available</div>
              )}
            </div>
          </motion.div>

          {/* Contributions Chart */}
          <motion.div 
            style={styles.chartCard}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>Contributions</h3>
                <p style={styles.chartSubtitle}>
                  {selectedContribution === "all" ? 'Overall' : chartData?.title}
                </p>
              </div>
              <FiPieChart style={styles.chartIcon} />
            </div>
            
            {/* Contribution Selector */}
            <select 
              style={styles.contributionSelect}
              value={selectedContribution}
              onChange={(e) => setSelectedContribution(e.target.value)}
            >
              <option value="all">All Contributions</option>
              {contributions.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <div style={{...styles.chartContainer, ...styles.doughnutContainer, marginTop: '16px'}}>
              {contributionChartData ? (
                <Doughnut data={contributionChartData} options={doughnutOptions} />
              ) : (
                <div style={styles.noData}>No data available</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Users Table - Full width with scrolling */}
        <motion.div 
          style={styles.usersCard}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Users</h3>
              <p style={styles.cardSubtitle}>Manage and view all members</p>
            </div>
            <div style={styles.cardActions}>
              <select 
                style={styles.roleFilter}
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="treasurer">Treasurer</option>
              </select>
              <a href="/admin/users" style={styles.viewAll}>View All →</a>
            </div>
          </div>

          {/* Table with both horizontal and vertical scroll */}
          <div style={styles.tableContainer}>
            <table style={styles.usersTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>User</th>
                  <th style={styles.tableHeader}>Role</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Joined</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={styles.noDataCell}>No users found</td>
                  </tr>
                ) : (
                  filteredUsers.slice(0, 10).map((user) => (
                    <tr key={user.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        <div style={styles.userCell}>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.fullName} style={styles.userAvatar} />
                          ) : (
                            <div style={{...styles.userAvatar, ...styles.userAvatarFallback}}>
                              {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={styles.userInfo}>
                            <div style={styles.userName}>{user.fullName}</div>
                            <div style={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{...styles.roleBadge, ...styles[`roleBadge${user.role || 'member'}`]}}>
                          {user.role || 'member'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{...styles.statusBadge, ...styles[user.online ? 'statusOnline' : 'statusOffline']}}>
                          {user.online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={styles.iconBtn}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            style={styles.iconBtn}
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Activity Feed - Full width */}
        <motion.div 
          style={styles.activityCard}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Recent Activity</h3>
              <p style={styles.cardSubtitle}>Latest actions across the platform</p>
            </div>
            <FiActivity style={styles.activityIcon} />
          </div>

          <div style={styles.activityList}>
            {recentActivities.length === 0 ? (
              <div style={styles.noData}>No recent activity</div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={styles.activityIconWrapper}>
                    <span style={styles.activityEmoji}>{activity.icon}</span>
                  </div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>{activity.details}</p>
                    <span style={styles.activityTime}>{formatTime(activity.time)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Links - 2x2 grid */}
          <div style={styles.quickLinks}>
            <h4 style={styles.quickLinksTitle}>Quick Actions</h4>
            <div style={styles.linksGrid}>
              <a href="/admin/announcements" style={styles.quickLink}>
                <FiBell /> New Announcement
              </a>
              <a href="/admin/contributions" style={styles.quickLink}>
                <FaDonate /> Add Contribution
              </a>
              <a href="/admin/songs" style={styles.quickLink}>
                <GiPrayer /> Schedule Mass
              </a>
              <a href="/admin/users" style={styles.quickLink}>
                <FiUsers /> Manage Users
              </a>
            </div>
          </div>

          {/* Recent Announcements */}
          {announcements.length > 0 && (
            <div style={styles.recentSection}>
              <h4 style={styles.recentSectionTitle}>Recent Announcements</h4>
              {announcements.map((ann, i) => (
                <div key={i} style={styles.recentItem}>
                  <span style={styles.recentIcon}>📢</span>
                  <div style={styles.recentContent}>
                    <div style={styles.recentTitle}>{ann.title}</div>
                    <div style={styles.recentTime}>{formatTime(ann.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Programs */}
          {massPrograms.length > 0 && (
            <div style={styles.recentSection}>
              <h4 style={styles.recentSectionTitle}>Upcoming Programs</h4>
              {massPrograms.map((program, i) => (
                <div key={i} style={styles.recentItem}>
                  <span style={styles.recentIcon}>⛪</span>
                  <div style={styles.recentContent}>
                    <div style={styles.recentTitle}>{program.venue || 'Mass'}</div>
                    <div style={styles.recentTime}>
                      {program.date ? new Date(program.date).toLocaleDateString() : 'TBA'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div 
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
          >
            <motion.div 
              style={styles.modalContent}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Edit User</h3>
              <div style={styles.modalBody}>
                <div style={styles.userDetail}>
                  <label style={styles.userDetailLabel}>Name</label>
                  <p style={styles.userDetailValue}>{selectedUser.fullName}</p>
                </div>
                <div style={styles.userDetail}>
                  <label style={styles.userDetailLabel}>Email</label>
                  <p style={styles.userDetailValue}>{selectedUser.email}</p>
                </div>
                <div style={styles.userDetail}>
                  <label style={styles.userDetailLabel}>Role</label>
                  <select 
                    style={styles.userDetailSelect}
                    value={selectedUser.role || 'member'}
                    onChange={(e) => {
                      handleRoleChange(selectedUser.id, e.target.value);
                      setSelectedUser({ ...selectedUser, role: e.target.value });
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.closeBtn} onClick={() => setShowUserModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Styles - Updated for white cards and better mobile layout
const styles = {
  dashboard: {
    minHeight: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "cover",
    backgroundAttachment: "fixed",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "full"
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)",
    zIndex: 0
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea05 0%, #07070701 100%)"
  },
  loader: {
    background: "white",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
  },
  spinner: {
    width: "48px",
    height: "48px",
    margin: "0 auto 16px",
    border: "3px solid #f1f5f9",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#0f172a",
    fontSize: "16px",
    margin: 0
  },
  mainContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    marginTop: "10px",
    padding: "6px",
    position: "relative",
    zIndex: 1
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "24px",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px"
  },
  headerLeft: {
    flex: 1,
    minWidth: "200px"
  },
  pageTitle: {
    fontSize: "clamp(24px, 4vw, 32px)",
    fontWeight: "700",
    color: "white",
    margin: "0 0 4px 0",
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
    lineHeight: "1.2"
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.9)",
    margin: 0
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  refreshBtn: {
    width: "44px",
    height: "44px",
    border: "none",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  refreshIcon: {
    fontSize: "20px"
  },
  spinning: {
    animation: "spin 1s linear infinite"
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "6px 16px 6px 6px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "40px",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  adminAvatar: {
    width: "36px",
    height: "36px",
    background: "white",
    color: "#3b82f6",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  adminInfo: {
    display: "flex",
    flexDirection: "column"
  },
  adminName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "white"
  },
  adminRole: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.8)"
  },
  statsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
  marginBottom: "24px"

},

  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0
  },
  statIconUsers: {
    background: "rgba(59, 130, 246, 0.1)",
    color: "#3b82f6"
  },
  statIconAnnouncements: {
    background: "rgba(245, 158, 11, 0.1)",
    color: "#f59e0b"
  },
  statIconContributions: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981"
  },
  statIconPrograms: {
    background: "rgba(139, 92, 246, 0.1)",
    color: "#8b5cf6"
  },
  statIconMessages: {
    background: "rgba(236, 72, 153, 0.1)",
    color: "#ec4899"
  },
  statIconJumuia: {
    background: "rgba(245, 158, 11, 0.1)",
    color: "#f59e0b"
  },
  statContent: {
    flex: 1,
    minWidth: 0
  },
  statValue: {
    display: "block",
    fontSize: "clamp(16px, 2vw, 24px)",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2",
    marginBottom: "2px"
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  statFooter: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "#475569",
    flexWrap: "wrap"
  },
  footerIcon: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  successColor: {
    color: "#10b981"
  },
  chartsStack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px"
  },
  chartCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    width: "100%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 4px 0"
  },
  chartSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0
  },
  chartIcon: {
    color: "#94a3b8",
    fontSize: "20px"
  },
  contributionSelect: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#0f172a",
    background: "white",
    cursor: "pointer",
    outline: "none",
    marginTop: "8px"
  },
  chartContainer: {
    height: "250px",
    width: "100%",
    position: "relative"
  },
  doughnutContainer: {
    height: "250px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  noData: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px",
    fontStyle: "italic"
  },
  usersCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    width: "100%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 4px 0"
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  roleFilter: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#0f172a",
    background: "white",
    cursor: "pointer",
    outline: "none"
  },
  viewAll: {
    color: "#3b82f6",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  tableContainer: {
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "400px",
    borderRadius: "12px",
    background: "white"
  },
  usersTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  tableHeader: {
    textAlign: "left",
    padding: "14px 12px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    background: "white",
    zIndex: 10
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s"
  },
  tableCell: {
    padding: "12px",
    color: "#1e293b",
    fontSize: "13px"
  },
  noDataCell: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px"
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    objectFit: "cover",
    flexShrink: 0
  },
  userAvatarFallback: {
    background: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px"
  },
  userInfo: {
    minWidth: 0
  },
  userName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  userEmail: {
    fontSize: "11px",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "capitalize",
    whiteSpace: "nowrap"
  },
  roleBadgeadmin: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444"
  },
  roleBadgemember: {
    background: "rgba(59, 130, 246, 0.1)",
    color: "#3b82f6"
  },
  roleBadgetreasurer: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    whiteSpace: "nowrap"
  },
  statusOnline: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981"
  },
  statusOffline: {
    background: "rgba(100, 116, 139, 0.1)",
    color: "#64748b"
  },
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  iconBtn: {
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#f8fafc",
    color: "#64748b"
  },
  activityCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    width: "100%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  activityIcon: {
    color: "#94a3b8",
    fontSize: "20px"
  },
  activityList: {
    marginBottom: "20px"
  },
  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  activityIconWrapper: {
    width: "36px",
    height: "36px",
    background: "#f8fafc",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  activityEmoji: {
    fontSize: "18px"
  },
  activityContent: {
    flex: 1,
    minWidth: 0
  },
  activityText: {
    fontSize: "13px",
    color: "#1e293b",
    margin: "0 0 4px 0",
    lineHeight: "1.5",
    wordWrap: "break-word"
  },
  activityTime: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  quickLinks: {
    margin: "20px 0",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px"
  },
  quickLinksTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 12px 0"
  },
  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px"
  },
  quickLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    background: "white",
    borderRadius: "10px",
    color: "#0f172a",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0"
  },
  recentSection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0"
  },
  recentSectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 12px 0"
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0"
  },
  recentIcon: {
    width: "32px",
    height: "32px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0
  },
  recentContent: {
    flex: 1,
    minWidth: 0
  },
  recentTitle: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  recentTime: {
    fontSize: "11px",
    color: "#64748b"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px"
  },
  modalContent: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    width: "100%",
    maxWidth: "400px",
    maxHeight: "90vh",
    overflowY: "auto"
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 20px"
  },
  modalBody: {
    marginBottom: "20px"
  },
  userDetail: {
    marginBottom: "16px"
  },
  userDetailLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px"
  },
  userDetailValue: {
    margin: 0,
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "500"
  },
  userDetailSelect: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0f172a",
    background: "white"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end"
  },
  closeBtn: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s"
  }
};

// Add global styles and media queries
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .quick-link:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }
  
  .icon-btn:hover {
    background: #f1f5f9 !important;
    color: #0f172a !important;
  }
  
  .view-all:hover {
    color: #2563eb !important;
    text-decoration: underline !important;
  }
  
  .close-btn:hover {
    background: #e2e8f0 !important;
  }

  .table-row:hover {
    background: #f8fafc !important;
  }

  /* Mobile Styles */
  @media (max-width: 800px) {
    .stats-grid {
      grid-template-columns: repeat(1, 1fr) !important;
      gap: 8px !important;
    }
    
    .stat-card {
      padding: 12px !important;
      gap: 8px !important;
    }
    
    .stat-icon {
      width: 36px !important;
      height: 36px !important;
      font-size: 18px !important;
    }
    
    .stat-value {
      font-size: 14px !important;
    }
    
    .stat-label {
      font-size: 9px !important;
      margin-bottom: 2px !important;
    }
    
    .stat-footer {
      font-size: 8px !important;
    }
    
    .footer-icon {
      font-size: 10px !important;
    }
    
    .charts-stack {
      gap: 12px !important;
    }
    
    .chart-card {
      padding: 16px !important;
    }
    
    .chart-container {
      height: 200px !important;
    }
    
    .users-card,
    .activity-card {
      padding: 16px !important;
    }
    
    .card-title {
      font-size: 16px !important;
    }
    
    .card-subtitle {
      font-size: 11px !important;
    }
    
    .table-container {
      max-height: 350px !important;
    }
    
    .table-header {
      padding: 10px 8px !important;
      font-size: 11px !important;
    }
    
    .table-cell {
      padding: 8px !important;
      font-size: 11px !important;
    }
    
    .user-avatar {
      width: 28px !important;
      height: 28px !important;
    }
    
    .user-name {
      font-size: 12px !important;
    }
    
    .user-email {
      font-size: 9px !important;
    }
    
    .role-badge,
    .status-badge {
      padding: 2px 6px !important;
      font-size: 9px !important;
    }
    
    .action-buttons {
      gap: 4px !important;
    }
    
    .icon-btn {
      width: 28px !important;
      height: 28px !important;
      font-size: 12px !important;
    }
    
    .activity-item {
      padding: 8px 0 !important;
    }
    
    .activity-icon-wrapper {
      width: 32px !important;
      height: 32px !important;
    }
    
    .activity-emoji {
      font-size: 16px !important;
    }
    
    .activity-text {
      font-size: 11px !important;
    }
    
    .activity-time {
      font-size: 9px !important;
    }
    
    .links-grid {
      gap: 6px !important;
    }
    
    .quick-link {
      padding: 8px !important;
      font-size: 11px !important;
    }
    
    .recent-item {
      padding: 6px 0 !important;
    }
    
    .recent-icon {
      width: 28px !important;
      height: 28px !important;
      font-size: 14px !important;
    }
    
    .recent-title {
      font-size: 11px !important;
    }
    
    .recent-time {
      font-size: 9px !important;
    }
  }

  /* Extra small devices */
  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 6px !important;
    }
    
    .stat-card {
      padding: 8px !important;
      gap: 6px !important;
    }
    
    .stat-icon {
      width: 30px !important;
      height: 30px !important;
      font-size: 16px !important;
    }
    
    .stat-value {
      font-size: 12px !important;
    }
    
    .stat-label {
      font-size: 8px !important;
    }
    
    .stat-footer {
      font-size: 7px !important;
      gap: 2px !important;
    }
    
    .footer-icon {
      font-size: 9px !important;
    }
    
    .table-container {
      max-height: 300px !important;
    }
    
    .users-table {
      min-width: 700px !important;
    }
    
    .table-header {
      padding: 8px 6px !important;
      font-size: 10px !important;
    }
    
    .table-cell {
      padding: 6px !important;
      font-size: 10px !important;
    }
    
    .user-avatar {
      width: 24px !important;
      height: 24px !important;
    }
    
    .user-name {
      font-size: 11px !important;
    }
    
    .card-header {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    
    .card-actions {
      width: 100% !important;
      justify-content: space-between !important;
    }
    
    .role-filter {
      flex: 1 !important;
    }
  }
`;
document.head.appendChild(style);

export default AdminDashboard;