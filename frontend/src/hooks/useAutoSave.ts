import { useEffect, useRef } from 'react';
import { useSchedulerStore } from '../store/schedulerStore';
import { useUIStore } from '../store/uiStore';
import { saveState } from '../data/storage';
import type { UnifiedState } from '../types';

const DEBOUNCE_DELAY = 500; // 500ms delay to batch rapid changes

/**
 * Hook that automatically saves scheduler state changes to IndexedDB
 * with debouncing to avoid excessive writes
 */
export const useAutoSave = () => {
  const schedulerState = useSchedulerStore();
  const { beginOperation, endOperation, pushToast } = useUIStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedStateRef = useRef<string>('');

  useEffect(() => {
    // Extract the state we want to save (exclude methods)
    const stateToSave: UnifiedState = {
      config: schedulerState.config,
      preferences: schedulerState.preferences,
      schedule: schedulerState.schedule,
      snapshots: schedulerState.snapshots,
      settings: schedulerState.settings,
    };

    // Serialize state to compare with last saved state
    const currentStateStr = JSON.stringify(stateToSave);

    // Skip if state hasn't changed
    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule a new save after debounce delay
    saveTimeoutRef.current = setTimeout(async () => {
      // Prevent concurrent saves
      if (isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      beginOperation(); // Show "Saving..." indicator

      try {
        await saveState(stateToSave);
        lastSavedStateRef.current = currentStateStr;
      } catch (error) {
        console.error('Auto-save failed:', error);
        
        // Show persistent error toast with retry and export options
        pushToast({
          message: error instanceof Error ? error.message : 'Failed to save changes to local storage',
          variant: 'error',
          persistent: true,
          action: {
            label: 'Retry Save',
            onClick: async () => {
              try {
                await saveState(stateToSave);
                lastSavedStateRef.current = currentStateStr;
                pushToast({
                  message: 'Changes saved successfully',
                  variant: 'success',
                });
              } catch (retryError) {
                pushToast({
                  message: 'Save failed again. Please export your data to avoid losing changes.',
                  variant: 'error',
                  persistent: true,
                });
              }
            },
          },
        });
      } finally {
        isSavingRef.current = false;
        endOperation(); // Hide "Saving..." indicator
      }
    }, DEBOUNCE_DELAY);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    schedulerState.config,
    schedulerState.preferences,
    schedulerState.schedule,
    schedulerState.snapshots,
    schedulerState.settings,
    beginOperation,
    endOperation,
    pushToast,
  ]);
};
