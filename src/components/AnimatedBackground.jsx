import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Shape Data: Icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const length = Math.sqrt(x*x + y*y + z*z);
      return { x: x/length, y: y/length, z: z/length };
    });

    const edges = [];
    for (let i = 0; i < baseVertices.length; i++) {
      for (let j = i + 1; j < baseVertices.length; j++) {
        const dx = baseVertices[i].x - baseVertices[j].x;
        const dy = baseVertices[i].y - baseVertices[j].y;
        const dz = baseVertices[i].z - baseVertices[j].z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < 1.1) {
          edges.push([i, j]);
        }
      }
    }

    // Secondary shapes: small rotating tetrahedrons
    const tetVertices = [
      { x: 1, y: 1, z: 1 },
      { x: -1, y: -1, z: 1 },
      { x: -1, y: 1, z: -1 },
      { x: 1, y: -1, z: -1 }
    ].map(v => {
      const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
      return { x: v.x/len, y: v.y/len, z: v.z/len };
    });
    const tetEdges = [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]];

    // State for shapes
    const shapes = [
      {
        type: 'icosahedron',
        vertices: baseVertices,
        edges: edges,
        scale: 220,
        x: () => width * 0.5,
        y: () => height * 0.5,
        rx: 0.003,
        ry: 0.005,
        rz: 0.002,
        angleX: 0,
        angleY: 0,
        angleZ: 0,
        color: '37, 99, 235', // blue
        glowColor: '60, 191, 255'
      },
      {
        type: 'tetrahedron',
        vertices: tetVertices,
        edges: tetEdges,
        scale: 70,
        x: () => width * 0.15,
        y: () => height * 0.25,
        rx: -0.006,
        ry: 0.008,
        rz: 0.004,
        angleX: 0.5,
        angleY: 0.2,
        angleZ: 0,
        color: '139, 92, 246', // purple
        glowColor: '196, 181, 253'
      },
      {
        type: 'tetrahedron',
        vertices: tetVertices,
        edges: tetEdges,
        scale: 75,
        x: () => width * 0.85,
        y: () => height * 0.75,
        rx: 0.007,
        ry: -0.005,
        rz: 0.006,
        angleX: 0.2,
        angleY: 0.8,
        angleZ: 0.5,
        color: '249, 115, 22', // orange/gold
        glowColor: '253, 186, 116'
      }
    ];

    // Background stars/dust
    const stars = Array.from({ length: 40 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.02 + 0.01,
      alpha: Math.random() * 0.5 + 0.2
    }));

    // Rotation helper functions
    const rotX = (p, sin, cos) => ({ x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos });
    const rotY = (p, sin, cos) => ({ x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos });
    const rotZ = (p, sin, cos) => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z });

    const fov = 500;
    const cameraDist = 3.5;

    // Animation Loop
    const animate = () => {
      // Clear with very dark radial gradient
      const bgGrad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, Math.max(width, height));
      bgGrad.addColorStop(0, '#09122c');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw faint grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.008)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw ambient stars
      stars.forEach(star => {
        star.y -= star.speed / 100;
        if (star.y < 0) {
          star.y = 1;
          star.x = Math.random();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render 3D Shapes
      shapes.forEach(shape => {
        // Increment angles
        shape.angleX += shape.rx;
        shape.angleY += shape.ry;
        shape.angleZ += shape.rz;

        const sinX = Math.sin(shape.angleX), cosX = Math.cos(shape.angleX);
        const sinY = Math.sin(shape.angleY), cosY = Math.cos(shape.angleY);
        const sinZ = Math.sin(shape.angleZ), cosZ = Math.cos(shape.angleZ);

        // Project vertices
        const projected = shape.vertices.map(v => {
          let r = rotX(v, sinX, cosX);
          r = rotY(r, sinY, cosY);
          r = rotZ(r, sinZ, cosZ);

          const scaleFactor = fov / (cameraDist + r.z);
          const x = shape.x() + r.x * shape.scale * (scaleFactor / fov);
          const y = shape.y() + r.y * shape.scale * (scaleFactor / fov);
          return { x, y, z: r.z };
        });

        // Draw edges (draw back edges first for simple depth rendering)
        const sortedEdges = shape.edges.map(([i, j]) => {
          const midZ = (projected[i].z + projected[j].z) / 2;
          return { i, j, midZ };
        }).sort((a, b) => b.midZ - a.midZ);

        sortedEdges.forEach(({ i, j, midZ }) => {
          const zNorm = (midZ + 1.2) / 2.4; 
          const opacity = Math.max(0.04, Math.min(0.38, 0.38 - zNorm * 0.3));
          const strokeWidth = Math.max(0.5, Math.min(2.5, 2.5 - zNorm * 1.8));

          ctx.strokeStyle = `rgba(${shape.color}, ${opacity})`;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        });

        // Draw vertices
        projected.forEach(p => {
          const zNorm = (p.z + 1.2) / 2.4; 
          const radius = Math.max(2, Math.min(6, 6 - zNorm * 4));
          const opacity = Math.max(0.1, Math.min(0.8, 0.8 - zNorm * 0.6));

          // Inner solid core
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Outer glowing halo
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.5);
          glow.addColorStop(0, `rgba(${shape.glowColor}, ${opacity * 0.8})`);
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
