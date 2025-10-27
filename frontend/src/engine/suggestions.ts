import type { ScheduleEntry } from '../types';

export interface Suggestion {
  type: 'swap' | 'replacement';
  description: string;
}

export const generateSuggestions = (schedule: ScheduleEntry[]): Suggestion[] => {
  console.debug('Generating placeholder suggestions for schedule', schedule.length);
  return [];
};
