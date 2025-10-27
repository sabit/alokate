import { useCallback, useMemo } from 'react';
import { analyzeConflicts } from '../engine/conflictChecker';
import { runOptimizer as executeOptimizer } from '../engine/optimizer';
import { useSchedulerStore } from '../store/schedulerStore';
import { useUIStore } from '../store/uiStore';
import { useToast } from './useToast';

export const useSchedulerEngine = () => {
  const { config, schedule, preferences, settings } = useSchedulerStore((state) => ({
    config: state.config,
    schedule: state.schedule,
    preferences: state.preferences,
    settings: state.settings,
  }));
  const updateSchedule = useSchedulerStore((state) => state.updateSchedule);
  const beginOperation = useUIStore((state) => state.beginOperation);
  const endOperation = useUIStore((state) => state.endOperation);
  const { success: showSuccess, error: showError } = useToast();

  const conflictAnalysis = useMemo(() => analyzeConflicts(config, schedule), [config, schedule]);

  const runOptimizer = useCallback(async () => {
    beginOperation();
    try {
      const seed = settings.optimizerSeed ?? Date.now();
      const result = await Promise.resolve(
        executeOptimizer(config, preferences, schedule, {
          seed,
          weights: settings.weights,
        }),
      );

      if (!Array.isArray(result)) {
        throw new Error('Optimiser returned an invalid schedule result');
      }

      const normalizedSchedule = result.map((entry) => ({
        ...entry,
        scoreBreakdown: entry.scoreBreakdown ? { ...entry.scoreBreakdown } : undefined,
      }));

      updateSchedule(normalizedSchedule);

      const assignmentCount = normalizedSchedule.length;
      const successMessage =
        assignmentCount > 0
          ? `Optimiser assigned ${assignmentCount} section${assignmentCount === 1 ? '' : 's'}.`
          : 'Optimiser run complete. No assignments generated.';

      showSuccess(successMessage);
      return true;
    } catch (error) {
      console.error('Failed to run optimiser', error);
      showError('Failed to run optimiser. Please try again.');
      return false;
    } finally {
      endOperation();
    }
  }, [beginOperation, config, endOperation, preferences, schedule, settings.optimizerSeed, settings.weights, showError, showSuccess, updateSchedule]);

  return {
    schedule,
    conflicts: conflictAnalysis.conflicts,
    conflictCount: conflictAnalysis.conflicts.length,
    runOptimizer,
  };
};
