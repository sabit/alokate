import type { ScheduleEntry } from '../types';

export interface Conflict {
  id: string;
  title: string;
  description: string;
}

export const findConflicts = (schedule: ScheduleEntry[]): Conflict[] => {
  console.debug('Running conflict checks for schedule of size', schedule.length);
  return [];
};
