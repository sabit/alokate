import type { Snapshot, UnifiedState } from '../types';
import {
  loadOfflineState,
  saveOfflineState,
  saveOfflineSnapshot,
  listOfflineSnapshots,
  deleteOfflineSnapshot,
} from './indexedDb';

/**
 * Load the current state from IndexedDB
 * @returns The unified state or undefined if no state exists
 */
export const loadState = async (): Promise<UnifiedState | undefined> => {
  try {
    return await loadOfflineState();
  } catch (error) {
    console.error('Failed to load state from IndexedDB:', error);
    throw new Error('Failed to load state from local storage');
  }
};

/**
 * Save the complete state to IndexedDB
 * @param state The unified state to save
 */
export const saveState = async (state: UnifiedState): Promise<void> => {
  try {
    await saveOfflineState(state);
  } catch (error) {
    console.error('Failed to save state to IndexedDB:', error);
    throw new Error('Failed to save state to local storage');
  }
};

/**
 * Save a snapshot to IndexedDB
 * @param snapshot The snapshot to save
 */
export const saveSnapshot = async (snapshot: Snapshot): Promise<void> => {
  try {
    await saveOfflineSnapshot(snapshot);
  } catch (error) {
    console.error('Failed to save snapshot to IndexedDB:', error);
    throw new Error('Failed to save snapshot to local storage');
  }
};

/**
 * Load all snapshots from IndexedDB
 * @returns Array of all snapshots
 */
export const loadSnapshots = async (): Promise<Snapshot[]> => {
  try {
    return await listOfflineSnapshots();
  } catch (error) {
    console.error('Failed to load snapshots from IndexedDB:', error);
    throw new Error('Failed to load snapshots from local storage');
  }
};

/**
 * Delete a snapshot from IndexedDB
 * @param snapshotId The ID of the snapshot to delete
 */
export const deleteSnapshot = async (snapshotId: string): Promise<void> => {
  try {
    await deleteOfflineSnapshot(snapshotId);
  } catch (error) {
    console.error('Failed to delete snapshot from IndexedDB:', error);
    throw new Error('Failed to delete snapshot from local storage');
  }
};
