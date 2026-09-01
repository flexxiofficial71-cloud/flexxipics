import React from 'react';
import { Lock, Cloud, Sparkles, Shield, Zap, Camera } from 'lucide-react';

interface TickerItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 'bcrypt',
    icon: Lock,
    title: 'Bcrypt Passcode Defense',
    description: 'Every private album is protected by salted bcrypt password hashing and real-time IP rate limiting to prevent brute-force intrusion.',
    tag: 'Security',
  },
  {
    id: 'cloud',
    icon: Cloud,
    title: 'Sovereign Cloud Architecture',
    description: 'Assets are encrypted and mirrored across distributed zero-knowledge nodes with persistent cryptographic File Anchors for high-availability redundant storage.',
    tag: 'Infrastructure',
  },
  {
    id: 'gemini',
    icon: Sparkles,
    title: 'Gemini Vision Intelligence',
    description: 'AI automatically indexes scenes, tags subjects, detects highlights, and suggests golden ratio cover frames for curators.',
    tag: 'AI Curator',
  },
  {
    id: 'lossless',
    icon: Zap,
    title: 'Lossless RAW Delivery',
    description: 'Original color profiles and EXIF metadata preserved with instant multi-format downloads for clients.',
    tag: 'Fidelity',
  },
  {
    id: 'photographer',
    icon: Camera,
    title: 'Photographer Social Hub',
    description: 'Direct social branding, custom portfolio domain linking, and customized client proofing favorites.',
    tag: 'Branding',
  },
];

export const FeatureTicker: React.FC = () => {
  // Duplicate list to achieve continuous seamless loop
  const displayItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="relative w-full overflow-hidden border-y border-[#D4AF37]/25 bg-gradient-to-r from-[#FAF8F2] via-white to-[#FAF8F2] py-4">
      {/* Side Vignette Fades for elegant depth */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 bg-gradient-to-r from-[#FAF8F2] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-[#FAF8F2] to-transparent" />

      {/* Marquee Track */}
      <div className="animate-marquee items-center gap-6 sm:gap-8">
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center space-x-3 rounded-xl border border-[#D4AF37]/20 bg-white/90 px-4 py-2.5 shadow-2xs backdrop-blur-xs transition-all hover:border-[#D4AF37]/60 hover:shadow-xs shrink-0 max-w-[420px] sm:max-w-[480px]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F2] text-[#997A15] ring-1 ring-[#D4AF37]/40">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-serif text-xs font-bold text-[#1A1A1A] whitespace-nowrap">
                    {item.title}
                  </h4>
                  <span className="rounded-full bg-[#FAF8F2] px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-[#997A15] ring-1 ring-[#D4AF37]/30">
                    {item.tag}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-1 font-normal leading-tight">
                  {item.description}
                </p>
              </div>

              <div className="h-4 w-[1px] bg-[#D4AF37]/30 shrink-0 ml-1" />
            </div>
          );
        })}
      </div>
    </section>
  );
};
