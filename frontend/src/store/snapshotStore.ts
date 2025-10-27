import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import type { Snapshot } from '../types';

export interface SnapshotState {
  snapshots: Snapshot[];
  addSnapshot: (snapshot: Snapshot) => void;
  hydrate: (snapshots: Snapshot[]) => void;
}

const initializer: StateCreator<SnapshotState> = (set) => ({
  snapshots: [],
  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [snapshot, ...state.snapshots].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    })),
  hydrate: (snapshots) =>
    set({
      snapshots: [...snapshots].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    }),
});

export const useSnapshotStore = create<SnapshotState>(initializer);
