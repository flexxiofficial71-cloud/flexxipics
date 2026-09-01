export type FolderStatus = 'active' | 'private' | 'archived';
export type DownloadPermission = 'allowed' | 'disabled' | 'preview_only';
export type UserRole = 'owner' | 'admin' | 'uploader' | 'viewer';
export type MediaType = 'image' | 'video' | 'raw' | 'document';

export type SocialPlatform =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'behance'
  | '500px'
  | 'unsplash'
  | 'pinterest'
  | 'linkedin'
  | 'custom';

export interface PhotographerSocial {
  id?: string;
  platform: SocialPlatform;
  username?: string;
  customUrl?: string;
  label?: string;
}

export type PermissionKey =
  | 'can_view_analytics'
  | 'can_manage_vaults'
  | 'can_upload_media'
  | 'can_delete_media'
  | 'can_manage_categories'
  | 'can_manage_telegram'
  | 'can_manage_users'
  | 'can_view_audit_logs'
  | 'can_download_media';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  icon: string;
}

export interface WatermarkConfig {
  type: 'none' | 'text' | 'logo' | 'dynamic';
  text?: string;
  opacity?: number;
}

export interface GalleryFolder {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  coverUrl: string;
  suggestedCovers?: string[];
  isPasswordProtected: boolean;
  passwordHash?: string; // bcrypt hash or placeholder flag
  createdAt: string;
  expiresAt?: string | null;
  photoCount: number;
  videoCount: number;
  accessCount: number;
  failedAttempts: number;
  status: FolderStatus;
  downloadPermission: DownloadPermission;
  watermark: WatermarkConfig;
  tags: string[];
  clientFavoritesCount: number;
  // Photographer details & socials
  photographerName?: string;
  photographerSocialPlatform?: SocialPlatform;
  photographerUsername?: string;
  photographerCustomUrl?: string;
  photographerSocials?: PhotographerSocial[];
}

export interface MediaItem {
  id: string;
  folderId: string;
  fileName: string;
  fileType: MediaType;
  mimeType: string;
  fileSize: number; // bytes
  url: string;
  telegramFileId?: string;
  telegramMessageId?: number;
  telegramStatus?: 'synced' | 'pending' | 'local_only' | 'error';
  width?: number;
  height?: number;
  title?: string;
  caption?: string;
  tags?: string[];
  aiTags?: string[];
  aiFaces?: string[];
  clientLikes?: number;
  clientFavorited?: boolean;
  clientSelected?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  coverUrl?: string;
  folderCount: number;
  sortOrder: number;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  permissions: PermissionKey[];
  storageLimitMb: number;
  storageUsedMb: number;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ip: string;
  status: 'success' | 'warning' | 'error';
  category: 'auth' | 'upload' | 'folder' | 'telegram' | 'access' | 'security';
}

export interface TelegramSettings {
  botToken: string;
  channelId: string;
  isConnected: boolean;
  botUsername?: string;
  sendUploadAlerts: boolean;
  sendAccessAlerts: boolean;
  lastTestedAt?: string;
  statusMessage?: string;
}

export interface AnalyticsStats {
  totalFolders: number;
  totalPhotos: number;
  totalVideos: number;
  totalStorageBytes: number;
  totalViews: number;
  totalDownloads: number;
  totalFavorites: number;
  failedPasswordAttempts: number;
  popularFolders: { id: string; name: string; views: number; photos: number }[];
  recentUploads: { id: string; fileName: string; folderName: string; createdAt: string; size: number }[];
  viewsOverTime: { date: string; views: number; unlocks: number }[];
  categoryBreakdown: { name: string; count: number; storageMb: number }[];
}

export interface UnlockSession {
  folderId: string;
  token: string;
  expiresAt: number;
}
