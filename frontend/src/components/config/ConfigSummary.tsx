import { useMemo } from 'react';
import type { ConfigData } from '../../types';

interface ConfigSummaryProps {
  config: ConfigData;
}

export const ConfigSummary = ({ config }: ConfigSummaryProps) => {
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
    <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Object.entries(summary).map(([label, value]) => (
        <div key={label} className="rounded-lg border border-white/5 bg-slate-950/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
};
