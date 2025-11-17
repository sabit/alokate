import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useSnapshots } from '../../../hooks/useSnapshots';

export const SnapshotList = () => {
  const { snapshots, deleteSnapshot } = useSnapshots();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (snapshotId: string) => {
    setDeletingId(snapshotId);
  };

  const handleConfirmDelete = async (snapshotId: string) => {
    await deleteSnapshot(snapshotId);
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

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
            {deletingId === snapshot.id ? (
              <div className="space-y-2">
                <p className="font-medium text-amber-400">Delete this snapshot?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmDelete(snapshot.id)}
                    className="flex-1 rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 rounded bg-slate-700 px-2 py-1 text-[10px] font-medium text-white hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{snapshot.snapshotName ?? snapshot.id}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(snapshot.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteClick(snapshot.id)}
                  className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                  title="Delete snapshot"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
