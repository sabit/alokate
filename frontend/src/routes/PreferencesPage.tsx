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
    <aside className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-slate-200">
      <h3 className="text-sm font-semibold text-sky-100">How to edit preferences</h3>
      <ul className="mt-2 space-y-1 pl-4">
        <li className="list-disc">
          Left click a cell to increase a preference score up to +3; right click to decrease down to -3.
        </li>
        <li className="list-disc">
          Use the arrow keys while a cell is focused for keyboard adjustments.
        </li>
        <li className="list-disc">
          The legend below shows how colours map to preference strength.
        </li>
        <li className="list-disc">
          Mobility sliders control how forgiving each faculty member is for building changes.
        </li>
        <li className="list-disc">
          Use “Reset to neutral” to quickly return the current view to zeroed preferences.
        </li>
      </ul>
    </aside>
    <PreferenceLegend />
    <PreferenceMatrix />
  </section>
);
