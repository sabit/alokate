import { ConfigTable } from '../components/config/ConfigTable';

export const ConfigPage = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold">Configuration</h2>
      <p className="text-sm text-slate-400">
        Import datasets, validate relationships, and fine-tune faculty teaching limits.
      </p>
    </header>
    <ConfigTable />
  </section>
);
