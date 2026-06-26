import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

export default function Home() {
  const isMobile = useIsMobile();
  const [animationsDisabled, setAnimationsDisabled] = useState(
    localStorage.getItem('animationsDisabled') === 'true'
  );

  const aboutRef = useRef(null);
  const missionRef = useRef(null);

  // Parallax refs
  const aboutBgRef = useRef(null);
  const mtnBackRef = useRef(null);
  const mtnMiddleRef = useRef(null);
  const mtnFrontRef = useRef(null);
  const elevatorRef = useRef(null);

  const missionBgRef = useRef(null);
  const bubblesRefs = useRef([]);
  const shadowsRefs = useRef([]);

  const toggleAnimations = () => {
    const newState = !animationsDisabled;
    setAnimationsDisabled(newState);
    localStorage.setItem('animationsDisabled', String(newState));
    if (newState) {
      document.body.classList.add('no-animations');
      // Reset styles
      resetParallaxStyles();
    } else {
      document.body.classList.remove('no-animations');
    }
  };

  const resetParallaxStyles = () => {
    if (aboutBgRef.current) aboutBgRef.current.style.transform = '';
    if (mtnBackRef.current) mtnBackRef.current.style.transform = '';
    if (mtnMiddleRef.current) mtnMiddleRef.current.style.transform = '';
    if (mtnFrontRef.current) mtnFrontRef.current.style.transform = '';
    if (elevatorRef.current) elevatorRef.current.style.transform = '';
    if (missionBgRef.current) missionBgRef.current.style.transform = '';

    bubblesRefs.current.forEach((el) => { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
    shadowsRefs.current.forEach((el) => { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
  };

  useEffect(() => {
    if (animationsDisabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }

    const handleScroll = () => {
      if (animationsDisabled) return;

      const winHeight = window.innerHeight;

      // 1. About Us Section Parallax
      if (aboutRef.current) {
        const rect = aboutRef.current.getBoundingClientRect();
        const totalHeight = rect.height + winHeight;
        const currentDistance = winHeight - rect.top;
        let progress = currentDistance / totalHeight;
        progress = Math.max(0, Math.min(1, progress));

        if (aboutBgRef.current) {
          const yOffset = (progress - 0.5) * 80;
          aboutBgRef.current.style.transform = `translateY(calc(-50% + ${yOffset}px))`;
        }

        const xBack = (progress - 0.5) * -18;
        const xMiddle = (progress - 0.5) * 40;
        const xFront = (progress - 0.5) * -65;
        const yElevator = (1 - progress) * 130;

        if (mtnBackRef.current) mtnBackRef.current.style.transform = `translateX(${xBack}px)`;
        if (mtnMiddleRef.current) mtnMiddleRef.current.style.transform = `translateX(${xMiddle}px)`;
        if (mtnFrontRef.current) mtnFrontRef.current.style.transform = `translateX(${xFront}px)`;
        if (elevatorRef.current) elevatorRef.current.style.transform = `translateY(${yElevator}px)`;
      }

      // 2. Mission Section Parallax
      if (missionRef.current) {
        const rect = missionRef.current.getBoundingClientRect();
        const totalHeight = rect.height + winHeight;
        const currentDistance = winHeight - rect.top;
        let progress = currentDistance / totalHeight;
        progress = Math.max(0, Math.min(1, progress));

        if (missionBgRef.current) {
          const yOffset = (progress - 0.5) * 80;
          missionBgRef.current.style.transform = `translateY(calc(-50% + ${yOffset}px))`;
        }

        for (let i = 1; i <= 4; i++) {
          const bubble = bubblesRefs.current[i];
          const shadow = shadowsRefs.current[i];

          if (!bubble && !shadow) continue;

          const startPhase = (i - 1) * 0.08;
          const endPhase = startPhase + 0.18;
          let bubbleProgress = (progress - startPhase) / (endPhase - startPhase);
          bubbleProgress = Math.max(0, Math.min(1, bubbleProgress));

          const bubbleY = 80 - (bubbleProgress * 180);
          const scale = bubbleProgress < 0.1 ? bubbleProgress * 10 : 1;
          const opacity = bubbleProgress < 0.15 ? (bubbleProgress / 0.15) : 1;

          if (bubble) {
            bubble.style.transform = `translateY(${bubbleY}px) scale(${scale})`;
            bubble.style.transformOrigin = '200px 200px';
            bubble.style.opacity = String(opacity);
          }

          if (shadow) {
            const shadowX = (bubbleProgress * 30);
            shadow.style.transform = `translate(${shadowX}px, ${bubbleY * 0.5}px) scale(${scale})`;
            shadow.style.transformOrigin = '200px 200px';
            shadow.style.opacity = String(opacity * 0.25);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger scroll math on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [animationsDisabled]);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-center">
          <div className={`hero-intro animate-fade-in-up ${isMobile ? 'hero-strip' : ''}`}>
            <h1>Welcome to the UCDS!</h1>
            <p className="hero-subtitle">University of Calgary Debate Society</p>
            <div className="hero-actions">
              <Link className="button" to="/events">Events</Link>
              <Link className="button button-secondary" to="/join">Get Involved</Link>
              <button 
                id="toggleAnimationsBtn" 
                className="button button-secondary"
                onClick={toggleAnimations}
              >
                {animationsDisabled ? 'Enable Animations' : 'Disable Animations'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="section">
        <div ref={aboutBgRef} className="section-bg-decor" aria-hidden="true">
          <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="140" className="accent-glow" fill="#3b82f6" />
            <polygon points="50,280 200,200 350,280 200,360" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
            <line x1="125" y1="240" x2="275" y2="320" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1="275" y1="240" x2="125" y2="320" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />

            {/* Back Mountains */}
            <g ref={mtnBackRef} className="mtn-back" style={{ willChange: 'transform' }}>
              <polygon points="60,250 110,160 110,250" fill="#1e293b" />
              <polygon points="110,160 160,250 110,250" fill="#0f172a" />
              <polygon points="220,250 280,140 280,250" fill="#1e293b" />
              <polygon points="280,140 340,250 280,250" fill="#0f172a" />
            </g>

            {/* Middle Mountains */}
            <g ref={mtnMiddleRef} className="mtn-middle" style={{ willChange: 'transform' }}>
              <polygon points="90,265 160,150 160,265" fill="#334155" />
              <polygon points="160,150 230,265 160,265" fill="#1e293b" />
              <polygon points="200,265 260,170 260,265" fill="#334155" />
              <polygon points="260,170 320,265 260,265" fill="#1e293b" />
            </g>

            {/* Front Mountains */}
            <g ref={mtnFrontRef} className="mtn-front" style={{ willChange: 'transform' }}>
              <polygon points="40,280 120,170 120,280" fill="#475569" />
              <polygon points="120,170 200,280 120,280" fill="#334155" />
              <polygon points="150,280 220,180 220,280" fill="#475569" />
              <polygon points="220,180 290,280 220,280" fill="#334155" />
            </g>

            {/* Calgary Tower Shadow */}
            <polygon points="205,285 255,285 330,340 295,345" className="iso-shadow" opacity="0.45" />
            
            {/* Calgary Tower */}
            <g className="calgary-tower" style={{ willChange: 'transform' }}>
              <rect x="200" y="285" width="60" height="3" fill="#64748b" />
              <polygon points="208,285 212,285 221,273 217,273" fill="#94a3b8" />
              <polygon points="252,285 248,285 239,273 243,273" fill="#78879a" />
              <rect x="216" y="271" width="28" height="3" fill="#94a3b8" />
              <rect x="228" y="274" width="4" height="11" fill="#64748b" />

              <polygon points="222,271 230,271 230,132 224,132" fill="#cbd5e1" />
              <polygon points="230,271 238,271 236,132 230,132" fill="#94a3b8" />
              <line x1="230" y1="132" x2="230" y2="271" stroke="#475569" strokeWidth="1" />
              
              {/* Elevator car */}
              <g ref={elevatorRef} className="tower-elevator" style={{ willChange: 'transform' }}>
                <rect x="228.5" y="135" width="3" height="7" rx="0.5" fill="#f59e0b" />
                <rect x="229" y="136.5" width="2" height="2" fill="#ffffff" opacity="0.9" />
              </g>

              <polygon points="224,132 230,132 230,121 218,121" fill="#cbd5e1" />
              <polygon points="230,132 236,132 242,121 230,121" fill="#94a3b8" />
              <polygon points="218,121 230,121 230,117 213,117" fill="#ef4444" />
              <polygon points="230,121 242,121 247,117 230,117" fill="#b91c1c" />
              <polygon points="213,117 230,117 230,105 211,105" fill="#ef4444" />
              <polygon points="230,117 247,117 249,105 230,105" fill="#b91c1c" />
              <polygon points="212,112 230,112 230,109 211.5,109" fill="#1e293b" />
              <polygon points="230,112 248,112 248.5,109 230,109" fill="#0f172a" />
              
              <rect x="228" y="105" width="4" height="12" fill="#ffffff" />
              <rect x="231" y="107" width="1" height="8" fill="#ffffff" opacity="0.6" />
              <rect x="226" y="107" width="1" height="8" fill="#ffffff" opacity="0.6" />
              <rect x="234" y="108" width="1" height="6" fill="#ffffff" opacity="0.4" />
              <rect x="223" y="108" width="1" height="6" fill="#ffffff" opacity="0.4" />

              <ellipse cx="230" cy="105" rx="19.5" ry="2" fill="#475569" />
              <path d="M 211.5,104 C 211.5,98 230,96 230,96 L 230,104 Z" fill="#f8fafc" />
              <path d="M 230,96 C 230,96 248.5,98 248.5,104 L 230,104 Z" fill="#e2e8f0" />
              
              <rect x="226" y="93" width="8" height="4" fill="#64748b" />
              <rect x="228" y="91" width="4" height="2" fill="#475569" />
              <line x1="230" y1="91" x2="230" y2="45" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="230" y1="45" x2="230" y2="35" stroke="#cbd5e1" strokeWidth="0.8" />
            </g>
          </svg>
        </div>

        {/* Floating Icons */}
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '15%', left: '4%', width: '100px', height: '100px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '15%', right: '4%', width: '110px', height: '110px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
        </div>

        {/* Floating Badges */}
        <div className="floating-badge badge-1" aria-hidden="true">
          <span className="badge-icon">🎙️</span>
          <span className="badge-text">Public Speaking</span>
        </div>
        <div className="floating-badge badge-2" aria-hidden="true">
          <span className="badge-icon">💡</span>
          <span className="badge-text">Critical Thinking</span>
        </div>

        <div className="container">
          <div className="text-center-wrapper">
            <div className="glass-card animate-on-scroll fade-in">
              <div className="section-header-inline">
                <h2 className="section-title">About Us</h2>
                <div className="accent-line"></div>
              </div>
              <p className="section-copy">The University of Calgary Debate Society (UCDS) is a vibrant community of students passionate about discussion and competitive debate. We welcome members of all experience levels to join us in improving their public speaking, critical thinking, and advocacy skills.</p>
              <p className="section-copy">Our club hosts regular meetings, workshops, and participates in regional and national tournaments. Whether you're a seasoned debater or completely new to the activity, we welcome all students interested in debate and intellectual discourse.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" ref={missionRef} className="section alt">
        <div ref={missionBgRef} className="section-bg-decor" aria-hidden="true">
          <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="140" className="accent-glow" fill="#ef4444" />
            <polygon points="50,280 200,200 350,280 200,360" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
            <line x1="125" y1="240" x2="275" y2="320" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1="275" y1="240" x2="125" y2="320" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />

            {/* Bubble Shadows */}
            <g className="bubble-shadows" opacity="0.25">
              <polygon ref={(el) => shadowsRefs.current[1] = el} points="75, 150, 165, 127.5, 165, 167.5, 75, 190" className="iso-shadow" />
              <polygon ref={(el) => shadowsRefs.current[2] = el} points="265, 135, 325, 120, 325, 155, 265, 170" className="iso-shadow" />
              <polygon ref={(el) => shadowsRefs.current[3] = el} points="65, 250, 155, 227.5, 155, 267.5, 65, 290" className="iso-shadow" />
              <polygon ref={(el) => shadowsRefs.current[4] = el} points="275, 245, 345, 227.5, 345, 262.5, 275, 280" className="iso-shadow" />
            </g>

            {/* Floating speech bubbles */}
            <g ref={(el) => bubblesRefs.current[1] = el} className="iso-bubble" style={{ willChange: 'transform' }}>
              <polygon points="60, 125, 150, 102.5, 150, 142.5, 60, 165" fill="#3b82f6" />
              <polygon points="150, 102.5, 165, 112.5, 165, 152.5, 150, 142.5" fill="#1d4ed8" />
              <polygon points="80, 160, 95, 156, 75, 185" fill="#3b82f6" />
              <text x="105" y="140" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle" transform="rotate(-14, 105, 140)" style={{ fontFamily: "'Outfit', sans-serif" }}>Resolved!</text>
            </g>
            <g ref={(el) => bubblesRefs.current[2] = el} className="iso-bubble" style={{ willChange: 'transform' }}>
              <polygon points="250, 110, 310, 95, 310, 130, 250, 145" fill="#f59e0b" />
              <polygon points="310, 95, 322, 103, 322, 138, 310, 130" fill="#b45309" />
              <polygon points="260, 142, 275, 139, 255, 162" fill="#f59e0b" />
              <text x="280" y="125" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle" transform="rotate(-14, 280, 125)" style={{ fontFamily: "'Outfit', sans-serif" }}>POI!</text>
            </g>
            <g ref={(el) => bubblesRefs.current[3] = el} className="iso-bubble" style={{ willChange: 'transform' }}>
              <polygon points="50, 225, 140, 202.5, 140, 242.5, 50, 265" fill="#10b981" />
              <polygon points="140, 202.5, 155, 212.5, 155, 252.5, 140, 242.5" fill="#047857" />
              <polygon points="70, 260, 85, 256, 65, 280" fill="#10b981" />
              <text x="95" y="240" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle" transform="rotate(-14, 95, 240)" style={{ fontFamily: "'Outfit', sans-serif" }}>Hear, Hear!</text>
            </g>
            <g ref={(el) => bubblesRefs.current[4] = el} className="iso-bubble" style={{ willChange: 'transform' }}>
              <polygon points="260, 220, 330, 202.5, 330, 237.5, 260, 255" fill="#ef4444" />
              <polygon points="330, 202.5, 342, 210.5, 342, 245.5, 330, 237.5" fill="#b91c1c" />
              <polygon points="270, 252, 285, 248, 265, 272" fill="#ef4444" />
              <text x="295" y="235" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle" transform="rotate(-14, 295, 235)" style={{ fontFamily: "'Outfit', sans-serif" }}>Order!</text>
            </g>
          </svg>
        </div>

        {/* Floating Icons */}
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg className="bg-art" style={{ top: '20%', right: '5%', width: '105px', height: '105px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <svg className="bg-art reverse" style={{ bottom: '20%', left: '5%', width: '95px', height: '95px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 1 3-3h7z"/></svg>
        </div>

        <div className="floating-badge badge-3" aria-hidden="true">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">Competitive Debate</span>
        </div>
        <div className="floating-badge badge-4" aria-hidden="true">
          <span className="badge-icon">🤝</span>
          <span className="badge-text">All Skill Levels</span>
        </div>

        <div className="container">
          <div className="text-center-wrapper">
            <div className="glass-card animate-on-scroll fade-in">
              <div className="section-header-inline">
                <h2 className="section-title">Our Mission</h2>
                <div className="accent-line"></div>
              </div>
              <p className="section-copy">Our mission is to foster a supportive and intellectually stimulating environment where students can engage with complex issues, develop their analytical abilities, and represent the University of Calgary at regional, national, and international debate tournaments.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
