import type { UnifiedState } from '../types';

export const defaultState: UnifiedState = {
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
    weights: {
      mobility: 0.8,
      seniority: 1.2,
      preference: 1.0,
    },
    theme: 'dark',
    optimizerSeed: 42,
  },
};
