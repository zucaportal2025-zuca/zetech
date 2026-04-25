import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, ArrowLeft, Eye, Heart, MessageCircle, Calendar } from 'lucide-react';
import { api } from '../api';
import logo from '../assets/zuca-logo.png';

const LyricsPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [error, setError] = useState(null);

  // Fetch songs with lyrics when page loads - PUBLIC ACCESS
  useEffect(() => {
    fetchSongsWithLyrics();
  }, []);

  const fetchSongsWithLyrics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Public endpoint - no auth required
      const response = await api.get('/api/public/songs/with-lyrics');
      console.log('Public songs with lyrics:', response.data);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load lyrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter songs based on search
  const filteredSongs = songs.filter(song => 
    song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSongClick = (song) => {
    setSelectedSong(song);
    // Update URL without page reload (for sharing)
    window.history.pushState({}, '', `/lyrics/${song.id}`);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedSong(null);
    window.history.pushState({}, '', '/lyrics');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Loading State
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingAnimation}>
            <div style={styles.loadingRing}></div>
            <div style={styles.loadingRingInner}></div>
            <Music style={styles.loadingIcon} />
          </div>
          <h2 style={styles.loadingTitle}>Loading Lyrics</h2>
          <p style={styles.loadingSubtitle}>Fetching songs with lyrics...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={fetchSongsWithLyrics} style={styles.errorButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If a song is selected, show its lyrics
  if (selectedSong) {
    return (
      <div style={styles.container}>
        {/* Floating Background */}
        <div style={styles.floatingBg}>
          <div style={styles.blob1}></div>
          <div style={styles.blob2}></div>
          <div style={styles.blob3}></div>
        </div>

        <div style={styles.content}>
          {/* Header with back button */}
          <div style={styles.lyricsHeader}>
            <button onClick={handleBack} style={styles.backButton}>
              <ArrowLeft size={20} />
              <span>Back to all songs</span>
            </button>
          </div>

          {/* Lyrics Card */}
          <div style={styles.lyricsCard}>
            <div style={styles.songInfo}>
              <h1 style={styles.songTitle}>{selectedSong.title}</h1>
              <p style={styles.songArtist}>{selectedSong.artist}</p>
              
              <div style={styles.songMeta}>
                {selectedSong.category && (
                  <span style={styles.metaItem}>
                    <span style={styles.metaLabel}>Category:</span> {selectedSong.category}
                  </span>
                )}
                {selectedSong.year && (
                  <span style={styles.metaItem}>
                    <span style={styles.metaLabel}>Year:</span> {selectedSong.year}
                  </span>
                )}
                {selectedSong.writer && (
                  <span style={styles.metaItem}>
                    <span style={styles.metaLabel}>Written by:</span> {selectedSong.writer}
                  </span>
                )}
              </div>

              {selectedSong.copyright && (
                <p style={styles.copyright}>© {selectedSong.copyright}</p>
              )}
            </div>

            {/* Lyrics Text */}
            <div style={styles.lyricsContainer}>
              <pre style={styles.lyricsText}>
                {selectedSong.lyrics || 'No lyrics available for this song.'}
              </pre>
            </div>

            {/* Last Updated */}
            {selectedSong.updatedAt && (
              <p style={styles.lastUpdated}>
                Last updated: {formatDate(selectedSong.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main list view - PUBLIC
  return (
    <div style={styles.container}>
      {/* Floating Background */}
      <div style={styles.floatingBg}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
        <div style={styles.blob3}></div>
      </div>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logo} alt="ZUCA Logo" style={styles.logo} />
            <h1 style={styles.title}>ZUCA Song Lyrics</h1>
          </div>
          <Link to="/" style={styles.homeLink}>
            ← Back to Home
          </Link>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by song title, artist, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Count */}
        <p style={styles.resultsCount}>
          {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} with lyrics
        </p>

        {/* Songs Grid */}
        {filteredSongs.length === 0 ? (
          <div style={styles.emptyState}>
            <Music size={48} style={styles.emptyIcon} />
            <h3 style={styles.emptyTitle}>No lyrics found</h3>
            <p style={styles.emptyText}>
              {searchQuery 
                ? `No songs match "${searchQuery}"`
                : 'No songs have lyrics added yet'}
            </p>
          </div>
        ) : (
          <div style={styles.songsGrid}>
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                style={styles.songCard}
                onClick={() => handleSongClick(song)}
              >
                {song.thumbnail && (
                  <div style={styles.cardThumbnail}>
                    <img src={song.thumbnail} alt={song.title} style={styles.thumbnail} />
                  </div>
                )}
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{song.title}</h3>
                  <p style={styles.cardArtist}>{song.artist}</p>
                  
                  <div style={styles.cardMeta}>
                    {song.category && (
                      <span style={styles.cardCategory}>{song.category}</span>
                    )}
                    {song.year && (
                      <span style={styles.cardYear}>{song.year}</span>
                    )}
                  </div>

                  {/* Preview of lyrics */}
                  {song.lyrics && (
                    <p style={styles.lyricsPreview}>
                      {song.lyrics.substring(0, 100)}...
                    </p>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={styles.viewLyrics}>Read Full Lyrics →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Zetech Catholic Action Portal</p>
          <p style={styles.credit}>Built by CHRISTECH WEBSYS</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #0a0a1e 100%)',
    padding: '20px',
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
    background: '#ff0000',
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
    background: '#007bff',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
    animation: 'float 20s infinite',
    animationDelay: '-5s',
  },

  blob3: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#8b5cf6',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
    animation: 'float 20s infinite',
    animationDelay: '-10s',
  },

  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },

  logo: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '2px solid #00c6ff',
  },

  title: {
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(135deg, #fff, #00c6ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  homeLink: {
    color: '#00c6ff',
    textDecoration: 'none',
    fontSize: '16px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  searchContainer: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50px',
    padding: '5px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },

  searchIcon: {
    width: '20px',
    height: '20px',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '15px 0',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },

  clearButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultsCount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    marginBottom: '20px',
  },

  songsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },

  songCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },

  cardThumbnail: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  cardContent: {
    padding: '20px',
  },

  cardTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 5px 0',
  },

  cardArtist: {
    color: '#00c6ff',
    fontSize: '16px',
    margin: '0 0 10px 0',
  },

  cardMeta: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },

  cardCategory: {
    padding: '4px 10px',
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '20px',
    color: '#8B5CF6',
    fontSize: '12px',
  },

  cardYear: {
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
  },

  lyricsPreview: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '15px',
    fontStyle: 'italic',
  },

  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  viewLyrics: {
    color: '#00c6ff',
    fontSize: '14px',
    fontWeight: '500',
  },

  // Lyrics View Styles
  lyricsHeader: {
    marginBottom: '30px',
  },

  backButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    padding: '10px 20px',
    color: 'white',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.3s ease',
  },

  lyricsCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
  },

  songInfo: {
    textAlign: 'center',
    marginBottom: '40px',
  },

  songTitle: {
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },

  songArtist: {
    color: '#00c6ff',
    fontSize: '20px',
    margin: '0 0 20px 0',
  },

  songMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '15px',
  },

  metaItem: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },

  metaLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
  },

  copyright: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '13px',
    fontStyle: 'italic',
  },

  lyricsContainer: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '20px',
  },

  lyricsText: {
    color: 'white',
    fontSize: '18px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },

  lastUpdated: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '12px',
    textAlign: 'right',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '20px',
  },

  emptyIcon: {
    color: 'rgba(255, 255, 255, 0.2)',
    marginBottom: '20px',
  },

  emptyTitle: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '10px',
  },

  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '16px',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '13px',
    marginTop: '60px',
  },

  credit: {
    marginTop: '5px',
    color: 'rgba(255, 255, 255, 0.2)',
  },

  // Loading Styles
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
    width: '100px',
    height: '100px',
    margin: '0 auto 30px',
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
    borderTopColor: '#ff0000',
    borderRightColor: '#007bff',
    borderBottomColor: '#8b5cf6',
    borderLeftColor: '#ec4899',
    borderRadius: '50%',
    animation: 'spin 1.5s linear infinite',
  },

  loadingIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '40px',
    color: 'white',
  },

  loadingTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },

  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },

  // Error Styles
  errorContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1e 0%, #1a0033 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },

  errorCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
  },

  errorIcon: {
    width: '60px',
    height: '60px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '2px solid #ef4444',
    borderRadius: '50%',
    color: '#ef4444',
    fontSize: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },

  errorTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },

  errorMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '20px',
  },

  errorButton: {
    padding: '10px 30px',
    background: 'linear-gradient(90deg, #007bff, #00c6ff)',
    border: 'none',
    borderRadius: '25px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default LyricsPage;