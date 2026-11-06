import React, { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';
import { Playlist } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (playlist: Playlist) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600'
];

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      coverUrl: selectedCover,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onCreatePlaylist(newPlaylist);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex-shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-serif truncate">Create Playlist</h3>
              <p className="text-xs text-[var(--text-muted)] truncate">Organize your favorite sanctuary songs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Late Night Drives, Focus Flow"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Ambient soundtrack for reading & coding"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Cover Art Presets */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Select Cover Artwork
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COVERS.map((cov, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCover(cov)}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${
                    selectedCover === cov
                      ? 'border-[var(--accent-primary)] scale-105 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={cov} alt="Cover" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 transition-transform"
            >
              Create Playlist
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

