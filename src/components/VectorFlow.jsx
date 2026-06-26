import { useState, useEffect, useRef } from "react";

const defaultColors = ["#ffffff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#3b82f6", "#1d4ed8"]; // White through blue hues

// Classic 2D Perlin Noise Permutation Table Setup
const perm = new Uint8Array(512);
const grad2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

const initNoise = () => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  // Linear congruential generator for deterministic shuffle
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }
};
initNoise();

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t, a, b) => a + t * (b - a);

const noise2D = (x, y) => {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X] + 1 + Y];
  const bb = perm[perm[X] + 1 + Y + 1];

  const g_aa = grad2[aa & 7];
  const g_ab = grad2[ab & 7];
  const g_ba = grad2[ba & 7];
  const g_bb = grad2[bb & 7];

  const n_aa = g_aa[0] * xf + g_aa[1] * yf;
  const n_ba = g_ba[0] * (xf - 1) + g_ba[1] * yf;
  const n_ab = g_ab[0] * xf + g_ab[1] * (yf - 1);
  const n_bb = g_bb[0] * (xf - 1) + g_bb[1] * (yf - 1);

  const x1 = lerp(u, n_aa, n_ba);
  const x2 = lerp(u, n_ab, n_bb);

  return lerp(v, x1, x2);
};

// Dynamic color contrast adjustment for Light Theme readability
const getThemeColor = (color, isDark) => {
  if (isDark) return color;
  
  const lowColor = color.toLowerCase();
  if (lowColor === "#ffffff" || lowColor === "#cbd5e1" || lowColor === "#e0f2fe" || lowColor === "#e2e8f0" || lowColor === "#bae6fd") {
    return "#1e3a8a"; // White/Light slate -> Dark Blue
  }
  if (lowColor === "#7dd3fc" || lowColor === "#93c5fd" || lowColor === "#60a5fa") {
    return "#2563eb"; // Light Blue -> Royal Blue
  }
  return color;
};

export default function VectorFlow({
  colorParticles = defaultColors,
  particleCount = 400, // Reduced count to be less busy/less colorful
  particleSpeed = 0.6, // Slower for a calmer, professional look
  particleSize = 1.0,
  interactionMode = "vortex",
  interactive = true,
  trailLength = 0.08,
  blurAmount = 1.0,
  className = "",
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(true);
  const isDarkModeRef = useRef(true);

  // Intersection Observer for performance
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Mouse coords, velocities, and active state refs
  const mouseRef = useRef({ 
    x: 0, 
    y: 0, 
    vx: 0, 
    vy: 0, 
    active: false, 
    radius: 160 
  });

  // Monitor theme mutations
  useEffect(() => {
    const checkTheme = () => {
      isDarkModeRef.current = document.documentElement.classList.contains("dark");
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];

    const createParticle = (width, height) => {
      const maxLife = 100 + Math.random() * 150;
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        lastX: x,
        lastY: y,
        vx: 0,
        vy: 0,
        color: colorParticles[Math.floor(Math.random() * colorParticles.length)],
        size: (0.4 + Math.random() * 1.0) * particleSize,
        speed: (0.6 + Math.random() * 1.0) * particleSpeed,
        life: 0,
        maxLife,
      };
    };

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || window.innerWidth;
      const height = rect?.height || window.innerHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;

        // Initialize particles
        particles = [];
        for (let i = 0; i < particleCount; i++) {
          particles.push(createParticle(width, height));
        }

        // Clean initial clear
        ctx.fillStyle = isDarkModeRef.current ? "#0f172a" : "#f8fafc";
        ctx.fillRect(0, 0, width, height);
      }
    };

    resizeCanvas();

    // Listeners for mouse interaction & velocity calculation
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      const mouse = mouseRef.current;
      if (mouse.active) {
        // Capture swipe speeds
        mouse.vx = (newX - mouse.x) * 0.4;
        mouse.vy = (newY - mouse.y) * 0.4;
      }
      mouse.x = newX;
      mouse.y = newY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      const mouse = mouseRef.current;
      mouse.active = false;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const newX = touch.clientX - rect.left;
      const newY = touch.clientY - rect.top;
      
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.vx = (newX - mouse.x) * 0.4;
        mouse.vy = (newY - mouse.y) * 0.4;
      }
      mouse.x = newX;
      mouse.y = newY;
      mouse.active = true;
    };

    const handleTouchEnd = () => {
      const mouse = mouseRef.current;
      mouse.active = false;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    let lastTime = performance.now();
    let time = 0;

    const render = () => {
      if (!isInView) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      time += dt * particleSpeed;

      const isDark = isDarkModeRef.current;

      // 1. Transparent trail fading using destination-out
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${trailLength})`;
      ctx.fillRect(0, 0, width, height);

      // 2. Set composite operation for particles drawing
      ctx.globalCompositeOperation = isDark ? "screen" : "source-over";

      const mouse = mouseRef.current;
      // Damp mouse velocities
      mouse.vx *= 0.95;
      mouse.vy *= 0.95;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Advanced math: classic Perlin noise + octave synthesis + domain warping
        const qx = noise2D(p.x * 0.0025 + 1.2, p.y * 0.0025 + time * 0.04);
        const qy = noise2D(p.x * 0.0025 + 5.7, p.y * 0.0025 + time * 0.04);

        const baseAngle = noise2D(
          p.x * 0.0018 + qx * 0.35, 
          p.y * 0.0018 + qy * 0.35 + time * 0.05
        ) * Math.PI * 2.5;

        // Apply base velocity
        let fx = Math.cos(baseAngle) * p.speed;
        let fy = Math.sin(baseAngle) * p.speed;

        // Mouse interactive force fields
        if (interactive && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 1) {
            const normalizedDist = dist / mouse.radius;
            const force = Math.pow(1.0 - normalizedDist, 1.5); // smoother falloff

            // Velocity drag (mouse sweeps particles in its swipe direction)
            const speedSq = mouse.vx * mouse.vx + mouse.vy * mouse.vy;
            if (speedSq > 0.1) {
              fx += mouse.vx * force * 1.8;
              fy += mouse.vy * force * 1.8;
            }

            if (interactionMode === "attract") {
              fx += (dx / dist) * force * p.speed * 2.5;
              fy += (dy / dist) * force * p.speed * 2.5;
            } else if (interactionMode === "repel") {
              fx -= (dx / dist) * force * p.speed * 3.0;
              fy -= (dy / dist) * force * p.speed * 3.0;
            } else if (interactionMode === "vortex") {
              const vx = -dy / dist;
              const vy = dx / dist;
              fx += vx * force * p.speed * 3.5;
              fy += vy * force * p.speed * 3.5;
            }
          }
        }

        // Momentum damping accumulation
        p.vx += (fx - p.vx) * 0.08;
        p.vy += (fy - p.vy) * 0.08;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges protection
        let wrapped = false;
        if (p.x < 0) { p.x = width; wrapped = true; }
        else if (p.x > width) { p.x = 0; wrapped = true; }
        if (p.y < 0) { p.y = height; wrapped = true; }
        else if (p.y > height) { p.y = 0; wrapped = true; }

        if (Math.abs(p.x - p.lastX) > width * 0.3 || Math.abs(p.y - p.lastY) > height * 0.3) {
          wrapped = true;
        }

        p.life++;
        if (p.life >= p.maxLife) {
          particles[i] = createParticle(width, height);
          continue;
        }

        if (wrapped) {
          p.lastX = p.x;
          p.lastY = p.y;
          continue;
        }

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.85;
        const mappedColor = getThemeColor(p.color, isDark);

        // Three-pass rendering pipeline for realistic volumetric neon glow
        
        // 1. Soft Glow outer sheath
        ctx.beginPath();
        ctx.moveTo(p.lastX, p.lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = mappedColor;
        ctx.lineWidth = p.size * 3.5;
        ctx.globalAlpha = alpha * 0.14;
        ctx.stroke();

        // 2. Vibrant core fiber
        ctx.beginPath();
        ctx.moveTo(p.lastX, p.lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = mappedColor;
        ctx.lineWidth = p.size * 1.4;
        ctx.globalAlpha = alpha * 0.7;
        ctx.stroke();

        // 3. Hot laser center core (White / extremely light blue)
        ctx.beginPath();
        ctx.moveTo(p.lastX, p.lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = p.size * 0.6;
        ctx.globalAlpha = alpha * 0.95;
        ctx.stroke();

        p.lastX = p.x;
        p.lastY = p.y;
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (interactive) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [colorParticles, particleCount, particleSpeed, particleSize, interactionMode, interactive, trailLength, isInView]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: "block",
          pointerEvents: "auto",
          filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
        }}
      />
    </div>
  );
}
