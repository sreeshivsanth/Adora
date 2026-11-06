import React, { useState } from 'react';
import { X, Settings, Check, Plus, Sparkles, Heart, Globe2, MapPin } from 'lucide-react';
import { UserPreferences } from '../types';
import { REGIONS, RegionOption, getRegionByCode } from '../data/regions';
import { searchMatchingArtists, ARTISTS_DATABASE } from '../data/artists';

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

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(
    preferences?.region || 'IN'
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    preferences?.preferredLanguages || ['tamil', 'hindi', 'english']
  );
  const [artists, setArtists] = useState<string[]>(
    preferences?.favoriteArtists || ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh']
  );
  const [newArtistInput, setNewArtistInput] = useState('');

  if (!isOpen) return null;

  const currentRegion = getRegionByCode(selectedRegion);

  const toggleLanguage = (langId: string) => {
    setSelectedLangs(prev => 
      prev.includes(langId) 
        ? prev.filter(l => l !== langId)
        : [...prev, langId]
    );
  };

  const handleSelectRegion = (code: string) => {
    setSelectedRegion(code);
  };

  const handleAddArtist = (artistName?: string) => {
    const target = (artistName || newArtistInput).trim();
    if (!target) return;
    if (!artists.some(a => a.toLowerCase() === target.toLowerCase())) {
      setArtists(prev => [...prev, target]);
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
      region: selectedRegion,
      preferredLanguages: selectedLangs.length > 0 ? selectedLangs : ['tamil', 'hindi', 'english'],
      favoriteArtists: artists,
      onboardingCompleted: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-serif">Music Preferences</h3>
              <p className="text-xs text-[var(--text-muted)]">Personalize your region, languages, trending feeds & artists</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Listening Region & Country */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Listening Region & Trending Charts
          </label>
          <p className="text-[11px] text-[var(--text-muted)]">
            Select your country to tailor live trending charts, regional top 40s and search relevance:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {REGIONS.map((reg) => {
              const isSelected = selectedRegion === reg.code;
              return (
                <button
                  key={reg.code}
                  type="button"
                  onClick={() => handleSelectRegion(reg.code)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all text-left ${
                    isSelected
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{reg.flag}</span>
                    <span className="truncate">{reg.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Preferred Languages */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
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

        {/* Section 3: Favorite Artists with Autocomplete Suggestions */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            Favorite Artists
          </label>
          <p className="text-[11px] text-[var(--text-muted)]">
            Type any artist name below. We display matching artists across regional & global charts in real time.
          </p>

          {/* Autocomplete Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={newArtistInput}
                onChange={(e) => setNewArtistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddArtist();
                  }
                }}
                placeholder="Search artist name (e.g. Anirudh, Rahman, Arijit, Taylor Swift)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => handleAddArtist()}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
              >
                Add
              </button>
            </div>

            {/* Suggestions dropdown when user types */}
            {newArtistInput.trim() && (
              <div className="p-2 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] shadow-xl flex flex-col gap-1 max-h-44 overflow-y-auto animate-fadeIn">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Matching Artists:
                </span>
                {searchMatchingArtists(newArtistInput.trim(), 8).length > 0 ? (
                  searchMatchingArtists(newArtistInput.trim(), 8).map((item) => {
                    const isSelected = artists.some(a => a.toLowerCase() === item.name.toLowerCase());
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleAddArtist(item.name)}
                        className={`px-3 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold'
                            : 'hover:bg-[var(--surface-card)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{item.language} • {item.genre}</span>
                        </div>
                        <span className="text-[11px] font-medium text-[var(--accent-primary)]">
                          {isSelected ? '✓ Added' : '+ Add'}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddArtist()}
                    className="px-3 py-1.5 rounded-xl text-left text-xs hover:bg-[var(--surface-card)] text-[var(--accent-primary)] font-semibold"
                  >
                    + Add custom artist "{newArtistInput.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selected Artist Chips */}
          {artists.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {artists.map((artist) => (
                <span
                  key={artist}
                  className="px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-semibold flex items-center gap-1.5"
                >
                  {artist}
                  <button
                    onClick={() => setArtists(prev => prev.filter(a => a !== artist))}
                    className="hover:text-rose-500 transition-colors ml-0.5"
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick Add Suggestions */}
          <div className="pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
              Popular Quick Add:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {ARTISTS_DATABASE.filter(a => a.trending).slice(0, 16).map((item) => {
                const isSelected = artists.some(a => a.toLowerCase() === item.name.toLowerCase());
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleToggleArtist(item.name)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] font-medium shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.name}
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
