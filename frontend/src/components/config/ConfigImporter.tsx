import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { useSchedulerPersistence } from '../../hooks/useSchedulerPersistence';
import { useToast } from '../../hooks/useToast';
import { useSchedulerStore } from '../../store/schedulerStore';
import { useSnapshotStore } from '../../store/snapshotStore';
import type { ConfigData, UnifiedState } from '../../types';
import { Button } from '../shared/Button';
import { parseFacultyCSV, parseRoomsCSV } from '../../utils/csvParser';
import { transformFacultyData, transformRoomsData, mergeConfigData } from '../../utils/csvTransformer';
import { validateConfigData } from '../../utils/configValidator';

export const ConfigImporter = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
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
        await persistSchedulerState();
        showSuccessToast('Full scheduler dataset imported.');
        return;
      }

      if (isConfigData(parsed)) {
        // Validate the configuration data
        const validationResult = validateConfigData(parsed);
        
        if (!validationResult.valid) {
          const errorMessages = validationResult.errors
            .map(err => `${err.message}${err.context ? ` (${err.context})` : ''}`)
            .join('\n');
          throw new Error(`Configuration validation failed:\n${errorMessages}`);
        }

        updateConfig(parsed);
        resetSchedule([]);
        await persistSchedulerState();
        showSuccessToast('Configuration imported.');
        return;
      }

      throw new Error('Unsupported JSON format.');
    } catch (error) {
      console.error('Failed to import configuration', error);
      const message = error instanceof Error ? error.message : 'Unable to import configuration';
      showErrorToast(message);
    }
  };

  const handleCSVImport = async (files: FileList) => {
    try {
      // Validate that both faculty.csv and rooms.csv are provided
      const fileArray = Array.from(files);
      const facultyFile = fileArray.find(f => f.name.toLowerCase().includes('faculty'));
      const roomsFile = fileArray.find(f => f.name.toLowerCase().includes('rooms'));

      if (!facultyFile) {
        throw new Error('Please select a faculty CSV file (filename should contain "faculty")');
      }

      if (!roomsFile) {
        throw new Error('Please select a rooms CSV file (filename should contain "rooms")');
      }

      // Read both files
      const facultyText = await facultyFile.text();
      const roomsText = await roomsFile.text();

      // Parse CSV files
      const parsedFaculty = parseFacultyCSV(facultyText);
      const parsedRooms = parseRoomsCSV(roomsText);

      // Transform data
      const faculty = transformFacultyData(parsedFaculty);
      const roomsData = transformRoomsData(parsedRooms);

      // Merge into ConfigData
      const configData = mergeConfigData(faculty, roomsData);

      // Validate the configuration data
      const validationResult = validateConfigData(configData);
      
      if (!validationResult.valid) {
        const errorMessages = validationResult.errors
          .map(err => `${err.message}${err.context ? ` (${err.context})` : ''}`)
          .join('\n');
        throw new Error(`Configuration validation failed:\n${errorMessages}`);
      }

      // Update config and reset schedule
      updateConfig(configData);
      resetSchedule([]);

      // Persist state
      await persistSchedulerState();
      showSuccessToast('CSV configuration imported.');
    } catch (error) {
      console.error('Failed to import CSV configuration', error);
      const message = error instanceof Error ? error.message : 'Unable to import CSV configuration';
      showErrorToast(message);
    }
  };

  const handleClick = () => fileInputRef.current?.click();
  const handleCSVClick = () => csvFileInputRef.current?.click();

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
      <input
        ref={csvFileInputRef}
        type="file"
        accept="text/csv"
        multiple
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const files = event.target.files;
          if (files && files.length > 0) {
            void handleCSVImport(files);
            event.target.value = '';
          }
        }}
      />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleClick}>
          Import JSON
        </Button>
        <Button variant="secondary" onClick={handleCSVClick}>
          Import CSV
        </Button>
      </div>
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

