import { useState, useEffect } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  isReadyOffline: boolean;
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isReadyOffline, setIsReadyOffline] = useState<boolean>(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkCache = async () => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          setIsReadyOffline(true);
          return;
        }
        if ('caches' in window) {
          const keys = await window.caches.keys();
          if (keys.length > 0) {
            setIsReadyOffline(true);
            return;
          }
        }
      } catch {
        // Fallback to true since bundled questions are embedded in app build
      }
      setIsReadyOffline(true);
    };

    checkCache();

    const handleControllerChange = () => {
      setIsReadyOffline(true);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  return { isOnline, isReadyOffline };
}
