import React, { useRef, useEffect } from 'react';
import { getAudioFrequencies } from '../services/audioVisualizer';

interface AuroraBilateralWaveProps {
  isPlaying: boolean;
  className?: string;
  height?: number;
  positionSec?: number;
}

export const AuroraBilateralWave: React.FC<AuroraBilateralWaveProps> = ({
  isPlaying,
  className = '',
  height = 120,
  positionSec
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let currentAmplitude = isPlaying ? 32 : 5;

    // Ambient floating stardust particles
    const particles = Array.from({ length: 16 }, () => ({
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

      // Retina display handling
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const centerY = h / 2;
      const sigma = width * 0.28; // Bilateral Gaussian curve spread

      // Live Web Audio frequency analysis in sync with the song
      const audioFreq = getAudioFrequencies();

      let targetAmplitude = 5;
      if (isPlaying) {
        if (audioFreq.hasRealAudio) {
          // Real-time audio band: Sub-bass (40-120 Hz) & acoustic warmth
          targetAmplitude = 16 + (audioFreq.bass * 42) + (audioFreq.mids * 24);
        } else {
          // Graceful tempo-synced baseline if audio stream is loading
          targetAmplitude = 32;
        }
      }

      // Smooth 450 ms gentle spring release decay
      currentAmplitude += (targetAmplitude - currentAmplitude) * 0.12;

      if (isPlaying) {
        if (audioFreq.hasRealAudio) {
          time += 0.016 + (audioFreq.overall * 0.038);
        } else {
          time += 0.024;
        }
      } else {
        time += 0.005; // Tranquil idle drift
      }

      // Dynamic sub-bass energy modulation
      const bassPulse = audioFreq.hasRealAudio
        ? (audioFreq.bass * 0.65 + audioFreq.mids * 0.3)
        : (Math.sin(time * 3.2) * 0.16 + Math.cos(time * 1.8) * 0.1);

      const dynamicAmp = currentAmplitude * (1 + bassPulse);

      // 1. Horizon central ambient glow
      const horizonGlowHeight = Math.max(16, dynamicAmp * 0.6);
      const horizonGrad = ctx.createLinearGradient(0, centerY - horizonGlowHeight, 0, centerY + horizonGlowHeight);
      horizonGrad.addColorStop(0, 'rgba(94, 168, 161, 0)');
      horizonGrad.addColorStop(0.5, isPlaying 
        ? `rgba(94, 168, 161, ${0.15 + (audioFreq.hasRealAudio ? audioFreq.bass * 0.25 : 0.05)})` 
        : 'rgba(94, 168, 161, 0.06)'
      );
      horizonGrad.addColorStop(1, 'rgba(94, 168, 161, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, centerY - horizonGlowHeight, width, horizonGlowHeight * 2);

      // 2. Multi-layer Bilateral Mirrored Fluid Contours
      const layers = [
        {
          weight: 0.6 + (audioFreq.hasRealAudio ? audioFreq.bass * 0.4 : 0),
          freq1: 0.013,
          freq2: 0.026,
          speed1: 1.5,
          speed2: 0.9,
          colorInner: 'rgba(94, 168, 161, 0.42)',
          colorOuter: 'rgba(14, 22, 25, 0.08)',
          stroke: 'rgba(94, 168, 161, 0.85)',
          phase: 0
        },
        {
          weight: 0.85 + (audioFreq.hasRealAudio ? audioFreq.mids * 0.35 : 0),
          freq1: 0.011,
          freq2: 0.021,
          speed1: -1.2,
          speed2: 1.6,
          colorInner: 'rgba(143, 170, 183, 0.38)',
          colorOuter: 'rgba(14, 22, 25, 0.05)',
          stroke: 'rgba(143, 170, 183, 0.9)',
          phase: 1.4
        },
        {
          weight: 1.0 + (audioFreq.hasRealAudio ? audioFreq.overall * 0.3 : 0),
          freq1: 0.017,
          freq2: 0.034,
          speed1: 2.0,
          speed2: -1.3,
          colorInner: 'rgba(94, 168, 161, 0.62)',
          colorOuter: 'rgba(14, 22, 25, 0.12)',
          stroke: 'rgba(168, 224, 218, 0.95)',
          phase: 2.8
        }
      ];

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

        // Glowing bilateral top and bottom mirrored contour lines
        ctx.save();
        ctx.shadowColor = '#5EA8A1';
        ctx.shadowBlur = isPlaying ? (audioFreq.hasRealAudio ? 12 + audioFreq.bass * 16 : 14) : 6;
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

      // 3. Floating subtle ambient stardust / acoustic particles
      const particleActivity = isPlaying ? (audioFreq.hasRealAudio ? 1 + audioFreq.bass * 1.5 : 1) : 0.35;
      particles.forEach((p) => {
        p.x += p.speedX * particleActivity;
        p.y += p.speedY * particleActivity;
        p.pulse += 0.035 * particleActivity;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0.2) p.y = 0.8;
        if (p.y > 0.8) p.y = 0.2;

        const posX = p.x * width;
        const posY = p.y * h;
        const currentOp = (Math.sin(p.pulse) * 0.35 + 0.65) * p.opacity * (isPlaying ? 1 : 0.35);

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
  }, [isPlaying, positionSec]);

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
