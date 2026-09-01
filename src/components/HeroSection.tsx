import React, { useState } from 'react';
import { Search, Shield, Lock, Eye, Sparkles, Filter, X, ArrowRight, Crown } from 'lucide-react';
import { Category, GalleryFolder } from '../types';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  folders: GalleryFolder[];
  onSelectFolder: (folder: GalleryFolder) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  folders,
  onSelectFolder,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Suggestions for autocomplete
  const suggestions = searchQuery.trim()
    ? folders.filter(
        f =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (f.photographerName && f.photographerName.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FAF6EB] via-[#FFFFFF] to-[#FAF8F2] pt-8 sm:pt-14 pb-12 sm:pb-16 border-b border-[#D4AF37]/15">
      {/* Decorative Royal Gold Aura Lights */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#C9A227]/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -left-16 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-2xl" />
      <div className="pointer-events-none absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-[#B38728]/10 blur-2xl" />

      <div className="relative mx-auto max-w-5xl px-3.5 text-center sm:px-6 lg:px-8">
        
        {/* Royal Crest Pill Badge */}
        <div className="inline-flex items-center space-x-2 rounded-full bg-white/95 px-3.5 sm:px-4 py-1.5 ring-1 ring-[#D4AF37]/50 shadow-xs mb-4 sm:mb-6 backdrop-blur-sm">
          <Crown className="h-3.5 w-3.5 text-[#B38728]" />
          <span className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-[#997A15] uppercase">
            Curated Private Client Photo Vaults
          </span>
          <Sparkles className="h-3 w-3 text-[#D4AF37] animate-pulse" />
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-[1.18] sm:leading-[1.12]">
          Preserve Memories. <br />
          <span className="gold-gradient-text drop-shadow-xs font-black">
            Unlock Timeless Art.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-3.5 sm:mt-5 max-w-2xl text-xs sm:text-base text-neutral-600 font-normal leading-relaxed">
          High-security passcode encrypted photo & video archives with lossless original delivery and proofing favorites.
        </p>

        {/* Live Search Section */}
        <div className="relative mx-auto mt-6 sm:mt-8 max-w-2xl">
          <div
            className={`relative flex items-center rounded-2xl bg-white p-1.5 sm:p-2 shadow-sm transition-all duration-300 ${
              isFocused
                ? 'ring-2 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 bg-white'
                : 'ring-1 ring-[#D4AF37]/35 hover:ring-[#D4AF37]/60'
            }`}
          >
            <div className="flex pl-2.5 sm:pl-3 text-neutral-400">
              <Search className="h-4.5 w-4.5 text-[#B38728]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search albums, tags, or photographer..."
              className="w-full bg-transparent px-2.5 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-[#1A1A1A] placeholder-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => {}}
              className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A227] to-[#B38728] px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Autocomplete suggestions dropdown */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-white/95 p-2 shadow-xl backdrop-blur-md text-left">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#997A15]">
                Matching Vaults ({suggestions.length})
              </div>
              {suggestions.map(s => (
                <div
                  key={s.id}
                  onMouseDown={() => onSelectFolder(s)}
                  className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[#FAF8F2]"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={s.coverUrl}
                      alt={s.name}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-[#D4AF37]/30"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#1A1A1A] line-clamp-1">{s.name}</h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-1">{s.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {s.isPasswordProtected ? (
                      <span className="flex items-center space-x-1 rounded-full bg-[#FAF8F2] px-2.5 py-0.5 text-[10px] font-semibold text-[#997A15] ring-1 ring-[#D4AF37]/35">
                        <Lock className="h-2.5 w-2.5" />
                        <span>Protected</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Public
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories Bar - Royal Responsive Horizontal Scrolling Carousel */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center">
          <div className="no-scrollbar flex w-full max-w-3xl items-center space-x-2 overflow-x-auto px-1 py-1 sm:justify-center">
            <button
              onClick={() => onSelectCategory('all')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-serif font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-[#FCF6BA] shadow-sm ring-1 ring-[#D4AF37]'
                  : 'bg-white/90 text-neutral-600 ring-1 ring-[#D4AF37]/30 hover:bg-[#FAF8F2] hover:text-[#1A1A1A] hover:ring-[#D4AF37]/60'
              }`}
            >
              ✦ All Albums
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-serif font-bold transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-[#FCF6BA] shadow-sm ring-1 ring-[#D4AF37]'
                    : 'bg-white/90 text-neutral-600 ring-1 ring-[#D4AF37]/30 hover:bg-[#FAF8F2] hover:text-[#1A1A1A] hover:ring-[#D4AF37]/60'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
