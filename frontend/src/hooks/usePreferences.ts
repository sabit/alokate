import { useSchedulerStore } from '../store/schedulerStore';

export const usePreferences = () => {
  const preferences = useSchedulerStore((state) => state.preferences);
  const updatePreferences = useSchedulerStore((state) => state.updatePreferences);

  return {
    preferences,
    updatePreferences,
  };
};
