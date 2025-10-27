import { useCallback } from 'react';
import { syncSnapshot } from '../data/syncService';
import { useSchedulerStore } from '../store/schedulerStore';
import { useSnapshotStore } from '../store/snapshotStore';
import { useUIStore } from '../store/uiStore';
import type { Snapshot } from '../types';
import { useAuth } from './useAuth';

export const useSnapshots = () => {
  const { snapshots, addSnapshot, hydrate } = useSnapshotStore();
  const { token } = useAuth();
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);

  const createSnapshot = useCallback(
    async ({ snapshotName }: { snapshotName?: string } = {}) => {
      const { config, preferences, schedule, settings } = useSchedulerStore.getState();
      const data = JSON.parse(
        JSON.stringify({ config, preferences, schedule, settings }),
      ) as Snapshot['data'];

      const snapshot: Snapshot = {
        id: `snap_${Date.now()}`,
        snapshotName,
        timestamp: new Date().toISOString(),
        data,
      };

      addSnapshot(snapshot);
      beginOperation();
      let synced = false;

      try {
        synced = await syncSnapshot(token ?? null, snapshot);
      } finally {
        endOperation();
      }

      return { snapshot, synced };
    },
    [addSnapshot, beginOperation, endOperation, token],
  );

  return {
    snapshots,
    createSnapshot,
    hydrate,
  };
};
