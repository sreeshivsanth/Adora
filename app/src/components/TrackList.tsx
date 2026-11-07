import React from 'react';
import { Play, Heart, Download, Check, Globe, ShieldCheck, ListPlus, FolderPlus, Trash2 } from 'lucide-react';
import { Track } from '../types';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onIngestOnlineTrack?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemoveFromPlaylist?: (trackId: string) => void;
  title: string;
  subtitle?: string;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onToggleFavorite,
  onToggleDownload,
  onIngestOnlineTrack,
  onAddToQueue,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  title,
  subtitle
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-xs text-[var(--text-muted)] font-mono font-medium">
          {tracks.length} Track{tracks.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {tracks.map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id && isPlaying;
          const isSelected = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`group flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[var(--surface-hover)] border-[var(--accent-primary)]/40 shadow-sm'
                  : 'bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border-transparent'
              }`}
            >
              {/* Left Column: Number/Play, Art, Title, Artist */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-5 flex items-center justify-center flex-shrink-0">
                  {isThisPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5" title="Playing">
                      <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-pulse h-full" />
                      <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-pulse delay-75 h-2/3" />
                      <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-pulse delay-150 h-4/5" />
                    </div>
                  ) : isSelected ? (
                    <Play className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)] ml-0.5" />
                  ) : (
                    <>
                      <span className="text-xs font-mono text-[var(--text-muted)] group-hover:hidden">
                        {idx + 1}
                      </span>
                      <Play className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)] hidden group-hover:block ml-0.5" />
                    </>
                  )}
                </div>

                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                  <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                </div>

                <div className="min-w-0 pr-2">
                  <h4 className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)]'
                  }`}>
                    {track.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Center: Language, Year & Mood Badges */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  {track.language}
                </span>

                {track.releaseYear && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {track.releaseYear}
                  </span>
                )}

                {track.mood && (
                  <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] capitalize font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    {track.mood}
                  </span>
                )}

                {track.isStarred && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium" title="Immune from LRU Pruning">
                    <ShieldCheck className="w-3 h-3" />
                    Immune
                  </span>
                )}
              </div>

              {/* Right Column: Actions & Duration */}
              <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                {/* Add to Queue Button (Visible on sm+ screens to preserve mobile title room) */}
                {onAddToQueue && (
                  <button
                    onClick={() => onAddToQueue(track)}
                    className="hidden sm:flex p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--surface-hover)] transition-all"
                    title="Add to queue"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Add to Playlist Button (Visible on sm+ screens to preserve mobile title room) */}
                {onAddToPlaylist && (
                  <button
                    onClick={() => onAddToPlaylist(track)}
                    className="hidden sm:flex p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--surface-hover)] transition-all"
                    title="Add to playlist"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Remove from Playlist Button (if viewing inside a playlist) */}
                {onRemoveFromPlaylist && (
                  <button
                    onClick={() => onRemoveFromPlaylist(track.id)}
                    className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* JIT On-Demand Add Button if track is from online discovery */}
                {!track.isLocal && onIngestOnlineTrack && (
                  <button
                    onClick={() => onIngestOnlineTrack(track)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold hover:bg-[var(--accent-primary)] hover:text-white transition-all"
                    title="Add to permanent server library"
                  >
                    <Globe className="w-3 h-3" />
                    <span className="hidden md:inline">Save</span>
                  </button>
                )}

                {/* Favorite Star Button (Pins track from deletion) */}
                <button
                  onClick={() => onToggleFavorite(track.id)}
                  className={`p-1.5 rounded-full transition-transform hover:scale-110 ${
                    track.isStarred ? 'text-rose-500 fill-current' : 'text-[var(--text-muted)] hover:text-rose-500'
                  }`}
                  title={track.isStarred ? "Remove Favorite" : "Favorite (Pins to Library)"}
                >
                  <Heart className={`w-4 h-4 ${track.isStarred ? 'fill-current' : ''}`} />
                </button>

                {/* Download Offline Button */}
                <button
                  onClick={() => onToggleDownload(track)}
                  className={`p-1.5 rounded-full transition-colors ${
                    track.isDownloaded ? 'text-emerald-600' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={track.isDownloaded ? "Saved Offline" : "Save to Offline Vault"}
                >
                  {track.isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                </button>

                {/* Duration */}
                <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right">
                  {formatTime(track.durationSec)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
