import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Sparkles, Heart, Activity } from 'lucide-react';
import { Track } from '../types';
import { getSyncedLyricsForTrack, LyricLine } from '../data/lyrics';
import confetti from 'canvas-confetti';

interface LivingRoomModeProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  positionSec?: number;
  durationSec?: number;
  onSeek?: (pos: number) => void;
  onFastForward?: () => void;
  onRewind?: () => void;
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
  positionSec = 0,
  durationSec,
  onSeek,
  onFastForward,
  onRewind,
  isBlendSession = false,
  blendParticipants = ['You', 'Aarav', 'Maya']
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const totalDuration = (durationSec && durationSec > 0)
    ? durationSec
    : (track.durationSec > 0 ? track.durationSec : 210);

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (positionSec / totalDuration) * 100))
    : 0;

  // Synced lyrics from database or intelligent procedural lyrical generator
  const lyrics: LyricLine[] = getSyncedLyricsForTrack(track.title, track.artist, totalDuration);

  // Find currently active lyric line index based on playback position
  let activeIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (positionSec >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smoothly auto-scroll the active line into center view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const handleSendReaction = (_emoji: string) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#5EA8A1', '#8FAAB7', '#E1EBED', '#172327']
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--canvas-bg)] flex flex-col items-center justify-between p-6 md:p-8 select-none overflow-hidden transition-colors">
      
      {/* Top Header: Title & Close Button */}
      <div className="w-full flex items-center justify-between max-w-5xl z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Adora" className="w-8 h-8 rounded-full border border-[var(--border-subtle)]" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest font-semibold text-[var(--accent-primary)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Adora Expanded Sanctuary Mode
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Time-Synced Lyrics & Acoustic Waveforms</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-full bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all shadow-sm"
          title="Exit Expanded Mode"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece: Spinning Vinyl Disc & Live Synced Lyrics */}
      <div className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 my-4 overflow-hidden">
        
        {/* Left Side: The Vinyl Disc Assembly & Sync Wave Visualizer */}
        <div className="relative flex flex-col items-center justify-center flex-shrink-0">
          {/* Ambient Colored Backlight Glow */}
          <div 
            className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full blur-3xl opacity-35 transition-all duration-1000 -z-10"
            style={{ backgroundImage: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)` }}
          />

          {/* Vinyl Record */}
          <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : 'paused'}`}>
            {/* Grooves */}
            <div className="absolute inset-4 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-10 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-16 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-24 rounded-full border border-neutral-700/30" />

            {/* Center Label (Album Artwork) */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-neutral-900 shadow-inner">
              <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
            </div>

            {/* Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-[var(--canvas-bg)] border border-neutral-700" />
          </div>

          {/* LIVE ACOUSTIC WAVE VISUALIZER (Dancing in sync with song playback) */}
          <div className="mt-5 flex flex-col items-center gap-1.5">
            <div className="flex items-end gap-1.5 h-10 px-4 py-1.5 rounded-full bg-[var(--surface-card)]/80 border border-[var(--border-subtle)] shadow-sm backdrop-blur-sm">
              {[
                { base: 35, speed: 0.6 },
                { base: 65, speed: 0.4 },
                { base: 90, speed: 0.7 },
                { base: 50, speed: 0.5 },
                { base: 100, speed: 0.3 },
                { base: 75, speed: 0.6 },
                { base: 40, speed: 0.8 },
                { base: 85, speed: 0.4 },
                { base: 95, speed: 0.5 },
                { base: 60, speed: 0.7 },
                { base: 80, speed: 0.3 },
                { base: 45, speed: 0.6 },
                { base: 90, speed: 0.5 },
                { base: 70, speed: 0.4 },
                { base: 100, speed: 0.6 },
                { base: 55, speed: 0.7 },
                { base: 85, speed: 0.3 },
                { base: 40, speed: 0.5 }
              ].map((bar, idx) => {
                // If paused, bars settle down into a calm resting state
                const currentHeight = isPlaying 
                  ? `${Math.max(15, Math.min(100, bar.base + Math.sin((positionSec * 4) + idx) * 35))}%` 
                  : '15%';

                return (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-[var(--accent-primary)] transition-all duration-150 shadow-sm"
                    style={{
                      height: currentHeight,
                      opacity: isPlaying ? 0.9 : 0.3,
                      transform: isPlaying ? 'scaleY(1)' : 'scaleY(0.5)'
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-mono tracking-wider text-[var(--accent-primary)] opacity-80 uppercase">
              {isPlaying ? '♪ Acoustic Waves Synchronized' : 'Paused • Ready to Play'}
            </span>
          </div>

          {/* Social Sync Bubble (if active) */}
          {isBlendSession && (
            <div className="mt-3 flex items-center gap-2 bg-[var(--surface-card)] px-4 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--text-primary)]">
                Syncing with {blendParticipants.slice(1).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Song Metadata & Real-Time Auto-Scrolling Synced Lyrics */}
        <div className="flex-1 w-full max-w-lg flex flex-col h-full max-h-[55vh] lg:max-h-[62vh] justify-between gap-3">
          
          {/* Track Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--text-primary)] tracking-tight truncate">
                {track.title}
              </h2>
              <p className="text-xs font-medium text-[var(--text-muted)] truncate mt-0.5">
                {track.artist} — {track.album}
              </p>
            </div>
            <button 
              onClick={() => setIsFavorited(!isFavorited)}
              className="text-[var(--accent-primary)] hover:scale-110 transition-transform p-2 rounded-full hover:bg-[var(--surface-hover)]"
              title="Add to Sanctuary Favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Live Auto-Scrolling Synced Lyrics Container */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-4 shadow-inner no-scrollbar scroll-smooth"
          >
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek && onSeek(line.time)}
                  className={`cursor-pointer transition-all duration-300 py-1 px-3 rounded-2xl flex items-center justify-between group ${
                    isActive
                      ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 scale-105 shadow-sm'
                      : 'hover:bg-[var(--surface-hover)]/40'
                  }`}
                  title={`Click to jump to ${formatTime(line.time)}`}
                >
                  <p
                    className={`leading-relaxed transition-all ${
                      isActive
                        ? 'text-base md:text-lg font-bold text-[var(--accent-primary)]'
                        : isPast
                        ? 'text-xs md:text-sm text-[var(--text-muted)] opacity-60'
                        : 'text-xs md:text-sm text-[var(--text-muted)] opacity-35'
                    }`}
                  >
                    {line.text}
                  </p>
                  
                  <span className={`text-[10px] font-mono transition-opacity ${isActive ? 'text-[var(--accent-primary)] opacity-100 font-bold' : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-70'}`}>
                    {formatTime(line.time)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reactions */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Click any lyric line to jump in song</span>
            <div className="flex items-center gap-1.5">
              {['❤️', '🔥', '👏', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs transition-transform active:scale-125 shadow-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Transport Controls */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xl z-10 mb-2 px-4">
        {/* Scrubber */}
        {onSeek && (
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs font-mono text-[var(--text-muted)] min-w-8 text-right">
              {formatTime(positionSec)}
            </span>
            <div
              className="flex-1 h-2 bg-[var(--surface-card)] rounded-full relative cursor-pointer overflow-hidden group border border-[var(--border-subtle)]"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                onSeek(ratio * totalDuration);
              }}
            >
              <div
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] min-w-8">
              {formatTime(totalDuration)}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={onPrev}
            className="p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {onRewind && (
            <button
              onClick={onRewind}
              className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-0.5"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold">10s</span>
            </button>
          )}

          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>

          {onFastForward && (
            <button
              onClick={onFastForward}
              className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-0.5"
              title="Fast Forward 10 seconds"
            >
              <span className="text-[10px] font-mono font-bold">10s</span>
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onNext}
            className="p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
