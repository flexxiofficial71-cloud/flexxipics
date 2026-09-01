import React from 'react';
import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Globe,
  ExternalLink,
  Camera,
  AtSign,
  Share2,
} from 'lucide-react';
import { SocialPlatform, PhotographerSocial } from '../types';

export interface SocialPlatformConfig {
  id: SocialPlatform;
  label: string;
  placeholder: string;
  prefixUrl: string;
  color: string;
  iconName: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'username (e.g. siam.shots)',
    prefixUrl: 'https://instagram.com/',
    color: '#E4405F',
    iconName: 'Instagram',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: 'channel handle (e.g. @SiamVisuals)',
    prefixUrl: 'https://youtube.com/@',
    color: '#FF0000',
    iconName: 'Youtube',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    placeholder: 'page or profile username (e.g. siamphotography)',
    prefixUrl: 'https://facebook.com/',
    color: '#1877F2',
    iconName: 'Facebook',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    placeholder: 'handle (e.g. siam_lens)',
    prefixUrl: 'https://x.com/',
    color: '#000000',
    iconName: 'Twitter',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: 'username (e.g. @siamstudio)',
    prefixUrl: 'https://tiktok.com/@',
    color: '#000000',
    iconName: 'Share2',
  },
  {
    id: 'behance',
    label: 'Behance',
    placeholder: 'profile id (e.g. siamahmed)',
    prefixUrl: 'https://behance.net/',
    color: '#1769FF',
    iconName: 'Camera',
  },
  {
    id: '500px',
    label: '500px',
    placeholder: 'username (e.g. siampro)',
    prefixUrl: 'https://500px.com/p/',
    color: '#0099E5',
    iconName: 'Camera',
  },
  {
    id: 'unsplash',
    label: 'Unsplash',
    placeholder: 'username (e.g. @siam)',
    prefixUrl: 'https://unsplash.com/@',
    color: '#111111',
    iconName: 'Camera',
  },
  {
    id: 'custom',
    label: 'Custom Website / Portfolio',
    placeholder: 'https://yourwebsite.com or portfolio link',
    prefixUrl: '',
    color: '#D4AF37',
    iconName: 'Globe',
  },
];

export function resolveSocialUrl(
  platform?: SocialPlatform | string,
  username?: string,
  customUrl?: string
): string {
  if (customUrl && customUrl.trim()) {
    let clean = customUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean;
  }

  if (!username || !username.trim()) return '';

  const cleanUser = username.trim().replace(/^@/, '');

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanUser}`;
    case 'youtube':
      return `https://youtube.com/@${cleanUser}`;
    case 'facebook':
      return `https://facebook.com/${cleanUser}`;
    case 'twitter':
      return `https://x.com/${cleanUser}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanUser}`;
    case 'behance':
      return `https://behance.net/${cleanUser}`;
    case '500px':
      return `https://500px.com/p/${cleanUser}`;
    case 'unsplash':
      return `https://unsplash.com/@${cleanUser}`;
    case 'pinterest':
      return `https://pinterest.com/${cleanUser}`;
    case 'linkedin':
      return `https://linkedin.com/in/${cleanUser}`;
    case 'custom':
      return customUrl?.startsWith('http') ? customUrl : `https://${customUrl || cleanUser}`;
    default:
      return `https://instagram.com/${cleanUser}`;
  }
}

export function renderPlatformIcon(platform?: SocialPlatform | string, className = 'h-4 w-4') {
  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    case 'custom':
      return <Globe className={className} />;
    default:
      return <Camera className={className} />;
  }
}

// Banner Component inside GalleryViewer
export interface PhotographerCreditBannerProps {
  photographerName?: string;
  socialPlatform?: SocialPlatform;
  username?: string;
  customUrl?: string;
  socials?: PhotographerSocial[];
}

export const PhotographerCreditBanner: React.FC<PhotographerCreditBannerProps> = ({
  photographerName,
  socialPlatform = 'instagram',
  username,
  customUrl,
  socials = [],
}) => {
  const hasPrimarySocial = Boolean(username && username.trim());
  const hasCustomUrl = Boolean(customUrl && customUrl.trim());
  const hasMultipleSocials = Array.isArray(socials) && socials.length > 0;

  if (!photographerName && !hasPrimarySocial && !hasCustomUrl && !hasMultipleSocials) {
    return null;
  }

  const primaryUrl = resolveSocialUrl(socialPlatform, username, customUrl);
  const resolvedCustomUrl = customUrl ? resolveSocialUrl('custom', undefined, customUrl) : '';

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-r from-[#FAF8F2] via-white to-[#FAF8F2] p-3.5 sm:p-4 shadow-xs">
      {/* Photographer Avatar Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A1A1A] to-neutral-800 text-[#FCF6BA] shadow-xs ring-1 ring-[#D4AF37]/60">
        <Camera className="h-5 w-5 text-[#D4AF37]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#997A15]">
            Photographer & Creator Credits
          </span>
        </div>
        <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1A1A] truncate">
          {photographerName || (username ? `@${username.replace(/^@/, '')}` : 'Curated Photographer')}
        </h4>
        {username && (
          <p className="text-[11px] font-medium text-neutral-500 font-mono">
            {socialPlatform === 'custom' ? 'PORTFOLIO' : socialPlatform.toUpperCase()}: {socialPlatform === 'custom' ? username : `@${username.replace(/^@/, '')}`}
          </p>
        )}
      </div>

      {/* Social & Custom Link Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
        {/* Primary Social Media Link */}
        {hasPrimarySocial && primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 rounded-xl bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-[#FCF6BA] shadow-xs ring-1 ring-[#D4AF37]/80 hover:bg-neutral-800 transition-all active:scale-98"
          >
            {renderPlatformIcon(socialPlatform, 'h-3.5 w-3.5 text-[#D4AF37]')}
            <span>
              {socialPlatform === 'instagram'
                ? 'Instagram'
                : socialPlatform === 'youtube'
                ? 'YouTube'
                : socialPlatform === 'facebook'
                ? 'Facebook'
                : socialPlatform === 'twitter'
                ? 'X (Twitter)'
                : socialPlatform === 'custom'
                ? 'Visit Portfolio'
                : socialPlatform}
            </span>
            <ExternalLink className="h-3 w-3 text-neutral-400" />
          </a>
        )}

        {/* Custom URL Link Button */}
        {hasCustomUrl && resolvedCustomUrl && !hasPrimarySocial && (
          <a
            href={resolvedCustomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 rounded-xl border border-[#D4AF37]/50 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-[#FAF8F2] hover:border-[#D4AF37] transition-all active:scale-98"
          >
            <Globe className="h-3.5 w-3.5 text-[#997A15]" />
            <span>Custom Portfolio</span>
            <ExternalLink className="h-3 w-3 text-neutral-400" />
          </a>
        )}

        {/* Additional Social Links from array if any */}
        {socials?.map((soc, idx) => {
          const itemUrl = resolveSocialUrl(soc.platform, soc.username, soc.customUrl);
          if (!itemUrl) return null;
          return (
            <a
              key={idx}
              href={itemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:border-[#D4AF37] hover:text-[#997A15] transition-all"
            >
              {renderPlatformIcon(soc.platform, 'h-3 w-3')}
              <span className="capitalize">{soc.label || soc.platform}</span>
              <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

// Compact Badge on Folder Card
export const PhotographerCardTag: React.FC<{
  name?: string;
  platform?: SocialPlatform;
  username?: string;
  customUrl?: string;
}> = ({ name, platform = 'instagram', username, customUrl }) => {
  if (!name && !username && !customUrl) return null;

  return (
    <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-medium text-neutral-600">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF8F2] text-[#997A15] ring-1 ring-[#D4AF37]/40 shrink-0">
        {platform === 'custom' || (!username && customUrl) ? (
          <Globe className="h-3 w-3" />
        ) : (
          renderPlatformIcon(platform, 'h-3 w-3')
        )}
      </div>
      <span className="truncate">
        {name ? name : username ? `@${username.replace(/^@/, '')}` : 'Photographer'}
      </span>
      {username && (
        <span className="text-[10px] text-neutral-400 font-mono">
          (@{username.replace(/^@/, '')})
        </span>
      )}
    </div>
  );
};
