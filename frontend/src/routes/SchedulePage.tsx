import { useCallback, useEffect, useMemo } from 'react';
import { ConflictPanel } from '../components/schedule/ConflictPanel';
import { EditDialog } from '../components/schedule/EditDialog/EditDialog';
import { FilterBar } from '../components/schedule/FilterBar';
import { ScheduleGrid } from '../components/schedule/ScheduleGrid/ScheduleGrid';
import { useSchedulerStore } from '../store/schedulerStore';
import { useScheduleUiStore } from '../store/scheduleUiStore';

export const SchedulePage = () => {
  const config = useSchedulerStore((state) => state.config);
  const dayFilter = useScheduleUiStore((state) => state.dayFilter);
  const setDayFilter = useScheduleUiStore((state) => state.setDayFilter);
  const clearDayFilter = useScheduleUiStore((state) => state.clearDayFilter);
  const initializeDayFilter = useScheduleUiStore((state) => state.initializeDayFilter);

  // Initialize dayFilter with available days from timeslots on mount
  useEffect(() => {
    const allTimeslots = config.timeslots;
    const uniqueDays = Array.from(new Set(allTimeslots.map((slot) => slot.day)));
    initializeDayFilter(uniqueDays);
  }, [config.timeslots, initializeDayFilter]);

  // Calculate available days and counts for DayFilterControl
  const allTimeslots = useMemo(() => config.timeslots, [config.timeslots]);
  const availableDays = useMemo(() => {
    return Array.from(new Set(allTimeslots.map((slot) => slot.day))).sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });
  }, [allTimeslots]);

  // Calculate visible count based on day filter
  const visibleCount = useMemo(() => {
    if (dayFilter.selectedDays.size === 0) {
      return allTimeslots.length;
    }
    return allTimeslots.filter((slot) => dayFilter.selectedDays.has(slot.day)).length;
  }, [allTimeslots, dayFilter.selectedDays]);

  const handleDayToggle = useCallback(
    (day: string) => {
      const newSelectedDays = new Set(dayFilter.selectedDays);
      if (newSelectedDays.has(day)) {
        newSelectedDays.delete(day);
      } else {
        newSelectedDays.add(day);
      }
      setDayFilter(newSelectedDays);
    },
    [dayFilter.selectedDays, setDayFilter],
  );

  const handleClearFilters = useCallback(() => {
    clearDayFilter();
  }, [clearDayFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Schedule</h2>
          <p className="text-sm text-slate-400">
            Explore auto-generated timetables, inspect conflicts, and make manual adjustments.
          </p>
        </div>
      </header>
      <FilterBar
        availableDays={availableDays}
        selectedDays={dayFilter.selectedDays}
        visibleCount={visibleCount}
        totalCount={allTimeslots.length}
        onDayToggle={handleDayToggle}
        onClearFilters={handleClearFilters}
      />
      <ScheduleGrid />
      <ConflictPanel />
      <EditDialog />
    </div>
  );
};
