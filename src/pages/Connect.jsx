import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_EXECUTIVES = [
  { name: 'Sofija Trkulja', role: 'President', email: 'ucds.debate@gmail.com', aboutMe: 'Active debater and coordinator for UCDS club events.', experience: '4 years of competitive CUSID debate.', whyJoined: 'To foster critical thinking and leadership skills.', order: 1, photo: '' },
  { name: 'Bhuvi Goyal', role: 'VP of Internal / Tournament Organizer', email: 'bhuvigoyal1107@gmail.com', aboutMe: 'Organizes internal seminars, workshops, and tournaments.', experience: '3 years debating in regional and national tournaments.', whyJoined: 'To build a strong community of critical thinkers.', order: 2, photo: '' },
  { name: 'Menooha Koneru', role: 'Director of Equity', email: 'ucds.debate@gmail.com', aboutMe: 'Maintains fairness, inclusion, and a welcoming training environment.', experience: 'Experienced equity officer and CUSID debater.', whyJoined: 'To make university debate accessible to everyone.', order: 3, photo: '' },
  { name: 'Michael Wang', role: 'VP of Finance / Tech Lead & Systems Admin', email: 'business.michaelwang@gmail.com', aboutMe: 'Manages technology stacks, emails, and finances.', experience: 'Tech admin and competitive debater.', whyJoined: 'To apply technical systems to empower the debate society.', order: 4, photo: '' },
  { name: 'Tori Iles', role: 'VP of Outreach', email: 'ucds.debate@gmail.com', aboutMe: 'Coordinates public communications and school outreach programs.', experience: 'Outreach lead and public speaker.', whyJoined: 'To introduce public speaking to high school classrooms.', order: 5, photo: '' },
  { name: 'Md Samiu Hossain', role: 'Director of Tournaments', email: 'ucds.debate@gmail.com', aboutMe: 'Coordinates logistics for hosting regional debates.', experience: 'Tournament designer and debater.', whyJoined: 'To organize competitive opportunities for UofC students.', order: 6, photo: '' },
  { name: 'Laiba Nasir', role: 'Director of Training', email: 'ucds.debate@gmail.com', aboutMe: 'Leads educational workshops for novice debaters.', experience: 'Training coach and public speaker.', whyJoined: 'To build confidence in public speaking.', order: 7, photo: '' },
  { name: 'Ben Goud', role: 'Director of Training', email: 'ucds.debate@gmail.com', aboutMe: 'Leads training seminars and debate drills.', experience: 'Training coordinator and experienced debater.', whyJoined: 'To share my passion for argumentation and advocacy.', order: 8, photo: '' }
];

export default function Connect() {
  const [modalOpen, setModalOpen] = useState(false);
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Executives state
  const [executives, setExecutives] = useState([]);
  const [execsLoading, setExecsLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch executives from Firestore
  useEffect(() => {
    const fetchExecs = async () => {
      try {
        const q = query(collection(db, 'executives'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setExecutives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setExecutives(DEFAULT_EXECUTIVES);
        }
      } catch (err) {
        console.error("Failed to load executives, using default fallback", err);
        setExecutives(DEFAULT_EXECUTIVES);
      } finally {
        setExecsLoading(false);
      }
    };
    fetchExecs();
  }, []);

  // Auto-play timer for carousel (switches every 8 seconds when not hovered)
  useEffect(() => {
    if (execsLoading || executives.length <= 3 || isHovered) return;

    const interval = setInterval(() => {
      const step = 3;
      setStartIndex(prev => (prev + step) % executives.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [execsLoading, executives.length, isHovered]);

  // Modal handlers
  const handleOpenModal = () => {
    setModalOpen(true);
    setSubmitStatus('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewsletterName('');
    setNewsletterEmail('');
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('Subscribing...');

    try {
      // 1. Check if email already exists in subscribers
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', newsletterEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setSubmitStatus('You are already subscribed to our newsletter!');
        setIsSubmitting(false);
        return;
      }

      // 2. Add subscriber document to Firestore
      await addDoc(collection(db, 'subscribers'), {
        email: newsletterEmail.trim().toLowerCase(),
        fullName: newsletterName.trim(),
        grade: '', // Not specified in newsletter signup modal
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

  // Carousel scroll actions (always step by 3)
  const handleNext = () => {
    if (executives.length === 0) return;
    const step = 3;
    setStartIndex(prev => (prev + step) % executives.length);
  };

  const handlePrev = () => {
    if (executives.length === 0) return;
    const step = 3;
    setStartIndex(prev => (prev - step + executives.length) % executives.length);
  };

  // Select 3 executives at a time for circular infinite loop
  const getVisibleExecutives = () => {
    if (executives.length === 0) return [];
    if (executives.length <= 3) return executives;

    const visible = [];
    for (let i = 0; i < 3; i++) {
      const idx = (startIndex + i) % executives.length;
      visible.push(executives[idx]);
    }
    return visible;
  };

  return (
    <main>
      {/* Banner */}
      <section className="connect-page-banner">
        <div className="container hero-center" style={{ height: '100%', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
          <div className="button-group" style={{ justifyContent: 'center' }}>
            <a className="button" href="#socials">Socials</a>
            <a className="button button-secondary" href="#executives">Executives</a>
          </div>
        </div>
      </section>

      {/* Executives Team Section */}
      <section id="executives" className="section alt">
        <div className="container" style={{ position: 'relative' }}>
          <div className="section-header straddle">
            <h1 className="title-box"><span>Our executive team.</span></h1>
          </div>

          {execsLoading ? (
            <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '1.2rem', marginTop: '3rem' }}>Loading executives...</p>
          ) : (
            <div 
              className="carousel-container" 
              onMouseEnter={() => setIsHovered(true)} 
              onMouseLeave={() => setIsHovered(false)}
            >
              {executives.length > 3 && (
                <button onClick={handlePrev} className="carousel-arrow prev-arrow" aria-label="Previous Executives">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              <div className="executives-carousel-deck" key={startIndex}>
                {getVisibleExecutives().map((exec) => (
                  <article key={exec.name} className="profile-item">
                    {exec.photo ? (
                      <div className="profile-avatar" style={{ backgroundImage: `url(${exec.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    ) : (
                      <div className="profile-avatar"></div>
                    )}
                    <div className="card profile-card">
                      <p className="profile-role">
                        {exec.role}
                      </p>
                      <h3>
                        {exec.name}
                      </h3>
                    </div>
                    
                    <div className="profile-details">
                      <details>
                        <summary>About me</summary>
                        <p>{exec.aboutMe || "Details coming soon."}</p>
                      </details>
                      <details>
                        <summary>Debate experience</summary>
                        <p>{exec.experience || "Details coming soon."}</p>
                      </details>
                      <details>
                        <summary>Why I joined debate</summary>
                        <p>{exec.whyJoined || "Details coming soon."}</p>
                      </details>
                      <details>
                        <summary>Connect</summary>
                        <p className="profile-email">
                          <a href={`mailto:${exec.email}`}>{exec.email}</a>
                        </p>
                      </details>
                    </div>
                  </article>
                ))}
              </div>

              {executives.length > 3 && (
                <button onClick={handleNext} className="carousel-arrow next-arrow" aria-label="Next Executives">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </section>
 
      {/* Social Media Grid */}
      <section id="socials" className="section">
        <div className="container">
          <div className="section-header straddle">
            <h1 className="title-box"><span>Connect with us online.</span></h1>
          </div>
          
          <div className="cards social-grid">
            <article className="card social-card">
              <img src="/photos/instagram_footer.png" alt="Instagram logo" className="social-logo" />
              <div>
                <h3>Instagram</h3>
                <p>Follow the University of Calgary Debate Society for news, events, and updates.</p>
                <a className="button" href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/discord_footer.png" alt="Discord logo" className="social-logo" />
              <div>
                <h3>Discord</h3>
                <p>Join our Discord community for discussion, announcements, and debate sessions.</p>
                <a className="button" href="https://discord.gg/5TAG3c8TwC" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/facebook_footer.png" alt="Facebook logo" className="social-logo" />
              <div>
                <h3>Facebook</h3>
                <p>Connect with us on Facebook for event highlights and community updates.</p>
                <a className="button" href="https://www.facebook.com/DebateUofC/" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/x_footer.png" alt="X logo" className="social-logo" />
              <div>
                <h3>X (Twitter)</h3>
                <p>Follow our X account for real-time updates and debate news.</p>
                <a className="button" href="https://x.com/UCDebate" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/linktree_footer.png" alt="Linktree logo" className="social-logo" />
              <div>
                <h3>Linktree</h3>
                <p>Access all our important links, resources, and sign-up forms in one place.</p>
                <a className="button" href="https://linktr.ee/ucds.debate" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/youtube_footer.png" alt="YouTube logo" className="social-logo" />
              <div>
                <h3>YouTube</h3>
                <p>Subscribe to our channel for recorded debates, training sessions, and more.</p>
                <a className="button" href="https://www.youtube.com/@ucds.debate" target="_blank" rel="noreferrer">Visit</a>
              </div>
            </article>
            <article className="card social-card">
              <img src="/photos/logo.jpg" alt="UCDS logo" className="social-logo" style={{ borderRadius: '0.375rem', objectFit: 'contain' }} />
              <div>
                <h3>Mailing List</h3>
                <p>Subscribe to our monthly newsletter for updates, event reminders, and debate materials.</p>
                <button className="button" onClick={handleOpenModal}>Subscribe</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Newsletter Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(4, 10, 24, 0.85)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
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
