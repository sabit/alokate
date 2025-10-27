import type { ConfigData, Preferences, ScheduleEntry } from '../types';

interface OptimizerOptions {
  seed: number;
}

export const runOptimizer = (
  config: ConfigData,
  preferences: Preferences,
  currentSchedule: ScheduleEntry[],
  options: OptimizerOptions,
): ScheduleEntry[] => {
  console.debug('Running placeholder optimizer', { config, preferences, currentSchedule, options });
  return currentSchedule.map((entry) => ({
    ...entry,
    scoreBreakdown: entry.scoreBreakdown ? { ...entry.scoreBreakdown } : undefined,
  }));
};
