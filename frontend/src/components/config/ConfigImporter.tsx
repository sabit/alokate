import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { useSchedulerPersistence } from '../../hooks/useSchedulerPersistence';
import { useToast } from '../../hooks/useToast';
import { useSchedulerStore } from '../../store/schedulerStore';
import { useSnapshotStore } from '../../store/snapshotStore';
import type { ConfigData, UnifiedState } from '../../types';
import { Button } from '../shared/Button';

export const ConfigImporter = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hydrate = useSchedulerStore((state) => state.hydrate);
  const updateConfig = useSchedulerStore((state) => state.updateConfig);
  const resetSchedule = useSchedulerStore((state) => state.updateSchedule);
  const hydrateSnapshots = useSnapshotStore((state) => state.hydrate);
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const persistSchedulerState = useSchedulerPersistence();

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (isUnifiedState(parsed)) {
        hydrate(parsed);
        hydrateSnapshots(parsed.snapshots ?? []);
        const synced = await persistSchedulerState();
        showSuccessToast(
          synced
            ? 'Full scheduler dataset imported and synced to server.'
            : 'Full scheduler dataset imported (saved locally).',
        );
        return;
      }

      if (isConfigData(parsed)) {
        updateConfig(parsed);
        resetSchedule([]);
        const synced = await persistSchedulerState();
        showSuccessToast(
          synced
            ? 'Configuration imported and synced to server.'
            : 'Configuration imported (saved locally).',
        );
        return;
      }

      throw new Error('Unsupported JSON format.');
    } catch (error) {
      console.error('Failed to import configuration', error);
      const message = error instanceof Error ? error.message : 'Unable to import configuration';
      showErrorToast(message);
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImport(file);
            event.target.value = '';
          }
        }}
      />
      <Button variant="secondary" onClick={handleClick}>
        Import JSON
      </Button>
    </>
  );
};

const isUnifiedState = (value: unknown): value is UnifiedState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<UnifiedState>;
  return (
    typeof candidate === 'object' &&
    !!candidate.config &&
    Array.isArray(candidate.schedule) &&
    !!candidate.preferences &&
    !!candidate.settings
  );
};

const isConfigData = (value: unknown): value is ConfigData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ConfigData>;

  return (
    Array.isArray(candidate.faculty) &&
    Array.isArray(candidate.subjects) &&
    Array.isArray(candidate.sections) &&
    Array.isArray(candidate.timeslots) &&
    Array.isArray(candidate.rooms) &&
    Array.isArray(candidate.buildings)
  );
};

