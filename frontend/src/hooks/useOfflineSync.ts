import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useAuth } from './useAuth';

export const useOfflineSync = () => {
  const { token } = useAuth();
  const setOffline = useUIStore((state) => state.setOffline);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  return {
    token,
  };
};
