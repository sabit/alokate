import type { ConfigData, Preferences, ScheduleEntry } from '../types';

interface OptimizerOptions {
  seed: number;
}

export const runOptimizer = (
  config: ConfigData,
  preferences: Preferences,
  options: OptimizerOptions,
): ScheduleEntry[] => {
  console.debug('Running placeholder optimizer', { config, preferences, options });
  return [];
};
