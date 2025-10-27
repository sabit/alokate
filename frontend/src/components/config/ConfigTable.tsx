import { useMemo } from 'react';
import { useSchedulerStore } from '../../store/schedulerStore';
import { ConfigExporter } from './ConfigExporter';
import { ConfigImporter } from './ConfigImporter';

export const ConfigTable = () => {
  const { config } = useSchedulerStore();

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

  return (
    <div className="space-y-6 rounded-xl border border-white/5 bg-slate-900/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Dataset summary</h3>
          <p className="text-sm text-slate-400">
            Ensure each entity is imported and validated before running the scheduler.
          </p>
        </div>
        <div className="flex gap-2">
          <ConfigImporter />
          <ConfigExporter />
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(summary).map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/5 bg-slate-950/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
