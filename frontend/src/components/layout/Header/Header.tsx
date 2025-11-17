import { SaveIndicator } from './SaveIndicator';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => (
  <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-6 py-4">
    <div>
      <h1 className="text-xl font-semibold">Schedule Workspace</h1>
      <p className="text-sm text-slate-400">Optimise assignments, manage preferences, and compare versions.</p>
    </div>
    <div className="flex items-center gap-3">
      <SaveIndicator />
      <ThemeToggle />
    </div>
  </header>
);
