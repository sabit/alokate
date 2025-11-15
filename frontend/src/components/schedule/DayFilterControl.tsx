import clsx from 'clsx';
import type { KeyboardEvent } from 'react';

interface DayFilterControlProps {
  availableDays: string[];
  selectedDays: Set<string>;
  visibleCount: number;
  totalCount: number;
  onDayToggle: (day: string) => void;
  onClearFilters: () => void;
}

const DAY_ABBREVIATIONS: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export const DayFilterControl = ({
  availableDays,
  selectedDays,
  visibleCount,
  totalCount,
  onDayToggle,
  onClearFilters,
}: DayFilterControlProps) => {
  const hasActiveFilters = selectedDays.size > 0;
  const hasNoTimeslots = totalCount === 0;

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onDayToggle(day);
    }
  };

  const handleClearKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClearFilters();
    }
  };

  // Don't render if there are no timeslots
  if (hasNoTimeslots) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 rounded-lg bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-300">Filter by day:</span>
        <div className="flex gap-2">
          {availableDays.map((day) => {
            const isSelected = selectedDays.has(day);
            const abbreviation = DAY_ABBREVIATIONS[day] || day.slice(0, 3);

            return (
              <button
                key={day}
                type="button"
                onClick={() => onDayToggle(day)}
                onKeyDown={(e) => handleDayKeyDown(e, day)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2',
                  isSelected
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100',
                )}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${day}`}
              >
                {abbreviation}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
        <span className="text-sm text-slate-400">
          Showing <span className="font-semibold text-slate-200">{visibleCount}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalCount}</span> timeslots
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            onKeyDown={handleClearKeyDown}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors',
              'bg-slate-800 hover:bg-slate-700 hover:text-slate-100',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2',
            )}
            aria-label="Clear all day filters"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
