import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import {
  Upload, Trash2, Edit2, Eye, Image as ImageIcon,
  Video, Music, FileText, X, Check, Search,
  Filter, Calendar, User, Download, Heart, MessageCircle,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Camera, Star, Award, Users, Zap, Plus, Minus,
  Grid3x3, LayoutGrid, ChevronDown, Lock, Unlock,
  Play, Maximize2, Volume2, VolumeX, Pause
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';

export default function AdminMediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [category, setCategory] = useState('uncategorized');
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [description, setDescription] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [commentsList, setCommentsList] = useState([]);
  const [likesList, setLikesList] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [likesTotal, setLikesTotal] = useState(0);

  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMedia();
    fetchStats();
  }, [currentPage, filterCategory, search]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(search && { search })
      });
      const res = await api.get(`/api/admin/media?${params}`);
      setMedia(res.data.media || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/media/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCommentsAndLikes = async (mediaId) => {
    setLoadingDetails(true);
    try {
      const commentsRes = await api.get(`/api/media/${mediaId}/comments?limit=100`);
      setCommentsList(commentsRes.data.comments || []);
      setCommentsTotal(commentsRes.data.pagination?.total || commentsRes.data.comments?.length || 0);
      
      const likesRes = await api.get(`/api/media/${mediaId}/likes?limit=100`);
      setLikesList(likesRes.data.likes || []);
      setLikesTotal(likesRes.data.pagination?.total || likesRes.data.likes?.length || 0);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/api/media/comments/${commentId}`);
      setCommentsList(prev => prev.filter(c => c.id !== commentId));
      setCommentsTotal(prev => prev - 1);
      showToast('Comment deleted', 'success');
      fetchStats();
      fetchMedia();
    } catch (error) {
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleRemoveLike = async (likeId) => {
    try {
      await api.delete(`/api/media/likes/${likeId}`);
      setLikesList(prev => prev.filter(l => l.id !== likeId));
      setLikesTotal(prev => prev - 1);
      showToast('Like removed', 'success');
      fetchStats();
      fetchMedia();
    } catch (error) {
      showToast('Failed to remove like', 'error');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      size: formatFileSize(file.size),
      name: file.name,
      type: file.type.split('/')[0]
    }));
    setFilePreviews(previews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('category', category);
    formData.append('isPublic', isPublic.toString());
    formData.append('isFeatured', isFeatured.toString());
    if (description) formData.append('description', description);
    try {
      const res = await api.post('/api/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });
      setUploadProgress(100);
      if (res.data.success) {
        filePreviews.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
        setSelectedFiles([]);
        setFilePreviews([]);
        setDescription('');
        fetchMedia();
        fetchStats();
        showToast('Upload successful!', 'success');
      }
    } catch (error) {
      showToast('Upload failed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/media/${id}`);
      fetchMedia();
      fetchStats();
      setShowDeleteConfirm(null);
      showToast('Media deleted', 'success');
    } catch (error) {
      showToast('Delete failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForBulk.length === 0) return;
    try {
      await api.post('/api/admin/media/bulk-delete', { ids: selectedForBulk });
      setSelectedForBulk([]);
      setShowBulkDeleteConfirm(false);
      fetchMedia();
      fetchStats();
      showToast(`${selectedForBulk.length} items deleted`, 'success');
    } catch (error) {
      showToast('Bulk delete failed', 'error');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.put(`/api/admin/media/${id}`, data);
      setEditingItem(null);
      fetchMedia();
      showToast('Media updated', 'success');
    } catch (error) {
      showToast('Update failed', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedia();
    await fetchStats();
    setRefreshing(false);
    showToast('Refreshed', 'success');
  };

  const toggleBulkSelect = (id) => {
    setSelectedForBulk(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getMediaIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={28} />;
      case 'audio': return <Music size={28} />;
      case 'document': return <FileText size={28} />;
      default: return <ImageIcon size={28} />;
    }
  };

  const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const timeAgo = (date) => formatDistance(new Date(date), new Date(), { addSuffix: true });

  const categories = [
    { id: 'all', name: 'All', icon: Camera },
    { id: 'mass', name: 'Mass', icon: Award },
    { id: 'fellowship', name: 'Fellowship', icon: Users },
    { id: 'outreach', name: 'Outreach', icon: Heart },
    { id: 'events', name: 'Events', icon: Star },
    { id: 'retreat', name: 'Retreats', icon: Zap },
    { id: 'uncategorized', name: 'Other', icon: FileText }
  ];

  if (loading && media.length === 0) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading media...</p>
      </div>
    );
  }

  return (
    <div className="admin-media-page">
      <div className="container">
        {/* Header */}
        <div className="card header-card">
          <div className="header-row">
            <div className="header-left">
              <div className="logo"><Camera size={24} /></div>
              <div>
                <h1>Media Management</h1>
                <div className="header-meta">
                  <span className="badge admin">ADMIN</span>
                  <span className="badge time">{format(currentTime, 'HH:mm:ss')}</span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <button className="icon-btn" onClick={handleRefresh}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /></button>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3x3 size={16} /></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><LayoutGrid size={16} /></button>
              </div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat"><Camera size={14} /> {stats?.totalMedia || 0}</div>
            <div className="stat"><Eye size={14} /> {(stats?.totalViews || 0).toLocaleString()}</div>
            <div className="stat"><Heart size={14} /> {(stats?.totalLikes || 0).toLocaleString()}</div>
            <div className="stat"><MessageCircle size={14} /> {(stats?.totalComments || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card upload-card">
          <div className="upload-header"><Upload size={18} /><h2>Upload New Media</h2></div>
          <div className="upload-area">
            <input type="file" multiple onChange={handleFileSelect} id="file-input" accept="image/*,video/*,audio/*,application/pdf" />
            <label htmlFor="file-input" className="upload-label">
              <Plus size={32} />
              <span>Click to select files</span>
              <small>Images, videos, audio, PDFs (max 50MB)</small>
            </label>
            
            {filePreviews.length > 0 && (
              <div className="preview-section">
                <div className="preview-header"><span>{filePreviews.length} file(s) selected</span><button onClick={() => { setSelectedFiles([]); filePreviews.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); }); setFilePreviews([]); }} className="clear-btn"><X size={14} /> Clear</button></div>
                <div className="preview-grid">{filePreviews.map((file, idx) => (
                  <div key={idx} className="preview-item">{file.preview ? <img src={file.preview} /> : <div className="preview-placeholder">{getMediaIcon(file.type)}</div>}<div className="preview-name">{file.name.substring(0, 15)}</div><div className="preview-size">{file.size}</div></div>
                ))}</div>
                <div className="upload-options">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="uncategorized">Select Category</option>
                    <option value="mass">Holy Mass</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="outreach">Outreach</option>
                    <option value="events">Events</option>
                    <option value="retreat">Retreats</option>
                  </select>
                  <label><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> <Unlock size={12} /> Public</label>
                  <label><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> <Star size={12} /> Featured</label>
                  <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                  {uploading && (
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                      <span className="progress-text">{uploadProgress}%</span>
                    </div>
                  )}
                  <button className="upload-btn" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedForBulk.length > 0 && (
          <div className="bulk-bar">
            <span>{selectedForBulk.length} selected</span>
            <button onClick={() => setShowBulkDeleteConfirm(true)} className="delete-btn">Delete Selected</button>
            <button onClick={() => setSelectedForBulk([])}>Cancel</button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <div className="categories">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={filterCategory === cat.id ? 'active' : ''}>
                  <Icon size={12} />{cat.name}
                </button>
              );
            })}
          </div>
          <div className="search">
            <Search size={14} />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="empty-state"><Camera size={48} /><h3>No media found</h3><p>Upload your first media file</p></div>
        ) : viewMode === 'grid' ? (
          <div className="media-grid">
            {media.map((item) => (
              <div key={item.id} className="media-card" onClick={() => { setPreviewMedia(item); setActiveTab('info'); fetchCommentsAndLikes(item.id); }}>
                <div className="card-media">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.title} />
                  ) : item.type === 'video' ? (
                    <div className="video-container">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="video-thumb" />
                      ) : (
                        <div className="video-placeholder">
                          <Video size={32} />
                          <span>Video</span>
                        </div>
                      )}
                      <div className="play-icon"><Play size={32} /></div>
                    </div>
                  ) : (
                    <div className="file-icon">{getMediaIcon(item.type)}<span>{item.type}</span></div>
                  )}
                  {item.isFeatured && <span className="featured-badge">Featured</span>}
                  {!item.isPublic && <span className="private-badge">Private</span>}
                </div>
                <div className="card-info">
                  <div><input type="checkbox" checked={selectedForBulk.includes(item.id)} onChange={(e) => { e.stopPropagation(); toggleBulkSelect(item.id); }} /></div>
                  {editingItem === item.id ? (
                    <input type="text" defaultValue={item.title} onBlur={(e) => handleUpdate(item.id, { title: e.target.value })} autoFocus />
                  ) : (
                    <h4>{item.title}</h4>
                  )}
                  <div className="card-stats">
                    <span><Eye size={10} /> {item._count?.views || 0}</span>
                    <span><Heart size={10} /> {item._count?.likes || 0}</span>
                    <span><MessageCircle size={10} /> {item._count?.comments || 0}</span>
                  </div>
                  <div className="card-meta">
                    <span>{item.category}</span>
                    <span>{formatFileSize(item.size)}</span>
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setPreviewMedia(item); setActiveTab('info'); fetchCommentsAndLikes(item.id); }}><Eye size={14} /></button>
                    <button onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}><Edit2 size={14} /></button>
                    <button onClick={() => setShowDeleteConfirm(item.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-wrapper">
             <table>
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={(e) => e.target.checked ? setSelectedForBulk(media.map(m => m.id)) : setSelectedForBulk([])} /></th>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Stats</th>
                  <th>Size</th>
                  <th></th>
                 </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr key={item.id}>
                    <td><input type="checkbox" checked={selectedForBulk.includes(item.id)} onChange={() => toggleBulkSelect(item.id)} /></td>
                    <td className="preview" onClick={() => { setPreviewMedia(item); setActiveTab('info'); fetchCommentsAndLikes(item.id); }}>
                      {item.type === 'image' ? (
                        <img src={item.url} />
                      ) : item.type === 'video' ? (
                        item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} className="preview-thumb" />
                        ) : (
                          <div className="preview-icon">{getMediaIcon(item.type)}</div>
                        )
                      ) : (
                        <div className="preview-icon">{getMediaIcon(item.type)}</div>
                      )}
                    </td>
                    <td>{editingItem === item.id ? <input type="text" defaultValue={item.title} onBlur={(e) => handleUpdate(item.id, { title: e.target.value })} /> : <span>{item.title}</span>}</td>
                    <td>{editingItem === item.id ? (
                      <select defaultValue={item.category} onChange={(e) => handleUpdate(item.id, { category: e.target.value })}>
                        <option>Uncategorized</option><option>Mass</option><option>Fellowship</option><option>Outreach</option><option>Events</option><option>Retreats</option>
                      </select>
                    ) : (
                      <span className="cat-badge">{item.category}</span>
                    )}</td>
                    <td><div className="table-stats"><span><Eye size={10} /> {item._count?.views || 0}</span><span><Heart size={10} /> {item._count?.likes || 0}</span><span><MessageCircle size={10} /> {item._count?.comments || 0}</span></div></td>
                    <td>{formatFileSize(item.size)}</td>
                    <td><div className="table-actions"><button onClick={() => { setPreviewMedia(item); setActiveTab('info'); fetchCommentsAndLikes(item.id); }}><Eye size={14} /></button><button onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}><Edit2 size={14} /></button><button onClick={() => setShowDeleteConfirm(item.id)}><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
            <span>{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div className="modal-overlay" onClick={() => setPreviewMedia(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewMedia(null)}><X size={20} /></button>
            
            <div className="modal-media-container">
              {previewMedia.type === 'image' ? (
                <img src={previewMedia.url} alt={previewMedia.title} className="modal-media-content" />
              ) : previewMedia.type === 'video' ? (
                <video 
                  ref={videoRef}
                  src={previewMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="modal-media-content"
                />
              ) : (
                <div className="modal-file-preview">
                  {getMediaIcon(previewMedia.type)}
                  <p>{previewMedia.title}</p>
                  <a href={previewMedia.url} download className="download-btn">Download</a>
                </div>
              )}
            </div>
            
            <div className="modal-info-container">
              <h3 className="modal-title">{previewMedia.title}</h3>
              
              <div className="modal-stats-row">
                <span><Eye size={14} /> {previewMedia._count?.views || 0}</span>
                <span><Heart size={14} /> {previewMedia._count?.likes || 0}</span>
                <span><MessageCircle size={14} /> {previewMedia._count?.comments || 0}</span>
                <span><Download size={14} /> {previewMedia._count?.downloads || 0}</span>
              </div>
              
              <div className="modal-tabs-row">
                <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Info</button>
                <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Comments ({commentsTotal})</button>
                <button className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>Likes ({likesTotal})</button>
              </div>
              
              <div className="modal-tab-content">
                {activeTab === 'info' && (
                  <div>
                    {previewMedia.description && <p className="description">{previewMedia.description}</p>}
                    <div className="info-grid">
                      <div><div className="info-label">Category</div><div className="info-value">{previewMedia.category}</div></div>
                      <div><div className="info-label">Uploaded</div><div className="info-value">{formatDate(previewMedia.createdAt)}</div></div>
                      <div><div className="info-label">By</div><div className="info-value">{previewMedia.uploadedBy?.fullName || 'Anonymous'}</div></div>
                      <div><div className="info-label">Size</div><div className="info-value">{formatFileSize(previewMedia.size)}</div></div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'comments' && (
                  <div className="scrollable-list">
                    {loadingDetails ? (
                      <div className="loading-state">Loading...</div>
                    ) : commentsList.length === 0 ? (
                      <div className="empty-state-small">No comments yet</div>
                    ) : (
                      commentsList.map(comment => (
                        <div key={comment.id} className="list-item">
                          <div className="item-avatar">
                            {comment.user?.profileImage ? (
                              <img src={comment.user.profileImage} alt="" />
                            ) : (
                              <div className="avatar-fallback">{comment.user?.fullName?.charAt(0) || 'A'}</div>
                            )}
                          </div>
                          <div className="item-content">
                            <div className="item-header"><strong>{comment.user?.fullName || 'Anonymous'}</strong><span>{timeAgo(comment.createdAt)}</span></div>
                            <p>{comment.content}</p>
                          </div>
                          <button className="item-delete" onClick={() => handleDeleteComment(comment.id)}><Trash2 size={12} /></button>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {activeTab === 'likes' && (
                  <div className="scrollable-list">
                    {loadingDetails ? (
                      <div className="loading-state">Loading...</div>
                    ) : likesList.length === 0 ? (
                      <div className="empty-state-small">No likes yet</div>
                    ) : (
                      likesList.map(like => (
                        <div key={like.id} className="list-item">
                          <div className="item-avatar">
                            {like.user?.profileImage ? <img src={like.user.profileImage} alt="" /> : <div className="avatar-fallback">{like.user?.fullName?.charAt(0) || 'U'}</div>}
                          </div>
                          <div className="item-content">
                            <strong>{like.user?.fullName || 'Anonymous'}</strong>
                            <div className="item-time">{timeAgo(like.createdAt)}</div>
                          </div>
                          <button className="item-delete" onClick={() => handleRemoveLike(like.id)}><Trash2 size={12} /></button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={40} />
            <h3>Delete Media</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {showBulkDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={40} />
            <h3>Delete {selectedForBulk.length} Items</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</button>
              <button onClick={handleBulkDelete}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-media-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1e 0%, #1a0033 100%);
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          padding: 10px;
          border-radius: 12px;
        }
        
        .header-left h1 {
          color: white;
          font-size: 20px;
          margin: 0;
        }
        
        .header-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        
        .badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .badge.admin {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .badge.time {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .icon-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 8px;
          border-radius: 10px;
          color: white;
          cursor: pointer;
        }
        
        .view-toggle {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 3px;
        }
        
        .view-btn {
          background: transparent;
          border: none;
          padding: 6px 10px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }
        
        .view-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .stats-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 20px;
        }
        
        .upload-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: white;
        }
        
        .upload-header h2 {
          font-size: 16px;
          margin: 0;
        }
        
        .upload-area {
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        
        #file-input {
          display: none;
        }
        
        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #3b82f6;
        }
        
        .upload-label small {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }
        
        .preview-section {
          margin-top: 20px;
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          color: white;
          margin-bottom: 12px;
          font-size: 13px;
        }
        
        .clear-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
        
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .preview-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          text-align: center;
        }
        
        .preview-item img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }
        
        .preview-placeholder {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .preview-name {
          font-size: 9px;
          color: white;
          padding: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .preview-size {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.5);
          padding-bottom: 4px;
        }
        
        .upload-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .upload-options select,
        .upload-options input {
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
        }
        
        .upload-options label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
        }
        
        .progress-bar-container {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          transition: width 0.3s;
          border-radius: 4px;
        }
        
        .progress-text {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .upload-btn {
          padding: 12px;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border: none;
          border-radius: 25px;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }
        
        .bulk-bar {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          color: white;
          flex-wrap: wrap;
        }
        
        .bulk-bar button {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 6px 12px;
          border-radius: 20px;
          color: #ef4444;
          cursor: pointer;
        }
        
        .bulk-bar button:last-child {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: none;
        }
        
        .filters-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .categories {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .categories button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          cursor: pointer;
        }
        
        .categories button.active {
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-color: transparent;
          color: white;
        }
        
        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 8px 12px;
        }
        
        .search input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
        }
        
        .media-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        @media (min-width: 600px) {
          .media-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (min-width: 900px) {
          .media-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        @media (min-width: 1200px) {
          .media-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        
        .media-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .media-card:hover {
          transform: translateY(-2px);
        }
        
        .card-media {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
        }
        
        .card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .video-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: rgba(255, 255, 255, 0.5);
        }
        
        .video-placeholder svg {
          margin-bottom: 8px;
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          padding: 8px;
          color: white;
        }
        
        .file-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .featured-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          font-size: 8px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .private-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 8px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .card-info {
          padding: 10px;
        }
        
        .card-info h4 {
          color: white;
          font-size: 12px;
          margin: 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .card-stats {
          display: flex;
          gap: 8px;
          margin: 6px 0;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .card-stats span {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: rgba(255, 255, 255, 0.4);
          margin: 6px 0;
        }
        
        .card-actions {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
        }
        
        .card-actions button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 4px 8px;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }
        
        .table-wrapper {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 0 12px;
          margin-bottom: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }
        
        th,
        td {
          padding: 10px 8px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        th {
          color: rgba(255, 255, 255, 0.5);
          font-weight: normal;
        }
        
        .preview {
          width: 45px;
          cursor: pointer;
        }
        
        .preview img {
          width: 35px;
          height: 35px;
          object-fit: cover;
          border-radius: 6px;
        }
        
        .preview-thumb {
          width: 35px;
          height: 35px;
          object-fit: cover;
          border-radius: 6px;
        }
        
        .preview-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }
        
        .table-stats {
          display: flex;
          gap: 8px;
        }
        
        .cat-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
        }
        
        .table-actions {
          display: flex;
          gap: 6px;
        }
        
        .table-actions button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }
        
        .pagination button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        
        .modal {
          background: #1a1a2e;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        
        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: white;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-media-container {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          max-height: 40vh;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .modal-media-content {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 40vh;
        }
        
        .modal-file-preview {
          text-align: center;
          padding: 40px 20px;
        }
        
        .modal-file-preview svg {
          width: 64px;
          height: 64px;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .modal-file-preview p {
          color: white;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .download-btn {
          display: inline-block;
          padding: 8px 20px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-size: 13px;
        }
        
        .modal-info-container {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
          max-height: 50vh;
        }
        
        .modal-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }
        
        .modal-stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 12px;
        }
        
        .modal-stats-row span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .modal-tabs-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 4px;
        }
        
        .tab-btn {
          flex: 1;
          padding: 8px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }
        
        .modal-tab-content {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }
        
        .description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 12px;
          color: white;
          word-break: break-word;
        }
        
        .scrollable-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .list-item {
          display: flex;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }
        
        .item-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }
        
        .item-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .avatar-fallback {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        
        .item-content {
          flex: 1;
          min-width: 0;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 4px;
        }
        
        .item-header strong,
        .item-content strong {
          color: white;
          font-size: 12px;
        }
        
        .item-header span,
        .item-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .item-content p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          line-height: 1.4;
          margin: 0;
        }
        
        .item-delete {
          position: absolute;
          right: 0;
          top: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: none;
          border-radius: 6px;
          padding: 4px;
          color: #ef4444;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .list-item:hover .item-delete {
          opacity: 1;
        }
        
        .loading-state,
        .empty-state-small {
          text-align: center;
          padding: 30px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }
        
        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .confirm-box {
          background: #1a1a2e;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          max-width: 280px;
          width: 90%;
        }
        
        .confirm-box svg {
          color: #ef4444;
          margin-bottom: 16px;
        }
        
        .confirm-box h3 {
          color: white;
          margin-bottom: 8px;
          font-size: 18px;
        }
        
        .confirm-box p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-bottom: 20px;
        }
        
        .confirm-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .confirm-buttons button {
          padding: 8px 20px;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .confirm-buttons button:first-child {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .confirm-buttons button:last-child {
          background: #ef4444;
          color: white;
        }
        
        .toast-message {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 16px;
          border-radius: 25px;
          color: white;
          z-index: 1200;
          animation: fadeOut 3s ease;
          font-size: 12px;
        }
        
        .toast-message.success {
          background: #10b981;
        }
        
        .toast-message.error {
          background: #ef4444;
        }
        
        .loading-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a1e 0%, #1a0033 100%);
          color: white;
          gap: 16px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
        
        @media (max-width: 480px) {
          .modal {
            max-width: 100%;
            max-height: 95vh;
          }
          
          .modal-media-container {
            min-height: 200px;
            max-height: 100%;
          }
          
          .modal-media-content {
            max-height: 70vh;
          }
          
          .modal-info-container {
            max-height: 55vh;
          }
          
          .modal-tab-content {
            max-height: 240px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}