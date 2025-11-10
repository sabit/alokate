import { useState } from 'react';
import { PreferenceLegend } from '../components/preferences/PreferenceLegend';
import { PreferenceMatrix } from '../components/preferences/PreferenceMatrix';

export const PreferencesPage = () => {
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  return (
  <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Preferences</h2>
        <p className="text-sm text-slate-400">
          Capture teaching preferences, redesign quickly with templates, and visualise stress points.
        </p>
      </div>
    </header>
    <aside className="rounded-lg border border-sky-500/20 bg-sky-500/5 text-sm text-slate-200">
      <button
        onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsInstructionsExpanded(!isInstructionsExpanded);
          }
        }}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        aria-expanded={isInstructionsExpanded}
        aria-controls="instructions-content"
      >
        <h3 className="text-sm font-semibold text-sky-100">How to edit preferences</h3>
        <svg
          className={`h-5 w-5 text-sky-100 transition-transform duration-200 ${
            isInstructionsExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id="instructions-content"
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isInstructionsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isInstructionsExpanded}
      >
        <ul className="space-y-1 px-4 pb-4 pl-8">
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
            Use "Reset to neutral" to quickly return the current view to zeroed preferences.
          </li>
        </ul>
      </div>
    </aside>
    <PreferenceLegend />
    <PreferenceMatrix />
  </section>
  );
};
