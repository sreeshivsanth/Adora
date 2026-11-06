import React, { useState } from 'react';
import { Sparkles, Globe2, Heart, ArrowRight, Check, MapPin, Search } from 'lucide-react';
import { UserPreferences } from '../types';
import { REGIONS, RegionOption, StateOption, getStatesForRegion } from '../data/regions';
import { searchMatchingArtists, ARTISTS_DATABASE } from '../data/artists';

interface OnboardingModalProps {
  isOpen: boolean;
  username?: string;
  onComplete: (prefs: UserPreferences) => void;
}

const LANGUAGES = [
  { id: 'tamil', label: 'தமிழ்', sub: 'Tamil' },
  { id: 'hindi', label: 'हिंदी', sub: 'Hindi' },
  { id: 'english', label: 'English', sub: 'Global' },
  { id: 'telugu', label: 'తెలుగు', sub: 'Telugu' },
  { id: 'malayalam', label: 'മലയാളം', sub: 'Malayalam' },
  { id: 'punjabi', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
  { id: 'kannada', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { id: 'korean', label: '한국어', sub: 'Korean' },
  { id: 'spanish', label: 'Español', sub: 'Spanish' },
  { id: 'japanese', label: '日本語', sub: 'Japanese' }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  username,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRegion, setSelectedRegion] = useState<string>('IN');
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['tamil', 'english']);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh']);
  const [customArtist, setCustomArtist] = useState('');

  if (!isOpen) return null;

  const availableStates = getStatesForRegion(selectedRegion);

  const handleSelectRegion = (reg: RegionOption) => {
    setSelectedRegion(reg.code);
    const states = reg.states || [];
    if (states.length > 0) {
      setSelectedState(states[0].name);
      if (states[0].defaultLanguages) {
        setSelectedLangs(states[0].defaultLanguages);
      }
    } else {
      setSelectedState('');
      if (reg.defaultLanguages && reg.defaultLanguages.length > 0) {
        setSelectedLangs(reg.defaultLanguages);
      }
    }
  };

  const toggleLanguage = (id: string) => {
    setSelectedLangs(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const toggleArtist = (name: string) => {
    setSelectedArtists(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customArtist.trim();
    if (trimmed && !selectedArtists.includes(trimmed)) {
      setSelectedArtists(prev => [...prev, trimmed]);
      setCustomArtist('');
    }
  };

  const handleFinish = () => {
    onComplete({
      region: selectedRegion,
      state: selectedState,
      preferredLanguages: selectedLangs.length > 0 ? selectedLangs : ['tamil', 'hindi', 'english'],
      favoriteArtists: selectedArtists,
      onboardingCompleted: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        
        {/* Progress Bar & Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)]">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to Adora {username ? `, ${username}` : ''}
            </span>
            <span className="font-mono">Step {step} of 3</span>
          </div>

          <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
            />
          </div>
        </div>

        {/* STEP 1: Select Region & State */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--accent-primary)]" />
                Select Your Country & State
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your selected location tunes your live trending charts and regional culture feeds.
              </p>
            </div>

            {/* Country Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {REGIONS.map((reg) => {
                const isSelected = selectedRegion === reg.code;
                return (
                  <button
                    key={reg.code}
                    type="button"
                    onClick={() => handleSelectRegion(reg)}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-md scale-[1.02]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{reg.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{reg.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-[var(--canvas-bg)]/80' : 'text-[var(--text-muted)]'}`}>
                          {reg.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* State / Province Selector */}
            {availableStates.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Select State / Province:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {availableStates.map((st) => {
                    const isSelected = selectedState === st.name;
                    return (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => {
                          setSelectedState(st.name);
                          if (st.defaultLanguages && st.defaultLanguages.length > 0) {
                            setSelectedLangs(st.defaultLanguages);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] font-semibold shadow-sm'
                            : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{st.name}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all mt-1"
            >
              <span>Continue to Music Languages</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Select Languages */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[var(--accent-primary)]" />
                Choose Your Music Languages
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Select the languages you listen to. We'll tune your home playlists and trending music to match.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLangs.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleLanguage(lang.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-md scale-105'
                        : 'bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    <span className="text-sm font-bold">{lang.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-[var(--canvas-bg)]/80' : 'text-[var(--text-muted)]'}`}>
                      {lang.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedLangs.length === 0}
                className="flex-1 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span>Continue to Favorite Artists</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Favorite Artists */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[var(--accent-primary)]" />
                Pick Your Favorite Artists
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Type any artist name below to see live matches, or click popular picks.
              </p>
            </div>

            {/* Custom Artist Input with Autocomplete */}
            <div className="flex flex-col gap-1.5">
              <form onSubmit={handleAddCustom} className="flex gap-2">
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="Search artist (e.g. Anirudh, Rahman, Arijit, Taylor Swift)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
                >
                  Add
                </button>
              </form>

              {/* Suggestions dropdown when user types */}
              {customArtist.trim() && (
                <div className="p-2 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] shadow-xl flex flex-col gap-1 max-h-48 overflow-y-auto animate-fadeIn">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                    Matching Artists:
                  </span>
                  {searchMatchingArtists(customArtist.trim(), 6).length > 0 ? (
                    searchMatchingArtists(customArtist.trim(), 6).map((item) => {
                      const isSelected = selectedArtists.includes(item.name);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            if (!selectedArtists.includes(item.name)) {
                              setSelectedArtists(prev => [...prev, item.name]);
                            }
                            setCustomArtist('');
                          }}
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
                      onClick={() => {
                        const trimmed = customArtist.trim();
                        if (trimmed && !selectedArtists.includes(trimmed)) {
                          setSelectedArtists(prev => [...prev, trimmed]);
                        }
                        setCustomArtist('');
                      }}
                      className="px-3 py-1.5 rounded-xl text-left text-xs hover:bg-[var(--surface-card)] text-[var(--accent-primary)] font-semibold"
                    >
                      + Add custom artist "{customArtist.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Artists Chips */}
            {selectedArtists.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedArtists.map((artist) => (
                  <span
                    key={artist}
                    className="px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-semibold flex items-center gap-1.5"
                  >
                    {artist}
                    <button
                      onClick={() => toggleArtist(artist)}
                      className="hover:text-rose-500 transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Popular Grid */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Popular Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {ARTISTS_DATABASE.filter(a => a.trending).slice(0, 14).map((item) => {
                  const isSelected = selectedArtists.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleArtist(item.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{item.name}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-2xl bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Listening to Adora</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
