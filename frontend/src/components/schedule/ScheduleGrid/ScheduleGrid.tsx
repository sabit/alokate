import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Conflict, ConflictSeverity } from '../../../engine/conflictChecker';
import { useScheduleGrid } from '../../../hooks/useScheduleGrid';
import { useSchedulerStore } from '../../../store/schedulerStore';
import { useScheduleUiStore } from '../../../store/scheduleUiStore';
import type { PreferenceLevel } from '../../../types';
import { ContextMenu } from '../../shared/ContextMenu';
import { MenuItem } from '../../shared/MenuItem';
import { TimeslotHeader } from './SortableTimeslotHeader';

const preferenceBadgeClass: Record<PreferenceLevel, string> = {
  '-3': 'bg-rose-900/60 text-rose-200 border-rose-500/40',
  '-2': 'bg-rose-900/40 text-rose-200 border-rose-500/30',
  '-1': 'bg-amber-900/30 text-amber-200 border-amber-500/30',
  0: 'bg-slate-900/40 text-slate-300 border-white/10',
  1: 'bg-emerald-900/30 text-emerald-200 border-emerald-500/30',
  2: 'bg-emerald-800/40 text-emerald-100 border-emerald-400/40',
  3: 'bg-emerald-700/60 text-emerald-50 border-emerald-300/50',
};

const formatPreference = (value: PreferenceLevel) => (value > 0 ? `+${value}` : value.toString());

const conflictBorderClass: Record<ConflictSeverity, string> = {
  info: 'border-sky-400/60',
  warning: 'border-amber-400/60',
  critical: 'border-rose-500/70',
};

const conflictTextClass: Record<ConflictSeverity, string> = {
  info: 'text-sky-200',
  warning: 'text-amber-200',
  critical: 'text-rose-200',
};

const conflictPillClass: Record<ConflictSeverity, string> = {
  info: 'border border-sky-400/40 bg-sky-500/20 text-sky-100',
  warning: 'border border-amber-400/40 bg-amber-500/20 text-amber-100',
  critical: 'border border-rose-400/50 bg-rose-500/20 text-rose-100',
};

const conflictDisplayLabel: Record<ConflictSeverity, string> = {
  info: 'Notice',
  warning: 'Conflict',
  critical: 'Critical conflict',
};

const conflictPillLabel: Record<ConflictSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  facultyId: string | null;
  timeslotId: string | null;
}

export const ScheduleGrid = () => {
  const dayFilter = useScheduleUiStore((state) => state.dayFilter);
  const initializeDayFilter = useScheduleUiStore((state) => state.initializeDayFilter);
  
  const { rows, timeslots, summary, unscheduledSections, orphanAssignments, conflictIndex } = useScheduleGrid({
    dayFilter: dayFilter.selectedDays.size > 0 ? dayFilter.selectedDays : undefined,
  });

  const schedule = useSchedulerStore((state) => state.schedule);
  const updateSchedule = useSchedulerStore((state) => state.updateSchedule);
  const config = useSchedulerStore((state) => state.config);

  const activeCell = useScheduleUiStore((state) => state.activeCell);
  const setActiveCell = useScheduleUiStore((state) => state.setActiveCell);
  const openEditDialog = useScheduleUiStore((state) => state.openEditDialog);
  const [hoveredCell, setHoveredCell] = useState<{ facultyId: string; timeslotId: string } | null>(null);
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    facultyId: null,
    timeslotId: null,
  });

  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFocusedCellKey = useRef<string | null>(null);

  const rowMap = useMemo(() => new Map(rows.map((row) => [row.faculty.id, row])), [rows]);
  const timeslotMap = useMemo(() => new Map(timeslots.map((slot) => [slot.id, slot])), [timeslots]);

  const registerCellRef = useCallback((key: string, node: HTMLButtonElement | null) => {
    if (node) {
      cellRefs.current[key] = node;
    } else {
      delete cellRefs.current[key];
    }
  }, []);

  const openContextMenu = useCallback((facultyId: string, timeslotId: string, x: number, y: number) => {
    setContextMenuState({
      isOpen: true,
      position: { x, y },
      facultyId,
      timeslotId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuState({
      isOpen: false,
      position: { x: 0, y: 0 },
      facultyId: null,
      timeslotId: null,
    });
  }, []);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, facultyId: string, timeslotId: string) => {
      event.preventDefault(); // Prevent default browser context menu
      openContextMenu(facultyId, timeslotId, event.clientX, event.clientY);
    },
    [openContextMenu],
  );

  const handleClearAssignment = useCallback(() => {
    if (!contextMenuState.facultyId || !contextMenuState.timeslotId) {
      return;
    }

    // Filter schedule entries to remove all entries matching the cell's facultyId and timeslotId
    const updatedSchedule = schedule.filter(
      (entry) => !(entry.facultyId === contextMenuState.facultyId && entry.timeslotId === contextMenuState.timeslotId),
    );

    updateSchedule(updatedSchedule);
    closeContextMenu();
  }, [contextMenuState.facultyId, contextMenuState.timeslotId, schedule, updateSchedule, closeContextMenu]);

  const hasData = rows.length > 0 && timeslots.length > 0;
  const hasFiltersApplied = dayFilter.selectedDays.size > 0;
  const allTimeslotsCount = config.timeslots.length;

  const conflictSummaryText = summary.conflicts === 0 ? 'No conflicts flagged' : `${summary.conflicts} conflict${summary.conflicts === 1 ? '' : 's'} flagged`;

  const focusCell = useCallback(
    (rowIndex: number, columnIndex: number) => {
      const row = rows[rowIndex];
      const cell = row?.cells[columnIndex];
      if (!cell) {
        return;
      }
      const key = `${cell.facultyId}-${cell.timeslotId}`;
      const element = cellRefs.current[key];
      if (element) {
        element.focus();
      }
      setActiveCell({ facultyId: cell.facultyId, timeslotId: cell.timeslotId });
    },
    [rows, setActiveCell],
  );

  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, rowIndex: number, columnIndex: number) => {
      const rowCount = rows.length;
      const columnCount = timeslots.length;
      let nextRow = rowIndex;
      let nextColumn = columnIndex;

      // Handle context menu keyboard shortcuts (Shift+F10 or ContextMenu key)
      if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
        event.preventDefault();
        const row = rows[rowIndex];
        const cell = row?.cells[columnIndex];
        if (cell) {
          // Calculate position relative to the focused cell
          const key = `${cell.facultyId}-${cell.timeslotId}`;
          const element = cellRefs.current[key];
          if (element) {
            const rect = element.getBoundingClientRect();
            // Position menu at the center of the cell
            openContextMenu(cell.facultyId, cell.timeslotId, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          nextRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          nextRow = Math.min(rowCount - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          nextColumn = Math.max(0, columnIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextColumn = Math.min(columnCount - 1, columnIndex + 1);
          break;
        case 'Enter':
        case ' ': {
          event.preventDefault();
          const row = rows[rowIndex];
          const cell = row?.cells[columnIndex];
          if (cell) {
            setActiveCell({ facultyId: cell.facultyId, timeslotId: cell.timeslotId });
            openEditDialog({ facultyId: cell.facultyId, timeslotId: cell.timeslotId });
          }
          return;
        }
        default:
          return;
      }

      if (nextRow !== rowIndex || nextColumn !== columnIndex) {
        focusCell(nextRow, nextColumn);
      }
    },
    [focusCell, rows, timeslots, setActiveCell, openEditDialog, openContextMenu, cellRefs],
  );

  const activeCellDetail = useMemo(() => {
    if (!activeCell) {
      return null;
    }
    const row = rowMap.get(activeCell.facultyId);
    const cell = row?.cells.find((candidate) => candidate.timeslotId === activeCell.timeslotId);
    const timeslot = timeslotMap.get(activeCell.timeslotId);

    if (!row || !cell || !timeslot) {
      return null;
    }

    return {
      row,
      cell,
      timeslot,
    };
  }, [activeCell, rowMap, timeslotMap]);

  const activeConflicts = useMemo(
    () =>
      activeCellDetail
        ? activeCellDetail.cell.conflictIds
            .map((id) => conflictIndex[id])
            .filter((conflict): conflict is Conflict => Boolean(conflict))
        : [],
    [activeCellDetail, conflictIndex],
  );

  const contextMenuCellAssignments = useMemo(() => {
    if (!contextMenuState.facultyId || !contextMenuState.timeslotId) {
      return [];
    }
    return schedule.filter(
      (entry) => entry.facultyId === contextMenuState.facultyId && entry.timeslotId === contextMenuState.timeslotId,
    );
  }, [contextMenuState.facultyId, contextMenuState.timeslotId, schedule]);

  const clearAssignmentLabel = useMemo(() => {
    const count = contextMenuCellAssignments.length;
    if (count === 0) {
      return 'Clear Assignment';
    }
    if (count === 1) {
      return 'Clear Assignment';
    }
    return `Clear Assignments (${count})`;
  }, [contextMenuCellAssignments.length]);

  useEffect(() => {
    if (!activeCell) {
      lastFocusedCellKey.current = null;
      return;
    }
    const key = `${activeCell.facultyId}-${activeCell.timeslotId}`;
    if (lastFocusedCellKey.current === key) {
      return;
    }
    const element = cellRefs.current[key];
    if (element) {
      lastFocusedCellKey.current = key;
      element.focus();
    }
  }, [activeCell]);

  // Close context menu when activeCell changes
  useEffect(() => {
    if (contextMenuState.isOpen) {
      closeContextMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCell]);

  // Initialize day filter with available days from config
  useEffect(() => {
    const availableDays = Array.from(new Set(config.timeslots.map((slot) => slot.day)));
    if (availableDays.length > 0) {
      initializeDayFilter(availableDays);
    }
  }, [config.timeslots, initializeDayFilter]);

  return (
    <section className="space-y-4 rounded-xl border border-white/5 bg-slate-950/60 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Schedule overview</h3>
          <p className="text-sm text-slate-400">
            {summary.scheduledSections} of {summary.totalSections} sections scheduled · {summary.totalAssignments} assignments tracked · {conflictSummaryText}
          </p>
        </div>
      </header>

      {!hasData && (
        <div className="grid h-[360px] place-items-center rounded-lg border border-dashed border-white/10 bg-slate-950/50">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">
              {hasFiltersApplied && allTimeslotsCount > 0
                ? 'No timeslots match the selected filters'
                : 'No schedule data available'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasFiltersApplied && allTimeslotsCount > 0
                ? 'Try selecting different days or clearing the filters'
                : rows.length === 0 && timeslots.length === 0
                  ? 'Add faculty and timeslots to get started'
                  : rows.length === 0
                    ? 'Add faculty members to populate the schedule'
                    : 'Add timeslots to populate the schedule'}
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <div className="overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 bg-slate-950 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Faculty
                  </th>
                  {timeslots.map((timeslot) => (
                    <TimeslotHeader key={timeslot.id} timeslot={timeslot} />
                  ))}
                </tr>
              </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.faculty.id} className="border-t border-white/5">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-slate-950 px-3 py-3 text-left text-sm font-semibold text-slate-100"
                  >
                    <div>{row.faculty.name}</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      {row.totalAssignments} assigned · Max {row.faculty.maxSections}
                      {row.faculty.canOverload ? ` (+${row.faculty.maxOverload} overload)` : ''}
                    </div>
                  </th>
                  {row.cells.map((cell, columnIndex) => {
                    const hasAssignments = cell.assignments.length > 0;
                    const key = `${cell.facultyId}-${cell.timeslotId}`;
                    const isActive = activeCell?.facultyId === cell.facultyId && activeCell.timeslotId === cell.timeslotId;
                    const isHovered = hoveredCell?.facultyId === cell.facultyId && hoveredCell.timeslotId === cell.timeslotId;
                    const timeslotLabel = timeslotMap.get(cell.timeslotId)?.label ?? 'timeslot';
                    const conflictDescription =
                      cell.conflictIds.length > 0 && cell.conflictSeverity
                        ? `, ${cell.conflictIds.length} conflict${cell.conflictIds.length === 1 ? '' : 's'} (${cell.conflictSeverity})`
                        : '';
                    const accessibleLabel = `${row.faculty.name} at ${timeslotLabel}, preference ${formatPreference(cell.preference)}${conflictDescription}`;
                    return (
                      <td key={key} className="px-2 py-2 align-top">
                        <button
                          type="button"
                          ref={(node) => registerCellRef(key, node)}
                          className={clsx(
                            'relative flex h-full w-full min-h-[96px] flex-col gap-2 rounded-md border px-2 py-2 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400',
                            preferenceBadgeClass[cell.preference],
                            cell.conflictSeverity && conflictBorderClass[cell.conflictSeverity],
                            {
                              'ring-2 ring-brand-400': isActive,
                              'border-white/30': isHovered && !isActive,
                              'ring-1 ring-rose-400/40': cell.isUnfavourable && hasAssignments,
                              'opacity-70': !hasAssignments,
                            },
                          )}
                          onMouseEnter={() => setHoveredCell({ facultyId: cell.facultyId, timeslotId: cell.timeslotId })}
                          onMouseLeave={() => setHoveredCell((current) => (current?.facultyId === cell.facultyId && current.timeslotId === cell.timeslotId ? null : current))}
                          onFocus={() => setActiveCell({ facultyId: cell.facultyId, timeslotId: cell.timeslotId })}
                          onClick={() => setActiveCell({ facultyId: cell.facultyId, timeslotId: cell.timeslotId })}
                          onContextMenu={(event) => handleContextMenu(event, cell.facultyId, cell.timeslotId)}
                          onKeyDown={(event) => handleKeyNavigation(event, rowIndex, columnIndex)}
                          aria-pressed={isActive}
                          aria-label={accessibleLabel}
                          title={accessibleLabel}
                        >
                          <div className="flex flex-wrap gap-1 text-xs font-medium">
                            {hasAssignments
                              ? cell.assignments.map((assignment) => (
                                  <span
                                    key={assignment.sectionId}
                                    className="inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-slate-100"
                                  >
                                    <span>{assignment.subjectCode ?? assignment.subjectName}</span>
                                    {assignment.roomLabel && <span className="text-[10px] text-slate-400">· {assignment.roomLabel}</span>}
                                  </span>
                                ))
                              : (
                                  <span className="text-xs text-slate-400">No assignment</span>
                                )}
                          </div>
                          <div className="mt-auto space-y-1 text-[11px]">
                            {cell.conflictIds.length > 0 && cell.conflictSeverity && (
                              <div
                                className={clsx(
                                  'inline-flex items-center gap-1 font-semibold uppercase tracking-wide',
                                  conflictTextClass[cell.conflictSeverity],
                                )}
                              >
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                <span>
                                  {conflictDisplayLabel[cell.conflictSeverity]}
                                  {cell.conflictIds.length > 1 ? ` (${cell.conflictIds.length})` : ''}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-slate-300">
                              <span>Preference {formatPreference(cell.preference)}</span>
                              {hasAssignments && cell.assignments.length > 1 && (
                                <span className="rounded bg-black/20 px-1 text-[10px] text-slate-200">
                                  {cell.assignments.length} items
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeCellDetail && (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <p className="text-sm font-semibold text-white">
                {activeCellDetail.row.faculty.name} · {activeCellDetail.timeslot.label}
              </p>
              <p className="text-xs text-slate-400">
                Preference {formatPreference(activeCellDetail.cell.preference)}{' '}
                {activeCellDetail.cell.isUnfavourable && '(needs attention)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-500/10 px-2 py-1 text-xs text-brand-200">
                {activeCellDetail.cell.assignments.length} assignment{activeCellDetail.cell.assignments.length === 1 ? '' : 's'}
              </span>
              {activeCellDetail.cell.assignments.length > 0 && (
                <button
                  type="button"
                  className="rounded-md border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-100 transition hover:bg-brand-500/20"
                  onClick={() => openEditDialog({ facultyId: activeCellDetail.cell.facultyId, timeslotId: activeCellDetail.cell.timeslotId })}
                >
                  Edit assignments
                </button>
              )}
            </div>
          </header>

          {activeCellDetail.cell.assignments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No assignments scheduled in this slot yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {activeCellDetail.cell.assignments.map((assignment) => (
                <li key={assignment.sectionId} className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {assignment.subjectCode ? `${assignment.subjectCode} · ` : ''}
                        {assignment.subjectName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Section {assignment.sectionId}
                        {assignment.roomLabel ? ` · Room ${assignment.roomLabel}` : ''}
                        {assignment.buildingLabel ? ` (${assignment.buildingLabel})` : ''}
                      </p>
                    </div>
                    {assignment.locked && (
                      <span className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                        Locked
                      </span>
                    )}
                  </div>
                  {assignment.score && (
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div>
                        <dt className="uppercase tracking-wide">Preference</dt>
                        <dd className="font-medium text-slate-200">{assignment.score.preference.toFixed(1)}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide">Mobility</dt>
                        <dd className="font-medium text-slate-200">{assignment.score.mobility.toFixed(1)}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide">Total</dt>
                        <dd className="font-medium text-slate-200">{assignment.score.total.toFixed(1)}</dd>
                      </div>
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          )}

          {activeConflicts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-200">Conflicts</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {activeConflicts.map((conflict) => (
                  <li key={conflict.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{conflict.title}</p>
                        <p className="text-xs text-slate-300">{conflict.description}</p>
                      </div>
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          conflictPillClass[conflict.severity],
                        )}
                      >
                        {conflictPillLabel[conflict.severity]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Tip: Use the arrow keys to move between cells. Press Enter to prepare editing in the upcoming swap dialog. Conflicted
            cells show amber or rose indicators.
          </p>
        </div>
      )}

      {(unscheduledSections.length > 0 || orphanAssignments.length > 0) && (
        <div className="space-y-3">
          {unscheduledSections.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-sm font-semibold text-amber-200">Unscheduled sections</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-100">
                {unscheduledSections.map((section) => (
                  <li key={section.sectionId}>
                    {section.subjectCode ? `${section.subjectCode} · ` : ''}
                    {section.subjectName}
                    {section.timeslotLabel ? ` — ${section.timeslotLabel}` : ''}
                    {section.roomLabel ? ` (${section.roomLabel})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {orphanAssignments.length > 0 && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <p className="text-sm font-semibold text-rose-200">Assignments needing attention</p>
              <ul className="mt-2 space-y-1 text-xs text-rose-100">
                {orphanAssignments.map((orphan, index) => (
                  <li key={`${orphan.entry.sectionId}-${index}`}>
                    Section {orphan.entry.sectionId} missing {orphan.reason.replace('missing-', '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ContextMenu isOpen={contextMenuState.isOpen} position={contextMenuState.position} onClose={closeContextMenu}>
        <MenuItem
          label={clearAssignmentLabel}
          disabled={contextMenuCellAssignments.length === 0}
          onClick={handleClearAssignment}
        />
      </ContextMenu>
    </section>
  );
};
