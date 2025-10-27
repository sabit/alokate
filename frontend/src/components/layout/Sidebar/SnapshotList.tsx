import { useSnapshots } from '../../../hooks/useSnapshots';

export const SnapshotList = () => {
  const { snapshots } = useSnapshots();

  if (!snapshots.length) {
    return (
      <div className="px-4 py-6 text-xs text-slate-500">
        No snapshots yet — capture one after generating a schedule.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-2 py-4">
      <p className="px-2 text-xs uppercase tracking-wide text-slate-500">Snapshots</p>
      <ul className="mt-2 space-y-2">
        {snapshots.map((snapshot) => (
          <li
            key={snapshot.id}
            className="rounded-md border border-white/5 bg-slate-900/50 p-2 text-xs text-slate-200"
          >
            <p className="font-medium">{snapshot.snapshotName ?? snapshot.id}</p>
            <p className="text-[10px] text-slate-500">{new Date(snapshot.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
