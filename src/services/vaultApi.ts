import { GalleryFolder, MediaItem, Category, UserAccount, AuditLog, TelegramSettings, AnalyticsStats } from '../types';

const STORAGE_KEYS = {
  FOLDERS: 'flexxi_vault_folders',
  CATEGORIES: 'flexxi_vault_categories',
  MEDIA: 'flexxi_vault_media',
  USERS: 'flexxi_vault_users',
  AUDIT_LOGS: 'flexxi_vault_audit_logs',
  SETTINGS: 'flexxi_vault_tg_settings',
  STATS: 'flexxi_vault_stats',
  AUTH: 'flexxi_vault_auth_token',
  AUTH_USER: 'flexxi_vault_auth_user',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Weddings & Celebrations', slug: 'weddings', icon: 'Heart', folderCount: 0, sortOrder: 1 },
  { id: 'cat-2', name: 'Portraits & Fashion', slug: 'portraits', icon: 'Sparkles', folderCount: 0, sortOrder: 2 },
  { id: 'cat-3', name: 'Events & Galas', slug: 'events', icon: 'Landmark', folderCount: 0, sortOrder: 3 },
  { id: 'cat-4', name: 'Travel & Nature', slug: 'travel', icon: 'Compass', folderCount: 0, sortOrder: 4 },
  { id: 'cat-5', name: 'Commercial & Editorial', slug: 'commercial', icon: 'Camera', folderCount: 0, sortOrder: 5 },
  { id: 'cat-6', name: 'Private Archives', slug: 'private', icon: 'Users', folderCount: 0, sortOrder: 6 },
];

const DEFAULT_ADMIN_USER: UserAccount = {
  id: 'usr-owner-1',
  name: 'Vault Administrator',
  username: 'admin',
  email: 'admin@photovault.luxury',
  role: 'owner',
  permissions: [
    'can_view_analytics',
    'can_manage_vaults',
    'can_upload_media',
    'can_delete_media',
    'can_manage_categories',
    'can_manage_telegram',
    'can_manage_users',
    'can_view_audit_logs',
    'can_download_media',
  ],
  storageLimitMb: 0,
  storageUsedMb: 0,
  createdAt: new Date().toISOString(),
  isActive: true,
};

// Helper: Safely parse JSON from fetch response, checking if response is actually JSON and not HTML
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // If response is HTML (e.g. Vercel SPA rewrite fallback), it's not a real backend API response
    if (contentType.includes('text/html')) {
      return { success: false, error: 'HTML_REWRITE_DETECTED', status: 404 };
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (res.ok) {
        return { success: true, data, status: res.status };
      } else {
        return { success: false, data, error: data?.error || `Request failed with status ${res.status}`, status: res.status };
      }
    } catch {
      return { success: false, error: 'INVALID_JSON', status: res.status };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'NETWORK_ERROR' };
  }
}

// Local Storage Vault Store
export class LocalVaultStore {
  static getFolders(): GalleryFolder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveFolders(folders: GalleryFolder[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  static getCategories(): Category[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }

  static saveCategories(categories: Category[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  static getMedia(): MediaItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEDIA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveMedia(media: MediaItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  static getUsers(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveUsers([DEFAULT_ADMIN_USER]);
    return [DEFAULT_ADMIN_USER];
  }

  static saveUsers(users: UserAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  static getAuditLogs(): AuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    const initialLog: AuditLog = {
      id: 'log-init-1',
      timestamp: new Date().toISOString(),
      action: 'System Ready',
      details: 'PhotoVault operational in high-availability secure mode.',
      ip: '127.0.0.1',
      status: 'success',
      category: 'security',
    };
    return [initialLog];
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch {}
  }

  static getTelegramSettings(): TelegramSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      botToken: '',
      channelId: '',
      isConnected: false,
      sendUploadAlerts: true,
      sendAccessAlerts: true,
    };
  }

  static saveTelegramSettings(settings: TelegramSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }

  static getAuthSession(): { token: string; user?: UserAccount; loggedInAt?: string } | null {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH);
      const rawUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (token && token.trim().length > 0) {
        const user = rawUser ? JSON.parse(rawUser) : undefined;
        return { token, user };
      }
    } catch {}
    return null;
  }

  static saveAuthSession(token: string, user?: UserAccount) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH, token);
      }
      if (user) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  }

  static clearAuthSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } catch {}
  }

  static getStats(): AnalyticsStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      if (raw) return JSON.parse(raw);
    } catch {}
    const folders = this.getFolders();
    const media = this.getMedia();
    return {
      totalFolders: folders.length,
      totalPhotos: media.filter(m => m.fileType === 'image').length,
      totalVideos: media.filter(m => m.fileType === 'video').length,
      totalStorageBytes: media.reduce((acc, m) => acc + (m.fileSize || 0), 0),
      totalViews: folders.reduce((acc, f) => acc + (f.accessCount || 0), 0),
      totalDownloads: 0,
      totalFavorites: media.reduce((acc, m) => acc + (m.clientLikes || 0), 0),
      failedPasswordAttempts: 0,
      popularFolders: folders.slice(0, 5).map(f => ({
        id: f.id,
        name: f.name,
        views: f.accessCount || 0,
        photos: f.photoCount || 0,
      })),
      recentUploads: media.slice(0, 5).map(m => ({
        id: m.id,
        fileName: m.fileName,
        folderName: folders.find(f => f.id === m.folderId)?.name || 'Vault',
        createdAt: m.createdAt,
        size: m.fileSize,
      })),
      viewsOverTime: [
        { date: 'Mon', views: 4, unlocks: 2 },
        { date: 'Tue', views: 7, unlocks: 3 },
        { date: 'Wed', views: 12, unlocks: 5 },
        { date: 'Thu', views: 10, unlocks: 4 },
        { date: 'Fri', views: 15, unlocks: 8 },
        { date: 'Sat', views: 22, unlocks: 11 },
        { date: 'Sun', views: 18, unlocks: 9 },
      ],
      categoryBreakdown: [
        { name: 'Weddings', count: 12, storageMb: 240 },
        { name: 'Fashion & Editorial', count: 8, storageMb: 180 },
        { name: 'Portraits', count: 6, storageMb: 90 },
      ],
    };
  }
}
