import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const BookIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const YouTubeIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const HeadphoneIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const NoteIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export default function Resources() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = canvas.width = canvas.parentElement.scrollWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement.scrollHeight || 1200;

    const particles = [];
    const particleCount = Math.min(150, Math.floor((width * height) / 7000)); // Increased node density

    // Mouse tracker
    const mouse = { x: null, y: null, active: false };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseRadius = Math.random() * 2.0 + 2.0; // Larger base radius for visibility (2.0 to 4.0px)
        this.radius = this.baseRadius;
        this.baseOpacity = Math.random() * 0.12 + 0.22; // More visible base opacity (0.22 to 0.34)
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
          const limit = 160;

          if (dist < limit) {
            const factor = 1 - dist / limit;
            this.opacity = Math.min(0.95, this.baseOpacity + factor * 0.60); // Glowing opacity
            this.radius = this.baseRadius + factor * 3.0; // Larger pulse
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
        
        // Add drop shadow glow when cursor is near
        if (this.opacity > this.baseOpacity + 0.05) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(96, 165, 250, 0.9)';
          ctx.fillStyle = `rgba(186, 218, 255, ${this.opacity})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(96, 165, 250, ${this.opacity})`;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for lines
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
      width = canvas.width = canvas.parentElement.scrollWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.scrollHeight || 1200;
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

      // 2. Draw Network Lines between close nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const limit = 115;

          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            let opacity = (1 - dist / limit) * 0.22; // Base line opacity increased

            // Highlight connections close to mouse pointer
            if (mouse.active) {
              const d1 = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
              const d2 = Math.hypot(p2.x - mouse.x, p2.y - mouse.y);
              if (d1 < 160 || d2 < 160) {
                const mouseFactor = Math.max(1 - d1 / 160, 1 - d2 / 160);
                opacity += mouseFactor * 0.40;
              }
            }

            ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
            ctx.lineWidth = opacity > 0.3 ? 1.4 : opacity > 0.15 ? 0.9 : 0.6;
            ctx.stroke();
          }
        }
      }

      // 3. Draw clean connection line directly to mouse pointer
      if (mouse.active) {
        particles.forEach(p => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const limit = 150;
          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            const opacity = (1 - dist / limit) * 0.45; // Increased line to mouse opacity
            ctx.strokeStyle = `rgba(165, 203, 255, ${opacity})`;
            ctx.lineWidth = 1.2;
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
    <main className="resources-page-container">
      {/* Animated interactive neural network background */}
      <canvas ref={canvasRef} className="resources-bg-decorations" />

      <section className="section" style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header">
            <h2>Resources</h2>
          </div>
          <p className="section-copy" style={{ marginBottom: '3rem' }}>
            Browse our libraries of bylaws, training guides, subject briefs, and external materials.
          </p>
          
          <div className="resources-card-grid">
            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Internal Resources</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Access our governing bylaws, organizational policies, constitution, general meeting minutes, and executive roles.
                </p>
              </div>
              <Link to="/resources/internal" className="button" style={{ width: 'fit-content' }}>
                Browse Internal
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Practice & Training</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Prepare for practices and tournaments with motion archives, debate training quicksheets, and adjudication guides.
                </p>
              </div>
              <Link to="/resources/practice" className="button" style={{ width: 'fit-content' }}>
                Browse Training
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>External Resources</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Explore directories, external debate platforms, governing organizations, and useful online debate tools.
                </p>
              </div>
              <Link to="/resources/external" className="button" style={{ width: 'fit-content' }}>
                Explore External
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Matter Files</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Build your background knowledge with comprehensive subject briefs, case libraries, and topic quick-guides.
                </p>
              </div>
              <Link to="/resources/matter" className="button" style={{ width: 'fit-content' }}>
                View Matter Files
              </Link>
            </div>
          </div>

          {/* Recommended resources section */}
          <div className="recommended-section">
            <div className="recommended-header">
              <h3>Recommended Resources</h3>
              <p>Highly recommended external tools and platforms to help you master debating and public speaking.</p>
            </div>
            <div className="recommended-grid">
              <a href="https://www.youtube.com/@DebateLand" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <YouTubeIcon size={20} style={{ color: '#ef4444' }} />
                  Debate Land / Hello Debate
                </h4>
                <p>An amazing YouTube channel offering visual tutorials, guides, and lessons covering British Parliamentary debate theory.</p>
              </a>
              
              <a href="https://cusid.ca" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <BookIcon size={20} style={{ color: '#60a5fa' }} />
                  CUSID Website
                </h4>
                <p>The central hub for the Canadian University Society for Intercollegiate Debate. Check tournament schedules, bids, and bylaws.</p>
              </a>
              
              <a href="https://www.hellodebate.jp/motions/" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <NoteIcon size={20} style={{ color: '#34d399' }} />
                  World Motions Database
                </h4>
                <p>Browse a comprehensive, categorized collection of debate motions from major regional and international championships.</p>
              </a>
              
              <a href="https://openev.pages.dev/" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <HeadphoneIcon size={20} style={{ color: '#facc15' }} />
                  Open Debating Resources
                </h4>
                <p>A collection of open-source debate files, lecture notes, research briefs, and templates shared by debaters worldwide.</p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
