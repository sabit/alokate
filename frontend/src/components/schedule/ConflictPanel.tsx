import { useSchedulerEngine } from '../../hooks/useSchedulerEngine';

export const ConflictPanel = () => {
  const { conflicts } = useSchedulerEngine();

  return (
    <section className="rounded-xl border border-white/5 bg-slate-950/40 p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Conflicts</h3>
        <span className="text-sm text-slate-400">{conflicts.length} found</span>
      </header>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {conflicts.length === 0 && <li>No conflicts detected. Run the optimiser to update results.</li>}
        {conflicts.map((conflict) => (
          <li key={conflict.id} className="rounded-lg border border-white/5 bg-slate-900/50 p-3">
            <p className="font-medium text-slate-100">{conflict.title}</p>
            <p className="text-xs text-slate-400">{conflict.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
