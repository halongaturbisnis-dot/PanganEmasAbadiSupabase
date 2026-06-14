import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokens } from '../../ui/styles/tokens.js';
import { appAssets } from '../../ui/styles/assets.js';

import { syncActualTime, getTimezoneInfo } from '../utils/time.js';
import { browserStorage } from '../utils/browserStorage.js';

import idTranslations from '../locales/id.json';
import enTranslations from '../locales/en.json';

interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCompact: boolean; // width < 640px
  isWide: boolean;    // width > 1024px
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface GlobalState {
  user: any | null;
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'system';
  language: string;
  viewport: ViewportState;
  isLoading: boolean;
  time: {
    isSynced: boolean;
    drift: number;
    timezone: string;
    offset: string;
  };
  translations: Record<string, any>;
  confirmDialog: ConfirmOptions | null;
  isCommandPaletteOpen: boolean;
  sidebarMode: 'fluid' | 'floating';
  isFloatingSidebar: boolean;
  isSidebarCollapsed: boolean;
  notifications: {
    dropshipCount: number;
    expenseRequestCount: number;
    incomeRequestCount: number;
    queueStokMasukCount: number;
    persetujuanCount: number;
  };
}

const GlobalContext = createContext<{
  state: GlobalState;
  setState: React.Dispatch<React.SetStateAction<GlobalState>>;
  setIsLoading: (loading: boolean) => void;
  t: (key: string) => string;
  confirm: (options: ConfirmOptions) => void;
  toggleCommandPalette: (open?: boolean) => void;
  toggleSidebarMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  refreshNotifications: () => Promise<void>;
} | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalState>({
    user: null,
    theme: 'light',
    themeMode: 'light',
    language: 'id',
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 1200,
      height: typeof window !== 'undefined' ? window.innerHeight : 800,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isCompact: false,
      isWide: true,
    },
    isLoading: false,
    time: {
      isSynced: false,
      drift: 0,
      timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      offset: '+00:00',
    },
    translations: {},
    confirmDialog: null,
    isCommandPaletteOpen: false,
    sidebarMode: 'fluid',
    isFloatingSidebar: true,
    isSidebarCollapsed: false,
    notifications: {
      dropshipCount: 0,
      expenseRequestCount: 0,
      incomeRequestCount: 0,
      queueStokMasukCount: 0,
      persetujuanCount: 0
    }
  });

  // Note: Theme Switching Removed as per ThemeModeRule.md
  // Application is locked to Light Mode.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    setState(prev => ({ ...prev, theme: 'light', themeMode: 'light' }));
  }, []);

  // Handle Keyboard Shortcuts (CMD+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setState(prev => ({ ...prev, isCommandPaletteOpen: !prev.isCommandPaletteOpen }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper for translating keys
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = state.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  // Centralized Viewport Engine & Mobile Zoom Policy
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState(prev => ({
        ...prev,
        viewport: {
          width,
          height,
          isMobile: width < 640,
          isTablet: width >= 640 && width < 1024,
          isDesktop: width >= 1024,
          isCompact: width < 640,
          isWide: width > 1200,
        }
      }));
    };

    // Apply Viewport Meta Policy
    const updateViewportMeta = () => {
      let viewport = document.querySelector('meta[name="viewport"]');
      const content = appAssets.mobileZoom 
        ? 'width=device-width, initial-scale=1'
        : 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';

      if (viewport) {
        viewport.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    handleResize();
    updateViewportMeta();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Multi-Language Loading
  useEffect(() => {
    const initTime = async () => {
      const actualTime = await syncActualTime();
      const tzInfo = getTimezoneInfo();
      const drift = Date.now() - actualTime;
      
      setState(prev => ({
        ...prev,
        time: {
          isSynced: true,
          drift,
          timezone: tzInfo.zoneName,
          offset: tzInfo.offsetString,
        }
      }));
    };

    const loadUserFromStorage = () => {
      let savedUser = browserStorage.get<any>('active_user');
      if (savedUser) {
        // Migration: If user_id is legacy 'spadmin', update to standard UUID
        if (savedUser.user_id === 'spadmin') {
          savedUser.user_id = '00000000-0000-0000-0000-000000000000';
          browserStorage.set('active_user', savedUser);
        }
        setState(prev => ({ ...prev, user: savedUser }));
      }
    };

    const loadTranslations = async () => {
      try {
        const data = state.language === 'en' ? enTranslations : idTranslations;
        setState(prev => ({ ...prev, translations: data }));
      } catch (error) {
        console.error('Failed to load translations:', error);
        setState(prev => ({ ...prev, translations: {} }));
      }
    };

    initTime();
    loadUserFromStorage();
    loadTranslations();
  }, [state.language]);

  // Holistic Design Token Injection - Single Source of Truth from tokens.ts
  useEffect(() => {
    const root = document.documentElement;
    const themeMode = 'light'; // Forced to light as per ThemeModeRule.md

    const injectBatch = (data: any) => {
      if (!data || typeof data !== 'object') return;
      
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          injectBatch(value);
        } else if (typeof value === 'string' || typeof value === 'number') {
          // Abaikan string class utiliti Tailwind agar tidak di-inject sebagai raw CSS variable
          if (typeof value === 'string' && (value.includes('-[') || value.includes('sm:'))) {
            return;
          }

          const cssVarName = `--${key}`;
          root.style.setProperty(cssVarName, String(value));
          
          if (key.startsWith('Elevation')) {
            const shadowName = `--shadow-${key.replace('Elevation', '').toLowerCase()}`;
            root.style.setProperty(shadowName, String(value));
          }
        }
      });
    };

    // Eksekusi Tuntas: Inject spesifik tanpa loop alias redundan dari root object
    injectBatch(tokens.primitives);
    injectBatch(tokens.semantic.colors[themeMode]);
    injectBatch(tokens.semantic.focus);
    injectBatch(tokens.semantic.radii);
    injectBatch(tokens.semantic.elevations);
    injectBatch(tokens.semantic.zIndices);
    injectBatch(tokens.semantic.durations);
    injectBatch(tokens.semantic.transforms);
    injectBatch(tokens.gradients);

    // Always light mode settings
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }, [state.theme]);

  // Handle Dynamic Favicon
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');

    if (favicon) {
      favicon.setAttribute('href', appAssets.favicon);
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = appAssets.favicon;
      document.head.appendChild(link);
    }

    if (appleIcon) {
      appleIcon.setAttribute('href', appAssets.pwaIcon);
    } else {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = appAssets.pwaIcon;
      document.head.appendChild(link);
    }
  }, []);

  // Register Service Worker for Push Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // We pass the assets icons as query params so sw.js can read them
        const swUrl = `/sw.js?icon=${encodeURIComponent(appAssets.pushConfig.pushIcon)}&badge=${encodeURIComponent(appAssets.pushConfig.pushBadge)}`;
        
        navigator.serviceWorker.register(swUrl).then(registration => {
          console.log('SW registered: ', registration);
          
          // Auto Request Permission (optional but proactive)
          if (Notification.permission === 'default') {
             setTimeout(() => {
                Notification.requestPermission();
             }, 2000); // Wait 2s for app and user to be ready
          }
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  const setIsLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const confirm = (options: ConfirmOptions) => {
    setState(prev => ({ ...prev, confirmDialog: options }));
  };

  const toggleCommandPalette = (open?: boolean) => {
    setState(prev => ({ ...prev, isCommandPaletteOpen: open !== undefined ? open : !prev.isCommandPaletteOpen }));
  };

  const toggleSidebarMode = () => {
    setState(prev => {
      const nextMode = prev.sidebarMode === 'fluid' ? 'floating' : 'fluid';
      return {
        ...prev,
        sidebarMode: nextMode,
        isFloatingSidebar: nextMode === 'floating'
      };
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setState(prev => ({ ...prev, isSidebarCollapsed: collapsed }));
  };

  const refreshNotifications = async () => {
    try {
      // Import dynamic to avoid circular dependencies
      const { penjualanService } = await import('../services/penjualanService');
      const { pengeluaranService } = await import('../services/pengeluaranService');
      const { pemasukanService } = await import('../services/pemasukanService');
      const { stokMasukService } = await import('../services/stokMasukService');
      const { pembelianService } = await import('../services/pembelianService');

      const currentUser = state.user || browserStorage.get<any>('active_user');

      const [dropshipItems, expenseRequests, incomeRequests, queueStokMasuk, allPembelian] = await Promise.all([
        penjualanService.getApprovedDropshipItems(),
        pengeluaranService.getRequestsPaginated(1, '', { limit: 1 }), // Just to get total
        pemasukanService.getRequestsPaginated(1, '', { limit: 1 }), // Just to get total
        stokMasukService.getQueue(),
        pembelianService.getPaginated(1, '', { limit: 5000 })
      ]);

      // Filter logic matches PembelianPage.tsx
      const pendingDropshipItems = dropshipItems.filter(ds => 
        !allPembelian.items.some(p => p.additional_description && p.additional_description.includes(ds.invoice_number))
      );

      // Count unique invoices for the badge
      const uniqueInvoicesCount = new Set(pendingDropshipItems.map(item => item.invoice_number)).size;

      // Count approval items if current user has the permission
      let persetujuanCount = 0;
      if (currentUser?.user_id && (currentUser?.has_invoice_approval || currentUser?.user_id === '00000000-0000-0000-0000-000000000000')) {
        try {
          const approvalsRes = await penjualanService.getPaginatedApprovals(1, 1, '', false, currentUser.user_id);
          persetujuanCount = approvalsRes.total;
        } catch (approvalError) {
          console.error('Failed to fetch approval notifications:', approvalError);
        }
      }

      setState(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          dropshipCount: uniqueInvoicesCount,
          expenseRequestCount: expenseRequests.total,
          incomeRequestCount: incomeRequests.total,
          queueStokMasukCount: queueStokMasuk.length,
          persetujuanCount: persetujuanCount
        }
      }));
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  // Initial notification fetch
  useEffect(() => {
    refreshNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlobalContext.Provider value={{ state, setState, setIsLoading, t, confirm, toggleCommandPalette, toggleSidebarMode, setSidebarCollapsed, refreshNotifications }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobalState must be used within GlobalProvider');
  return context;
};
