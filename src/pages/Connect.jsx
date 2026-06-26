import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
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
  // Executives state
  const [executives, setExecutives] = useState([]);
  const [execsLoading, setExecsLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [openDetails, setOpenDetails] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(true);

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
      setStartIndex(prev => {
        if (prev < 0 || prev >= executives.length) return prev;
        setIsTransitioning(true);
        return prev + 1;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [execsLoading, executives.length, isHovered]);

  // Handle infinite scroll boundary wrapping resets
  useEffect(() => {
    if (executives.length === 0) return;

    if (startIndex >= executives.length) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setStartIndex(0);
      }, 700); // match transition duration of 0.7s
      return () => clearTimeout(timer);
    }

    if (startIndex < 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setStartIndex(executives.length - 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [startIndex, executives.length]);

  // Re-enable transitions on the next animation frame after reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Carousel scroll actions (always step by 1)
  const handleNext = () => {
    if (executives.length === 0 || startIndex < 0 || startIndex >= executives.length) return;
    setIsTransitioning(true);
    setStartIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (executives.length === 0 || startIndex < 0 || startIndex >= executives.length) return;
    setIsTransitioning(true);
    setStartIndex(prev => prev - 1);
  };

  const handleDetailClick = (execName, tabName, e) => {
    e.preventDefault();
    setOpenDetails(prev => ({
      ...prev,
      [execName]: prev[execName] === tabName ? null : tabName
    }));
  };

  // Select executives and append clones for circular infinite loop
  const getExtendedExecutives = () => {
    if (executives.length === 0) return [];
    if (executives.length <= 3) return executives;
    return [...executives, ...executives.slice(0, 3)];
  };

  return (
    <main>
      {/* Banner */}
      <section className="connect-page-banner">
        <div className="container hero-center" style={{ height: '100%', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
          <div className="button-group" style={{ justifyContent: 'center' }}>
            <Link className="button" to="/socials">Socials</Link>
            <a className="button button-secondary" href="#executives">Executives</a>
          </div>
        </div>
      </section>

      {/* Executives Team Section */}
      <section id="executives" className="section alt" style={{ position: 'relative' }}>
        {/* Background floating debate icons */}
        <div className="section-bg-icons">
          <svg className="floating-bg-icon icon-speech-bubble" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg className="floating-bg-icon icon-gavel" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
          <svg className="floating-bg-icon icon-book" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <svg className="floating-bg-icon icon-star" viewBox="0 0 24 24" fill="none" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg className="floating-bg-icon icon-podium" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16M6 22V10h12v12M12 6V2M8 4h8"/></svg>
          <svg className="floating-bg-icon icon-cap" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
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

              <div className="executives-carousel-track">
                <div 
                  className="executives-carousel-deck"
                  style={{
                    transform: `translateX(calc(-${startIndex} * (100% + var(--carousel-gap)) / 3))`,
                    transition: isTransitioning ? 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                    display: 'flex',
                    gap: 'var(--carousel-gap)',
                    width: '100%',
                    justifyContent: 'flex-start'
                  }}
                >
                  {getExtendedExecutives().map((exec, index) => (
                    <article key={`${exec.name}-${index}`} className="profile-item">
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
                        <details open={openDetails[exec.name] === 'about'}>
                          <summary onClick={(e) => handleDetailClick(exec.name, 'about', e)}>About me</summary>
                          <p>{exec.aboutMe || "Details coming soon."}</p>
                        </details>
                        <details open={openDetails[exec.name] === 'experience'}>
                          <summary onClick={(e) => handleDetailClick(exec.name, 'experience', e)}>Debate experience</summary>
                          <p>{exec.experience || "Details coming soon."}</p>
                        </details>
                        <details open={openDetails[exec.name] === 'whyJoined'}>
                          <summary onClick={(e) => handleDetailClick(exec.name, 'whyJoined', e)}>Why I joined debate</summary>
                          <p>{exec.whyJoined || "Details coming soon."}</p>
                        </details>
                        <details open={openDetails[exec.name] === 'connect'}>
                          <summary onClick={(e) => handleDetailClick(exec.name, 'connect', e)}>Connect</summary>
                          <p className="profile-email">
                            <a href={`mailto:${exec.email}`}>{exec.email}</a>
                          </p>
                        </details>
                      </div>
                    </article>
                  ))}
                </div>
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
    </main>
  );
}
