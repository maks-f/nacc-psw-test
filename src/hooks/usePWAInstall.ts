import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isMac: boolean;
  isWindows: boolean;
  isChromium: boolean;
  isSafari: boolean;
  isFirefox: boolean;
}

export function getPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isMac: false,
      isWindows: false,
      isChromium: false,
      isSafari: false,
      isFirefox: false,
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const nav = window.navigator as { platform?: string; maxTouchPoints?: number };

  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (nav.platform === 'MacIntel' && typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 1);

  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile|tablet|silk|mobi/.test(ua);

  const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
  const isWindows = /windows|win32|win64/.test(ua);

  const isFirefox = /firefox|fxios/.test(ua);
  const isChromium =
    (/chrome|chromium|crios/.test(ua) || /edg/.test(ua)) && !/opr|opera/.test(ua);
  const isSafari = /safari/.test(ua) && !isChromium && !isFirefox && !/opr|opera/.test(ua);

  return {
    isIOS,
    isAndroid,
    isMobile,
    isMac,
    isWindows,
    isChromium,
    isSafari,
    isFirefox,
  };
}

const PWA_INSTALLED_STORAGE_KEY = 'pwa_app_installed_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__pwaInstallPrompt) {
      return window.__pwaInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) return true;

    // Check if previously marked as installed in this browser
    try {
      if (localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true' && !window.__pwaInstallPrompt) {
        return true;
      }
    } catch {
      // ignore storage access error
    }

    return false;
  });

  const [platform, setPlatform] = useState<PlatformInfo>(getPlatformInfo);

  useEffect(() => {
    setPlatform(getPlatformInfo());

    // Check display-mode standalone changes (e.g. app launched or switched mode)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        try {
          localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
        } catch {}
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    // Check if prompt was captured before React mounted
    if (window.__pwaInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      // If browser fires beforeinstallprompt, the app is NOT installed
      setIsInstalled(false);
      try {
        localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
      } catch {}
    };

    const handlePromptAvailable = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setIsInstalled(false);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      try {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    // Modern Chromium API: check if related installed app exists
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
            } catch {}
          }
        })
        .catch(() => {});
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    const promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? window.__pwaInstallPrompt : null);
    if (!promptEvent) {
      return 'manual';
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          window.__pwaInstallPrompt = null;
        }
        try {
          localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
        } catch {}
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Native PWA install error, switching to manual guide:', err);
      return 'manual';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    platform,
    install,
  };
}
