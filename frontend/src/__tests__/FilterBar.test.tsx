import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FilterBar } from '../components/schedule/FilterBar';
import { ToastContainer } from '../components/shared/ToastContainer';
import * as optimizerModule from '../engine/optimizer';
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

describe('FilterBar optimiser trigger', () => {
  beforeEach(() => {
    act(() => {
      useSchedulerStore.getState().hydrate(buildPopulatedState());
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useSchedulerStore.getState().hydrate(buildEmptyState());
    });
  });

  it('runs the optimiser and updates the schedule with success feedback', async () => {
    const user = userEvent.setup();
    render(
      <>
        <FilterBar />
        <ToastContainer />
      </>,
    );

    expect(screen.getByText(/No conflicts/i)).toBeInTheDocument();

    const runButton = screen.getByRole('button', { name: /Run optimiser/i });
    await user.click(runButton);

    await screen.findByText(/Optimiser assigned 2 sections./i);

    const updatedSchedule = useSchedulerStore.getState().schedule;
    expect(updatedSchedule).toHaveLength(2);
    expect(
      updatedSchedule.some(
        (entry) => entry.sectionId === 'sec2' && entry.facultyId === 'f2' && entry.timeslotId === 't2',
      ),
    ).toBe(true);
  });

  it('shows an error toast if the optimiser fails and keeps existing schedule', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const optimizerSpy = vi
      .spyOn(optimizerModule, 'runOptimizer')
      .mockImplementation(() => {
        throw new Error('Optimiser failed');
      });

    const user = userEvent.setup();
    render(
      <>
        <FilterBar />
        <ToastContainer />
      </>,
    );

    const originalSchedule = useSchedulerStore.getState().schedule;
    const runButton = screen.getByRole('button', { name: /Run optimiser/i });
    await user.click(runButton);

    expect(optimizerSpy).toHaveBeenCalledTimes(1);
    await screen.findByText(/Failed to run optimiser/i);

    const currentSchedule = useSchedulerStore.getState().schedule;
    expect(currentSchedule).toEqual(originalSchedule);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
