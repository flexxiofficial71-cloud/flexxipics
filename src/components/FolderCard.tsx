import React from 'react';
import { Lock, Unlock, Image as ImageIcon, Video, Eye, Heart, Calendar } from 'lucide-react';
import { GalleryFolder } from '../types';
import { PhotographerCardTag } from './PhotographerBadge';

interface FolderCardProps {
  folder: GalleryFolder;
  onOpen: (folder: GalleryFolder) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onOpen }) => {
  return (
    <div
      onClick={() => onOpen(folder)}
      className="luxury-card group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* Cover Image with Gold Hover Border */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <img
          src={folder.coverUrl}
          alt={folder.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white/90 ring-1 ring-white/20">
            {folder.category}
          </span>

          <div className="flex items-center space-x-1.5">
            {folder.isPasswordProtected ? (
              <span className="flex items-center space-x-1 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[11px] font-bold text-[#1A1A1A] shadow-sm">
                <Lock className="h-3 w-3" />
                <span>Protected</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                <Unlock className="h-3 w-3" />
                <span>Public</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Counts */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90">
          <div className="flex items-center space-x-3 text-xs font-medium">
            <span className="flex items-center space-x-1">
              <ImageIcon className="h-3.5 w-3.5 text-[#FCF6BA]" />
              <span>{folder.photoCount}</span>
            </span>
            {folder.videoCount > 0 && (
              <span className="flex items-center space-x-1">
                <Video className="h-3.5 w-3.5 text-[#FCF6BA]" />
                <span>{folder.videoCount}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-medium">
            <span className="flex items-center space-x-1">
              <Eye className="h-3.5 w-3.5 text-white/70" />
              <span>{folder.accessCount}</span>
            </span>
            {folder.clientFavoritesCount > 0 && (
              <span className="flex items-center space-x-1">
                <Heart className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                <span>{folder.clientFavoritesCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] group-hover:text-[#997A15] transition-colors line-clamp-1">
          {folder.name}
        </h3>
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed font-normal">
          {folder.description || 'Secured private photo archive.'}
        </p>

        {/* Photographer Badge */}
        <PhotographerCardTag
          name={folder.photographerName}
          platform={folder.photographerSocialPlatform}
          username={folder.photographerUsername}
          customUrl={folder.photographerCustomUrl}
        />

        {/* Tags */}
        {folder.tags && folder.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {folder.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-md bg-[#FAF8F2] px-2 py-0.5 text-[10px] font-medium text-[#997A15] ring-1 ring-[#D4AF37]/20"
              >
                #{tag}
              </span>
            ))}
            {folder.tags.length > 3 && (
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                +{folder.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
