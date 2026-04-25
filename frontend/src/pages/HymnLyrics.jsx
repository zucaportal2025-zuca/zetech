// frontend/src/pages/HymnLyrics.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  FiHeart, 
  FiShare2, 
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
  FiDownload
} from "react-icons/fi";
import { 
  BsWhatsapp,
  BsTelegram,
  BsTwitter,
  BsMusicNoteBeamed,
  BsFileImage,
  BsFilePdf,
  BsFileWord,
  BsFileText
} from "react-icons/bs";
import { GiPrayerBeads } from "react-icons/gi";
import html2canvas from 'html2canvas';
import BASE_URL from "../api";

export default function HymnLyrics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const saved = localStorage.getItem("songFavorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    fetchSong();
  }, [id]);

  const fetchSong = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/songs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSong(res.data);
    } catch (err) {
      setError("Failed to load song");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("songFavorites", JSON.stringify(newFavorites));
    showToast(newFavorites.includes(id) ? "❤️ Added to favorites" : "❤️ Removed from favorites");
  };

  const copyToClipboard = () => {
    if (!song) return;
    const text = `${song.title}\n${song.reference ? `(${song.reference})\n` : ''}\n${song.lyrics || ''}`;
    navigator.clipboard.writeText(text);
    showToast("📋 Lyrics copied!");
  };

  const shareSong = (platform) => {
    if (!song) return;
    const text = `Check out this hymn: ${song.title} ${song.reference ? `(${song.reference})` : ''}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = toastStyle;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ========== DOWNLOAD FUNCTIONS ==========
  const downloadAsImage = async () => {
    try {
      showToast("📸 Preparing image...");
      
      // Create a temporary container with just the lyrics
      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.background = '#ffffff';
      element.style.fontFamily = "'Inter', sans-serif";
      element.style.maxWidth = '600px';
      element.style.margin = '0 auto';
      element.style.borderRadius = '16px';
      element.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      
      // Format lyrics
      const verses = song.lyrics ? song.lyrics.split('\n\n') : [];
      const lyricsHtml = verses.map(verse => 
        `<div style="margin-bottom: 24px;">${verse.split('\n').map(line => 
          `<p style="margin: 4px 0; text-align: center; font-size: ${fontSize}px;">${line || ' '}</p>`
        ).join('')}</div>`
      ).join('');
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; font-size: 28px; margin-bottom: 8px;">${song.title}</h1>
          ${song.reference ? `<p style="color: #64748b; font-size: 14px;">${song.reference}</p>` : ''}
        </div>
        <div style="line-height: 1.8; color: #1e293b;">
          ${lyricsHtml}
        </div>
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          ZUCA Hymn Book • Generated on ${new Date().toLocaleDateString()}
        </div>
      `;
      
      document.body.appendChild(element);
      
      // Convert to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      // Remove temporary element
      document.body.removeChild(element);
      
      // Download as image
      const link = document.createElement('a');
      link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      showToast("✅ Image downloaded!");
    } catch (error) {
      console.error('Image download failed:', error);
      showToast("❌ Failed to download image");
    }
  };

  const downloadAsPDF = async () => {
    try {
      showToast("📄 Preparing PDF...");
      
      const { jsPDF } = await import('jspdf');
      
      // Create PDF
      const pdf = new jsPDF({
        unit: 'pt',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      let y = margin + 20;
      
      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(79, 70, 229);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(song.title, contentWidth);
      titleLines.forEach(line => {
        pdf.text(line, pageWidth / 2, y, { align: 'center' });
        y += 30;
      });
      
      // Reference
      if (song.reference) {
        pdf.setFontSize(14);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(song.reference, pageWidth / 2, y, { align: 'center' });
        y += 40;
      } else {
        y += 20;
      }
      
      // Lyrics
      pdf.setFontSize(fontSize);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      
      if (song.lyrics) {
        const verses = song.lyrics.split('\n\n');
        
        verses.forEach(verse => {
          const lines = verse.split('\n');
          lines.forEach(line => {
            if (line.trim() === '') {
              y += 10;
            } else {
              if (y > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin + 20;
              }
              pdf.text(line, pageWidth / 2, y, { align: 'center' });
              y += fontSize + 6;
            }
          });
          y += 10;
        });
      }
      
      // Footer
      y = pdf.internal.pageSize.getHeight() - margin;
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text('ZUCA Hymn Book', margin, y);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 150, y);
      
      // Save PDF
      pdf.save(`${song.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      showToast("✅ PDF downloaded!");
    } catch (error) {
      console.error('PDF download failed:', error);
      showToast("❌ Failed to download PDF");
    }
  };

  const downloadAsWord = () => {
    try {
      showToast("📝 Preparing Word document...");
      
      // Format lyrics with proper HTML
      const verses = song.lyrics ? song.lyrics.split('\n\n') : [];
      const lyricsHtml = verses.map(verse => 
        `<div style="margin-bottom: 24px;">${verse.split('\n').map(line => 
          `<p style="margin: 4px 0; text-align: center; font-size: ${fontSize}px;">${line || '<br/>'}</p>`
        ).join('')}</div>`
      ).join('');
      
      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${song.title}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              max-width: 600px; 
              margin: 40px auto; 
              padding: 20px;
              background: white;
              color: #1e293b;
            }
            h1 { 
              color: #4f46e5; 
              text-align: center; 
              font-size: 28px;
              margin-bottom: 8px;
            }
            .reference { 
              color: #64748b; 
              text-align: center;
              font-size: 14px;
              margin-bottom: 30px;
            }
            .verse {
              margin-bottom: 24px;
            }
            .verse p {
              margin: 4px 0;
              text-align: center;
              font-size: ${fontSize}px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #94a3b8;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>${song.title}</h1>
          ${song.reference ? `<div class="reference">${song.reference}</div>` : ''}
          ${verses.map(verse => 
            `<div class="verse">${verse.split('\n').map(line => 
              `<p>${line || '<br/>'}</p>`
            ).join('')}</div>`
          ).join('')}
          <div class="footer">
            ZUCA Hymn Book • Generated on ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;
      
      // Create blob and download as .doc
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast("✅ Word document downloaded!");
    } catch (error) {
      console.error('Word download failed:', error);
      showToast("❌ Failed to download Word document");
    }
  };

  const downloadAsText = () => {
    try {
      showToast("📄 Preparing text file...");
      
      // Format as plain text
      const textContent = `${song.title}\n${song.reference ? `(${song.reference})\n` : ''}\n${'='.repeat(50)}\n\n${song.lyrics || ''}\n\n${'='.repeat(50)}\nZUCA Hymn Book • Generated on ${new Date().toLocaleDateString()}`;
      
      // Create blob and download
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast("✅ Text file downloaded!");
    } catch (error) {
      console.error('Text download failed:', error);
      showToast("❌ Failed to download text file");
    }
  };

  // Format lyrics with proper spacing
  const formatLyrics = (lyrics) => {
    if (!lyrics) return [];
    return lyrics.split('\n\n').filter(verse => verse.trim() !== '');
  };

  if (loading) {
    return (
      <div style={loadingContainer}>
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={loadingSpinner}
        >
          🎵
        </motion.div>
        <p style={loadingText}>Loading lyrics...</p>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div style={errorContainer}>
        <div style={errorIcon}>😔</div>
        <h3 style={errorTitle}>Song not found</h3>
        <p style={errorText}>{error || "The hymn you're looking for doesn't exist"}</p>
        <button onClick={() => navigate('/hymns')} style={errorButton}>
          Back to Hymns
        </button>
      </div>
    );
  }

  const verses = formatLyrics(song.lyrics);
  const isFavorite = favorites.includes(id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={container}
    >
      {/* Header with back button and actions */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={backButton}>
          <FiChevronLeft size={24} />
        </button>
        <div style={headerActions}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            style={headerAction}
          >
            <FiHeart style={{ 
              color: isFavorite ? "#ec4899" : "#64748b",
              fill: isFavorite ? "#ec4899" : "none"
            }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyToClipboard}
            style={headerAction}
          >
            <FiCopy />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShareMenu(!showShareMenu)}
            style={headerAction}
          >
            <FiShare2 />
          </motion.button>
        </div>
      </div>

      {/* Share Menu Popup */}
      {showShareMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={shareMenu}
        >
          <button onClick={() => shareSong('whatsapp')} style={shareMenuItem}>
            <BsWhatsapp color="#25D366" /> WhatsApp
          </button>
          <button onClick={() => shareSong('telegram')} style={shareMenuItem}>
            <BsTelegram color="#0088cc" /> Telegram
          </button>
          <button onClick={() => shareSong('twitter')} style={shareMenuItem}>
            <BsTwitter color="#1DA1F2" /> Twitter
          </button>
        </motion.div>
      )}

      {/* Song Title Section */}
      <div style={titleSection}>
        <div style={titleIconWrapper}>
          <GiPrayerBeads style={titleIcon} />
        </div>
        <h1 style={title}>{song.title}</h1>
        {song.reference && (
          <div style={reference}>{song.reference}</div>
        )}
      </div>

      {/* Lyrics Display */}
      <div style={lyricsContainer}>
        {verses.length > 0 ? (
          verses.map((verse, index) => (
            <div key={index} style={verseBlock}>
              {verse.split('\n').map((line, lineIndex) => (
                <p key={lineIndex} style={{ ...verseLine, fontSize: `${fontSize}px` }}>
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p style={{ ...verseLine, fontSize: `${fontSize}px`, textAlign: 'center' }}>
            {song.lyrics || 'No lyrics available'}
          </p>
        )}
      </div>

      {/* Font Size Controls */}
      <div style={fontControls}>
        <button 
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          style={fontButton}
        >
          A-
        </button>
        <span style={fontSizeDisplay}>{fontSize}px</span>
        <button 
          onClick={() => setFontSize(Math.min(24, fontSize + 2))}
          style={fontButton}
        >
          A+
        </button>
      </div>

      {/* Download Options */}
      <div style={downloadSection}>
        <h4 style={downloadTitle}>
          <FiDownload style={{ marginRight: '8px' }} />
          Download Lyrics
        </h4>
        <div style={downloadButtons}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={downloadAsImage}
            style={downloadButton}
            title="Download as PNG image"
          >
            <BsFileImage /> Image
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={downloadAsPDF}
            style={downloadButton}
            title="Download as PDF"
          >
            <BsFilePdf /> PDF
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={downloadAsWord}
            style={downloadButton}
            title="Download as Word document"
          >
            <BsFileWord /> Word
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={downloadAsText}
            style={downloadButton}
            title="Download as text file"
          >
            <BsFileText /> Text
          </motion.button>
        </div>
      </div>

      {/* Navigation between songs */}
      <div style={navButtons}>
        <button style={navButton} onClick={() => navigate(-1)}>
          <FiChevronLeft /> Previous
        </button>
        <Link to="/hymns" style={navButton}>
          <BsMusicNoteBeamed /> All Hymns
        </Link>
        <button style={navButton} onClick={() => navigate(1)} disabled>
          Next <FiChevronRight />
        </button>
      </div>

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </motion.div>
  );
}

// ====== STYLES ======

const container = {
  padding: "16px",
  maxWidth: "800px",
  margin: "0 auto",
  fontFamily: "'Inter', -apple-system, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
  borderRadius: "25px",
  position: "relative",
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

// Error
const errorContainer = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  textAlign: "center",
};

const errorIcon = {
  fontSize: "48px",
  marginBottom: "16px",
  opacity: 0.5,
};

const errorTitle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "8px",
};

const errorText = {
  fontSize: "14px",
  color: "#64748b",
  marginBottom: "20px",
};

const errorButton = {
  padding: "12px 24px",
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "30px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
};

// Header
const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  padding: "10px 0",
  zIndex: 10,
};

const backButton = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "50%",
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#0f172a",
};

const headerActions = {
  display: "flex",
  gap: "8px",
};

const headerAction = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "50%",
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#64748b",
};

// Share Menu
const shareMenu = {
  position: "absolute",
  top: "80px",
  right: "16px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "8px",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  minWidth: "160px",
};

const shareMenuItem = {
  padding: "10px 12px",
  background: "none",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
  textAlign: "left",
  transition: "background 0.2s",
  ':hover': {
    background: '#f1f5f9'
  }
};

// Title Section
const titleSection = {
  textAlign: "center",
  marginBottom: "30px",
};

const titleIconWrapper = {
  width: "64px",
  height: "64px",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
};

const titleIcon = {
  fontSize: "32px",
  color: "#ffffff",
};

const title = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 8px 0",
  lineHeight: 1.3,
};

const reference = {
  fontSize: "14px",
  color: "#64748b",
  background: "#f1f5f9",
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "20px",
};

// Lyrics
const lyricsContainer = {
  marginBottom: "30px",
};

const verseBlock = {
  marginBottom: "24px",
};

const verseLine = {
  margin: "0",
  padding: "2px 0",
  color: "#1e293b",
  lineHeight: 1.6,
  textAlign: "center",
};

// Font Controls
const fontControls = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "30px",
};

const fontButton = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
};

const fontSizeDisplay = {
  fontSize: "14px",
  color: "#64748b",
  minWidth: "60px",
  textAlign: "center",
};

// Download Section
const downloadSection = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "30px",
  border: "1px solid #e2e8f0",
};

const downloadTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 16px 0",
  display: "flex",
  alignItems: "center",
};

const downloadButtons = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
};

const downloadButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#0f172a",
  cursor: "pointer",
  transition: "all 0.2s",
};

// Navigation
const navButtons = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "8px",
  marginTop: "20px",
};

const navButton = {
  padding: "12px 8px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#0f172a",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  textDecoration: "none",
};

// Toast
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