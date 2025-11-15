import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConflictPanel } from '../components/schedule/ConflictPanel';
import { EditDialog } from '../components/schedule/EditDialog/EditDialog';
import { ScheduleGrid } from '../components/schedule/ScheduleGrid/ScheduleGrid';
import { useSchedulerStore } from '../store/schedulerStore';
import { useScheduleUiStore } from '../store/scheduleUiStore';
import type { UnifiedState } from '../types';

const buildEmptyState = (): UnifiedState => ({
  config: {
    faculty: [],
    subjects: [],
    sections: [],
    timeslots: [],
    rooms: [],
    buildings: [],
  },
  preferences: {
    facultySubject: {},
    facultyTimeslot: {},
    facultyBuilding: {},
    mobility: {},
  },
  schedule: [],
  snapshots: [],
  settings: {
    weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
    theme: 'dark',
    optimizerSeed: 42,
  },
});

const buildPopulatedState = (): UnifiedState => ({
  config: {
    faculty: [
      { id: 'f1', name: 'Dr. Ada Lovelace', initial: 'AL', maxSections: 3, maxOverload: 1, canOverload: true },
      { id: 'f2', name: 'Dr. Grace Hopper', initial: 'GH', maxSections: 2, maxOverload: 0, canOverload: false },
    ],
    subjects: [
      { id: 's1', name: 'Algorithms', code: 'CS101' },
      { id: 's2', name: 'Systems', code: 'CS210' },
    ],
    sections: [
      { id: 'sec1', subjectId: 's1', timeslotId: 't1', roomId: 'r1', capacity: 30 },
      { id: 'sec2', subjectId: 's2', timeslotId: 't2', roomId: 'r1', capacity: 25 },
    ],
    timeslots: [
      { id: 't1', label: 'Mon 09:00', day: 'Monday', start: '09:00', end: '10:00' },
      { id: 't2', label: 'Tue 11:00', day: 'Tuesday', start: '11:00', end: '12:00' },
    ],
    rooms: [{ id: 'r1', label: 'Room 100', buildingId: 'b1', capacity: 45 }],
    buildings: [{ id: 'b1', label: 'Engineering' }],
  },
  preferences: {
    facultySubject: {},
    facultyTimeslot: {
      f1: { t1: 2, t2: -1 },
      f2: { t1: -2, t2: 3 },
    },
    facultyBuilding: {},
    mobility: {},
  },
  schedule: [
    {
      sectionId: 'sec1',
      facultyId: 'f1',
      timeslotId: 't1',
      roomId: 'r1',
      locked: true,
      scoreBreakdown: {
        preference: 1.5,
        mobility: -0.2,
        seniority: 0.5,
        total: 1.8,
      },
    },
  ],
  snapshots: [],
  settings: {
    weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
    theme: 'dark',
    optimizerSeed: 42,
  },
});

describe('ScheduleGrid interactions', () => {
  beforeEach(() => {
    act(() => {
      useSchedulerStore.getState().hydrate(buildPopulatedState());
      useScheduleUiStore.getState().setActiveCell(null);
      useScheduleUiStore.getState().closeEditDialog();
    });
  });

  afterEach(() => {
    act(() => {
      useSchedulerStore.getState().hydrate(buildEmptyState());
      useScheduleUiStore.getState().setActiveCell(null);
      useScheduleUiStore.getState().closeEditDialog();
    });
  });

  it('selects a cell on click and renders assignment details', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
      </>,
    );

    const assignmentCell = screen.getByRole('button', { name: /Dr\. Ada Lovelace at Mon 09:00/i });
    await user.click(assignmentCell);

    expect(screen.getByText('Dr. Ada Lovelace · Mon 09:00')).toBeInTheDocument();
  expect(screen.getByText(/Algorithms/)).toBeInTheDocument();
  expect(screen.getByText(/Section sec1/i)).toBeInTheDocument();
    expect(screen.getByText(/Locked/i)).toBeInTheDocument();
  });

  it('navigates between cells with arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
      </>,
    );

    const firstCell = screen.getByRole('button', { name: /Ada Lovelace at Mon 09:00/i });
    await user.click(firstCell);
    await user.keyboard('{ArrowRight}');

    const rightCell = screen.getByRole('button', { name: /Ada Lovelace at Tue 11:00/i });
    expect(rightCell).toHaveFocus();
    expect(screen.getByText(/No assignments scheduled in this slot yet/i)).toBeInTheDocument();
  });

  it('highlights double-booked conflicts and surfaces details', async () => {
    const conflictState = buildPopulatedState();
    conflictState.schedule = [
      ...conflictState.schedule,
      {
        sectionId: 'sec2',
        facultyId: 'f1',
        timeslotId: 't1',
        roomId: 'r1',
        locked: false,
      },
    ];

    act(() => {
      useSchedulerStore.getState().hydrate(conflictState);
    });

    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
      </>,
    );

    expect(screen.getByText(/Critical conflict/)).toBeInTheDocument();

    const conflictedCell = screen.getByRole('button', { name: /Ada Lovelace at Mon 09:00/i });
    await user.click(conflictedCell);

    expect(screen.getByText(/Faculty double-booked/i)).toBeInTheDocument();
  });

  it('lets users jump to a conflicted cell from the conflict panel', async () => {
    const conflictState = buildPopulatedState();
    conflictState.schedule = [
      ...conflictState.schedule,
      {
        sectionId: 'sec2',
        facultyId: 'f1',
        timeslotId: 't1',
        roomId: 'r1',
        locked: false,
      },
    ];

    act(() => {
      useSchedulerStore.getState().hydrate(conflictState);
      useScheduleUiStore.getState().setActiveCell(null);
    });

    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
        <ConflictPanel />
      </>,
    );

  const jumpButtons = await screen.findAllByRole('button', { name: /view in grid/i });
  await user.click(jumpButtons[0]);

    expect(screen.getByText('Dr. Ada Lovelace · Mon 09:00')).toBeInTheDocument();
    expect(screen.getAllByText(/Faculty double-booked/i).length).toBeGreaterThan(0);
  });

  it('opens and closes edit dialog from the detail panel', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
      </>,
    );

    const assignmentCell = screen.getByRole('button', { name: /Ada Lovelace at Mon 09:00/i });
    await user.click(assignmentCell);

    const editTrigger = screen.getByRole('button', { name: /Edit assignments/i });
    await user.click(editTrigger);

    expect(await screen.findByRole('heading', { name: /Edit assignments/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByRole('heading', { name: /Edit assignments/i })).not.toBeInTheDocument();
  });

  it('reassigns an assignment to a different faculty and timeslot', async () => {
    const conflictState = buildPopulatedState();
    conflictState.schedule = [
      ...conflictState.schedule,
      {
        sectionId: 'sec2',
        facultyId: 'f2',
        timeslotId: 't2',
        roomId: 'r1',
        locked: false,
      },
    ];

    act(() => {
      useSchedulerStore.getState().hydrate(conflictState);
      useScheduleUiStore.getState().setActiveCell(null);
      useScheduleUiStore.getState().closeEditDialog();
    });

    const user = userEvent.setup();
    render(
      <>
        <ScheduleGrid />
        <EditDialog />
      </>,
    );

    const assignmentCell = screen.getByRole('button', { name: /Ada Lovelace at Mon 09:00/i });
    await user.click(assignmentCell);

    await user.click(screen.getByRole('button', { name: /Edit assignments/i }));

    await user.selectOptions(screen.getByLabelText(/Reassign to faculty/i), 'f2');
    await user.selectOptions(screen.getByLabelText(/New timeslot/i), 't2');
    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    const scheduleState = useSchedulerStore.getState().schedule;
    expect(
      scheduleState.some(
        (entry) => entry.sectionId === 'sec1' && entry.facultyId === 'f2' && entry.timeslotId === 't2',
      ),
    ).toBe(true);

    const updatedCell = screen.getByRole('button', { name: /Grace Hopper at Tue 11:00/i });
    expect(updatedCell).toHaveAttribute('aria-pressed', 'true');
  });
});
