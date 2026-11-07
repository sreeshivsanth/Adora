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
  height = 80,
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

    // Smoothed state variables for soothing, organic relaxation
    let smoothedAmp = isPlaying ? 22 : 6;
    let smoothedPitch = 0.35; // 0 = deep low pitch, 1 = high pitch
    let smoothedBass = 0.1;

    // Ambient floating stardust particles (gentle and unhurried)
    const particles = Array.from({ length: 12 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.5 + 0.25,
      size: Math.random() * 1.8 + 0.8,
      speedX: (Math.random() - 0.5) * 0.0004,
      speedY: (Math.random() - 0.5) * 0.0003,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2
    }));

    const render = () => {
      const width = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Handle high-DPI screens
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const centerY = h / 2;

      // Real-time audio frequencies from Web Audio Analyser
      const audioFreq = getAudioFrequencies();

      // Target amplitude: softly bounded to remain relaxing with zero jarring bouncing
      let targetAmp = 5;
      let targetPitch = 0.35;
      let targetBass = 0.1;

      if (isPlaying) {
        if (audioFreq.hasRealAudio) {
          // Relaxing base amplitude (~20px) with very gentle breathing (±2.5px), never bouncing
          targetAmp = 20 + (audioFreq.bass * 2.5);
          targetPitch = audioFreq.pitch;
          targetBass = audioFreq.bass;
        } else {
          // Dynamic musical drift when audio is playing without direct analyser connection
          targetAmp = 20;
          targetPitch = 0.45 + 0.3 * Math.sin(time * 0.8);
          targetBass = 0.15;
        }
      }

      // Meditative, heavy exponential damping for tranquil, continuous motion (no bouncy jerks)
      smoothedAmp += (targetAmp - smoothedAmp) * 0.025;
      smoothedPitch += (targetPitch - smoothedPitch) * 0.055;
      smoothedBass += (targetBass - smoothedBass) * 0.03;

      // Slow, relaxing meditative drift
      if (isPlaying) {
        time += 0.007 + (smoothedPitch * 0.005);
      } else {
        time += 0.002; // Gentle resting drift
      }

      // Distinct Pitch Responsiveness:
      // Low pitch (<0.25): broad, rolling oceanic swells (long wavelengths)
      // High pitch (>0.65): tighter, intricate shimmering silk ripples (short wavelengths)
      const pitchFreqMultiplier = 0.55 + (smoothedPitch * 2.1);
      const sigma = width * (0.38 - (smoothedPitch * 0.16)); // wide expansive swell when low pitch, focused crest when high pitch

      // Horizon ambient glow
      const horizonHeight = Math.max(12, smoothedAmp * 0.7);
      const horizonGrad = ctx.createLinearGradient(0, centerY - horizonHeight, 0, centerY + horizonHeight);
      horizonGrad.addColorStop(0, 'rgba(94, 168, 161, 0)');
      horizonGrad.addColorStop(0.5, isPlaying 
        ? `rgba(94, 168, 161, ${0.12 + smoothedBass * 0.10})` 
        : 'rgba(94, 168, 161, 0.05)'
      );
      horizonGrad.addColorStop(1, 'rgba(94, 168, 161, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, centerY - horizonHeight, width, horizonHeight * 2);

      // Pitch-reactive color profiles:
      // Low pitch = deep calm oceanic lagoon teal
      // High pitch = brilliant luminous seafoam crystal
      const r = Math.round(52 + smoothedPitch * 76);
      const g = Math.round(135 + smoothedPitch * 95);
      const b = Math.round(130 + smoothedPitch * 95);
      const strokeGlowColor = `rgba(${r}, ${g}, ${b}, ${0.85 + smoothedPitch * 0.12})`;
      const innerFillColor = `rgba(${r}, ${g}, ${b}, ${0.28 + smoothedPitch * 0.16})`;

      // Multi-layer Bilateral Mirrored Fluid Contours
      const layers = [
        {
          weight: 0.72,
          freq1: 0.010 * pitchFreqMultiplier,
          freq2: 0.022 * pitchFreqMultiplier,
          speed1: 1.0,
          speed2: 0.6,
          colorInner: innerFillColor,
          colorOuter: 'rgba(14, 22, 25, 0.03)',
          stroke: strokeGlowColor,
          phase: 0
        },
        {
          weight: 0.88,
          freq1: 0.014 * pitchFreqMultiplier,
          freq2: 0.028 * pitchFreqMultiplier,
          speed1: -0.8,
          speed2: 1.1,
          colorInner: 'rgba(143, 170, 183, 0.28)',
          colorOuter: 'rgba(14, 22, 25, 0.02)',
          stroke: 'rgba(143, 170, 183, 0.82)',
          phase: 1.6
        },
        {
          weight: 1.0,
          freq1: 0.018 * pitchFreqMultiplier,
          freq2: 0.034 * pitchFreqMultiplier,
          speed1: 1.2,
          speed2: -0.9,
          colorInner: innerFillColor,
          colorOuter: 'rgba(14, 22, 25, 0.05)',
          stroke: strokeGlowColor,
          phase: 3.1
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

          // When pitch is low, fundamental freq1 dominates (wide oceanic swell)
          // When pitch is high, intricate secondary ripples freq2 appear
          const wave = 
            Math.sin(x * layer.freq1 + time * layer.speed1 + layer.phase) * (0.75 - smoothedPitch * 0.25) +
            Math.cos(x * layer.freq2 + time * layer.speed2 + layer.phase * 0.5) * (0.15 + smoothedPitch * 0.40);

          const envelope = smoothedAmp * layer.weight * gaussian * Math.abs(wave);

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

        const fillGrad = ctx.createLinearGradient(0, centerY - smoothedAmp, 0, centerY + smoothedAmp);
        fillGrad.addColorStop(0, layer.colorOuter);
        fillGrad.addColorStop(0.5, layer.colorInner);
        fillGrad.addColorStop(1, layer.colorOuter);

        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Soft contour outline
        ctx.save();
        ctx.shadowColor = '#5EA8A1';
        ctx.shadowBlur = isPlaying ? 8 : 4;
        ctx.lineWidth = isPlaying ? 1.4 : 0.9;
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

      // Ambient stardust floating calmly
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0.2) p.y = 0.8;
        if (p.y > 0.8) p.y = 0.2;

        const posX = p.x * width;
        const posY = p.y * h;
        const currentOp = (Math.sin(p.pulse) * 0.3 + 0.7) * p.opacity * (isPlaying ? 0.85 : 0.3);

        ctx.beginPath();
        ctx.arc(posX, posY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 224, 218, ${currentOp})`;
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
