import Dexie, { type Table } from 'dexie';
import type { Snapshot, UnifiedState } from '../types';

class SchedulerDatabase extends Dexie {
  state!: Table<UnifiedState>;
  snapshots!: Table<Snapshot>;

  constructor() {
    super('scheduler-db');
    this.version(1).stores({
      state: 'id',
      snapshots: 'id',
    });
  }
}

const db = new SchedulerDatabase();

export const loadOfflineState = async () => {
  try {
    return await db.state.get('singleton');
  } catch (error) {
    console.error('IndexedDB error loading state:', error);
    throw error;
  }
};

export const saveOfflineState = async (state: UnifiedState) => {
  try {
    await db.state.put({ ...state, id: 'singleton' } as UnifiedState & { id: string });
  } catch (error) {
    console.error('IndexedDB error saving state:', error);
    throw error;
  }
};

export const saveOfflineSnapshot = async (snapshot: Snapshot) => {
  try {
    await db.snapshots.put(snapshot);
  } catch (error) {
    console.error('IndexedDB error saving snapshot:', error);
    throw error;
  }
};

export const listOfflineSnapshots = async () => {
  try {
    return await db.snapshots.toArray();
  } catch (error) {
    console.error('IndexedDB error listing snapshots:', error);
    throw error;
  }
};

export const deleteOfflineSnapshot = async (snapshotId: string) => {
  try {
    await db.snapshots.delete(snapshotId);
  } catch (error) {
    console.error('IndexedDB error deleting snapshot:', error);
    throw error;
  }
};
