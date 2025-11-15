import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PreferenceMatrix } from '../components/preferences/PreferenceMatrix';
import { useSchedulerStore } from '../store/schedulerStore';
import type { UnifiedState } from '../types';

const persistSchedulerStateMock = vi.fn().mockResolvedValue(true);
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('../hooks/useSchedulerPersistence', () => ({
  useSchedulerPersistence: () => persistSchedulerStateMock,
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => toastMock,
}));

const buildEmptyUnifiedState = (): UnifiedState => ({
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

const buildTestUnifiedState = (): UnifiedState => ({
  config: {
    faculty: [
  { id: 'f1', name: 'Dr. Ada Lovelace', initial: 'AL', maxSections: 3, maxOverload: 1, canOverload: true },
    ],
    subjects: [
      { id: 's1', name: 'Algorithms', code: 'CS101' },
    ],
    sections: [],
    timeslots: [],
    rooms: [],
    buildings: [],
  },
  preferences: {
    facultySubject: {
      f1: {
        s1: 0,
      },
    },
    facultyTimeslot: {},
    facultyBuilding: {},
    mobility: {
      f1: 0,
    },
  },
  schedule: [],
  snapshots: [],
  settings: {
    weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
    theme: 'dark',
    optimizerSeed: 42,
  },
});

describe('PreferenceMatrix interactions', () => {
  beforeEach(() => {
    persistSchedulerStateMock.mockClear();
    Object.values(toastMock).forEach((fn) => fn.mockClear());

    act(() => {
      useSchedulerStore.getState().hydrate(buildTestUnifiedState());
    });
  });

  afterEach(() => {
    act(() => {
      useSchedulerStore.getState().hydrate(buildEmptyUnifiedState());
    });
  });

  it('increments preferences with left click without wrapping', async () => {
    const user = userEvent.setup();

    render(<PreferenceMatrix />);

    const cellButton = screen.getByRole('button', { name: '0' });

    await user.click(cellButton);
    expect(cellButton).toHaveTextContent('\u002B1');

    await user.click(cellButton);
    expect(cellButton).toHaveTextContent('\u002B2');

    await user.click(cellButton);
    expect(cellButton).toHaveTextContent('\u002B3');

    await user.click(cellButton);
    expect(cellButton).toHaveTextContent('\u002B3');

    expect(useSchedulerStore.getState().preferences.facultySubject.f1.s1).toBe(3);
  });

  it('decrements preferences with right click without wrapping', () => {
    render(<PreferenceMatrix />);

    const cellButton = screen.getByRole('button', { name: '0' });

    fireEvent.contextMenu(cellButton);
    expect(cellButton).toHaveTextContent('-1');

    fireEvent.contextMenu(cellButton);
    expect(cellButton).toHaveTextContent('-2');

    fireEvent.contextMenu(cellButton);
    expect(cellButton).toHaveTextContent('-3');

    fireEvent.contextMenu(cellButton);
    expect(cellButton).toHaveTextContent('-3');

    expect(useSchedulerStore.getState().preferences.facultySubject.f1.s1).toBe(-3);
  });

  it('supports arrow key adjustments for accessibility', () => {
    render(<PreferenceMatrix />);

    const cellButton = screen.getByRole('button', { name: '0' });

    cellButton.focus();
    fireEvent.keyDown(cellButton, { key: 'ArrowUp' });
    expect(cellButton).toHaveTextContent('+1');

    fireEvent.keyDown(cellButton, { key: 'ArrowLeft' });
    expect(cellButton).toHaveTextContent('0');

    fireEvent.keyDown(cellButton, { key: 'ArrowDown' });
    expect(cellButton).toHaveTextContent('-1');
  });

  it('asks for confirmation before filling neutral and aborts when declined', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    render(<PreferenceMatrix />);

    const cellButton = screen.getByRole('button', { name: '0' });
    await user.click(cellButton);
    expect(cellButton).toHaveTextContent('+1');

    const fillNeutralButton = screen.getByRole('button', { name: 'Fill neutral' });
    await user.click(fillNeutralButton);

    expect(confirmSpy).toHaveBeenCalledWith('Reset all preferences in this view to neutral?');
    expect(cellButton).toHaveTextContent('+1');
    expect(useSchedulerStore.getState().preferences.facultySubject.f1.s1).toBe(1);
    expect(persistSchedulerStateMock).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('resets preferences when confirmation is accepted', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(<PreferenceMatrix />);

    const cellButton = screen.getByRole('button', { name: '0' });
    fireEvent.contextMenu(cellButton);
    expect(cellButton).toHaveTextContent('-1');

    const fillNeutralButton = screen.getByRole('button', { name: 'Fill neutral' });
    await user.click(fillNeutralButton);

    await waitFor(() => expect(useSchedulerStore.getState().preferences.facultySubject.f1.s1).toBe(0));
    expect(cellButton).toHaveTextContent('0');
    await waitFor(() => expect(persistSchedulerStateMock).toHaveBeenCalled());
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });
});
