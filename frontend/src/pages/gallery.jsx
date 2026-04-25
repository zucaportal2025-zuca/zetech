import React, { useState, useEffect, useRef } from 'react';
import { api, publicApi } from '../api';
import {
  Heart, Eye, MessageCircle, X, Filter, Image as ImageIcon,
  Video, FileText, User, Clock, Share2, Download, Music2,
  Camera, TrendingUp, Calendar, Award, Star, Zap, Users,
  ChevronLeft, ChevronRight, Search, Grid3x3, LayoutGrid,
  ChevronDown, Play, Pause, Volume2, Maximize2, Minus, Plus,
  ThumbsUp, ThumbsDown, Bookmark, Share, ExternalLink,
  Facebook, Twitter, Instagram, Copy, Check, AlertCircle,
  VolumeX, SkipBack, SkipForward, Repeat, Shuffle, Send,
  ArrowLeft
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';

export default function GalleryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [filters, setFilters] = useState({ category: 'all', sortBy: 'latest' });
  const [user, setUser] = useState(null);
  const [likedMedia, setLikedMedia] = useState({});
  const [savedMedia, setSavedMedia] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [trendingMedia, setTrendingMedia] = useState([]);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  const videoRef = useRef(null);
  const modalRef = useRef(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check auth and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/me')
        .then(res => setUser(res.data))
        .catch(() => {});
    }
    fetchMedia();
    fetchTrending();
  }, [filters]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: filters.category,
        sortBy: filters.sortBy,
        limit: 24
      });
      const res = await publicApi.get(`/api/media/public?${params}`);
      setMedia(res.data.media || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await publicApi.get('/api/media/trending?limit=6');
      setTrendingMedia(res.data || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchComments = async (mediaId, page = 1) => {
    setCommentsLoading(true);
    try {
      const res = await publicApi.get(`/api/media/${mediaId}/comments?page=${page}&limit=20`);
      if (page === 1) {
        setComments(res.data.comments);
      } else {
        setComments(prev => [...prev, ...res.data.comments]);
      }
      setCommentsPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.totalPages,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSelectMedia = async (media) => {
    setSelectedMedia(media);
    setComments([]);
    await fetchComments(media.id);
  };

  const loadMoreComments = async () => {
    if (commentsPagination.page < commentsPagination.totalPages) {
      await fetchComments(selectedMedia.id, commentsPagination.page + 1);
    }
  };

  const handleLike = async (mediaId) => {
    if (!user) {
      alert('Please login to like');
      return;
    }
    try {
      const res = await api.post(`/api/media/${mediaId}/like`);
      const data = res.data;
      setLikedMedia(prev => ({ ...prev, [mediaId]: data.liked }));
      setMedia(prev => prev.map(m => 
        m.id === mediaId 
          ? { ...m, _count: { ...m._count, likes: data.liked ? m._count.likes + 1 : m._count.likes - 1 } }
          : m
      ));
      
      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(prev => ({
          ...prev,
          _count: { ...prev._count, likes: data.liked ? prev._count.likes + 1 : prev._count.likes - 1 }
        }));
      }
      
      const likeBtn = document.getElementById(`like-${mediaId}`);
      if (likeBtn) {
        likeBtn.classList.add('animate-like');
        setTimeout(() => likeBtn.classList.remove('animate-like'), 300);
      }
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleSave = (mediaId) => {
    if (!user) {
      alert('Please login to save');
      return;
    }
    setSavedMedia(prev => ({ ...prev, [mediaId]: !prev[mediaId] }));
    
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.innerHTML = savedMedia[mediaId] ? 'Removed from saved' : 'Saved to collection';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleComment = async () => {
    if (!comment.trim() || !selectedMedia || commentLoading) return;
    
    setCommentLoading(true);
    try {
      const res = await api.post(`/api/media/${selectedMedia.id}/comments`, {
        content: comment
      });
      const newComment = res.data;
      
      setComments(prev => [newComment, ...prev]);
      setCommentsPagination(prev => ({ ...prev, total: prev.total + 1 }));
      
      setMedia(prev => prev.map(m => 
        m.id === selectedMedia.id 
          ? { ...m, _count: { ...m._count, comments: (m._count.comments || 0) + 1 } }
          : m
      ));
      
      setSelectedMedia(prev => ({
        ...prev,
        _count: { ...prev._count, comments: (prev._count.comments || 0) + 1 }
      }));
      
      setComment('');
    } catch (error) {
      console.error('Error commenting:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async (media) => {
    const shareUrl = `${window.location.origin}/gallery?media=${media.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: media.title,
          text: media.description || 'Check out this amazing media from ZUCA Gallery!',
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareModal(true);
    }
    
    if (user) {
      await api.post(`/api/media/${media.id}/share`, { platform: 'direct' });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (media) => {
    try {
      const link = document.createElement('a');
      link.href = media.url;
      link.download = media.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (user) {
        await api.post(`/api/media/${media.id}/download`);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const getMediaIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="media-icon" />;
      case 'audio': return <Music2 className="media-icon" />;
      case 'document': return <FileText className="media-icon" />;
      default: return <ImageIcon className="media-icon" />;
    }
  };

  const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
  const timeAgo = (date) => formatDistance(new Date(date), new Date(), { addSuffix: true });

  const categories = [
    { id: 'all', name: 'All', icon: Camera },
    { id: 'mass', name: 'Holy Mass', icon: Award },
    { id: 'fellowship', name: 'Fellowship', icon: Users },
    { id: 'outreach', name: 'Outreach', icon: Heart },
    { id: 'events', name: 'Events', icon: Star },
    { id: 'retreat', name: 'Retreats', icon: Zap }
  ];

  if (loading) {
    return (
      <div className="simple-loading">
        <div className="simple-spinner"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="floating-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      <div className="gallery-content">
        {/* Hero Section with Back Button */}
        <div className="hero-card glass-effect">
          <div className="hero-top">
            <div className="hero-left">
              <button className="back-button" onClick={goBack} aria-label="Go back">
                <ArrowLeft size={24} />
              </button>
              <div className="logo-wrapper"><Camera className="logo-icon" /></div>
              <div className="hero-info">
                <h1 className="hero-title">ZUCA Media Gallery</h1>
                <div className="hero-meta">
                  <span className="stat-badge"><ImageIcon size={14} /> {media.length} Memories</span>
                  <span className="live-badge">LIVE</span>
                  <span className="time-badge">{format(currentTime, 'HH:mm:ss')}</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
                <button className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`} onClick={() => setViewMode('compact')}><Grid3x3 size={16} /></button>
              </div>
            </div>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item"><Camera className="quick-stat-icon" /><span className="quick-stat-label">Total Media</span><span className="quick-stat-value">{media.length}</span></div>
            <div className="quick-stat-item"><Heart className="quick-stat-icon" /><span className="quick-stat-label">Total Likes</span><span className="quick-stat-value">{media.reduce((sum, m) => sum + (m._count?.likes || 0), 0).toLocaleString()}</span></div>
            <div className="quick-stat-item"><Eye className="quick-stat-icon" /><span className="quick-stat-label">Total Views</span><span className="quick-stat-value">{media.reduce((sum, m) => sum + (m._count?.views || 0), 0).toLocaleString()}</span></div>
            <div className="quick-stat-item"><MessageCircle className="quick-stat-icon" /><span className="quick-stat-label">Comments</span><span className="quick-stat-value">{media.reduce((sum, m) => sum + (m._count?.comments || 0), 0).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Trending Section */}
        {trendingMedia.length > 0 && (
          <div className="trending-section glass-effect">
            <div className="trending-header"><TrendingUp size={20} className="trending-icon" /><h2 className="trending-title">Trending Now</h2><span className="trending-badge">🔥 Hot</span></div>
            <div className="trending-scroll">
              {trendingMedia.map((item) => (
                <div key={item.id} className="trending-card" onClick={() => handleSelectMedia(item)}>
                  <div className="trending-media">
                    {item.type === 'image' ? <img src={item.url} alt={item.title} /> : 
                     item.type === 'video' && item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} /> :
                     <div className="trending-placeholder">{getMediaIcon(item.type)}</div>}
                    <div className="trending-overlay"><Play size={24} /></div>
                  </div>
                  <div className="trending-info"><h4>{item.title}</h4><div className="trending-stats"><span><Eye size={12} /> {item._count?.views || 0}</span><span><Heart size={12} /> {item._count?.likes || 0}</span></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="filters-bar glass-effect">
          <div className="categories-scroll">
            {categories.map(cat => { const Icon = cat.icon; return (
              <button key={cat.id} onClick={() => setFilters({ ...filters, category: cat.id })} className={`category-btn ${filters.category === cat.id ? 'active' : ''}`}>
                <Icon size={16} /><span>{cat.name}</span>
              </button>
            );})}
          </div>
          <div className="sort-selector">
            <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="sort-select">
              <option value="latest">Latest First</option><option value="popular">Most Liked</option><option value="mostViewed">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="empty-state glass-effect"><Camera size={64} className="empty-icon" /><h3>No media yet</h3><p>Be the first to share memories from our community</p>{user && (user.role === 'admin' || user.specialRole === 'secretary') && (<a href="/admin/media" className="upload-link"><Camera size={18} /> Upload Now</a>)}</div>
        ) : (
          <div className={`media-grid ${viewMode}`}>
            {media.map((item, index) => (
              <div key={item.id} className={`media-card glass-effect ${hoveredCard === item.id ? 'hovered' : ''}`} onClick={() => handleSelectMedia(item)} onMouseEnter={() => setHoveredCard(item.id)} onMouseLeave={() => setHoveredCard(null)} style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="card-media">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.title} className="card-image" loading="lazy" />
                  ) : item.type === 'video' ? (
                    <div className="video-preview">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="card-image" />
                      ) : (
                        <div className="video-placeholder">
                          <Video size={48} />
                          <span>Video</span>
                        </div>
                      )}
                      <div className="play-overlay"><Play size={32} /></div>
                    </div>
                  ) : (
                    <div className="card-file">{getMediaIcon(item.type)}<span>{item.type}</span></div>
                  )}
                  <div className="card-overlay"><button className="quick-view-btn"><Eye size={18} /> Quick View</button></div>
                  {item.isFeatured && (<div className="featured-badge"><Star size={12} /> Featured</div>)}
                  <button className={`save-badge ${savedMedia[item.id] ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleSave(item.id); }}><Bookmark size={12} /></button>
                </div>
                <div className="card-info">
                  <h3 className="card-title">{item.title}</h3>
                  <div className="card-stats">
                    <button id={`like-${item.id}`} className={`stat-btn ${likedMedia[item.id] ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}><Heart size={14} /><span>{item._count.likes}</span></button>
                    <div className="stat"><Eye size={14} /><span>{item._count.views}</span></div>
                    <div className="stat"><MessageCircle size={14} /><span>{item._count.comments}</span></div>
                  </div>
                  <div className="card-meta"><span className="meta-user"><User size={12} />{item.uploadedBy?.fullName?.split(' ')[0] || 'Anonymous'}</span><span className="meta-date"><Clock size={12} />{timeAgo(item.createdAt)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <div className="modal-glass" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={() => setSelectedMedia(null)}><X size={24} /></button>
              <div className="modal-title-bar">
                <h2>{selectedMedia.title}</h2>
                <div className="modal-actions">
                  <button onClick={() => handleSave(selectedMedia.id)} className="action-icon"><Bookmark size={20} className={savedMedia[selectedMedia.id] ? 'saved' : ''} /></button>
                  <button onClick={() => handleShare(selectedMedia)} className="action-icon"><Share2 size={20} /></button>
                  <button onClick={() => handleDownload(selectedMedia)} className="action-icon"><Download size={20} /></button>
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-media">
                {selectedMedia.type === 'image' ? (
                  <img src={selectedMedia.url} alt={selectedMedia.title} />
                ) : selectedMedia.type === 'video' ? (
                  <div className="video-player-wrapper">
                    <video 
                      ref={videoRef} 
                      src={selectedMedia.url} 
                      controls 
                      autoPlay 
                      playsInline 
                      onTimeUpdate={handleVideoTimeUpdate} 
                      onPlay={() => setVideoPlaying(true)} 
                      onPause={() => setVideoPlaying(false)} 
                      className="video-player" 
                    />
                  </div>
                ) : (
                  <div className="file-preview">
                    {getMediaIcon(selectedMedia.type)}
                    <p>{selectedMedia.title}</p>
                    <a href={selectedMedia.url} download className="download-btn-large">
                      <Download size={20} /> Download File
                    </a>
                  </div>
                )}
              </div>
              
              <div className="modal-info">
                {selectedMedia.description && <p className="modal-description">{selectedMedia.description}</p>}
                <div className="modal-stats">
                  <button className={`stat-large ${likedMedia[selectedMedia.id] ? 'liked' : ''}`} onClick={() => handleLike(selectedMedia.id)}><ThumbsUp size={20} /><span>{selectedMedia._count.likes} Likes</span></button>
                  <div className="stat-large"><Eye size={20} /><span>{selectedMedia._count.views} Views</span></div>
                  <div className="stat-large"><MessageCircle size={20} /><span>{selectedMedia._count.comments} Comments</span></div>
                </div>
                <div className="modal-meta"><span>📅 {formatDate(selectedMedia.createdAt)}</span><span>👤 {selectedMedia.uploadedBy?.fullName || 'Anonymous'}</span><span>📁 {selectedMedia.category}</span></div>
                
                <div className="comments-section">
                  <h3><MessageCircle size={18} /> Comments ({commentsPagination.total})</h3>
                  
                  {user ? (
                    <div className="comment-input">
                      <div className="comment-avatar">{user.profileImage ? <img src={user.profileImage} alt={user.fullName} /> : <div className="avatar-placeholder">{user.fullName?.charAt(0) || 'U'}</div>}</div>
                      <div className="comment-input-wrapper">
                        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." onKeyPress={(e) => e.key === 'Enter' && !commentLoading && handleComment()} disabled={commentLoading} />
                        <button onClick={handleComment} disabled={!comment.trim() || commentLoading}>{commentLoading ? <><div className="btn-spinner"></div>Posting...</> : <><Send size={16} /> Post</>}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="login-to-comment"><p>Please <a href="/login">login</a> to comment</p></div>
                  )}
                  
                  <div className="comments-list-container">
                    {commentsLoading && comments.length === 0 ? (
                      <div className="comments-loading"><div className="spinner"></div><p>Loading comments...</p></div>
                    ) : comments.length > 0 ? (
                      <>
                        {comments.map((c) => (
                          <div key={c.id} className="comment-item">
                            <div className="comment-avatar">{c.user?.profileImage ? <img src={c.user.profileImage} alt={c.user.fullName} /> : <div className="avatar-placeholder small">{c.user?.fullName?.charAt(0) || 'A'}</div>}</div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-author">{c.user?.fullName || 'Anonymous'}</span>
                                <span className="comment-date">{timeAgo(c.createdAt)}</span>
                              </div>
                              <p className="comment-text">{c.content}</p>
                            </div>
                          </div>
                        ))}
                        {commentsPagination.page < commentsPagination.totalPages && (<button onClick={loadMoreComments} className="load-more-comments">Load more comments ({commentsPagination.total - comments.length} remaining)</button>)}
                      </>
                    ) : (
                      <div className="no-comments"><MessageCircle size={40} strokeWidth={1} /><p>No comments yet</p><span>Be the first to share your thoughts</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal" onClick={() => setShowShareModal(false)}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-header"><h3>Share this media</h3><button onClick={() => setShowShareModal(false)}><X size={20} /></button></div>
            <div className="share-url"><input type="text" value={`${window.location.origin}/gallery?media=${selectedMedia?.id}`} readOnly /><button onClick={() => copyToClipboard(`${window.location.origin}/gallery?media=${selectedMedia?.id}`)}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Copied!' : 'Copy'}</button></div>
            <div className="share-platforms"><button className="facebook"><Facebook size={24} /> Facebook</button><button className="twitter"><Twitter size={24} /> Twitter</button><button className="instagram"><Instagram size={24} /> Instagram</button></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gallery-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #0a0a1e 100%);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .floating-bg {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.08;
          animation: float 20s infinite;
        }
        .blob-1 { width: 500px; height: 500px; top: -100px; right: -100px; background: #3b82f6; }
        .blob-2 { width: 400px; height: 400px; bottom: -100px; left: -100px; background: #8b5cf6; animation-delay: -5s; }
        .blob-3 { width: 600px; height: 600px; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #6366f1; animation-delay: -10s; }
        .blob-4 { width: 300px; height: 300px; top: 20%; right: 20%; background: #06b6d4; animation-delay: -15s; }
        @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .gallery-content {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        .hero-card {
          border-radius: 30px;
          padding: 25px 30px;
          margin-bottom: 25px;
        }
        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .hero-left { display: flex; align-items: center; gap: 15px; }
        .back-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .logo-wrapper { padding: 12px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 15px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
        .logo-icon { width: 30px; height: 30px; color: white; }
        .hero-title { font-size: 28px; font-weight: bold; color: white; margin-bottom: 5px; }
        .hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .stat-badge { display: flex; align-items: center; gap: 5px; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 12px; color: rgba(255,255,255,0.8); }
        .live-badge { padding: 2px 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; color: #10b981; font-size: 12px; }
        .time-badge { padding: 2px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: rgba(255,255,255,0.8); font-size: 12px; }
        .view-toggle { display: flex; gap: 8px; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 4px; }
        .view-btn { padding: 8px 12px; background: transparent; border: none; border-radius: 8px; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.3s; }
        .view-btn.active { background: rgba(255,255,255,0.2); color: white; }
        .quick-stats { display: flex; gap: 30px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap; }
        .quick-stat-item { display: flex; align-items: center; gap: 8px; }
        .quick-stat-icon { width: 18px; height: 18px; color: rgba(255,255,255,0.6); }
        .quick-stat-label { color: rgba(255,255,255,0.7); font-size: 13px; }
        .quick-stat-value { color: white; font-size: 14px; font-weight: bold; }
        .trending-section { border-radius: 20px; padding: 20px; margin-bottom: 25px; }
        .trending-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
        .trending-icon { color: #f59e0b; }
        .trending-title { color: white; font-size: 18px; font-weight: 600; }
        .trending-badge { padding: 2px 8px; background: rgba(245, 158, 11, 0.2); border-radius: 12px; color: #f59e0b; font-size: 12px; }
        .trending-scroll { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
        .trending-card { min-width: 180px; background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.3s; }
        .trending-card:hover { transform: translateY(-4px); }
        .trending-media { position: relative; aspect-ratio: 16/9; background: #1a1a2e; }
        .trending-media img { width: 100%; height: 100%; object-fit: cover; }
        .trending-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }
        .trending-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
        .trending-card:hover .trending-overlay { opacity: 1; }
        .trending-info { padding: 10px; }
        .trending-info h4 { color: white; font-size: 12px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .trending-stats { display: flex; gap: 10px; font-size: 10px; color: rgba(255,255,255,0.5); }
        .trending-stats span { display: flex; align-items: center; gap: 3px; }
        .filters-bar { border-radius: 20px; padding: 15px 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .categories-scroll { display: flex; gap: 10px; flex-wrap: wrap; }
        .category-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 25px; color: rgba(255,255,255,0.8); font-size: 13px; cursor: pointer; transition: all 0.3s; }
        .category-btn:hover { background: rgba(255,255,255,0.1); }
        .category-btn.active { background: linear-gradient(90deg, #3b82f6, #6366f1); border-color: transparent; color: white; }
        .sort-select { padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: white; font-size: 13px; cursor: pointer; outline: none; }
        .sort-select option { background: #1a0033; }
        .media-grid { display: grid; gap: 20px; }
        .media-grid.grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        .media-grid.compact { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        .media-card { border-radius: 30px; overflow: hidden; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease forwards; opacity: 0; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .media-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .card-media { position: relative; aspect-ratio: 1/1; background: linear-gradient(135deg, #1a1a2e, #1a50e2); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .card-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .media-card:hover .card-image { transform: scale(1.05); }
        .video-preview { position: relative; width: 100%; height: 100%; }
        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e, #0f47e0);
          color: rgba(255, 255, 255, 0.5);
        }
        .video-placeholder svg {
          margin-bottom: 8px;
        }
        .play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
        .card-file { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
        .media-icon { width: 48px; height: 48px; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
        .card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
        .media-card:hover .card-overlay { opacity: 1; }
        .quick-view-btn { padding: 8px 16px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.3); border-radius: 25px; color: white; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .featured-badge { position: absolute; top: 10px; left: 10px; padding: 4px 8px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; color: white; font-size: 10px; display: flex; align-items: center; gap: 4px; }
        .save-badge { position: absolute; top: 10px; right: 10px; padding: 6px; background: rgba(0,0,0,0.6); border-radius: 50%; border: none; color: white; cursor: pointer; transition: all 0.3s; }
        .save-badge.saved { color: #f59e0b; background: rgba(0,0,0,0.8); }
        .card-info { padding: 15px; }
        .card-title { font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-stats { display: flex; gap: 16px; margin-bottom: 10px; }
        .stat-btn, .stat { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,0.6); background: none; border: none; cursor: pointer; }
        .stat-btn.liked { color: #ef4444; }
        .card-meta { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.4); }
        .meta-user, .meta-date { display: flex; align-items: center; gap: 4px; }
        @keyframes likeAnimation { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .animate-like { animation: likeAnimation 0.3s ease; }
        .empty-state { text-align: center; padding: 80px 20px; border-radius: 30px; }
        .empty-icon { color: rgba(255,255,255,0.3); margin-bottom: 20px; }
        .empty-state h3 { color: white; font-size: 20px; margin-bottom: 10px; }
        .empty-state p { color: rgba(255,255,255,0.6); margin-bottom: 20px; }
        .upload-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 25px; color: white; text-decoration: none; font-size: 14px; font-weight: 500; }
        .media-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.9); }
        .modal-glass { max-width: 1200px; width: 100%; max-height: 90vh; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 30px; overflow: hidden; animation: modalIn 0.3s ease; display: flex; flex-direction: column; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-close { background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s; }
        .modal-close:hover { background: rgba(255,255,255,0.2); }
        .modal-title-bar { flex: 1; margin-left: 20px; display: flex; justify-content: space-between; align-items: center; }
        .modal-title-bar h2 { color: white; font-size: 18px; margin: 0; }
        .modal-actions { display: flex; gap: 15px; }
        .action-icon { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; transition: color 0.3s; }
        .action-icon:hover { color: white; }
        .modal-body { display: flex; flex-direction: row; flex: 1; min-height: 500px; overflow: hidden; }
        .modal-media { 
          flex: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 20px;
          aspect-ratio: 15/16;
          background: #000000;
          min-height: 500px;
        }
        .modal-media img { 
          max-width: 100%; 
          max-height: 70vh; 
          width: auto;
          height: auto;
          
          object-fit: contain; 
          border-radius: 12px;
        }
        .video-player-wrapper { 
          position: relative; 
          width: 100%;
          height: 100%;
          display: flex;
          
          align-items: center;
          justify-content: center;
        }
        .video-player { 
          max-width: 100%;
          max-height: 70vh;
          width: auto;
          height: auto;
          
          object-fit: contain;
          border-radius: 12px;
        }
        .video-player::-webkit-media-controls {
          overflow: visible !important;
          
        }
        .video-player::-webkit-media-controls-enclosure {
          border-radius: 8px;
          background: transparent;
          
          margin-bottom: 10px;
        }
        .modal-info { width: 380px; padding: 30px; overflow-y: auto; border-left: 1px solid rgba(255,255,255,0.1); }
        .modal-description { color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.5; }
        .modal-stats { display: flex; gap: 24px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px; }
        .stat-large { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); font-size: 14px; }
        .stat-large.liked { color: #ef4444; }
        .modal-meta { display: flex; gap: 16px; font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 25px; flex-wrap: wrap; }
        .comments-section h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; color: white; margin-bottom: 15px; }
        .comment-input { display: flex; gap: 12px; margin-bottom: 20px; }
        .comment-avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; }
        .avatar-placeholder.small { width: 32px; height: 32px; font-size: 12px; }
        .comment-input-wrapper { flex: 1; display: flex; gap: 10px; }
        .comment-input-wrapper input { flex: 1; padding: 10px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; color: white; outline: none; }
        .comment-input-wrapper button { padding: 9px 20px; background: linear-gradient(90deg, #3b82f6, #6366f1); border: none; border-radius: 25px; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.3s; }
        .comment-input-wrapper button:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        .login-to-comment { text-align: center; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 20px; }
        .login-to-comment p { color: rgba(255,255,255,0.6); }
        .login-to-comment a { color: #3b82f6; text-decoration: none; }
        .comments-list-container {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
          padding-right: 4px;
          margin-bottom: 16px;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .comment-content {
          flex: 1;
          min-width: 0;
        }
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 4px;
        }
        .comment-author {
          font-weight: 600;
          font-size: 12px;
          color: white;
        }
        .comment-date {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
        }
        .comment-text {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          line-height: 1.4;
          word-break: break-word;
        }
        .comments-loading { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.6); }
        .spinner { width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
        .load-more-comments { width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 25px; color: rgba(255,255,255,0.7); font-size: 12px; cursor: pointer; margin-top: 15px; transition: all 0.3s; }
        .load-more-comments:hover { background: rgba(255,255,255,0.1); color: white; }
        .no-comments { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.4); }
        .no-comments svg { margin-bottom: 12px; opacity: 0.5; }
        .no-comments p { font-size: 14px; margin-bottom: 4px; }
        .no-comments span { font-size: 12px; }
        .share-modal { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); }
        .share-modal-content { background: #1a1a2e; border-radius: 20px; padding: 25px; width: 400px; max-width: 90%; }
        .share-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .share-header h3 { color: white; margin: 0; }
        .share-url { display: flex; gap: 10px; margin-bottom: 20px; }
        .share-url input { flex: 1; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; }
        .share-url button { padding: 8px 16px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .share-platforms { display: flex; gap: 15px; }
        .share-platforms button { flex: 1; padding: 10px; border: none; border-radius: 10px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .facebook { background: #1877f2; }
        .twitter { background: #1da1f2; }
        .instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
        .save-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 12px 24px; border-radius: 30px; z-index: 1200; animation: fadeInOut 2s ease; }
        .simple-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f0f1a; color: #fff; gap: 16px; }
        .simple-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes fadeInOut { 0% { opacity: 0; transform: translateX(-50%) translateY(20px); } 15% { opacity: 1; transform: translateX(-50%) translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) translateY(20px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .modal-body { flex-direction: column; min-height: auto; }
          .modal-media { 
            max-height: 50vh; 
            min-height: 300px;
            padding: 16px;
          }
          .modal-media video {
            max-height: 45vh;
            width: 100%;
          }
          .video-player {
            max-height: 45vh;
          }
          .modal-info {
            width: 100%;
            max-height: 50vh;
            overflow-y: auto;
            padding: 16px;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          .modal-stats { gap: 16px; padding: 10px 0; }
          .comments-section h3 { margin-bottom: 10px; font-size: 14px; }
          .comment-input { margin-bottom: 12px; }
          .comment-input-wrapper input { padding: 8px 12px; font-size: 12px; }
          .comment-input-wrapper button { padding: 6px 12px; font-size: 12px; }
          .comments-list-container { max-height: 250px; }
          .comment-avatar { width: 28px; height: 28px; }
          .avatar-placeholder { width: 28px; height: 28px; font-size: 12px; }
          .comment-author { font-size: 11px; }
          .comment-text { font-size: 11px; }
          .comment-header { flex-direction: column; gap: 2px; }
          .hero-title { font-size: 24px; }
          .media-grid.grid, .media-grid.compact { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
          .back-button {
            width: 38px;
            height: 38px;
          }
          .back-button svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}