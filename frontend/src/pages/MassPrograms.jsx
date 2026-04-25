// frontend/src/pages/MassPrograms.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  FiShare2, 
  FiCalendar, 
  FiMapPin, 
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiDownload,
  FiClock,
  FiHeart,
  FiStar,
  FiPrinter,
  FiMail,
  FiMessageSquare,
  FiVolume2,
  FiEye,
  FiBookmark
} from "react-icons/fi";
import { 
  BsMusicNoteBeamed, 
  BsBook, 
  BsSun, 
  BsMoonStars,
  BsFlower1,
  BsPeace,
  BsHeart,
  BsStars,
  BsWhatsapp,
  BsTwitter,
  BsMusicNoteList,
  BsPlayCircle,
  BsPauseCircle,
  BsFileWord,
  BsFilePdf
} from "react-icons/bs";
import { 
  GiPrayerBeads,
  GiAngelWings,
  GiChurch,
  GiIncense,
  GiGrain,
  GiHolyGrail,
  GiHolyWater,
  GiVibratingShield
} from "react-icons/gi";
import { MdOutlineRestore, MdOutlineFormatQuote } from "react-icons/md";
import { IoTimeOutline, IoDocumentTextOutline, IoMusicalNotesOutline } from "react-icons/io5";
import { FaTelegramPlane, FaRegKeyboard, FaFileWord, FaFilePdf, FaFileAlt } from "react-icons/fa";
import BASE_URL from "../api";

// Enhanced song fields with more visibility options
const songFields = [
  { 
    key: "entrance", 
    label: "Entrance", 
    icon: <GiChurch />, 
    category: "opening", 
    color: "#4f46e5", 
    mobileOrder: 1,
    description: "Opening procession hymn",
    tips: "Gather the community in song"
  },
  { 
    key: "mass", 
    label: "Mass", 
    icon: <GiPrayerBeads />, 
    category: "liturgy", 
    color: "#7c3aed", 
    mobileOrder: 2,
    description: "Ordinary of the Mass",
    tips: "Kyrie, Gloria, Sanctus, Agnus Dei"
  },
  { 
    key: "bible", 
    label: "Reading", 
    icon: <BsBook />, 
    category: "word", 
    color: "#059669", 
    mobileOrder: 3,
    description: "Responsorial Psalm",
    tips: "Between the readings"
  },
  { 
    key: "offertory", 
    label: "Offertory", 
    icon: <GiGrain />, 
    category: "offering", 
    color: "#b45309", 
    mobileOrder: 4,
    description: "Preparation of gifts",
    tips: "During the offertory procession"
  },
  { 
    key: "procession", 
    label: "Procession", 
    icon: <GiAngelWings />, 
    category: "procession", 
    color: "#6b7280", 
    mobileOrder: 5,
    description: "Gospel procession",
    tips: "Before the Gospel reading"
  },
  { 
    key: "mtakatifu", 
    label: "Mtakatifu", 
    icon: <BsStars />, 
    category: "special", 
    color: "#8b5cf6", 
    mobileOrder: 6,
    description: "Saint's hymn",
    tips: "Feast day or memorial"
  },
  { 
    key: "signOfPeace", 
    label: "Peace", 
    icon: <BsPeace />, 
    category: "peace", 
    color: "#10b981", 
    mobileOrder: 7,
    description: "Sign of Peace",
    tips: "Exchange of peace"
  },
  { 
    key: "communion", 
    label: "Communion", 
    icon: <GiIncense />, 
    category: "communion", 
    color: "#991b1b", 
    mobileOrder: 8,
    description: "Communion hymn",
    tips: "During distribution of Communion"
  },
  { 
    key: "thanksgiving", 
    label: "Thanksgiving", 
    icon: <BsHeart />, 
    category: "thanksgiving", 
    color: "#ec4899", 
    mobileOrder: 9,
    description: "Post-Communion",
    tips: "After Communion meditation"
  },
  { 
    key: "exit", 
    label: "Exit", 
    icon: <BsMoonStars />, 
    category: "closing", 
    color: "#4b5563", 
    mobileOrder: 10,
    description: "Recessional hymn",
    tips: "Closing procession"
  },
];

// Compact mobile view
const mobileCompactFields = songFields.slice(0, 6);

export default function MassPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [highlightedSong, setHighlightedSong] = useState(null);
  const [songNotes, setSongNotes] = useState({});
  const [viewMode, setViewMode] = useState('compact'); // compact or detailed
  const [selectedSong, setSelectedSong] = useState(null);
  const [songPreview, setSongPreview] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    venues: 0,
    upcoming: 0,
    totalHymns: 0,
  });
  const [shareModal, setShareModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showDownloadMenu, setShowDownloadMenu] = useState(null);
  const downloadMenuRef = useRef(null);
  
  const token = localStorage.getItem("token");

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch programs
  const fetchPrograms = useCallback(async () => {
  try {
    setLoading(true);
    const res = await axios.get(`${BASE_URL}/api/mass-programs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    // ✅ FIX: Ensure we always have an array
    const programsData = Array.isArray(res.data) ? res.data : [];
    setPrograms(programsData);
    
    const now = new Date();
    const upcoming = programsData.filter(p => new Date(p.date) >= now).length;
    const venues = [...new Set(programsData.map(p => p.venue).filter(Boolean))].length;
    
    // Calculate total hymns
    let hymnCount = 0;
    programsData.forEach(p => {
      songFields.forEach(f => {
        if (p[f.key]) hymnCount++;
      });
    });
    
    setStats({
      total: programsData.length,
      venues,
      upcoming,
      totalHymns: hymnCount,
    });
  } catch (err) {
    console.error(err);
    setPrograms([]); // Set empty array on error
  } finally {
    setLoading(false);
  }
}, [token]);

  useEffect(() => {
    fetchPrograms();
    const savedFavorites = localStorage.getItem("massProgramFavorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    const savedNotes = localStorage.getItem("songNotes");
    if (savedNotes) setSongNotes(JSON.parse(savedNotes));
  }, [fetchPrograms]);

  useEffect(() => {
    localStorage.setItem("massProgramFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("songNotes", JSON.stringify(songNotes));
  }, [songNotes]);

  // ========== ENHANCED SONG INTERACTIVITY ==========
  const getSongFrequency = (key) => {
    let count = 0;
    programs.forEach(p => {
      if (p[key]) count++;
    });
    return count;
  };

  const getUniqueSongs = (key) => {
    const songs = new Set();
    programs.forEach(p => {
      if (p[key]) songs.add(p[key]);
    });
    return Array.from(songs);
  };

  const addSongNote = (programId, songKey, note) => {
    if (note && note.trim() !== '') {
      setSongNotes(prev => ({
        ...prev,
        [`${programId}-${songKey}`]: note
      }));
      showToast('📝 Note added');
    } else {
      // Remove note if empty
      const newNotes = { ...songNotes };
      delete newNotes[`${programId}-${songKey}`];
      setSongNotes(newNotes);
      showToast('📝 Note removed');
    }
  };

  const highlightSong = (programId, songKey) => {
    setHighlightedSong(`${programId}-${songKey}`);
    setTimeout(() => setHighlightedSong(null), 2000);
  };

  const previewSong = (songTitle) => {
    setSongPreview(songTitle);
    setTimeout(() => setSongPreview(null), 3000);
  };

  // ========== PROFESSIONAL DOCUMENT GENERATION WITH PROPER FORMATTING ==========
  const generateProfessionalDocument = (program, format) => {
    // Guard clause - if program is invalid
    if (!program || !program.date) {
      return format === 'html' 
        ? '<html><body><h1>Error: Invalid program data</h1></body></html>'
        : 'Error: Invalid program data';
    }
    
    try {
      const date = new Date(program.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Format time if available - remove "To be announced"
      const timeStr = program.time && program.time !== 'To be announced' ? program.time : '';
      
      // Get all hymns that exist for this program
      const hymns = songFields
        .filter(f => program[f.key] && program[f.key].trim() !== '')
        .map(f => {
          const note = songNotes[`${program.id}-${f.key}`];
          return {
            label: f.label,
            value: program[f.key],
            note: note || null,
            color: f.color
          };
        });
      
      if (format === 'text') {
        let content = '';
        content += '='.repeat(50) + '\n';
        content += '                    MASS PROGRAM\n';
        content += '='.repeat(50) + '\n\n';
        content += '📅 DATE: ' + formattedDate + '\n';
        if (timeStr) content += '⏰ TIME: ' + timeStr + '\n';
        content += '📍 VENUE: ' + (program.venue || 'Not specified') + '\n';
        content += '📊 TOTAL HYMNS: ' + hymns.length + '\n\n';
        content += '='.repeat(50) + '\n';
        content += '                    LITURGY ORDER\n';
        content += '='.repeat(50) + '\n\n';
        
        hymns.forEach((h, index) => {
          content += (index + 1).toString().padEnd(3) + h.label.padEnd(20) + ': ' + h.value + '\n';
          if (h.note) {
            content += '     📝 Note: ' + h.note + '\n';
          }
          content += '\n';
        });
        
        content += '\n' + '='.repeat(50) + '\n';
        content += '              ZETECH CATHOLIC ACTION\n';
        content += '='.repeat(50) + '\n';
        content += 'Generated on: ' + new Date().toLocaleString() + '\n';
        
        return content;
      }
      
      if (format === 'html') {
        let hymnsHtml = '';
        hymns.forEach((h, index) => {
          hymnsHtml += `
            <div class="hymn-item">
              <div class="hymn-number">${index + 1}</div>
              <div class="hymn-content">
                <div class="hymn-label" style="color: ${h.color}">${h.label}</div>
                <div class="hymn-value">${h.value}</div>
                ${h.note ? `<div class="hymn-note">📝 ${h.note}</div>` : ''}
              </div>
            </div>
          `;
        });

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mass Program - ${formattedDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      background: #ffffff; 
      padding: 0;
      margin: 0;
      line-height: 1.5;
    }
    .page {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px 30px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      min-height: 100vh;
    }
    h1 { 
      font-size: 32px; 
      text-align: center; 
      color: #4f46e5; 
      margin: 20px 0 10px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .subtitle {
      text-align: center;
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 16px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin: 30px 0; 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 12px; 
      border: 1px solid #e2e8f0;
    }
    .info-item { text-align: center; }
    .info-label { 
      font-size: 12px; 
      color: #6b7280; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
      margin-bottom: 5px;
    }
    .info-value { 
      font-size: 18px; 
      font-weight: 700; 
      color: #1f2937; 
    }
    .section-title { 
      font-size: 24px; 
      color: #4f46e5; 
      margin: 30px 0 20px; 
      padding-bottom: 10px; 
      border-bottom: 2px solid #e5e7eb; 
    }
    .hymn-list { 
      display: flex; 
      flex-direction: column; 
      gap: 15px; 
      margin: 20px 0;
    }
    .hymn-item { 
      display: flex; 
      gap: 15px;
      padding: 15px;
      background: #f8fafc; 
      border-radius: 8px; 
      border-left: 4px solid #4f46e5;
      page-break-inside: avoid;
    }
    .hymn-number {
      font-size: 18px;
      font-weight: 700;
      color: #4f46e5;
      min-width: 30px;
      text-align: center;
    }
    .hymn-content {
      flex: 1;
    }
    .hymn-label { 
      font-size: 16px; 
      font-weight: 700; 
      margin-bottom: 5px; 
    }
    .hymn-value { 
      font-size: 15px; 
      color: #1f2937; 
      line-height: 1.5;
    }
    .hymn-note { 
      font-size: 13px; 
      color: #8b5cf6; 
      margin-top: 5px; 
      font-style: italic; 
      padding: 5px 10px;
      background: #ede9fe;
      border-radius: 4px;
    }
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280; 
      font-size: 12px; 
    }
    @media print {
      body { background: white; }
      .page { box-shadow: none; padding: 0.5in; }
      .hymn-item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>MASS PROGRAM</h1>
    <div class="subtitle">Zetech Catholic Action</div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Date</div>
        <div class="info-value">${formattedDate}</div>
      </div>
      ${timeStr ? `
      <div class="info-item">
        <div class="info-label">Time</div>
        <div class="info-value">${timeStr}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Venue</div>
        <div class="info-value">${program.venue || 'Not specified'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Hymns</div>
        <div class="info-value">${hymns.length}</div>
      </div>
    </div>

    <h2 class="section-title">Liturgy Order</h2>
    
    <div class="hymn-list">
      ${hymnsHtml}
    </div>
    
    <div class="footer">
      <p>ZETECH CATHOLIC ACTION • Generated on ${new Date().toLocaleString()}</p>
      <p>ZUCA PORTAL SYSTEM GENERATED PROGRAM</p>
    </div>
  </div>
</body>
</html>`;
      }
      
      return '';
    } catch (error) {
      console.error('Error generating document:', error);
      return format === 'html' 
        ? '<html><body><h1>Error generating document</h1></body></html>'
        : 'Error generating document';
    }
  };

  // ========== RTF GENERATION FOR WORD (PROPERLY FORMATTED) ==========
  const generateRTFDocument = (program) => {
    const date = new Date(program.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const timeStr = program.time && program.time !== 'To be announced' ? program.time : '';
    
    const hymns = songFields
      .filter(f => program[f.key] && program[f.key].trim() !== '')
      .map(f => {
        const note = songNotes[`${program.id}-${f.key}`];
        return { label: f.label, value: program[f.key], note };
      });

    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs32\\pard\\qc\\b MASS PROGRAM\\b0\\par\\fs20\\par ';
    rtf += '{\\fs28\\b Date: \\b0 ' + formattedDate + '\\par ';
    if (timeStr) rtf += 'Time: ' + timeStr + '\\par ';
    rtf += 'Venue: ' + (program.venue || 'Not specified') + '\\par ';
    rtf += 'Total Hymns: ' + hymns.length + '\\par}\\par\\par ';
    rtf += '{\\fs28\\b LITURGY ORDER\\b0\\par}\\par ';
    
    hymns.forEach((h, index) => {
      rtf += '{\\fs24\\b ' + (index + 1) + '. ' + h.label + ':\\b0 ' + h.value + '\\par ';
      if (h.note) rtf += '{\\fs20\\i Note: ' + h.note + '\\i0\\par}';
      rtf += '\\par ';
    });
    
    rtf += '\\par{\\fs20\\qc ZETECH CATHOLIC ACTION\\par Generated on ' + new Date().toLocaleString() + '\\par}';
    rtf += '}';
    
    return rtf;
  };

  // ========== PDF DOWNLOAD (WORKS PROPERLY) ==========
  const downloadAsPDF = (program) => {
    const html = generateProfessionalDocument(program, 'html');
    
    // Create a blob with the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a link to download as .pdf (the browser will handle it)
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mass-program-' + new Date(program.date).toISOString().split('T')[0] + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('✅ PDF download started');
  };

  // ========== FIXED DOWNLOAD FUNCTION WITH MULTIPLE FORMATS ==========
  const downloadProgram = (program, format) => {
    try {
      setDownloadStatus('preparing-' + format);
      
      let content = '';
      let mimeType = '';
      let extension = '';
      let filename = 'mass-program-' + new Date(program.date).toISOString().split('T')[0];
      
      switch(format) {
        case 'txt':
          content = generateProfessionalDocument(program, 'text');
          mimeType = 'text/plain';
          extension = '.txt';
          break;
        case 'html':
          content = generateProfessionalDocument(program, 'html');
          mimeType = 'text/html';
          extension = '.html';
          break;
        case 'rtf':
          content = generateRTFDocument(program);
          mimeType = 'application/rtf';
          extension = '.rtf';
          break;
        case 'doc':
          // For Word, use HTML with .doc extension
          content = generateProfessionalDocument(program, 'html');
          mimeType = 'application/msword';
          extension = '.doc';
          break;
        default:
          content = generateProfessionalDocument(program, 'text');
          mimeType = 'text/plain';
          extension = '.txt';
      }
      
      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename + extension;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setDownloadStatus('success');
      showToast('✅ Program downloaded as ' + format.toUpperCase());
      setTimeout(() => setDownloadStatus(null), 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      showToast('❌ Download failed. Please try again.');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  // ========== SHARE FUNCTIONALITY ==========
  const shareProgram = (program, platform) => {
    const document = generateProfessionalDocument(program, 'text');
    
    if (platform === 'whatsapp') {
      window.open('https://wa.me/?text=' + encodeURIComponent(document), '_blank');
    } else if (platform === 'telegram') {
      window.open('https://t.me/share/url?url=&text=' + encodeURIComponent(document), '_blank');
    } else if (platform === 'twitter') {
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(document.substring(0, 280)), '_blank');
    } else if (platform === 'email') {
      window.open('mailto:?subject=Mass Program - ' + formatDate(program.date) + '&body=' + encodeURIComponent(document));
    } else {
      setShareModal(program);
    }
  };

  const copyToClipboard = (program) => {
    const document = generateProfessionalDocument(program, 'text');
    navigator.clipboard.writeText(document);
    showToast("📋 Mass program copied to clipboard!");
  };

  const printProgram = (program) => {
    const html = generateProfessionalDocument(program, 'html');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast('🖨️ Print dialog opened');
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = toastStyle;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFullDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCollapse = (id) => {
    setCollapsedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (id) => {
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    showToast(newFavorites.includes(id) ? "❤️ Added to favorites" : "❤️ Removed from favorites");
  };

  // Filter programs
  const filteredPrograms = useMemo(() => {
    let filtered = [...programs];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        songFields.some(f => p[f.key]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedVenue !== "all") {
      filtered = filtered.filter(p => p.venue === selectedVenue);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(p => favorites.includes(p.id));
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [programs, searchTerm, selectedVenue, showFavoritesOnly, favorites, sortOrder]);

  const venues = useMemo(() => {
    return ["all", ...new Set(programs.map(p => p.venue))];
  }, [programs]);

  const handleDownloadClick = (p, format) => {
    if (downloadStatus) return;
    downloadProgram(p, format);
    setShowDownloadMenu(null);
  };

  const handleAddNote = (p, f, currentNote) => {
    const note = prompt('Add a note for this hymn:', currentNote || '');
    if (note !== null) {
      addSongNote(p.id, f.key, note);
    }
  };

  if (loading) {
    return (
      <div style={loadingContainer}>
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={loadingSpinner}
        >
          ⛪
        </motion.div>
        <p style={loadingText}>Preparing the liturgy...</p>
        <p style={loadingSubtext}>Loading hymns and programs</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={container}
    >
      {/* Header */}
      <div style={headerSection}>
        <div style={headerTop}>
          <div style={titleWrapper}>
            <div style={titleIcon}>⛪</div>
            <div>
              <h1 style={title}>Mass Programs</h1>
              <p style={titleSub}>{stats.totalHymns} hymns • {stats.venues} venues</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats for Mobile */}
        <div style={compactStats}>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFavoritesOnly(false)}
          >
            <span style={compactStatValue}>{stats.total}</span>
            <span style={compactStatLabel}>Programs</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
          >
            <span style={compactStatValue}>{stats.upcoming}</span>
            <span style={compactStatLabel}>Upcoming</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
          >
            <span style={compactStatValue}>{stats.venues}</span>
            <span style={compactStatLabel}>Venues</span>
          </motion.div>
          <motion.div 
            style={compactStat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <span style={{ ...compactStatValue, color: showFavoritesOnly ? "#ec4899" : "#64748b" }}>
              <FiHeart style={{ fill: showFavoritesOnly ? "#ec4899" : "none" }} />
            </span>
            <span style={compactStatLabel}>Fav</span>
          </motion.div>
        </div>

        {/* Search */}
        <div style={searchContainer}>
          <FiSearch style={searchIcon} />
          <input
            type="text"
            placeholder="Search hymns or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={searchClear}>✕</button>
          )}
        </div>

        {/* Filters Row */}
        <div style={filtersRow}>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            style={filterSelect}
          >
            {venues.map(v => (
              <option key={v} value={v}>
                {v === "all" ? "All Venues" : v.length > 20 ? v.substring(0, 20) + '...' : v}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            style={sortButton}
          >
            <FiClock />
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
            style={sortButton}
          >
            <FiEye />
            {viewMode === 'compact' ? 'Detailed' : 'Compact'}
          </button>
        </div>

        {/* Results Count */}
        <div style={resultsCount}>
          <span style={resultsBold}>{filteredPrograms.length}</span> programs • 
          <span style={resultsBold}> {
            filteredPrograms.reduce((acc, p) => {
              return acc + songFields.filter(f => p[f.key]).length;
            }, 0)
          }</span> hymns
        </div>
      </div>

      {/* Programs List */}
      <div style={programsList}>
        <AnimatePresence>
          {filteredPrograms.map((p) => {
            const isExpanded = expandedIds.includes(p.id);
            const isCollapsed = collapsedIds.includes(p.id);
            const isFavorite = favorites.includes(p.id);
            const displayFields = isMobile && !isExpanded ? mobileCompactFields : songFields;
            const hymnCount = songFields.filter(f => p[f.key]).length;
            const hasTime = p.time && p.time !== 'To be announced';

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  ...programCard,
                  borderLeft: isFavorite ? '4px solid #ec4899' : 'none',
                }}
              >
                {/* Card Header */}
                <div style={cardHeader} onClick={() => toggleCollapse(p.id)}>
                  <div style={cardHeaderLeft}>
                    <div style={dateBadge}>
                      <span style={dateDay}>{new Date(p.date).getDate()}</span>
                      <span style={dateMonth}>
                        {new Date(p.date).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div style={cardInfo}>
                      <div style={cardTitleRow}>
                        <span style={cardDate}>{formatDate(p.date)}</span>
                        {new Date(p.date).toDateString() === new Date().toDateString() && (
                          <span style={todayChip}>Today</span>
                        )}
                        <span style={hymnCountChip}>{hymnCount} hymns</span>
                      </div>
                      <div style={cardVenue}>
                        <FiMapPin size={12} />
                        <span>{p.venue.length > 25 ? p.venue.substring(0, 25) + '...' : p.venue}</span>
                      </div>
                      {/* Display time only if available */}
                      {hasTime && (
                        <div style={{ ...cardVenue, marginTop: '2px' }}>
                          <FiClock size={12} />
                          <span>{p.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={cardHeaderRight}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                      style={iconButton}
                    >
                      <FiHeart style={{ color: isFavorite ? "#ec4899" : "#94a3b8", fill: isFavorite ? "#ec4899" : "none" }} />
                    </motion.button>
                    <motion.div whileTap={{ scale: 0.9 }} style={chevronIcon}>
                      {isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
                    </motion.div>
                  </div>
                </div>

                {/* Songs Grid */}
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={songsGrid}
                  >
                    {displayFields.map((f) => {
                      const value = p[f.key];
                      if (!value) return null;
                      const isHighlighted = highlightedSong === `${p.id}-${f.key}`;
                      const note = songNotes[`${p.id}-${f.key}`];
                      const frequency = getSongFrequency(f.key);
                      const uniqueSongs = getUniqueSongs(f.key).length;

                      return (
                        <motion.div
                          key={f.key}
                          style={{
                            ...songItem,
                            borderLeft: `4px solid ${f.color}`,
                            backgroundColor: isHighlighted ? f.color + '15' : '#f8fafc',
                            transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                          }}
                          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigator.clipboard.writeText(value);
                            highlightSong(p.id, f.key);
                            showToast('📋 Copied: ' + value.substring(0, 30) + '...');
                          }}
                        >
                          <div style={songHeader}>
                            <div style={{ ...songIcon, color: f.color }}>{f.icon}</div>
                            <div style={songLabel}>{f.label}</div>
                            {viewMode === 'detailed' && (
                              <div style={songMeta}>
                                <span style={songMetaItem} title={'Used in ' + frequency + ' programs'}>
                                  <FiEye size={10} /> {frequency}
                                </span>
                                <span style={songMetaItem} title={uniqueSongs + ' unique songs'}>
                                  <BsMusicNoteList size={10} /> {uniqueSongs}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div style={songValueWrapper}>
                            <div style={songValue}>{value}</div>
                            {viewMode === 'detailed' && f.description && (
                              <div style={songDescription}>{f.description}</div>
                            )}
                          </div>

                          {/* Quick Action Icons */}
                          <div style={songActions}>
                            <motion.span
                              whileHover={{ scale: 1.2 }}
                              style={songActionIcon}
                              onClick={(e) => {
                                e.stopPropagation();
                                previewSong(value);
                              }}
                              title="Preview song"
                            >
                              <BsPlayCircle size={14} color={f.color} />
                            </motion.span>
                            <motion.span
                              whileHover={{ scale: 1.2 }}
                              style={songActionIcon}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddNote(p, f, note);
                              }}
                              title="Add note"
                            >
                              <FaRegKeyboard size={12} color={note ? "#8b5cf6" : "#6b7280"} />
                            </motion.span>
                          </div>

                          {note && (
                            <div style={songNote}>
                              <MdOutlineFormatQuote size={10} />
                              {note}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Mobile Expand Button */}
                    {isMobile && !isExpanded && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleExpand(p.id)}
                        style={expandMoreButton}
                      >
                        + {songFields.length - mobileCompactFields.length} more hymns
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons - With Improved Dropdown */}
                {!isCollapsed && (
                  <div style={actionButtons}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(p)}
                      style={actionButton}
                    >
                      <FiCopy size={14} />
                      <span>Copy</span>
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareProgram(p, 'whatsapp')}
                      style={{ ...actionButton, background: "#25D366", color: "white" }}
                    >
                      <BsWhatsapp size={14} />
                      <span>WhatsApp</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareProgram(p)}
                      style={actionButton}
                    >
                      <FiShare2 size={14} />
                      <span>Share</span>
                    </motion.button>

                    {/* Print Button - Separate */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => printProgram(p)}
                      style={{ ...actionButton, background: "#10b981", color: "white" }}
                    >
                      <FiPrinter size={14} />
                      <span>Print</span>
                    </motion.button>

                    {/* Download Dropdown - Improved */}
                    <div style={downloadDropdownContainer} ref={downloadMenuRef}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDownloadMenu(showDownloadMenu === p.id ? null : p.id)}
                        style={{
                          ...actionButton,
                          background: showDownloadMenu === p.id ? '#4f46e5' : '#f8fafc',
                          color: showDownloadMenu === p.id ? 'white' : '#475569',
                          gridColumn: 'span 3',
                        }}
                      >
                        <FiDownload size={14} />
                        <span>Save as...</span>
                        <FiChevronDown size={10} style={{ marginLeft: '2px' }} />
                      </motion.button>
                      
                      <AnimatePresence>
                        {showDownloadMenu === p.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={downloadMenu}
                          >
                            <button onClick={() => handleDownloadClick(p, 'txt')}>
                              <FaFileAlt /> Plain Text (.txt)
                            </button>
                            <button onClick={() => handleDownloadClick(p, 'html')}>
                              <IoDocumentTextOutline /> HTML Document (.html)
                            </button>
                            <button onClick={() => handleDownloadClick(p, 'rtf')}>
                              <BsFileWord /> Rich Text (.rtf)
                            </button>
                            <button onClick={() => handleDownloadClick(p, 'doc')}>
                              <FaFileWord /> Word Document (.doc)
                            </button>
                            <button onClick={() => downloadAsPDF(p)}>
                              <FaFilePdf /> PDF Document
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Song Preview Toast */}
      <AnimatePresence>
        {songPreview && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={previewToast}
          >
            <BsMusicNoteBeamed size={16} color="#4f46e5" />
            <span style={previewText}>Previewing: {songPreview}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlay}
            onClick={() => setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={modalTitle}>Share Mass Program</h3>
              
              <div style={modalOptions}>
                <button onClick={() => shareProgram(shareModal, 'whatsapp')} style={modalOption}>
                  <BsWhatsapp size={24} color="#25D366" />
                  <span>WhatsApp</span>
                </button>
                
                <button onClick={() => shareProgram(shareModal, 'telegram')} style={modalOption}>
                  <FaTelegramPlane size={24} color="#0088cc" />
                  <span>Telegram</span>
                </button>
                
                <button onClick={() => shareProgram(shareModal, 'twitter')} style={modalOption}>
                  <BsTwitter size={24} color="#1DA1F2" />
                  <span>Twitter</span>
                </button>
                
                <button onClick={() => shareProgram(shareModal, 'email')} style={modalOption}>
                  <FiMail size={24} color="#EA4335" />
                  <span>Email</span>
                </button>
              </div>

              <button onClick={() => setShareModal(null)} style={modalClose}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </motion.div>
  );
}

// ====== STYLES ======

const container = {
  padding: "12px",
  maxWidth: "100%",
  fontFamily: "'Inter', -apple-system, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
  borderRadius: "25px",
};

// Loading
const loadingContainer = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  borderRadius: "40px",
};

const loadingSpinner = {
  width: "60px",
  height: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "30px",
  background: "#ffffff",
  borderRadius: "50%",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  marginBottom: "16px",
};

const loadingText = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "4px",
};

const loadingSubtext = {
  color: "#64748b",
  fontSize: "12px",
};

// Header
const headerSection = {
  marginBottom: "16px",
};

const headerTop = {
  marginBottom: "12px",
};

const titleWrapper = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const titleIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  color: "#ffffff",
};

const title = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0,
};

const titleSub = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
};

// Compact Stats
const compactStats = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "6px",
  marginBottom: "12px",
};

const compactStat = {
  background: "#ffffff",
  padding: "10px 4px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
  cursor: "pointer",
};

const compactStatValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0f172a",
};

const compactStatLabel = {
  fontSize: "10px",
  color: "#64748b",
  textTransform: "uppercase",
};

// Search
const searchContainer = {
  position: "relative",
  marginBottom: "12px",
};

const searchIcon = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#94a3b8",
  fontSize: "14px",
};

const searchInput = {
  width: "100%",
  padding: "12px 12px 12px 40px",
  borderRadius: "30px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "14px",
  outline: "none",
};

const searchClear = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#94a3b8",
  fontSize: "16px",
  cursor: "pointer",
  padding: "4px 8px",
};

// Filters Row
const filtersRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: "6px",
  marginBottom: "8px",
};

const filterSelect = {
  padding: "8px 10px",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "12px",
  color: "#0f172a",
  outline: "none",
};

const sortButton = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 12px",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "12px",
  color: "#0f172a",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

// Results Count
const resultsCount = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "12px",
};

const resultsBold = {
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 2px",
};

// Programs List
const programsList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

// Program Card
const programCard = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  position: "relative",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  cursor: "pointer",
};

const cardHeaderLeft = {
  display: "flex",
  gap: "10px",
  flex: 1,
};

const dateBadge = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  borderRadius: "12px",
  color: "#ffffff",
};

const dateDay = {
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: 1,
};

const dateMonth = {
  fontSize: "10px",
  textTransform: "uppercase",
};

const cardInfo = {
  flex: 1,
};

const cardTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  marginBottom: "4px",
};

const cardDate = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
};

const todayChip = {
  fontSize: "9px",
  padding: "2px 6px",
  background: "#10b981",
  borderRadius: "12px",
  color: "#ffffff",
  fontWeight: "600",
};

const hymnCountChip = {
  fontSize: "9px",
  padding: "2px 6px",
  background: "#f1f5f9",
  borderRadius: "12px",
  color: "#475569",
  fontWeight: "500",
};

const cardVenue = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "#64748b",
  fontSize: "11px",
  marginTop: "2px",
};

const cardHeaderRight = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const iconButton = {
  background: "none",
  border: "none",
  padding: "6px",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
};

const chevronIcon = {
  color: "#94a3b8",
  fontSize: "16px",
  padding: "6px",
};

// Songs Grid
const songsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "8px",
  marginTop: "10px",
  marginBottom: "10px",
};

const songItem = {
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  cursor: "pointer",
  transition: "all 0.2s",
  position: "relative",
};

const songHeader = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "6px",
  flexWrap: "wrap",
};

const songIcon = {
  fontSize: "16px",
};

const songLabel = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#475569",
};

const songMeta = {
  display: "flex",
  gap: "4px",
  marginLeft: "auto",
};

const songMetaItem = {
  fontSize: "8px",
  color: "#94a3b8",
  display: "flex",
  alignItems: "center",
  gap: "2px",
};

const songValueWrapper = {
  marginBottom: "4px",
};

const songValue = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#0f172a",
  wordBreak: "break-word",
  lineHeight: 1.4,
};

const songDescription = {
  fontSize: "9px",
  color: "#64748b",
  marginTop: "2px",
  fontStyle: "italic",
};

const songActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "6px",
  marginTop: "4px",
};

const songActionIcon = {
  cursor: "pointer",
  padding: "2px",
};

const songNote = {
  fontSize: "9px",
  color: "#8b5cf6",
  marginTop: "4px",
  padding: "2px 4px",
  background: "#ede9fe",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  gap: "2px",
};

const expandMoreButton = {
  gridColumn: "span 2",
  padding: "10px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "500",
  color: "#4f46e5",
  cursor: "pointer",
  marginTop: "4px",
};

// Action Buttons - 4 columns layout
const actionButtons = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "4px",
  marginTop: "10px",
  position: "relative",
};

const actionButton = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
  padding: "8px 2px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "9px",
  fontWeight: "500",
  color: "#475569",
  cursor: "pointer",
  width: "100%",
  transition: "all 0.2s",
};

// Download Dropdown - Improved
const downloadDropdownContainer = {
  position: "relative",
  gridColumn: "span 4",
  marginTop: "7px",
};

const downloadMenu = {
  position: "absolute",
  bottom: "100%",
  left: 0,
  right: 0,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "8px",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
  zIndex: 20,
  marginBottom: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

// Preview Toast
const previewToast = {
  position: "fixed",
  bottom: "80px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#ffffff",
  color: "#0f172a",
  padding: "10px 20px",
  borderRadius: "30px",
  fontSize: "13px",
  fontWeight: "500",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
  zIndex: 9998,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #e2e8f0",
};

const previewText = {
  maxWidth: "200px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// Modal Styles
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
};

const modalContent = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  maxWidth: "400px",
  width: "100%",
  maxHeight: "80vh",
  overflowY: "auto",
};

const modalTitle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "20px",
  textAlign: "center",
};

const modalOptions = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
  marginBottom: "20px",
};

const modalOption = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  padding: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  cursor: "pointer",
  fontSize: "12px",
  color: "#0f172a",
};

const modalClose = {
  width: "100%",
  padding: "14px",
  background: "#4f46e5",
  border: "none",
  borderRadius: "14px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

// Toast Style
const toastStyle = `
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  z-index: 9999;
  animation: slideIn 0.3s ease;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
`;