import { SettingsPanel } from '../components/settings/SettingsPanel';

export const SettingsPage = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold">Settings</h2>
      <p className="text-sm text-slate-400">Adjust algorithm weights, theme, and experimental features.</p>
    </header>
    <SettingsPanel />
  </section>
);
