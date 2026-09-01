import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { GalleryFolder, MediaItem, Category, UserAccount, AuditLog, TelegramSettings, AnalyticsStats } from '../src/types';

interface DatabaseSchema {
  folders: GalleryFolder[];
  media: MediaItem[];
  categories: Category[];
  users: UserAccount[];
  auditLogs: AuditLog[];
  telegramSettings: TelegramSettings;
  stats: {
    totalViews: number;
    totalDownloads: number;
    totalFavorites: number;
    failedPasswordAttempts: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vault_db.json');
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class VaultDB {
  private static data: DatabaseSchema | null = null;

  static async init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse database file, re-initializing clean database:', err);
      }
    }

    // If database does not exist or contains old fake seed data, initialize clean real-time structure
    const hasFakeData = this.data?.folders?.some(f => f.id === 'fld-wedding-2026' || f.id === 'fld-fashion-paris');
    if (!this.data || hasFakeData) {
      await this.initializeCleanDatabase();
      this.save();
    }
  }

  static async initializeCleanDatabase() {
    const categories: Category[] = [
      { id: 'cat-1', name: 'Weddings & Celebrations', slug: 'weddings', icon: 'Heart', folderCount: 0, sortOrder: 1 },
      { id: 'cat-2', name: 'Portraits & Fashion', slug: 'portraits', icon: 'Sparkles', folderCount: 0, sortOrder: 2 },
      { id: 'cat-3', name: 'Events & Galas', slug: 'events', icon: 'Landmark', folderCount: 0, sortOrder: 3 },
      { id: 'cat-4', name: 'Travel & Nature', slug: 'travel', icon: 'Compass', folderCount: 0, sortOrder: 4 },
      { id: 'cat-5', name: 'Commercial & Editorial', slug: 'commercial', icon: 'Camera', folderCount: 0, sortOrder: 5 },
      { id: 'cat-6', name: 'Private Archives', slug: 'private', icon: 'Users', folderCount: 0, sortOrder: 6 },
    ];

    const users: UserAccount[] = [
      {
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
        storageLimitMb: 0, // 0 = Unlimited Quota
        storageUsedMb: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: undefined,
        isActive: true,
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        action: 'Database Initialized',
        details: 'PhotoVault initialized in real-time clean mode. Ready for real vaults and media.',
        ip: '127.0.0.1',
        status: 'success',
        category: 'security',
      },
    ];

    const telegramSettings: TelegramSettings = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      channelId: process.env.TELEGRAM_CHANNEL_ID || '',
      isConnected: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      botUsername: process.env.TELEGRAM_BOT_TOKEN ? 'PhotoVaultBot' : undefined,
      sendUploadAlerts: true,
      sendAccessAlerts: true,
      lastTestedAt: undefined,
      statusMessage: process.env.TELEGRAM_BOT_TOKEN
        ? 'Live Telegram Bot Connected'
        : 'Ready for Telegram Bot configuration (token & channel)',
    };

    this.data = {
      folders: [],
      media: [],
      categories,
      users,
      auditLogs,
      telegramSettings,
      stats: {
        totalViews: 0,
        totalDownloads: 0,
        totalFavorites: 0,
        failedPasswordAttempts: 0,
      },
    };
  }

  static async purgeAllData(keepCategories = true) {
    if (!this.data) {
      await this.initializeCleanDatabase();
      this.save();
      return;
    }

    // Remove any uploaded media files from disk if needed
    try {
      if (fs.existsSync(UPLOAD_DIR)) {
        const files = fs.readdirSync(UPLOAD_DIR);
        for (const file of files) {
          const filePath = path.join(UPLOAD_DIR, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (err) {
      console.warn('Error clearing upload directory:', err);
    }

    this.data.folders = [];
    this.data.media = [];
    this.data.stats = {
      totalViews: 0,
      totalDownloads: 0,
      totalFavorites: 0,
      failedPasswordAttempts: 0,
    };
    this.data.auditLogs = [
      {
        id: 'log-purge-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'Database Purged',
        details: 'All vaults, media, and analytics were purged. Database is 100% clean and real-time.',
        ip: '127.0.0.1',
        status: 'warning',
        category: 'security',
      },
    ];

    if (!keepCategories) {
      await this.initializeCleanDatabase();
    }

    this.save();
  }

  static save() {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  // Folders CRUD
  static getFolders(includePasswordHashes = false): GalleryFolder[] {
    if (!this.data) return [];
    return this.data.folders.map(f => {
      // Recalculate dynamic counts
      const folderMedia = (this.data?.media || []).filter(m => m.folderId === f.id);
      const photoCount = folderMedia.filter(m => m.fileType !== 'video').length;
      const videoCount = folderMedia.filter(m => m.fileType === 'video').length;
      const clientFavoritesCount = folderMedia.filter(m => m.clientFavorited).length;

      const updated = {
        ...f,
        photoCount,
        videoCount,
        clientFavoritesCount,
      };

      if (includePasswordHashes) return updated;
      const { passwordHash, ...rest } = updated;
      return { ...rest, passwordHash: undefined } as GalleryFolder;
    });
  }

  static getFolderById(idOrSlug: string, includePasswordHashes = false): GalleryFolder | undefined {
    if (!this.data) return undefined;
    const folder = this.data.folders.find(f => f.id === idOrSlug || f.slug === idOrSlug);
    if (!folder) return undefined;

    const folderMedia = (this.data?.media || []).filter(m => m.folderId === folder.id);
    const photoCount = folderMedia.filter(m => m.fileType !== 'video').length;
    const videoCount = folderMedia.filter(m => m.fileType === 'video').length;
    const clientFavoritesCount = folderMedia.filter(m => m.clientFavorited).length;

    const updated = {
      ...folder,
      photoCount,
      videoCount,
      clientFavoritesCount,
    };

    if (includePasswordHashes) return updated;
    const { passwordHash, ...rest } = updated;
    return { ...rest, passwordHash: undefined } as GalleryFolder;
  }

  static getFolderWithPasswordHash(idOrSlug: string): GalleryFolder | undefined {
    if (!this.data) return undefined;
    return this.data.folders.find(f => f.id === idOrSlug || f.slug === idOrSlug);
  }

  static addFolder(folder: GalleryFolder) {
    if (!this.data) return;
    this.data.folders.unshift(folder);
    this.save();
  }

  static updateFolder(id: string, updates: Partial<GalleryFolder>) {
    if (!this.data) return false;
    const idx = this.data.folders.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.data.folders[idx] = { ...this.data.folders[idx], ...updates };
    this.save();
    return true;
  }

  static deleteFolder(id: string) {
    if (!this.data) return false;
    // Find media items to clean up local files if any
    const mediaToDelete = this.data.media.filter(m => m.folderId === id);
    for (const m of mediaToDelete) {
      if (m.url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), m.url);
        if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch {}
        }
      }
    }

    this.data.folders = this.data.folders.filter(f => f.id !== id);
    this.data.media = this.data.media.filter(m => m.folderId !== id);
    this.save();
    return true;
  }

  static incrementFolderViews(id: string) {
    if (!this.data) return;
    const folder = this.data.folders.find(f => f.id === id || f.slug === id);
    if (folder) {
      folder.accessCount = (folder.accessCount || 0) + 1;
      this.data.stats.totalViews = (this.data.stats.totalViews || 0) + 1;
      this.save();
    }
  }

  static recordFailedFolderAttempt(id: string) {
    if (!this.data) return;
    const folder = this.data.folders.find(f => f.id === id || f.slug === id);
    if (folder) {
      folder.failedAttempts = (folder.failedAttempts || 0) + 1;
      this.data.stats.failedPasswordAttempts = (this.data.stats.failedPasswordAttempts || 0) + 1;
      this.save();
    }
  }

  // Media CRUD
  static getMediaByFolder(folderId: string): MediaItem[] {
    if (!this.data) return [];
    return this.data.media.filter(m => m.folderId === folderId);
  }

  static getAllMedia(): MediaItem[] {
    if (!this.data) return [];
    return this.data.media;
  }

  static getMediaById(id: string): MediaItem | undefined {
    if (!this.data) return undefined;
    return this.data.media.find(m => m.id === id);
  }

  static addMedia(item: MediaItem) {
    if (!this.data) return;
    this.data.media.unshift(item);
    
    // Auto update folder cover if folder has no cover
    const folder = this.data.folders.find(f => f.id === item.folderId);
    if (folder) {
      if (item.fileType === 'video') folder.videoCount = (folder.videoCount || 0) + 1;
      else folder.photoCount = (folder.photoCount || 0) + 1;

      if (!folder.coverUrl || folder.coverUrl.trim() === '') {
        folder.coverUrl = item.url;
      }
      if (!folder.suggestedCovers) folder.suggestedCovers = [];
      if (item.fileType === 'image' && !folder.suggestedCovers.includes(item.url)) {
        folder.suggestedCovers.push(item.url);
      }
    }
    this.save();
  }

  static updateMedia(id: string, updates: Partial<MediaItem>) {
    if (!this.data) return false;
    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.media[idx] = { ...this.data.media[idx], ...updates };
    this.save();
    return true;
  }

  static deleteMedia(id: string) {
    if (!this.data) return false;
    const item = this.data.media.find(m => m.id === id);
    if (!item) return false;

    if (item.url.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), item.url);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch {}
      }
    }

    this.data.media = this.data.media.filter(m => m.id !== id);
    const folder = this.data.folders.find(f => f.id === item.folderId);
    if (folder) {
      if (item.fileType === 'video') folder.videoCount = Math.max(0, (folder.videoCount || 0) - 1);
      else folder.photoCount = Math.max(0, (folder.photoCount || 0) - 1);
      if (folder.coverUrl === item.url) {
        const remaining = this.data.media.filter(m => m.folderId === folder.id);
        folder.coverUrl = remaining.length > 0 ? remaining[0].url : '';
      }
    }
    this.save();
    return true;
  }

  static toggleFavorite(mediaId: string): boolean {
    if (!this.data) return false;
    const item = this.data.media.find(m => m.id === mediaId);
    if (!item) return false;
    item.clientFavorited = !item.clientFavorited;
    item.clientLikes = (item.clientLikes || 0) + (item.clientFavorited ? 1 : -1);
    this.data.stats.totalFavorites = Math.max(0, (this.data.stats.totalFavorites || 0) + (item.clientFavorited ? 1 : -1));
    
    // Update folder count
    const folder = this.data.folders.find(f => f.id === item.folderId);
    if (folder) {
      folder.clientFavoritesCount = Math.max(0, (folder.clientFavoritesCount || 0) + (item.clientFavorited ? 1 : -1));
    }
    this.save();
    return item.clientFavorited;
  }

  static toggleSelect(mediaId: string): boolean {
    if (!this.data) return false;
    const item = this.data.media.find(m => m.id === mediaId);
    if (!item) return false;
    item.clientSelected = !item.clientSelected;
    this.save();
    return !!item.clientSelected;
  }

  // Categories CRUD
  static getCategories(): Category[] {
    if (!this.data) return [];
    return this.data.categories.map(c => {
      const folderCount = (this.data?.folders || []).filter(f => f.category === c.name).length;
      return { ...c, folderCount };
    });
  }

  static addCategory(cat: Category) {
    if (!this.data) return;
    this.data.categories.push(cat);
    this.save();
  }

  static deleteCategory(id: string) {
    if (!this.data) return false;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.save();
    return true;
  }

  // Users CRUD
  static getUsers(): UserAccount[] {
    if (!this.data) return [];
    return this.data.users.map(u => {
      // Don't send password hash to client in standard queries
      const { passwordHash, ...rest } = u;
      return {
        ...rest,
        permissions: rest.permissions || ['can_view_analytics', 'can_manage_vaults', 'can_upload_media'],
        isActive: rest.isActive !== false,
      } as UserAccount;
    });
  }

  static getUserById(id: string, includePassword = false): UserAccount | undefined {
    if (!this.data) return undefined;
    const user = this.data.users.find(u => u.id === id || u.username.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase());
    if (!user) return undefined;
    if (includePassword) return user;
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      permissions: rest.permissions || [],
      isActive: rest.isActive !== false,
    } as UserAccount;
  }

  static addUser(user: UserAccount) {
    if (!this.data) return;
    this.data.users.push(user);
    this.save();
  }

  static updateUser(id: string, updates: Partial<UserAccount>) {
    if (!this.data) return null;
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
    };
    this.save();
    return this.getUserById(id);
  }

  static deleteUser(id: string) {
    if (!this.data) return false;
    // Don't delete owner account if it's the only one
    const user = this.data.users.find(u => u.id === id);
    if (user?.role === 'owner' && this.data.users.filter(u => u.role === 'owner').length <= 1) {
      return false;
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return true;
  }

  static recordUserLogin(username: string) {
    if (!this.data) return;
    const user = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.save();
    }
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    if (!this.data) return [];
    return this.data.auditLogs.slice(0, 100);
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    if (!this.data) return;
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
  }

  // Telegram Settings
  static getTelegramSettings(): TelegramSettings {
    if (!this.data) {
      return {
        botToken: '',
        channelId: '',
        isConnected: false,
        sendUploadAlerts: true,
        sendAccessAlerts: true,
      };
    }
    return this.data.telegramSettings;
  }

  static updateTelegramSettings(settings: Partial<TelegramSettings>) {
    if (!this.data) return;
    this.data.telegramSettings = { ...this.data.telegramSettings, ...settings };
    this.save();
  }

  // Analytics Stats - Fully computed dynamically from real-time database state
  static getAnalytics(): AnalyticsStats {
    if (!this.data) {
      return {
        totalFolders: 0,
        totalPhotos: 0,
        totalVideos: 0,
        totalStorageBytes: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalFavorites: 0,
        failedPasswordAttempts: 0,
        popularFolders: [],
        recentUploads: [],
        viewsOverTime: [],
        categoryBreakdown: [],
      };
    }

    const totalFolders = this.data.folders.length;
    let totalPhotos = 0;
    let totalVideos = 0;
    let totalStorageBytes = 0;
    let totalFavorites = 0;

    for (const m of this.data.media) {
      if (m.fileType === 'video') totalVideos += 1;
      else totalPhotos += 1;
      totalStorageBytes += m.fileSize || 0;
      if (m.clientFavorited) totalFavorites += 1;
    }

    const popularFolders = [...this.data.folders]
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, 5)
      .map(f => {
        const fMedia = this.data?.media.filter(m => m.folderId === f.id) || [];
        return {
          id: f.id,
          name: f.name,
          views: f.accessCount || 0,
          photos: fMedia.length,
        };
      });

    const recentUploads = [...this.data.media]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(m => {
        const folder = this.data?.folders.find(f => f.id === m.folderId);
        return {
          id: m.id,
          fileName: m.title || m.fileName,
          folderName: folder?.name || 'Vault Archive',
          createdAt: m.createdAt,
          size: m.fileSize || 0,
        };
      });

    // Real-time dynamic calculation of last 7 days from actual audit/access logs
    const now = new Date();
    const viewsOverTime: { date: string; views: number; unlocks: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      const dayLogs = this.data.auditLogs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= dayStart && logTime < dayEnd;
      });

      const dayViews = dayLogs.filter(l => l.category === 'access' || l.action.toLowerCase().includes('view') || l.action.toLowerCase().includes('access')).length;
      const dayUnlocks = dayLogs.filter(l => l.action.toLowerCase().includes('unlocked') || l.action.toLowerCase().includes('granted')).length;

      viewsOverTime.push({
        date: dateStr,
        views: dayViews,
        unlocks: dayUnlocks,
      });
    }

    const categoryBreakdown = this.getCategories().map(c => {
      const foldersInCat = (this.data?.folders || []).filter(f => f.category === c.name);
      const mediaInCat = (this.data?.media || []).filter(m => foldersInCat.some(f => f.id === m.folderId));
      const storageBytes = mediaInCat.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
      return {
        name: c.name,
        count: foldersInCat.length,
        storageMb: Math.round(storageBytes / (1024 * 1024)),
      };
    });

    return {
      totalFolders,
      totalPhotos,
      totalVideos,
      totalStorageBytes,
      totalViews: this.data.stats.totalViews || 0,
      totalDownloads: this.data.stats.totalDownloads || 0,
      totalFavorites,
      failedPasswordAttempts: this.data.stats.failedPasswordAttempts || 0,
      popularFolders,
      recentUploads,
      viewsOverTime,
      categoryBreakdown,
    };
  }

  static recordDownload() {
    if (!this.data) return;
    this.data.stats.totalDownloads = (this.data.stats.totalDownloads || 0) + 1;
    this.save();
  }
}

