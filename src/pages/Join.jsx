import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Join() {
  const navigate = useNavigate();
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [eeTriggered, setEeTriggered] = useState(false);

  const canvasRef = useRef(null);
  const specialBtnRef = useRef(null);

  // Audio elements
  const bgAudioRef = useRef(null);
  const layer2AudioRef = useRef(null);
  const layer3AudioRef = useRef(null);
  const eeAudioRef = useRef(null);

  // Animation math states
  const animationFrameIdRef = useRef(null);
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const starsRef = useRef([]);

  // Hover timer state
  const hoverStartTimeRef = useRef(0);
  const isHoveringRef = useRef(false);

  // Accretion disk variables
  const bhRadiusRef = useRef(0);
  const voidHoverProgressRef = useRef(0);

  // Open google form
  const handleCommence = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScF8JDuM1xkYcl47M0PffvOLgXThYukyjkn3FaghPwiPgIsNg/viewform', '_blank');
    navigate('/join/welcome');
  };

  useEffect(() => {
    // Generate Stars
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let canvasW = window.innerWidth;
    let canvasH = window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;

    const starColors = ['#f0f4ff', '#f4f6ff', '#ffffff', '#fffdf5', '#fffcf0'];
    const tempStars = [];
    for (let i = 0; i < 600; i++) {
      const startX = Math.random() * canvasW;
      const startY = Math.random() * canvasH;
      tempStars.push({
        x: startX,
        y: startY,
        baseX: startX,
        baseY: startY,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: Math.random() * 1.5 + 0.5,
        angle: Math.random() * Math.PI * 2,
        swaySpeed: (Math.random() - 0.5) * 0.08,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        isAccretion: false,
        history: []
      });
    }
    starsRef.current = tempStars;

    // Track mouse
    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    // Track resize
    const handleResize = () => {
      const widthRatio = window.innerWidth / canvasW;
      const heightRatio = window.innerHeight / canvasH;
      canvasW = window.innerWidth;
      canvasH = window.innerHeight;
      canvas.width = canvasW;
      canvas.height = canvasH;
      starsRef.current.forEach(star => {
        star.x *= widthRatio;
        star.y *= heightRatio;
        star.baseX *= widthRatio;
        star.baseY *= heightRatio;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Audio Playback Handler
    const playAudio = () => {
      if (bgAudioRef.current) bgAudioRef.current.play().catch(() => {});
      if (layer2AudioRef.current) layer2AudioRef.current.play().catch(() => {});
      if (layer3AudioRef.current) layer3AudioRef.current.play().catch(() => {});
      if (eeAudioRef.current) eeAudioRef.current.play().catch(() => {});
    };

    ['click', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, playAudio, { once: true });
    });

    // Star animation loop
    let targetScale = 1;
    let currentScale = 1;
    let time = 0;
    let currentDistance = 1000;
    let lastScrollX = window.scrollX;
    let lastScrollY = window.scrollY;

    const animate = () => {
      const specialBtn = specialBtnRef.current;
      if (!specialBtn) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = specialBtn.getBoundingClientRect();
      const bhX = rect.left + rect.width / 2;
      const bhY = rect.top + rect.height / 2;

      // Mouse distance
      const dx = Math.max(rect.left - mousePosRef.current.x, 0, mousePosRef.current.x - rect.right);
      const dy = Math.max(rect.top - mousePosRef.current.y, 0, mousePosRef.current.y - rect.bottom);
      currentDistance = Math.hypot(dx, dy);

      // Scroll changes
      const currentScrollX = window.scrollX;
      const currentScrollY = window.scrollY;
      const scrollDeltaX = currentScrollX - lastScrollX;
      const scrollDeltaY = currentScrollY - lastScrollY;
      lastScrollX = currentScrollX;
      lastScrollY = currentScrollY;

      if (scrollDeltaX !== 0 || scrollDeltaY !== 0) {
        starsRef.current.forEach(star => {
          if (!star.isAccretion) {
            star.x -= scrollDeltaX;
            star.y -= scrollDeltaY;
          }
          star.baseX -= scrollDeltaX;
          star.baseY -= scrollDeltaY;
          if (star.history) {
            star.history.forEach(p => {
              p.x -= scrollDeltaX;
              p.y -= scrollDeltaY;
            });
          }
        });
      }

      // Check 20 seconds hover
      if (isHoveringRef.current && !eeTriggered && hoverStartTimeRef.current > 0) {
        if (Date.now() - hoverStartTimeRef.current >= 20000) {
          setEeTriggered(true);
        }
      }

      // Render starfield
      if (effectsEnabled) {
        ctx.fillStyle = eeTriggered ? '#000000' : 'transparent';
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Black Hole Growth
        if (eeTriggered) {
          bhRadiusRef.current += (45 - bhRadiusRef.current) * 0.02;
        }

        // Button scaling
        if (document.body.classList.contains('no-animations')) {
          currentScale = targetScale;
          if (!eeTriggered) specialBtn.style.transform = `scale(${currentScale})`;
        } else {
          currentScale += (targetScale - currentScale) * 0.15;
          const closeness = Math.max(0, 1 - (currentDistance / 400));
          const speed = 0.1 + (closeness * 0.4);
          const amplitude = closeness * 5;
          const jitter = closeness * 10;
          time += speed;
          if (!eeTriggered) {
            specialBtn.style.transform = `translate(${(Math.random() - 0.5) * jitter}px, ${(Math.random() - 0.5) * jitter}px) scale(${currentScale}) rotate(${Math.sin(time) * amplitude}deg)`;
          }
        }

        const backStars = [];
        const frontStars = [];

        starsRef.current.forEach(star => {
          if (eeTriggered) {
            // Accretion disk physics
            if (!star.isAccretion) {
              star.isAccretion = true;
              star.history = [];
              star.orbitRadius = 45 + Math.pow(Math.random(), 2) * 200;
              star.orbitAngle = Math.random() * Math.PI * 2;
              const distOffset = star.orbitRadius - 45;
              const hue = Math.max(0, 45 - (distOffset * 0.2) + (Math.random() - 0.5) * 15);
              const lightness = Math.max(15, 95 - (distOffset * 0.4) + (Math.random() - 0.5) * 20);
              star.color = `hsl(${hue}, 100%, ${lightness}%)`;
              star.size = Math.random() * 2 + 0.5;
            }

            const speed = 30 / Math.pow(star.orbitRadius, 1.5);
            star.orbitAngle += speed;
            const tilt = 0.25;
            let diskX = Math.cos(star.orbitAngle) * star.orbitRadius;
            let diskY = Math.sin(star.orbitAngle) * star.orbitRadius * tilt;
            const diskRot = 15 * (Math.PI / 180);
            
            star.x = bhX + diskX * Math.cos(diskRot) - diskY * Math.sin(diskRot);
            star.y = bhY + diskX * Math.sin(diskRot) + diskY * Math.cos(diskRot);
            const z = Math.sin(star.orbitAngle);

            if (!star.history) star.history = [];
            star.history.push({ x: star.x, y: star.y, z });
            if (star.history.length > 8) star.history.shift();

            if (z < 0) {
              backStars.push(star);
            } else {
              frontStars.push(star);
            }
          } else {
            // Gravitational pull to cursor
            const dxStar = mousePosRef.current.x - star.x;
            const dyStar = mousePosRef.current.y - star.y;
            const dist = Math.hypot(dxStar, dyStar);

            if (isHoveringRef.current) {
              const pullStrength = 0.15 + Math.max(0, 1 - dist / 1000) * 1.5;
              star.vx += Math.cos(Math.atan2(dyStar, dxStar)) * pullStrength;
              star.vy += Math.sin(Math.atan2(dyStar, dxStar)) * pullStrength;
              if (dist < 40) {
                star.x = Math.random() > 0.5 ? -20 : canvasW + 20;
                star.y = Math.random() * canvasH;
                star.vx = 0;
                star.vy = 0;
                star.history = [];
              }
            } else {
              const force = Math.max(0, 1 - dist / 1500) * 0.12;
              star.vx += Math.cos(Math.atan2(dyStar, dxStar)) * force;
              star.vy += Math.sin(Math.atan2(dyStar, dxStar)) * force;
              star.vx += (star.baseX - star.x) * 0.005;
              star.vy += (star.baseY - star.y) * 0.005;
            }

            star.vx *= 0.92;
            star.vy *= 0.92;
            star.x += star.vx;
            star.y += star.vy;

            if (!star.history) star.history = [];
            star.history.push({ x: star.x, y: star.y, z: 1 });
            if (star.history.length > 8) star.history.shift();

            frontStars.push(star);
          }
        });

        // Draw Lensed Stars
        const drawStar = (star, isBackStar = false) => {
          const applyLensing = (x, y, z) => {
            if (!eeTriggered || bhRadiusRef.current <= 0 || z >= 0) return { x, y };
            const dxL = x - bhX;
            const dyL = y - bhY;
            const distL = Math.hypot(dxL, dyL);
            if (distL > 0.1) {
              const einsteinRadius = bhRadiusRef.current * 1.15;
              const halfDist = distL / 2;
              const apparentDist = halfDist + Math.sqrt(halfDist * halfDist + einsteinRadius * einsteinRadius);
              let warp = apparentDist - distL;
              warp *= Math.min(1, -z * 3);
              return { x: x + (dxL / distL) * warp, y: y + (dyL / distL) * warp };
            }
            return { x, y };
          };

          const len = star.history ? star.history.length : 0;
          if (len > 1) {
            ctx.lineWidth = star.size * 1.5;
            ctx.strokeStyle = star.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            const startP = applyLensing(star.history[0].x, star.history[0].y, star.history[0].z);
            ctx.moveTo(startP.x, startP.y);
            for (let i = 1; i < len; i++) {
              const p = applyLensing(star.history[i].x, star.history[i].y, star.history[i].z);
              ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }

          const currentZ = len > 0 ? star.history[len - 1].z : (isBackStar ? -1 : 1);
          const headPos = applyLensing(star.x, star.y, currentZ);
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(headPos.x, headPos.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        };

        // Draw background stars
        backStars.forEach(s => drawStar(s, true));

        // Draw Black Hole event horizon
        if (eeTriggered && bhRadiusRef.current > 0) {
          const halo = ctx.createRadialGradient(bhX, bhY, bhRadiusRef.current, bhX, bhY, bhRadiusRef.current * 6);
          halo.addColorStop(0, 'rgba(255, 180, 100, 0.25)');
          halo.addColorStop(0.3, 'rgba(100, 150, 255, 0.1)');
          halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(bhX, bhY, bhRadiusRef.current * 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 20 + voidHoverProgressRef.current * 20;
          ctx.shadowColor = `rgba(255, 150, 50, 0.7)`;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(bhX, bhY, bhRadiusRef.current, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw foreground stars
        frontStars.forEach(s => drawStar(s, false));
      } else {
        ctx.clearRect(0, 0, canvasW, canvasH);
      }

      // Audio volume fades based on distance
      if (bgAudioRef.current) {
        let targetVol1 = 0.05;
        if (currentDistance <= 1500 && currentDistance > 400) {
          const closeness = 1 - ((currentDistance - 400) / 1100);
          targetVol1 = 0.05 + (closeness * 0.45);
        } else if (currentDistance <= 400) {
          targetVol1 = 0.5;
        }

        if (eeTriggered) targetVol1 = 0;
        if (isMuted || !effectsEnabled) targetVol1 = 0;
        bgAudioRef.current.volume += (targetVol1 - bgAudioRef.current.volume) * 0.1;

        if (layer2AudioRef.current) {
          let targetVol2 = 0;
          if (!eeTriggered) {
            if (currentDistance <= 750 && currentDistance > 500) {
              targetVol2 = (1 - ((currentDistance - 500) / 250)) * 0.5;
            } else if (currentDistance <= 500 && currentDistance > 250) {
              targetVol2 = ((currentDistance - 250) / 250) * 0.5;
            }
          }
          if (isMuted || !effectsEnabled) targetVol2 = 0;
          layer2AudioRef.current.volume += (targetVol2 - layer2AudioRef.current.volume) * 0.1;
        }

        if (layer3AudioRef.current) {
          let targetVol3 = 0;
          if (!eeTriggered) {
            targetVol3 = currentDistance <= 500 ? 1 - (currentDistance / 500) : 0;
          }
          if (isMuted || !effectsEnabled) targetVol3 = 0;
          layer3AudioRef.current.volume += (targetVol3 - layer3AudioRef.current.volume) * 0.1;
        }

        if (eeAudioRef.current) {
          let targetVolEE = eeTriggered ? 1.0 : 0;
          if (isMuted || !effectsEnabled) targetVolEE = 0;
          eeAudioRef.current.volume += (targetVolEE - eeAudioRef.current.volume) * 0.05;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [eeTriggered, effectsEnabled, isMuted]);

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    hoverStartTimeRef.current = Date.now();
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    hoverStartTimeRef.current = 0;
  };

  return (
    <main>
      {/* Audio tags */}
      <audio ref={bgAudioRef} src="/audio/button_proximity_1.mp3" loop />
      <audio ref={layer2AudioRef} src="/audio/button_proximity_2.mp3" loop />
      <audio ref={layer3AudioRef} src="/audio/button_proximity_3.mp3" loop />
      <audio ref={eeAudioRef} src="/audio/blackhole_easteregg.mp3" loop />

      {/* Starfield overlay canvas */}
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 101,
          opacity: eeTriggered ? 1 : 0.45,
          transition: eeTriggered ? 'none' : 'opacity 0.8s ease'
        }}
      />

      <div className="mute-container" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', zIndex: 105, position: 'relative', padding: '1rem 0' }}>
        <label className="mute-toggle-label" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#cbd5e1' }}>
          <input 
            type="checkbox" 
            checked={effectsEnabled}
            onChange={(e) => setEffectsEnabled(e.target.checked)} 
            style={{ marginRight: '6px' }}
          />
          Enable Special Effects
        </label>
        <label className="mute-toggle-label" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#cbd5e1' }}>
          <input 
            type="checkbox" 
            checked={isMuted} 
            onChange={(e) => setIsMuted(e.target.checked)}
            style={{ marginRight: '6px' }}
          />
          Mute Audio
        </label>
      </div>

      <section className="section" style={{ zIndex: 102, position: 'relative' }}>
        <div className="container">
          <div className="section-header" style={{ opacity: eeTriggered ? 0 : 1, transition: 'opacity 1s ease' }}>
            <h1>Join the Debate Society</h1>
          </div>
          <p className="section-copy" style={{ opacity: eeTriggered ? 0 : 1, transition: 'opacity 1s ease' }}>
            Become a part of our vibrant community. Whether you are an experienced debater or just starting, UCDS offers a platform to grow, learn, and compete. Joining is easy and opens up a world of opportunities.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '3rem auto 0' }}>
            <article 
              id="member-card" 
              className="card"
              style={{
                opacity: eeTriggered ? 0 : 1,
                transition: 'opacity 1.2s ease',
                background: '#112854',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '2.5rem',
                borderRadius: '12px'
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '1.5rem', color: '#60a5fa', marginBottom: '1rem', fontWeight: 700 }}>Become a Member</h3>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                Sign up through the Google Form to become an official member. All members have access to all our training sessions, workshops, and social events. To vote and compete, you must pay club fees.
              </p>
            </article>
          </div>

          <section className="spacer"></section>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            {!eeTriggered ? (
              <button 
                ref={specialBtnRef} 
                className="button special-join-button" 
                onClick={handleCommence}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ padding: '1rem 3.5rem', fontSize: '1.25rem', fontWeight: 'bold', zIndex: 104 }}
              >
                Commence
              </button>
            ) : (
              <div style={{ animation: 'fadeIn 2s ease', zIndex: 105, position: 'relative' }}>
                <Link 
                  to="/void"
                  style={{
                    display: 'inline-block',
                    color: '#ff3c00',
                    textDecoration: 'none',
                    fontFamily: 'monospace',
                    fontSize: '1.5rem',
                    border: '1px solid #ff3c00',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    boxShadow: '0 0 15px rgba(255, 60, 0, 0.4)'
                  }}
                >
                  enter the void
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
