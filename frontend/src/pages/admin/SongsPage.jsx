// frontend/src/pages/admin/SongsPage.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiX, FiEdit2, FiTrash2, FiCalendar,
  FiMapPin, FiMusic, FiBook, FiHeart,
  FiChevronDown, FiChevronUp, FiRefreshCw,
  FiAlertCircle, FiSearch, FiCheck, FiSave, FiClock,
  FiDownload, FiFileText, FiImage
} from "react-icons/fi";
import { GiChurch } from "react-icons/gi";
import { BsFileWord, BsFilePdf, BsFileImage } from "react-icons/bs";
import html2canvas from "html2canvas";
import axios from "axios";
import io from "socket.io-client";
import backgroundImg from "../../assets/background.png";
import BASE_URL from "../../api";

const songFields = [
  { key: "entrance", label: "Entrance Hymn", icon: "🚪" },
  { key: "mass", label: "Mass Hymn", icon: "⛪" },
  { key: "bible", label: "Bible Reading", icon: "📖" },
  { key: "offertory", label: "Offertory Hymn", icon: "🙏" },
  { key: "procession", label: "Procession Hymn", icon: "🚶" },
  { key: "mtakatifu", label: "Mtakatifu Hymn", icon: "✨" },
  { key: "signOfPeace", label: "Sign of Peace", icon: "🕊️" },
  { key: "communion", label: "Communion Hymn", icon: "🍞" },
  { key: "thanksgiving", label: "Thanksgiving Hymn", icon: "🎉" },
  { key: "exit", label: "Exit Hymn", icon: "👋" },
];

// Check if user has access to this page (Admin or Choir Moderator)
const checkAccess = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  
  if (!token) {
    window.location.href = "/login";
    return false;
  }
  
  // Allow access for Admin and Choir Moderator
  if (user.role !== "admin" && user.role !== "choir_moderator") {
    window.location.href = "/dashboard";
    return false;
  }
  
  return true;
};

export default function SongsPage() {
  // ALL HOOKS MUST BE AT THE TOP - in the same order every render
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ date: "", venue: "", songs: {} });
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVenue, setFilterVenue] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Refs
  const autoSaveTimerRef = useRef(null);
  const formRef = useRef(form);
  const editingIdRef = useRef(editingId);
  const programRefs = useRef({});

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Check access in useEffect (NOT before hooks)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const hasAccessCheck = checkAccess();
    setUserRole(user.role);
    setHasAccess(hasAccessCheck);
  }, []);

  // Load draft from localStorage on initial mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('programDraft');
    if (savedDraft && !draftLoaded) {
      try {
        const draft = JSON.parse(savedDraft);
        const draftTime = draft.timestamp || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - draftTime < oneDay) {
          setForm(draft.data);
          setEditingId(draft.editingId || null);
          setDraftLoaded(true);
          showNotification("Draft restored from previous session", "info");
        } else {
          localStorage.removeItem('programDraft');
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
  }, []);

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    const draftTimeout = setTimeout(() => {
      const hasContent = form.date || form.venue || Object.values(form.songs).some(v => v);
      if (hasContent) {
        const draft = {
          data: form,
          editingId: editingId,
          timestamp: Date.now()
        };
        localStorage.setItem('programDraft', JSON.stringify(draft));
      }
    }, 1000);

    return () => clearTimeout(draftTimeout);
  }, [form, editingId]);

  // Update refs when state changes
  useEffect(() => {
    formRef.current = form;
    editingIdRef.current = editingId;
  }, [form, editingId]);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(BASE_URL);
    
    socket.on('connect', () => {
      console.log('Connected to songs feed');
    });

    socket.on('program_updated', (program) => {
      setPrograms(prev => 
        prev.map(p => p.id === program.id ? program : p)
      );
    });

    socket.on('program_created', (program) => {
      setPrograms(prev => [program, ...prev]);
    });

    socket.on('program_deleted', (id) => {
      setPrograms(prev => prev.filter(p => p.id !== id));
    });

    return () => socket.disconnect();
  }, []);

  const fetchPrograms = async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true);
  else setLoading(true);
  
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/mass-programs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check what the API returns and extract the array
    let programsData = res.data;
    
    // If it's an object with a 'programs' property (like { programs: [...], hasMore, total })
    if (res.data.programs && Array.isArray(res.data.programs)) {
      programsData = res.data.programs;
    }
    // If it's already an array, use it directly
    else if (Array.isArray(res.data)) {
      programsData = res.data;
    }
    // Otherwise, try to handle gracefully
    else {
      console.warn("Unexpected API response format:", res.data);
      programsData = [];
    }
    
    setPrograms(programsData);
    
  } catch (err) {
    console.error("Fetch Programs Error:", err);
    showNotification("Failed to load programs: " + (err.response?.data?.error || err.message), "error");
    setPrograms([]); // Set empty array on error
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchPrograms();
  }, [token]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const handleChange = (key, value) => {
    if (songFields.some(f => f.key === key)) {
      setForm(prev => ({ ...prev, songs: { ...prev.songs, [key]: value } }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleEdit = (program) => {
    setEditingId(program.id);
    setForm({
      date: program.date,
      venue: program.venue,
      songs: songFields.reduce((acc, f) => {
        acc[f.key] = program[f.key] || "";
        return acc;
      }, {}),
    });
    setIsFormOpen(true);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ date: "", venue: "", songs: {} });
    setFormError("");
    localStorage.removeItem('programDraft');
  };

  const handleCancelProgram = () => {
    setForm({ date: "", venue: "", songs: {} });
    setFormError("");
    setEditingId(null);
    setIsFormOpen(false);
    localStorage.removeItem('programDraft');
  };

  const checkForDuplicates = () => {
    if (programs.length === 0) return true;

    const parseDate = (str) => {
      if (!str) return new Date(0);
      const [year, month, day] = str.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const sortedPrograms = [...programs]
      .filter(p => p.id !== editingId)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const lastProgram = sortedPrograms[0];

    if (lastProgram) {
      const normalize = (str) =>
        str?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";

      const duplicateSongs = songFields
        .filter(f => normalize(form.songs[f.key]) === normalize(lastProgram[f.key]))
        .map(f => f.label);

      if (duplicateSongs.length > 0) {
        const getOrdinal = (n) => {
          if (n > 3 && n < 21) return n + "th";
          switch (n % 10) {
            case 1: return n + "st";
            case 2: return n + "nd";
            case 3: return n + "rd";
            default: return n + "th";
          }
        };

        const formatDate = (dateStr) => {
          const date = new Date(dateStr);
          const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
          const dayNumber = getOrdinal(date.getDate());
          const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
          const year = date.getFullYear();
          return `${dayName} ${dayNumber} ${monthName} ${year}`;
        };

        setFormError(`Cannot add: ${duplicateSongs.join(", ")}. Already used on ${formatDate(lastProgram.date)}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.date || !form.venue) {
      setFormError("Date and venue are required");
      return;
    }

    if (!checkForDuplicates()) return;

    setIsSaving(true);
    
    const payload = { date: form.date, venue: form.venue, ...form.songs };

    try {
      if (editingId) {
        // CHANGED: Use admin mass-programs endpoint
        await axios.put(`${BASE_URL}/api/admin/mass-programs/${editingId}`, payload, { headers });
        showNotification("Program updated successfully", "success");
      } else {
        // CHANGED: Use admin mass-programs endpoint
        await axios.post(`${BASE_URL}/api/admin/mass-programs`, payload, { headers });
        showNotification("Program created successfully", "success");
      }
      fetchPrograms();
      handleCancel();
    } catch (err) {
      console.error("Save Program Error:", err);
      setFormError(err.response?.data?.error || "Failed to save program");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this program?")) return;
    try {
      // CHANGED: Use admin mass-programs endpoint
      await axios.delete(`${BASE_URL}/api/admin/mass-programs/${id}`, { headers });
      showNotification("Program deleted", "info");
      fetchPrograms();
    } catch (err) {
      console.error("Delete Program Error:", err);
      showNotification("Failed to delete program", "error");
    }
  };

  const toggleProgram = (id) => {
    setExpandedPrograms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const downloadAsWord = (program) => {
    const content = `
      <html>
      <head>
        <title>Mass Program - ${program.date}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .date { color: #7f8c8d; font-size: 16px; }
          .venue { font-size: 20px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #3498db; color: white; padding: 12px; text-align: left; font-size: 16px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .song-label { font-weight: 600; color: #2c3e50; width: 30%; }
          .footer { margin-top: 50px; text-align: center; color: #64748b; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MASS PROGRAM</h1>
          <div class="date">${formatDate(program.date)}</div>
          <div class="venue">${program.venue}</div>
        </div>
        
        <table>
          <tr>
            <th>Liturgy Part</th>
            <th>Song/Reading</th>
          </tr>
          ${songFields.map(field => `
            <tr>
              <td class="song-label">${field.label}</td>
              <td>${program[field.key] || '—'}</td>
            </tr>
          `).join('')}
        </table>
        
        <div class="footer">
          <p>Zetech University Catholic Action</p>
          <p>ZUCA PORTAL SYSTEM GENERATED PROGRAM</p>
          <p>May the Lord bless you</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass-program-${program.date}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Word document downloaded", "success");
  };

  const downloadAsPDF = (program) => {
    const content = `
      <html>
      <head>
        <title>Mass Program - ${program.date}</title>
        <style>
          body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          h1 { color: #000; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .date { color: #333; font-size: 16px; }
          .venue { font-size: 20px; font-weight: bold; margin-top: 5px; }
          .song-item { margin: 15px 0; padding: 10px; border-bottom: 1px solid #ccc; display: flex; }
          .song-label { font-weight: bold; width: 200px; }
          .footer { margin-top: 50px; text-align: center; border-top: 1px solid #000; padding-top: 20px; }
          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MASS PROGRAM</h1>
          <div class="date">${formatDate(program.date)}</div>
          <div class="venue">${program.venue}</div>
        </div>
        
        ${songFields.map(field => `
          <div class="song-item">
            <span class="song-label">${field.label}:</span>
            <span>${program[field.key] || '—'}</span>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>Zetech University Catholic Action</p>
          <p>ZUCA PORTAL SYSTEM GENERATED PROGRAM</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass-program-${program.date}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("HTML file created - use browser print (Ctrl+P) to save as PDF", "info");
  };

  const downloadAsImage = async (program) => {
    const programElement = programRefs.current[program.id];
    if (!programElement) return;

    setGeneratingImage(true);
    showNotification("Generating image...", "info");

    try {
      const container = document.createElement('div');
      container.style.padding = '30px';
      container.style.background = 'white';
      container.style.borderRadius = '16px';
      container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
      container.style.maxWidth = '800px';
      container.style.margin = '0 auto';
      container.style.fontFamily = 'Arial, sans-serif';
      
      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px;">MASS PROGRAM</h1>
          <div style="color: #64748b; font-size: 16px; margin-top: 10px;">${formatDate(program.date)}</div>
          <div style="font-size: 20px; font-weight: bold; color: #2c3e50; margin-top: 5px;">${program.venue}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px;">
          ${songFields.map(field => `
            <div style="padding: 15px; background: #f8fafc; border-radius: 10px; border-left: 4px solid #3498db;">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span>${field.icon}</span>
                <span>${field.label}</span>
              </div>
              <div style="color: #0f172a;">${program[field.key] || '—'}</div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 5px 0;">Zetech University Catholic Action</p>
          <p>ZUCA PORTAL SYSTEM GENERATED PROGRAM</p>
        </div>
      `;

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });

      document.body.removeChild(container);

      const link = document.createElement('a');
      link.download = `mass-program-${program.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showNotification("Image downloaded successfully", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      showNotification("Failed to generate image", "error");
    } finally {
      setGeneratingImage(false);
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const venues = ['all', ...new Set(programs.map(p => p.venue).filter(Boolean))];

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         Object.values(p).some(val => 
                           typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesVenue = filterVenue === 'all' || p.venue === filterVenue;
    return matchesSearch && matchesVenue;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Conditional return AFTER all hooks
  if (!hasAccess) {
    return null;
  }

  const isAdmin = userRole === "admin";
  const isChoirModerator = userRole === "choir_moderator";
  const canModify = isAdmin || isChoirModerator; // Both can create/edit/delete

  return (
    <div className="songs-page">
      {/* Fixed Background */}
      <div className="background-image" style={{ backgroundImage: `url(${backgroundImg})` }}></div>
      <div className="background-overlay"></div>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className={`notification ${notification.type}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            {notification.type === 'success' && <FiCheck />}
            {notification.type === 'error' && <FiAlertCircle />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="content-wrapper">
        {/* Header with Role Badge */}
        <div className="header">
          <div className="header-left">
            <div className="title-icon">
              <GiChurch />
            </div>
            <div>
              <h1 className="page-title">Mass Programs</h1>
              <p className="page-subtitle">
                {isChoirModerator ? "Manage songs and liturgy programs as Choir Moderator" : "Manage songs and liturgy programs"}
              </p>
            </div>
          </div>
          
          <div className="header-actions">
            {isChoirModerator && (
              <div className="role-badge" style={{ 
                background: '#ec489920', 
                color: '#ec4899', 
                border: '1px solid #ec4899',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🎵</span> Choir Moderator
              </div>
            )}
            <button 
              className="btn-icon"
              onClick={() => fetchPrograms(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            </button>
            {canModify && (
              <button 
                className="btn-primary"
                onClick={() => setIsFormOpen(!isFormOpen)}
              >
                {isFormOpen ? <FiX /> : <FiPlus />}
                <span>{isFormOpen ? 'Close' : 'New Program'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Draft Restore Indicator */}
        {draftLoaded && (
          <div className="draft-indicator">
            <FiClock />
            <span>Draft restored from previous session</span>
            <button 
              className="draft-clear"
              onClick={() => {
                localStorage.removeItem('programDraft');
                setForm({ date: "", venue: "", songs: {} });
                setEditingId(null);
                setDraftLoaded(false);
                showNotification("Draft cleared", "info");
              }}
            >
              <FiX /> Clear
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            className="filter-select"
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
          >
            <option value="all">All Venues</option>
            {venues.filter(v => v !== 'all').map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>

        {/* Form Card - Only show if canModify */}
        {canModify && (
          <AnimatePresence>
            {isFormOpen && (
              <motion.div 
                className="form-card"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="form-header">
                  <h3 className="form-title">
                    {editingId ? 'Edit Program' : 'Create New Program'}
                  </h3>
                  {lastSaved && (
                    <span className="last-saved">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <FiCalendar /> Date
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FiMapPin /> Venue
                      </label>
                      <input
                        type="text"
                        value={form.venue}
                        onChange={(e) => handleChange("venue", e.target.value)}
                        placeholder="e.g., Main Church"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="songs-grid">
                    {songFields.map(field => (
                      <div key={field.key} className="song-field">
                        <label className="song-label">
                          <span className="song-icon">{field.icon}</span>
                          <span>{field.label}</span>
                        </label>
                        <input
                          type="text"
                          value={form.songs[field.key] || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="song-input"
                        />
                      </div>
                    ))}
                  </div>

                  {formError && (
                    <div className="form-error">
                      <FiAlertCircle />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={handleCancelProgram}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-small"></span>
                          <span>{editingId ? 'Updating...' : 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <FiSave />
                          <span>{editingId ? 'Update Program' : 'Create Program'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Programs List */}
        <div className="content-area">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading programs...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <GiChurch />
              </div>
              <h3>No programs found</h3>
              <p>
                {searchTerm || filterVenue !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first mass program to get started'}
              </p>
              {!searchTerm && filterVenue === 'all' && canModify && (
                <button 
                  className="btn-primary"
                  onClick={() => setIsFormOpen(true)}
                >
                  <FiPlus /> Create Program
                </button>
              )}
            </div>
          ) : (
            <div className="programs-list">
              {filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  className="program-card"
                  ref={el => programRefs.current[program.id] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div 
                    className="program-header"
                    onClick={() => toggleProgram(program.id)}
                  >
                    <div className="program-info">
                      <div className="program-date">
                        <FiCalendar />
                        <span>{formatDate(program.date)}</span>
                      </div>
                      <div className="program-venue">
                        <FiMapPin />
                        <span>{program.venue}</span>
                      </div>
                    </div>
                    
                    <div className="program-actions">
                      {canModify && (
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(program);
                          }}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                      )}
                      
                      <div className="download-dropdown">
                        <button 
                          className="action-btn download"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(program.id);
                          }}
                          title="Download"
                          disabled={generatingImage}
                        >
                          <FiDownload />
                        </button>
                        
                        {activeDropdown === program.id && (
                          <div className="download-menu">
                            <button onClick={(e) => { e.stopPropagation(); downloadAsWord(program); toggleDropdown(null); }}>
                              <BsFileWord /> Word Document
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); downloadAsPDF(program); toggleDropdown(null); }}>
                              <BsFilePdf /> PDF (Print)
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); downloadAsImage(program); toggleDropdown(null); }}>
                              <BsFileImage /> Image (PNG)
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {canModify && (
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(program.id);
                          }}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      
                      <button className="expand-btn">
                        {expandedPrograms[program.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedPrograms[program.id] && (
                      <motion.div
                        className="program-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="songs-display">
                          {songFields.map(field => (
                            <div key={field.key} className="song-display-item">
                              <span className="song-display-label">
                                <span className="song-icon">{field.icon}</span>
                                {field.label}
                              </span>
                              <span className="song-display-value">
                                {program[field.key] || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Keep all your existing styles exactly as they were */
        .songs-page {
          min-height: 100vh;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
        }

        .background-image {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: -2;
        }

        .background-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%);
          z-index: -1;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .notification.success { background: #10b981; }
        .notification.error { background: #ef4444; }
        .notification.info { background: #3b82f6; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .title-icon {
          width: 48px;
          height: 48px;
          background: #f0f9ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #0284c7;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .role-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-icon {
          width: 44px;
          height: 44px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .btn-primary {
          background: #0284c7;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background: #0369a1;
        }

        .btn-secondary {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover {
          background: #f8fafc;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .draft-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #fff7ed;
          border-radius: 8px;
          margin-bottom: 20px;
          color: #9a3412;
          font-size: 14px;
          border: 1px solid #fed7aa;
        }
        .draft-clear {
          margin-left: auto;
          background: none;
          border: none;
          color: #9a3412;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
        .draft-clear:hover {
          background: #fed7aa;
        }

        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 18px;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        .filter-select {
          padding: 12px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          cursor: pointer;
          outline: none;
          min-width: 160px;
          background: white;
        }

        .form-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .form-title {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .last-saved {
          font-size: 12px;
          color: #64748b;
          background: #f8fafc;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .song-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .song-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
        }

        .song-icon {
          font-size: 18px;
        }

        .song-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .song-input:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          background: #fef2f2;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 20px;
          border: 1px solid #fecaca;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 24px;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
          margin-right: 6px;
        }

        .programs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .program-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.2s;
        }
        .program-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .program-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
        }

        .program-info {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .program-date, .program-venue {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 15px;
        }

        .program-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .action-btn.edit:hover { background: #dbeafe; color: #2563eb; }
        .action-btn.delete:hover { background: #fee2e2; color: #dc2626; }
        .action-btn.download:hover { background: #dcfce7; color: #16a34a; }

        .expand-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }

        .download-dropdown {
          position: relative;
          display: inline-block;
        }

        .download-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: white;
          border-radius: 8px;
          padding: 4px 0;
          min-width: 180px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 10;
          border: 1px solid #e2e8f0;
          margin-top: 4px;
        }
        .download-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: none;
          color: #0f172a;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .download-menu button:hover {
          background: #f8fafc;
        }

        .program-details {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .songs-display {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .song-display-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .song-display-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .song-display-value {
          font-size: 14px;
          color: #0f172a;
          word-break: break-word;
          padding-left: 26px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border: 3px solid #e2e8f0;
          border-top-color: #0284c7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #64748b;
          border: 2px dashed #e2e8f0;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #0f172a;
        }

        .empty-state p {
          color: #64748b;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .songs-page { padding: 16px; }
          
          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .search-filter-bar {
            flex-direction: column;
          }

          .filter-select {
            width: 100%;
          }

          .program-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .program-info {
            width: 100%;
            justify-content: space-between;
          }

          .program-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }

          .songs-grid {
            grid-template-columns: 1fr;
          }

          .songs-display {
            grid-template-columns: 1fr;
          }

          .download-menu {
            right: auto;
            left: 0;
          }
        }

        @media (max-width: 480px) {
          .program-info {
            flex-direction: column;
            gap: 8px;
          }

          .program-date, .program-venue {
            width: 100%;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .title-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .page-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>

    
  );
}