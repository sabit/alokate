import { useSnapshots } from '../../hooks/useSnapshots';
import type { Snapshot } from '../../types';

export const SnapshotSelector = () => {
  const { snapshots } = useSnapshots();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4">
      <select className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100">
        {snapshots.map((snapshot: Snapshot) => (
          <option key={snapshot.id} value={snapshot.id}>
            {snapshot.snapshotName ?? snapshot.id}
          </option>
        ))}
      </select>
      <select className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100">
        {snapshots.map((snapshot: Snapshot) => (
          <option key={snapshot.id} value={snapshot.id}>
            {snapshot.snapshotName ?? snapshot.id}
          </option>
        ))}
      </select>
    </div>
  );
};
