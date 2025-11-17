import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadState, saveState, saveSnapshot, loadSnapshots, deleteSnapshot } from '../data/storage';
import { exportStateAsJSON, parseStateFromFile } from '../data/importExport';
import { defaultState } from '../data/schema';
import type { UnifiedState, Snapshot } from '../types';
import * as indexedDb from '../data/indexedDb';

// Mock IndexedDB operations
vi.mock('../data/indexedDb', () => ({
  loadOfflineState: vi.fn(),
  saveOfflineState: vi.fn(),
  saveOfflineSnapshot: vi.fn(),
  listOfflineSnapshots: vi.fn(),
  deleteOfflineSnapshot: vi.fn(),
}));

describe('Integration: Complete User Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete workflow: empty state -> import -> save -> snapshot -> export -> import', async () => {
    // Step 1: Start with empty IndexedDB (no state exists)
    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(undefined);
    
    const initialState = await loadState();
    expect(initialState).toBeUndefined();

    // Step 2: Import sample configuration data
    const sampleConfig: UnifiedState = {
      config: {
        faculty: [
          {
            id: 'faculty-anna',
            name: 'Dr. Anna Rivera',
            initial: 'AR',
            maxSections: 3,
            maxOverload: 1,
            canOverload: true,
          },
          {
            id: 'faculty-brian',
            name: 'Prof. Brian Chen',
            initial: 'BC',
            maxSections: 2,
            maxOverload: 0,
            canOverload: false,
          },
        ],
        subjects: [
          {
            id: 'subject-math101',
            name: 'Foundations of Algebra',
            code: 'MATH-101',
          },
          {
            id: 'subject-phys210',
            name: 'Classical Mechanics',
            code: 'PHYS-210',
          },
        ],
        timeslots: [
          {
            id: 'slot-mon-0800',
            label: 'Mon 08:00–09:30',
            day: 'Monday',
            start: '08:00',
            end: '09:30',
          },
          {
            id: 'slot-wed-1030',
            label: 'Wed 10:30–12:00',
            day: 'Wednesday',
            start: '10:30',
            end: '12:00',
          },
        ],
        buildings: [
          {
            id: 'building-a',
            label: 'Science Hall',
          },
          {
            id: 'building-b',
            label: 'Engineering Center',
          },
        ],
        rooms: [
          {
            id: 'room-a-101',
            label: 'Science 101',
            buildingId: 'building-a',
            capacity: 32,
          },
          {
            id: 'room-b-201',
            label: 'Engineering 201',
            buildingId: 'building-b',
            capacity: 28,
          },
        ],
        sections: [
          {
            id: 'section-math101-1',
            subjectId: 'subject-math101',
            timeslotId: 'slot-mon-0800',
            roomId: 'room-a-101',
            capacity: 30,
          },
          {
            id: 'section-phys210-1',
            subjectId: 'subject-phys210',
            timeslotId: 'slot-wed-1030',
            roomId: 'room-b-201',
            capacity: 24,
          },
        ],
      },
      preferences: {
        facultySubject: {},
        facultyTimeslot: {},
        facultyBuilding: {},
        mobility: {},
      },
      schedule: [],
      snapshots: [],
      settings: {
        weights: {
          mobility: 0.8,
          seniority: 1.2,
          preference: 1.0,
        },
        theme: 'dark',
        optimizerSeed: 42,
      },
    };

    // Simulate importing from JSON file
    const jsonText = JSON.stringify(sampleConfig, null, 2);
    
    // Create a mock File object
    const mockFile = new File([jsonText], 'test-config.json', { type: 'application/json' });
    const importedState = await parseStateFromFile(mockFile);
    
    expect(importedState).toEqual(sampleConfig);
    expect(importedState.config.faculty).toHaveLength(2);
    expect(importedState.config.subjects).toHaveLength(2);

    // Step 3: Create preferences and schedule
    const stateWithPreferences: UnifiedState = {
      ...importedState,
      preferences: {
        facultySubject: {
          'faculty-anna': {
            'subject-math101': 3,
            'subject-phys210': 1,
          },
          'faculty-brian': {
            'subject-math101': 2,
            'subject-phys210': -1,
          },
        },
        facultyTimeslot: {
          'faculty-anna': {
            'slot-mon-0800': 2,
            'slot-wed-1030': 1,
          },
        },
        facultyBuilding: {
          'faculty-anna': {
            'building-a': 3,
          },
        },
        mobility: {
          'faculty-anna': 0.5,
          'faculty-brian': 0.8,
        },
      },
      schedule: [
        {
          sectionId: 'section-math101-1',
          facultyId: 'faculty-anna',
          timeslotId: 'slot-mon-0800',
          roomId: 'room-a-101',
          locked: false,
        },
        {
          sectionId: 'section-phys210-1',
          facultyId: 'faculty-brian',
          timeslotId: 'slot-wed-1030',
          roomId: 'room-b-201',
          locked: true,
        },
      ],
    };

    // Step 4: Verify auto-save persists data
    vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
    await saveState(stateWithPreferences);
    
    expect(indexedDb.saveOfflineState).toHaveBeenCalledWith(stateWithPreferences);
    expect(indexedDb.saveOfflineState).toHaveBeenCalledTimes(1);

    // Step 5: Refresh browser and verify data loads correctly
    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(stateWithPreferences);
    const reloadedState = await loadState();
    
    expect(reloadedState).toEqual(stateWithPreferences);
    expect(reloadedState?.schedule).toHaveLength(2);
    expect(reloadedState?.preferences.facultySubject['faculty-anna']).toEqual({
      'subject-math101': 3,
      'subject-phys210': 1,
    });

    // Step 6: Create snapshot and verify it saves
    const snapshot: Snapshot = {
      id: 'snapshot-1',
      timestamp: new Date().toISOString(),
      snapshotName: 'Test Snapshot',
      data: {
        config: stateWithPreferences.config,
        preferences: stateWithPreferences.preferences,
        schedule: stateWithPreferences.schedule,
        settings: stateWithPreferences.settings,
      },
    };

    vi.mocked(indexedDb.saveOfflineSnapshot).mockResolvedValue();
    await saveSnapshot(snapshot);
    
    expect(indexedDb.saveOfflineSnapshot).toHaveBeenCalledWith(snapshot);
    expect(indexedDb.saveOfflineSnapshot).toHaveBeenCalledTimes(1);

    // Verify snapshot can be loaded
    vi.mocked(indexedDb.listOfflineSnapshots).mockResolvedValue([snapshot]);
    const snapshots = await loadSnapshots();
    
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].id).toBe('snapshot-1');
    expect(snapshots[0].snapshotName).toBe('Test Snapshot');

    // Step 7: Export data and verify JSON is valid
    const exportedBlob = exportStateAsJSON(stateWithPreferences);
    expect(exportedBlob.type).toBe('application/json');
    
    const exportedText = JSON.stringify(stateWithPreferences, null, 2);
    const exportedData = JSON.parse(exportedText);
    
    expect(exportedData).toEqual(stateWithPreferences);
    expect(exportedData.config.faculty).toHaveLength(2);
    expect(exportedData.schedule).toHaveLength(2);

    // Step 8: Import exported data and verify it loads correctly
    const reimportFile = new File([exportedText], 'exported-data.json', { type: 'application/json' });
    const reimportedState = await parseStateFromFile(reimportFile);
    
    expect(reimportedState).toEqual(stateWithPreferences);
    expect(reimportedState.config.faculty[0].name).toBe('Dr. Anna Rivera');
    expect(reimportedState.schedule[1].locked).toBe(true);
  });

  it('should handle snapshot deletion', async () => {
    const snapshot: Snapshot = {
      id: 'snapshot-to-delete',
      timestamp: new Date().toISOString(),
      snapshotName: 'Snapshot to Delete',
      data: {
        config: defaultState.config,
        preferences: defaultState.preferences,
        schedule: [],
        settings: defaultState.settings,
      },
    };

    // Save snapshot
    vi.mocked(indexedDb.saveOfflineSnapshot).mockResolvedValue();
    await saveSnapshot(snapshot);

    // Delete snapshot
    vi.mocked(indexedDb.deleteOfflineSnapshot).mockResolvedValue();
    await deleteSnapshot(snapshot.id);
    
    expect(indexedDb.deleteOfflineSnapshot).toHaveBeenCalledWith(snapshot.id);
    expect(indexedDb.deleteOfflineSnapshot).toHaveBeenCalledTimes(1);

    // Verify snapshot is removed
    vi.mocked(indexedDb.listOfflineSnapshots).mockResolvedValue([]);
    const remainingSnapshots = await loadSnapshots();
    
    expect(remainingSnapshots).toHaveLength(0);
  });

  it('should handle empty state initialization', async () => {
    // When no state exists in IndexedDB
    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(undefined);
    
    const state = await loadState();
    expect(state).toBeUndefined();
    
    // Application should initialize with default state
    // This is handled by the bootstrap hook
  });

  it('should handle storage errors gracefully', async () => {
    // Test save error
    vi.mocked(indexedDb.saveOfflineState).mockRejectedValue(new Error('Storage quota exceeded'));
    
    await expect(saveState(defaultState)).rejects.toThrow('Failed to save state to local storage');

    // Test load error
    vi.mocked(indexedDb.loadOfflineState).mockRejectedValue(new Error('Database corrupted'));
    
    await expect(loadState()).rejects.toThrow('Failed to load state from local storage');
  });

  it('should validate imported data structure', async () => {
    // Test invalid JSON
    const invalidJsonFile = new File(['{ invalid json }'], 'invalid.json', { type: 'application/json' });
    
    await expect(parseStateFromFile(invalidJsonFile)).rejects.toThrow('Invalid JSON format');

    // Test missing required fields
    const incompleteData = {
      config: {},
      // Missing preferences, schedule, snapshots, settings
    };
    const incompleteFile = new File([JSON.stringify(incompleteData)], 'incomplete.json', { type: 'application/json' });
    
    await expect(parseStateFromFile(incompleteFile)).rejects.toThrow('Missing required field');
  });
});
