import { useMemo } from 'react';
import type { ConfigData } from '../../types';

interface ConfigSummaryProps {
  config: ConfigData;
  compact?: boolean;
}

export const ConfigSummary = ({ config, compact = false }: ConfigSummaryProps) => {
  const summary = useMemo(
    () => ({
      faculty: config.faculty.length,
      subjects: config.subjects.length,
      sections: config.sections.length,
      timeslots: config.timeslots.length,
      rooms: config.rooms.length,
      buildings: config.buildings.length,
    }),
    [config],
  );

  const isEmpty = useMemo(
    () =>
      summary.faculty === 0 &&
      summary.subjects === 0 &&
      summary.sections === 0 &&
      summary.timeslots === 0 &&
      summary.rooms === 0 &&
      summary.buildings === 0,
    [summary],
  );

  // Calculate total capacity (max sections + max overload only if canOverload is true)
  const totalCapacity = useMemo(
    () =>
      config.faculty.reduce((total, faculty) => {
        const overload = faculty.canOverload ? faculty.maxOverload : 0;
        return total + faculty.maxSections + overload;
      }, 0),
    [config.faculty],
  );

  // Check if sections exceed capacity (overcapacity warning)
  const sectionsOverCapacity = summary.sections > totalCapacity && summary.sections > 0;

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-white/5 bg-slate-950/60 p-8 text-center">
        <p className="text-slate-400">No configuration loaded</p>
        <p className="mt-2 text-sm text-slate-500">
          Import a JSON or CSV file to get started
        </p>
      </div>
    );
  }

  return (
    <dl className={`grid gap-${compact ? '2' : '4'} sm:grid-cols-3 lg:grid-cols-6`}>
      {Object.entries(summary).map(([label, value]) => {
        const isSectionsCard = label === 'sections';
        const shouldHighlight = isSectionsCard && sectionsOverCapacity;

        if (compact) {
          return (
            <div
              key={label}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                shouldHighlight
                  ? 'border-red-500/50 bg-red-950/20 ring-1 ring-red-500/30'
                  : 'border-white/5 bg-slate-950/60'
              }`}
            >
              <dt
                className={`text-xs uppercase tracking-wide ${
                  shouldHighlight ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {label}
              </dt>
              <dd
                className={`text-sm font-semibold ${
                  shouldHighlight ? 'text-red-300' : 'text-white'
                }`}
              >
                {value}
                {shouldHighlight && (
                  <span className="ml-1 text-xs text-red-400">/ {totalCapacity}</span>
                )}
              </dd>
            </div>
          );
        }

        return (
          <div
            key={label}
            className={`rounded-lg border p-4 ${
              shouldHighlight
                ? 'border-red-500/50 bg-red-950/20 ring-1 ring-red-500/30'
                : 'border-white/5 bg-slate-950/60'
            }`}
          >
            <dt
              className={`text-xs uppercase tracking-wide ${
                shouldHighlight ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              {label}
            </dt>
            <dd
              className={`mt-2 text-2xl font-semibold ${
                shouldHighlight ? 'text-red-300' : 'text-white'
              }`}
            >
              {value}
              {shouldHighlight && (
                <span className="ml-2 text-xs text-red-400">/ {totalCapacity}</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
