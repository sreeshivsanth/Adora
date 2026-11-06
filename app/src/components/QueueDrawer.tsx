import React from 'react';
import { X, Trash2, Play, Sparkles, ListMusic, Music, Radio } from 'lucide-react';
import { Track } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  upcomingAutoplayTrack: Track | null;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  queue,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  upcomingAutoplayTrack
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end select-none animate-fadeIn">
      {/* Click outside to close backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md h-full bg-[var(--surface-card)] border-l border-[var(--border-subtle)] p-6 shadow-2xl flex flex-col gap-5 overflow-y-auto z-10">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-serif">Playback Queue</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {queue.length} custom song{queue.length === 1 ? '' : 's'} queued
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Clear entire queue"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Now Playing */}
        {currentTrack && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Now Playing
            </span>
            <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--accent-primary)]/30 flex items-center gap-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-xl overflow-hidden relative shadow-md flex-shrink-0">
                <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-1 bg-white rounded-full animate-pulse h-full" />
                      <span className="w-1 bg-white rounded-full animate-pulse delay-75 h-2/3" />
                      <span className="w-1 bg-white rounded-full animate-pulse delay-150 h-4/5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{currentTrack.title}</h4>
                <p className="text-xs text-[var(--text-muted)] truncate">{currentTrack.artist}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                    {currentTrack.language}
                  </span>
                  {currentTrack.mood && (
                    <span className="text-[10px] capitalize font-medium text-[var(--text-muted)]">
                      • {currentTrack.mood} mood
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {formatTime(currentTrack.durationSec)}
              </span>
            </div>
          </div>
        )}

        {/* Section 2: Up Next in Queue */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Up Next in Queue ({queue.length})
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 px-4 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center flex flex-col items-center justify-center gap-2 bg-[var(--surface-hover)]/30">
              <Music className="w-6 h-6 text-[var(--text-muted)] opacity-50" />
              <p className="text-xs font-medium text-[var(--text-muted)]">Your queue is empty.</p>
              <p className="text-[11px] text-[var(--text-muted)]/80 max-w-xs">
                Add songs using the queue button on any track, or let Smart Autoplay pick songs matching your mood.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}_${idx}`}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] border border-transparent transition-all"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => onPlayTrack(track)}
                  >
                    <span className="text-xs font-mono text-[var(--text-muted)] w-4 text-center group-hover:hidden">
                      {idx + 1}
                    </span>
                    <Play className="w-3.5 h-3.5 text-[var(--accent-primary)] hidden group-hover:block ml-0.5 fill-current" />
                    
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-[var(--text-primary)] truncate">{track.title}</h5>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {formatTime(track.durationSec)}
                    </span>
                    <button
                      onClick={() => onRemoveFromQueue(idx)}
                      className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Smart Autoplay (Upcoming Mood Match) */}
        {upcomingAutoplayTrack && (
          <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Coming Next via Mood Autoplay
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Auto-Plays when queue ends
              </span>
            </div>

            <div 
              className="p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 flex items-center justify-between gap-3 cursor-pointer group transition-all"
              onClick={() => onPlayTrack(upcomingAutoplayTrack)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  <img src={upcomingAutoplayTrack.cover} alt={upcomingAutoplayTrack.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)]">
                    {upcomingAutoplayTrack.title}
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {upcomingAutoplayTrack.artist} • {upcomingAutoplayTrack.mood || 'Mood Match'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(upcomingAutoplayTrack);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                  Play
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

