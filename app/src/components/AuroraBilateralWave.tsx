import React, { useRef, useEffect } from 'react';

interface AuroraBilateralWaveProps {
  isPlaying: boolean;
  className?: string;
  height?: number;
}

export const AuroraBilateralWave: React.FC<AuroraBilateralWaveProps> = ({
  isPlaying,
  className = '',
  height = 120
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let currentAmplitude = isPlaying ? 38 : 6;
    const targetAmplitude = isPlaying ? 38 : 6;

    // Ambient floating particles
    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6 + 0.2, // centered around horizon
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.0008,
      speedY: (Math.random() - 0.5) * 0.0006,
      opacity: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI * 2
    }));

    const render = () => {
      const width = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Handle retina displays
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const centerY = h / 2;
      const sigma = width * 0.26; // Gaussian bell width

      // Smooth decay transition towards target amplitude (450ms spring feel)
      currentAmplitude += (targetAmplitude - currentAmplitude) * 0.08;

      if (isPlaying) {
        time += 0.024;
      } else {
        time += 0.006; // Slow calm idle drift
      }

      // Draw subtle horizon base glow
      const horizonGrad = ctx.createLinearGradient(0, centerY - 15, 0, centerY + 15);
      horizonGrad.addColorStop(0, 'rgba(94, 168, 161, 0)');
      horizonGrad.addColorStop(0.5, isPlaying ? 'rgba(94, 168, 161, 0.2)' : 'rgba(94, 168, 161, 0.08)');
      horizonGrad.addColorStop(1, 'rgba(94, 168, 161, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, centerY - 15, width, 30);

      // Layer definitions (Bilateral mirrored Gaussian harmonic waves)
      const layers = [
        {
          weight: 0.6,
          freq1: 0.014,
          freq2: 0.028,
          speed1: 1.6,
          speed2: 1.0,
          colorInner: 'rgba(94, 168, 161, 0.45)',
          colorOuter: 'rgba(14, 22, 25, 0.1)',
          stroke: 'rgba(94, 168, 161, 0.85)',
          phase: 0
        },
        {
          weight: 0.85,
          freq1: 0.011,
          freq2: 0.022,
          speed1: -1.3,
          speed2: 1.7,
          colorInner: 'rgba(143, 170, 183, 0.4)',
          colorOuter: 'rgba(14, 22, 25, 0.05)',
          stroke: 'rgba(143, 170, 183, 0.9)',
          phase: 1.4
        },
        {
          weight: 1.0,
          freq1: 0.018,
          freq2: 0.035,
          speed1: 2.1,
          speed2: -1.4,
          colorInner: 'rgba(94, 168, 161, 0.65)',
          colorOuter: 'rgba(14, 22, 25, 0.15)',
          stroke: 'rgba(168, 224, 218, 0.95)',
          phase: 2.8
        }
      ];

      // Dynamic sub-bass breathing pulse
      const bassEnergy = isPlaying 
        ? Math.sin(time * 3.2) * 0.18 + Math.cos(time * 1.8) * 0.12 
        : Math.sin(time * 1.5) * 0.05;

      const dynamicAmp = currentAmplitude * (1 + bassEnergy);

      // Render each bilateral mirrored layer
      layers.forEach((layer) => {
        const step = 4;
        const numPoints = Math.ceil(width / step) + 1;
        const topPoints: { x: number; y: number }[] = [];
        const bottomPoints: { x: number; y: number }[] = [];

        for (let i = 0; i <= numPoints; i++) {
          const x = i * step;
          const dx = x - width / 2;
          const gaussian = Math.exp(-Math.pow(dx / sigma, 2));

          const wave = 
            Math.sin(x * layer.freq1 + time * layer.speed1 + layer.phase) * 0.6 +
            Math.cos(x * layer.freq2 + time * layer.speed2 + layer.phase * 0.5) * 0.4;

          const envelope = dynamicAmp * layer.weight * gaussian * Math.abs(wave);

          topPoints.push({ x, y: centerY - envelope });
          bottomPoints.push({ x, y: centerY + envelope });
        }

        // Draw bilateral fluid filled shape
        ctx.beginPath();
        if (topPoints.length > 0) {
          ctx.moveTo(topPoints[0].x, topPoints[0].y);
          for (let i = 1; i < topPoints.length; i++) {
            ctx.lineTo(topPoints[i].x, topPoints[i].y);
          }
          for (let i = bottomPoints.length - 1; i >= 0; i--) {
            ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
          }
        }
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, centerY - dynamicAmp, 0, centerY + dynamicAmp);
        fillGrad.addColorStop(0, layer.colorOuter);
        fillGrad.addColorStop(0.5, layer.colorInner);
        fillGrad.addColorStop(1, layer.colorOuter);

        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Draw glowing bilateral top and bottom contour lines
        ctx.save();
        ctx.shadowColor = '#5EA8A1';
        ctx.shadowBlur = isPlaying ? 14 : 6;
        ctx.lineWidth = isPlaying ? 1.5 : 1;
        ctx.strokeStyle = layer.stroke;

        // Top line
        ctx.beginPath();
        topPoints.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Bottom mirrored line
        ctx.beginPath();
        bottomPoints.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        ctx.restore();
      });

      // Render floating subtle ambient particles / stardust
      particles.forEach((p) => {
        p.x += p.speedX * (isPlaying ? 1 : 0.4);
        p.y += p.speedY * (isPlaying ? 1 : 0.4);
        p.pulse += 0.03;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0.2) p.y = 0.8;
        if (p.y > 0.8) p.y = 0.2;

        const posX = p.x * width;
        const posY = p.y * h;
        const currentOp = (Math.sin(p.pulse) * 0.3 + 0.7) * p.opacity * (isPlaying ? 1 : 0.4);

        ctx.beginPath();
        ctx.arc(posX, posY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 224, 218, ${currentOp})`;
        ctx.shadowColor = '#5EA8A1';
        ctx.shadowBlur = 8;
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <div className={`relative w-full overflow-hidden flex flex-col items-center justify-center select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="w-full pointer-events-none"
      />
    </div>
  );
};

