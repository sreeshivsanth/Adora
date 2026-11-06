import React, { useState } from 'react';
import { Users, X, Copy, Check, Radio, Sparkles } from 'lucide-react';
import { BlendSession, Track } from '../types';
import confetti from 'canvas-confetti';

interface BlendLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: BlendSession | null;
  onStartBlend: () => void;
  onLeaveBlend: () => void;
  currentTrack: Track | null;
}

export const BlendLoungeModal: React.FC<BlendLoungeModalProps> = ({
  isOpen,
  onClose,
  session,
  onStartBlend,
  onLeaveBlend,
  currentTrack
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    if (!session) return;
    const inviteText = `Join my Adora Sync room: ${session.roomId} (adora://sync/join?code=${session.roomId})`;
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReaction = (_emoji: string) => {
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Adora Sync Lounge</h3>
              <p className="text-xs text-[var(--text-muted)]">Real-time synchronized listening campfire</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {session ? (
          <div className="flex flex-col gap-5">
            {/* Active Session Box */}
            <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Invite Code
                </span>
                <p className="text-xl font-mono font-bold text-[var(--text-primary)] mt-0.5">
                  {session.roomId}
                </p>
              </div>

              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-sm hover:scale-105 transition-transform"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Link' : 'Copy Invite'}
              </button>
            </div>

            {currentTrack && (
              <div className="p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center gap-3">
                <img src={currentTrack.cover} alt="" className="w-9 h-9 rounded-xl object-cover" />
                <div className="truncate">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{currentTrack.artist}</p>
                </div>
              </div>
            )}

            {/* Orbiting Avatar Campfire */}
            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center -space-x-3">
                {session.participants.map((user, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-full border-2 border-[var(--surface-card)] bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center font-bold text-sm shadow-md"
                    title={user}
                  >
                    {user.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{session.participants.length} Friends In Sync (0ms drift)</span>
              </div>
            </div>

            {/* Reaction Trigger Bar */}
            <div className="flex items-center justify-center gap-3 py-2 border-t border-[var(--border-subtle)]">
              {['❤️', '🔥', '👏', '🎶', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="px-3 py-1.5 rounded-full bg-[var(--surface-hover)] hover:scale-110 text-base transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveBlend}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors mt-2"
            >
              Leave Sync Session
            </button>
          </div>
        ) : (
          /* Empty / Start Room State */
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="max-w-xs">
              <h4 className="text-base font-bold text-[var(--text-primary)]">Listen with friends, anywhere</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Start a Sync room and send the invite link. Music stays synchronized to the exact millisecond across all devices.
              </p>
            </div>

            <button
              onClick={onStartBlend}
              className="mt-2 px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 transition-transform"
            >
              Start New Sync Session
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
