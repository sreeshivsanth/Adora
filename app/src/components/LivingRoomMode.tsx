import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Sparkles, Heart, Activity, Music, Mic2, Download, Check } from 'lucide-react';
import { Track } from '../types';
import { LyricLine } from '../data/lyrics';
import { AuroraBilateralWave } from './AuroraBilateralWave';
import { fetchTrackLyrics } from '../services/api';

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
  onToggleDownload?: (track: Track) => void;
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
  onToggleDownload,
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

  // Real, accurate synchronized lyrics fetched dynamically from server / LRCLIB
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(true);
  const [lyricsAvailable, setLyricsAvailable] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setIsLoadingLyrics(true);
    setLyricsAvailable(true);

    fetchTrackLyrics(track.title, track.artist, totalDuration)
      .then(res => {
        if (!active) return;
        setIsLoadingLyrics(false);
        if (res && res.available && res.lines && res.lines.length > 0) {
          setLyrics(res.lines);
          setIsSynced(res.synced);
          setLyricsAvailable(true);
        } else {
          setLyrics([]);
          setIsSynced(false);
          setLyricsAvailable(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setIsLoadingLyrics(false);
        setLyrics([]);
        setIsSynced(false);
        setLyricsAvailable(false);
      });

    return () => { active = false; };
  }, [track.id, track.title, track.artist, totalDuration]);


  // High-frequency animation-frame time tracker for silky-smooth sub-second lyric tracking
  const [smoothTime, setSmoothTime] = useState(positionSec);

  useEffect(() => {
    setSmoothTime(positionSec);
  }, [positionSec]);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTs = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const delta = (now - lastTs) / 1000;
      lastTs = now;
      setSmoothTime(prev => Math.min(totalDuration, prev + delta));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, totalDuration]);

  // Active time with 150ms vocal anticipation lead
  const effectiveTime = Math.max(0, smoothTime + 0.15);

  // Find currently active lyric line index based on playback position
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    const lineTime = lyrics[i].time;
    const nextLineTime = i < lyrics.length - 1 ? lyrics[i + 1].time : Infinity;
    if (effectiveTime >= lineTime && effectiveTime < nextLineTime) {
      activeIndex = i;
      break;
    }
  }

  // Smoothly auto-scroll the active line into center view
  useEffect(() => {
    if (activeIndex >= 0 && activeLineRef.current && lyrics.length > 0) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, lyrics.length]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--canvas-bg)] flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-hidden transition-colors">
      
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
      <div className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-14 my-2 md:my-4 overflow-hidden">
        
        {/* Left Side: The Vinyl Disc Assembly & Sync Wave Visualizer */}
        <div className="relative flex flex-col items-center justify-center flex-shrink-0">
          {/* Ambient Colored Backlight Glow */}
          <div 
            className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full blur-3xl opacity-35 transition-all duration-1000 -z-10"
            style={{ backgroundImage: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)` }}
          />

          {/* Vinyl Record */}
          <div className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-80 md:h-80 rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : 'paused'}`}>
            {/* Grooves */}
            <div className="absolute inset-3 sm:inset-4 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-7 sm:inset-10 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-11 sm:inset-16 rounded-full border border-neutral-700/30" />
            <div className="absolute inset-16 sm:inset-24 rounded-full border border-neutral-700/30" />

            {/* Center Label (Album Artwork) */}
            <div className="w-20 h-20 sm:w-26 sm:h-26 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-neutral-900 shadow-inner">
              <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
            </div>

            {/* Spindle Hole */}
            <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[var(--canvas-bg)] border border-neutral-700" />
          </div>

          {/* Aurora Bilateral Wave Visualizer */}
          <div className="mt-3 md:mt-4 flex flex-col items-center w-full max-w-[260px] sm:max-w-xs md:max-w-sm">
            <div className="w-full px-3 py-2 rounded-2xl bg-[var(--surface-card)]/80 border border-[var(--border-subtle)] shadow-sm backdrop-blur-sm flex flex-col items-center">
              <AuroraBilateralWave isPlaying={isPlaying} height={60} positionSec={positionSec} className="w-full" />
            </div>
          </div>

          {/* Social Sync Bubble (if active) */}
          {isBlendSession && (
            <div className="mt-2.5 flex items-center gap-2 bg-[var(--surface-card)] px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--text-primary)]">
                Syncing with {blendParticipants.slice(1).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Song Metadata & Real-Time Auto-Scrolling Synced Lyrics */}
        <div className="flex-1 w-full max-w-lg flex flex-col h-full max-h-[42vh] sm:max-h-[50vh] lg:max-h-[62vh] justify-between gap-3">
          
          {/* Track Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--text-primary)] tracking-tight truncate">
                  {track.title}
                </h2>
                {isSynced && lyricsAvailable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <Mic2 className="w-3 h-3" /> Live Synced
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)] truncate mt-0.5">
                {track.artist} — {track.album}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleDownload && (
                <button
                  onClick={() => onToggleDownload(track)}
                  className={`p-2 rounded-full transition-all hover:scale-110 ${
                    track.isDownloaded
                      ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                  title={track.isDownloaded ? "Saved in Offline Vault" : "Download to Offline Vault"}
                >
                  {track.isDownloaded ? <Check className="w-5 h-5 text-emerald-400" /> : <Download className="w-5 h-5" />}
                </button>
              )}
              <button 
                onClick={() => setIsFavorited(!isFavorited)}
                className="text-[var(--accent-primary)] hover:scale-110 transition-transform p-2 rounded-full hover:bg-[var(--surface-hover)]"
                title="Add to Sanctuary Favorites"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Live Auto-Scrolling Synced Lyrics Container / Loading / Empty State */}
          {isLoadingLyrics ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-inner gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--accent-primary)] animate-pulse">
                <Music className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)] animate-pulse">
                Retrieving synchronized lyrics...
              </p>
            </div>
          ) : !lyricsAvailable || lyrics.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-inner">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--accent-primary)] mb-3">
                <Music className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Lyrics Not Available</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs leading-relaxed">
                Accurate lyrics are not available for this song. Enjoy the pure acoustic soundscape with Option 2 Aurora Bilateral visualizer.
              </p>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-4 shadow-inner no-scrollbar scroll-smooth"
            >
              {/* Instrumental Intro Indicator when before first lyric line */}
              {isSynced && activeIndex === -1 && (
                <div className="py-2.5 px-4 text-center rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border-subtle)] text-xs font-mono text-[var(--accent-primary)] animate-pulse flex items-center justify-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>♪ Instrumental Introduction — Lyrics begin soon ♪</span>
                </div>
              )}

              {lyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;

                return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => isSynced && onSeek && onSeek(line.time)}
                    className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-2xl flex items-center justify-between group ${
                      isActive
                        ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 scale-105 shadow-sm'
                        : 'hover:bg-[var(--surface-hover)]/40'
                    }`}
                    title={isSynced ? `Click to jump to ${formatTime(line.time)}` : undefined}
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
                    
                    {isSynced && (
                      <span className={`text-[10px] font-mono transition-opacity ${isActive ? 'text-[var(--accent-primary)] opacity-100 font-bold' : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-70'}`}>
                        {formatTime(line.time)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
