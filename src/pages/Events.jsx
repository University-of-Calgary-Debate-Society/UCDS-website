import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { getGoogleCalendarLink, downloadCalendarICS } from '../utils/calendarUtils';

export default function Events() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Tournaments slider state
  const [tournaments, setTournaments] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Fetch upcoming calendar events & tournaments
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const fetchCalendar = async () => {
      try {
        const q = query(collection(db, 'calendar_events'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter events today onwards (or currently ongoing), sort chronologically by start date
        const filtered = list.filter(evt => {
          const start = evt.startDate || evt.date;
          const end = evt.endDate || evt.date || start;
          return (end || '') >= todayStr;
        });
        filtered.sort((a, b) => new Date(a.startDate || a.date || 0) - new Date(b.startDate || b.date || 0));
        setUpcomingEvents(filtered.slice(0, 3));
      } catch (err) {
        console.error("Error loading upcoming calendar events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };

    const fetchTournaments = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'tournaments_and_events'));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter out past tournaments
        const filtered = list.filter(t => {
          const end = t.endDate || t.startDate;
          return (end || '') >= todayStr;
        });
        filtered.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
        setTournaments(filtered);
      } catch (err) {
        console.error("Error loading tournaments:", err);
      } finally {
        setLoadingTournaments(false);
      }
    };

    fetchCalendar();
    fetchTournaments();
  }, []);

  // Slider handlers
  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev === 0 ? tournaments.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev === tournaments.length - 1 ? 0 : prev + 1));
  };

  const currentTournament = tournaments[activeSlide];

  return (
    <main>
      <section className="events-page-banner"></section>

      {/* Intro Section */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '15%', left: '4%', width: '100px', height: '100px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h1 className="title-box"><span>Upcoming UCDS events.</span></h1>
          </div>
          <p className="section-copy" style={{ marginBottom: '2rem' }}>
            Stay informed about our latest workshops, meetups, and community gatherings. Check back often for new event announcements.
          </p>
          
          {/* DYNAMIC TOURNAMENTS SLIDER SECTION */}
          {loadingTournaments ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(10,25,59,0.3)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: '#cbd5e1' }}>Loading featured tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'rgba(10, 25, 59, 0.4)',
              borderRadius: '1.5rem',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>No upcoming tournaments scheduled. Check back soon!</p>
            </div>
          ) : (
            <div 
              className="featured-tournament animate-on-scroll fade-in"
              style={{
                position: 'relative',
                backgroundImage: currentTournament.images && currentTournament.images[0] ? `url(${currentTournament.images[0]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Tinted glass overlay to make text highly readable over background photo */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(11, 26, 58, 0.95) 0%, rgba(17, 40, 84, 0.85) 100%)',
                backdropFilter: 'blur(3px)',
                zIndex: 0
              }}></div>

              {/* Slider Content Wrapper */}
              <div 
                className="featured-grid-layout" 
                style={{ 
                  position: 'relative', 
                  zIndex: 1, 
                  padding: '4rem 6rem 5rem 6rem', // extra padding on sides for middle arrows
                  minHeight: '520px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {/* Middle Left Arrow */}
                <button
                  onClick={handlePrevSlide}
                  style={{
                    position: 'absolute',
                    left: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    fontSize: '1.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(-50%)'; }}
                >
                  ‹
                </button>

                {/* Middle Right Arrow */}
                <button
                  onClick={handleNextSlide}
                  style={{
                    position: 'absolute',
                    right: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    fontSize: '1.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(-50%)'; }}
                >
                  ›
                </button>

                {/* Slide Content Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', width: '100%', alignItems: 'center' }}>
                  {/* Left: Illustration Banner */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {currentTournament.images && currentTournament.images[0] ? (
                      <div style={{ position: 'relative', width: '100%', maxWidth: '440px', height: '280px', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <img 
                          src={currentTournament.images[0]} 
                          alt={currentTournament.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(96, 165, 250, 0.1)', border: '2px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#60a5fa' }}>
                        🏆
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Info */}
                  <div className="featured-info" style={{ width: '100%', padding: 0 }}>
                    <span className="featured-tag" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {currentTournament.cusidTag ? `${currentTournament.cusidTag} Title Tournament` : 'Featured Tournament'}
                    </span>
                    <h2 className="featured-title" style={{ fontSize: '2.8rem', margin: '0.5rem 0', fontWeight: 800, lineHeight: 1.2 }}>{currentTournament.title}</h2>
                    <p className="featured-desc" style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '1.5rem', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                      Format: {currentTournament.format} Modality: {currentTournament.modality}. Organized by {currentTournament.hostedByUCalgary ? 'University of Calgary' : currentTournament.hostingUniversity} ({currentTournament.scope === 'international' ? currentTournament.country : 'Canada'}).
                    </p>
                    
                    <div className="featured-highlights" style={{ marginBottom: '2rem' }}>
                      <div className="highlight-pill">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{currentTournament.startDate === currentTournament.endDate ? currentTournament.startDate : `${currentTournament.startDate} to ${currentTournament.endDate}`}</span>
                      </div>
                      <div className="highlight-pill">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span style={{ textTransform: 'capitalize' }}>{currentTournament.modality} ({currentTournament.timezone || 'MST'})</span>
                      </div>
                      <div className="highlight-pill">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                        <span style={{ textTransform: 'capitalize' }}>{currentTournament.levels?.join(', ') || 'All levels'}</span>
                      </div>
                    </div>
                    
                    <div className="featured-btn-container">
                      <Link className="button" to={`/events/tournaments?id=${currentTournament.id}`} style={{ textDecoration: 'none', padding: '0.85rem 2rem', fontWeight: 750 }}>
                        Details & Registration
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Navigation Dots */}
              {tournaments.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '1.25rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                  zIndex: 2
                }}>
                  {tournaments.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: 'none',
                        background: activeSlide === idx ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.25s'
                      }}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <section className="spacer"></section>

      {/* Spring/Summer Practices */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art reverse" style={{ top: '25%', right: '4%', width: '110px', height: '110px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
          <svg className="bg-art" style={{ bottom: '15%', left: '3%', width: '95px', height: '95px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Summer and Spring</span></h2>
          </div>
          <p className="section-copy">Join our community Discord and attend our regular sessions to stay sharp during the warmer months.</p>
          <div className="cards feature-grid">
            <article className="card animate-on-scroll lift-out-shadow">
              <h3>Weekly Practices</h3>
              <p>We hold weekly practices at <strong>7:30 PM on both Tuesday and Thursday</strong>. Join us to learn new skills, run practice debates, and connect with peers. Our practices will be held on Discord unless there is enough interest to warrant in-person practices!</p>
            </article>
            <article className="card social-card animate-on-scroll lift-out-shadow">
              <img src="/photos/discord.png" alt="Discord logo" className="social-logo" />
              <div>
                <h3>Discord Community</h3>
                <p>For the latest updates, event links, and day-to-day discussion, join our official Discord server.</p>
                <a className="button" href="https://discord.gg/5TAG3c8TwC" target="_blank" rel="noreferrer">Join Discord</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="spacer"></section>

      {/* Fall/Winter Schedules */}
      <section className="section alt" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '20%', left: '4%', width: '100px', height: '100px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '20%', right: '4%', width: '100px', height: '100px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 1 3-3h7z"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Fall and Winter</span></h2>
          </div>
          <p className="section-copy" style={{ marginBottom: '1.5rem' }}>
            Information regarding our Fall and Winter semester schedule, including tournament dates and larger workshops, will be posted here as the season approaches.
          </p>
          <p>We usually hold our meetings in CHE110, <strong>but that may change next semester</strong>.</p>
        </div>
      </section>

      <section className="spacer"></section>

      {/* Calendar Section */}
      <section id="calendar" className="section">
        <div className="container">
          <div className="section-header animate-on-scroll fade-in-left">
            <h2><span>Events Calendar</span></h2>
          </div>
          
          <div className="upcoming-events-preview" style={{ marginTop: '2.5rem' }}>
            {loadingEvents ? (
              <p style={{ color: '#cbd5e1', textAlign: 'center', padding: '2rem' }}>Loading upcoming events...</p>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(10, 25, 59, 0.4)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 1rem' }}>No upcoming events scheduled right now.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
                {upcomingEvents.map(event => (
                  <div key={event.id} className="exec-card" style={{ background: 'rgba(17, 40, 84, 0.55)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: event.category === 'practice' ? '#3b82f6' : 
                                  event.category === 'tournament' ? '#f97316' :
                                  event.category === 'social' ? '#22c55e' :
                                  event.category === 'meeting' ? '#8b5cf6' : '#14b8a6'
                    }}></div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: event.category === 'practice' ? '#93c5fd' : 
                                  event.category === 'tournament' ? '#fdba74' :
                                  event.category === 'social' ? '#86efac' :
                                  event.category === 'meeting' ? '#c084fc' : '#99f6e4' }}>
                      {event.category}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: 'bold' }}>{event.title}</h3>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
                      📅 {event.startDate && event.endDate && event.startDate !== event.endDate ? `${event.startDate} to ${event.endDate}` : (event.startDate || event.date)} {event.startTime ? `• ⏰ ${event.startTime} ${event.timezone || 'MST'}` : ''}
                    </p>
                    {event.location && (
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>📍 {event.location}</p>
                    )}
                    {event.description && (
                      <p style={{ margin: '0.5rem 0 0', color: '#cbd5e1', fontSize: '0.85rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem' }}>
                      <a 
                        href={getGoogleCalendarLink(event)} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '4px 10px', 
                          borderRadius: '999px', 
                          background: 'rgba(66, 133, 244, 0.15)', 
                          color: '#60a5fa', 
                          textDecoration: 'none',
                          border: '1px solid rgba(66, 133, 244, 0.3)',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        + Google Calendar
                      </a>
                      <button 
                        onClick={() => downloadCalendarICS([event], `${event.title || 'event'}.ics`)} 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '4px 10px', 
                          borderRadius: '999px', 
                          background: 'rgba(244, 63, 94, 0.15)', 
                          color: '#fb7185', 
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        Export (.ics)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/calendar" className="button" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', textDecoration: 'none' }}>
                Open Interactive Calendar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
