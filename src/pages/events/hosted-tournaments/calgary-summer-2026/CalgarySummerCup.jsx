import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function CalgarySummerCup() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement.offsetHeight || 400;

    const particles = [];
    const particleCount = Math.min(80, Math.floor((width * height) / 7000));

    // Mouse tracker
    const mouse = { x: null, y: null, active: false };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseRadius = Math.random() * 1.5 + 1.5;
        this.radius = this.baseRadius;
        this.baseOpacity = Math.random() * 0.15 + 0.22;
        this.opacity = this.baseOpacity;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Proximity check for cursor glow
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const limit = 150;

          if (dist < limit) {
            const factor = 1 - dist / limit;
            this.opacity = Math.min(0.95, this.baseOpacity + factor * 0.60);
            this.radius = this.baseRadius + factor * 3.0;
          } else {
            this.opacity = this.opacity * 0.95 + this.baseOpacity * 0.05;
            this.radius = this.radius * 0.95 + this.baseRadius * 0.05;
          }
        } else {
          this.opacity = this.opacity * 0.95 + this.baseOpacity * 0.05;
          this.radius = this.radius * 0.95 + this.baseRadius * 0.05;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.opacity > this.baseOpacity + 0.05) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(96, 165, 250, 0.8)';
          ctx.fillStyle = `rgba(186, 218, 255, ${this.opacity})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(96, 165, 250, ${this.opacity})`;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.offsetHeight || 400;
      init();
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const container = canvas.parentElement;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    init();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update & Draw Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // 2. Draw Network Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const limit = 110;

          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            let opacity = (1 - dist / limit) * 0.22;

            if (mouse.active) {
              const d1 = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
              const d2 = Math.hypot(p2.x - mouse.x, p2.y - mouse.y);
              if (d1 < 150 || d2 < 150) {
                const mouseFactor = Math.max(1 - d1 / 150, 1 - d2 / 150);
                opacity += mouseFactor * 0.40;
              }
            }

            ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
            ctx.lineWidth = opacity > 0.3 ? 1.4 : opacity > 0.15 ? 0.9 : 0.6;
            ctx.stroke();
          }
        }
      }

      // 3. Draw connection to mouse pointer
      if (mouse.active) {
        particles.forEach(p => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const limit = 135;
          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            const opacity = (1 - dist / limit) * 0.4;
            ctx.strokeStyle = `rgba(165, 203, 255, ${opacity})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main>
      {/* Banner Section */}
      <section className="calgary-summer-cup-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <img src="/photos/calgary_summer_cup_logo.png" alt="Calgary Summer Cup Logo" className="hero-logo-image" />
          </div>
          <h1 className="hero-title animate-on-scroll fade-in-left">Calgary Summer Cup</h1>
          <p className="hero-subtitle animate-on-scroll fade-in">
            The University of Calgary Debate Society is pleased to welcome you to the Calgary Summer Cup 2026! This
            tournament will be held on July 25th online, over Discord.
          </p>
          <span className="association-notice">This tournament is not associated with the ADSA.</span>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '10%', left: '3%', width: '140px', height: '140px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16M6 22V10h12v12M12 6V2M8 4h8"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '15%', right: '4%', width: '130px', height: '130px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Schedule</span></h2>
          </div>
          <div className="card animate-on-scroll lift-out-shadow" style={{ padding: '2.5rem' }}>
            <h3 style={{ color: '#1e3a8a', marginTop: 0, textAlign: 'center', fontSize: '1.5rem', marginBottom: '0.5rem', borderBottom: 'none', paddingBottom: 0, fontWeight: 700 }}>
              Schedule
            </h3>
            <div className="schedule-grid">
              <div className="schedule-day">
                <h4 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>Saturday, July 25</h4>
                <ul className="schedule-list">
                  <li><span className="schedule-time">8:30-9:00</span><span className="schedule-desc">Check-in</span></li>
                  <li><span className="schedule-time">9:00-9:30</span><span className="schedule-desc">Debater, Judges, Equity and Tech Briefings</span></li>
                  <li><span className="schedule-time">9:30-10:45</span><span className="schedule-desc">Round 1 (in-round)</span></li>
                  <li><span className="schedule-time">10:45-12:00</span><span className="schedule-desc">Round 2 (in-round)</span></li>
                  <li><span className="schedule-time">12:00-1:00</span><span className="schedule-desc">Lunch Break</span></li>
                  <li><span className="schedule-time">1:00-1:15</span><span className="schedule-desc">Check-in</span></li>
                  <li><span className="schedule-time">1:15-2:30</span><span className="schedule-desc">Round 3 (in-round)</span></li>
                  <li><span className="schedule-time">2:45-4:00</span><span className="schedule-desc">Round 4 (in-round)</span></li>
                  <li><span className="schedule-time">4:00-4:30</span><span className="schedule-desc">Wrap-up</span></li>
                </ul>
              </div>
              <div className="schedule-day">
                <h4 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>Sunday, July 26</h4>
                <ul className="schedule-list">
                  <li><span className="schedule-time">9:30-10:00</span><span className="schedule-desc">Check-in and break announcements</span></li>
                  <li><span className="schedule-time">10:00-11:30</span><span className="schedule-desc">Semi-Finals</span></li>
                  <li><span className="schedule-time">11:30-12:30</span><span className="schedule-desc">Lunch and break announcements</span></li>
                  <li><span className="schedule-time">12:30-12:45</span><span className="schedule-desc">Check-in</span></li>
                  <li><span className="schedule-time">12:45-2:30</span><span className="schedule-desc">Finals</span></li>
                  <li><span className="schedule-time">2:30-3:30</span><span className="schedule-desc">Awards and Announcements</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Format & Platforms Section */}
      <section className="section alt" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '25%', left: '8%', width: '130px', height: '130px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '20%', right: '6%', width: '140px', height: '140px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16M6 22V10h12v12M12 6V2M8 4h8"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Format & Platforms</span></h2>
          </div>
          <div className="grid-2col">
            <article className="card animate-on-scroll lift-out-shadow" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2.25rem' }}>
              <h3 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 700, textAlign: 'center' }}>
                Tournament Format
              </h3>
              <p>
                This tournament will consist of three in-rounds of British Parliamentary debate and one grand final. All
                in-rounds will be open adjudication, meaning you will be told your placement in the round immediately
                after the judge's deliberation. Speaker scores will not be revealed.
              </p>
            </article>
            <article className="card animate-on-scroll lift-out-shadow" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2.25rem' }}>
              <h3 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 700, textAlign: 'center' }}>
                Online Platform
              </h3>
              <p>
                The tournament will be held on a Discord server, the link to which will be sent out before the tournament.
                Please create a Discord account if you do not already have one, or have a parent create one for you to use
                if you are under the age of 13. Tournament staff will be able to help you navigate the platform if you are
                not familiar with it.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Eligibility & Rules Section */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art reverse" style={{ top: '30%', right: '5%', width: '140px', height: '140px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg className="bg-art" style={{ bottom: '10%', left: '4%', width: '120px', height: '120px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Eligibility & Categories</span></h2>
          </div>

          <div className="eligibility-scope-container animate-on-scroll fade-in" style={{ textAlign: 'center', maxWidth: '46rem', margin: '0 auto 3rem', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '1.25rem 2rem', borderRadius: '2rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#93c5fd', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
              <strong style={{ color: '#ffffff' }}>Eligibility Scope:</strong> Open to all students enrolled in Grades 6-12
              during the recently completed 2025-2026 academic year.
            </p>
          </div>

          <div className="grid-2col animate-on-scroll fade-in" style={{ gap: '3rem', alignItems: 'start', marginBottom: '3rem' }}>
            <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1.5rem' }}>
              <h4 className="sub-section-title" style={{ color: '#60a5fa', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
                Junior High Division (Grades 6-8)
              </h4>
              <p style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '1rem', marginBottom: '1.25rem', textAlign: 'left', maxWidth: '100%' }}>
                Students in grades 6, 7, and 8 who have not competed before are eligible for the <span className="category-badge badge-jr-beg">Junior Beginner</span> category, but may compete in the <span className="category-badge badge-jr-open">Junior Open</span> category if they wish. Other junior high students must compete in <span className="category-badge badge-jr-open">Junior Open</span>.
              </p>
              <p style={{ lineHeight: '1.6', color: '#94a3b8', fontSize: '0.95rem', marginBottom: 0, textAlign: 'left', maxWidth: '100%' }}>
                All junior high students will compete together in rounds, but awards and breaks will be separated.
              </p>
            </div>
            <div style={{ borderLeft: '4px solid #f97316', paddingLeft: '1.5rem' }}>
              <h4 className="sub-section-title" style={{ color: '#fdba74', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
                Senior High Division (Grades 9-12)
              </h4>
              <p style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '1rem', marginBottom: '1.25rem', textAlign: 'left', maxWidth: '100%' }}>
                Students in grades 9, 10, and 11 who have not competed before are eligible for the <span className="category-badge badge-sr-beg">Senior Beginner</span> category, but may compete in the <span className="category-badge badge-sr-open">Senior Open</span> category if they wish. Other senior high students must compete in <span className="category-badge badge-sr-open">Senior Open</span>.
              </p>
              <p style={{ lineHeight: '1.6', color: '#94a3b8', fontSize: '0.95rem', marginBottom: 0, textAlign: 'left', maxWidth: '100%' }}>
                All senior high students will compete together in rounds, but awards and breaks will be separated.
              </p>
            </div>
          </div>

          <div className="hybrid-info-panel animate-on-scroll fade-in" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1rem', padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', textAlign: 'left', marginBottom: '1rem' }}>
            <div style={{ flexShrink: 0, background: 'rgba(147, 197, 253, 0.1)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#93c5fd', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            </div>
            <div>
              <h4 style={{ color: '#f8fafc', marginTop: 0, fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600, textAlign: 'left' }}>
                Hybrid & Mixed-Grade Teams
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, textAlign: 'left', maxWidth: '100%' }}>
                Hybrid teams of debaters that completed different grades are permitted; however, they will compete in the
                category that is the most senior of the two debaters. For example, if a grade 9 student debates with a
                grade 7 student, they will only be eligible for the <span className="category-badge badge-jr-open">Junior Open</span> category. Teams consisting of a junior high student and a high school student are also
                allowed; they will compete in the <span className="category-badge badge-sr-any">Senior</span> categories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Judging & Awards Section */}
      <section className="section alt" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '15%', right: '7%', width: '150px', height: '150px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a5 5 0 0 0-5 5v3c0 2.76 2.24 5 5 5s5-2.24 5-5V7a5 5 0 0 0-5-5z"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '25%', left: '5%', width: '130px', height: '130px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Judging & Awards</span></h2>
          </div>
          <div className="grid-2col">
            <article className="card animate-on-scroll lift-out-shadow" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2.25rem' }}>
              <h3 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 700, textAlign: 'center' }}>Judging & Spectating</h3>
              <p>
                Judging will be provided by experienced university debaters, allowing for quality judging and personalized
                feedback. Parents and other spectators are permitted if all debaters in the room are comfortable with it.
              </p>
            </article>
            <article className="card animate-on-scroll lift-out-shadow" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2.25rem' }}>
              <h3 style={{ color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 700, textAlign: 'center' }}>Awards Categories</h3>
              <p>
                Awards will be given to teams and speakers in the following categories: Junior Beginner, Junior Open,
                Senior Beginner, Senior Open.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '20%', left: '6%', width: '120px', height: '120px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '10%', right: '7%', width: '140px', height: '140px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header straddle animate-on-scroll fade-in-left">
            <h2 className="title-box"><span>Registration</span></h2>
          </div>

          <div className="animate-on-scroll fade-in" style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
            <div className="deadlines-grid">
              {/* Registration Card */}
              <div className="deadline-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0, border: 'none', padding: 0, textAlign: 'left', fontWeight: 600 }}>
                    Registration Deadline
                  </h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa', margin: '0.5rem 0', textAlign: 'left' }}>July 18th, 2026</p>
                <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, textAlign: 'left', lineHeight: 1.5, maxWidth: '100%' }}>
                  Please complete the <Link to="/events/calgary-summer-cup/registration" style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>registration form</Link> by this date to participate.
                </p>
              </div>

              {/* Fees Card */}
              <div className="deadline-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0, border: 'none', padding: 0, textAlign: 'left', fontWeight: 600 }}>
                    Payment Deadline
                  </h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5', margin: '0.5rem 0', textAlign: 'left' }}>July 20th, 2026</p>
                <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, textAlign: 'left', lineHeight: 1.5, maxWidth: '100%' }}>
                  Fee is <strong>$30 per debater</strong>. Send e-transfer payments to <a href="mailto:ucds.debate@gmail.com" style={{ color: '#60a5fa', textDecoration: 'underline' }}>ucds.debate@gmail.com</a>.
                </p>
              </div>
            </div>

            <div className="card animate-on-scroll lift-out-shadow" style={{ padding: '3rem 2rem', marginBottom: '3rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', color: '#1e3a8a', marginTop: 0, marginBottom: '1.25rem', fontWeight: 700, borderBottom: 'none', paddingBottom: 0 }}>
                Ready to Register?
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '2rem', maxWidth: '30rem', marginLeft: 'auto', marginRight: 'auto' }}>
                Sign up today to secure your spot in the Calgary Summer Cup 2026.
              </p>
              <Link to="/events/calgary-summer-cup/registration" className="cta-btn-black large-cta-btn" style={{ textDecoration: 'none' }}>
                Register for Calgary Summer Cup
              </Link>
            </div>

            <p style={{ fontSize: '1rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
              If you have any questions or concerns, please do not hesitate to reach out to <a href="mailto:ucds.debate@gmail.com" style={{ color: '#60a5fa', textDecoration: 'underline' }}>ucds.debate@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
