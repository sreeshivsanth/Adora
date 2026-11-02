import React from 'react';
import { Search, Monitor, X, Sparkles } from 'lucide-react';
import { Device, User } from '../types';

interface TopHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: any) => void;
  activeDevice: Device | null;
  onOpenDevicePicker: () => void;
  currentUser: User | null;
}

const LANGUAGES = [
  { id: 'all', label: 'All Curations' },
  { id: 'tamil', label: 'தமிழ் (Tamil)' },
  { id: 'hindi', label: 'हिंदी (Hindi)' },
  { id: 'english', label: 'English' },
  { id: 'korean', label: '한국어 (Korean)' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  activeDevice,
  onOpenDevicePicker,
  currentUser
}) => {
  return (
    <header className="w-full pt-5 pb-3 px-6 flex flex-col md:flex-row items-center justify-between gap-4 select-none z-20">
      {/* Search Input Box */}
      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library or discover online..."
          className="w-full pl-10 pr-9 py-2 bg-[var(--surface-card)] text-sm rounded-full border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Language Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 no-scrollbar">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => setSelectedLanguage(lang.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] border-[var(--accent-primary)] shadow-sm'
                  : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-secondary)]'
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {/* Device Indicator & Status Pill */}
      <div className="flex items-center gap-3">
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

        {currentUser?.role === 'admin' && (
          <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-semibold border border-[var(--accent-primary)]/20">
            <Sparkles className="w-3 h-3" />
            Admin Tenancy
          </span>
        )}
      </div>
    </header>
  );
};
