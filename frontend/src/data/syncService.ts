import type { Settings, Snapshot, UnifiedState } from '../types';
import { fetchState, saveSnapshot, saveState, updateSettings } from './apiClient';
import { saveOfflineSnapshot, saveOfflineState } from './indexedDb';

export const syncFromServer = async (token: string) => {
  const state = await fetchState(token);
  await saveOfflineState(state);
  return state;
};

export const syncToServer = async (token: string, state: UnifiedState) => {
  await saveState(token, state);
  await saveOfflineState(state);
};

export const syncSnapshot = async (token: string | null, snapshot: Snapshot) => {
  let synced = false;

  if (token) {
    try {
      await saveSnapshot(token, snapshot);
      synced = true;
    } catch (error) {
      console.error('Failed to sync snapshot with server, falling back to offline storage', error);
    }
  }

  await saveOfflineSnapshot(snapshot);
  return synced;
};

export const syncSettings = async (token: string, settings: Settings) => {
  await updateSettings(token, settings);
};
