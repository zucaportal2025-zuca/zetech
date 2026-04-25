// frontend/src/pages/jumuia/JumuiaDetailPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import io from 'socket.io-client';
import BASE_URL from '../../api';

// Icons
const Icons = {
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Excel: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
  Doc: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Spinner: () => <svg className="spinner-small" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Copy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Refresh: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>,
  Wifi: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  WifiOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Live: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="#ef4444"/></svg>,
};

export default function JumuiaDetailPage() {
  const { jumuiaCode } = useParams();
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(null);
  const [jumuia, setJumuia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  
  // Contribution states
  const [contributions, setContributions] = useState([]);
  const [newContribution, setNewContribution] = useState({
    title: "",
    description: "",
    amountRequired: "",
    deadline: "",
  });
  const [pledgeInputs, setPledgeInputs] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPledges, setSelectedPledges] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [selectAllCampaigns, setSelectAllCampaigns] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [expandedMember, setExpandedMember] = useState(null);
  const [activeTabContrib, setActiveTabContrib] = useState("all");
  const [updatingPledges, setUpdatingPledges] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'excel',
    campaign: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Real-time updates state
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [showLiveIndicator, setShowLiveIndicator] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Loading states
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [bulkDeletingCampaigns, setBulkDeletingCampaigns] = useState(false);
  const [bulkDuplicatingCampaigns, setBulkDuplicatingCampaigns] = useState(false);
  const [approvingPledge, setApprovingPledge] = useState(null);
  const [addingManual, setAddingManual] = useState(null);
  const [resettingPledge, setResettingPledge] = useState(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [pledgeMessageThread, setPledgeMessageThread] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse user', e);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Check if user has modify permissions
  const isAdmin = user?.role === "admin";
  const isLeader = user?.specialRole === "jumuia_leader" && user?.jumuiaCode === jumuiaCode;
  const isTreasurer = user?.specialRole === "treasurer";
  const canModify = isAdmin || isLeader || isTreasurer;

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchJumuiaDetails();
    }
  }, [jumuiaCode, user]);

  // Socket connection for real-time updates (like SongsPage)
  useEffect(() => {
    const socket = io(BASE_URL);
    
    socket.on('connect', () => {
      console.log('Connected to jumuia updates feed');
      setSocketConnected(true);
      setShowLiveIndicator(true);
      setTimeout(() => setShowLiveIndicator(false), 3000);
      
      // Join jumuia room when connected
      if (jumuia?.id) {
        socket.emit('join-jumuia-room', jumuia.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from jumuia updates feed');
      setSocketConnected(false);
    });

    // Listen for jumuia-specific events
    socket.on('jumuia_updated', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleJumuiaUpdated(data);
      }
    });

    socket.on('pledge_updated', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handlePledgeUpdated(data);
      }
    });

    socket.on('pledge_created', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handlePledgeCreated(data);
      }
    });

    socket.on('pledge_approved', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handlePledgeApproved(data);
      }
    });

    socket.on('pledge_deleted', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handlePledgeDeleted(data);
      }
    });

    socket.on('contribution_created', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleContributionCreated(data);
      }
    });

    socket.on('contribution_updated', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleContributionUpdated(data);
      }
    });

    socket.on('contribution_deleted', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleContributionDeleted(data);
      }
    });

    socket.on('member_added', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleMemberAdded(data);
      }
    });

    socket.on('member_removed', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleMemberRemoved(data);
      }
    });

    socket.on('leader_assigned', (data) => {
      if (data.jumuiaId === jumuia?.id) {
        handleLeaderAssigned(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [jumuia?.id]);

  // Auto-refresh fallback when socket disconnected (like SongsPage refresh button)
  useEffect(() => {
    if (!autoRefreshEnabled || socketConnected) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing data (fallback)...');
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, socketConnected]);

  // Socket event handlers
  const handleJumuiaUpdated = (data) => {
    console.log('Jumuia updated:', data);
    addLiveUpdate('info', 'Jumuia details updated');
    setJumuia(prev => ({ ...prev, ...data.jumuia }));
  };

  const handlePledgeUpdated = (data) => {
    console.log('Pledge updated:', data);
    addLiveUpdate('success', `${data.userName}'s pledge was updated`);
    
    setContributions(prevContributions => 
      prevContributions.map(campaign => {
        if (campaign.id === data.campaignId) {
          return {
            ...campaign,
            pledges: campaign.pledges?.map(pledge => 
              pledge.id === data.pledgeId ? { ...pledge, ...data.updatedPledge } : pledge
            )
          };
        }
        return campaign;
      })
    );

    if (data.status === 'APPROVED') {
      showNotification(`✅ ${data.userName}'s pledge approved!`, 'success');
    } else if (data.amount > 0) {
      showNotification(`💰 ${data.userName} added KES ${data.amount}`, 'success');
    }
  };

  const handlePledgeCreated = (data) => {
    console.log('Pledge created:', data);
    addLiveUpdate('success', `${data.userName} made a new pledge of KES ${data.amount}`);

    setContributions(prevContributions => 
      prevContributions.map(campaign => {
        if (campaign.id === data.campaignId) {
          return {
            ...campaign,
            pledges: [...(campaign.pledges || []), data.newPledge]
          };
        }
        return campaign;
      })
    );

    showNotification(`🆕 New pledge from ${data.userName}`, 'success');
  };

  const handlePledgeApproved = (data) => {
    console.log('Pledge approved:', data);
    addLiveUpdate('success', `✅ ${data.userName}'s pledge approved`);

    setContributions(prevContributions => 
      prevContributions.map(campaign => {
        if (campaign.id === data.campaignId) {
          return {
            ...campaign,
            pledges: campaign.pledges?.map(pledge => 
              pledge.id === data.pledgeId ? { ...pledge, status: 'APPROVED', ...data.updatedPledge } : pledge
            )
          };
        }
        return campaign;
      })
    );
  };

  const handlePledgeDeleted = (data) => {
    console.log('Pledge deleted:', data);
    addLiveUpdate('info', `A pledge was deleted`);

    setContributions(prevContributions => 
      prevContributions.map(campaign => {
        if (campaign.id === data.campaignId) {
          return {
            ...campaign,
            pledges: campaign.pledges?.filter(pledge => pledge.id !== data.pledgeId)
          };
        }
        return campaign;
      })
    );
  };

  const handleContributionCreated = (data) => {
    console.log('Campaign created:', data);
    addLiveUpdate('success', `New campaign: ${data.title}`);

    setContributions(prev => [data.newContribution, ...prev]);
    showNotification(`📢 New campaign: ${data.title}`, 'success');
  };

  const handleContributionUpdated = (data) => {
    console.log('Campaign updated:', data);
    addLiveUpdate('info', `Campaign updated: ${data.title}`);

    setContributions(prevContributions => 
      prevContributions.map(campaign => 
        campaign.id === data.campaignId ? { ...campaign, ...data.updatedCampaign } : campaign
      )
    );
  };

  const handleContributionDeleted = (data) => {
    console.log('Campaign deleted:', data);
    addLiveUpdate('info', `Campaign deleted: ${data.title}`);

    setContributions(prev => prev.filter(c => c.id !== data.campaignId));
    showNotification(`🗑️ Campaign deleted: ${data.title}`, 'info');
  };

  const handleMemberAdded = (data) => {
    console.log('Member added:', data);
    addLiveUpdate('success', `👤 ${data.memberName} joined the jumuia`);

    setMembers(prev => [...prev, data.member]);
    showNotification(`👤 ${data.memberName} joined`, 'success');
  };

  const handleMemberRemoved = (data) => {
    console.log('Member removed:', data);
    addLiveUpdate('info', `👋 ${data.memberName} left the jumuia`);

    setMembers(prev => prev.filter(m => m.id !== data.memberId));
    showNotification(`👋 ${data.memberName} removed`, 'info');
  };

  const handleLeaderAssigned = (data) => {
    console.log('Leader assigned:', data);
    addLiveUpdate('success', `👑 ${data.memberName} is now a leader`);

    setMembers(prev => prev.map(m => 
      m.id === data.memberId ? { ...m, specialRole: 'jumuia_leader' } : m
    ));
    showNotification(`👑 ${data.memberName} is now a leader`, 'success');
  };

  const addLiveUpdate = (type, message) => {
    setLiveUpdates(prev => [{
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    }, ...prev].slice(0, 5));
    setShowLiveIndicator(true);
    setTimeout(() => setShowLiveIndicator(false), 2000);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchJumuiaDetails();
      if (activeTab === 'contributions') {
        await fetchContributions();
      }
      showNotification('Data refreshed', 'success');
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type, id: Date.now() });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const fetchJumuiaDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/jumuia/${jumuiaCode}`);
      setJumuia(response.data);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Error fetching jumuia:', err);
      setError('Failed to load jumuia details');
      if (err.response?.status === 403) {
        navigate('/unauthorized');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================== CONTRIBUTION FUNCTIONS ====================

  const fetchContributions = async () => {
    if (!jumuia?.id) return;
    try {
      const response = await api.get(`/api/jumuia/${jumuia.id}/contributions`);
      setContributions(response.data);
    } catch (err) {
      console.error('Error fetching contributions:', err);
      showNotification("Failed to fetch contributions", "error");
    }
  };

  useEffect(() => {
    if (jumuia?.id && activeTab === 'contributions') {
      fetchContributions();
    }
  }, [jumuia?.id, activeTab]);

  const calculateTypeStats = (type) => {
    const pledges = type.pledges || [];
    
    const totalApproved = pledges.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalPending = pledges.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
    
    const totalPossible = pledges.length * (type.amountRequired || 0);
    const completion = totalPossible > 0 ? (totalApproved / totalPossible) * 100 : 0;
    
    const contributors = new Set(pledges.map(p => p.userId)).size;
    
    const pendingCount = pledges.filter(p => p.status === "PENDING" && (p.pendingAmount || 0) > 0).length;
    const approvedCount = pledges.filter(p => p.status === "APPROVED").length;
    const completedCount = pledges.filter(p => p.status === "COMPLETED" || (p.amountPaid || 0) >= (type.amountRequired || 0)).length;
    
    return {
      totalApproved,
      totalPending,
      pendingCount,
      approvedCount,
      completedCount,
      completion: Math.min(completion, 100),
      contributors,
      totalMembers: pledges.length,
      perMemberAmount: type.amountRequired || 0,
    };
  };

  const handleAddContribution = async () => {
    if (!canModify) {
      showNotification("You don't have permission to create campaigns", "error");
      return;
    }

    if (!newContribution.title || !newContribution.amountRequired) {
      showNotification("Title and amount are required", "error");
      return;
    }

    setCreatingCampaign(true);
    
    try {
      const response = await api.post(
        `/api/jumuia/${jumuia.id}/contributions`,
        {
          title: newContribution.title,
          description: newContribution.description,
          amountRequired: parseFloat(newContribution.amountRequired),
          deadline: newContribution.deadline || null,
        }
      );
      
      // Socket will handle the real-time update, but we'll update locally too
      setContributions(prev => [response.data, ...prev]);
      setNewContribution({ title: "", description: "", amountRequired: "", deadline: "" });
      showNotification("Campaign created successfully");
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.error || "Failed to create campaign", "error");
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleDeleteContribution = async (id) => {
    if (!canModify) {
      showNotification("You don't have permission to delete campaigns", "error");
      return;
    }

    if (!window.confirm("Delete this campaign? This will delete all associated pledges.")) return;
    
    setDeletingCampaign(id);
    
    try {
      await api.delete(`/api/jumuia/contributions/${id}`);
      // Socket will handle the real-time update
      showNotification("Campaign deleted");
    } catch (err) {
      console.error('Delete error:', err);
      showNotification(err.response?.data?.error || "Failed to delete", "error");
      fetchContributions();
    } finally {
      setDeletingCampaign(null);
    }
  };

  const handleApprovePledge = async (pledgeId, p, type) => {
    if (!canModify) {
      showNotification("You don't have permission to approve pledges", "error");
      return;
    }

    setUpdatingPledges(prev => ({ ...prev, [pledgeId]: true }));
    setApprovingPledge(pledgeId);
    
    try {
      await api.put(`/api/jumuia/pledges/${pledgeId}/approve`);
      // Socket will handle the real-time update
      showNotification("Pledge approved successfully");
    } catch (err) {
      console.error('Approve error:', err);
      showNotification(err.response?.data?.error || "Approval failed", "error");
    } finally {
      setUpdatingPledges(prev => ({ ...prev, [pledgeId]: false }));
      setApprovingPledge(null);
    }
  };

  const handleManualAdd = async (pledgeId, p, type) => {
    if (!canModify) {
      showNotification("You don't have permission to add payments", "error");
      return;
    }

    const addAmount = parseFloat(pledgeInputs[pledgeId]?.amount || 0);
    if (!addAmount || addAmount <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    setUpdatingPledges(prev => ({ ...prev, [pledgeId]: true }));
    setAddingManual(pledgeId);

    try {
      await api.put(
        `/api/jumuia/pledges/${pledgeId}/manual-add`,
        { amount: addAmount }
      );
      // Socket will handle the real-time update
      showNotification("Payment added successfully");
    } catch (err) {
      console.error('Manual add error:', err);
      showNotification(err.response?.data?.error || "Failed to add", "error");
    } finally {
      setUpdatingPledges(prev => ({ ...prev, [pledgeId]: false }));
      setAddingManual(null);
      setPledgeInputs({
        ...pledgeInputs,
        [pledgeId]: { ...pledgeInputs[pledgeId], amount: "" }
      });
    }
  };

  const handleEditMessage = async (pledgeId) => {
    if (!canModify) {
      showNotification("You don't have permission to edit messages", "error");
      return;
    }

    const msg = pledgeInputs[pledgeId]?.message;
    if (msg === undefined) return;

    setUpdatingPledges(prev => ({ ...prev, [pledgeId]: true }));

    try {
      await api.put(
        `/api/jumuia/pledges/${pledgeId}/edit-message`,
        { message: msg }
      );
      await fetchContributions();
      showNotification("Message updated");
    } catch (err) {
      console.error('Edit message error:', err);
      showNotification(err.response?.data?.error || "Failed to update message", "error");
    } finally {
      setUpdatingPledges(prev => ({ ...prev, [pledgeId]: false }));
    }
  };

  const handleResetPledge = async (pledgeId) => {
    if (!canModify) {
      showNotification("You don't have permission to reset pledges", "error");
      return;
    }

    if (!window.confirm("Reset this pledge? This will clear all amounts and status.")) return;
    
    setUpdatingPledges(prev => ({ ...prev, [pledgeId]: true }));
    setResettingPledge(pledgeId);

    try {
      await api.put(`/api/jumuia/pledges/${pledgeId}/reset`);
      await fetchContributions();
      showNotification("Pledge reset");
    } catch (err) {
      console.error('Reset error:', err);
      showNotification(err.response?.data?.error || "Reset failed", "error");
    } finally {
      setUpdatingPledges(prev => ({ ...prev, [pledgeId]: false }));
      setResettingPledge(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!canModify) {
      showNotification("You don't have permission to bulk approve", "error");
      return;
    }

    if (selectedPledges.length === 0) {
      showNotification("No pledges selected", "error");
      return;
    }

    setBulkApproving(true);

    try {
      for (const id of selectedPledges) {
        await api.put(`/api/jumuia/pledges/${id}/approve`);
      }
      await fetchContributions();
      setSelectedPledges([]);
      showNotification(`${selectedPledges.length} pledges approved`);
    } catch (err) {
      console.error('Bulk approve error:', err);
      showNotification(err.response?.data?.error || "Bulk approve failed", "error");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleBulkDeleteCampaigns = async () => {
    if (!canModify) {
      showNotification("You don't have permission to delete campaigns", "error");
      return;
    }

    if (selectedCampaigns.length === 0) {
      showNotification("No campaigns selected", "error");
      return;
    }

    if (!window.confirm(`Delete ${selectedCampaigns.length} campaigns?`)) return;

    setBulkDeletingCampaigns(true);

    try {
      await api.post(
        `/api/jumuia/contributions/bulk-delete`,
        { ids: selectedCampaigns }
      );
      await fetchContributions();
      setSelectedCampaigns([]);
      setSelectAllCampaigns(false);
      showNotification(`${selectedCampaigns.length} campaigns deleted`);
    } catch (err) {
      console.error('Bulk delete error:', err);
      showNotification(err.response?.data?.error || "Failed to delete", "error");
    } finally {
      setBulkDeletingCampaigns(false);
    }
  };

  const handleBulkDuplicateCampaigns = async () => {
    if (!canModify) {
      showNotification("You don't have permission to duplicate campaigns", "error");
      return;
    }

    if (selectedCampaigns.length === 0) {
      showNotification("No campaigns selected", "error");
      return;
    }

    setBulkDuplicatingCampaigns(true);

    try {
      const response = await api.post(
        `/api/jumuia/contributions/bulk-duplicate`,
        { ids: selectedCampaigns }
      );
      setContributions(prev => [...response.data.campaigns, ...prev]);
      setSelectedCampaigns([]);
      setSelectAllCampaigns(false);
      showNotification(`${selectedCampaigns.length} campaigns duplicated`);
    } catch (err) {
      console.error('Bulk duplicate error:', err);
      showNotification(err.response?.data?.error || "Failed to duplicate", "error");
    } finally {
      setBulkDuplicatingCampaigns(false);
    }
  };

  // Filter functions
  const filterPledgesByStatus = (pledges) => {
    if (activeTabContrib === "all") return pledges;
    if (activeTabContrib === "pending") return pledges.filter(p => p.status === "PENDING" && p.pendingAmount > 0);
    if (activeTabContrib === "approved") return pledges.filter(p => p.status === "APPROVED");
    if (activeTabContrib === "completed") return pledges.filter(p => p.status === "COMPLETED" || (p.amountPaid || 0) >= (p.contributionType?.amountRequired || 0));
    return pledges;
  };

  const filterPledgesBySearch = (pledges) => {
    if (!searchTerm) return pledges;
    return pledges.filter(p => 
      p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Toggle functions
  const toggleSelectCampaign = (id) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCampaigns = () => {
    if (selectAllCampaigns) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(contributions.map(t => t.id));
    }
    setSelectAllCampaigns(!selectAllCampaigns);
  };

  const toggleSelectPledge = (id) => {
    setSelectedPledges((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ==================== TAB HANDLING ====================

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    
    if (tab === 'contributions' && contributions.length === 0 && jumuia) {
      await fetchContributions();
    }
  };

  // ==================== EXPORT FUNCTIONS ====================

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contributions");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToCSV = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const handleExport = () => {
    const { format, campaign, status, dateFrom, dateTo } = exportOptions;
    let data = [];

    if (campaign === 'all') {
      contributions.forEach(type => {
        let filteredPledges = type.pledges || [];
        
        if (status !== 'all') {
          if (status === 'pending') {
            filteredPledges = filteredPledges.filter(p => p.status === "PENDING" && p.pendingAmount > 0);
          } else if (status === 'approved') {
            filteredPledges = filteredPledges.filter(p => p.status === "APPROVED");
          } else if (status === 'completed') {
            filteredPledges = filteredPledges.filter(p => p.status === "COMPLETED" || (p.amountPaid || 0) >= type.amountRequired);
          }
        }

        if (dateFrom || dateTo) {
          filteredPledges = filteredPledges.filter(p => {
            const pledgeDate = new Date(p.createdAt);
            if (dateFrom && new Date(dateFrom) > pledgeDate) return false;
            if (dateTo && new Date(dateTo) < pledgeDate) return false;
            return true;
          });
        }

        filteredPledges.forEach(pledge => {
          data.push({
            Campaign: type.title,
            Member: pledge.user?.fullName || "Unknown",
            Email: pledge.user?.email || "",
            AmountRequired: type.amountRequired || 0,
            AmountPaid: pledge.amountPaid || 0,
            PendingAmount: pledge.pendingAmount || 0,
            Status: (pledge.amountPaid || 0) >= (type.amountRequired || 0) ? "COMPLETED" : pledge.status,
            Message: pledge.message || "-",
            Date: new Date(pledge.createdAt).toLocaleDateString(),
          });
        });
      });
    }

    if (data.length === 0) {
      showNotification("No data to export", "error");
      return;
    }

    const filename = `${jumuia?.name}_contributions_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      exportToExcel(data, filename);
    } else if (format === 'csv') {
      exportToCSV(data, filename);
    }

    setShowExportMenu(false);
    showNotification(`Export completed: ${data.length} records`, "success");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading jumuia details...</p>
      </div>
    );
  }

  if (error || !jumuia) {
    return (
      <div style={styles.errorContainer}>
        <h2>{error || 'Jumuia not found'}</h2>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
              ...(notification.type === "success" ? styles.notificationSuccess : styles.notificationError)
            }}
          >
            {notification.type === "success" ? "✓" : "⚠"} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Updates Indicator (like SongsPage has notification) */}
      <AnimatePresence>
        {showLiveIndicator && (
          <motion.div
            style={styles.liveIndicator}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <Icons.Live />
            <span>Live Updates {socketConnected ? 'Connected' : 'Reconnecting...'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Updates Feed */}
      {liveUpdates.length > 0 && (
        <div style={styles.liveUpdatesFeed}>
          {liveUpdates.map(update => (
            <motion.div
              key={update.id}
              style={{
                ...styles.liveUpdate,
                ...(update.type === 'success' ? styles.liveUpdateSuccess : 
                   update.type === 'error' ? styles.liveUpdateError : 
                   styles.liveUpdateInfo)
              }}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <span>{update.message}</span>
              <small>{update.timestamp.toLocaleTimeString()}</small>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{jumuia.name}</h1>
          <div style={styles.stats}>
            <span style={styles.statBadge}>
              {members.length} Members
            </span>
            {isLeader && (
              <span style={styles.leaderBadge}>
                👑 Leader
              </span>
            )}
            {isTreasurer && (
              <span style={styles.treasurerBadge}>
                💰 Treasurer
              </span>
            )}
            {isAdmin && (
              <span style={styles.adminBadge}>
                👤 Admin
              </span>
            )}
            <span style={{
              ...styles.statBadge,
              background: socketConnected ? '#d1fae5' : '#fee2e2',
              color: socketConnected ? '#059669' : '#dc2626'
            }}>
              {socketConnected ? <Icons.Wifi /> : <Icons.WifiOff />}
              {socketConnected ? ' Live' : ' Offline'}
            </span>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={refreshData} 
            style={styles.refreshButton}
            disabled={refreshing}
          >
            <Icons.Refresh className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'members' && styles.activeTab)
          }}
          onClick={() => handleTabChange('members')}
        >
          <Icons.Users /> Members
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'contributions' && styles.activeTab)
          }}
          onClick={() => handleTabChange('contributions')}
        >
          💰 Contributions
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'members' && (
          <MembersList 
            members={members} 
            canModify={canModify}
            isAdmin={isAdmin}
            onRemoveMember={handleMemberRemoved}
            onAssignLeader={handleLeaderAssigned}
            onRemoveLeader={handleLeaderAssigned}
            onAddMember={() => setShowAddMemberModal(true)}
          />
        )}

        {activeTab === 'contributions' && (
          <ContributionsSection
            contributions={contributions}
            canModify={canModify}
            newContribution={newContribution}
            setNewContribution={setNewContribution}
            creatingCampaign={creatingCampaign}
            handleAddContribution={handleAddContribution}
            handleDeleteContribution={handleDeleteContribution}
            deletingCampaign={deletingCampaign}
            selectedCampaigns={selectedCampaigns}
            toggleSelectCampaign={toggleSelectCampaign}
            selectAllCampaigns={selectAllCampaigns}
            toggleSelectAllCampaigns={toggleSelectAllCampaigns}
            handleBulkDeleteCampaigns={handleBulkDeleteCampaigns}
            bulkDeletingCampaigns={bulkDeletingCampaigns}
            handleBulkDuplicateCampaigns={handleBulkDuplicateCampaigns}
            bulkDuplicatingCampaigns={bulkDuplicatingCampaigns}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            calculateTypeStats={calculateTypeStats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeTabContrib={activeTabContrib}
            setActiveTabContrib={setActiveTabContrib}
            selectedPledges={selectedPledges}
            handleBulkApprove={handleBulkApprove}
            bulkApproving={bulkApproving}
            filterPledgesByStatus={filterPledgesByStatus}
            filterPledgesBySearch={filterPledgesBySearch}
            expandedMember={expandedMember}
            setExpandedMember={setExpandedMember}
            handleApprovePledge={handleApprovePledge}
            approvingPledge={approvingPledge}
            pledgeInputs={pledgeInputs}
            setPledgeInputs={setPledgeInputs}
            handleManualAdd={handleManualAdd}
            addingManual={addingManual}
            handleResetPledge={handleResetPledge}
            resettingPledge={resettingPledge}
            handleEditMessage={handleEditMessage}
            setPledgeMessageThread={setPledgeMessageThread}
            toggleSelectPledge={toggleSelectPledge}
            updatingPledges={updatingPledges}
            showExportMenu={showExportMenu}
            setShowExportMenu={setShowExportMenu}
            exportOptions={exportOptions}
            setExportOptions={setExportOptions}
            handleExport={handleExport}
            socketConnected={socketConnected}
          />
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          jumuiaId={jumuia.id}
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleMemberAdded}
        />
      )}

      {/* Message Modal */}
      {pledgeMessageThread && (
        <SimpleMessageModal
          pledgeId={pledgeMessageThread.pledgeId}
          userName={pledgeMessageThread.userName}
          onClose={() => setPledgeMessageThread(null)}
        />
      )}
    </div>
  );
}

// ==================== MEMBERS SECTION ====================
function MembersList({ members, canModify, isAdmin, onRemoveMember, onAssignLeader, onRemoveLeader, onAddMember }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeadersOnly, setShowLeadersOnly] = useState(false);
  
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeaderFilter = showLeadersOnly ? m.specialRole === 'jumuia_leader' : true;
    return matchesSearch && matchesLeaderFilter;
  });

  const leaders = members.filter(m => m.specialRole === 'jumuia_leader');
  const regularMembers = members.filter(m => m.specialRole !== 'jumuia_leader');

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Members ({members.length})</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={styles.searchWrapper}>
            <Icons.Search />
            <input
              type="text"
              placeholder="Search members..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            style={{
              ...styles.filterButton,
              background: showLeadersOnly ? '#2563eb' : '#fff',
              color: showLeadersOnly ? '#fff' : '#64748b'
            }}
            onClick={() => setShowLeadersOnly(!showLeadersOnly)}
          >
            <Icons.Shield /> Leaders Only
          </button>
          {canModify && (
            <button style={styles.primaryButton} onClick={onAddMember}>
              <Icons.Plus /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Leaders Section */}
      {leaders.length > 0 && !showLeadersOnly && (
        <div style={styles.leadersSection}>
          <h3 style={styles.subSectionTitle}>👑 Leaders ({leaders.length})</h3>
          <div style={styles.membersGrid}>
            {leaders.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                canModify={canModify}
                isAdmin={isAdmin}
                onRemove={onRemoveMember}
                onRemoveLeader={onRemoveLeader}
                isLeader={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Members Section */}
      {regularMembers.length > 0 && !showLeadersOnly && (
        <div style={styles.membersSection}>
          <h3 style={styles.subSectionTitle}>👥 Members ({regularMembers.length})</h3>
          <div style={styles.membersGrid}>
            {regularMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                canModify={canModify}
                isAdmin={isAdmin}
                onRemove={onRemoveMember}
                onAssignLeader={onAssignLeader}
                isLeader={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtered Results */}
      {showLeadersOnly && (
        <div style={styles.membersGrid}>
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              canModify={canModify}
              isAdmin={isAdmin}
              onRemove={onRemoveMember}
              onAssignLeader={onAssignLeader}
              onRemoveLeader={onRemoveLeader}
              isLeader={member.specialRole === 'jumuia_leader'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, canModify, isAdmin, onRemove, onAssignLeader, onRemoveLeader, isLeader }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      style={styles.memberCard}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={styles.memberAvatar}>
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.fullName} style={styles.avatarImage} />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {member.fullName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div style={styles.memberInfo}>
        <h3 style={styles.memberName}>{member.fullName}</h3>
        <p style={styles.memberEmail}>{member.email}</p>
        <div style={styles.memberBadges}>
          {member.role === 'admin' && (
            <span style={styles.adminBadge}>Admin</span>
          )}
          {isLeader && (
            <span style={styles.leaderBadge}>Leader</span>
          )}
          {member.specialRole === 'treasurer' && (
            <span style={styles.treasurerBadge}>Treasurer</span>
          )}
          {member.membership_number && (
            <span style={styles.membershipBadge}>
              #{member.membership_number}
            </span>
          )}
        </div>
      </div>

      {canModify && showActions && (
        <div style={styles.memberActions}>
          {!isLeader && isAdmin && (
            <button
              style={styles.assignLeaderBtn}
              onClick={() => onAssignLeader(member.id)}
              title="Make Leader"
            >
              👑
            </button>
          )}
          {isLeader && isAdmin && (
            <button
              style={styles.removeLeaderBtn}
              onClick={() => onRemoveLeader(member.id)}
              title="Remove Leader"
            >
              👑❌
            </button>
          )}
          <button
            style={styles.removeMemberBtn}
            onClick={() => onRemove(member.id, member.fullName)}
            title="Remove from Jumuia"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== CONTRIBUTIONS SECTION ====================
function ContributionsSection(props) {
  const summaryStats = {
    totalCampaigns: props.contributions.length,
    totalMembers: new Set(props.contributions.flatMap(t => t.pledges?.map(p => p.userId) || [])).size,
    pendingCount: props.contributions.reduce((sum, t) => 
      sum + (t.pledges?.filter(p => p.status === "PENDING" && p.pendingAmount > 0).length || 0), 0),
    totalCollected: props.contributions.reduce((sum, t) => 
      sum + (t.pledges?.reduce((s, p) => s + (p.amountPaid || 0), 0) || 0), 0)
  };

  return (
    <div style={styles.contributionsContainer}>
      {/* Background with gradient */}
      <div style={styles.backgroundGradient} />
      
      {/* Header with Export and Stats */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Jumuia Contributions</h2>
        <div style={styles.headerActions}>
          {/* Socket Status */}
          <div style={{
            ...styles.socketStatus,
            background: props.socketConnected ? '#d1fae5' : '#fee2e2',
            color: props.socketConnected ? '#059669' : '#dc2626'
          }}>
            {props.socketConnected ? <Icons.Wifi /> : <Icons.WifiOff />}
            {props.socketConnected ? ' Live' : ' Offline'}
          </div>

          {/* Export Dropdown */}
          <div style={styles.exportDropdown}>
            <button 
              style={styles.exportBtn}
              onClick={() => props.setShowExportMenu(!props.showExportMenu)}
            >
              <Icons.Download />
              Export
              <span>{props.showExportMenu ? "▼" : "▶"}</span>
            </button>

            {props.showExportMenu && (
              <div style={styles.exportMenu}>
                <div style={styles.exportOption}>
                  <label>Format</label>
                  <div style={styles.formatButtons}>
                    <button
                      style={props.exportOptions.format === 'excel' ? styles.activeFormatBtn : styles.formatBtn}
                      onClick={() => props.setExportOptions({...props.exportOptions, format: 'excel'})}
                    >
                      <Icons.Excel /> Excel
                    </button>
                    <button
                      style={props.exportOptions.format === 'csv' ? styles.activeFormatBtn : styles.formatBtn}
                      onClick={() => props.setExportOptions({...props.exportOptions, format: 'csv'})}
                    >
                      <Icons.Download /> CSV
                    </button>
                  </div>
                </div>

                <div style={styles.exportOption}>
                  <label>Campaign</label>
                  <select
                    style={styles.exportSelect}
                    value={props.exportOptions.campaign}
                    onChange={(e) => props.setExportOptions({...props.exportOptions, campaign: e.target.value})}
                  >
                    <option value="all">All Campaigns</option>
                    {props.contributions.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.exportOption}>
                  <label>Status</label>
                  <select
                    style={styles.exportSelect}
                    value={props.exportOptions.status}
                    onChange={(e) => props.setExportOptions({...props.exportOptions, status: e.target.value})}
                  >
                    <option value="all">All Pledges</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={styles.exportActions}>
                  <button style={styles.cancelBtn} onClick={() => props.setShowExportMenu(false)}>
                    Cancel
                  </button>
                  <button style={styles.confirmBtn} onClick={props.handleExport}>
                    Export
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {props.contributions.length > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <span>📊</span>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{summaryStats.totalCampaigns}</span>
              <span style={styles.statLabel}>Campaigns</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
              <span>👥</span>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{summaryStats.totalMembers}</span>
              <span style={styles.statLabel}>Contributors</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              <span>⏳</span>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{summaryStats.pendingCount}</span>
              <span style={styles.statLabel}>Pending</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
              <span>💰</span>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>KES {summaryStats.totalCollected.toLocaleString()}</span>
              <span style={styles.statLabel}>Collected</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Form */}
      {props.canModify && (
        <div style={styles.createCampaign}>
          <h3 style={styles.subSectionTitle}>Create New Campaign</h3>
          <div style={styles.campaignForm}>
            <input
              style={styles.formInput}
              placeholder="Campaign title *"
              value={props.newContribution.title}
              onChange={(e) => props.setNewContribution({ ...props.newContribution, title: e.target.value })}
            />
            <input
              style={styles.formInput}
              placeholder="Description"
              value={props.newContribution.description}
              onChange={(e) => props.setNewContribution({ ...props.newContribution, description: e.target.value })}
            />
            <input
              style={styles.formInput}
              type="number"
              placeholder="Amount per member *"
              value={props.newContribution.amountRequired}
              onChange={(e) => props.setNewContribution({ ...props.newContribution, amountRequired: e.target.value })}
            />
            <input
              style={styles.formInput}
              type="date"
              placeholder="Deadline"
              value={props.newContribution.deadline}
              onChange={(e) => props.setNewContribution({ ...props.newContribution, deadline: e.target.value })}
            />
            <button 
              style={styles.createBtn}
              onClick={props.handleAddContribution}
              disabled={props.creatingCampaign}
            >
              {props.creatingCampaign ? <Icons.Spinner /> : <Icons.Plus />}
              {props.creatingCampaign ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Campaign Selection Header */}
      {props.canModify && props.contributions.length > 0 && (
        <div style={styles.campaignSelectionHeader}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={props.selectAllCampaigns}
              onChange={props.toggleSelectAllCampaigns}
            />
            Select All Campaigns
          </label>
          {props.selectedCampaigns.length > 0 && (
            <div style={styles.bulkActions}>
              <span style={styles.selectedCount}>{props.selectedCampaigns.length} selected</span>
              <button 
                style={styles.bulkDeleteBtn}
                onClick={props.handleBulkDeleteCampaigns}
                disabled={props.bulkDeletingCampaigns}
              >
                {props.bulkDeletingCampaigns ? <Icons.Spinner /> : <Icons.Trash />}
                Delete
              </button>
              <button 
                style={styles.bulkDuplicateBtn}
                onClick={props.handleBulkDuplicateCampaigns}
                disabled={props.bulkDuplicatingCampaigns}
              >
                {props.bulkDuplicatingCampaigns ? <Icons.Spinner /> : <Icons.Copy />}
                Duplicate
              </button>
            </div>
          )}
        </div>
      )}

      {/* Campaigns List */}
      <div style={styles.campaignsList}>
        {props.contributions.map((type) => {
          const stats = props.calculateTypeStats(type);
          const isCollapsed = props.collapsed[type.id];
          const isSelected = props.selectedCampaigns.includes(type.id);
          
          let filteredPledges = type.pledges || [];
          filteredPledges = props.filterPledgesBySearch(filteredPledges);
          
          const pendingPledges = filteredPledges.filter(p => p.status === "PENDING" && p.pendingAmount > 0);
          const approvedPledges = filteredPledges.filter(p => p.status === "APPROVED");
          const completedPledges = filteredPledges.filter(p => p.status === "COMPLETED" || (p.amountPaid || 0) >= (type.amountRequired || 0));
          const noPledge = filteredPledges.filter(p => !p.pendingAmount && !p.amountPaid);

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={styles.campaignCard}
            >
              {/* Campaign Header */}
              <div style={styles.campaignHeader} onClick={() => props.setCollapsed({ ...props.collapsed, [type.id]: !isCollapsed })}>
                <div style={styles.campaignHeaderLeft}>
                  {props.canModify && (
                    <input
                      type="checkbox"
                      style={styles.campaignCheckbox}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        props.toggleSelectCampaign(type.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div style={styles.campaignInfo}>
                    <h3 style={styles.campaignName}>{type.title}</h3>
                    <div style={styles.campaignMeta}>
                      <span style={styles.campaignTarget}>KES {(type.amountRequired || 0).toLocaleString()} per member</span>
                      {type.deadline && (
                        <span style={styles.campaignDeadline}>Due {new Date(type.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={styles.campaignProgressInfo}>
                  <div style={styles.progressStats}>
                    <span style={styles.progressPercent}>{stats.completion.toFixed(1)}%</span>
                    <span style={styles.progressCount}>{stats.contributors}/{stats.totalMembers} members</span>
                  </div>
                  <span style={styles.collapseIcon}>{isCollapsed ? "▼" : "▲"}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={styles.progressBarContainer}>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${stats.completion}%` }} />
                </div>
              </div>

              {/* Expanded Content */}
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={styles.campaignDetails}
                >
                  {/* Search and Filter Bar */}
                  <div style={styles.memberFilters}>
                    <div style={styles.searchWrapper}>
                      <Icons.Search />
                      <input
                        type="text"
                        placeholder="Search members..."
                        style={styles.searchInput}
                        value={props.searchTerm}
                        onChange={(e) => props.setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div style={styles.statusTabs}>
                      <button 
                        style={{...styles.tabBtn, ...(props.activeTabContrib === 'all' && styles.activeTabBtn)}}
                        onClick={() => props.setActiveTabContrib('all')}
                      >
                        All ({filteredPledges.length})
                      </button>
                      <button 
                        style={{...styles.tabBtn, ...(props.activeTabContrib === 'pending' && styles.activeTabBtn)}}
                        onClick={() => props.setActiveTabContrib('pending')}
                      >
                        Pending ({pendingPledges.length})
                      </button>
                      <button 
                        style={{...styles.tabBtn, ...(props.activeTabContrib === 'approved' && styles.activeTabBtn)}}
                        onClick={() => props.setActiveTabContrib('approved')}
                      >
                        Approved ({approvedPledges.length})
                      </button>
                      <button 
                        style={{...styles.tabBtn, ...(props.activeTabContrib === 'completed' && styles.activeTabBtn)}}
                        onClick={() => props.setActiveTabContrib('completed')}
                      >
                        Completed ({completedPledges.length})
                      </button>
                    </div>

                    {/* Bulk Actions */}
                    {props.canModify && props.selectedPledges.length > 0 && (
                      <div style={styles.bulkActionsBar}>
                        <span style={styles.selectedCount}>{props.selectedPledges.length} selected</span>
                        <button 
                          style={styles.bulkApproveBtn}
                          onClick={props.handleBulkApprove}
                          disabled={props.bulkApproving}
                        >
                          {props.bulkApproving ? <Icons.Spinner /> : <Icons.Check />}
                          Approve Selected
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Members List */}
                  <div style={styles.membersList}>
                    {props.activeTabContrib === 'all' && (
                      <>
                        {pendingPledges.map((pledge) => (
                          <MemberRow
                            key={pledge.id}
                            pledge={pledge}
                            type={type}
                            isExpanded={props.expandedMember === pledge.id}
                            onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                            onApprove={props.canModify ? props.handleApprovePledge : null}
                            onManualAdd={props.canModify ? props.handleManualAdd : null}
                            onEditMessage={props.canModify ? props.handleEditMessage : null}
                            onReset={props.canModify ? props.handleResetPledge : null}
                            onSelect={props.canModify ? props.toggleSelectPledge : null}
                            onOpenMessage={props.setPledgeMessageThread}
                            isSelected={props.selectedPledges.includes(pledge.id)}
                            inputValue={props.pledgeInputs[pledge.id]}
                            onInputChange={(id, field, value) => 
                              props.setPledgeInputs({
                                ...props.pledgeInputs,
                                [id]: { ...props.pledgeInputs[id], [field]: value }
                              })
                            }
                            isUpdating={props.updatingPledges[pledge.id]}
                            approvingId={props.approvingPledge}
                            addingId={props.addingManual}
                            resettingId={props.resettingPledge}
                            canModify={props.canModify}
                          />
                        ))}

                        {approvedPledges.map((pledge) => (
                          <MemberRow
                            key={pledge.id}
                            pledge={pledge}
                            type={type}
                            isExpanded={props.expandedMember === pledge.id}
                            onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                            onManualAdd={props.canModify ? props.handleManualAdd : null}
                            onEditMessage={props.canModify ? props.handleEditMessage : null}
                            onReset={props.canModify ? props.handleResetPledge : null}
                            onSelect={props.canModify ? props.toggleSelectPledge : null}
                            onOpenMessage={props.setPledgeMessageThread}
                            isSelected={props.selectedPledges.includes(pledge.id)}
                            inputValue={props.pledgeInputs[pledge.id]}
                            onInputChange={(id, field, value) => 
                              props.setPledgeInputs({
                                ...props.pledgeInputs,
                                [id]: { ...props.pledgeInputs[id], [field]: value }
                              })
                            }
                            isUpdating={props.updatingPledges[pledge.id]}
                            approvingId={props.approvingPledge}
                            addingId={props.addingManual}
                            resettingId={props.resettingPledge}
                            canModify={props.canModify}
                          />
                        ))}

                        {completedPledges.map((pledge) => (
                          <MemberRow
                            key={pledge.id}
                            pledge={pledge}
                            type={type}
                            isExpanded={props.expandedMember === pledge.id}
                            onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                            onEditMessage={props.canModify ? props.handleEditMessage : null}
                            onSelect={props.canModify ? props.toggleSelectPledge : null}
                            onOpenMessage={props.setPledgeMessageThread}
                            isSelected={props.selectedPledges.includes(pledge.id)}
                            inputValue={props.pledgeInputs[pledge.id]}
                            onInputChange={(id, field, value) => 
                              props.setPledgeInputs({
                                ...props.pledgeInputs,
                                [id]: { ...props.pledgeInputs[id], [field]: value }
                              })
                            }
                            isUpdating={props.updatingPledges[pledge.id]}
                            approvingId={props.approvingPledge}
                            addingId={props.addingManual}
                            resettingId={props.resettingPledge}
                            canModify={props.canModify}
                          />
                        ))}

                        {noPledge.map((pledge) => (
                          <MemberRow
                            key={pledge.id}
                            pledge={pledge}
                            type={type}
                            isExpanded={props.expandedMember === pledge.id}
                            onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                            onManualAdd={props.canModify ? props.handleManualAdd : null}
                            onEditMessage={props.canModify ? props.handleEditMessage : null}
                            onSelect={props.canModify ? props.toggleSelectPledge : null}
                            onOpenMessage={props.setPledgeMessageThread}
                            isSelected={props.selectedPledges.includes(pledge.id)}
                            inputValue={props.pledgeInputs[pledge.id]}
                            onInputChange={(id, field, value) => 
                              props.setPledgeInputs({
                                ...props.pledgeInputs,
                                [id]: { ...props.pledgeInputs[id], [field]: value }
                              })
                            }
                            isUpdating={props.updatingPledges[pledge.id]}
                            approvingId={props.approvingPledge}
                            addingId={props.addingManual}
                            resettingId={props.resettingPledge}
                            canModify={props.canModify}
                          />
                        ))}
                      </>
                    )}

                    {props.activeTabContrib === 'pending' && pendingPledges.map((pledge) => (
                      <MemberRow
                        key={pledge.id}
                        pledge={pledge}
                        type={type}
                        isExpanded={props.expandedMember === pledge.id}
                        onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                        onApprove={props.canModify ? props.handleApprovePledge : null}
                        onManualAdd={props.canModify ? props.handleManualAdd : null}
                        onEditMessage={props.canModify ? props.handleEditMessage : null}
                        onReset={props.canModify ? props.handleResetPledge : null}
                        onSelect={props.canModify ? props.toggleSelectPledge : null}
                        onOpenMessage={props.setPledgeMessageThread}
                        isSelected={props.selectedPledges.includes(pledge.id)}
                        inputValue={props.pledgeInputs[pledge.id]}
                        onInputChange={(id, field, value) => 
                          props.setPledgeInputs({
                            ...props.pledgeInputs,
                            [id]: { ...props.pledgeInputs[id], [field]: value }
                          })
                        }
                        isUpdating={props.updatingPledges[pledge.id]}
                        approvingId={props.approvingPledge}
                        addingId={props.addingManual}
                        resettingId={props.resettingPledge}
                        canModify={props.canModify}
                      />
                    ))}

                    {props.activeTabContrib === 'approved' && approvedPledges.map((pledge) => (
                      <MemberRow
                        key={pledge.id}
                        pledge={pledge}
                        type={type}
                        isExpanded={props.expandedMember === pledge.id}
                        onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                        onManualAdd={props.canModify ? props.handleManualAdd : null}
                        onEditMessage={props.canModify ? props.handleEditMessage : null}
                        onReset={props.canModify ? props.handleResetPledge : null}
                        onSelect={props.canModify ? props.toggleSelectPledge : null}
                        onOpenMessage={props.setPledgeMessageThread}
                        isSelected={props.selectedPledges.includes(pledge.id)}
                        inputValue={props.pledgeInputs[pledge.id]}
                        onInputChange={(id, field, value) => 
                          props.setPledgeInputs({
                            ...props.pledgeInputs,
                            [id]: { ...props.pledgeInputs[id], [field]: value }
                          })
                        }
                        isUpdating={props.updatingPledges[pledge.id]}
                        approvingId={props.approvingPledge}
                        addingId={props.addingManual}
                        resettingId={props.resettingPledge}
                        canModify={props.canModify}
                      />
                    ))}

                    {props.activeTabContrib === 'completed' && completedPledges.map((pledge) => (
                      <MemberRow
                        key={pledge.id}
                        pledge={pledge}
                        type={type}
                        isExpanded={props.expandedMember === pledge.id}
                        onToggle={() => props.setExpandedMember(props.expandedMember === pledge.id ? null : pledge.id)}
                        onEditMessage={props.canModify ? props.handleEditMessage : null}
                        onSelect={props.canModify ? props.toggleSelectPledge : null}
                        onOpenMessage={props.setPledgeMessageThread}
                        isSelected={props.selectedPledges.includes(pledge.id)}
                        inputValue={props.pledgeInputs[pledge.id]}
                        onInputChange={(id, field, value) => 
                          props.setPledgeInputs({
                            ...props.pledgeInputs,
                            [id]: { ...props.pledgeInputs[id], [field]: value }
                          })
                        }
                        isUpdating={props.updatingPledges[pledge.id]}
                        approvingId={props.approvingPledge}
                        addingId={props.addingManual}
                        resettingId={props.resettingPledge}
                        canModify={props.canModify}
                      />
                    ))}
                  </div>

                  {/* Campaign Footer */}
                  {props.canModify && (
                    <div style={styles.campaignFooter}>
                      <button 
                        style={styles.deleteCampaignBtn}
                        onClick={() => props.handleDeleteContribution(type.id)}
                        disabled={props.deletingCampaign === type.id}
                      >
                        {props.deletingCampaign === type.id ? <Icons.Spinner /> : <Icons.Trash />}
                        Delete Campaign
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MEMBER ROW COMPONENT ====================
function MemberRow({ 
  pledge, 
  type, 
  isExpanded, 
  onToggle, 
  onApprove, 
  onManualAdd, 
  onEditMessage, 
  onReset, 
  onSelect, 
  onOpenMessage,
  isSelected, 
  inputValue, 
  onInputChange,
  isUpdating,
  approvingId,
  addingId,
  resettingId,
  canModify 
}) {
  const amountPaid = pledge.amountPaid || 0;
  const pendingAmount = pledge.pendingAmount || 0;
  const amountRequired = type.amountRequired || 0;
  
  const status = amountPaid >= amountRequired ? "COMPLETED" : pledge.status || "PENDING";
  const canApprove = pendingAmount > 0 && pledge.status === "PENDING";
  const isCompleted = status === "COMPLETED";
  const remaining = amountRequired - amountPaid;
  
  const isApproving = approvingId === pledge.id;
  const isAdding = addingId === pledge.id;
  const isResetting = resettingId === pledge.id;

  const getStatusStyle = () => {
    if (isCompleted) return "completed";
    switch(status) {
      case "APPROVED": return "approved";
      case "PENDING": return "pending";
      default: return "default";
    }
  };

  return (
    <motion.div 
      style={{ 
        ...styles.memberRow, 
        ...(isUpdating && styles.updatingRow),
        ...(isSelected && styles.selectedRow)
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={styles.memberSummary} onClick={onToggle}>
        {canModify && (
          <input
            type="checkbox"
            style={styles.memberCheckbox}
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(pledge.id);
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={isUpdating}
          />
        )}
        <div style={styles.memberAvatarSmall}>
          {pledge.user?.fullName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div style={styles.memberDetails}>
          <div style={styles.memberName}>{pledge.user?.fullName || "Unknown"}</div>
          <div style={styles.memberAmounts}>
            <span style={styles.amountPaid}>Paid: KES {amountPaid.toLocaleString()}</span>
            <span style={styles.amountPending}>Pending: KES {pendingAmount.toLocaleString()}</span>
          </div>
        </div>
        <div style={styles.memberStatus}>
          <span style={{...styles.statusBadge, ...styles[getStatusStyle()]}}>
            {status}
          </span>
        </div>
        <span style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={styles.memberExpanded}
        >
          {!isCompleted ? (
            <>
              <div style={styles.actionGroup}>
                {canModify && canApprove && (
                  <button 
                    style={{...styles.actionBtn, ...styles.approveBtn}}
                    onClick={() => onApprove(pledge.id, pledge, type)}
                    disabled={isUpdating || isApproving}
                  >
                    {isApproving ? <Icons.Spinner /> : null}
                    {isApproving ? 'Approving...' : '✓ Approve'}
                  </button>
                )}
                
                {canModify && (
                  <input
                    type="number"
                    placeholder="Amount"
                    style={styles.actionInput}
                    value={inputValue?.amount || ""}
                    onChange={(e) => onInputChange(pledge.id, 'amount', e.target.value)}
                    disabled={isUpdating || isAdding}
                  />
                )}
                
                {canModify && (
                  <button 
                    style={{...styles.actionBtn, ...styles.addBtn}}
                    onClick={() => onManualAdd(pledge.id, pledge, type)}
                    disabled={isUpdating || isAdding}
                  >
                    {isAdding ? <Icons.Spinner /> : null}
                    {isAdding ? 'Adding...' : '+ Add'}
                  </button>
                )}

                {canModify && (
                  <button 
                    style={{...styles.actionBtn, ...styles.resetBtn}}
                    onClick={() => onReset(pledge.id)}
                    disabled={isUpdating || isResetting}
                  >
                    {isResetting ? <Icons.Spinner /> : null}
                    {isResetting ? 'Resetting...' : '↻ Reset'}
                  </button>
                )}

                <button 
                  style={{...styles.actionBtn, ...styles.messageBtn}}
                  onClick={() => onOpenMessage({ pledgeId: pledge.id, userName: pledge.user?.fullName })}
                  disabled={isUpdating}
                >
                  💬 Message
                </button>
              </div>

              {pendingAmount > 0 && (
                <div style={styles.pendingInfo}>
                  ⏳ Pending Approval: KES {pendingAmount.toLocaleString()}
                  {!canModify && (
                    <div style={styles.pendingNote}>
                      An admin or leader will review your pledge
                    </div>
                  )}
                </div>
              )}

              {canModify && (
                <div style={styles.messageInput}>
                  <input
                    type="text"
                    placeholder="Edit message"
                    style={styles.messageField}
                    value={inputValue?.message || ""}
                    onChange={(e) => onInputChange(pledge.id, 'message', e.target.value)}
                    disabled={isUpdating}
                  />
                  <button 
                    style={{...styles.actionBtn, ...styles.updateBtn}}
                    onClick={() => onEditMessage(pledge.id)}
                    disabled={isUpdating}
                  >
                    Update
                  </button>
                </div>
              )}

              {remaining > 0 && amountPaid > 0 && (
                <div style={styles.remainingInfo}>
                  Remaining: KES {remaining.toLocaleString()}
                </div>
              )}
            </>
          ) : (
            <div style={styles.completedBadge}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>🎉</span>
              <div>
                <strong>Contribution Completed!</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  This member has fully paid KES {amountPaid.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ==================== ADD MEMBER MODAL ====================
function AddMemberModal({ jumuiaId, onClose, onAdd }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      const available = res.data.filter(u => !u.jumuiaId);
      setUsers(available);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.membership_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '600px'}}>
        <h3>Add Member to Jumuia</h3>
        
        <div style={styles.searchWrapper}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Search users..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p>Loading users...</p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
            {filteredUsers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>No users available</p>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} style={styles.userRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.memberAvatarSmall}>
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{user.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{user.membership_number}</div>
                    </div>
                  </div>
                  <button
                    style={styles.addUserBtn}
                    onClick={() => onAdd(user.id)}
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div style={styles.modalButtons}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// SimpleMessageModal component
function SimpleMessageModal({ pledgeId, userName, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Message about {userName}'s pledge</h3>
        <p>Message functionality would go here</p>
        <button style={styles.cancelBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    background: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
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
  errorContainer: {
    textAlign: 'center',
    padding: '48px',
    color: '#dc2626',
  },
  notification: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  notificationSuccess: {
    background: '#10b981',
  },
  notificationError: {
    background: '#ef4444',
  },
  liveIndicator: {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: '#1e293b',
    color: 'white',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9998,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  liveUpdatesFeed: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '320px',
    zIndex: 9997,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  liveUpdate: {
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  liveUpdateSuccess: {
    background: '#10b981',
  },
  liveUpdateError: {
    background: '#ef4444',
  },
  liveUpdateInfo: {
    background: '#3b82f6',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statBadge: {
    padding: '4px 12px',
    background: '#e2e8f0',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  leaderBadge: {
    padding: '4px 12px',
    background: '#fef3c7',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#d97706',
  },
  treasurerBadge: {
    padding: '4px 12px',
    background: '#d1fae5',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#059669',
  },
  adminBadge: {
    padding: '4px 12px',
    background: '#fee2e2',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#dc2626',
  },
  membershipBadge: {
    padding: '4px 8px',
    background: '#e0f2fe',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#0284c7',
  },
  backButton: {
    padding: '8px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#475569',
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '24px',
    flexWrap: 'wrap',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tab: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#64748b',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
  },
  tabContent: {
    minHeight: '400px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  subSectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '16px 0 12px 0',
  },
  primaryButton: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#94a3b8',
    minWidth: '300px',
    '@media (max-width: 768px)': {
      minWidth: '100%',
    },
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1e293b',
    width: '100%',
  },
  membersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  memberCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  memberAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  memberAvatarSmall: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 4px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  memberEmail: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  memberBadges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  memberActions: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '4px',
  },
  assignLeaderBtn: {
    padding: '4px 8px',
    background: '#fef3c7',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeLeaderBtn: {
    padding: '4px 8px',
    background: '#fee2e2',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeMemberBtn: {
    padding: '4px 8px',
    background: '#fee2e2',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
  },
  leadersSection: {
    marginBottom: '24px',
  },
  membersSection: {
    marginBottom: '24px',
  },
  socketStatus: {
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  contributionsContainer: {
    position: 'relative',
    padding: '20px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '400px',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    borderRadius: '16px',
    zIndex: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    position: 'relative',
    zIndex: 1,
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '24px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1.2',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
  },
  selectedRow: {
    border: '2px solid #2563eb',
    boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
  },
  exportDropdown: {
    position: 'relative',
    zIndex: 10,
  },
  exportBtn: {
    padding: '8px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exportMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    width: '300px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #e2e8f0',
    padding: '16px',
    zIndex: 100,
  },
  exportOption: {
    marginBottom: '16px',
  },
  formatButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '8px',
  },
  formatBtn: {
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  activeFormatBtn: {
    padding: '8px',
    border: '1px solid #2563eb',
    borderRadius: '4px',
    background: '#eff6ff',
    color: '#2563eb',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  exportSelect: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    marginTop: '8px',
  },
  exportActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  createCampaign: {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 1,
  },
  campaignForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  formInput: {
    padding: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
  },
  createBtn: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  campaignSelectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px',
    background: '#fff',
    borderRadius: '8px',
    flexWrap: 'wrap',
    gap: '12px',
    position: 'relative',
    zIndex: 1,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectedCount: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f172a',
  },
  bulkDeleteBtn: {
    padding: '6px 12px',
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  bulkDuplicateBtn: {
    padding: '6px 12px',
    background: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  campaignsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    zIndex: 1,
  },
  campaignCard: {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  campaignHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    flexWrap: 'wrap',
    gap: '12px',
  },
  campaignHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: '200px',
  },
  campaignCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  campaignInfo: {
    flex: 1,
    minWidth: 0,
  },
  campaignName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  campaignMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    flexWrap: 'wrap',
  },
  campaignTarget: {
    color: '#2563eb',
    background: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  campaignDeadline: {
    color: '#64748b',
  },
  campaignProgressInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  progressStats: {
    textAlign: 'right',
  },
  progressPercent: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '600',
  },
  progressCount: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
  },
  collapseIcon: {
    fontSize: '16px',
    color: '#94a3b8',
    flexShrink: 0,
  },
  progressBarContainer: {
    padding: '0 16px 16px',
  },
  progressBar: {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#2563eb',
    transition: 'width 0.3s',
  },
  campaignDetails: {
    borderTop: '1px solid #f1f5f9',
    padding: '16px',
  },
  memberFilters: {
    marginBottom: '16px',
  },
  statusTabs: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: '4px',
  },
  tabBtn: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  activeTabBtn: {
    background: '#2563eb',
    color: '#fff',
    borderColor: '#2563eb',
  },
  bulkActionsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
    padding: '8px',
    background: '#f1f5f9',
    borderRadius: '6px',
    flexWrap: 'wrap',
  },
  bulkApproveBtn: {
    padding: '6px 12px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  memberRow: {
    border: '1px solid #f1f5f9',
    borderRadius: '6px',
    background: '#fff',
  },
  updatingRow: {
    opacity: 0.7,
    pointerEvents: 'none',
  },
  memberSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    cursor: 'pointer',
    flexWrap: 'wrap',
  },
  memberCheckbox: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  memberDetails: {
    flex: 1,
    minWidth: '200px',
  },
  memberAmounts: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  amountPaid: {
    color: '#059669',
  },
  amountPending: {
    color: '#d97706',
  },
  memberStatus: {
    marginRight: '8px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  pending: {
    background: '#fef3c7',
    color: '#d97706',
  },
  approved: {
    background: '#d1fae5',
    color: '#059669',
  },
  completed: {
    background: '#dbeafe',
    color: '#2563eb',
  },
  default: {
    background: '#f1f5f9',
    color: '#64748b',
  },
  expandIcon: {
    fontSize: '14px',
    color: '#94a3b8',
    flexShrink: 0,
  },
  memberExpanded: {
    padding: '16px',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  actionBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  },
  approveBtn: {
    background: '#10b981',
    color: '#fff',
  },
  addBtn: {
    background: '#2563eb',
    color: '#fff',
  },
  resetBtn: {
    background: '#f1f5f9',
    color: '#64748b',
  },
  messageBtn: {
    background: '#8b5cf6',
    color: '#fff',
  },
  updateBtn: {
    background: '#2563eb',
    color: '#fff',
  },
  actionInput: {
    width: '100px',
    padding: '6px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '12px',
  },
  pendingInfo: {
    marginTop: '8px',
    padding: '8px',
    background: '#fef3c7',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#d97706',
  },
  pendingNote: {
    fontSize: '11px',
    marginTop: '4px',
  },
  messageInput: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  messageField: {
    flex: 1,
    padding: '6px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '12px',
    minWidth: '200px',
  },
  remainingInfo: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
  completedBadge: {
    padding: '8px',
    background: '#d1fae5',
    color: '#059669',
    borderRadius: '4px',
    textAlign: 'center',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignFooter: {
    marginTop: '16px',
    textAlign: 'right',
  },
  deleteCampaignBtn: {
    padding: '8px 16px',
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  userRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      background: '#f8fafc',
    },
  },
  addUserBtn: {
    padding: '6px 12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

// Add global keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  * {
    box-sizing: border-box;
  }
  
  input, button, textarea, select {
    font-family: inherit;
  }
`;
document.head.appendChild(styleSheet);