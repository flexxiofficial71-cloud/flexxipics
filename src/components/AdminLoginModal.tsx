import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, X, ShieldAlert, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminVault2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess(data.token, data.user);
        onClose();
      } else {
        if (data.isLocked && data.remainingSeconds) {
          setLockoutRemaining(data.remainingSeconds);
          setErrorMessage(`Rate limit reached. Please wait ${data.remainingSeconds}s.`);
        } else {
          setErrorMessage(data.error || 'Invalid credentials.');
        }
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Lock header */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8F2] ring-1 ring-[#D4AF37]/40 shadow-inner">
          <Lock className="h-7 w-7 text-[#B38728]" />
        </div>

        <div className="mt-4 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#997A15]">
            Administrative Portal
          </span>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#1A1A1A]">
            Executive Console
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Sign in to manage encrypted vaults, sovereign cloud nodes, and media archives.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin or user@photovault.luxury"
              required
              className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-neutral-400 focus:border-[#D4AF37] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
                className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-neutral-400 focus:border-[#D4AF37] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A227] to-[#997A15] py-3 text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Reminder */}
        <div className="mt-5 rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] p-3 text-center text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">Demo Master Account:</span>
          <div className="mt-0.5 font-mono text-[11px] text-[#997A15]">
            User: <b>admin</b> | Pass: <b>AdminVault2026</b>
          </div>
        </div>
      </div>
    </div>
  );
};
