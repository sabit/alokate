import { useRef, useState, useCallback } from 'react';
import { useSchedulerStore } from '../../store/schedulerStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../shared/Button';
import { WeightInput } from './WeightInput';
import { downloadStateAsJSON, parseStateFromFile } from '../../data/importExport';
import { saveState } from '../../data/storage';
import type { UnifiedState } from '../../types';

export const SettingsPanel = () => {
  const settings = useSchedulerStore((state) => state.settings);
  const updateSettings = useSchedulerStore((state) => state.updateSettings);
  const hydrate = useSchedulerStore((state) => state.hydrate);
  const config = useSchedulerStore((state) => state.config);
  const preferences = useSchedulerStore((state) => state.preferences);
  const schedule = useSchedulerStore((state) => state.schedule);
  const snapshots = useSchedulerStore((state) => state.snapshots);
  const { toggleTheme, pushToast } = useUIStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportState, setPendingImportState] = useState<UnifiedState | null>(null);

  const handleExport = () => {
    try {
      setIsExporting(true);
      const state = {
        config,
        preferences,
        schedule,
        snapshots,
        settings,
      };
      downloadStateAsJSON(state);
      pushToast({
        message: 'Data exported successfully',
        variant: 'success',
      });
    } catch (error) {
      pushToast({
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const importedState = await parseStateFromFile(file);
      
      // Show confirmation dialog
      setPendingImportState(importedState);
      setShowImportConfirm(true);
    } catch (error) {
      pushToast({
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportState) return;

    try {
      // Save to IndexedDB
      await saveState(pendingImportState);
      
      // Hydrate the store
      hydrate(pendingImportState);
      
      pushToast({
        message: 'Data imported successfully',
        variant: 'success',
      });
      
      setShowImportConfirm(false);
      setPendingImportState(null);
    } catch (error) {
      pushToast({
        message: `Failed to save imported data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    }
  };

  const handleCancelImport = () => {
    setShowImportConfirm(false);
    setPendingImportState(null);
  };

  // Debounced weight change handler
  const handleWeightChange = useCallback((weightKey: keyof typeof settings.weights, value: number) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced update
    debounceTimerRef.current = setTimeout(async () => {
      const updatedSettings = {
        ...settings,
        weights: {
          ...settings.weights,
          [weightKey]: value,
        },
      };
      updateSettings(updatedSettings);
      
      // Persist the complete unified state
      try {
        await saveState({
          config,
          preferences,
          schedule,
          snapshots,
          settings: updatedSettings,
        });
      } catch (error) {
        pushToast({
          message: `Failed to save weight changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'error',
        });
      }
    }, 300);
  }, [settings, updateSettings, config, preferences, schedule, snapshots, pushToast]);

  // Reset weights to default values
  const handleResetWeights = useCallback(async () => {
    const updatedSettings = {
      ...settings,
      weights: {
        preference: 1.0,
        mobility: 1.0,
        seniority: 1.0,
        consecutive: 1.0,
      },
    };
    updateSettings(updatedSettings);
    
    // Persist the complete unified state
    try {
      await saveState({
        config,
        preferences,
        schedule,
        snapshots,
        settings: updatedSettings,
      });
      pushToast({
        message: 'Weights reset to default values',
        variant: 'success',
      });
    } catch (error) {
      pushToast({
        message: `Failed to save reset weights: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    }
  }, [settings, updateSettings, config, preferences, schedule, snapshots, pushToast]);

  return (
    <div className="space-y-4 rounded-xl border border-white/5 bg-slate-950/40 p-6">
      <div>
        <h3 className="text-lg font-semibold">Algorithm weights</h3>
        <p className="text-sm text-slate-400 mb-4">
          Configure the weights used by the optimizer to prioritize different factors in schedule generation.
        </p>
        
        {/* Weight Input Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <WeightInput
            label="Preference Weight"
            value={settings.weights.preference}
            onChange={(value) => handleWeightChange('preference', value)}
            helperText="Affects subject, timeslot, and building preferences"
          />
          <WeightInput
            label="Mobility Weight"
            value={settings.weights.mobility}
            onChange={(value) => handleWeightChange('mobility', value)}
            helperText="Affects building transition penalties"
          />
          <WeightInput
            label="Seniority Weight"
            value={settings.weights.seniority}
            onChange={(value) => handleWeightChange('seniority', value)}
            helperText="Affects faculty seniority priority"
          />
          <WeightInput
            label="Consecutive Weight"
            value={settings.weights.consecutive}
            onChange={(value) => handleWeightChange('consecutive', value)}
            helperText="Affects consecutive timeslot penalties"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleResetWeights}
          >
            Reset Weights
          </Button>
          <Button
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
      </div>

      <div className="rounded-lg border border-white/5 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold">Theme</h4>
        <p className="text-xs text-slate-400">Toggle to preview light mode in the workspace.</p>
        <Button variant="ghost" className="mt-2" onClick={toggleTheme}>
          Toggle theme
        </Button>
      </div>

      <div className="rounded-lg border border-white/5 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold">Data Management</h4>
        <p className="text-xs text-slate-400 mb-3">
          Export your data as a backup or import previously saved data.
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting}
          >
            Export Data
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handleImportClick}
            loading={isImporting}
            disabled={isImporting}
          >
            Import Data
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Confirm Import</h3>
            <p className="mt-2 text-sm text-slate-300">
              Importing this data will overwrite your current configuration, preferences, schedule, and settings.
              This action cannot be undone.
            </p>
            <p className="mt-2 text-sm text-yellow-400">
              Consider exporting your current data first as a backup.
            </p>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCancelImport}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmImport}>
                Import and Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
