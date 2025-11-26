import React, { useEffect, useRef } from 'react';

const DNABackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = Date.now();
    
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      if (parent) {
          const rect = parent.getBoundingClientRect();
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      
      ctx.clearRect(0, 0, width, height);
      
      const centerY = height / 2;
      const amplitude = 50; 
      const frequency = 0.008; // Slightly stretched out wave
      // Slower speed as requested
      const speed = 0.8; 
      const phase = elapsed * speed; 
      
      // Right to Left formation animation
      const formDuration = 3.0; // Slower formation
      const progress = Math.min(elapsed / formDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const visibleStart = width * (1 - easedProgress);

      const step = 10; // Higher density (smaller step)

      for (let x = 0; x < width; x += step) {
        if (x < visibleStart) continue;

        const angle = x * frequency - phase; // Minus phase to move right-to-left naturally if looking at wave propagation
        
        // Helix positions
        const y1 = centerY + Math.sin(angle) * amplitude;
        const y2 = centerY + Math.sin(angle + Math.PI) * amplitude;

        // 3D Depth (cosine of angle)
        const z1 = Math.cos(angle);
        const z2 = Math.cos(angle + Math.PI);

        // Visual properties based on depth
        // Front particles (z > 0) are larger and more opaque
        // Back particles (z < 0) are smaller and more transparent
        const opacity1 = 0.1 + (z1 + 1) / 2 * 0.9;
        const size1 = 1 + (z1 + 1) / 2 * 2.5;
        
        const opacity2 = 0.1 + (z2 + 1) / 2 * 0.9;
        const size2 = 1 + (z2 + 1) / 2 * 2.5;

        // Color: Cyan/Blue mix
        const r = 0;
        const g = 194; 
        const b = 255;

        // Draw Strand 1
        ctx.beginPath();
        ctx.arc(x, y1, size1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity1})`;
        ctx.fill();
        
        // Glow effect for foreground particles (simple approach)
        if (z1 > 0.5) {
            ctx.beginPath();
            ctx.arc(x, y1, size1 * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
            ctx.fill();
        }

        // Draw Strand 2
        ctx.beginPath();
        ctx.arc(x, y2, size2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity2})`;
        ctx.fill();
        
         if (z2 > 0.5) {
            ctx.beginPath();
            ctx.arc(x, y2, size2 * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
            ctx.fill();
        }

        // Draw Rungs (Connections)
        // Draw every 3rd step to create the ladder effect without being too dense
        if (x % (step * 3) === 0) {
           const dist = y2 - y1;
           const dotsInRung = 10;
           
           for(let j=1; j<dotsInRung; j++) {
              const fraction = j / dotsInRung;
              const ry = y1 + (dist * fraction);
              
              ctx.beginPath();
              // Increased size and opacity for better visibility
              ctx.arc(x, ry, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
              ctx.fill();
           }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default DNABackground;