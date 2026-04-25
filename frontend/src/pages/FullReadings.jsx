import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Book, ChevronLeft, ChevronRight,
  Church, Share2, Download, Printer, Heart, BookOpen,
  Sun, Moon, Cloud, Star, Sparkles, Leaf, X, ChevronDown
} from 'lucide-react';
import { publicApi } from '../api';
import logo from '../assets/zuca-logo.png';
import html2canvas from 'html2canvas';

const FullReadings = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingData, setReadingData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Clean text function - removes HTML artifacts and podcast/email links
  const cleanText = (text) => {
    if (!text) return '';
    
    return text
      .replace(/[<>?\/"]/g, ' ')
      .replace(/matthew\/\d+\??\d*"?/gi, ' ')
      .replace(/LISTEN PODCAST.*?(?=\n|$)/gi, '')
      .replace(/VIEW REFLECTION VIDEO.*?(?=\n|$)/gi, '')
      .replace(/En Español.*?(?=\n|$)/gi, '')
      .replace(/View Calendar.*?(?=\n|$)/gi, '')
      .replace(/Get Daily Readings E-mails.*?(?=\n|$)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchFullReadings();
  }, [date]);

  const fetchFullReadings = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const [year, month, day] = date.split('-');
    console.log('Fetching readings for date:', `${year}-${month}-${day}`);
    
    const response = await publicApi.get(`/api/calendar/readings/${year}/${month}/${day}`);
    console.log('Received reading for date:', response.data.date);
    console.log('Celebration:', response.data.celebration);
    
    setReadingData(response.data);
  } catch (err) {
    console.error('Error fetching readings:', err);
    setError('Failed to load readings for this date');
  } finally {
    setLoading(false);
  }
};

  const goToPreviousDay = () => {
    const current = new Date(date);
    current.setDate(current.getDate() - 1);
    const newDate = current.toISOString().split('T')[0];
    navigate(`/readings/${newDate}`);
  };

  const goToNextDay = () => {
    const current = new Date(date);
    current.setDate(current.getDate() + 1);
    const newDate = current.toISOString().split('T')[0];
    navigate(`/readings/${newDate}`);
  };

  const goToCalendar = () => {
    const [year, month] = date.split('-');
    navigate(`/liturgical-calendar?year=${year}&month=${month}`);
  };

  const formatDate = (dateString) => {
  // Parse the date
  const date = new Date(dateString);
  
  // Use local methods for correct display
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${weekday}, ${month} ${day}, ${year}`;
};

  const getSeasonColor = (season) => {
    const colors = {
      advent: '#800080',
      christmas: '#FFFFFF',
      lent: '#800080',
      easter: '#FFFFFF',
      ordinary: '#008000'
    };
    return colors[season] || '#008000';
  };

  const getSeasonBg = (season) => {
    const backgrounds = {
      advent: 'rgba(128, 0, 128, 0.1)',
      christmas: 'rgba(255, 255, 255, 0.1)',
      lent: 'rgba(128, 0, 128, 0.1)',
      easter: 'rgba(255, 255, 255, 0.1)',
      ordinary: 'rgba(0, 128, 0, 0.1)'
    };
    return backgrounds[season] || 'rgba(0,0,0,0.1)';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${readingData.celebration} - Daily Readings`,
          text: `Readings for ${formatDate(date)}: ${readingData.readings?.firstReading?.citation} | ${readingData.readings?.gospel?.citation}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
  try {
    // Create a temporary container with the FULL readings content
    const contentElement = document.createElement('div');
    contentElement.style.padding = '40px';
    contentElement.style.background = 'white';
    contentElement.style.color = 'black';
    contentElement.style.maxWidth = '800px';
    contentElement.style.fontFamily = 'Arial, sans-serif';
    contentElement.style.borderRadius = '12px';
    contentElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    contentElement.style.maxHeight = '2000px';
    contentElement.style.overflowY = 'auto';
    
    // Build the content HTML with COMPLETE readings
    let contentHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #800080; margin: 0; font-size: 28px;">${readingData.celebration}</h1>
        <p style="color: #666; font-size: 18px; margin: 10px 0;">${formatDate(date)}</p>
        <p style="color: #00c6ff; font-size: 16px; margin: 5px 0;">Liturgical Year: ${readingData.yearCycle || 'Unknown'}</p>
      </div>
    `;
    
    // First Reading - FULL TEXT
    if (readingData.readings?.firstReading) {
      contentHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #800080; border-bottom: 3px solid #00c6ff; padding-bottom: 8px; font-size: 22px;">
            First Reading <span style="color: #00c6ff; font-size: 16px; margin-left: 10px;">${readingData.readings.firstReading.citation}</span>
          </h2>
          <div style="line-height: 1.8; color: #333; font-size: 16px; white-space: pre-line;">
            ${cleanText(readingData.readings.firstReading.text).replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
    // Psalm - FULL TEXT
    if (readingData.readings?.responsorialPsalm) {
      contentHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #800080; border-bottom: 3px solid #00c6ff; padding-bottom: 8px; font-size: 22px;">
            Psalm <span style="color: #00c6ff; font-size: 16px; margin-left: 10px;">${readingData.readings.responsorialPsalm.citation}</span>
          </h2>
          ${readingData.readings.responsorialPsalm.response ? 
            `<p style="color: #800080; font-style: italic; font-size: 17px; margin-bottom: 15px;"><strong>R. ${readingData.readings.responsorialPsalm.response}</strong></p>` : ''}
          <div style="line-height: 1.8; color: #333; font-size: 16px; white-space: pre-line;">
            ${cleanText(readingData.readings.responsorialPsalm.text).replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
    // Second Reading - FULL TEXT (if available)
    if (readingData.readings?.secondReading) {
      contentHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #800080; border-bottom: 3px solid #00c6ff; padding-bottom: 8px; font-size: 22px;">
            Second Reading <span style="color: #00c6ff; font-size: 16px; margin-left: 10px;">${readingData.readings.secondReading.citation}</span>
          </h2>
          <div style="line-height: 1.8; color: #333; font-size: 16px; white-space: pre-line;">
            ${cleanText(readingData.readings.secondReading.text).replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
    // Gospel - FULL TEXT
    if (readingData.readings?.gospel) {
      contentHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #b8860b; border-bottom: 3px solid #FFD700; padding-bottom: 8px; font-size: 22px;">
            Gospel <span style="color: #00c6ff; font-size: 16px; margin-left: 10px;">${readingData.readings.gospel.citation}</span>
          </h2>
          <div style="line-height: 1.8; color: #333; font-size: 16px; font-weight: 500; white-space: pre-line;">
            ${cleanText(readingData.readings.gospel.text).replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
    // Footer
    contentHTML += `
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
        <p>Readings Generated by • Zetech Catholic Action Portal</p>
      </div>
    `;
    
    contentElement.innerHTML = contentHTML;
    
    // Temporarily add to document to render
    contentElement.style.position = 'absolute';
    contentElement.style.left = '-9999px';
    contentElement.style.top = '-9999px';
    document.body.appendChild(contentElement);
    
    // Convert to canvas with higher quality and full height
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: false,
      useCORS: true,
      windowWidth: 800,
      windowHeight: contentElement.scrollHeight
    });
    
    // Remove temporary element
    document.body.removeChild(contentElement);
    
    // Convert to image and download
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `readings-${date}.png`;
    link.href = image;
    link.click();
    
  } catch (error) {
    console.error('Error generating image:', error);
    alert('Failed to generate image. Please try again.');
  }
};

  const handleDownload = (format = 'txt') => {
    const firstReadingText = cleanText(readingData.readings?.firstReading?.text || '');
    const psalmText = cleanText(readingData.readings?.responsorialPsalm?.text || '');
    const secondReadingText = cleanText(readingData.readings?.secondReading?.text || '');
    const gospelText = cleanText(readingData.readings?.gospel?.text || '');
    
    const title = `${readingData.celebration} - ${formatDate(date)}`;
    const yearInfo = `Liturgical Year: ${readingData.yearCycle || 'Unknown'}`;
    
    let content = '';
    let filename = `readings-${date}`;
    let mimeType = '';
    
    switch(format) {
      case 'txt':
        content = `${title}\n${yearInfo}\n\n` +
          `FIRST READING: ${readingData.readings?.firstReading?.citation || ''}\n${firstReadingText}\n\n` +
          `RESPONSORIAL PSALM: ${readingData.readings?.responsorialPsalm?.citation || ''}\n${psalmText}\n\n` +
          (readingData.readings?.secondReading ? 
            `SECOND READING: ${readingData.readings.secondReading.citation}\n${secondReadingText}\n\n` : '') +
          `GOSPEL: ${readingData.readings?.gospel?.citation || ''}\n${gospelText}`;
        mimeType = 'text/plain';
        filename += '.txt';
        break;
        
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f9f9f9; }
    h1 { color: #800080; }
    h2 { color: #00c6ff; border-bottom: 1px solid #ccc; }
    .citation { color: #800080; font-weight: bold; }
    .reading { margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .gospel { border-left: 4px solid #FFD700; }
    .gospel h2 { color: #b8860b; }
    .psalm-response { color: #800080; font-style: italic; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${readingData.celebration}</h1>
  <p>${formatDate(date)}</p>
  <p>${yearInfo}</p>
  
  <div class="reading">
    <h2>First Reading <span class="citation">${readingData.readings?.firstReading?.citation || ''}</span></h2>
    <p>${firstReadingText.replace(/\n/g, '<br>')}</p>
  </div>
  
  <div class="reading">
    <h2>Responsorial Psalm <span class="citation">${readingData.readings?.responsorialPsalm?.citation || ''}</span></h2>
    ${readingData.readings?.responsorialPsalm?.response ? 
      `<p class="psalm-response"><strong>R. ${readingData.readings.responsorialPsalm.response}</strong></p>` : ''}
    <p>${psalmText.replace(/\n/g, '<br>')}</p>
  </div>
  
  ${readingData.readings?.secondReading ? `
  <div class="reading">
    <h2>Second Reading <span class="citation">${readingData.readings.secondReading.citation}</span></h2>
    <p>${secondReadingText.replace(/\n/g, '<br>')}</p>
  </div>
  ` : ''}
  
  <div class="reading gospel">
    <h2>Gospel <span class="citation">${readingData.readings?.gospel?.citation || ''}</span></h2>
    <p>${gospelText.replace(/\n/g, '<br>')}</p>
  </div>
  
  <div class="footer">
    <p>Readings from • Zetech Catholic Action Portal</p>
  </div>
</body>
</html>`;
        mimeType = 'text/html';
        filename += '.html';
        break;
        
      case 'pdf':
        handlePrint();
        setShowDownloadOptions(false);
        return;
        
      case 'doc':
  content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #800080; font-size: 28px; text-align: center; }
    h2 { color: #800080; font-size: 22px; border-bottom: 1px solid #00c6ff; }
    .citation { color: #00c6ff; font-weight: normal; font-size: 16px; }
    .reading { margin-bottom: 30px; }
    .gospel h2 { color: #b8860b; border-bottom-color: #FFD700; }
    .psalm-response { color: #800080; font-style: italic; }
    p { line-height: 1.6; font-size: 16px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${readingData.celebration}</h1>
  <p style="text-align: center; font-size: 18px;">${formatDate(date)}</p>
  <p style="text-align: center; color: #00c6ff;">${yearInfo}</p>
  
  <div class="reading">
    <h2>First Reading <span class="citation">${readingData.readings?.firstReading?.citation || ''}</span></h2>
    <p>${firstReadingText.replace(/\n/g, '<br>')}</p>
  </div>
  
  <div class="reading">
    <h2>Responsorial Psalm <span class="citation">${readingData.readings?.responsorialPsalm?.citation || ''}</span></h2>
    ${readingData.readings?.responsorialPsalm?.response ? 
      `<p class="psalm-response"><strong>R. ${readingData.readings.responsorialPsalm.response}</strong></p>` : ''}
    <p>${psalmText.replace(/\n/g, '<br>')}</p>
  </div>
  
  ${readingData.readings?.secondReading ? `
  <div class="reading">
    <h2>Second Reading <span class="citation">${readingData.readings.secondReading.citation}</span></h2>
    <p>${secondReadingText.replace(/\n/g, '<br>')}</p>
  </div>
  ` : ''}
  
  <div class="reading gospel">
    <h2>Gospel <span class="citation">${readingData.readings?.gospel?.citation || ''}</span></h2>
    <p>${gospelText.replace(/\n/g, '<br>')}</p>
  </div>
  
  <div class="footer">
    <p>Readings Generated by • Zetech Catholic Action Portal</p>
  </div>
</body>
</html>`;
  mimeType = 'application/msword';
  filename += '.doc';
  break;
        
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadOptions(false);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingAnimation}>
            <div style={styles.loadingRing}></div>
            <div style={styles.loadingRingInner}></div>
            <Church style={styles.loadingIcon} />
          </div>
          <h2 style={styles.loadingTitle}>Loading Daily Readings</h2>
          <p style={styles.loadingSubtitle}>Fetching readings for {formatDate(date)}...</p>
        </div>
      </div>
    );
  }

  if (error || !readingData) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <Church size={48} style={{ color: '#ef4444', marginBottom: '20px' }} />
          <h2 style={styles.errorTitle}>Readings Not Found</h2>
          <p style={styles.errorMessage}>{error || 'No readings available for this date'}</p>
          <button onClick={goToCalendar} style={styles.errorButton}>
            <ArrowLeft size={16} />
            <span>Back to Calendar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.floatingBg}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logo} alt="ZUCA Logo" style={styles.logo} />
            <h1 style={styles.title}>Daily Readings</h1>
          </div>
          <div style={styles.headerRight}>
            <button onClick={handleShare} style={styles.iconButton} title="Share">
              <Share2 size={isMobile ? 18 : 20} />
            </button>
            <button onClick={handlePrint} style={styles.iconButton} title="Print">
              <Printer size={isMobile ? 18 : 20} />
            </button>
            
            <div style={{ position: 'relative' }}>
  <button 
    onClick={() => setShowDownloadOptions(!showDownloadOptions)} 
    style={styles.iconButton}
    title="Download"
  >
    <Download size={isMobile ? 18 : 20} />
  </button>
  
  {showDownloadOptions && (
    <div style={styles.downloadDropdown}>
      <button onClick={() => handleDownload('txt')}>
        📄 Text File (.txt)
      </button>
      <button onClick={() => handleDownload('html')}>
        🌐 HTML File (.html)
      </button>
      <button onClick={() => handleDownload('pdf')}>
        📑 Save as PDF
      </button>
      <button onClick={() => handleDownload('doc')}>
        📝 Word Document (.doc)
      </button>
      <button onClick={handleDownloadImage}>
        🖼️ Image (.png)
      </button>
    </div>
  )}
</div>
            
            <Link to="/liturgical-calendar" style={styles.homeLink}>
              <ArrowLeft size={16} />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        <div style={styles.navigation}>
          <button onClick={goToPreviousDay} style={styles.navButton}>
            <ChevronLeft size={isMobile ? 18 : 24} />
            <span style={isMobile ? styles.navTextMobile : styles.navText}>Previous</span>
          </button>
          
          <div style={styles.dateDisplay}>
            <Calendar size={isMobile ? 16 : 20} color="#FFD700" />
            <h2 style={styles.dateTitle}>{formatDate(date)}</h2>
          </div>
          
          <button onClick={goToNextDay} style={styles.navButton}>
            <span style={isMobile ? styles.navTextMobile : styles.navText}>Next</span>
            <ChevronRight size={isMobile ? 18 : 24} />
          </button>
        </div>

        <div style={{
          ...styles.celebrationHeader,
          background: getSeasonBg(readingData.season?.toLowerCase()),
          borderLeft: `6px solid ${getSeasonColor(readingData.season?.toLowerCase())}`
        }}>
          <div style={styles.celebrationHeaderLeft}>
            <h3 style={styles.celebrationName}>{readingData.celebration}</h3>
            <div style={styles.celebrationMeta}>
              <span style={styles.seasonBadge}>
                {readingData.season || readingData.seasonName}
              </span>
              {readingData.yearCycle && (
                <span style={styles.yearBadge}>
                  {readingData.yearCycle}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.readingsContainer}>
          {readingData.readings?.firstReading && (
            <div style={styles.readingCard}>
              <div style={styles.readingHeader}>
                <Book size={20} color="#FFD700" />
                <h4 style={styles.readingTitle}>First Reading</h4>
                <span style={styles.readingCitation}>
                  {readingData.readings.firstReading.citation}
                </span>
              </div>
              <div style={styles.readingContent}>
                <p style={styles.readingText}>
                  {cleanText(readingData.readings.firstReading.text) || 
                   "Reading text not available. Please refer to your Bible."}
                </p>
              </div>
            </div>
          )}

          {readingData.readings?.responsorialPsalm && (
            <div style={styles.readingCard}>
              <div style={styles.readingHeader}>
                <Star size={20} color="#FFD700" />
                <h4 style={styles.readingTitle}>Responsorial Psalm</h4>
                <span style={styles.readingCitation}>
                  {readingData.readings.responsorialPsalm.citation}
                </span>
              </div>
              <div style={styles.readingContent}>
                {readingData.readings.responsorialPsalm.response && (
                  <p style={styles.psalmResponse}>
                    <strong>R. </strong>{readingData.readings.responsorialPsalm.response}
                  </p>
                )}
                <p style={styles.readingText}>
                  {cleanText(readingData.readings.responsorialPsalm.text) || 
                   readingData.readings.responsorialPsalm.verses || 
                   "Psalm text not available. Please refer to your Bible."}
                </p>
              </div>
            </div>
          )}

          {readingData.readings?.secondReading && (
            <div style={styles.readingCard}>
              <div style={styles.readingHeader}>
                <BookOpen size={20} color="#FFD700" />
                <h4 style={styles.readingTitle}>Second Reading</h4>
                <span style={styles.readingCitation}>
                  {readingData.readings.secondReading.citation}
                </span>
              </div>
              <div style={styles.readingContent}>
                <p style={styles.readingText}>
                  {cleanText(readingData.readings.secondReading.text) || 
                   "Reading text not available. Please refer to your Bible."}
                </p>
              </div>
            </div>
          )}

          {readingData.readings?.gospel && (
            <div style={styles.readingCard}>
              <div style={styles.readingHeader}>
                <Sun size={20} color="#FFD700" />
                <h4 style={styles.readingTitle}>Gospel</h4>
                <span style={styles.readingCitation}>
                  {readingData.readings.gospel.citation}
                </span>
              </div>
              <div style={styles.readingContent}>
                <p style={styles.gospelText}>
                  {cleanText(readingData.readings.gospel.text) || 
                   "Gospel text not available. Please refer to your Bible."}
                </p>
              </div>
            </div>
          )}

          {!readingData.readings?.firstReading && !readingData.readings?.gospel && (
            <div style={styles.noReadingsCard}>
              <Church size={48} color="rgb(255, 255, 255)" />
              <h3 style={styles.noReadingsTitle}>No Readings Available</h3>
              <p style={styles.noReadingsText}>
                ZUCA does not provide full readings for this date.
                Please check the Lectionary or consult your Bible.
              </p>
              <button onClick={goToCalendar} style={styles.calendarButton}>
                Back to Calendar
              </button>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p>Readings Generated By ZUCA Portal • {readingData.yearCycle || 'Liturgical Year'}</p>
          <p style={styles.credit}>Zetech Catholic Action Portal</p>
        </div>
      </div>

      {showShareModal && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>
            <h3 style={styles.modalTitle}>Share Readings</h3>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>Copy the link below:</p>
              <div style={styles.shareUrlContainer}>
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  style={styles.shareUrlInput}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  style={styles.copyButton}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white; color: black; }
          button, .no-print { display: none !important; }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Dropdown option colors */
        select option {
          background-color: white !important;
          color: black !important;
        }
        
        select:focus option {
          background-color: white !important;
          color: black !important;
        }
        
        select option:hover {
          background-color: #f0f0f0 !important;
          color: black !important;
        }
        
        select option:checked {
          background-color: #00c6ff !important;
          color: black !important;
        }

        /* Print styles */
        @media print {
          body { background: white; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #080308cf 0%, #1a0033 50%, #0a0a1e 100%)',
    padding: '8px',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  floatingBg: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  blob1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    top: '-100px',
    right: '-100px',
    background: '#800080',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
    animation: 'float 20s infinite',
  },
  blob2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    bottom: '-100px',
    left: '-100px',
    background: '#008000',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
    animation: 'float 20s infinite',
    animationDelay: '-5s',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
  },
  logo: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    border: '2px solid #00c6ff',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    margin: 0,
    fontSize: '20px',
    background: 'linear-gradient(135deg, #fff, #00c6ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  iconButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  homeLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00c6ff',
    textDecoration: 'none',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '8px 12px',
    fontSize: '14px',
  },
  downloadDropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '8px',
    zIndex: 100,
    minWidth: '180px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '40px',
    padding: '8px 15px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '30px',
    padding: '8px 12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navTextMobile: {
    display: 'none',
  },
  navText: {},
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateTitle: {
    color: 'white',
    fontSize: '16px',
    margin: 0,
  },
  celebrationHeader: {
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  celebrationHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  celebrationName: {
    color: 'white',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
  },
  celebrationMeta: {
    display: 'flex',
    gap: '10px',
  },
  seasonBadge: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.9)',
  },
  yearBadge: {
    background: 'rgba(255, 215, 0, 0.2)',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    color: '#FFD700',
  },
  readingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '30px',
  },
  readingCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  readingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  readingTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  readingCitation: {
    color: '#00c6ff',
    fontSize: '14px',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  readingContent: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '15px',
    lineHeight: '1.6',
  },
  readingText: {
    margin: 0,
    whiteSpace: 'pre-line',
  },
  gospelText: {
    margin: 0,
    whiteSpace: 'pre-line',
    color: '#FFD700',
    fontWeight: '500',
  },
  psalmResponse: {
    color: '#FFD700',
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  noReadingsCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  noReadingsTitle: {
    color: 'white',
    fontSize: '20px',
    margin: '15px 0 10px',
  },
  noReadingsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    marginBottom: '20px',
  },
  calendarButton: {
    background: 'linear-gradient(135deg, #800080, #00c6ff)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '11px',
    marginTop: '30px',
  },
  credit: {
    marginTop: '5px',
    fontSize: '10px',
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1e 0%, #1a0033 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    textAlign: 'center',
  },
  loadingAnimation: {
    position: 'relative',
    width: '70px',
    height: '70px',
    margin: '0 auto 15px',
  },
  loadingRing: {
    position: 'absolute',
    inset: 0,
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
  },
  loadingRingInner: {
    position: 'absolute',
    inset: 0,
    border: '3px solid transparent',
    borderTopColor: '#800080',
    borderRightColor: '#008000',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#00c6ff',
    borderRadius: '50%',
    animation: 'spin 1.5s linear infinite',
  },
  loadingIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '28px',
    height: '28px',
    color: 'white',
  },
  loadingTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
  },
  errorTitle: {
    color: 'white',
    fontSize: '24px',
    marginBottom: '10px',
  },
  errorMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
    marginBottom: '20px',
  },
  errorButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #800080, #00c6ff)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '10px',
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '400px',
    width: '90%',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalClose: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  modalBody: {
    marginTop: '10px',
  },
  modalText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    marginBottom: '10px',
  },
  shareUrlContainer: {
    display: 'flex',
    gap: '8px',
  },
  shareUrlInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: '12px',
  },
  copyButton: {
    padding: '10px 15px',
    borderRadius: '6px',
    border: 'none',
    background: '#00c6ff',
    color: 'white',
    cursor: 'pointer',
  },
};

export default FullReadings;