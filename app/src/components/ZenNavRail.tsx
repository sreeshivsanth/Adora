import React from 'react';
import { Disc3, FolderHeart, Users, Shield, Sun, Moon, Home, Settings } from 'lucide-react';
import { User } from '../types';

interface ZenNavRailProps {
  currentTab: 'studio' | 'vault' | 'sync' | 'admin';
  setCurrentTab: (tab: 'studio' | 'vault' | 'sync' | 'admin') => void;
  onGoHome: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
}

export const ZenNavRail: React.FC<ZenNavRailProps> = ({
  currentTab,
  setCurrentTab,
  onGoHome,
  darkMode,
  setDarkMode,
  currentUser,
  onOpenAuth,
  onOpenSettings
}) => {
  return (
    <aside className="w-16 md:w-20 h-screen flex flex-col items-center py-6 border-r border-[var(--border-subtle)] bg-[var(--surface-card)] transition-colors z-30 select-none">
      {/* Brand Logo Anchor (Clicks straight to Home Page) */}
      <div 
        className="w-11 h-11 rounded-full overflow-hidden shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform mb-6 p-0.5 bg-[var(--accent-primary)] ring-2 ring-transparent hover:ring-[var(--accent-primary)]"
        onClick={onGoHome}
        title="Adora Home (Return to Discovery & Playlists)"
      >
        <img 
          src="/logo.jpg" 
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
          className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 ${
            currentTab === 'vault'
              ? 'bg-[var(--accent-primary)] text-[var(--canvas-bg)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
          title="Vault (Offline & Favorites)"
        >
          <FolderHeart className="w-5 h-5" />
          <span className="text-[10px] font-medium hidden md:inline">Vault</span>
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
          title={darkMode ? "Switch to Linen Light Mode" : "Switch to Midnight Moss Dark Mode"}
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
  );
};
