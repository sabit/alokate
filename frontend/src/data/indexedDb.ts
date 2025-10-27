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

export const loadOfflineState = async () => db.state.get('singleton');

export const saveOfflineState = async (state: UnifiedState) =>
  db.state.put({ ...state, id: 'singleton' } as UnifiedState & { id: string });

export const saveOfflineSnapshot = async (snapshot: Snapshot) => db.snapshots.put(snapshot);

export const listOfflineSnapshots = async () => db.snapshots.toArray();
