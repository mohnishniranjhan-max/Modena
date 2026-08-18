import React, { useEffect, useRef } from 'react';

/**
 * CrackerSparksCanvas Component
 * Creates a high-performance Canvas 2D golden cracker / firework particle physics animation.
 * Features upward launch, air resistance, gravity arc trajectory, glowing trails, and random bursts.
 */
const CrackerSparksCanvas = ({ isMobile = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let particles = [];
    let lastBurstTime = 0;
    let nextBurstDelay = 200;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      // Canvas size matching parent container
      canvas.width = rect.width;
      canvas.height = rect.height + 40;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const goldColors = ['#FFF5C0', '#FFE49E', '#FFD700', '#F3C044', '#D4AF37', '#FFFFFF'];

    const spawnBurst = (now) => {
      const width = canvas.width || 200;
      // Origin: randomly along the button width
      const originX = 15 + Math.random() * (width - 30);
      const originY = 20;

      const particleCount = isMobile ? 3 + Math.floor(Math.random() * 3) : 7 + Math.floor(Math.random() * 6);

      for (let i = 0; i < particleCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.85); // Upward cone spread
        const speed = (isMobile ? 2.5 : 4) + Math.random() * (isMobile ? 2.5 : 4);

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.16 + Math.random() * 0.08,
          friction: 0.97,
          life: 0,
          maxLife: 22 + Math.random() * 22,
          size: 1.2 + Math.random() * 1.8,
          color: goldColors[Math.floor(Math.random() * goldColors.length)],
          trail: []
        });
      }

      lastBurstTime = now;
      nextBurstDelay = isMobile ? 450 + Math.random() * 550 : 220 + Math.random() * 320;
    };

    const updateAndDraw = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Trigger bursts
      if (now - lastBurstTime > nextBurstDelay) {
        spawnBurst(now);
      }

      // Render & physics loop
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Store trail history
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) {
          p.trail.shift();
        }

        // Apply physics model
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (alpha <= 0 || p.y > canvas.height) {
          particles.splice(i, 1);
          continue;
        }

        // Draw Spark Trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = alpha * 0.7;
          ctx.lineWidth = p.size * 0.8;
          ctx.stroke();
        }

        // Draw Glowing Particle Head
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 overflow-visible"
    />
  );
};

export default CrackerSparksCanvas;
