import { useSchedulerStore } from '../../store/schedulerStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../shared/Button';

export const SettingsPanel = () => {
  const settings = useSchedulerStore((state) => state.settings);
  const updateSettings = useSchedulerStore((state) => state.updateSettings);
  const { toggleTheme } = useUIStore();

  return (
    <div className="space-y-4 rounded-xl border border-white/5 bg-slate-950/40 p-6">
      <div>
        <h3 className="text-lg font-semibold">Algorithm weights</h3>
        <p className="text-sm text-slate-400">
          Current mobility weight: {settings.weights.mobility.toFixed(2)}, preference weight:{' '}
          {settings.weights.preference.toFixed(2)}, seniority weight: {settings.weights.seniority.toFixed(2)}
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() =>
            updateSettings({
              ...settings,
              optimizerSeed: Date.now(),
            })
          }
        >
          Randomise optimizer seed
        </Button>
      </div>

      <div className="rounded-lg border border-white/5 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold">Theme</h4>
        <p className="text-xs text-slate-400">Toggle to preview light mode in the workspace.</p>
        <Button variant="ghost" className="mt-2" onClick={toggleTheme}>
          Toggle theme
        </Button>
      </div>
    </div>
  );
};
