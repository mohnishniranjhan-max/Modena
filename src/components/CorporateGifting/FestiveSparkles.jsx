import React, { useEffect, useState, memo } from 'react';

/**
 * Pure CSS-based lightweight ambient sparkles and Whole Page Shimmer.
 * Complies strictly with "Prefer CSS animations" and zero interaction blocking.
 */

// 1. WHOLE PAGE SHIMMER (Extremely subtle, low opacity)
export const WholePageShimmer = memo(() => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] opacity-20 mix-blend-overlay"
      style={{
        background: 'linear-gradient(45deg, transparent 40%, rgba(212, 175, 55, 0.05) 45%, rgba(255, 255, 255, 0.1) 50%, rgba(212, 175, 55, 0.05) 55%, transparent 60%)',
        backgroundSize: '300% 300%',
        animation: 'shimmerSweep 15s ease-in-out infinite alternate',
      }}
    />
  );
});

// 2. HERO FESTIVE ATMOSPHERE (CSS Particles)
export const HeroFestiveAtmosphere = memo(() => {
  const [bursts, setBursts] = useState([]);

  // Occasional random bursts around the hero
  useEffect(() => {
    const burstInterval = setInterval(() => {
      if (document.hidden) return;
      const id = Date.now();
      const x = 20 + Math.random() * 60; // 20% to 80% width
      const y = 20 + Math.random() * 60; // 20% to 80% height
      
      setBursts(prev => [...prev, { id, x, y }]);
      
      // Remove burst after animation completes
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== id));
      }, 2000);
    }, 4500);

    return () => clearInterval(burstInterval);
  }, []);

  const staticParticles = Array.from({ length: 16 }).map((_, i) => {
    const size = Math.random() * 3 + 2;
    const duration = Math.random() * 4 + 4;
    const delay = Math.random() * 5;
    const isStar = Math.random() > 0.5;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const opacity = Math.random() * 0.5 + 0.3;

    return (
      <div
        key={i}
        className="absolute pointer-events-none rounded-full"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: 0, // Starts at 0, handled by keyframes
          background: isStar ? '#FFDF80' : '#D4AF37',
          boxShadow: isStar ? '0 0 6px 1px rgba(212,175,55,0.6)' : '0 0 4px rgba(212,175,55,0.4)',
          clipPath: isStar ? 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)' : 'none',
          animation: `floatAndTwinkle ${duration}s ease-in-out infinite ${delay}s`,
        }}
      />
    );
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
      {/* Soft Golden Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] max-w-full rounded-full opacity-[0.15] blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.8) 0%, rgba(201, 31, 38, 0.2) 50%, transparent 80%)'
        }}
      />
      
      {/* Drifting CSS Particles */}
      {staticParticles}

      {/* Occasional Sparkle Bursts */}
      {bursts.map(burst => (
        <div 
          key={burst.id} 
          className="absolute"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                width: '4px',
                height: '4px',
                background: '#FFDF80',
                boxShadow: '0 0 4px #D4AF37',
                clipPath: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
                animation: `sparkleBurst 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                transformOrigin: 'center center',
                '--tx': `${(Math.random() - 0.5) * 60}px`,
                '--ty': `${(Math.random() - 0.5) * 60}px`,
                '--r': `${Math.random() * 180}deg`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

// 3. CTA BUTTON HOVER SPARKLES
export const triggerButtonSparkles = (e) => {
  const target = e.currentTarget;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const burstContainer = document.createElement('div');
  burstContainer.style.position = 'fixed';
  burstContainer.style.left = `${rect.left + rect.width / 2}px`;
  burstContainer.style.top = `${rect.top + rect.height / 2}px`;
  burstContainer.style.width = '0px';
  burstContainer.style.height = '0px';
  burstContainer.style.pointerEvents = 'none';
  burstContainer.style.zIndex = '99999';
  document.body.appendChild(burstContainer);

  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = Math.random() * 30 + 20;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = Math.random() * 5 + 3;

    p.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#E6C35A">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
      </svg>
    `;

    p.style.position = 'absolute';
    p.style.left = '0px';
    p.style.top = '0px';
    p.style.transform = 'translate(-50%, -50%) scale(0)';
    p.style.opacity = '1';
    p.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    p.style.filter = 'drop-shadow(0 0 3px rgba(230, 195, 90, 0.6))';

    burstContainer.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(${x}px, ${y}px) scale(1) rotate(${Math.random() * 90}deg)`;
      p.style.opacity = '0';
    });
  }

  setTimeout(() => {
    if (burstContainer && burstContainer.parentNode) {
      burstContainer.parentNode.removeChild(burstContainer);
    }
  }, 700);
};

// Insert required keyframes into the document head safely
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes floatAndTwinkle {
      0% { transform: translateY(0) scale(0.8); opacity: 0; }
      20% { opacity: var(--max-opacity, 0.8); }
      50% { transform: translateY(-15px) scale(1.1); opacity: var(--max-opacity, 0.4); }
      80% { opacity: var(--max-opacity, 0.8); }
      100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
    }
    @keyframes shimmerSweep {
      0% { background-position: 0% 50%; opacity: 0.1; }
      50% { opacity: 0.3; }
      100% { background-position: 100% 50%; opacity: 0.1; }
    }
    @keyframes sparkleBurst {
      0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
      20% { transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(1.5) rotate(calc(var(--r) * 0.2)); opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--r)); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
}
