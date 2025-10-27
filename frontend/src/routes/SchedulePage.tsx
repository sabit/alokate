import { ConflictPanel } from '../components/schedule/ConflictPanel';
import { EditDialog } from '../components/schedule/EditDialog/EditDialog';
import { FilterBar } from '../components/schedule/FilterBar';
import { ScheduleGrid } from '../components/schedule/ScheduleGrid/ScheduleGrid';

export const SchedulePage = () => (
  <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Schedule</h2>
        <p className="text-sm text-slate-400">
          Explore auto-generated timetables, inspect conflicts, and make manual adjustments.
        </p>
      </div>
      <FilterBar />
    </header>
    <ScheduleGrid />
    <ConflictPanel />
    <EditDialog />
  </div>
);
