import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ScheduleGrid } from '../components/schedule/ScheduleGrid/ScheduleGrid';
import { useSchedulerStore } from '../store/schedulerStore';
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
      { id: 'f1', name: 'Dr. Ada Lovelace', maxSections: 3, maxOverload: 1, canOverload: true },
      { id: 'f2', name: 'Dr. Grace Hopper', maxSections: 2, maxOverload: 0, canOverload: false },
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
    });
  });

  afterEach(() => {
    act(() => {
      useSchedulerStore.getState().hydrate(buildEmptyState());
    });
  });

  it('selects a cell on click and renders assignment details', async () => {
    const user = userEvent.setup();
    render(<ScheduleGrid />);

    const assignmentCell = screen.getByRole('button', { name: /Dr\. Ada Lovelace at Mon 09:00/i });
    await user.click(assignmentCell);

    expect(screen.getByText('Dr. Ada Lovelace · Mon 09:00')).toBeInTheDocument();
  expect(screen.getByText(/Algorithms/)).toBeInTheDocument();
  expect(screen.getByText(/Section sec1/i)).toBeInTheDocument();
    expect(screen.getByText(/Locked/i)).toBeInTheDocument();
  });

  it('navigates between cells with arrow keys', async () => {
    const user = userEvent.setup();
    render(<ScheduleGrid />);

    const firstCell = screen.getByRole('button', { name: /Ada Lovelace at Mon 09:00/i });
    await user.click(firstCell);
    await user.keyboard('{ArrowRight}');

    const rightCell = screen.getByRole('button', { name: /Ada Lovelace at Tue 11:00/i });
    expect(rightCell).toHaveFocus();
    expect(screen.getByText(/No assignments scheduled in this slot yet/i)).toBeInTheDocument();
  });
});
