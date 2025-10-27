import { SnapshotDiff } from '../components/snapshots/SnapshotDiff';
import { SnapshotSelector } from '../components/snapshots/SnapshotSelector';

export const SnapshotsPage = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold">Snapshots</h2>
      <p className="text-sm text-slate-400">
        Compare historical schedules, animate diffs, and restore preferred layouts.
      </p>
    </header>
    <SnapshotSelector />
    <SnapshotDiff />
  </section>
);
