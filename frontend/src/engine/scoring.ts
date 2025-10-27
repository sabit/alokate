import type { ScheduleEntry } from '../types';

export interface ScoreSummary {
  total: number;
  average: number;
}

export const calculateScore = (schedule: ScheduleEntry[]): ScoreSummary => {
  if (!schedule.length) {
    return { total: 0, average: 0 };
  }

  const total = schedule.reduce((sum, entry) => sum + (entry.scoreBreakdown?.total ?? 0), 0);
  return {
    total,
    average: total / schedule.length,
  };
};
