import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useDialog } from '../../context/DialogContext';

export default function PostsManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [currentPostId, setCurrentPostId] = useState(null);
  const [title, setTitle] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [postUrl, setPostUrl] = useState('');
  const [caption, setCaption] = useState('');
  
  // Platform selection states
  const [platformInstagram, setPlatformInstagram] = useState(true);
  const [platformX, setPlatformX] = useState(false);
  const [platformFacebook, setPlatformFacebook] = useState(false);
  const [platformDiscord, setPlatformDiscord] = useState(false);

  // Custom Discord channel override state
  const [discordChannelId, setDiscordChannelId] = useState('');

  // Auth gate
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'));
      const snapshot = await getDocs(q);
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const instaPosts = allPosts
        .filter(post => post.type === 'instagram')
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setPosts(instaPosts);
    } catch (err) {
      console.error("Error fetching posts", err);
      alert("Failed to load posts from database.");
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();

    const selectedPlatforms = [];
    if (platformInstagram) selectedPlatforms.push('instagram');
    if (platformX) selectedPlatforms.push('x');
    if (platformFacebook) selectedPlatforms.push('facebook');
    if (platformDiscord) selectedPlatforms.push('discord');

    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform to publish to.");
      return;
    }

    const captionLength = caption.trim().length;
    const cleanedImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');

    // Platform validation checks
    if (platformInstagram) {
      if (cleanedImageUrls.length === 0) {
        alert("❌ Instagram requires at least one image. Please provide an Image URL or uncheck Instagram.");
        return;
      }
      if (captionLength > 2200) {
        alert(`❌ Instagram character limit exceeded (maximum 2,200 characters). Current length: ${captionLength}`);
        return;
      }
    }

    if (platformX) {
      if (captionLength > 280) {
        alert(`❌ X (Twitter) character limit exceeded (maximum 280 characters). Current length: ${captionLength}`);
        return;
      }
    }

    if (platformDiscord) {
      if (captionLength > 4000) {
        alert(`❌ Discord embed description limit exceeded (maximum 4,000 characters). Current length: ${captionLength}`);
        return;
      }
    }

    for (const url of cleanedImageUrls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert(`❌ Image URL "${url}" must start with http:// or https://`);
        return;
      }
    }

    try {
      const payload = {
        type: 'instagram', // Keep type='instagram' for backward compatibility in backend queries
        title: title.trim() || null,
        imageUrls: cleanedImageUrls,
        imageUrl: cleanedImageUrls[0] || null, // legacy fallback for backward compatibility
        postUrl: postUrl.trim() || 'https://www.instagram.com/ucalgary.debate/',
        caption: caption.trim(),
        platforms: selectedPlatforms,
        discord_channel_id: discordChannelId.trim() || null
      };

      if (currentPostId) {
        // Update: reset status flags if checking newly added platforms
        const originalPost = posts.find(p => p.id === currentPostId);
        if (originalPost) {
          payload.likes = originalPost.likes || 0;
          payload.date = originalPost.date || new Date().toISOString().split('T')[0];

          const wasInsta = originalPost.platforms?.includes('instagram');
          const wasDiscord = originalPost.platforms?.includes('discord');
          const wasFacebook = originalPost.platforms?.includes('facebook');
          const wasX = originalPost.platforms?.includes('x');

          if (platformInstagram && !wasInsta) payload.instagram_posted = false;
          if (platformFacebook && !wasFacebook) payload.facebook_posted = false;
          if (platformX && !wasX) payload.x_posted = false;

          if (platformDiscord) {
            if (!wasDiscord) {
              payload.discord_posted = false;
            } else if (originalPost.discord_posted) {
              payload.discord_needs_edit = true;
            }
          }
        }

        await updateDoc(doc(db, 'posts', currentPostId), payload);
        alert("Post updated successfully!");
      } else {
        // Create: set defaults automatically
        payload.likes = 0;
        payload.date = new Date().toISOString().split('T')[0];
        payload.discord_posted = false;
        payload.facebook_posted = false;
        payload.x_posted = false;

        await addDoc(collection(db, 'posts'), payload);
        alert("Post added successfully!");
      }

      resetForm();
      fetchPosts();
    } catch (err) {
      console.error("Error saving post", err);
      alert("Failed to save post. Please try again.");
    }
  };

  const handleEditPost = (post) => {
    setCurrentPostId(post.id);
    setTitle(post.title || '');
    const postImageUrls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : ['']);
    setImageUrls(postImageUrls.length > 0 ? postImageUrls : ['']);
    setPostUrl(post.postUrl || '');
    setCaption(post.caption || '');
    
    // Set platform checkboxes
    const postPlatforms = post.platforms || ['instagram'];
    setPlatformInstagram(postPlatforms.includes('instagram'));
    setPlatformX(postPlatforms.includes('x'));
    setPlatformFacebook(postPlatforms.includes('facebook'));
    setPlatformDiscord(postPlatforms.includes('discord'));
    setDiscordChannelId(post.discord_channel_id || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (id) => {
    if (!await confirm("Are you sure you want to delete this post?")) return;

    try {
      await deleteDoc(doc(db, 'posts', id));
      alert("Post deleted successfully!");
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post", err);
      alert("Failed to delete post.");
    }
  };

  const resetForm = () => {
    setCurrentPostId(null);
    setTitle('');
    setImageUrls(['']);
    setPostUrl('');
    setCaption('');
    setPlatformInstagram(true);
    setPlatformX(false);
    setPlatformFacebook(false);
    setPlatformDiscord(false);
    setDiscordChannelId('');
  };

  return (
    <div className="manager-wrapper">
      <div className="manager-container">
        
        {/* Header Breadcrumbs */}
        <div className="manager-header">
          <div>
            <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Posts Manager</h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Manage and publish posts across any of the team's social media accounts.</p>
          </div>
          <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
            Back to Dashboard
          </Link>
        </div>

        {/* Manager Grid Layout */}
        <div className="manager-grid-layout">
          
          {/* Add/Edit Form Box */}
          <div className="manager-form-card">
            <h3 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.5rem' }}>
              {currentPostId ? 'Edit Post Details' : 'Create New Social Post'}
            </h3>
            
            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Post Header / Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Post Header / Title (Optional)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Calgary Fall Open Results" 
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              {/* Dynamic Image URLs list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Image URLs (At least one required for Instagram)</label>
                {imageUrls.map((url, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={url} 
                      onChange={e => handleImageUrlChange(index, e.target.value)} 
                      placeholder={`https://images.unsplash.com/... (Image URL ${index + 1})`} 
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                    />
                    {imageUrls.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveImageUrl(index)} 
                        style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddImageUrl} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', alignSelf: 'flex-start', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  + Add Another Image
                </button>
              </div>

              <div className="manager-form-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Original Post URL (Optional)</label>
                  <input 
                    type="text" 
                    value={postUrl} 
                    onChange={e => setPostUrl(e.target.value)} 
                    placeholder="https://www.instagram.com/p/... or platform link" 
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Post Caption / Description</label>
                <textarea 
                  rows="4" 
                  value={caption} 
                  onChange={e => setCaption(e.target.value)} 
                  placeholder="Highlights of our debates this weekend!..." 
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Publish to Accounts</label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', background: 'rgba(15,23,42,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={platformInstagram} 
                      onChange={e => setPlatformInstagram(e.target.checked)} 
                      style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                    />
                    <span>Instagram</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={platformDiscord} 
                      onChange={e => setPlatformDiscord(e.target.checked)} 
                      style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                    />
                    <span>Discord</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={platformFacebook} 
                      onChange={e => setPlatformFacebook(e.target.checked)} 
                      style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                    />
                    <span>Facebook</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={platformX} 
                      onChange={e => setPlatformX(e.target.checked)} 
                      style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                    />
                    <span>X.com (Twitter)</span>
                  </label>
                </div>
              </div>

              {platformDiscord && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeIn 0.25s ease' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Custom Discord Channel ID (Optional)</label>
                  <input 
                    type="text" 
                    value={discordChannelId} 
                    onChange={e => setDiscordChannelId(e.target.value)} 
                    placeholder="e.g. 1519851411758780436 (defaults to primary announcements)" 
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
                  {currentPostId ? 'Save Changes' : 'Publish Post'}
                </button>
                {currentPostId && (
                  <button type="button" onClick={resetForm} className="exec-btn exec-btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Current Posts Directory */}
          <div className="manager-directory-card">
            <h3 style={{ color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>Synced Posts Directory</h3>
            
            {loading ? (
              <p style={{ color: '#cbd5e1', padding: '1rem 0' }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '1rem 0' }}>No posts synced yet. Seed mock data or enter a post above!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map(post => (
                  <div key={post.id} className="manager-post-row">
                    <div className="manager-post-info">
                      <img 
                        src={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls[0] : (post.imageUrl || '/photos/background1.jpg')} 
                        alt="Thumbnail" 
                        className="manager-post-thumbnail"
                      />
                      <div className="manager-post-details">
                        {post.title && (
                          <h4 style={{ margin: '0 0 0.25rem', color: '#93c5fd', fontSize: '0.95rem', fontWeight: 800 }}>
                            {post.title}
                          </h4>
                        )}
                        <p className="manager-post-caption" style={{ whiteSpace: 'pre-wrap' }}>
                          {post.caption || "(No Caption)"}
                        </p>
                        <p className="manager-post-meta">
                          {post.date} • {post.likes || 0} likes
                        </p>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                          {(post.platforms || ['instagram']).map(plat => {
                            let isPosted = true;
                            if (plat === 'discord') isPosted = !!post.discord_posted;
                            if (plat === 'facebook') isPosted = !!post.facebook_posted;
                            if (plat === 'x') isPosted = !!post.x_posted;

                            let color = '#ec4899'; // instagram pink
                            if (plat === 'discord') color = '#5865f2'; // discord blue
                            if (plat === 'facebook') color = '#1877f2'; // facebook blue
                            if (plat === 'x') color = '#f8fafc'; // x white/dark

                            return (
                              <span 
                                key={plat} 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 8px', 
                                  borderRadius: '999px', 
                                  background: isPosted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)', 
                                  border: `1px solid ${isPosted ? '#22c55e' : 'rgba(255, 255, 255, 0.15)'}`,
                                  color: isPosted ? '#4ade80' : '#94a3b8',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: isPosted ? '#22c55e' : color }}></span>
                                {plat.charAt(0).toUpperCase() + plat.slice(1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="manager-post-actions">
                      <button onClick={() => handleEditPost(post)} className="exec-btn exec-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeletePost(post.id)} className="exec-btn exec-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
