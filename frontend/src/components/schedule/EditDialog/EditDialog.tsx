import clsx from 'clsx';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useScheduleGrid } from '../../../hooks/useScheduleGrid';
import { useSchedulerStore } from '../../../store/schedulerStore';
import { useScheduleUiStore } from '../../../store/scheduleUiStore';
import { useUIStore } from '../../../store/uiStore';

interface ReassignFormState {
  sectionId: string | null;
  facultyId: string | null;
  timeslotId: string | null;
}

export const EditDialog = () => {
  const { rows, faculties, timeslots, conflictIndex } = useScheduleGrid();
  const { schedule, updateSchedule } = useSchedulerStore((state) => ({
    schedule: state.schedule,
    updateSchedule: state.updateSchedule,
  }));

  const { pushToast } = useUIStore((state) => ({ pushToast: state.pushToast }));

  const { activeCell, isEditDialogOpen, closeEditDialog, setActiveCell } = useScheduleUiStore((state) => ({
    activeCell: state.activeCell,
    isEditDialogOpen: state.isEditDialogOpen,
    closeEditDialog: state.closeEditDialog,
    setActiveCell: state.setActiveCell,
  }));

  const activeRow = useMemo(() => {
    if (!activeCell) {
      return null;
    }
    return rows.find((row) => row.faculty.id === activeCell.facultyId) ?? null;
  }, [activeCell, rows]);

  const activeCellData = useMemo(() => {
    if (!activeCell || !activeRow) {
      return null;
    }
    return activeRow.cells.find((cell) => cell.timeslotId === activeCell.timeslotId) ?? null;
  }, [activeCell, activeRow]);

  const [formState, setFormState] = useState<ReassignFormState>({
    sectionId: null,
    facultyId: null,
    timeslotId: null,
  });

  useEffect(() => {
    if (!isEditDialogOpen || !activeCellData) {
      setFormState({ sectionId: null, facultyId: null, timeslotId: null });
      return;
    }

    const firstAssignment = activeCellData.assignments[0];
    setFormState({
      sectionId: firstAssignment?.sectionId ?? null,
      facultyId: activeCellData.facultyId,
      timeslotId: activeCellData.timeslotId,
    });
  }, [isEditDialogOpen, activeCellData]);

  const assignmentOptions = useMemo(() => activeCellData?.assignments ?? [], [activeCellData]);

  const activeConflicts = useMemo(() => {
    if (!activeCellData) {
      return [];
    }
    return activeCellData.conflictIds
      .map((id) => conflictIndex[id])
      .filter((conflict): conflict is NonNullable<typeof conflict> => Boolean(conflict));
  }, [activeCellData, conflictIndex]);

  if (!isEditDialogOpen || !activeCell || !activeCellData) {
    return null;
  }

  const handleClose = () => {
    closeEditDialog();
  };

  const handleAssignmentChange = (sectionId: string) => {
    setFormState((previous) => ({
      ...previous,
      sectionId,
    }));
  };

  const handleFacultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value || null;
    setFormState((previous) => ({
      ...previous,
      facultyId: value,
    }));
  };

  const handleTimeslotChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value || null;
    setFormState((previous) => ({
      ...previous,
      timeslotId: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { sectionId, facultyId, timeslotId } = formState;

    if (!sectionId || !facultyId || !timeslotId) {
      pushToast({ message: 'Select an assignment, faculty, and timeslot before saving.', variant: 'error' });
      return;
    }

    const originalAssignment = assignmentOptions.find((assignment) => assignment.sectionId === sectionId);
    if (!originalAssignment) {
      pushToast({ message: 'Assignment not found for editing. Please refresh and try again.', variant: 'error' });
      return;
    }

    const entryIndex = schedule.findIndex(
      (entry) =>
        entry.sectionId === sectionId &&
        entry.facultyId === activeCellData.facultyId &&
        entry.timeslotId === activeCellData.timeslotId,
    );

    if (entryIndex === -1) {
      pushToast({ message: 'Could not locate the schedule entry to update.', variant: 'error' });
      return;
    }

    const updatedSchedule = [...schedule];
    const existingEntry = updatedSchedule[entryIndex];

    updatedSchedule[entryIndex] = {
      ...existingEntry,
      facultyId,
      timeslotId,
    };

    updateSchedule(updatedSchedule);
    setActiveCell({ facultyId, timeslotId });
    pushToast({ message: 'Assignment updated.', variant: 'success' });
    closeEditDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit assignments</h2>
            <p className="text-sm text-slate-400">
              Adjust the selected section by moving it to another faculty or time. Changes update conflicts instantly.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
            onClick={handleClose}
          >
            Close
          </button>
        </header>

        <section className="mt-4 space-y-3 text-sm text-slate-200">
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Currently editing</p>
            <p className="text-sm font-medium text-white">
              Faculty: {activeRow?.faculty.name ?? 'Unknown'} · Timeslot: {timeslots.find((slot) => slot.id === activeCellData.timeslotId)?.label ?? activeCellData.timeslotId}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset className="space-y-2">
              <legend className="text-xs uppercase tracking-wide text-slate-400">Select assignment</legend>
              {assignmentOptions.length === 0 && <p className="text-slate-400">No assignments scheduled here yet.</p>}
              {assignmentOptions.map((assignment) => (
                <label
                  key={assignment.sectionId}
                  className={clsx(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition',
                    formState.sectionId === assignment.sectionId
                      ? 'border-brand-400 bg-brand-500/10 text-brand-50'
                      : 'border-white/10 bg-slate-950/60 hover:border-brand-400/60',
                  )}
                >
                  <input
                    type="radio"
                    name="assignment"
                    value={assignment.sectionId}
                    checked={formState.sectionId === assignment.sectionId}
                    onChange={() => handleAssignmentChange(assignment.sectionId)}
                    className="sr-only"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-white">{assignment.subjectCode ?? assignment.subjectName}</span>
                    <span className="text-xs text-slate-300">Section {assignment.sectionId}</span>
                  </div>
                  {assignment.locked && (
                    <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                      Locked
                    </span>
                  )}
                </label>
              ))}
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-slate-400">Reassign to faculty</span>
                <select
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-brand-400 focus:outline-none"
                  value={formState.facultyId ?? ''}
                  onChange={handleFacultyChange}
                >
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-slate-400">New timeslot</span>
                <select
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-brand-400 focus:outline-none"
                  value={formState.timeslotId ?? ''}
                  onChange={handleTimeslotChange}
                >
                  {timeslots.map((timeslot) => (
                    <option key={timeslot.id} value={timeslot.id}>
                      {timeslot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeConflicts.length > 0 && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                <p className="font-semibold uppercase tracking-wide">Conflicts currently affecting this cell</p>
                <ul className="mt-2 space-y-1">
                  {activeConflicts.map((conflict) => (
                    <li key={conflict.id}>
                      <span className="font-semibold">{conflict.title}:</span> {conflict.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
                disabled={assignmentOptions.length === 0}
              >
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
