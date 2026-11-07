import React, { useState } from 'react';
import { X, Sparkles, Download, ExternalLink, Smartphone, Monitor, CheckCircle, ArrowRight } from 'lucide-react';
import { UpdateInfo, dismissUpdateVersion, formatBytes } from '../services/updateService';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleDismiss = () => {
    dismissUpdateVersion(updateInfo.latestVersion);
    onClose();
  };

  const handleDownload = (url: string) => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detect platform hint
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = userAgent.includes('android');
  const isWindows = userAgent.includes('windows');
  const isLinux = userAgent.includes('linux') && !isAndroid;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Update Ready
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {new Date(updateInfo.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {updateInfo.releaseTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Transition Badge */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[var(--canvas-bg)]/80 border border-[var(--border-subtle)] font-mono text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span>Installed:</span>
            <span className="font-semibold text-[var(--text-primary)]">v{updateInfo.currentVersion}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>New Version:</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Release Notes */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            What's New in this Release:
          </span>
          <div className="bg-[var(--canvas-bg)]/60 border border-[var(--border-subtle)]/70 rounded-2xl p-4 text-xs text-[var(--text-primary)]/90 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
            {updateInfo.releaseNotes}
          </div>
        </div>

        {/* Download Notice / Success Message */}
        {downloadStarted && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Download Started!</span>
              <span className="opacity-90">
                {isAndroid
                  ? 'Once download completes, tap the file in your notification bar or Downloads folder to install. Your playlists, history, and offline songs will be preserved.'
                  : 'Run the downloaded installer to apply the update.'}
              </span>
            </div>
          </div>
        )}

        {/* Download Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* 1. Android APK Download */}
          {updateInfo.apkAsset && (
            <button
              onClick={() => handleDownload(updateInfo.apkAsset!.browser_download_url)}
              className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between font-semibold text-xs shadow-md transition-all active:scale-[0.98] ${
                isAndroid
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 ring-2 ring-emerald-500/30'
                  : 'bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col items-start text-left">
                  <span>Download Android APK</span>
                  <span className="text-[10px] opacity-75 font-mono font-normal">
                    {updateInfo.apkAsset.name} • {formatBytes(updateInfo.apkAsset.size)}
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 shrink-0" />
            </button>
          )}

          {/* 2. Windows Installer */}
          {updateInfo.windowsAsset && (
            <button
              onClick={() => handleDownload(updateInfo.windowsAsset!.browser_download_url)}
              className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between font-semibold text-xs transition-all active:scale-[0.98] ${
                isWindows
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-sky-400" />
                <div className="flex flex-col items-start text-left">
                  <span>Download Windows Installer (.exe)</span>
                  <span className="text-[10px] opacity-75 font-mono font-normal">
                    {formatBytes(updateInfo.windowsAsset.size)}
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 shrink-0" />
            </button>
          )}

          {/* 3. Linux AppImage */}
          {updateInfo.linuxAsset && (
            <button
              onClick={() => handleDownload(updateInfo.linuxAsset!.browser_download_url)}
              className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between font-semibold text-xs transition-all active:scale-[0.98] ${
                isLinux
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-[var(--surface-hover)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-purple-400" />
                <div className="flex flex-col items-start text-left">
                  <span>Download Linux Binary ({updateInfo.linuxAsset.name.endsWith('.deb') ? '.deb' : '.AppImage'})</span>
                  <span className="text-[10px] opacity-75 font-mono font-normal">
                    {formatBytes(updateInfo.linuxAsset.size)}
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs">
          <a
            href={updateInfo.releaseHtmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-emerald-400 transition-colors font-medium text-[11px]"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors font-semibold"
          >
            Remind Me Later
          </button>
        </div>

      </div>
    </div>
  );
};

