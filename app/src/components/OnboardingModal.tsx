import React, { useState } from 'react';
import { Sparkles, Globe2, Heart, ArrowRight, Check } from 'lucide-react';
import { UserPreferences } from '../types';

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
  { id: 'korean', label: '한국어', sub: 'Korean' },
  { id: 'spanish', label: 'Español', sub: 'Spanish' }
];

const SUGGESTED_ARTISTS = [
  'A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh', 'Sid Sriram',
  'Pritam', 'The Weeknd', 'Taylor Swift', 'BTS', 'NewJeans',
  'Shreya Ghoshal', 'Diljit Dosanjh', 'Linkin Park', 'Daft Punk', 'AP Dhillon'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  username,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['tamil', 'hindi', 'english']);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(['A.R. Rahman', 'Anirudh Ravichander']);
  const [customArtist, setCustomArtist] = useState('');

  if (!isOpen) return null;

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
      preferredLanguages: selectedLangs.length > 0 ? selectedLangs : ['tamil', 'hindi', 'english'],
      favoriteArtists: selectedArtists,
      onboardingCompleted: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Progress Bar & Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)]">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to Adora {username ? `, ${username}` : ''}
            </span>
            <span className="font-mono">Step {step} of 2</span>
          </div>

          <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Step 1: Select Languages */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
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

            <button
              onClick={() => setStep(2)}
              disabled={selectedLangs.length === 0}
              className="w-full py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              <span>Continue to Favorite Artists</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Select Favorite Artists */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                Pick Your Favorite Artists
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Help us tailor your Smart Autoplay and ambient recommendations.
              </p>
            </div>

            {/* Custom Artist Input */}
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                value={customArtist}
                onChange={(e) => setCustomArtist(e.target.value)}
                placeholder="Search or type an artist name..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                Add
              </button>
            </form>

            {/* Suggested Grid */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {SUGGESTED_ARTISTS.map((artist) => {
                const isSelected = selectedArtists.includes(artist);
                return (
                  <button
                    key={artist}
                    type="button"
                    onClick={() => toggleArtist(artist)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{artist}</span>
                    {isSelected && <Check className="w-3 h-3" />}
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
