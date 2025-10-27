import type { ScheduleEntry } from '../types';

export const calculateMobilityPenalty = (schedule: ScheduleEntry[]): number => {
  console.debug('Calculating mobility penalty for schedule', schedule.length);
  return 0;
};
