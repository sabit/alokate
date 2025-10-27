import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import type { ConfigData, Preferences, ScheduleEntry, Settings, UnifiedState } from '../types';

export interface SchedulerState extends UnifiedState {
  hydrate: (state: UnifiedState) => void;
  updateSchedule: (schedule: ScheduleEntry[]) => void;
  updateConfig: (config: ConfigData) => void;
  updatePreferences: (preferences: Preferences) => void;
  updateSettings: (settings: Settings) => void;
}

const emptyState = (): UnifiedState => ({
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

const initializer: StateCreator<SchedulerState> = (set) => ({
  ...emptyState(),
  hydrate: (state) => set({ ...state }),
  updateSchedule: (schedule) => set({ schedule }),
  updateConfig: (config) => set({ config }),
  updatePreferences: (preferences) => set({ preferences }),
  updateSettings: (settings) => set({ settings }),
});

export const useSchedulerStore = create<SchedulerState>(initializer);
