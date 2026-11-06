import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Download, Check, Sparkles, ListMusic, FolderPlus } from 'lucide-react';
import { Track } from '../types';

interface FloatingPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  positionSec: number;
  durationSec?: number;
  onSeek: (pos: number) => void;
  onFastForward?: () => void;
  onRewind?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onOpenLivingRoom: () => void;
  onToggleDownload: (track: Track) => void;
  isBlendSession?: boolean;
  queueCount?: number;
  onOpenQueue?: () => void;
  onAddToPlaylist?: (track: Track) => void;
}

export const FloatingPlayer: React.FC<FloatingPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  positionSec,
  durationSec,
  onSeek,
  onFastForward,
  onRewind,
  volume,
  onVolumeChange,
  onOpenLivingRoom,
  onToggleDownload,
  isBlendSession = false,
  queueCount = 0,
  onOpenQueue,
  onAddToPlaylist
}) => {
  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const totalDuration = (durationSec && durationSec > 0)
    ? durationSec
    : (currentTrack.durationSec > 0 ? currentTrack.durationSec : 30);

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (positionSec / totalDuration) * 100))
    : 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-40 select-none">
      <div className="glass-panel rounded-3xl px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex flex-col gap-2 transition-all backdrop-blur-2xl bg-[var(--player-glass)] border border-white/10 dark:border-white/5">
        {/* Top Info Bar & Controls */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Artwork & Track Details */}
          <div className="flex items-center gap-3 min-w-0 max-w-[35%]">
            <div 
              className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0 cursor-pointer group"
              onClick={onOpenLivingRoom}
              title="Open Living Room Mode"
            >
              <img 
                src={currentTrack.cover} 
                alt={currentTrack.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold truncate text-[var(--text-primary)]">
                  {currentTrack.title}
                </h4>
                {isBlendSession && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Sparkles className="w-2.5 h-2.5" />
                    Blend
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {currentTrack.artist} • {currentTrack.album}
              </p>
            </div>
          </div>

          {/* Center: Tactile Transport Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onPrev}
              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {onRewind && (
              <button
                onClick={onRewind}
                className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center relative group"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold ml-0.5 font-mono">10</span>
              </button>
            )}

            <button
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all mx-1"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {onFastForward && (
              <button
                onClick={onFastForward}
                className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center relative group"
                title="Fast Forward 10 seconds"
              >
                <span className="text-[9px] font-bold mr-0.5 font-mono">10</span>
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onNext}
              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Actions, Queue, Playlist & Volume */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Queue Drawer Button */}
            {onOpenQueue && (
              <button
                onClick={onOpenQueue}
                className="p-2 rounded-full relative text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
                title="View Playback Queue"
              >
                <ListMusic className="w-4 h-4" />
                {queueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {queueCount}
                  </span>
                )}
              </button>
            )}

            {/* Add to Playlist Button */}
            {onAddToPlaylist && (
              <button
                onClick={() => onAddToPlaylist(currentTrack)}
                className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
                title="Add track to playlist"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}

            {/* Offline Vault Download Button */}
            <button
              onClick={() => onToggleDownload(currentTrack)}
              className={`p-2 rounded-full transition-all ${
                currentTrack.isDownloaded
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title={currentTrack.isDownloaded ? "Saved in Offline Vault" : "Download to Offline Vault"}
            >
              {currentTrack.isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            </button>

            {/* Volume Slider */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-[var(--surface-hover)] rounded-full accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            {/* Living Room Mode Icon */}
            <button
              onClick={onOpenLivingRoom}
              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
              title="Living Room Focus Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Timers */}
        <div className="flex items-center gap-3 w-full px-1">
          <span className="text-[11px] text-[var(--text-muted)] font-mono min-w-8 text-right">
            {formatTime(positionSec)}
          </span>
          
          <div 
            className="flex-1 h-2 bg-[var(--surface-hover)] rounded-full relative cursor-pointer overflow-hidden group py-0.5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(ratio * totalDuration);
            }}
          >
            <div 
              className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] text-[var(--text-muted)] font-mono min-w-8">
            {formatTime(totalDuration)}
          </span>
        </div>

      </div>
    </div>
  );
};
