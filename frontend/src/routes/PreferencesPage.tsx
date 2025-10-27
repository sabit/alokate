import { PreferenceLegend } from '../components/preferences/PreferenceLegend';
import { PreferenceMatrix } from '../components/preferences/PreferenceMatrix';

export const PreferencesPage = () => (
  <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Preferences</h2>
        <p className="text-sm text-slate-400">
          Capture teaching preferences, redesign quickly with templates, and visualise stress points.
        </p>
      </div>
    </header>
    <PreferenceLegend />
    <PreferenceMatrix />
  </section>
);
