import { useCallback } from 'react';
import { saveSnapshot, deleteSnapshot as deleteSnapshotFromStorage } from '../data/storage';
import { useSchedulerStore } from '../store/schedulerStore';
import { useSnapshotStore } from '../store/snapshotStore';
import { useUIStore } from '../store/uiStore';
import type { Snapshot } from '../types';

export const useSnapshots = () => {
  const { snapshots, addSnapshot, removeSnapshot, hydrate } = useSnapshotStore();
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

      try {
        await saveSnapshot(snapshot);
      } finally {
        endOperation();
      }

      return { snapshot };
    },
    [addSnapshot, beginOperation, endOperation],
  );

  const deleteSnapshot = useCallback(
    async (snapshotId: string) => {
      beginOperation();

      try {
        await deleteSnapshotFromStorage(snapshotId);
        removeSnapshot(snapshotId);
      } finally {
        endOperation();
      }
    },
    [removeSnapshot, beginOperation, endOperation],
  );

  return {
    snapshots,
    createSnapshot,
    deleteSnapshot,
    hydrate,
  };
};
