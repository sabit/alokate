import { useMemo } from 'react';
import { useSchedulerStore } from '../store/schedulerStore';

interface ConflictItem {
  id: string;
  title: string;
  description: string;
}

export const useSchedulerEngine = () => {
  const schedule = useSchedulerStore((state) => state.schedule);

  const conflicts = useMemo<ConflictItem[]>(
    () =>
      schedule.length
        ? []
        : [
            {
              id: 'placeholder-conflict',
              title: 'No schedule generated',
              description: 'Run the optimisation engine to produce assignments and conflict summary.',
            },
          ],
    [schedule],
  );

  const runOptimizer = () => {
    // TODO: connect to optimisation logic in engine/optimizer.ts
    return Promise.resolve();
  };

  return {
    schedule,
    conflicts,
    runOptimizer,
  };
};
