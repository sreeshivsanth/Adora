import React, { useState } from 'react';
import { 
  Search, Monitor, X, Sparkles, SlidersHorizontal, Calendar, 
  Sliders, Settings, Compass, Music2, CornerDownLeft, RefreshCw, RotateCcw 
} from 'lucide-react';
import { Device, User } from '../types';

interface TopHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  selectedYearRange: { min: number; max: number } | null;
  setSelectedYearRange: (range: { min: number; max: number } | null) => void;
  activeDevice: Device | null;
  onOpenDevicePicker: () => void;
  currentUser: User | null;
  onOpenSettings?: () => void;
  onExecuteSearch?: (overrideQuery?: string) => void;
  isSearching?: boolean;
}

const LANGUAGES = [
  { id: 'all', label: 'All Curations' },
  { id: 'tamil', label: 'தமிழ் (Tamil)' },
  { id: 'hindi', label: 'हिंदी (Hindi)' },
  { id: 'english', label: 'English' },
  { id: 'telugu', label: 'తెలుగు (Telugu)' },
  { id: 'malayalam', label: 'മലയാളം (Malayalam)' },
  { id: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { id: 'korean', label: '한국어 (Korean)' },
  { id: 'kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { id: 'spanish', label: 'Español' },
];

const MOODS = [
  { id: 'all', label: 'All Moods' },
  { id: 'breakup', label: '💔 Breakup' },
  { id: 'motivation', label: '🔥 Motivation' },
  { id: 'sad', label: '🌧️ Sad' },
  { id: 'chill', label: '☕ Chill' },
  { id: 'energetic', label: '⚡ Energetic' },
  { id: 'romantic', label: '💖 Romantic' },
  { id: 'focus', label: '🎧 Focus' },
  { id: 'party', label: '🎉 Party' },
  { id: 'acoustic', label: '🎸 Acoustic' },
  { id: 'devotional', label: '🙏 Devotional' }
];

const GENRES = [
  { id: 'all', label: 'All Genres' },
  { id: 'melody', label: '🎵 Melody' },
  { id: 'hip-hop', label: '🎤 Hip-Hop / Rap' },
  { id: 'pop', label: '✨ Pop' },
  { id: 'rock', label: '🎸 Rock / Metal' },
  { id: 'classical', label: '🎻 Classical / Carnatic' },
  { id: 'r&b', label: '🎷 R&B / Soul' },
  { id: 'edm', label: '🎛️ EDM / Electronic' },
  { id: 'folk', label: '🪕 Folk / Indie' },
  { id: 'devotional', label: '🕉️ Devotional' }
];

const YEAR_ERAS = [
  { id: 'all', label: 'All Eras', min: 1950, max: 2026 },
  { id: '2020-2026', label: '2020 – 2026 (Recent)', min: 2020, max: 2026 },
  { id: '2010-2019', label: '2010 – 2019', min: 2010, max: 2019 },
  { id: '2000-2009', label: '2000 – 2009', min: 2000, max: 2009 },
  { id: '1980-1999', label: '80s – 90s Classics', min: 1980, max: 1999 }
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedMood,
  setSelectedMood,
  selectedGenre,
  setSelectedGenre,
  selectedYearRange,
  setSelectedYearRange,
  activeDevice,
  onOpenDevicePicker,
  currentUser,
  onOpenSettings,
  onExecuteSearch,
  isSearching = false
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'keyword' | 'filter'>('keyword');
  const [customMin, setCustomMin] = useState(2000);
  const [customMax, setCustomMax] = useState(2026);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const isFilterActive = selectedMood !== 'all' || selectedGenre !== 'all' || selectedLanguage !== 'all' || selectedYearRange !== null;

  const handleModeChange = (mode: 'keyword' | 'filter') => {
    setSearchMode(mode);
    if (mode === 'filter') {
      setSearchQuery('');
      setShowFilters(true);
    }
  };

  const handleInitiateSearch = () => {
    if (searchMode === 'filter') {
      setSearchQuery('');
      onExecuteSearch?.('');
    } else {
      onExecuteSearch?.(searchQuery.trim());
    }
  };

  const handleResetFilters = () => {
    setSelectedLanguage('all');
    setSelectedMood('all');
    setSelectedGenre('all');
    setSelectedYearRange(null);
    setShowCustomRange(false);
  };

  return (
    <header className="w-full pt-4 pb-2 px-6 flex flex-col gap-4 select-none z-20">
      
      {/* 1. Spacious & Clean Top Bar (Zero Overlap) */}
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Left: Clean Search Bar & Filter Toggle Button */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          
          {/* Search Input Box with Inside Search Action */}
          <div className="relative flex-1 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (searchMode === 'filter' && e.target.value) {
                  setSearchMode('keyword');
                }
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInitiateSearch();
              }}
              placeholder={
                searchMode === 'filter'
                  ? 'Filtering mode active (type here or press Enter to search)...'
                  : 'Search songs or artists (Press Enter ↵)...'
              }
              className="w-full pl-10 pr-20 py-2.5 bg-[var(--surface-card)] text-xs md:text-sm rounded-full border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all shadow-inner"
            />

            {/* Clear Input Button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-14 pr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Inset Search Execution Button */}
            <button
              onClick={handleInitiateSearch}
              disabled={isSearching}
              className="absolute right-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              title="Initiate Search"
            >
              {isSearching ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Search</span>
              <CornerDownLeft className="w-2.5 h-2.5 opacity-60 hidden md:inline" />
            </button>
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
              showFilters || isFilterActive
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)]'
                : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Relaxed Filters Panel"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {isFilterActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Controls: Device & Settings */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={onOpenDevicePicker}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-xs text-[var(--text-primary)] transition-all shadow-sm"
            title="Adora Connect Devices"
          >
            <Monitor className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline font-medium">
              {activeDevice ? activeDevice.deviceName : 'This Device'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shadow-sm"
              title="Personalization Preferences (Languages & Artists)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <span className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-semibold border border-[var(--accent-primary)]/20">
              <Sparkles className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>
      </div>

      {/* 2. Relaxed, Elegant Filters Panel */}
      {showFilters && (
        <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-2xl flex flex-col gap-6 animate-fadeIn transition-all">
          
          {/* Panel Top: Relaxed Search Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Search Mode:
              </span>
              <div className="flex items-center p-1 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => handleModeChange('keyword')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    searchMode === 'keyword'
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>By Song or Artist Name</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('filter')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    searchMode === 'filter'
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>By Filters Only (Discovery)</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {searchMode === 'keyword'
                ? 'Type song or artist name above, or hit Enter to search with filters.'
                : 'Discover songs by mood, genre, and language without typing any title.'}
            </p>
          </div>

          {/* Section 1: Mood Filter */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
              <span>Mood Filter</span>
              <span className="text-[10px] text-[var(--text-muted)] lowercase font-normal">
                (select any vibe)
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm scale-105'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Genre Filter */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
              <span>Genre Filter</span>
              <span className="text-[10px] text-[var(--text-muted)] lowercase font-normal">
                (melody, hip-hop, classical & more)
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const isSelected = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm scale-105'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Two-Column Group for Language & Year Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[var(--border-subtle)]">
            
            {/* Language Selection */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                Language
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Range / Era */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Release Era</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {YEAR_ERAS.map((era) => {
                  const isSelected = era.id === 'all'
                    ? selectedYearRange === null
                    : selectedYearRange?.min === era.min && selectedYearRange?.max === era.max;

                  return (
                    <button
                      key={era.id}
                      onClick={() => {
                        setShowCustomRange(false);
                        if (era.id === 'all') setSelectedYearRange(null);
                        else setSelectedYearRange({ min: era.min, max: era.max });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        isSelected && !showCustomRange
                          ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {era.label}
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowCustomRange(!showCustomRange)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${
                    showCustomRange
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Custom Range</span>
                </button>
              </div>

              {/* Custom Year Inputs */}
              {showCustomRange && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs mt-1 animate-fadeIn">
                  <span className="text-[var(--text-muted)]">From:</span>
                  <input
                    type="number"
                    min="1950"
                    max="2026"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseInt(e.target.value) || 2000)}
                    className="w-16 px-2 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-[var(--text-primary)] font-mono font-bold"
                  />
                  <span className="text-[var(--text-muted)]">To:</span>
                  <input
                    type="number"
                    min="1950"
                    max="2026"
                    value={customMax}
                    onChange={(e) => setCustomMax(parseInt(e.target.value) || 2026)}
                    className="w-16 px-2 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-[var(--text-primary)] font-mono font-bold"
                  />
                  <button
                    onClick={() => {
                      setSelectedYearRange({ min: Math.min(customMin, customMax), max: Math.max(customMin, customMax) });
                    }}
                    className="px-3 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--canvas-bg)] font-semibold shadow-sm hover:scale-105 transition-transform ml-auto"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Panel Bottom: Single, Unified, Relaxed Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
            
            {/* Criteria Summary */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] truncate">
              <span className="font-semibold text-[var(--text-primary)]">Selected:</span>
              <span className="truncate">
                {searchMode === 'keyword' && searchQuery.trim() ? `"${searchQuery.trim()}" • ` : ''}
                {selectedLanguage !== 'all' ? `${selectedLanguage.toUpperCase()} • ` : 'All Languages • '}
                {selectedMood !== 'all' ? `${selectedMood.toUpperCase()} • ` : 'All Moods • '}
                {selectedGenre !== 'all' ? `${selectedGenre.toUpperCase()} • ` : 'All Genres • '}
                {selectedYearRange ? `${selectedYearRange.min}–${selectedYearRange.max}` : 'All Eras'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}

              {/* Single Primary Search Trigger Button */}
              <button
                type="button"
                onClick={handleInitiateSearch}
                disabled={isSearching}
                className="px-6 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>
                  {isSearching
                    ? 'Searching...'
                    : searchMode === 'filter'
                    ? 'Initiate Filter Discovery Search'
                    : 'Initiate Search'}
                </span>
                <span className="text-[10px] opacity-75 font-mono">↵ Enter</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </header>
  );
};
