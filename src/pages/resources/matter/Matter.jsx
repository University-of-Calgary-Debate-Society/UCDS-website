import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Matter() {
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
        
        // Add drop shadow glow when cursor is near - Green Tinted
        if (this.opacity > this.baseOpacity + 0.05) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(34, 197, 94, 0.9)'; // Green shadow
          ctx.fillStyle = `rgba(187, 247, 208, ${this.opacity})`; // Light green glowing particle
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(34, 197, 94, ${this.opacity})`; // Green particle
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

      // 2. Draw Network Lines between close nodes - Green Tinted
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

            ctx.strokeStyle = `rgba(34, 197, 94, ${opacity})`; // Green lines
            ctx.lineWidth = opacity > 0.3 ? 1.4 : opacity > 0.15 ? 0.9 : 0.6;
            ctx.stroke();
          }
        }
      }

      // 3. Draw clean connection line directly to mouse pointer - Green Tinted
      if (mouse.active) {
        particles.forEach(p => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const limit = 150;
          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            const opacity = (1 - dist / limit) * 0.45; // Increased line to mouse opacity
            ctx.strokeStyle = `rgba(187, 247, 208, ${opacity})`; // Light green line to cursor
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
      {/* Animated interactive neural network background (Green Tinted) */}
      <canvas ref={canvasRef} className="resources-bg-decorations" />
      
      <section className="section" style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '3rem' }}>
            <h1>Matter Files</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginTop: '1rem', maxWidth: '600px', marginInline: 'auto' }}>
              Subject briefs, case libraries, and topic guides to build a strong background knowledge base for impromptu debates.
            </p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
            <div className="card" style={{ background: 'rgba(17, 40, 84, 0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>International Relations Briefing</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  A detailed summary of global alliances, conflict zones, trade treaties, security networks, and key foreign policy theories (Realism vs. Liberalism).
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: 'rgba(17, 40, 84, 0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Economics & Finance Cases</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Core economic mechanisms explained: central banking, inflation control, fiscal stimulus, carbon pricing, trade tariffs, and gig economy regulations.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: 'rgba(17, 40, 84, 0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Social Justice & Law Files</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Guides on legal philosophy, criminal justice reforms, civil rights history, intellectual property disputes, and identity politics debates.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>
          </div>

          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <Link to="/resources" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to Resources Overview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
