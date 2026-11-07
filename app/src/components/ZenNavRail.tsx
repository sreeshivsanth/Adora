import React from 'react';
import { Disc3, FolderHeart, Users, Shield, Sun, Moon, Home, Settings, TrendingUp } from 'lucide-react';
import { User } from '../types';

interface ZenNavRailProps {
  currentTab: 'studio' | 'vault' | 'sync' | 'admin' | 'trends';
  setCurrentTab: (tab: 'studio' | 'vault' | 'sync' | 'admin' | 'trends') => void;
  onGoHome: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
  vaultCount?: number;
}

export const ZenNavRail: React.FC<ZenNavRailProps> = ({
  currentTab,
  setCurrentTab,
  onGoHome,
  darkMode,
  setDarkMode,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  vaultCount = 0
}) => {
  return (
    <>
      {/* 1. Desktop Vertical Navigation Rail (hidden on mobile, visible on tablet/desktop) */}
      <aside className="hidden md:flex w-16 lg:w-20 h-screen flex-col items-center py-6 border-r border-[var(--border-subtle)] bg-[var(--surface-card)] transition-colors z-30 select-none shrink-0">
        {/* Brand Logo Anchor (Clicks straight to Home Page) */}
        <div 
          className="w-11 h-11 rounded-full overflow-hidden shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform mb-6 p-0.5 bg-[var(--accent-primary)] ring-2 ring-transparent hover:ring-[var(--accent-primary)]"
          onClick={onGoHome}
          title="Adora Home (Return to Discovery & Playlists)"
        >
          <img 
            src="/logo.png" 
            alt="Adora" 
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col gap-5 items-center">
          {/* Explicit Home / Discovery Button */}
          <button
            onClick={onGoHome}
            className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 ${
              currentTab === 'studio'
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Home Page (Playlists, Trending, Discovery)"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium hidden md:inline">Home</span>
          </button>

          <button
            onClick={() => setCurrentTab('vault')}
            className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 relative ${
              currentTab === 'vault'
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Vault (Offline & Favorites)"
          >
            <FolderHeart className="w-5 h-5" />
            <span className="text-[10px] font-medium hidden md:inline">Vault</span>
            {vaultCount > 0 && (
              <span className={`absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                currentTab === 'vault'
                  ? 'bg-[var(--canvas-bg)] text-[var(--accent-primary)]'
                  : 'bg-[var(--accent-primary)] text-[var(--canvas-bg)]'
              } shadow-sm`}>
                {vaultCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('sync')}
            className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 relative ${
              currentTab === 'sync'
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Adora Sync (Group Listening Sessions)"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium hidden md:inline">Sync</span>
          </button>

          {/* App Trends & Most Played Charts */}
          <button
            onClick={() => setCurrentTab('trends')}
            className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 relative ${
              currentTab === 'trends'
                ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="App Trends & Most Played Songs in Adora"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium hidden md:inline">Trends</span>
          </button>

          {/* Admin Studio Button (Only active when logged in as Admin) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 ${
                currentTab === 'admin'
                  ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
                  : 'text-[var(--accent-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Admin Studio & Telemetry"
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-semibold hidden md:inline">Admin</span>
            </button>
          )}
        </nav>

        {/* Footer Controls: Personalization Settings, Theme Toggle & User Avatar */}
        <div className="flex flex-col gap-3.5 items-center mt-auto">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
              title="Personalization Preferences (Languages & Artists)"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            title={darkMode ? "Switch to Sea-Foam Slate Light Mode" : "Switch to Abyssal Tide Dark Mode"}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onOpenAuth}
            className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all overflow-hidden"
            title={currentUser ? `Logged in as ${currentUser.username}` : "Log In"}
          >
            {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : "?"}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Bottom Navigation Bar (replaces side rail on mobile phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface-card)]/95 backdrop-blur-2xl border-t border-[var(--border-subtle)] z-40 flex items-center justify-around px-2 py-1 select-none shadow-[0_-6px_25px_rgba(0,0,0,0.25)]">
        {/* Home */}
        <button
          onClick={onGoHome}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            currentTab === 'studio'
              ? 'text-[var(--accent-primary)] font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'studio' ? 'bg-[var(--accent-primary)]/15 scale-105' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Vault */}
        <button
          onClick={() => setCurrentTab('vault')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
            currentTab === 'vault'
              ? 'text-[var(--accent-primary)] font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'vault' ? 'bg-[var(--accent-primary)]/15 scale-105' : ''}`}>
            <FolderHeart className="w-5 h-5" />
            {vaultCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-[9px] font-bold flex items-center justify-center font-mono">
                {vaultCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Vault</span>
        </button>

        {/* Sync / Blend */}
        <button
          onClick={() => setCurrentTab('sync')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            currentTab === 'sync'
              ? 'text-[var(--accent-primary)] font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'sync' ? 'bg-[var(--accent-primary)]/15 scale-105' : ''}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Blend</span>
        </button>

        {/* Trends */}
        <button
          onClick={() => setCurrentTab('trends')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            currentTab === 'trends'
              ? 'text-[var(--accent-primary)] font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'trends' ? 'bg-[var(--accent-primary)]/15 scale-105' : ''}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Trends</span>
        </button>

        {/* Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <div className="p-1 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Settings</span>
          </button>
        )}
      </nav>
    </>
  );
};
