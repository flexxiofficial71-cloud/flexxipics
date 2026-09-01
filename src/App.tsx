import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureTicker } from './components/FeatureTicker';
import { FolderCard } from './components/FolderCard';
import { FolderUnlockModal } from './components/FolderUnlockModal';
import { GalleryViewer } from './components/GalleryViewer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GalleryFolder, Category, TelegramSettings } from './types';
import { Lock, Shield, Sparkles, Cloud, CheckSquare, X, Copy, Heart, ShieldCheck } from 'lucide-react';
import { safeFetchJson, LocalVaultStore } from './services/vaultApi';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'folder-view' | 'admin'>('home');
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Vault Unlock State
  const [activeFolder, setActiveFolder] = useState<GalleryFolder | null>(null);
  const [unlockedTokens, setUnlockedTokens] = useState<Record<string, string>>({});
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [pendingUnlockFolder, setPendingUnlockFolder] = useState<GalleryFolder | null>(null);

  // Admin State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Client Selections Modal State
  const [isSelectionsModalOpen, setIsSelectionsModalOpen] = useState(false);

  // Check URL route for /admin or #admin
  const syncRouteFromUrl = useCallback((loggedIn: boolean) => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const isAdminRoute = path.startsWith('/admin') || hash.includes('admin') || search.includes('admin');

    if (isAdminRoute) {
      if (loggedIn) {
        setCurrentView('admin');
        setIsAdminLoginModalOpen(false);
      } else {
        setIsAdminLoginModalOpen(true);
      }
    } else if (path === '/' || path === '' || hash === '' || hash === '#/') {
      if (currentView === 'admin' && !loggedIn) {
        setCurrentView('home');
      }
    }
  }, [currentView]);

  // Navigate to Admin URL safely
  const navigateToAdmin = useCallback(() => {
    if (window.location.pathname !== '/admin') {
      try {
        window.history.pushState(null, '', '/admin');
      } catch {
        window.location.hash = '/admin';
      }
    }
    if (isAdminLoggedIn) {
      setCurrentView('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  }, [isAdminLoggedIn]);

  // Navigate to Public Home URL safely
  const navigateToHome = useCallback(() => {
    if (window.location.pathname === '/admin' || window.location.hash.includes('admin')) {
      try {
        window.history.pushState(null, '', '/');
      } catch {
        window.location.hash = '/';
      }
    }
    setActiveFolder(null);
    setCurrentView('home');
  }, []);

  // Listen for browser popstate and URL changes
  useEffect(() => {
    syncRouteFromUrl(isAdminLoggedIn);

    const handlePopState = () => {
      syncRouteFromUrl(isAdminLoggedIn);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkey: Ctrl+Alt+A or Cmd+Alt+A or Shift+Alt+A
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        navigateToAdmin();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminLoggedIn, syncRouteFromUrl, navigateToAdmin]);

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      const [fRes, cRes, tgRes] = await Promise.all([
        safeFetchJson<GalleryFolder[]>('/api/folders'),
        safeFetchJson<Category[]>('/api/categories'),
        safeFetchJson<TelegramSettings>('/api/telegram/settings'),
      ]);

      if (fRes.success && Array.isArray(fRes.data)) {
        setFolders(fRes.data);
        LocalVaultStore.saveFolders(fRes.data);
      } else {
        setFolders(LocalVaultStore.getFolders());
      }

      if (cRes.success && Array.isArray(cRes.data)) {
        setCategories(cRes.data);
        LocalVaultStore.saveCategories(cRes.data);
      } else {
        setCategories(LocalVaultStore.getCategories());
      }

      if (tgRes.success && tgRes.data) {
        setTelegramSettings(tgRes.data);
        LocalVaultStore.saveTelegramSettings(tgRes.data);
      } else {
        setTelegramSettings(LocalVaultStore.getTelegramSettings());
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setFolders(LocalVaultStore.getFolders());
      setCategories(LocalVaultStore.getCategories());
      setTelegramSettings(LocalVaultStore.getTelegramSettings());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle clicking a folder
  const handleOpenFolder = (folder: GalleryFolder) => {
    if (!folder.isPasswordProtected || unlockedTokens[folder.id] || isAdminLoggedIn) {
      setActiveFolder(folder);
      setCurrentView('folder-view');
    } else {
      setPendingUnlockFolder(folder);
      setIsUnlockModalOpen(true);
    }
  };

  // On successful unlock
  const handleUnlockSuccess = (token: string, folder: GalleryFolder) => {
    setUnlockedTokens(prev => ({ ...prev, [folder.id]: token }));
    setIsUnlockModalOpen(false);
    setActiveFolder(folder);
    setCurrentView('folder-view');
  };

  // Toggle favorite photo
  const handleToggleFavorite = async (mediaId: string) => {
    try {
      await safeFetchJson(`/api/media/${mediaId}/favorite`, { method: 'POST' });
      const currentMedia = LocalVaultStore.getMedia().map(m =>
        m.id === mediaId ? { ...m, clientFavorited: !m.clientFavorited, clientLikes: (m.clientLikes || 0) + (m.clientFavorited ? -1 : 1) } : m
      );
      LocalVaultStore.saveMedia(currentMedia);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Toggle select photo
  const handleToggleSelect = async (mediaId: string) => {
    try {
      await safeFetchJson(`/api/media/${mediaId}/select`, { method: 'POST' });
      const currentMedia = LocalVaultStore.getMedia().map(m =>
        m.id === mediaId ? { ...m, clientSelected: !m.clientSelected } : m
      );
      LocalVaultStore.saveMedia(currentMedia);
    } catch (err) {
      console.error('Failed to toggle select:', err);
    }
  };

  // Filtered folders for home screen
  const filteredFolders = folders.filter(f => {
    const matchesCategory =
      selectedCategory === 'all' || f.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#1A1A1A] font-sans antialiased selection:bg-[#D4AF37]/30">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home') {
            navigateToHome();
          } else if (view === 'admin') {
            navigateToAdmin();
          }
        }}
        telegramSettings={telegramSettings}
        selectedCount={0}
      />

      {/* VIEW: HOME EXPLORER */}
      {currentView === 'home' && (
        <main>
          <HeroSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            folders={folders}
            onSelectFolder={handleOpenFolder}
          />

          {/* Vaults Grid Section */}
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                  {selectedCategory === 'all' ? 'All Protected Vaults' : selectedCategory}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Select an album to unlock photography and video archives.
                </p>
              </div>

              <span className="rounded-full bg-[#FAF8F2] px-3 py-1 text-xs font-semibold text-[#997A15] ring-1 ring-[#D4AF37]/30">
                {filteredFolders.length} {filteredFolders.length === 1 ? 'Album' : 'Albums'}
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#D4AF37] border-t-transparent" />
                <p className="mt-4 text-xs font-medium text-neutral-500">Synchronizing photo vaults...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#D4AF37]/40 bg-white p-12 text-center">
                <Shield className="mx-auto h-8 w-8 text-neutral-400" />
                <h3 className="mt-3 text-sm font-semibold text-[#1A1A1A]">No vaults match your criteria</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Try searching for another keyword or browse all categories.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFolders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onOpen={handleOpenFolder}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Running Ticker / Continuous Scrolling Marquee as a subtle design layer */}
          <FeatureTicker />

          {/* Clean Minimalist Footer */}
          <footer className="border-t border-[#D4AF37]/20 bg-white py-8 text-neutral-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-[#1A1A1A]">FLEXXIPICS</span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-500">Private Gallery & Client Proofing Archive</span>
              </div>
              <p className="text-[11px] text-neutral-400 text-center sm:text-right">
                Encrypted Storage & Lossless Media Streaming
              </p>
            </div>
          </footer>
        </main>
      )}

      {/* VIEW: GALLERY VIEWER */}
      {currentView === 'folder-view' && activeFolder && (
        <GalleryViewer
          folder={activeFolder}
          token={unlockedTokens[activeFolder.id] || adminToken || null}
          onBack={navigateToHome}
          onToggleFavorite={handleToggleFavorite}
          onToggleSelect={handleToggleSelect}
        />
      )}

      {/* VIEW: ADMIN CURATOR DASHBOARD */}
      {currentView === 'admin' && (
        <AdminDashboard
          adminToken={adminToken}
          onBackToHome={navigateToHome}
        />
      )}

      {/* MODAL: FOLDER UNLOCK */}
      <FolderUnlockModal
        folder={pendingUnlockFolder}
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setPendingUnlockFolder(null);
        }}
        onUnlockSuccess={handleUnlockSuccess}
      />

      {/* MODAL: ADMIN LOGIN */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => {
          setIsAdminLoginModalOpen(false);
          // If closed without logging in while at /admin, revert URL to /
          if (window.location.pathname === '/admin' || window.location.hash.includes('admin')) {
            try {
              window.history.pushState(null, '', '/');
            } catch {
              window.location.hash = '/';
            }
          }
        }}
        onLoginSuccess={(token) => {
          setAdminToken(token);
          setIsAdminLoggedIn(true);
          setCurrentView('admin');
          if (window.location.pathname !== '/admin') {
            try {
              window.history.pushState(null, '', '/admin');
            } catch {
              window.location.hash = '/admin';
            }
          }
        }}
      />
    </div>
  );
}

export default App;

