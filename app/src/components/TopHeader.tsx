import React, { useState } from 'react';
import { 
  Search, Monitor, X, Sparkles, SlidersHorizontal, Calendar, 
  Sliders, Settings, Compass, Music2, Filter, CornerDownLeft, RefreshCw 
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
  const [searchMode, setSearchMode] = useState<'keyword' | 'filter'>(() => {
    return searchQuery.trim() ? 'keyword' : 'keyword';
  });
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

  return (
    <header className="w-full pt-4 pb-2 px-6 flex flex-col gap-3.5 select-none z-20">
      
      {/* Top Bar: Merged Search Mode Selector, Search Input Box, Search Button, Filters & Device Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Merged Search Unit: Mode Pill Toggle + Input Box + Initiate Search Button */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          
          {/* 1. Mode Pill Toggle (Song/Artist Name VS Filter-Only) */}
          <div className="flex items-center p-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-inner flex-shrink-0">
            <button
              onClick={() => handleModeChange('keyword')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                searchMode === 'keyword'
                  ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Search specific song title or artist name"
            >
              <Music2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Song / Artist</span>
            </button>
            <button
              onClick={() => handleModeChange('filter')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                searchMode === 'filter'
                  ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Discover songs using only filters (no typing required)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters Only</span>
            </button>
          </div>

          {/* 2. Search Input Container */}
          <div className="relative flex-1 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Search className="w-4 h-4" />
            </div>

            {searchMode === 'keyword' ? (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInitiateSearch();
                }}
                placeholder="Enter song name or artist (Press Enter ↵)..."
                className="w-full pl-10 pr-9 py-2 bg-[var(--surface-card)] text-xs md:text-sm rounded-full border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all shadow-inner"
              />
            ) : (
              <div 
                onClick={() => setShowFilters(true)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--surface-card)] text-xs rounded-full border border-[var(--border-subtle)] text-[var(--accent-primary)] font-medium cursor-pointer shadow-inner flex items-center justify-between"
              >
                <span className="truncate">Filter Discovery Active — Select criteria below</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 font-bold uppercase">
                  Discovery
                </span>
              </div>
            )}

            {searchMode === 'keyword' && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3. Explicit "Search" / "Initiate Search" Button */}
          <button
            onClick={handleInitiateSearch}
            disabled={isSearching}
            className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
            title="Click or press Enter to initiate search"
          >
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Search</span>
            <CornerDownLeft className="w-3 h-3 opacity-60 hidden md:inline" />
          </button>

          {/* 4. Filter Drawer Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
              showFilters || isFilterActive
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)]'
                : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Mood, Genre, Language & Era Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {isFilterActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Quick Language Pills (Scrollable on Desktop/Tablet) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
          {LANGUAGES.slice(0, 5).map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => {
                  setSelectedLanguage(lang.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                    : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Device Picker & Settings */}
        <div className="flex items-center gap-2.5 flex-shrink-0 self-end lg:self-center">
          <button
            onClick={onOpenDevicePicker}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-xs text-[var(--text-primary)] transition-all shadow-sm"
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
              className="p-2 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shadow-sm"
              title="Personalization Preferences (Languages & Artists)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-semibold border border-[var(--accent-primary)]/20">
              <Sparkles className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Merged Advanced Filters Panel with Explicit "Initiate Search" Options */}
      {showFilters && (
        <div className="p-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-4 shadow-2xl transition-all animate-fadeIn">
          
          {/* Top Panel Bar: Search Mode Decision & Primary Action Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
            
            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
                Search Mode:
              </span>
              <div className="flex items-center p-1 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => handleModeChange('keyword')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    searchMode === 'keyword'
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>Song or Artist Name</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('filter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    searchMode === 'filter'
                      ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Only Filter Option</span>
                </button>
              </div>
            </div>

            {/* If in keyword mode, show integrated search input directly inside the filter panel */}
            {searchMode === 'keyword' && (
              <div className="flex-1 flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInitiateSearch();
                  }}
                  placeholder="Type song title or artist name..."
                  className="w-full px-3.5 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 ml-auto">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('all');
                    setSelectedMood('all');
                    setSelectedGenre('all');
                    setSelectedYearRange(null);
                    setShowCustomRange(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors font-semibold"
                >
                  Reset All Filters
                </button>
              )}

              {/* Top Primary "Initiate Search" Button */}
              <button
                type="button"
                onClick={handleInitiateSearch}
                disabled={isSearching}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>
                  {isSearching ? 'Searching...' : searchMode === 'filter' ? 'Initiate Filter Search' : 'Initiate Search'}
                </span>
                <span className="text-[10px] opacity-75 font-mono">↵ Enter</span>
              </button>
            </div>
          </div>

          {/* Row 1: Language Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] min-w-24">
              Language:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
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

          {/* Row 2: Mood Filter (Breakup, Motivation, Sad, Chill, etc.) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] min-w-24">
              Mood Filter:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Genre Filter (Melody, Hip-Hop, Pop, Classical, etc.) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] min-w-24">
              Genre Filter:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
              {GENRES.map((g) => {
                const isSelected = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Release Year Range */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] min-w-24 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Year Range:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
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
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected && !showCustomRange
                        ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {era.label}
                  </button>
                );
              })}

              {/* Custom Range Pill */}
              <button
                onClick={() => setShowCustomRange(!showCustomRange)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1 ${
                  showCustomRange
                    ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Custom Range {selectedYearRange && showCustomRange ? `(${selectedYearRange.min} - ${selectedYearRange.max})` : ''}
              </button>
            </div>
          </div>

          {/* Custom Year Inputs when Custom Range is active */}
          {showCustomRange && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs">
              <span className="font-medium text-[var(--text-muted)]">From Year:</span>
              <input
                type="number"
                min="1950"
                max="2026"
                value={customMin}
                onChange={(e) => setCustomMin(parseInt(e.target.value) || 2000)}
                className="w-20 px-2 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-[var(--text-primary)] font-mono font-bold"
              />
              <span className="font-medium text-[var(--text-muted)]">To Year:</span>
              <input
                type="number"
                min="1950"
                max="2026"
                value={customMax}
                onChange={(e) => setCustomMax(parseInt(e.target.value) || 2026)}
                className="w-20 px-2 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-[var(--text-primary)] font-mono font-bold"
              />
              <button
                onClick={() => {
                  setSelectedYearRange({ min: Math.min(customMin, customMax), max: Math.max(customMin, customMax) });
                }}
                className="px-3.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--canvas-bg)] font-semibold shadow-sm hover:scale-105 transition-transform"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Bottom Sticky Action Bar: Active Criteria Summary & Prominent Primary Search Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] overflow-hidden">
              <span className="font-semibold text-[var(--text-primary)]">Active Filter Query:</span>
              <span className="truncate">
                {searchMode === 'keyword' && searchQuery.trim() ? `"${searchQuery.trim()}" • ` : ''}
                {selectedLanguage !== 'all' ? `${selectedLanguage.toUpperCase()} • ` : 'All Languages • '}
                {selectedMood !== 'all' ? `${selectedMood.toUpperCase()} • ` : 'All Moods • '}
                {selectedGenre !== 'all' ? `${selectedGenre.toUpperCase()} • ` : 'All Genres • '}
                {selectedYearRange ? `${selectedYearRange.min}–${selectedYearRange.max}` : 'All Eras'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleInitiateSearch}
              disabled={isSearching}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>
                {isSearching
                  ? 'Searching songs...'
                  : searchMode === 'filter'
                  ? 'Initiate Filter Discovery Search'
                  : 'Initiate Song & Artist Search'}
              </span>
              <span className="text-[10px] opacity-75 font-mono">↵ Press Enter</span>
            </button>
          </div>

        </div>
      )}

    </header>
  );
};
