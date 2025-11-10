import { useSchedulerStore } from '../../store/schedulerStore';
import { ConfigDataTables } from './ConfigDataTables';
import { ConfigExporter } from './ConfigExporter';
import { ConfigImporter } from './ConfigImporter';
import { ConfigSummary } from './ConfigSummary';

export const ConfigTable = () => {
  const { config } = useSchedulerStore();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6">
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
        <div className="mt-6">
          <ConfigSummary config={config} />
        </div>
      </div>
      <ConfigDataTables config={config} />
    </div>
  );
};
