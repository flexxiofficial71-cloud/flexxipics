import React from 'react';
import { Shield, Sparkles, CheckSquare } from 'lucide-react';
import { TelegramSettings } from '../types';

interface NavbarProps {
  currentView: 'home' | 'folder-view' | 'admin';
  onNavigate: (view: 'home' | 'folder-view' | 'admin', folderId?: string) => void;
  telegramSettings: TelegramSettings | null;
  selectedCount: number;
  onOpenSelectionModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  selectedCount,
  onOpenSelectionModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D4AF37]/30 bg-gradient-to-r from-[#FAF8F2] via-white to-[#FAF8F2] shadow-xs backdrop-blur-md transition-all duration-300">
      {/* Royal Gold Top Shimmer Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Royal Monogram */}
        <div
          onClick={() => onNavigate('home')}
          className="group flex cursor-pointer items-center space-x-2.5 sm:space-x-3 transition-transform hover:scale-[1.01]"
        >
          <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#141414] p-2 shadow-md ring-1 ring-[#D4AF37]/60 transition-all group-hover:ring-[#D4AF37] group-hover:shadow-[#D4AF37]/20">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4AF37] drop-shadow-xs" />
            <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-[#FCF6BA] animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#D4AF37]/10 to-transparent pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#1A1A1A]">
                FLEXXI<span className="gold-gradient-text font-black">PICS</span>
              </span>
              <span className="rounded-full bg-[#1A1A1A] px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#FCF6BA] ring-1 ring-[#D4AF37]/50 shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-[#997A15] flex items-center space-x-1">
              <span className="inline-block h-1 w-1 rounded-full bg-[#D4AF37]" />
              <span>Royal Sovereign Media Archive</span>
            </p>
          </div>
        </div>

        {/* Right Actions & Status Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Sovereign Security Badge */}
          <div
            title="Zero-Knowledge 256-Bit Cryptographic Vault Active"
            className="flex items-center space-x-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-neutral-700 ring-1 ring-[#D4AF37]/35 shadow-xs"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[#997A15] font-serif font-bold text-[10px] sm:text-[11px] tracking-wide">
              AES-256
            </span>
          </div>

          {/* Client Selected Items Pill */}
          {selectedCount > 0 && onOpenSelectionModal && (
            <button
              onClick={onOpenSelectionModal}
              className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95"
            >
              <CheckSquare className="h-3.5 w-3.5 text-white" />
              <span>{selectedCount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

