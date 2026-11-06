import React, { useState } from 'react';
import { Shield, X, HardDrive, Users, Activity, Trash2, CheckCircle2, KeyRound } from 'lucide-react';
import { AdminMetrics } from '../types';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: AdminMetrics;
  onToggle2FA: (val: boolean) => void;
  onTriggerPrune: () => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onToggle2FA,
  onTriggerPrune
}) => {
  const [prunePreviewActive, setPrunePreviewActive] = useState(false);
  const [prunedNotice, setPrunedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const { storage, system, activity } = metrics;
  const pinnedPercent = (storage.pinnedGB / storage.totalGB) * 100;
  const cachedPercent = (storage.cachedGB / storage.totalGB) * 100;

  const handleExecutePrune = () => {
    onTriggerPrune();
    setPrunedNotice('Successfully unlinked 2 unplayed cached songs. Reclaimed 15.6 MB.');
    setPrunePreviewActive(false);
    setTimeout(() => setPrunedNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Adora Admin Studio</h3>
              <p className="text-xs text-[var(--text-muted)]">Cloudflare Edge & Ecosystem Health</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {prunedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{prunedNotice}</span>
          </div>
        )}

        {/* 1. Storage Visualizer Gauge (200 GB Oracle Cloud) */}
        <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Storage Allocation
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
              {storage.usedGB.toFixed(1)} GB used / {storage.totalGB} GB Free Tier
            </span>
          </div>

          {/* Multi-Segment Storage Bar */}
          <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
            {/* Pinned Songs (Permanent) */}
            <div 
              className="h-full bg-[var(--accent-primary)] transition-all" 
              style={{ width: `${pinnedPercent}%` }}
              title={`Pinned in playlists/favorites: ${storage.pinnedGB} GB`}
            />
            {/* Cached Songs (Eligible for LRU prune) */}
            <div 
              className="h-full bg-amber-500/80 transition-all" 
              style={{ width: `${cachedPercent}%` }}
              title={`Unpinned cache: ${storage.cachedGB} GB`}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
              <span>Pinned ({storage.pinnedGB} GB) — Permanent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span>Cached ({storage.cachedGB} GB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span>Free ({storage.freeGB.toFixed(1)} GB)</span>
            </div>
          </div>
        </div>

        {/* 2. Security Controls: 2FA Toggle & Ephemeral Token Info */}
        <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Admin Two-Factor Auth (OTP)</h4>
                <p className="text-xs text-[var(--text-muted)]">Requires a 6-digit OTP code when logging into the Admin account</p>
              </div>
            </div>

            <button
              onClick={() => onToggle2FA(!activity.twoFactorEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                activity.twoFactorEnabled ? 'bg-[var(--accent-primary)]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  activity.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-card)] p-3 rounded-xl border border-[var(--border-subtle)]">
            🔒 <strong>Zero-Trust Fortress Active:</strong> All admin tokens are ephemeral (15-minute expiration) with rolling refresh. Zero open public ports via Cloudflare Tunnel.
          </div>
        </div>

        {/* 3. Live System Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active Friends</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{activity.activeListeners}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
              <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>RAM Utilization</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {(system.totalMemoryMB - system.freeMemoryMB)} / {system.totalMemoryMB} MB
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Active Blends</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{activity.activeBlendRooms} Sessions</p>
          </div>
        </div>

        {/* 4. Smart LRU Storage Pruner Controls */}
        <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Smart Storage Garbage Collection</h4>
              <p className="text-xs text-[var(--text-muted)]">
                Prunes tracks unplayed for 60+ days. Strictly protects songs in any user's playlists or favorites.
              </p>
            </div>

            <button
              onClick={() => setPrunePreviewActive(!prunePreviewActive)}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs font-medium hover:bg-[var(--surface-card)] transition-colors"
            >
              {prunePreviewActive ? 'Hide Candidates' : 'Preview Candidates'}
            </button>
          </div>

          {prunePreviewActive && (
            <div className="mt-2 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                <span>Eligible Track</span>
                <span>Space Reclaimable</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span>One-off Meme Song (Unplayed 74 days)</span>
                <span className="font-mono">8.4 MB</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span>Random Sound Effect (Unplayed 91 days)</span>
                <span className="font-mono">7.2 MB</span>
              </div>

              <button
                onClick={handleExecutePrune}
                className="mt-2 w-full py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Unlink Candidates & Reclaim Space
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
