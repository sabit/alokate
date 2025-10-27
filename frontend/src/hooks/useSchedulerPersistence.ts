import { useCallback } from 'react';
import { saveOfflineState } from '../data/indexedDb';
import { syncToServer } from '../data/syncService';
import { useSchedulerStore } from '../store/schedulerStore';
import { useUIStore } from '../store/uiStore';
import type { UnifiedState } from '../types';
import { useAuth } from './useAuth';

const buildUnifiedState = (): UnifiedState => {
  const { config, preferences, schedule, snapshots, settings } = useSchedulerStore.getState();
  return JSON.parse(
    JSON.stringify({ config, preferences, schedule, snapshots, settings }),
  ) as UnifiedState;
};

export const useSchedulerPersistence = () => {
  const { token } = useAuth();
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);

  return useCallback(async () => {
    beginOperation();
    try {
      const state = buildUnifiedState();

      if (token) {
        try {
          await syncToServer(token, state);
          return true;
        } catch (error) {
          console.error('Failed to sync scheduler state to server, storing offline instead.', error);
        }
      }

      await saveOfflineState(state);
      return false;
    } finally {
      endOperation();
    }
  }, [beginOperation, endOperation, token]);
};
