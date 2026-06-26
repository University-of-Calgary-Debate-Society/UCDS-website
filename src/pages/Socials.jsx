import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function parseMarkdownToHtml(text) {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Bold: **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Underline: __text__
  escaped = escaped.replace(/__(.*?)__/g, '<u>$1</u>');
  
  // Italic: *text* or _text_
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // URL Link detection
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
}

function PostImageCarousel({ imageUrls, defaultImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const urls = imageUrls && imageUrls.length > 0 ? imageUrls : [defaultImage || '/photos/background1.jpg'];

  if (urls.length <= 1) {
    return <img src={urls[0]} alt="Post content" className="post-image" />;
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <img src={urls[currentIndex]} alt={`Post content slide ${currentIndex + 1}`} className="post-image" />
      
      {/* Navigation Arrows */}
      <button 
        type="button"
        onClick={handlePrev}
        style={{
          position: 'absolute',
          top: '50%',
          left: '10px',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.45)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'background 0.2s',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)'}
      >
        &#10094;
      </button>
      <button 
        type="button"
        onClick={handleNext}
        style={{
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.45)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'background 0.2s',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)'}
      >
        &#10095;
      </button>

      {/* Dots Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '6px',
        zIndex: 2
      }}>
        {urls.map((_, idx) => (
          <span 
            key={idx}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: idx === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              transition: 'background 0.2s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Socials() {
  const [modalOpen, setModalOpen] = useState(false);
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instagram feed state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Likes tracker for interactive posts
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const instaPosts = allPosts
            .filter(post => post.type === 'instagram')
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          setPosts(instaPosts);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error("Failed to load Instagram posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleOpenModal = (e) => {
    e.preventDefault();
    setModalOpen(true);
    setSubmitStatus('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewsletterName('');
    setNewsletterEmail('');
  };

  const handleLike = (postId, currentLikes) => {
    setLikedPosts(prev => {
      const isLiked = !prev[postId];
      // update state count locally for instant visual feedback
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? (Number(currentLikes || 0) + 1) : Math.max(0, Number(currentLikes || 0) - 1)
          };
        }
        return post;
      }));
      return {
        ...prev,
        [postId]: isLiked
      };
    });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('Subscribing...');

    try {
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', newsletterEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setSubmitStatus('You are already subscribed to our newsletter!');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'subscribers'), {
        email: newsletterEmail.trim().toLowerCase(),
        fullName: newsletterName.trim(),
        grade: '',
        lists: ['newsletter'],
        active: true,
        createdAt: new Date().toISOString()
      });

      setSubmitStatus('✅ Successfully subscribed! Thank you for joining.');
      setNewsletterName('');
      setNewsletterEmail('');
    } catch (err) {
      console.error(err);
      setSubmitStatus('❌ Problem subscribing. Please verify connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date to: "June 25, 2026"
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <main>
      {/* Banner */}
      <section className="social-page-banner">
        <div className="container hero-center" style={{ height: '100%', justifyContent: 'flex-end', paddingBottom: '2.5rem' }}>
          <div style={{ transform: 'translateY(-2rem)' }}>
            <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 850, letterSpacing: '-0.02em', color: '#ffffff' }}>Social Community</h1>
            <p style={{ margin: '0.5rem 0 0', color: '#93c5fd', fontSize: '1.15rem' }}>Connect with the University of Calgary Debate Society across platforms</p>
          </div>
        </div>
      </section>

      {/* Social Platforms List */}
      <section className="section" style={{ background: '#0b1a3a' }}>
        <div className="container">
          <div className="section-header straddle">
            <h1 className="title-box"><span>Our Social Channels</span></h1>
          </div>

          <div className="socials-list">
            {/* Discord */}
            <article className="social-large-card social-card-odd animate-on-scroll fade-in-left">
              <div className="social-card-content">
                <h2>Discord Server</h2>
                <p>
                  Our primary hub for online communications, practice announcements, virtual coaching sessions, and general club hanging out! Join our active server to chat with executives, receive weekly resources, and sync up for training days.
                </p>
                <a className="button" href="https://discord.gg/5TAG3c8TwC" target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', borderColor: '#5865F2' }}>Join the Server</a>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/discord_footer.png" alt="Discord logo" className="social-large-logo" />
              </div>
            </article>

            {/* Facebook */}
            <article className="social-large-card social-card-even animate-on-scroll fade-in-right">
              <div className="social-card-content">
                <h2>Facebook Page</h2>
                <p>
                  Connect with us on Facebook for tournament announcements, highlight photos of historical championships, club socials, and regional debate society community networking. We post major updates and photo albums here!
                </p>
                <a className="button" href="https://www.facebook.com/DebateUofC/" target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #1877F2 0%, #1565C0 100%)', borderColor: '#1877F2' }}>Follow on Facebook</a>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/facebook_footer.png" alt="Facebook logo" className="social-large-logo" />
              </div>
            </article>

            {/* YouTube */}
            <article className="social-large-card social-card-odd animate-on-scroll fade-in-left">
              <div className="social-card-content">
                <h2>YouTube Channel</h2>
                <p>
                  Access our virtual training catalog! We upload recorded seminars, introductory guides, novice tutorials, and match recordings of national finals. A perfect resource for independent study and skill-building.
                </p>
                <a className="button" href="https://www.youtube.com/@ucds.debate" target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #FF0000 0%, #C30000 100%)', borderColor: '#FF0000' }}>Subscribe on YouTube</a>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/youtube_footer.png" alt="YouTube logo" className="social-large-logo" />
              </div>
            </article>

            {/* X / Twitter */}
            <article className="social-large-card social-card-even animate-on-scroll fade-in-right">
              <div className="social-card-content">
                <h2>X (Twitter)</h2>
                <p>
                  For quick announcements, tournament outcome tallies, live-tweeted schedules, and real-time updates during competitive events, follow our X handle.
                </p>
                <a className="button" href="https://x.com/UCDebate" target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #000000 0%, #222222 100%)', borderColor: '#333333' }}>Follow on X</a>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/x_footer.png" alt="X logo" className="social-large-logo" />
              </div>
            </article>

            {/* Linktree */}
            <article className="social-large-card social-card-odd animate-on-scroll fade-in-left">
              <div className="social-card-content">
                <h2>Linktree Index</h2>
                <p>
                  Looking for active sign-up forms, tournament links, or resource files? Our Linktree is updated weekly during the active semester. Keep this bookmarked for quick registrations and access sheets!
                </p>
                <a className="button" href="https://linktr.ee/ucds.debate" target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #39E09B 0%, #17A064 100%)', borderColor: '#39E09B' }}>Visit Linktree</a>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/linktree_footer.png" alt="Linktree logo" className="social-large-logo" />
              </div>
            </article>

            {/* Mailing List */}
            <article className="social-large-card social-card-even animate-on-scroll fade-in-right">
              <div className="social-card-content">
                <h2>Mailing List Newsletter</h2>
                <p>
                  Join our official mailing list to get monthly dispatches directly in your inbox. We share meeting times, seminar details, coach registrations, and news about the Calgary Summer Cup.
                </p>
                <button className="button" onClick={handleOpenModal} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)', borderColor: '#2563eb' }}>Subscribe to Newsletter</button>
              </div>
              <div className="social-card-graphic">
                <img src="/photos/logo.jpg" alt="UCDS Logo" className="social-large-logo" style={{ borderRadius: '1rem' }} />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section id="instagram" className="instagram-section" style={{ background: '#112854', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="container">
          <div className="section-header">
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Instagram Highlights</h2>
            <p style={{ color: '#93c5fd', maxWidth: '30rem', margin: '0.5rem auto 0' }}>
              Native feed tracking from <a href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'underline' }}>@ucalgary.debate</a>
            </p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '1.2rem', marginTop: '3rem' }}>Loading posts...</p>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'rgba(10, 25, 59, 0.4)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '2.5rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 1rem' }}>No Instagram posts are currently synced to the website.</p>
              <a href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer" className="button" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>View Instagram Profile Directly</a>
            </div>
          ) : (
            <div className="instagram-feed-grid">
              {posts.map((post) => (
                <article key={post.id} className="instagram-post-card">
                  {/* Post Header */}
                  <div className="post-header">
                    <div className="post-user-info">
                      <img src="/photos/logo.jpg" alt="ucalgary.debate avatar" className="post-avatar" />
                      <div>
                        <a href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer" className="post-username">ucalgary.debate</a>
                        <span className="post-location">University of Calgary</span>
                      </div>
                    </div>
                    <div className="post-more-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Post Image */}
                  <div className="post-image-container">
                    <PostImageCarousel imageUrls={post.imageUrls} defaultImage={post.imageUrl} />
                  </div>

                  {/* Action Bar */}
                  <div className="post-actions">
                    <div className="post-action-left">
                      <button 
                        onClick={() => handleLike(post.id, post.likes)} 
                        className="post-action-btn btn-like" 
                        aria-label="Like Post"
                        style={{ color: likedPosts[post.id] ? '#ef4444' : '#f8fafc' }}
                      >
                        {likedPosts[post.id] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                          </svg>
                        )}
                      </button>
                      <button className="post-action-btn" aria-label="Comment" onClick={() => window.open(post.postUrl || 'https://www.instagram.com/ucalgary.debate/', '_blank')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <button className="post-action-btn" aria-label="Share" onClick={() => window.open(post.postUrl || 'https://www.instagram.com/ucalgary.debate/', '_blank')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                    </div>
                    <div className="post-action-right">
                      <a href={post.postUrl || 'https://www.instagram.com/ucalgary.debate/'} target="_blank" rel="noreferrer" className="post-action-btn" aria-label="Bookmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Post Details */}
                  <div className="post-details">
                    <p className="post-likes">{post.likes || 0} likes</p>
                    {post.title && (
                      <h4 className="post-header-title">
                        {post.title}
                      </h4>
                    )}
                    <p className="post-caption-wrap">
                      <span className="post-caption-user">ucalgary.debate</span>
                      <span className="post-caption-text">{parseMarkdownToHtml(post.caption || "Click below to view the full post on Instagram!")}</span>
                    </p>
                    <span className="post-date">{formatDateString(post.date)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Modal */}
      {modalOpen && (
        <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(4, 10, 24, 0.85)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: '#ffffff', color: '#0f172a', padding: '2.5rem', borderRadius: '12px', width: '90%', maxWidth: '480px', position: 'relative' }}>
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close modal" style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <img src="/photos/logo.jpg" alt="UCDS Logo" style={{ width: '2rem', height: '2rem', borderRadius: '0.25rem', objectFit: 'contain' }} />
              <span style={{ fontWeight: 700, color: '#112854', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>UCDS Mailing List</span>
            </div>

            <h3 style={{ margin: '0 0 0.5rem', color: '#112854', fontSize: '1.5rem', textAlign: 'center', fontWeight: '700' }}>Join our Newsletter</h3>
            <p style={{ color: '#64748b', textAlign: 'center', margin: '0 0 1.75rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Stay in the loop with our monthly newsletter. Get updates on upcoming events, tournament results, and debate resources delivered straight to your inbox.
            </p>
            
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="newsletterName" style={{ color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Full Name (Optional)</label>
                <input 
                  type="text" 
                  id="newsletterName" 
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="newsletterEmail" style={{ color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="email" 
                  id="newsletterEmail" 
                  required 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="name@example.com" 
                  style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="button" 
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '999px', background: '#2563eb', color: '#ffffff', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
              </button>
              
              {submitStatus && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', textAlign: 'center', fontWeight: '600', color: submitStatus.startsWith('✅') ? '#16a34a' : '#ef4444' }}>
                  {submitStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
