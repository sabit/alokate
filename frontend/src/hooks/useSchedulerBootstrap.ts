import { useEffect, useRef, useState } from 'react';
import { loadState } from '../data/storage';
import { defaultState } from '../data/schema';
import { useSchedulerStore } from '../store/schedulerStore';
import { useSnapshotStore } from '../store/snapshotStore';
import { useUIStore } from '../store/uiStore';

export const useSchedulerBootstrap = () => {
  const hydrateScheduler = useSchedulerStore((state) => state.hydrate);
  const hydrateSnapshots = useSnapshotStore((state) => state.hydrate);
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (initialized.current) {
      return () => {
        cancelled = true;
      };
    }

    const bootstrap = async () => {
      setInitializing(true);
      setError(null);
      beginOperation();

      try {
        // Load state from IndexedDB
        const state = await loadState();
        if (cancelled) {
          return;
        }
        
        // If state exists, hydrate stores with it
        // Otherwise, initialize with empty default state
        if (state) {
          hydrateScheduler(state);
          hydrateSnapshots(state.snapshots ?? []);
        } else {
          hydrateScheduler(defaultState);
          hydrateSnapshots([]);
        }
        
        initialized.current = true;
      } catch (storageError) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load state from IndexedDB', storageError);
        const message =
          storageError instanceof Error ? storageError.message : 'Unable to load scheduler data from local storage';
        setError(message);
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
  }, [beginOperation, endOperation, hydrateScheduler, hydrateSnapshots]);

  return {
    initializing,
    error,
  };
};
