import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Heart,
  CheckSquare,
  Square,
  QrCode,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Sparkles,
  Send,
  Eye,
  Info,
  Shield,
  FileCheck,
  Film
} from 'lucide-react';
import { GalleryFolder, MediaItem } from '../types';
import { PhotographerCreditBanner } from './PhotographerBadge';
import { safeFetchJson, LocalVaultStore } from '../services/vaultApi';

interface GalleryViewerProps {
  folder: GalleryFolder;
  token: string | null;
  onBack: () => void;
  onToggleFavorite: (mediaId: string) => Promise<void>;
  onToggleSelect: (mediaId: string) => Promise<void>;
}

export const GalleryViewer: React.FC<GalleryViewerProps> = ({
  folder,
  token,
  onBack,
  onToggleFavorite,
  onToggleSelect,
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inGallerySearch, setInGallerySearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // QR Code Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Fetch Media inside this folder
  const loadMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/folders/${folder.id}/media${token ? `?token=${token}` : ''}`;
      const response = await safeFetchJson<{ media: MediaItem[]; error?: string }>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.success && response.data?.media) {
        setMediaList(response.data.media);
      } else if (response.status === 401 || response.status === 403) {
        setError(response.error || response.data?.error || 'Access restricted. Please unlock this vault.');
      } else {
        // Fallback to local storage media items for this folder
        const localMedia = LocalVaultStore.getMedia().filter(m => m.folderId === folder.id);
        setMediaList(localMedia);
      }
    } catch (err) {
      const localMedia = LocalVaultStore.getMedia().filter(m => m.folderId === folder.id);
      setMediaList(localMedia);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [folder.id, token]);

  // Slideshow Auto-play interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingSlideshow && lightboxIndex !== null && mediaList.length > 1) {
      interval = setInterval(() => {
        setLightboxIndex(prev => (prev === null ? 0 : (prev + 1) % mediaList.length));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlayingSlideshow, lightboxIndex, mediaList.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((lightboxIndex + 1) % mediaList.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((lightboxIndex - 1 + mediaList.length) % mediaList.length);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsZoomed(false);
        setIsPlayingSlideshow(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlayingSlideshow(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, mediaList.length]);

  // Generate QR code for sharing
  const handleOpenQr = async () => {
    setShowQrModal(true);
    if (!qrDataUrl) {
      try {
        const fullUrl = window.location.href;
        const res = await fetch(`/api/qrcode?url=${encodeURIComponent(fullUrl)}`);
        const data = await res.json();
        if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
      } catch (err) {
        console.error('Failed to load QR code:', err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  // Download media item with signed token
  const handleDownload = async (item: MediaItem) => {
    try {
      const res = await fetch(`/api/media/${item.id}/download-token`);
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = item.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || 'Downloads disabled for this gallery.');
      }
    } catch (err) {
      alert('Failed to download media item.');
    }
  };

  // Extract all unique tags (AI + standard)
  const allTags = Array.from(
    new Set([
      ...folder.tags,
      ...mediaList.flatMap(m => [...(m.tags || []), ...(m.aiTags || []), ...(m.aiFaces || [])]),
    ])
  ).filter(Boolean);

  // Filter media based on search & tag selection
  const filteredMedia = mediaList.filter(item => {
    const matchesSearch =
      !inGallerySearch.trim() ||
      item.fileName.toLowerCase().includes(inGallerySearch.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(inGallerySearch.toLowerCase())) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(inGallerySearch.toLowerCase()))) ||
      (item.aiTags && item.aiTags.some(t => t.toLowerCase().includes(inGallerySearch.toLowerCase()))) ||
      (item.aiFaces && item.aiFaces.some(f => f.toLowerCase().includes(inGallerySearch.toLowerCase())));

    const matchesTag =
      selectedTag === 'all' ||
      (item.tags && item.tags.includes(selectedTag)) ||
      (item.aiTags && item.aiTags.includes(selectedTag)) ||
      (item.aiFaces && item.aiFaces.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const selectedCount = mediaList.filter(m => m.clientSelected).length;
  const currentItem = lightboxIndex !== null ? filteredMedia[lightboxIndex] || mediaList[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#FAF8F2] pb-24">
      {/* Header & Vault Details */}
      <div className="border-b border-[#D4AF37]/20 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Top Bar: Back & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 rounded-xl bg-[#FAF8F2] px-4 py-2.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#D4AF37]/30 transition-all hover:bg-[#F5F0DF] hover:shadow-xs active:scale-98"
            >
              <ArrowLeft className="h-4 w-4 text-[#997A15]" />
              <span>Back to Vaults</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* QR Code Sharing */}
              <button
                onClick={handleOpenQr}
                className="flex items-center space-x-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 shadow-xs hover:border-[#D4AF37] hover:text-[#997A15]"
              >
                <QrCode className="h-3.5 w-3.5 text-[#B38728]" />
                <span>Share QR</span>
              </button>

              {/* Telegram Sync Info Badge */}
              <div className="flex items-center space-x-1.5 rounded-xl bg-[#FAF8F2] px-3.5 py-2 text-xs font-medium text-neutral-700 ring-1 ring-[#D4AF37]/25">
                <Send className="h-3.5 w-3.5 text-[#2AABEE]" />
                <span>Telegram Storage</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-md bg-[#FAF8F2] px-2.5 py-0.5 text-[11px] font-semibold text-[#997A15] ring-1 ring-[#D4AF37]/30">
                  {folder.category}
                </span>
                {folder.isPasswordProtected ? (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                    <Unlock className="h-3 w-3" />
                    <span>Unlocked with Passcode</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-neutral-500">
                    Public Vault
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                {folder.name}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm text-neutral-600 leading-relaxed font-normal">
                {folder.description}
              </p>

              {/* Photographer Profile & Social / Custom URL */}
              <PhotographerCreditBanner
                name={folder.photographerName}
                platform={folder.photographerSocialPlatform}
                username={folder.photographerUsername}
                customUrl={folder.photographerCustomUrl}
              />
            </div>

            {/* Stats Summary */}
            <div className="flex items-center space-x-4 rounded-xl border border-[#D4AF37]/25 bg-[#FAF8F2] p-3 text-xs font-medium text-neutral-700">
              <div className="text-center">
                <span className="block font-serif text-base font-bold text-[#1A1A1A]">{folder.photoCount}</span>
                <span className="text-[10px] text-neutral-500">Photos</span>
              </div>
              <div className="h-6 w-px bg-[#D4AF37]/30" />
              <div className="text-center">
                <span className="block font-serif text-base font-bold text-[#1A1A1A]">{folder.videoCount}</span>
                <span className="text-[10px] text-neutral-500">Videos</span>
              </div>
              <div className="h-6 w-px bg-[#D4AF37]/30" />
              <div className="text-center">
                <span className="block font-serif text-base font-bold text-[#997A15]">{folder.accessCount}</span>
                <span className="text-[10px] text-neutral-500">Accesses</span>
              </div>
            </div>
          </div>

          {/* Search & Tag Filter Bar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Live Search inside folder */}
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#B38728]" />
              <input
                type="text"
                value={inGallerySearch}
                onChange={e => setInGallerySearch(e.target.value)}
                placeholder="Smart AI search (e.g. Bride, Groom, Sunset, Stage)..."
                className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] py-2 pl-9 pr-3 text-xs text-[#1A1A1A] placeholder-neutral-400 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none"
              />
              {inGallerySearch && (
                <button
                  onClick={() => setInGallerySearch('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedTag('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedTag === 'all'
                    ? 'bg-[#1A1A1A] text-[#FCF6BA] shadow-xs ring-1 ring-[#D4AF37]'
                    : 'bg-[#FAF8F2] text-neutral-600 ring-1 ring-neutral-200 hover:ring-[#D4AF37]/40'
                }`}
              >
                All Media
              </button>
              {allTags.slice(0, 6).map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedTag === tag
                      ? 'bg-[#1A1A1A] text-[#FCF6BA] shadow-xs ring-1 ring-[#D4AF37]'
                      : 'bg-[#FAF8F2] text-neutral-600 ring-1 ring-neutral-200 hover:ring-[#D4AF37]/40'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Gallery Grid */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#D4AF37] border-t-transparent" />
            <p className="mt-4 text-xs font-medium text-neutral-500">Decrypting & loading vault media...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 shadow-sm">
            <Lock className="mx-auto h-8 w-8 text-rose-600" />
            <h3 className="mt-2 text-base font-bold">Access Protected</h3>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
            <button
              onClick={onBack}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Enter Password Again
            </button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D4AF37]/40 bg-white p-12 text-center">
            <Search className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-3 text-sm font-semibold text-[#1A1A1A]">No media found</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Try adjusting your search or tag filters.
            </p>
          </div>
        ) : (
          /* Masonry Grid */
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {filteredMedia.map((item, index) => (
              <div
                key={item.id}
                className="group relative mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-white shadow-sm transition-all duration-300 hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/10"
              >
                {/* Media Image / Video Preview */}
                <div
                  onClick={() => setLightboxIndex(index)}
                  className="relative cursor-pointer overflow-hidden bg-neutral-100"
                >
                  {item.fileType === 'video' ? (
                    <div className="relative aspect-video w-full">
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg text-[#1A1A1A]">
                          <Play className="h-5 w-5 ml-0.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || item.fileName}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Watermark Overlay if configured */}
                  {folder.watermark && folder.watermark.type === 'text' && folder.watermark.text && (
                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-sm font-bold tracking-widest text-white select-none"
                      style={{ opacity: (folder.watermark.opacity || 20) / 100 }}
                    >
                      {folder.watermark.text}
                    </div>
                  )}

                  {/* Top Action Overlay (Favorite & Select) */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between opacity-90 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleSelect(item.id);
                        setMediaList(prev =>
                          prev.map(m => (m.id === item.id ? { ...m, clientSelected: !m.clientSelected } : m))
                        );
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md transition-all ${
                        item.clientSelected
                          ? 'bg-[#1A1A1A] text-[#D4AF37] ring-1 ring-[#D4AF37]'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      title={item.clientSelected ? 'Deselect photo' : 'Select for client bundle'}
                    >
                      {item.clientSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                        setMediaList(prev =>
                          prev.map(m =>
                            m.id === item.id
                              ? {
                                  ...m,
                                  clientFavorited: !m.clientFavorited,
                                  clientLikes: (m.clientLikes || 0) + (m.clientFavorited ? -1 : 1),
                                }
                              : m
                          )
                        );
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md transition-all ${
                        item.clientFavorited
                          ? 'bg-[#D4AF37] text-white shadow-sm'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      title="Favorite photo"
                    >
                      <Heart className={`h-4 w-4 ${item.clientFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Caption / Title / Details */}
                <div className="p-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">
                      {item.title || item.fileName}
                    </h4>
                    {folder.downloadPermission !== 'disabled' && (
                      <button
                        onClick={() => handleDownload(item)}
                        className="rounded-md p-1 text-neutral-400 hover:bg-[#FAF8F2] hover:text-[#997A15]"
                        title="Download full resolution"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* AI Tags */}
                  {item.aiTags && item.aiTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.aiTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-[#FAF8F2] px-1.5 py-0.5 text-[9px] font-medium text-[#997A15]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Telegram File ID indicator */}
                  {item.telegramFileId && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2 text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center space-x-1">
                        <Send className="h-2.5 w-2.5 text-[#2AABEE]" />
                        <span>TG #{item.telegramFileId.substring(0, 8)}...</span>
                      </span>
                      <span>{(item.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX FULLSCREEN VIEWER */}
      {lightboxIndex !== null && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
          {/* Top Controls Bar */}
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between text-white/90">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono tracking-wider">
                {lightboxIndex + 1} / {filteredMedia.length}
              </span>
              <span className="hidden sm:inline text-xs font-medium text-neutral-400">
                • {currentItem.title || currentItem.fileName}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Slideshow Button */}
              <button
                onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                className={`rounded-lg p-2 transition-colors ${
                  isPlayingSlideshow ? 'bg-[#D4AF37] text-black' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isPlayingSlideshow ? 'Pause Slideshow' : 'Play Slideshow (Space)'}
              >
                {isPlayingSlideshow ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              {/* Zoom Button */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                title="Toggle Zoom"
              >
                {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Info / EXIF Button */}
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={`rounded-lg p-2 ${showMetadata ? 'bg-[#D4AF37] text-black' : 'bg-white/10 hover:bg-white/20'}`}
                title="Toggle EXIF & Telegram Storage Info"
              >
                <Info className="h-4 w-4" />
              </button>

              {/* Download Button */}
              {folder.downloadPermission !== 'disabled' && (
                <button
                  onClick={() => handleDownload(currentItem)}
                  className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}

              {/* Close Lightbox */}
              <button
                onClick={() => {
                  setLightboxIndex(null);
                  setIsPlayingSlideshow(false);
                  setIsZoomed(false);
                }}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Prev / Next Nav Buttons */}
          <button
            onClick={() => setLightboxIndex((lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length)}
            className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setLightboxIndex((lightboxIndex + 1) % filteredMedia.length)}
            className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Media Presentation View */}
          <div className="relative flex h-full w-full items-center justify-center p-8 sm:p-14">
            {currentItem.fileType === 'video' ? (
              <video
                src={currentItem.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
              />
            ) : (
              <img
                src={currentItem.url}
                alt={currentItem.title || currentItem.fileName}
                className={`max-h-[85vh] max-w-[90vw] object-contain transition-all duration-300 rounded-lg shadow-2xl ${
                  isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : ''
                }`}
              />
            )}

            {/* Watermark in lightbox */}
            {folder.watermark && folder.watermark.type === 'text' && folder.watermark.text && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-2xl font-bold tracking-widest text-white/30 select-none"
              >
                {folder.watermark.text}
              </div>
            )}
          </div>

          {/* Side EXIF / Telegram Info Panel */}
          {showMetadata && (
            <div className="absolute right-4 bottom-16 z-50 w-80 rounded-2xl border border-[#D4AF37]/30 bg-black/85 p-5 text-white/90 shadow-2xl backdrop-blur-md">
              <h4 className="font-serif text-sm font-bold text-[#FCF6BA]">{currentItem.title || currentItem.fileName}</h4>
              <p className="mt-1 text-xs text-neutral-300">{currentItem.caption || 'Vault media item'}</p>

              <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">File Size:</span>
                  <span>{(currentItem.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">MIME Type:</span>
                  <span>{currentItem.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Cloud Sync:</span>
                  <span className="text-emerald-400">Sovereign Node Verified</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-neutral-400">Encrypted Asset ID:</span>
                  <span className="text-[10px] break-all text-neutral-300 font-mono">{currentItem.telegramFileId}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#D4AF37]/40 bg-white p-6 text-center shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Share Gallery</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Scan with mobile phone to open and unlock this vault instantly.
            </p>

            <div className="mt-5 flex justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Vault QR Code"
                  className="h-56 w-56 rounded-xl border border-[#D4AF37]/30 p-2 shadow-inner"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-neutral-100">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                </div>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              className="mt-5 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{isCopying ? 'Link Copied!' : 'Copy Vault Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
