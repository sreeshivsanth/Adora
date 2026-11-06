import React from 'react';
import { X, Check, Plus, FolderPlus, Music } from 'lucide-react';
import { Track, Playlist } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onToggleTrackInPlaylist: (playlistId: string, trackId: string) => void;
  onOpenCreatePlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onToggleTrackInPlaylist,
  onOpenCreatePlaylist
}) => {
  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex-shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-serif truncate">Add to Playlist</h3>
              <p className="text-xs text-[var(--text-muted)] truncate" title={`${track.title} — ${track.artist}`}>
                {track.title} <span className="opacity-60">— {track.artist}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex-shrink-0 p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlists List */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
              No playlists found. Create your first playlist below!
            </div>
          ) : (
            playlists.map((pl) => {
              const isInPlaylist = pl.trackIds.includes(track.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => onToggleTrackInPlaylist(pl.id, track.id)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                    isInPlaylist
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 shadow-sm'
                      : 'bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)]">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{pl.name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{pl.trackIds.length} tracks</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border flex-shrink-0 transition-all ${
                    isInPlaylist
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                      : 'border-[var(--border-subtle)] text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Create Playlist Action */}
        <button
          onClick={() => {
            onClose();
            onOpenCreatePlaylist();
          }}
          className="w-full py-2.5 rounded-2xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-[var(--accent-primary)] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent-primary)]/5 transition-all mt-1"
        >
          <Plus className="w-4 h-4" />
          Create New Playlist
        </button>

      </div>
    </div>
  );
};

