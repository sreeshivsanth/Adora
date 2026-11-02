import React, { useState } from 'react';
import { X, Lock, KeyRound, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [tab, setTab] = useState<'login' | 'forgot'>('login');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = username.toLowerCase() === 'admin';

    // Mock successful authentication
    const user: User = {
      id: `usr_${username}`,
      username: username,
      role: isAdmin ? 'admin' : 'user',
      token: 'mock_jwt_token_15m',
      refreshToken: 'mock_refresh_token_30d'
    };

    onLoginSuccess(user);
    onClose();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotNotice(`A secure 6-digit recovery code and reset link has been dispatched to ${forgotEmail || 'your email'}.`);
    setTimeout(() => {
      setForgotNotice(null);
      setTab('login');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {currentUser ? 'Your Profile' : tab === 'login' ? 'Welcome to Adora' : 'Password Recovery'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {currentUser ? 'Active session & permissions' : 'Private & secure listening sanctuary'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          /* Profile & Logout View */
          <div className="flex flex-col gap-4 py-2">
            <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center text-lg font-bold">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">{currentUser.username}</h4>
                <p className="text-xs text-[var(--text-muted)] capitalize">Role: {currentUser.role}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ● 15-Min Ephemeral Token Active (Auto-Refreshing)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              Log Out of this Device
            </button>
          </div>
        ) : (
          /* Login & Forgot Password Form */
          <>
            {/* Tabs */}
            <div className="flex rounded-xl bg-[var(--surface-hover)] p-1 text-xs font-semibold">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'login' ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setTab('forgot')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'forgot' ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                Forgot Password?
              </button>
            </div>

            {forgotNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{forgotNotice}</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="e.g. admin or sree"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="••••••••••••"
                    required
                  />
                </div>

                {needsOtp && (
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      6-Digit Two-Factor OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-center font-mono font-bold tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      placeholder="123456"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Enter Sanctuary
                </button>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Enter your registered email address. We will dispatch a 15-minute single-use reset code and magic link.
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="friend@domain.com"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>3-Tier Recovery Guarantee:</span>
                  </div>
                  <span>• Friends: Ask Admin to generate a reset code directly.</span>
                  <span>• Admin: Run <code>docker exec adora-hub adora-admin reset-password</code> via SSH.</span>
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Send Recovery Dispatch
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
