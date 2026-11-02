import React, { useState } from 'react';
import { Minimize2, Play, Pause, SkipBack, SkipForward, Sparkles, Heart } from 'lucide-react';
import { Track } from '../types';
import confetti from 'canvas-confetti';

interface LivingRoomModeProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isBlendSession?: boolean;
  blendParticipants?: string[];
}

export const LivingRoomMode: React.FC<LivingRoomModeProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onClose,
  isBlendSession = false,
  blendParticipants = ['You', 'Aarav', 'Maya']
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const sampleLyrics = track.lyrics || [
    "Lost in the resonance of the room,",
    "Every chord breathes with gentle warmth.",
    "A quiet night, an analog record spinning,",
    "Soundwaves dancing on the linen walls,",
    "Nothing rushed, just peaceful acoustics."
  ];

  const handleSendReaction = (emoji: string) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#4F694C', '#7C9372', '#FFFFE7', '#E5E0D4']
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--canvas-bg)] flex flex-col items-center justify-between p-8 select-none overflow-hidden transition-colors">
      
      {/* Top Header: Title & Close Button */}
      <div className="w-full flex items-center justify-between max-w-5xl z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Adora" className="w-8 h-8 rounded-full border border-[var(--border-subtle)]" />
          <span className="text-xs uppercase tracking-widest font-semibold text-[var(--accent-primary)]">
            Adora Acoustic Sanctuary
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-full bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all shadow-sm"
          title="Exit Living Room Mode"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece: Spinning Vinyl & Synced Lyrics */}
      <div className="flex-1 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 my-6">
        
        {/* The Vinyl Disc Assembly */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Colored Backlight Glow */}
          <div 
            className="absolute w-80 h-80 rounded-full blur-3xl opacity-40 transition-all duration-1000 -z-10"
            style={{ backgroundImage: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)` }}
          />

          {/* Vinyl Record */}
          <div className={`relative w-72 h-72 md:w-88 md:h-88 rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : 'paused'}`}>
            {/* Grooves */}
            <div className="absolute inset-4 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-10 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-16 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-24 rounded-full border border-neutral-700/30" />

            {/* Center Label (Album Artwork) */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-neutral-900 shadow-inner">
              <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
            </div>

            {/* Spindle Hole */}
            <div className="absolute w-5 h-5 rounded-full bg-[var(--canvas-bg)] border border-neutral-700" />
          </div>

          {/* Social Blend Avatar Campfire (If in Blend session) */}
          {isBlendSession && (
            <div className="absolute -bottom-6 flex items-center gap-2 bg-[var(--surface-card)] px-4 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--text-primary)]">
                Syncing with {blendParticipants.slice(1).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Poetic Lyrics & Song Metadata */}
        <div className="flex-1 max-w-md flex flex-col items-center md:items-start text-center md:text-left gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
              {track.title}
            </h2>
            <button 
              onClick={() => setIsFavorited(!isFavorited)}
              className="text-[var(--accent-primary)] hover:scale-110 transition-transform"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
            </button>
          </div>

          <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {track.artist} — {track.album}
          </p>

          {/* Synced Lyrics Pane */}
          <div className="w-full mt-4 p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-3 shadow-sm">
            {sampleLyrics.map((line, idx) => (
              <p
                key={idx}
                className={`text-sm md:text-base leading-relaxed transition-all ${
                  idx === 2
                    ? 'font-bold text-[var(--accent-primary)] scale-105'
                    : 'text-[var(--text-muted)] opacity-70'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Quick Reaction Pill (Blend Session) */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--text-muted)] font-medium">Reactions:</span>
            {['❤️', '🔥', '👏', '🎶'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-sm transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Transport Controls */}
      <div className="flex items-center gap-6 z-10 mb-4">
        <button
          onClick={onPrev}
          className="p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>

        <button
          onClick={onNext}
          className="p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};
