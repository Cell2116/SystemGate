import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
export function usePWA() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      
    },
    onRegisterError(error: any) {
      
    },
  });
  useEffect(() => {
    if (needRefresh) {
      setUpdateAvailable(true);
    }
  }, [needRefresh]);
  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateAvailable(false);
  };
  const updateApp = () => {
    updateServiceWorker(true);
  };
  return {
    offlineReady,
    needRefresh,
    updateAvailable,
    updateApp,
    close,
  };
}
