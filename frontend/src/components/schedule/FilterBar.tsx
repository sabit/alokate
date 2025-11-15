import { useState } from 'react';
import { useSchedulerEngine } from '../../hooks/useSchedulerEngine';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { DayFilterControl } from './DayFilterControl';

interface FilterBarProps {
  availableDays?: string[];
  selectedDays?: Set<string>;
  visibleCount?: number;
  totalCount?: number;
  onDayToggle?: (day: string) => void;
  onClearFilters?: () => void;
}

export const FilterBar = ({
  availableDays = [],
  selectedDays = new Set(),
  visibleCount = 0,
  totalCount = 0,
  onDayToggle,
  onClearFilters,
}: FilterBarProps) => {
  const [optimizing, setOptimizing] = useState(false);
  const { conflictCount, runOptimizer } = useSchedulerEngine();

  const conflictLabel = conflictCount === 0 ? 'No conflicts' : `${conflictCount} ${conflictCount === 1 ? 'conflict' : 'conflicts'}`;

  const handleRunOptimizer = async () => {
    if (optimizing) {
      return;
    }
    setOptimizing(true);
    try {
      await runOptimizer();
    } finally {
      setOptimizing(false);
    }
  };

  const showDayFilter = availableDays.length > 0 && onDayToggle && onClearFilters;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4">
        <Input placeholder="Search faculty" className="w-48" />
        <Input placeholder="Filter by subject" className="w-48" />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
            {conflictLabel}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" type="button">
              Clear filters
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleRunOptimizer}
              loading={optimizing}
            >
              {optimizing ? 'Running optimiser' : 'Run optimiser'}
            </Button>
          </div>
        </div>
      </div>
      {showDayFilter && (
        <DayFilterControl
          availableDays={availableDays}
          selectedDays={selectedDays}
          visibleCount={visibleCount}
          totalCount={totalCount}
          onDayToggle={onDayToggle}
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
};
