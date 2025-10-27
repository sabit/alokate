import { useEffect, useRef, useState } from 'react';
import { loadOfflineState } from '../data/indexedDb';
import { syncFromServer } from '../data/syncService';
import { useSchedulerStore } from '../store/schedulerStore';
import { useSnapshotStore } from '../store/snapshotStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from './useAuth';

export const useSchedulerBootstrap = () => {
  const { token, logout } = useAuth();
  const hydrateScheduler = useSchedulerStore((state) => state.hydrate);
  const hydrateSnapshots = useSnapshotStore((state) => state.hydrate);
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const initializedToken = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!token || token === initializedToken.current) {
      return () => {
        cancelled = true;
      };
    }

    const bootstrap = async () => {
      setInitializing(true);
      setError(null);
      beginOperation();

      try {
        const state = await syncFromServer(token);
        if (cancelled) {
          return;
        }
        hydrateScheduler(state);
        hydrateSnapshots(state.snapshots);
        initializedToken.current = token;
      } catch (networkError) {
        if (cancelled) {
          return;
        }
        try {
          const offlineState = await loadOfflineState();
          if (offlineState) {
            hydrateScheduler(offlineState);
            hydrateSnapshots(offlineState.snapshots ?? []);
            initializedToken.current = token;
            return;
          }
        } catch (storageError) {
          console.error('Failed to read offline state', storageError);
        }

        const message =
          networkError instanceof Error ? networkError.message : 'Unable to load scheduler data';

        if (message.toLowerCase().includes('session expired')) {
          logout();
        } else {
          setError(message);
        }
      } finally {
        endOperation();
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    bootstrap().catch((bootstrapError) => {
      console.error('Bootstrap failed', bootstrapError);
    });

    return () => {
      cancelled = true;
    };
  }, [beginOperation, endOperation, hydrateScheduler, hydrateSnapshots, logout, token]);

  return {
    initializing,
    error,
  };
};
