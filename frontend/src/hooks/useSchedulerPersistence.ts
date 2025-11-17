import { useCallback } from 'react';
import { saveState } from '../data/storage';
import { useSchedulerStore } from '../store/schedulerStore';
import { useUIStore } from '../store/uiStore';
import type { UnifiedState } from '../types';

const buildUnifiedState = (): UnifiedState => {
  const { config, preferences, schedule, snapshots, settings } = useSchedulerStore.getState();
  return JSON.parse(
    JSON.stringify({ config, preferences, schedule, snapshots, settings }),
  ) as UnifiedState;
};

export const useSchedulerPersistence = () => {
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);

  return useCallback(async () => {
    beginOperation();
    try {
      const state = buildUnifiedState();
      await saveState(state);
    } finally {
      endOperation();
    }
  }, [beginOperation, endOperation]);
};
