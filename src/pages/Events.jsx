import { Link } from 'react-router-dom';

export default function Events() {
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
          
          {/* Featured Calgary Summer Cup 2026 Section */}
          <div className="featured-tournament animate-on-scroll fade-in">
            <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, rgba(0,0,0,0) 70%)', top: '-50px', left: '-50px' }}></div>
            </div>
            <div className="featured-grid-layout" style={{ position: 'relative', zIndex: 1 }}>
              {/* Cup Graphic */}
              <div className="cup-illustration-wrapper">
                <img 
                  className="calgary-cup-main" 
                  src="/photos/calgary_summer_cup_logo.png" 
                  alt="Calgary Summer Cup Logo" 
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 10px 25px rgba(96, 165, 250, 0.25))' }} 
                />
                
                <svg className="surrounding-icon icon-speech-bubble" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <svg className="surrounding-icon icon-gavel" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
                <svg className="surrounding-icon icon-book" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <svg className="surrounding-icon icon-star" viewBox="0 0 24 24" fill="none" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg className="surrounding-icon icon-podium" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16M6 22V10h12v12M12 6V2M8 4h8"/></svg>
                <svg className="surrounding-icon icon-cap" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
              </div>
              
              {/* Cup Description */}
              <div className="featured-info">
                <span className="featured-tag">Featured Tournament</span>
                <h2 className="featured-title">Calgary Summer Cup 2026</h2>
                <p className="featured-desc">
                  Challenge yourself and build critical skills! The Calgary Summer Cup is a 2-day online debate tournament held on Discord. We welcome debaters of all experience levels from Grades 6-12 across various divisions.
                </p>
                
                <div className="featured-highlights">
                  <div className="highlight-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>July 25 - 26, 2026</span>
                  </div>
                  <div className="highlight-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Discord (Online)</span>
                  </div>
                  <div className="highlight-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    <span>Grades 6 - 12</span>
                  </div>
                </div>
                
                <div className="featured-btn-container">
                  <Link className="button" to="/events/calgary-summer-cup" style={{ textDecoration: 'none', padding: '0.85rem 2rem', fontWeight: 750 }}>
                    Tournament Page & Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
          <svg className="bg-art reverse" style={{ bottom: '20%', right: '4%', width: '100px', height: '100px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
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
          <div className="calendar-embed">
            <iframe 
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FEdmonton&showPrint=0&title=UCDS%20Public%20Calendar&src=dWNkcy5kZWJhdGVAZ21haWwuY29t&src=MmVkYzAyNDRmOWQxZjY5MGJhNTE3MjQ2ZWY3YTZmMzBmNWExMmM0YjFkZTRkN2UyM2YzMzJkNDMyZmFkZWE5MUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=NzFkMjVmZGY4Y2M3NzE5OTFhODI4OTc3MjQyMDM5ZWJhMDRkM2Y1YjU5MzY4MmNjZTQ3Yzg1NTIwNTY1OGU0ZUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=YTY2ZGE5ZDIxODc4MmZiNDI3NzQ1ZWNhZGQ3M2JjOTc1ZmIzOWFhMWUzNjY1NzE1M2U0NDMyZjg2ZTUyZDU2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=YzE5ZGQyZTJjZmMwODVkN2FmNGFkZGVmYzQ0NzllNWZkYjcxOTY0Yjg3YWM3Y2MwYmU5Nzk5MmQ0YzZkZDhjYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%237986cb&color=%23ef6c00&color=%23d50000&color=%234285f4&color=%238e24aa" 
              frameBorder="0" 
              scrolling="no"
              title="Google Calendar"
            ></iframe>
          </div>
        </div>
      </section>
    </main>
  );
}
