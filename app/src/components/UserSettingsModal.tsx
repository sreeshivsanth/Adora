import React, { useState } from 'react';
import { X, Settings, Check, Plus, Sparkles, Heart, Globe2 } from 'lucide-react';
import { UserPreferences } from '../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
}

const ALL_LANGUAGES = [
  { id: 'tamil', label: 'தமிழ் (Tamil)' },
  { id: 'hindi', label: 'हिंदी (Hindi)' },
  { id: 'english', label: 'English' },
  { id: 'telugu', label: 'తెలుగు (Telugu)' },
  { id: 'malayalam', label: 'മലയാളം (Malayalam)' },
  { id: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { id: 'kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { id: 'korean', label: '한국어 (Korean)' },
  { id: 'spanish', label: 'Español (Spanish)' },
  { id: 'japanese', label: '日本語 (Japanese)' }
];

const POPULAR_ARTISTS = [
  'A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh', 'Sid Sriram',
  'Pritam', 'The Weeknd', 'Taylor Swift', 'BTS', 'NewJeans',
  'Shreya Ghoshal', 'Diljit Dosanjh', 'Linkin Park', 'Daft Punk',
  'AP Dhillon', 'Ed Sheeran', 'Coldplay'
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences
}) => {
  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    preferences?.preferredLanguages || ['tamil', 'hindi', 'english']
  );
  const [artists, setArtists] = useState<string[]>(
    preferences?.favoriteArtists || ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh']
  );
  const [newArtistInput, setNewArtistInput] = useState('');

  if (!isOpen) return null;

  const toggleLanguage = (langId: string) => {
    setSelectedLangs(prev => 
      prev.includes(langId) 
        ? prev.filter(l => l !== langId)
        : [...prev, langId]
    );
  };

  const handleAddArtist = () => {
    const trimmed = newArtistInput.trim();
    if (!trimmed) return;
    if (!artists.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setArtists(prev => [...prev, trimmed]);
    }
    setNewArtistInput('');
  };

  const handleToggleArtist = (artistName: string) => {
    if (artists.includes(artistName)) {
      setArtists(prev => prev.filter(a => a !== artistName));
    } else {
      setArtists(prev => [...prev, artistName]);
    }
  };

  const handleSave = () => {
    onSavePreferences({
      preferredLanguages: selectedLangs.length > 0 ? selectedLangs : ['tamil', 'hindi', 'english'],
      favoriteArtists: artists,
      onboardingCompleted: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-serif">Music Preferences</h3>
              <p className="text-xs text-[var(--text-muted)]">Personalize your languages, trending feeds & artists</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Preferred Languages */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" />
            Preferred Music Languages
          </label>
          <p className="text-[11px] text-[var(--text-muted)]">
            Select the languages you enjoy. We prioritize these in discovery and trending playlists.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {ALL_LANGUAGES.map((lang) => {
              const isSelected = selectedLangs.includes(lang.id);
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => toggleLanguage(lang.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-1.5 transition-all text-left ${
                    isSelected
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="truncate">{lang.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Favorite Artists */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            Favorite Artists
          </label>
          <p className="text-[11px] text-[var(--text-muted)]">
            Choose or add artists you love for personalized autoplay and tailored recommendations.
          </p>

          {/* Input to add custom artist */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newArtistInput}
              onChange={(e) => setNewArtistInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddArtist()}
              placeholder="Type any artist name & press Enter..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              type="button"
              onClick={handleAddArtist}
              className="px-3 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Selected Artists Chips */}
          {artists.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {artists.map((artist) => (
                <span
                  key={artist}
                  className="px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-semibold flex items-center gap-1.5"
                >
                  {artist}
                  <button
                    onClick={() => handleToggleArtist(artist)}
                    className="hover:text-rose-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick Pick Popular Artists */}
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
              Popular Picks (Click to Add / Remove):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ARTISTS.map((artist) => {
                const isSelected = artists.includes(artist);
                return (
                  <button
                    key={artist}
                    type="button"
                    onClick={() => handleToggleArtist(artist)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] font-medium shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {artist}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 transition-transform flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
