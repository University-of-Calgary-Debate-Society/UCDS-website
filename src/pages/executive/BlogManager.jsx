import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function BlogManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Blog Manager State
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDate, setBlogDate] = useState(new Date().toISOString().split('T')[0]);
  const [blogSummary, setBlogSummary] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [currentPostId, setCurrentPostId] = useState('');
  const [postsList, setPostsList] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // -------------------------------------------------------------
  // AUTH TRACKER
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthInitialized(true);
      if (authInitialized && !user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate, authInitialized]);

  // -------------------------------------------------------------
  // FETCH POSTS
  // -------------------------------------------------------------
  const fetchPostsList = async () => {
    setPostsLoading(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      setPostsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching posts list", err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchPostsList();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------
  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      alert("Title and content are required.");
      return;
    }

    const payload = {
      title: blogTitle.trim(),
      date: blogDate,
      summary: blogSummary.trim() || (blogContent.replace(/<[^>]*>/g, '').substring(0, 150) + "..."),
      content: blogContent,
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentPostId) {
        await updateDoc(doc(db, 'posts', currentPostId), payload);
        alert("Blog post updated successfully!");
      } else {
        await addDoc(collection(db, 'posts'), payload);
        alert("Blog post created successfully!");
      }

      // Reset Form
      setBlogTitle('');
      setBlogSummary('');
      setBlogContent('');
      setBlogDate(new Date().toISOString().split('T')[0]);
      setCurrentPostId('');

      fetchPostsList();
    } catch (err) {
      console.error(err);
      alert("Failed to save blog post: " + err.message);
    }
  };

  const handleLoadPost = (post) => {
    setCurrentPostId(post.id);
    setBlogTitle(post.title || '');
    setBlogDate(post.date || new Date().toISOString().split('T')[0]);
    setBlogSummary(post.summary || '');
    setBlogContent(post.content || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (id, title) => {
    if (!await confirm(`Are you sure you want to delete the post "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      if (currentPostId === id) {
        setCurrentPostId('');
        setBlogTitle('');
        setBlogSummary('');
        setBlogContent('');
      }
      fetchPostsList();
      alert("Post deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post: " + err.message);
    }
  };

  if (!authInitialized || !isLoggedIn) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Redirecting to portal...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1200px', margin: '4rem auto', textAlign: 'left' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Blog Manager</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Compose and publish blog posts synced instantly to visitors.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
              {/* Left: Blog Form */}
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.75rem' }}>
                <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>{currentPostId ? 'Edit Post' : 'Compose New Post'}</h4>
                <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Title *</label>
                    <input 
                      type="text" 
                      value={blogTitle} 
                      onChange={(e) => setBlogTitle(e.target.value)} 
                      className="text-input" 
                      placeholder="🏆 UCDS Wins Western Championships!" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} 
                      required 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Publication Date *</label>
                    <input 
                      type="date" 
                      value={blogDate} 
                      onChange={(e) => setBlogDate(e.target.value)} 
                      className="text-input" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Summary (Brief preview snippet)</label>
                    <input 
                      type="text" 
                      value={blogSummary} 
                      onChange={(e) => setBlogSummary(e.target.value)} 
                      className="text-input" 
                      placeholder="An overview of our historic win at Westerns..." 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Body Content (HTML tags supported) *</label>
                    <textarea 
                      value={blogContent} 
                      onChange={(e) => setBlogContent(e.target.value)} 
                      className="textarea-input" 
                      placeholder="<p>Write your article here...</p>" 
                      rows="12" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                    <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {currentPostId ? 'Update Post' : 'Publish Post'}
                    </button>
                    {currentPostId && (
                      <button 
                        type="button" 
                        onClick={() => { setCurrentPostId(''); setBlogTitle(''); setBlogSummary(''); setBlogContent(''); setBlogDate(new Date().toISOString().split('T')[0]); }} 
                        className="exec-btn exec-btn-secondary" 
                        style={{ padding: '10px 20px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', fontSize: '0.95rem' }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right: Posts List */}
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Published Posts ({postsList.length})</h4>
                {postsLoading ? (
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Loading published posts...</p>
                ) : postsList.length === 0 ? (
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>No published blog posts.</p>
                ) : (
                  <div style={{ maxHeight: '550px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {postsList.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          <strong style={{ color: '#ffffff', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleLoadPost(p)} style={{ background: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '4px', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDeletePost(p.id, p.title)} style={{ background: '#dc2626', border: 'none', color: '#ffffff', borderRadius: '4px', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
