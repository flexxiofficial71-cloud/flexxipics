import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderPlus,
  Upload,
  Layers,
  Heart,
  Users,
  Send,
  Shield,
  Plus,
  Trash2,
  Edit,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  Eye,
  FileText,
  Clock,
  HardDrive,
  Copy,
  ChevronRight,
  X,
  ArrowUpRight,
  UserPlus,
  UserCheck,
  UserX,
  Check,
  Search,
  Sliders,
  ShieldCheck,
  SlidersHorizontal,
  Cloud,
  Save,
  Infinity,
  Globe,
  Camera,
  AtSign,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import {
  GalleryFolder,
  MediaItem,
  Category,
  UserAccount,
  UserRole,
  PermissionKey,
  AuditLog,
  TelegramSettings,
  AnalyticsStats,
  DownloadPermission,
  WatermarkConfig,
  SocialPlatform,
} from '../types';
import {
  SOCIAL_PLATFORMS,
  resolveSocialUrl,
  PhotographerCardTag,
  renderPlatformIcon,
} from './PhotographerBadge';

export const PERMISSION_OPTIONS: { key: PermissionKey; label: string; description: string; category: string }[] = [
  {
    key: 'can_view_analytics',
    label: 'Executive Analytics',
    description: 'View dashboard metrics, traffic counters, storage breakdown, and visitor insights',
    category: 'Reporting',
  },
  {
    key: 'can_manage_vaults',
    label: 'Vault Management',
    description: 'Create, modify, passcode-protect, configure watermarks, and delete photo vaults',
    category: 'Vaults',
  },
  {
    key: 'can_upload_media',
    label: 'Batch Media Ingestion',
    description: 'Upload high-res photos, 4K videos, RAW formats with AI metadata generation',
    category: 'Media',
  },
  {
    key: 'can_delete_media',
    label: 'Media Deletion & Edits',
    description: 'Permanently remove or modify individual media assets and metadata',
    category: 'Media',
  },
  {
    key: 'can_manage_categories',
    label: 'Category Taxonomy',
    description: 'Create, rename, and organize photo vault collections and categories',
    category: 'Taxonomy',
  },
  {
    key: 'can_manage_telegram',
    label: 'Sovereign Cloud Bridge',
    description: 'Configure sovereign cloud node tokens, cluster nodes, and zero-knowledge redundancy architecture',
    category: 'System',
  },
  {
    key: 'can_manage_users',
    label: 'Access Control & Users',
    description: 'Create user accounts, assign roles, configure permissions, and set storage quotas',
    category: 'Security',
  },
  {
    key: 'can_view_audit_logs',
    label: 'Security Audit Trail',
    description: 'Inspect live security logs, access attempts, and rate-limiting IP blocks',
    category: 'Security',
  },
  {
    key: 'can_download_media',
    label: 'Asset Downloads',
    description: 'Generate signed download tokens for full-resolution originals and ZIP packages',
    category: 'Media',
  },
];

interface AdminDashboardProps {
  onBackToHome: () => void;
  adminToken: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToHome, adminToken }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'folders' | 'upload' | 'categories' | 'selections' | 'users' | 'telegram' | 'audit'
  >('overview');

  // Core Data States
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Folder Create/Edit Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<GalleryFolder | null>(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Weddings & Celebrations',
    isPasswordProtected: true,
    password: '',
    coverUrl: '',
    downloadPermission: 'allowed' as DownloadPermission,
    watermarkType: 'text' as WatermarkConfig['type'],
    watermarkText: 'PHOTOVAULT • SECURE ARCHIVE',
    tags: 'Luxury, Archive',
    photographerName: '',
    photographerSocialPlatform: 'instagram' as SocialPlatform,
    photographerUsername: '',
    photographerCustomUrl: '',
  });

  // User Management States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [userForm, setUserForm] = useState<{
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    permissions: PermissionKey[];
    storageLimitMb: number;
    isActive: boolean;
  }>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: [
      'can_view_analytics',
      'can_manage_vaults',
      'can_upload_media',
      'can_delete_media',
      'can_manage_categories',
      'can_view_audit_logs',
      'can_download_media',
    ],
    storageLimitMb: 0,
    isActive: true,
  });

  // Smart Cover Generator Modal State
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [coverCandidates, setCoverCandidates] = useState<string[]>([]);
  const [selectedCoverFolderId, setSelectedCoverFolderId] = useState<string | null>(null);

  // Multi-Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [useAIAnalysis, setUseAIAnalysis] = useState<boolean>(true);
  const [syncWithTelegram, setSyncWithTelegram] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResultCount, setUploadResultCount] = useState<number | null>(null);

  // Telegram Config Form State
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChannelId, setTgChannelId] = useState('');
  const [tgTesting, setTgTesting] = useState(false);
  const [isSavingTg, setIsSavingTg] = useState(false);
  const [tgSavedNotice, setTgSavedNotice] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');

  // Fetch initial dashboard data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fRes, cRes, aRes, tgRes, uRes, logRes] = await Promise.all([
        fetch('/api/folders'),
        fetch('/api/categories'),
        fetch('/api/analytics'),
        fetch('/api/telegram/settings'),
        fetch('/api/users'),
        fetch('/api/audit-logs'),
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        setFolders(fData);
        if (fData.length > 0 && !targetFolderId) {
          setTargetFolderId(fData[0].id);
        }
      }
      if (cRes.ok) setCategories(await cRes.json());
      if (aRes.ok) setStats(await aRes.json());
      if (tgRes.ok) {
        const tgData = await tgRes.json();
        setTelegramSettings(tgData);
        setTgBotToken(tgData.botToken || '');
        setTgChannelId(tgData.channelId || '');
      }
      if (uRes.ok) setUsers(await uRes.json());
      if (logRes.ok) setAuditLogs(await logRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Folder Save (Create or Update)
  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: folderForm.name,
      slug: folderForm.slug || folderForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: folderForm.description,
      category: folderForm.category,
      isPasswordProtected: folderForm.isPasswordProtected,
      password: folderForm.password || undefined,
      coverUrl: folderForm.coverUrl || undefined,
      downloadPermission: folderForm.downloadPermission,
      watermark: {
        type: folderForm.watermarkType,
        text: folderForm.watermarkText,
        opacity: 20,
      },
      tags: folderForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      photographerName: folderForm.photographerName.trim(),
      photographerSocialPlatform: folderForm.photographerSocialPlatform,
      photographerUsername: folderForm.photographerUsername.trim(),
      photographerCustomUrl: folderForm.photographerCustomUrl.trim(),
    };

    try {
      const url = editingFolder ? `/api/folders/${editingFolder.id}` : '/api/folders';
      const method = editingFolder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFolderModalOpen(false);
        setEditingFolder(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to save folder.');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this vault and all its media?')) return;
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete folder.');
    }
  };

  // Trigger Smart Cover Generator
  const handleGenerateSmartCovers = async (folderId: string) => {
    setSelectedCoverFolderId(folderId);
    try {
      const res = await fetch('/api/ai/suggest-covers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (data.covers && data.covers.length > 0) {
        setCoverCandidates(data.covers);
        setIsCoverPickerOpen(true);
      } else {
        alert('Upload photos to this folder first to generate smart cover recommendations.');
      }
    } catch (err) {
      alert('Smart cover analyzer unavailable.');
    }
  };

  // Apply selected smart cover
  const handleSelectSmartCover = async (coverUrl: string) => {
    if (!selectedCoverFolderId) return;
    try {
      await fetch(`/api/folders/${selectedCoverFolderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl }),
      });
      setIsCoverPickerOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to update cover.');
    }
  };

  // Handle Multi-file Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFolderId) {
      alert('Please select a target folder.');
      return;
    }
    if (uploadFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setUploadResultCount(null);

    const formData = new FormData();
    formData.append('folderId', targetFolderId);
    formData.append('useAI', String(useAIAnalysis));
    formData.append('syncTelegram', String(syncWithTelegram));

    for (const f of uploadFiles) {
      formData.append('files', f);
    }

    try {
      setUploadProgress(60);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadProgress(100);
        setUploadResultCount(data.count);
        setUploadFiles([]);
        fetchData();
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Network upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Test Telegram Connection and persist credentials
  const handleTestTelegram = async () => {
    setTgTesting(true);
    setTgTestResult(null);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: tgBotToken, channelId: tgChannelId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTgTestResult({
          success: true,
          message: data.isSimulated
            ? 'Running in Simulated Sovereign Cloud Node mode.'
            : `Successfully verified & persisted @${data.username} (${data.botName})!`,
        });
        setTgSavedNotice(true);
        setTimeout(() => setTgSavedNotice(false), 5000);
        fetchData();
      } else {
        setTgTestResult({ success: false, error: data.error || 'Failed to connect.' });
      }
    } catch (err) {
      setTgTestResult({ success: false, error: 'Network error during test.' });
    } finally {
      setTgTesting(false);
    }
  };

  // Explicitly Save Telegram Settings permanently
  const handleSaveTelegramSettings = async () => {
    setIsSavingTg(true);
    setTgSavedNotice(false);
    try {
      const res = await fetch('/api/telegram/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgBotToken,
          channelId: tgChannelId,
          isConnected: Boolean(tgBotToken && tgBotToken.trim()),
          statusMessage: tgBotToken ? 'Connected & Persistent' : 'Simulated Node Active',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramSettings(data);
        setTgSavedNotice(true);
        setTimeout(() => setTgSavedNotice(false), 6000);
      } else {
        alert('Failed to save settings.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setIsSavingTg(false);
    }
  };

  // Send real live alert to Telegram
  const handleSendTelegramTestAlert = async () => {
    try {
      const res = await fetch('/api/telegram/send-test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: tgBotToken, channelId: tgChannelId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Test notification broadcasted to Telegram channel!');
      } else {
        alert(data.error || 'Failed to dispatch Telegram message.');
      }
    } catch {
      alert('Error sending alert.');
    }
  };

  // User Management Actions
  const applyRoleDefaults = (role: UserRole) => {
    let perms: PermissionKey[] = [];
    if (role === 'owner') {
      perms = PERMISSION_OPTIONS.map(p => p.key);
    } else if (role === 'admin') {
      perms = [
        'can_view_analytics',
        'can_manage_vaults',
        'can_upload_media',
        'can_delete_media',
        'can_manage_categories',
        'can_view_audit_logs',
        'can_download_media',
      ];
    } else if (role === 'uploader') {
      perms = ['can_upload_media', 'can_manage_vaults', 'can_download_media'];
    } else if (role === 'viewer') {
      perms = ['can_view_analytics', 'can_download_media'];
    }
    setUserForm(prev => ({ ...prev, role, permissions: perms }));
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'admin',
      permissions: [
        'can_view_analytics',
        'can_manage_vaults',
        'can_upload_media',
        'can_delete_media',
        'can_manage_categories',
        'can_view_audit_logs',
        'can_download_media',
      ],
      storageLimitMb: 0, // 0 = Unlimited Quota
      isActive: true,
    });
    setShowPasswordInput(false);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      permissions: u.permissions || [],
      storageLimitMb: u.storageLimitMb !== undefined ? u.storageLimitMb : 0,
      isActive: u.isActive !== false,
    });
    setShowPasswordInput(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.email.trim()) {
      alert('Name, Username, and Email are required.');
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        name: userForm.name.trim(),
        username: userForm.username.trim().toLowerCase(),
        email: userForm.email.trim().toLowerCase(),
        role: userForm.role,
        permissions: userForm.permissions,
        storageLimitMb: userForm.storageLimitMb !== undefined ? Number(userForm.storageLimitMb) : 0,
        isActive: userForm.isActive,
      };

      if (userForm.password && userForm.password.trim().length > 0) {
        payload.password = userForm.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsUserModalOpen(false);
        setEditingUser(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to save user account.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error communicating with server.');
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF8F2]">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 shrink-0 border-r border-[#D4AF37]/20 bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Brand header */}
          <div className="flex items-center space-x-3 px-2 py-3 border-b border-[#D4AF37]/20">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A1A] ring-1 ring-[#D4AF37]/40">
              <Shield className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <span className="font-display text-sm font-bold tracking-wider text-[#1A1A1A]">
                VAULT<span className="text-[#B38728]">CURATOR</span>
              </span>
              <span className="block text-[10px] text-neutral-400 font-mono">Master Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'folders', label: 'Vaults & Folders', icon: Layers },
              { id: 'upload', label: 'Media Multi-Upload', icon: Upload },
              { id: 'categories', label: 'Categories', icon: FolderPlus },
              { id: 'selections', label: 'Client Selections', icon: Heart },
              { id: 'users', label: 'Users & Roles', icon: Users },
              { id: 'telegram', label: 'Sovereign Cloud Node', icon: Cloud },
              { id: 'audit', label: 'Security & Audit Logs', icon: Shield },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1A1A1A] text-[#FCF6BA] shadow-sm ring-1 ring-[#D4AF37]'
                      : 'text-neutral-600 hover:bg-[#FAF8F2] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#D4AF37]' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Back to Vault */}
        <div className="border-t border-[#D4AF37]/20 pt-4">
          <button
            onClick={onBackToHome}
            className="flex w-full items-center justify-between rounded-xl bg-[#FAF8F2] px-3.5 py-2.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#D4AF37]/30 hover:bg-[#F5F0DF]"
          >
            <span>Exit to Public Explorer</span>
            <ChevronRight className="h-4 w-4 text-[#997A15]" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#997A15]">
              Administration Suite
            </span>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {activeTab === 'overview' && 'Executive Analytics & Vault Metrics'}
              {activeTab === 'folders' && 'Vault Management'}
              {activeTab === 'upload' && 'Multi-Media Drag & Drop Ingestion'}
              {activeTab === 'categories' && 'Category Taxonomy'}
              {activeTab === 'selections' && 'Client Favorites & Proofing Bundles'}
              {activeTab === 'users' && 'Access Control & Storage Quotas'}
              {activeTab === 'telegram' && 'Sovereign Cloud Redundancy Engine'}
              {activeTab === 'audit' && 'Security Audit Trail & Rate Limits'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Contextual Action Buttons */}
            {activeTab === 'users' ? (
              <button
                onClick={handleOpenCreateUser}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create User</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderForm({
                      name: '',
                      slug: '',
                      description: '',
                      category: categories.length > 0 ? categories[0].name : 'General Vault',
                      isPasswordProtected: true,
                      password: '',
                      coverUrl: '',
                      downloadPermission: 'allowed',
                      watermarkType: 'text',
                      watermarkText: 'PHOTOVAULT • SECURE ARCHIVE',
                      tags: 'Luxury, Archive',
                      photographerName: '',
                      photographerSocialPlatform: 'instagram',
                      photographerUsername: '',
                      photographerCustomUrl: '',
                    });
                    setIsFolderModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Vault</span>
                </button>

                {activeTab !== 'upload' && (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="flex items-center space-x-1.5 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-xs font-semibold text-[#FCF6BA] shadow-sm ring-1 ring-[#D4AF37] hover:bg-neutral-800"
                  >
                    <Upload className="h-4 w-4 text-[#D4AF37]" />
                    <span>Upload Media</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="mt-8 space-y-8">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
              {[
                { label: 'Total Vaults', val: stats?.totalFolders || folders.length, icon: Layers, note: 'Protected albums' },
                { label: 'Total Photos', val: stats?.totalPhotos || 0, icon: Eye, note: 'High-res assets' },
                { label: 'Storage Consumed', val: `${((stats?.totalStorageBytes || 0) / 1024 / 1024).toFixed(1)} MB`, icon: HardDrive, note: 'Zero-Knowledge Encrypted' },
                { label: 'Client Favorites', val: stats?.totalFavorites || 0, icon: Heart, note: 'Proofing selections' },
                { label: 'Total Accesses', val: stats?.totalViews || 0, icon: ArrowUpRight, note: 'Vault views' },
                { label: 'Downloads Issued', val: stats?.totalDownloads || 0, icon: Download, note: 'Signed tokens' },
                { label: 'Blocked Attacks', val: stats?.failedPasswordAttempts || 0, icon: AlertTriangle, note: 'Rate-limited IPs' },
                { label: 'Sovereign Node', val: telegramSettings?.isConnected ? 'Active Node' : 'Simulated Node', icon: ShieldCheck, note: telegramSettings?.channelId || 'Cluster #01' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="luxury-card p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <Icon className="h-4 w-4 text-[#B38728]" />
                    </div>
                    <div className="mt-3 font-serif text-2xl font-bold text-[#1A1A1A]">{stat.val}</div>
                    <p className="mt-1 text-[11px] text-neutral-400">{stat.note}</p>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Views Over Time Area Chart */}
              <div className="luxury-card p-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Vault Traffic & Unlocks</h3>
                    <p className="text-xs text-neutral-500">Daily visitors vs successfully unlocked sessions</p>
                  </div>
                  <span className="rounded-md bg-[#FAF8F2] px-2 py-1 text-[10px] font-semibold text-[#997A15]">
                    Last 7 Days
                  </span>
                </div>
                <div className="mt-6 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.viewsOverTime || []}>
                      <defs>
                        <linearGradient id="goldViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" />
                      <XAxis dataKey="date" stroke="#999" fontSize={11} />
                      <YAxis stroke="#999" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1A1A',
                          borderColor: '#D4AF37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#B38728" strokeWidth={2} fill="url(#goldViews)" name="Page Views" />
                      <Area type="monotone" dataKey="unlocks" stroke="#1A1A1A" strokeWidth={2} fill="#1A1A1A" fillOpacity={0.1} name="Passcode Unlocks" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Storage Distribution */}
              <div className="luxury-card p-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Storage by Category</h3>
                    <p className="text-xs text-neutral-500">Megabytes deployed across taxonomy</p>
                  </div>
                  <span className="rounded-md bg-[#FAF8F2] px-2 py-1 text-[10px] font-semibold text-[#997A15]">
                    Megabytes (MB)
                  </span>
                </div>
                <div className="mt-6 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.categoryBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" />
                      <XAxis dataKey="name" stroke="#999" fontSize={10} interval={0} tickFormatter={t => t.split(' ')[0]} />
                      <YAxis stroke="#999" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1A1A',
                          borderColor: '#D4AF37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="storageMb" fill="#D4AF37" radius={[6, 6, 0, 0]} name="Storage (MB)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FOLDERS / VAULTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'folders' && (
          <div className="mt-8 space-y-6">
            {folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white border border-[#D4AF37]/30 p-8 shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8F2] ring-1 ring-[#D4AF37]/40 mb-4">
                  <Layers className="h-7 w-7 text-[#B38728]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">No Vaults Created Yet</h3>
                <p className="mt-1 text-xs text-neutral-500 max-w-md">
                  Your vault database is completely clean in real-time mode. Create your first luxury passcode-protected photo vault to get started.
                </p>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderForm({
                      name: '',
                      slug: '',
                      description: '',
                      category: categories.length > 0 ? categories[0].name : 'General Vault',
                      isPasswordProtected: true,
                      password: '',
                      coverUrl: '',
                      downloadPermission: 'allowed',
                      watermarkType: 'text',
                      watermarkText: 'PHOTOVAULT • SECURE ARCHIVE',
                      tags: 'Luxury, Archive',
                      photographerName: '',
                      photographerSocialPlatform: 'instagram',
                      photographerUsername: '',
                      photographerCustomUrl: '',
                    });
                    setIsFolderModalOpen(true);
                  }}
                  className="mt-5 flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Vault</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map(folder => (
                  <div key={folder.id} className="luxury-card overflow-hidden">
                    <div className="relative aspect-[16/9] w-full bg-neutral-100">
                      <img src={folder.coverUrl} alt={folder.name} className="h-full w-full object-cover" />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {folder.isPasswordProtected ? (
                          <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-[#FCF6BA] backdrop-blur-md">
                            Passcode Protected
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#997A15]">
                        {folder.category}
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#1A1A1A] line-clamp-1">{folder.name}</h3>
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{folder.description}</p>

                      {/* Photographer Badge */}
                      <PhotographerCardTag
                        name={folder.photographerName}
                        platform={folder.photographerSocialPlatform}
                        username={folder.photographerUsername}
                        customUrl={folder.photographerCustomUrl}
                      />

                      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                        <span>{folder.photoCount} Photos • {folder.videoCount} Videos</span>
                        <span className="font-semibold text-[#997A15]">{folder.accessCount} Views</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleGenerateSmartCovers(folder.id)}
                          className="flex flex-1 items-center justify-center space-x-1 rounded-lg border border-[#D4AF37]/40 bg-[#FAF8F2] py-1.5 text-[11px] font-semibold text-[#997A15] hover:bg-[#F5F0DF]"
                          title="AI analyzes photos to suggest optimal cover images"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Smart Cover</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingFolder(folder);
                            setFolderForm({
                              name: folder.name,
                              slug: folder.slug,
                              description: folder.description,
                              category: folder.category,
                              isPasswordProtected: folder.isPasswordProtected,
                              password: '',
                              coverUrl: folder.coverUrl,
                              downloadPermission: folder.downloadPermission,
                              watermarkType: folder.watermark?.type || 'none',
                              watermarkText: folder.watermark?.text || 'PHOTOVAULT',
                              tags: folder.tags.join(', '),
                              photographerName: folder.photographerName || '',
                              photographerSocialPlatform: folder.photographerSocialPlatform || 'instagram',
                              photographerUsername: folder.photographerUsername || '',
                              photographerCustomUrl: folder.photographerCustomUrl || '',
                            });
                            setIsFolderModalOpen(true);
                          }}
                          className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:border-[#D4AF37] hover:text-[#997A15]"
                          title="Edit vault settings"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          title="Delete vault"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MULTI-MEDIA UPLOAD STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="mt-8 max-w-3xl space-y-6">
            {folders.length === 0 ? (
              <div className="luxury-card p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF8F2] ring-1 ring-[#D4AF37]/40 mx-auto mb-4">
                  <FolderPlus className="h-6 w-6 text-[#B38728]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Create a Vault First</h3>
                <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto">
                  Before uploading photos and videos, you must create at least one photo vault (album) to receive the media and configure its passcode protection.
                </p>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderForm({
                      name: '',
                      slug: '',
                      description: '',
                      category: categories.length > 0 ? categories[0].name : 'General Vault',
                      isPasswordProtected: true,
                      password: '',
                      coverUrl: '',
                      downloadPermission: 'allowed',
                      watermarkType: 'text',
                      watermarkText: 'PHOTOVAULT • SECURE ARCHIVE',
                      tags: 'Luxury, Archive',
                    });
                    setIsFolderModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Vault</span>
                </button>
              </div>
            ) : (
              <div className="luxury-card p-6 sm:p-8">
                <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">Batch Media Ingestion Engine</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Supports JPG, PNG, WEBP, GIF, HEIC, RAW (CR2, NEF, ARW, DNG), and MP4 videos with automated zero-knowledge sovereign cloud mirroring.
                </p>

                <form onSubmit={handleUploadSubmit} className="mt-6 space-y-5">
                  {/* Target Folder Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Target Vault Folder
                    </label>
                    <select
                      value={targetFolderId}
                      onChange={e => setTargetFolderId(e.target.value)}
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] focus:border-[#D4AF37] focus:bg-white focus:outline-none font-medium"
                    >
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>

                {/* Drag & Drop File Picker */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      setUploadFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D4AF37]/50 bg-[#FAF8F2] p-8 text-center transition-colors hover:border-[#D4AF37] hover:bg-[#F5F0DF]/40"
                >
                  <Upload className="h-10 w-10 text-[#B38728]" />
                  <p className="mt-3 text-sm font-bold text-[#1A1A1A]">
                    Drag & Drop photos, RAWs, or videos here
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">or click below to browse your local device</p>
                  
                  <input
                    type="file"
                    id="file-upload-input"
                    multiple
                    accept="image/*,video/*,.cr2,.cr3,.nef,.arw,.dng,.pdf,.zip"
                    onChange={e => {
                      if (e.target.files) {
                        setUploadFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="mt-4 cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#D4AF37]/40 shadow-xs hover:bg-[#FAF8F2]"
                  >
                    Select Media Files
                  </label>
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        {uploadFiles.length} file(s) staged for upload
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadFiles([])}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 text-xs text-neutral-600 font-mono">
                      {uploadFiles.map((f, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span className="truncate max-w-xs">{f.name}</span>
                          <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggles: AI & Telegram Sync */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center space-x-3 rounded-xl border border-neutral-200 p-3.5 cursor-pointer hover:bg-[#FAF8F2]">
                    <input
                      type="checkbox"
                      checked={useAIAnalysis}
                      onChange={e => setUseAIAnalysis(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D4AF37]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#1A1A1A] flex items-center space-x-1">
                        <Sparkles className="h-3.5 w-3.5 text-[#B38728]" />
                        <span>AI Tagging & Face Grouping</span>
                      </span>
                      <p className="text-[10px] text-neutral-500">Gemini model auto-identifies bride, sunset, aesthetic</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 rounded-xl border border-neutral-200 p-3.5 cursor-pointer hover:bg-[#FAF8F2]">
                    <input
                      type="checkbox"
                      checked={syncWithTelegram}
                      onChange={e => setSyncWithTelegram(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D4AF37]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#1A1A1A] flex items-center space-x-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#997A15]" />
                        <span>Sovereign Cloud Redundancy</span>
                      </span>
                      <p className="text-[10px] text-neutral-500">Mirror encrypted assets to decentralized cold storage</p>
                    </div>
                  </label>
                </div>

                {/* Upload Button */}
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A227] to-[#997A15] py-3.5 text-xs font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Ingesting & Synchronizing Media ({uploadProgress}%)...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Start Batch Ingestion ({uploadFiles.length} items)</span>
                    </>
                  )}
                </button>

                {uploadResultCount !== null && (
                  <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Successfully uploaded and synchronized {uploadResultCount} media items into vault!</span>
                  </div>
                )}
              </form>
            </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CATEGORIES TAXONOMY */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="mt-8 space-y-6">
            <div className="luxury-card p-6">
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Taxonomy & Collections</h3>
              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="New category name (e.g. Corporate Gala, High Jewelry)..."
                  className="flex-1 rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    await fetch('/api/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newCatName.trim() }),
                    });
                    setNewCatName('');
                    fetchData();
                  }}
                  className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#FCF6BA] hover:bg-neutral-800"
                >
                  Add Category
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => (
                <div key={cat.id} className="luxury-card p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#1A1A1A]">{cat.name}</h4>
                    <p className="text-xs text-neutral-500">{cat.folderCount} Vaults assigned</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
                        fetchData();
                      }
                    }}
                    className="p-2 text-neutral-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CLIENT FAVORITES & PROOFING SELECTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'selections' && (
          <div className="mt-8 space-y-6">
            <div className="luxury-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Client Proofing & Selections</h3>
                  <p className="text-xs text-neutral-500">
                    Review and export high-priority photo selections marked by clients during review sessions.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const selectedPhotos = folders.flatMap(f => f.name);
                    const exportText = `PHOTOVAULT CLIENT SELECTION EXPORT\nDate: ${new Date().toISOString()}\nTotal Vaults: ${folders.length}\nClient Favorites: ${stats?.totalFavorites || 0}`;
                    navigator.clipboard.writeText(exportText);
                    alert('Selection list exported to clipboard!');
                  }}
                  className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-2 text-xs font-semibold text-white shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Export Selections</span>
                </button>
              </div>

              <div className="mt-6 divide-y divide-neutral-100">
                {folders.map(f => (
                  <div key={f.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={f.coverUrl} alt={f.name} className="h-12 w-12 rounded-lg object-cover ring-1 ring-[#D4AF37]/20" />
                      <div>
                        <h4 className="text-sm font-semibold text-[#1A1A1A]">{f.name}</h4>
                        <span className="text-xs text-neutral-500">{f.category} • {f.photoCount} assets</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 rounded-full bg-[#FAF8F2] px-3 py-1 text-xs font-semibold text-[#997A15] ring-1 ring-[#D4AF37]/30">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        <span>{f.clientFavoritesCount} Favorites</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: USERS & ROLES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="mt-8 space-y-6">
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="luxury-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total Accounts</span>
                    <h3 className="mt-1 text-2xl font-bold text-[#1A1A1A] font-serif">{users.length}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F2] text-[#997A15] ring-1 ring-[#D4AF37]/30">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] text-neutral-500 font-medium">
                  <span>{users.filter(u => u.isActive !== false).length} active, {users.filter(u => u.isActive === false).length} suspended</span>
                </div>
              </div>

              <div className="luxury-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Superadmins & Owners</span>
                    <h3 className="mt-1 text-2xl font-bold text-[#1A1A1A] font-serif">
                      {users.filter(u => u.role === 'owner' || u.role === 'admin').length}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] text-neutral-500 font-medium">
                  <span>Full access to vaults & security</span>
                </div>
              </div>

              <div className="luxury-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Curators & Uploaders</span>
                    <h3 className="mt-1 text-2xl font-bold text-[#1A1A1A] font-serif">
                      {users.filter(u => u.role === 'uploader').length}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <Upload className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] text-neutral-500 font-medium">
                  <span>Ingestion & album management</span>
                </div>
              </div>

              <div className="luxury-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total Cloud Quota</span>
                    <h3 className="mt-1 text-2xl font-bold text-[#1A1A1A] font-serif">
                      {users.some(u => !u.storageLimitMb || u.storageLimitMb === 0)
                        ? 'Unlimited (∞)'
                        : `${(users.reduce((acc, u) => acc + (u.storageLimitMb || 0), 0) / 1024).toFixed(0)} GB`}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    <HardDrive className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] text-neutral-500 font-medium">
                  <span>Allocated across all accounts</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="luxury-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, handle, email..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] pl-10 pr-4 py-2 text-xs text-[#1A1A1A] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  {/* Role Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF8F2] p-1 rounded-xl border border-[#D4AF37]/20">
                    {(['all', 'owner', 'admin', 'uploader', 'viewer'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setUserRoleFilter(role)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                          userRoleFilter === role
                            ? 'bg-[#1A1A1A] text-[#FCF6BA] shadow-xs ring-1 ring-[#D4AF37]'
                            : 'text-neutral-600 hover:text-[#1A1A1A] hover:bg-white/60'
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className="flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="luxury-card overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Curator & Access Privilege Directory</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Assign fine-grained capabilities, grant sovereign cloud permissions, and modify user access limits.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-400">
                  {users.length} registered {users.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F2]/70 border-b border-neutral-100 text-neutral-400 font-semibold uppercase">
                    <tr>
                      <th className="py-3.5 px-6">User / Identity</th>
                      <th className="py-3.5 px-4">Role & Status</th>
                      <th className="py-3.5 px-4">Permissions & Capabilities</th>
                      <th className="py-3.5 px-4">Storage Allocation</th>
                      <th className="py-3.5 px-4">Last Activity</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                    {users
                      .filter(u => {
                        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                        const q = userSearchQuery.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          u.name.toLowerCase().includes(q) ||
                          u.username.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q);
                        return matchesRole && matchesSearch;
                      })
                      .map(u => {
                        const isOwner = u.role === 'owner';
                        const isAdmin = u.role === 'admin';
                        const isUploader = u.role === 'uploader';
                        const userPerms = u.permissions || [];

                        return (
                          <tr key={u.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                            {/* User details */}
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1A1A1A] to-neutral-700 text-xs font-bold text-[#FCF6BA] ring-2 ring-[#D4AF37]/30">
                                  {u.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                  <span
                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                                      u.isActive !== false ? 'bg-emerald-500' : 'bg-neutral-400'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-[#1A1A1A] text-sm flex items-center space-x-1.5">
                                    <span>{u.name}</span>
                                    {isOwner && (
                                      <span className="rounded-full bg-[#FCF6BA] px-1.5 py-0.2 text-[9px] font-bold text-[#997A15] ring-1 ring-[#D4AF37]/40">
                                        PRIMARY
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-neutral-400 font-mono text-[11px] mt-0.5">
                                    @{u.username} • {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role & Status */}
                            <td className="py-4 px-4">
                              <div className="space-y-1.5">
                                <span
                                  className={`inline-flex items-center space-x-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                    isOwner
                                      ? 'bg-amber-100/80 text-amber-800 ring-1 ring-amber-300'
                                      : isAdmin
                                      ? 'bg-purple-100/80 text-purple-800 ring-1 ring-purple-300'
                                      : isUploader
                                      ? 'bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-300'
                                      : 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200'
                                  }`}
                                >
                                  <span>{u.role}</span>
                                </span>
                                <div>
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`text-[10px] font-semibold flex items-center space-x-1 ${
                                      u.isActive !== false
                                        ? 'text-emerald-700 hover:text-emerald-900'
                                        : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                                    title="Click to toggle account status"
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        u.isActive !== false ? 'bg-emerald-500' : 'bg-neutral-400'
                                      }`}
                                    />
                                    <span>{u.isActive !== false ? 'Active' : 'Suspended'}</span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Granular Permissions */}
                            <td className="py-4 px-4 max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {isOwner ? (
                                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                                    ★ Full Access (All 9 Capabilities)
                                  </span>
                                ) : userPerms.length === 0 ? (
                                  <span className="text-neutral-400 italic text-[11px]">No active permissions</span>
                                ) : (
                                  userPerms.slice(0, 3).map(pKey => {
                                    const opt = PERMISSION_OPTIONS.find(p => p.key === pKey);
                                    return (
                                      <span
                                        key={pKey}
                                        className="rounded-md bg-[#FAF8F2] px-2 py-0.5 text-[10px] font-medium text-neutral-700 ring-1 ring-[#D4AF37]/30"
                                      >
                                        {opt ? opt.label : pKey}
                                      </span>
                                    );
                                  })
                                )}
                                {!isOwner && userPerms.length > 3 && (
                                  <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                                    +{userPerms.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Storage allocation */}
                            <td className="py-4 px-4 font-mono">
                              <div className="space-y-1">
                                {u.storageLimitMb === 0 || !u.storageLimitMb ? (
                                  <div className="inline-flex items-center space-x-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                                    <Infinity className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Unlimited Quota</span>
                                  </div>
                                ) : u.storageLimitMb >= 1048576 ? (
                                  <div className="text-[11px] font-semibold text-[#1A1A1A]">
                                    {(u.storageLimitMb / 1048576).toFixed(0)} TB Quota
                                  </div>
                                ) : (
                                  <div className="text-[11px] font-semibold text-[#1A1A1A]">
                                    {(u.storageLimitMb / 1024).toFixed(0)} GB Quota
                                  </div>
                                )}
                                <div className="h-1.5 w-24 rounded-full bg-neutral-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      u.storageLimitMb === 0 ? 'bg-emerald-500 w-full' : 'bg-[#D4AF37]'
                                    }`}
                                    style={{
                                      width:
                                        u.storageLimitMb === 0
                                          ? '100%'
                                          : `${Math.min(100, Math.max(8, ((u.storageUsedMb || 0) / u.storageLimitMb) * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Last Activity */}
                            <td className="py-4 px-4 text-neutral-400 text-[11px]">
                              {u.lastLoginAt ? (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(u.lastLoginAt).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <span className="italic text-neutral-400">Never logged in</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-[#FAF8F2] hover:text-[#997A15] ring-1 ring-neutral-200 transition-colors"
                                  title="Edit user role & permissions"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                {!isOwner && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 ring-1 ring-rose-200 transition-colors"
                                    title="Delete user account"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-xs font-semibold text-neutral-600">No users found.</p>
                    <button
                      onClick={handleOpenCreateUser}
                      className="mt-3 inline-flex items-center space-x-1.5 rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#FCF6BA] ring-1 ring-[#D4AF37]"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Create First User</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: TELEGRAM STORAGE SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'telegram' && (
          <div className="mt-8 max-w-3xl space-y-6">
            <div className="luxury-card p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15">
                    <Cloud className="h-6 w-6 text-[#997A15]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Sovereign Cloud Redundancy Engine</h3>
                    <p className="text-xs text-neutral-500">
                      Connect enterprise zero-knowledge storage nodes to mirror high-resolution media across distributed cold-storage channels.
                    </p>
                  </div>
                </div>
                {telegramSettings?.isConnected && (
                  <span className="hidden sm:inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Credentials Persisted</span>
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Sovereign Node Gateway Key / API Token
                  </label>
                  <input
                    type="password"
                    value={tgBotToken}
                    onChange={e => setTgBotToken(e.target.value)}
                    placeholder="e.g. 7123456789:AAHqXXXXXXXXXXXXX..."
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] font-mono focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-neutral-400">
                    Save once to persist permanently in the database. You will not need to re-enter this during media uploads.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Target Sovereign Cluster / Data Node Identifier
                  </label>
                  <input
                    type="text"
                    value={tgChannelId}
                    onChange={e => setTgChannelId(e.target.value)}
                    placeholder="e.g. @EncryptedVaultArchive or -1001234567890"
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] font-mono focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveTelegramSettings}
                    disabled={isSavingTg}
                    className="flex items-center space-x-1.5 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-xs font-semibold text-[#FCF6BA] shadow-sm ring-1 ring-[#D4AF37] hover:bg-neutral-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSavingTg ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-[#D4AF37]" />}
                    <span>Save Node Configuration (সংরক্ষণ করুন)</span>
                  </button>

                  <button
                    onClick={handleTestTelegram}
                    disabled={tgTesting}
                    className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
                  >
                    {tgTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    <span>Verify Node Gateway</span>
                  </button>

                  <button
                    onClick={handleSendTelegramTestAlert}
                    className="flex items-center space-x-1.5 rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 text-neutral-600" />
                    <span>Dispatch Cryptographic Heartbeat</span>
                  </button>
                </div>

                {tgSavedNotice && (
                  <div className="mt-4 flex items-center space-x-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Sovereign Node credentials saved permanently to database. Automatic uploads will now use this configuration without re-entering!</span>
                  </div>
                )}

                {tgTestResult && (
                  <div
                    className={`mt-4 rounded-xl p-3.5 text-xs font-semibold ring-1 ${
                      tgTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                        : 'bg-rose-50 text-rose-800 ring-rose-200'
                    }`}
                  >
                    {tgTestResult.message || tgTestResult.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: SECURITY AUDIT & RATE LIMIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="mt-8 space-y-6">
            <div className="luxury-card p-6">
              <h3 className="font-serif text-base font-bold text-[#1A1A1A] mb-4">Security & Access Audit Trail</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase">
                    <tr>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Event Action</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3">Client IP</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#FAF8F2]/60">
                        <td className="py-3 text-neutral-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-3 font-semibold text-[#1A1A1A]">{log.action}</td>
                        <td className="py-3 text-neutral-600">{log.details}</td>
                        <td className="py-3 font-mono">{log.ip}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              log.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700'
                                : log.status === 'warning'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CREATE / EDIT FOLDER MODAL */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/40 bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsFolderModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
              {editingFolder ? 'Edit Vault Settings' : 'Create New Photo Vault'}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">Configure access controls, passcodes, and watermark protection.</p>

            <form onSubmit={handleSaveFolder} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">Vault Name</label>
                <input
                  type="text"
                  value={folderForm.name}
                  onChange={e => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="e.g. Monaco Yacht Show 2026"
                  required
                  className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">Category</label>
                <select
                  value={folderForm.category}
                  onChange={e => setFolderForm({ ...folderForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs text-[#1A1A1A] focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">Description</label>
                <textarea
                  value={folderForm.description}
                  onChange={e => setFolderForm({ ...folderForm, description: e.target.value })}
                  placeholder="Brief note for clients..."
                  rows={2}
                  className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs text-[#1A1A1A] focus:outline-none"
                />
              </div>

              {/* Password Protection */}
              <div className="rounded-xl border border-neutral-200 p-3.5 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={folderForm.isPasswordProtected}
                    onChange={e => setFolderForm({ ...folderForm, isPasswordProtected: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#D4AF37]"
                  />
                  <span className="text-xs font-semibold text-[#1A1A1A]">Enable Passcode Protection</span>
                </label>

                {folderForm.isPasswordProtected && (
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1">
                      {editingFolder ? 'Change Passcode (leave blank to keep current)' : 'Vault Passcode'}
                    </label>
                    <input
                      type="text"
                      value={folderForm.password}
                      onChange={e => setFolderForm({ ...folderForm, password: e.target.value })}
                      placeholder="e.g. Wedding2026 or VIPSecret"
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={folderForm.coverUrl}
                  onChange={e => setFolderForm({ ...folderForm, coverUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none"
                />
              </div>

              {/* PHOTOGRAPHER PROFILE & SOCIAL MEDIA CREDITS */}
              <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#FAF8F2]/70 p-4 space-y-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A1A1A] text-[#FCF6BA]">
                    <Camera className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-[#1A1A1A]">
                      Photographer Credits & Socials (ফটোগ্রাফার প্রোফাইল ও সোশ্যাল মিডিয়া)
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      ফটোগ্রাফারের নাম, সোশ্যাল প্ল্যাটফর্ম ইউজারনেম ও কাস্টম ইউআরএল লিঙ্ক সেট করুন
                    </p>
                  </div>
                </div>

                {/* Photographer Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-700 uppercase mb-1">
                    Photographer / Studio Name (ফটোগ্রাফারের নাম)
                  </label>
                  <input
                    type="text"
                    value={folderForm.photographerName}
                    onChange={e => setFolderForm({ ...folderForm, photographerName: e.target.value })}
                    placeholder="e.g. Siam Ahmed Photography or Studio Luxe"
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Social Platform Selector & Username Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 uppercase mb-1">
                      Social Platform (সোশ্যাল মিডিয়া)
                    </label>
                    <select
                      value={folderForm.photographerSocialPlatform}
                      onChange={e => setFolderForm({ ...folderForm, photographerSocialPlatform: e.target.value as SocialPlatform })}
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      {SOCIAL_PLATFORMS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 uppercase mb-1">
                      Username / Handle (ইউজারনেম)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <AtSign className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={folderForm.photographerUsername}
                        onChange={e => setFolderForm({ ...folderForm, photographerUsername: e.target.value.replace(/^@/, '') })}
                        placeholder={
                          SOCIAL_PLATFORMS.find(p => p.id === folderForm.photographerSocialPlatform)?.placeholder ||
                          'username'
                        }
                        className="w-full rounded-xl border border-[#D4AF37]/30 bg-white pl-8 pr-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Social URL Preview */}
                {folderForm.photographerUsername && (
                  <div className="flex items-center space-x-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-mono text-neutral-600 border border-[#D4AF37]/20">
                    {renderPlatformIcon(folderForm.photographerSocialPlatform, 'h-3.5 w-3.5 text-[#997A15] shrink-0')}
                    <span className="text-neutral-400">URL Preview:</span>
                    <span className="text-[#997A15] truncate">
                      {resolveSocialUrl(folderForm.photographerSocialPlatform, folderForm.photographerUsername)}
                    </span>
                  </div>
                )}

                {/* Dedicated Custom URL Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-semibold text-neutral-700 uppercase">
                      কাস্টম ইউআরএল (Custom Website / Portfolio URL)
                    </label>
                    <span className="text-[10px] text-neutral-400 font-normal">Direct Link</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Globe className="h-3.5 w-3.5 text-[#B38728]" />
                    </div>
                    <input
                      type="url"
                      value={folderForm.photographerCustomUrl}
                      onChange={e => setFolderForm({ ...folderForm, photographerCustomUrl: e.target.value })}
                      placeholder="https://siamphotography.com or portfolio link"
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-white pl-8 pr-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    ফটোগ্রাফারের নিজস্ব কাস্টম ওয়েবসাইট বা পোর্টফোলিও লিঙ্ক। ভিজিটররা এই লিঙ্কে ক্লিক করে সরাসরি ফটোগ্রাফারের সাইটে যেতে পারবেন।
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] py-3 text-xs font-semibold text-white shadow-md hover:opacity-95"
              >
                <span>Save Vault Configuration</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SMART COVER CANDIDATES PICKER MODAL */}
      {isCoverPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#D4AF37]/40 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCoverPickerOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-[#B38728]" />
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Smart Cover Recommendations</h3>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              AI ranked the sharpest, highest-contrast compositions from this vault. Click one to apply as cover.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {coverCandidates.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSmartCover(url)}
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-lg transition-all"
                >
                  <img src={url} alt={`Candidate ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                    Select Cover
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/40 bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A1A1A] to-neutral-800 text-[#FCF6BA] ring-1 ring-[#D4AF37]">
                {editingUser ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5 text-[#D4AF37]" />}
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {editingUser
                    ? 'Update profile details, assign specific permissions, and modify storage quota.'
                    : 'Assign a role, select granular capabilities, and allocate dedicated cloud storage.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="mt-6 space-y-5">
              {/* Basic Info: Name, Username, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="e.g. Sophia Montgomery"
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                    Username / Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. sophia_photo"
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="e.g. sophia@luxuryvault.io"
                    className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase">
                    {editingUser ? 'New Password (Optional)' : 'Account Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="text-[11px] font-semibold text-[#997A15] hover:underline"
                  >
                    {showPasswordInput ? 'Hide' : 'Show'} Password
                  </button>
                </div>
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep existing password' : 'Enter account password (min 6 characters)'}
                  className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Role Selection Preset */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-2">
                  Assign Account Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { role: 'owner' as UserRole, title: 'Owner', desc: 'Full System Access' },
                    { role: 'admin' as UserRole, title: 'Admin', desc: 'Vaults & Curation' },
                    { role: 'uploader' as UserRole, title: 'Curator', desc: 'Media Ingestion' },
                    { role: 'viewer' as UserRole, title: 'Viewer', desc: 'Review & Proofing' },
                  ].map(item => {
                    const isSelected = userForm.role === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => applyRoleDefaults(item.role)}
                        className={`rounded-xl p-3 text-left border transition-all ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#1A1A1A] text-white shadow-md ring-1 ring-[#D4AF37]'
                            : 'border-neutral-200 bg-[#FAF8F2] text-neutral-800 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-[#FCF6BA]' : 'text-[#1A1A1A]'}`}>
                          {item.title}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="rounded-xl border border-[#D4AF37]/20 bg-[#FAF8F2]/60 p-4">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3 mb-3">
                  <div>
                    <div className="text-xs font-bold text-[#1A1A1A] flex items-center space-x-1.5">
                      <Shield className="h-4 w-4 text-[#997A15]" />
                      <span>Granular Access Permissions ({userForm.permissions.length}/9 Active)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Check or uncheck individual website capabilities for this user.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, permissions: PERMISSION_OPTIONS.map(p => p.key) })}
                      className="text-[10px] font-semibold text-[#997A15] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, permissions: [] })}
                      className="text-[10px] font-semibold text-neutral-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERMISSION_OPTIONS.map(opt => {
                    const isChecked = userForm.permissions.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-start space-x-2.5 rounded-lg p-2.5 cursor-pointer border transition-all ${
                          isChecked
                            ? 'border-[#D4AF37]/60 bg-white shadow-xs'
                            : 'border-transparent bg-transparent hover:bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setUserForm({ ...userForm, permissions: [...userForm.permissions, opt.key] });
                            } else {
                              setUserForm({
                                ...userForm,
                                permissions: userForm.permissions.filter(k => k !== opt.key),
                              });
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <div className="text-xs">
                          <div className="font-semibold text-[#1A1A1A] flex items-center space-x-1.5">
                            <span>{opt.label}</span>
                            <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider">
                              [{opt.category}]
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                            {opt.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Cloud Storage Limit */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                    Upload Storage Quota Limit
                  </label>
                  <span className="inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-xs font-mono font-bold bg-[#FAF8F2] text-[#997A15] ring-1 ring-[#D4AF37]/30">
                    {userForm.storageLimitMb === 0 ? (
                      <>
                        <Infinity className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Unlimited (আনলিমিটেড)</span>
                      </>
                    ) : userForm.storageLimitMb >= 1048576 ? (
                      <span>{(userForm.storageLimitMb / 1048576).toFixed(0)} TB Quota</span>
                    ) : (
                      <span>{(userForm.storageLimitMb / 1024).toFixed(0)} GB Quota</span>
                    )}
                  </span>
                </div>

                {/* Specific Options: 5, 10, 15, 20, 100, 1 TB, Unlimited */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  {[
                    { label: '5 GB', mb: 5120 },
                    { label: '10 GB', mb: 10240 },
                    { label: '15 GB', mb: 15360 },
                    { label: '20 GB', mb: 20480 },
                    { label: '100 GB', mb: 102400 },
                    { label: '1 TB', mb: 1048576 },
                    { label: '∞ Unlimited (0)', mb: 0 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, storageLimitMb: preset.mb })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium border transition-all cursor-pointer ${
                        userForm.storageLimitMb === preset.mb
                          ? 'border-[#D4AF37] bg-[#1A1A1A] text-[#FCF6BA] shadow-xs'
                          : 'border-neutral-200 bg-[#FAF8F2] text-neutral-700 hover:border-[#D4AF37]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 for Unlimited, or custom GB"
                      value={userForm.storageLimitMb === 0 ? '' : Math.round(userForm.storageLimitMb / 1024)}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) <= 0) {
                          setUserForm({ ...userForm, storageLimitMb: 0 });
                        } else {
                          setUserForm({ ...userForm, storageLimitMb: parseInt(val) * 1024 });
                        }
                      }}
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 font-mono">
                      GB (0 = Unlimited)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, storageLimitMb: 0 })}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      userForm.storageLimitMb === 0
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Set Unlimited
                  </button>
                </div>
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-[#FAF8F2] p-4">
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]">Account Login Status</div>
                  <div className="text-[11px] text-neutral-500">
                    {userForm.isActive ? 'Active account — user can log in with their credentials' : 'Suspended account — user access is temporarily disabled'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    userForm.isActive ? 'bg-emerald-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      userForm.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-1/3 rounded-xl border border-neutral-200 bg-white py-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] py-3 text-xs font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingUser ? 'Save User Privileges' : 'Create User Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
