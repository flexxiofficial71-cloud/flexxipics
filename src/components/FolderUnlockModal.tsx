import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, X, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import { GalleryFolder } from '../types';

interface FolderUnlockModalProps {
  folder: GalleryFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (token: string, folder: GalleryFolder) => void;
}

export const FolderUnlockModal: React.FC<FolderUnlockModalProps> = ({
  folder,
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
      setLockoutRemaining(0);
    }
  }, [isOpen, folder]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining(prev => {
          if (prev <= 1) {
            setErrorMessage('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isOpen || !folder) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    if (!password.trim()) {
      setErrorMessage('Please enter the vault password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/folders/${folder.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUnlockSuccess(data.token, data.folder);
      } else {
        if (data.isLocked && data.remainingSeconds) {
          setLockoutRemaining(data.remainingSeconds);
          setErrorMessage(`Too many failed attempts. Vault locked for ${data.remainingSeconds}s.`);
        } else {
          setErrorMessage(data.error || 'Incorrect vault password.');
        }
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo password hints for easy previewing
  const demoHints: Record<string, string> = {
    'fld-wedding-2026': 'Wedding2026',
    'fld-fashion-paris': 'Gala2026',
    'fld-family-vault': 'FamilyVault',
    'fld-modern-mansion': 'VIPGold',
  };

  const samplePassword = demoHints[folder.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Lock Icon Header */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF8F2] ring-1 ring-[#D4AF37]/40 shadow-inner">
          <Lock className="h-8 w-8 text-[#B38728] animate-pulse" />
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#997A15]">
            Encrypted Vault
          </span>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#1A1A1A]">
            {folder.name}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">
            Enter the client passcode to unlock full-resolution media and downloads.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={lockoutRemaining > 0 || isLoading}
              placeholder="Enter vault passcode..."
              className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-3 text-sm text-[#1A1A1A] placeholder-neutral-400 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Error / Lockout Alert */}
          {errorMessage && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cooldown counter alert */}
          {lockoutRemaining > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-center text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Security lockout active. Try again in {lockoutRemaining}s
            </div>
          )}

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={lockoutRemaining > 0 || isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A227] to-[#997A15] py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                <span>Unlock Vault</span>
              </>
            )}
          </button>
        </form>

        {/* Passcode Quick Hint for Testing */}
        {samplePassword && (
          <div className="mt-5 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FAF8F2] p-3 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] font-medium text-neutral-500">
              <KeyRound className="h-3 w-3 text-[#997A15]" />
              <span>Vault Passcode:</span>
              <button
                type="button"
                onClick={() => setPassword(samplePassword)}
                className="font-mono font-bold text-[#997A15] underline hover:text-[#1A1A1A]"
              >
                {samplePassword}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
