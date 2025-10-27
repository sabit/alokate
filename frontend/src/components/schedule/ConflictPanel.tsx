import clsx from 'clsx';
import type { Conflict, ConflictSeverity } from '../../engine/conflictChecker';
import { useSchedulerEngine } from '../../hooks/useSchedulerEngine';
import { useScheduleUiStore } from '../../store/scheduleUiStore';

const severityBadgeClass: Record<ConflictSeverity, string> = {
  info: 'border border-sky-400/40 bg-sky-500/20 text-sky-100',
  warning: 'border border-amber-400/40 bg-amber-500/20 text-amber-100',
  critical: 'border border-rose-400/50 bg-rose-500/20 text-rose-100',
};

const severityLabel: Record<ConflictSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export const ConflictPanel = () => {
  const { conflicts } = useSchedulerEngine();
  const { setActiveCell, openEditDialog } = useScheduleUiStore((state) => ({
    setActiveCell: state.setActiveCell,
    openEditDialog: state.openEditDialog,
  }));

  const handleViewInGrid = (conflict: Conflict) => {
    const primaryCell = conflict.affectedCells[0];
    if (primaryCell) {
      setActiveCell(primaryCell);
      openEditDialog(primaryCell);
      return;
    }

    if (conflict.relatedFacultyIds.length > 0 && conflict.relatedTimeslotIds.length > 0) {
      const fallback = {
        facultyId: conflict.relatedFacultyIds[0],
        timeslotId: conflict.relatedTimeslotIds[0],
      };
      setActiveCell(fallback);
      openEditDialog(fallback);
    }
  };

  return (
    <section className="rounded-xl border border-white/5 bg-slate-950/40 p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Conflicts</h3>
        <span className="text-sm text-slate-400">{conflicts.length} found</span>
      </header>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {conflicts.length === 0 && <li>No conflicts detected. Run the optimiser to update results.</li>}
        {conflicts.map((conflict: Conflict) => (
          <li key={conflict.id} className="space-y-2 rounded-lg border border-white/5 bg-slate-900/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-100">{conflict.title}</p>
                <p className="text-xs text-slate-400">{conflict.description}</p>
              </div>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  severityBadgeClass[conflict.severity],
                )}
              >
                {severityLabel[conflict.severity]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              {conflict.relatedFacultyIds.length > 0 && (
                <span className="rounded bg-white/5 px-2 py-0.5">{conflict.relatedFacultyIds.length} faculty</span>
              )}
              {conflict.relatedSectionIds.length > 0 && (
                <span className="rounded bg-white/5 px-2 py-0.5">{conflict.relatedSectionIds.length} section{conflict.relatedSectionIds.length === 1 ? '' : 's'}</span>
              )}
              {conflict.relatedRoomIds.length > 0 && (
                <span className="rounded bg-white/5 px-2 py-0.5">{conflict.relatedRoomIds.length} room{conflict.relatedRoomIds.length === 1 ? '' : 's'}</span>
              )}
            </div>
            {conflict.affectedCells.length > 0 || (conflict.relatedFacultyIds.length > 0 && conflict.relatedTimeslotIds.length > 0) ? (
              <div>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-200 transition hover:text-brand-100"
                  onClick={() => handleViewInGrid(conflict)}
                >
                  View in grid
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
