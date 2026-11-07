import React from 'react';
import { Play, Shuffle, ArrowLeft, Trash2, Clock, Music } from 'lucide-react';
import { Track, Playlist } from '../types';
import { TrackList } from './TrackList';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[]) => void;
  onShufflePlay: (tracks: Track[]) => void;
  onBack: () => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  allTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  onShufflePlay,
  onBack,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onToggleFavorite,
  onToggleDownload,
  onAddToQueue
}) => {
  // Resolve tracks that belong to this playlist
  const playlistTracks = playlist.trackIds
    .map(id => allTracks.find(t => t.id === id))
    .filter((t): t is Track => Boolean(t));

  const totalDurationSec = playlistTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0);
  const totalMins = Math.floor(totalDurationSec / 60);

  return (
    <div className="w-full flex flex-col gap-5 md:gap-6 select-none animate-fadeIn pb-44 md:pb-32 px-1">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
              onDeletePlaylist(playlist.id);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="Delete Playlist"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Playlist</span>
        </button>
      </div>

      {/* Playlist Hero Showcase */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 relative group">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)]">
              <Music className="w-12 h-12" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
            Personal Playlist
          </span>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-[var(--text-primary)]">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs md:text-sm text-[var(--text-muted)] max-w-lg">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium mt-1">
            <span>{playlistTracks.length} song{playlistTracks.length === 1 ? '' : 's'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {totalMins} min{totalMins === 1 ? '' : 's'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => onPlayAll(playlistTracks)}
              disabled={playlistTracks.length === 0}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Play All
            </button>
            <button
              onClick={() => onShufflePlay(playlistTracks)}
              disabled={playlistTracks.length === 0}
              className="px-4 py-2.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border-subtle)] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Track List */}
      {playlistTracks.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]/40">
          <Music className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">This playlist is empty</p>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            Search for songs in the Home catalog and use the "+ Add to Playlist" button to curate this playlist.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={playlistTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onSelectTrack={onPlayTrack}
          onToggleFavorite={onToggleFavorite}
          onToggleDownload={onToggleDownload}
          onAddToQueue={onAddToQueue}
          onRemoveFromPlaylist={(trackId) => onRemoveTrackFromPlaylist(playlist.id, trackId)}
          title="Playlist Tracks"
          subtitle={`Showing all ${playlistTracks.length} tracks in this collection`}
        />
      )}
    </div>
  );
};

