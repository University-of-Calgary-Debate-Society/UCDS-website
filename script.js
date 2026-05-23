async function renderBlogPosts() {
  const blogList = document.getElementById("blogList");
  if (!blogList) {
    return;
  }

  try {
    const isSubpage = document.querySelector('script[src="../script.js"]') !== null;
    const basePath = isSubpage ? '../' : './';
    const response = await fetch(basePath + "data/blog-posts.json");
    if (!response.ok) throw new Error("Could not fetch blog posts");
    const blogPosts = await response.json();

    if (blogPosts.length === 0) {
      blogList.innerHTML = "<p class=\"section-copy\">No blog posts are available at the moment. Check back later for updates.</p>";
      return;
    }

    blogList.innerHTML = blogPosts
      .map(
        post => `
        <article class="card blog-card" style="margin-bottom: 2rem;">
          <div class="blog-meta">
            <span class="blog-date">${post.date}</span>
          </div>
          <h3>${post.title}</h3>
          <details>
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 1rem; color: #3b82f6;">Read Article</summary>
            <div class="blog-content" style="margin-top: 1rem; line-height: 1.6;">
              ${post.content || post.summary}
            </div>
          </details>
        </article>`
      )
      .join("");
  } catch (error) {
    console.error("Error loading blog posts:", error);
    blogList.innerHTML = "<p class=\"section-copy\">Unable to load blog posts at this time.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("currentYear");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  renderBlogPosts();

  // Animation Toggle Logic
  const toggleAnimationsBtn = document.getElementById('toggleAnimationsBtn');
  
  function applyAnimationPreference() {
    const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    if (isAnimationsDisabled) {
      document.body.classList.add('no-animations');
      document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
      if (toggleAnimationsBtn) toggleAnimationsBtn.textContent = 'Enable Animations';
    } else {
      document.body.classList.remove('no-animations');
      if (toggleAnimationsBtn) toggleAnimationsBtn.textContent = 'Disable Animations';
    }
  }

  applyAnimationPreference();

  if (toggleAnimationsBtn) {
    toggleAnimationsBtn.addEventListener('click', () => {
      const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
      localStorage.setItem('animationsDisabled', !isAnimationsDisabled);
      applyAnimationPreference();
    });
  }

  // Smoothly scroll down to section if navigating via an anchor link on page load
  const isAnimationsDisabledOnLoad = localStorage.getItem('animationsDisabled') === 'true';
  if (window.location.hash && !isAnimationsDisabledOnLoad) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.scrollTo(0, 0); // Start at the top during fade-in
      setTimeout(() => {
        // Temporarily disable CSS smooth scrolling to avoid jitter with custom animation
        document.documentElement.style.scrollBehavior = 'auto';
        
        const startPosition = window.scrollY;
        const targetPosition = target.getBoundingClientRect().top + startPosition;
        const distance = targetPosition - startPosition;
        const duration = 1200; // Slower scroll duration in milliseconds (1.2 seconds)
        let start = null;

        function step(timestamp) {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const percentage = Math.min(progress / duration, 1);
          
          // Ease-in-out easing function for smooth deceleration
          const ease = percentage < 0.5 ? 2 * percentage * percentage : 1 - Math.pow(-2 * percentage + 2, 2) / 2;
          
          window.scrollTo(0, startPosition + distance * ease);
          
          if (progress < duration) {
            window.requestAnimationFrame(step);
          } else {
            document.documentElement.style.scrollBehavior = ''; // Restore default
          }
        }
        
        window.requestAnimationFrame(step);
      }, 400); // Trigger scroll midway through the fade-in animation
    }
  }

  // Newsletter Modal Logic
  const modal = document.getElementById('newsletter-modal');
  const openBtn = document.getElementById('openNewsletter');
  const closeBtn = document.getElementById('closeNewsletter');

  if (modal) {
    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(); // Close if user clicks outside the modal
    });
  }

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Smooth opening/closing transitions for all accordion dropdowns
  document.addEventListener('click', function(e) {
    const summary = e.target.closest('summary');
    if (!summary) return;
    
    const details = summary.parentElement;
    if (!details || details.tagName !== 'DETAILS') return;
    
    e.preventDefault();
    
    if (details.open) {
      // Trigger close animation
      details.classList.add('closing');
      setTimeout(() => {
        details.open = false;
        details.classList.remove('closing');
      }, 400);
    } else {
      // Close other open details in the same group
      const parentGroup = details.closest('.profile-details');
      if (parentGroup) {
        const siblings = parentGroup.querySelectorAll('details');
        siblings.forEach(other => {
          if (other !== details && other.open && !other.classList.contains('closing')) {
            other.classList.add('closing');
            setTimeout(() => {
              other.open = false;
              other.classList.remove('closing');
            }, 400);
          }
        });
      }
      
      // Open this one
      details.open = true;
    }
  });

  // Join page background audio setup
  const backgroundAudio = document.getElementById('background-audio');
  const layerAudio = document.getElementById('layer-audio');
  const layerAudio3 = document.getElementById('layer-audio-3');
  const easterEggAudio = document.getElementById('easter-egg-audio');
  if (backgroundAudio) {
    backgroundAudio.volume = 0.05; // Very quiet and ambient
    if (layerAudio) layerAudio.volume = 0; // Start layered audio completely silent
    if (layerAudio3) layerAudio3.volume = 0; // Start third layer completely silent
    if (easterEggAudio) easterEggAudio.volume = 0;

    const playAudio = () => {
      backgroundAudio.play().catch(error => {
        console.log("Background audio playback was prevented by the browser.");
      });
      if (layerAudio) layerAudio.play().catch(e => {});
      if (layerAudio3) layerAudio3.play().catch(e => {});
      if (easterEggAudio) easterEggAudio.play().catch(e => {});
    };

    playAudio();
    ['click', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, playAudio, { once: true });
    });
  }

  // Special Join Button Wobble Logic
  const specialBtn = document.querySelector('.special-join-button');
  if (specialBtn) {
    let currentDistance = 1000;
    let targetScale = 1;
    let currentScale = 1;
    let time = 0;
    let hoverStartTime = 0;
    let easterEggTriggered = false;
    let bhX = 0;
    let bhY = 0;
    let bhRadius = 0;
    let voidHoverProgress = 0;

    // Create black fade overlay with animated stars
    let fadeOverlay = document.getElementById('black-fade-overlay');
    let ctx = null;
    let stars = [];
    let canvasW = window.innerWidth;
    let canvasH = window.innerHeight;
    let mouseX = canvasW / 2;
    let mouseY = canvasH / 2;
    let isHovering = false;

    if (!fadeOverlay) {
      fadeOverlay = document.createElement('canvas');
      fadeOverlay.id = 'black-fade-overlay';
      Object.assign(fadeOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        pointerEvents: 'none',
        zIndex: '101',
        opacity: '0'
      });
      document.body.appendChild(fadeOverlay);

      fadeOverlay.width = canvasW;
      fadeOverlay.height = canvasH;
      ctx = fadeOverlay.getContext('2d');

      // Very subtle, almost indistinguishably white tints
      const starColors = ['#f0f4ff', '#f4f6ff', '#ffffff', '#fffdf5', '#fffcf0'];

      for (let i = 0; i < 800; i++) {
        const startX = Math.random() * canvasW;
        const startY = Math.random() * canvasH;
        stars.push({
          x: startX,
          y: startY,
          baseX: startX,
          baseY: startY,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          size: Math.random() * 1.5 + 0.5,
          angle: Math.random() * Math.PI * 2,
          swaySpeed: (Math.random() - 0.5) * 0.08,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }

      window.addEventListener('resize', () => {
        const widthRatio = window.innerWidth / canvasW;
        const heightRatio = window.innerHeight / canvasH;
        canvasW = window.innerWidth;
        canvasH = window.innerHeight;
        fadeOverlay.width = canvasW;
        fadeOverlay.height = canvasH;
        stars.forEach(star => {
          star.x *= widthRatio;
          star.y *= heightRatio;
          star.baseX *= widthRatio;
          star.baseY *= heightRatio;
        });
      });
    }

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    let lastScrollX = window.scrollX;
    let lastScrollY = window.scrollY;

    specialBtn.addEventListener('mouseenter', () => {
      targetScale = 1.5;
      isHovering = true;
      hoverStartTime = Date.now();
    });
    specialBtn.addEventListener('mouseleave', () => {
      targetScale = 1;
      isHovering = false;
      hoverStartTime = 0;
    });

    function animateButton() {
      if (window.voidHovered) {
        voidHoverProgress += (1 - voidHoverProgress) * 0.05;
      } else {
        voidHoverProgress += (0 - voidHoverProgress) * 0.05;
      }

      const rect = specialBtn.getBoundingClientRect();
      bhX = rect.left + rect.width / 2;
      bhY = rect.top + rect.height / 2;

      const voidBtn = document.getElementById('void-btn');
      if (voidBtn) {
        voidBtn.style.left = bhX + 'px';
        voidBtn.style.top = bhY + 'px';
      }

      const dx = Math.max(rect.left - mouseX, 0, mouseX - rect.right);
      const dy = Math.max(rect.top - mouseY, 0, mouseY - rect.bottom);
      currentDistance = Math.hypot(dx, dy);

      const currentScrollX = window.scrollX;
      const currentScrollY = window.scrollY;
      const scrollDeltaX = currentScrollX - lastScrollX;
      const scrollDeltaY = currentScrollY - lastScrollY;
      lastScrollX = currentScrollX;
      lastScrollY = currentScrollY;

      if (scrollDeltaX !== 0 || scrollDeltaY !== 0) {
        stars.forEach(star => {
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

      // Check for 20-second hover Easter Egg
      if (isHovering && !easterEggTriggered && hoverStartTime > 0) {
        if (Date.now() - hoverStartTime >= 20000) { // 20,000ms = 20 seconds
          easterEggTriggered = true;

          // Wipe the canvas instantly to prevent hover trails from lingering
          if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvasW, canvasH);
          }
          
          specialBtn.style.transform = ''; // Clear inline transform to allow clean CSS animation
          specialBtn.classList.add('collapsing-btn');
          
          const memberCard = document.getElementById('member-card');
          if (memberCard) {
            memberCard.style.transition = 'opacity 1.5s ease';
            memberCard.style.opacity = '0';
          }
          
          // Add Shockwave when collapse finishes
          setTimeout(() => {
            const shockwave = document.createElement('div');
            shockwave.className = 'bh-shockwave';
            shockwave.style.left = (bhX + window.scrollX) + 'px';
            shockwave.style.top = (bhY + window.scrollY) + 'px';
            document.body.appendChild(shockwave);
            
            setTimeout(() => shockwave.remove(), 2500); // Clean up after animation
            
            const voidBtn = document.createElement('a');
            voidBtn.id = 'void-btn';
            voidBtn.href = '../void/index.html';
            
            const voidText = document.createElement('div');
            voidText.className = 'void-text';
            voidText.textContent = 'enter the void';
            
            const voidHitbox = document.createElement('div');
            voidHitbox.className = 'void-hitbox';
            
            voidBtn.appendChild(voidText);
            voidBtn.appendChild(voidHitbox);
            
            voidBtn.addEventListener('mouseenter', () => window.voidHovered = true);
            voidBtn.addEventListener('mouseleave', () => window.voidHovered = false);

            document.body.appendChild(voidBtn);
          }, 1500);

        }
      }

      const effectsToggle = document.getElementById('effectsToggle');
      const effectsEnabled = effectsToggle ? effectsToggle.checked : true;

      if (document.body.classList.contains('no-animations') || !effectsEnabled) {
        currentScale = targetScale; // Snap to scale instantly if animations are disabled
        if (!easterEggTriggered) specialBtn.style.transform = `scale(${currentScale})`;
      } else {
        currentScale += (targetScale - currentScale) * 0.15; // Smooth scale easing
        const closeness = Math.max(0, 1 - (currentDistance / 400)); // 0 (far) to 1 (touching/inside)
        const speed = 0.1 + (closeness * 0.4);
        const amplitude = closeness * 5;
        const jitter = closeness * 10; // Max 10px displacement for jitter
        time += speed;
        if (!easterEggTriggered) {
          specialBtn.style.transform = `translate(${(Math.random() - 0.5) * jitter}px, ${(Math.random() - 0.5) * jitter}px) scale(${currentScale}) rotate(${Math.sin(time) * amplitude}deg)`;
        }
      }

      // Visual fade logic with animated stars
      if (fadeOverlay) {
        let fadeOpacity = 0;
        if (effectsEnabled) {
          if (easterEggTriggered) {
            fadeOpacity = 1; // Permanently black
          } else if (currentDistance <= 600) {
            fadeOpacity = 1 - Math.max(0, (currentDistance - 250) / 350); // Fade in black void
          }
        }
        fadeOverlay.style.opacity = fadeOpacity;

        if (fadeOpacity > 0 && ctx) {
          if (easterEggTriggered) {
            bhRadius += (45 - bhRadius) * 0.02; // Black hole grows outward smoothly
          }

          // Clear canvas to remove trails
          ctx.clearRect(0, 0, canvasW, canvasH);

          const backStars = [];
          const frontStars = [];

          stars.forEach(star => {
            if (easterEggTriggered) {
              // Transform background stars into a fiery accretion disk
              if (!star.isAccretion) {
                star.isAccretion = true;
                star.history = []; // Clear history on transformation
                star.orbitRadius = 45 + Math.pow(Math.random(), 2) * 200; // Cluster closely around the event horizon (45px)
                star.orbitAngle = Math.random() * Math.PI * 2;
                
                // Gradient pattern with randomness: closer = yellow/white, further = red/dark
                const distOffset = star.orbitRadius - 45;
                const hue = Math.max(0, 45 - (distOffset * 0.2) + (Math.random() - 0.5) * 15);
                const lightness = Math.max(15, 95 - (distOffset * 0.4) + (Math.random() - 0.5) * 20);
                star.color = `hsl(${hue}, 100%, ${lightness}%)`;
                star.size = Math.random() * 2 + 0.5;
              }
              
              // Keplerian physics: angular velocity increases exponentially closer to the core
              const speed = 30 / Math.pow(star.orbitRadius, 1.5);
              star.orbitAngle += speed;
              
              // Elliptical math to create a 3D tilt
              const tilt = 0.25;
              let diskX = Math.cos(star.orbitAngle) * star.orbitRadius;
              let diskY = Math.sin(star.orbitAngle) * star.orbitRadius * tilt;
              
              // Rotate the entire disk slightly so it sits diagonally
              const diskRot = 15 * (Math.PI / 180);
              star.x = bhX + diskX * Math.cos(diskRot) - diskY * Math.sin(diskRot);
              star.y = bhY + diskX * Math.sin(diskRot) + diskY * Math.cos(diskRot);
              
              const z = Math.sin(star.orbitAngle);
              
              if (!star.history) star.history = [];
              star.history.push({ x: star.x, y: star.y, z: z });
              if (star.history.length > 8) {
                star.history.shift(); // Trail length of 8 frames
              }

              if (z < 0) {
                backStars.push(star);
              } else {
                frontStars.push(star);
              }
            } else {
              const dxStar = mouseX - star.x;
              const dyStar = mouseY - star.y;
              const dist = Math.hypot(dxStar, dyStar);

              if (isHovering) {
                // Fly in from outside and drift progressively faster to the button
                const pullStrength = 0.15 + Math.max(0, 1 - dist / 1000) * 1.5;
                star.vx += Math.cos(Math.atan2(dyStar, dxStar)) * pullStrength;
                star.vy += Math.sin(Math.atan2(dyStar, dxStar)) * pullStrength;

                // Respawn outside the screen when they reach the button
                if (dist < 40) {
                  const currentDocW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
                  const currentDocH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
                  if (Math.random() > 0.5) {
                    star.x = Math.random() > 0.5 ? -20 : canvasW + 20;
                    star.y = (Math.random() * currentDocH) - window.scrollY;
                  } else {
                    star.x = (Math.random() * currentDocW) - window.scrollX;
                    star.y = Math.random() > 0.5 ? -20 : canvasH + 20;
                  }
                  // Pick a new random base position for when hover ends
                  star.baseX = (Math.random() * currentDocW) - window.scrollX;
                  star.baseY = (Math.random() * currentDocH) - window.scrollY;
                  star.vx = 0;
                  star.vy = 0;
                  star.history = []; // Clear history on teleport
                }
              } else {
                // Stronger gravitational pull towards cursor with a larger radius
                const force = Math.max(0, 1 - dist / 1500) * 0.12;
                star.vx += Math.cos(Math.atan2(dyStar, dxStar)) * force;
                star.vy += Math.sin(Math.atan2(dyStar, dxStar)) * force;

                // Spring force back to base position so they don't wander off
                star.vx += (star.baseX - star.x) * 0.005;
                star.vy += (star.baseY - star.y) * 0.005;
              }
              
              // Friction to limit max speed
              star.vx *= 0.92;
              star.vy *= 0.92;

              star.x += star.vx;
              star.y += star.vy;
              
              if (!star.history) star.history = [];
              star.history.push({ x: star.x, y: star.y, z: 1 });
              if (star.history.length > 8) {
                star.history.shift(); // Trail length of 8 frames
              }

              frontStars.push(star);
            }
          });

          ctx.shadowBlur = 5;
          ctx.shadowBlur = 0; // Disable expensive shadow blur for particles to improve performance
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const drawStar = (star, isBackStar = false) => {
            const applyLensing = (x, y, z) => {
              if (!easterEggTriggered || bhRadius <= 0 || z >= 0) {
                return { x, y };
              }

              const dx = x - bhX;
              const dy = y - bhY;
              const dist = Math.hypot(dx, dy);
              
              if (dist > 0.1) {
                // Real-world Einstein ring physics for gravitational lensing
                const einsteinRadius = bhRadius * 1.15; // Offset slightly to form a bright photon ring
                const halfDist = dist / 2;
                const apparentDist = halfDist + Math.sqrt(halfDist * halfDist + einsteinRadius * einsteinRadius);
                let warp = apparentDist - dist;
                
                // Scale the warp by Z depth to ensure a continuous transition at the edge
                warp *= Math.min(1, -z * 3);
                
                return { x: x + (dx / dist) * warp, y: y + (dy / dist) * warp };
              }
              return { x, y };
            };

            const len = star.history ? star.history.length : 0;

            // Draw the trail if it exists (High Performance)
            if (len > 1) {
              ctx.lineWidth = star.size * 1.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.strokeStyle = star.color;
              ctx.globalAlpha = 0.5; // Single opacity for entire tail
              
              ctx.beginPath();
              const startP = applyLensing(star.history[0].x, star.history[0].y, star.history[0].z);
              ctx.moveTo(startP.x, startP.y);
              for (let i = 1; i < len; i++) {
                const p = applyLensing(star.history[i].x, star.history[i].y, star.history[i].z);
                ctx.lineTo(p.x, p.y);
              }
              ctx.stroke();
              ctx.globalAlpha = 1.0; // Reset opacity
            }
            
            // Draw the star head
            const currentZ = len > 0 ? star.history[len - 1].z : (isBackStar ? -1 : 1);
            const headPos = applyLensing(star.x, star.y, currentZ);
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, star.size, 0, Math.PI * 2);
            ctx.fill();
          };

          backStars.forEach(s => drawStar(s, true));

          if (easterEggTriggered && bhRadius > 0) {
            // Gravitational glow / lensing halo
            const haloGradient = ctx.createRadialGradient(bhX, bhY, bhRadius, bhX, bhY, bhRadius * 6);
            haloGradient.addColorStop(0, 'rgba(255, 180, 100, 0.25)');
            haloGradient.addColorStop(0.3, 'rgba(100, 150, 255, 0.1)');
            haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = haloGradient;
            ctx.beginPath();
            ctx.arc(bhX, bhY, bhRadius * 6, 0, Math.PI * 2);
            ctx.fill();

            const glowG = Math.round(150 + voidHoverProgress * 50);
            const glowB = Math.round(50 + voidHoverProgress * 50);
            const glowA = 0.6 + voidHoverProgress * 0.4;

            ctx.shadowBlur = 20 + voidHoverProgress * 20;
            ctx.shadowColor = `rgba(255, ${glowG}, ${glowB}, ${glowA})`; // Fiery event horizon glow
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle photon ring to emphasize the spherical shape
            const ringG = Math.round(200 + voidHoverProgress * 20);
            const ringB = Math.round(100 + voidHoverProgress * 50);
            const ringA = 0.3 + voidHoverProgress * 0.5;

            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(255, ${ringG}, ${ringB}, ${ringA})`;
            ctx.lineWidth = 1 + voidHoverProgress;
            ctx.beginPath();
            ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0; // Reset for front stars
          }

          frontStars.forEach(s => drawStar(s, false));

          ctx.shadowBlur = 0; // Reset for trail layer
        }
      }

      // Audio proximity volume logic
      if (backgroundAudio) {
        let targetVol1 = 0.05;
        if (currentDistance <= 1500 && currentDistance > 400) {
          const closeness = 1 - ((currentDistance - 400) / 1100);
          targetVol1 = 0.05 + (closeness * 0.45); // Scales base volume up to a max of 0.5
        } else if (currentDistance <= 400) {
          targetVol1 = 0.5; // Keeps playing at max volume
        }
        
        const muteToggle = document.getElementById('muteToggle');
        const isMuted = muteToggle && muteToggle.checked;
        
        if (easterEggTriggered) targetVol1 = 0;
        if (isMuted || !effectsEnabled) targetVol1 = 0;
        
        backgroundAudio.volume += (targetVol1 - backgroundAudio.volume) * 0.1;

        if (layerAudio) {
          let targetVol2 = 0;
          if (!easterEggTriggered) {
            if (currentDistance <= 750 && currentDistance > 500) {
              targetVol2 = (1 - ((currentDistance - 500) / 250)) * 0.5; // Fade in from 750px to 500px
            } else if (currentDistance <= 500 && currentDistance > 250) {
              targetVol2 = ((currentDistance - 250) / 250) * 0.5; // Fade out from 500px to 250px
            }
          }
          if (isMuted || !effectsEnabled) targetVol2 = 0;
          layerAudio.volume += (targetVol2 - layerAudio.volume) * 0.1; // Smooth volume transition
        }
        if (layerAudio3) {
          let targetVol3 = 0;
          if (!easterEggTriggered) {
            targetVol3 = currentDistance <= 500 ? 1 - (currentDistance / 500) : 0; // Fade in from 500px to max loudness (1.0)
          }
          if (isMuted || !effectsEnabled) targetVol3 = 0;
          layerAudio3.volume += (targetVol3 - layerAudio3.volume) * 0.1; // Smooth volume transition
        }
        if (easterEggAudio) {
          let targetVolEE = easterEggTriggered ? 1.0 : 0;
          if (isMuted || !effectsEnabled) targetVolEE = 0;
          easterEggAudio.volume += (targetVolEE - easterEggAudio.volume) * 0.05; // Fade in gradually
        }
      }

      requestAnimationFrame(animateButton);
    }
    animateButton();
  }
});