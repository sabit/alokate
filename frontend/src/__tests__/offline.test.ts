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

// Mock fetch to ensure no network requests are made
const originalFetch = global.fetch;
const mockFetch = vi.fn();

describe('Offline Functionality: No Network Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Replace global fetch with mock
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should not make any network requests during complete workflow', async () => {
    // Setup test data
    const testState: UnifiedState = {
      config: {
        faculty: [
          {
            id: 'faculty-1',
            name: 'Test Faculty',
            initial: 'TF',
            maxSections: 3,
            maxOverload: 1,
            canOverload: true,
          },
        ],
        subjects: [
          {
            id: 'subject-1',
            name: 'Test Subject',
            code: 'TEST-101',
          },
        ],
        timeslots: [
          {
            id: 'slot-1',
            label: 'Mon 08:00',
            day: 'Monday',
            start: '08:00',
            end: '09:30',
          },
        ],
        buildings: [
          {
            id: 'building-1',
            label: 'Test Building',
          },
        ],
        rooms: [
          {
            id: 'room-1',
            label: 'Room 101',
            buildingId: 'building-1',
            capacity: 30,
          },
        ],
        sections: [
          {
            id: 'section-1',
            subjectId: 'subject-1',
            timeslotId: 'slot-1',
            roomId: 'room-1',
            capacity: 30,
          },
        ],
      },
      preferences: {
        facultySubject: {
          'faculty-1': {
            'subject-1': 3,
          },
        },
        facultyTimeslot: {},
        facultyBuilding: {},
        mobility: {},
      },
      schedule: [
        {
          sectionId: 'section-1',
          facultyId: 'faculty-1',
          timeslotId: 'slot-1',
          roomId: 'room-1',
          locked: false,
        },
      ],
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

    // 1. Load state from IndexedDB
    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(testState);
    await loadState();
    expect(mockFetch).not.toHaveBeenCalled();

    // 2. Save state to IndexedDB
    vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
    await saveState(testState);
    expect(mockFetch).not.toHaveBeenCalled();

    // 3. Create and save snapshot
    const snapshot: Snapshot = {
      id: 'snapshot-1',
      timestamp: new Date().toISOString(),
      snapshotName: 'Test Snapshot',
      data: {
        config: testState.config,
        preferences: testState.preferences,
        schedule: testState.schedule,
        settings: testState.settings,
      },
    };

    vi.mocked(indexedDb.saveOfflineSnapshot).mockResolvedValue();
    await saveSnapshot(snapshot);
    expect(mockFetch).not.toHaveBeenCalled();

    // 4. Load snapshots
    vi.mocked(indexedDb.listOfflineSnapshots).mockResolvedValue([snapshot]);
    await loadSnapshots();
    expect(mockFetch).not.toHaveBeenCalled();

    // 5. Delete snapshot
    vi.mocked(indexedDb.deleteOfflineSnapshot).mockResolvedValue();
    await deleteSnapshot(snapshot.id);
    expect(mockFetch).not.toHaveBeenCalled();

    // 6. Export data
    exportStateAsJSON(testState);
    expect(mockFetch).not.toHaveBeenCalled();

    // 7. Import data
    const jsonText = JSON.stringify(testState);
    const mockFile = new File([jsonText], 'test.json', { type: 'application/json' });
    await parseStateFromFile(mockFile);
    expect(mockFetch).not.toHaveBeenCalled();

    // Final verification: No network requests were made
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should work with empty IndexedDB (no initial state)', async () => {
    // Load from empty IndexedDB
    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(undefined);
    const state = await loadState();
    
    expect(state).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();

    // Save default state
    vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
    await saveState(defaultState);
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle all operations without network connectivity', async () => {
    // Simulate network being disabled by making fetch throw
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    const testState: UnifiedState = {
      ...defaultState,
      config: {
        ...defaultState.config,
        faculty: [
          {
            id: 'faculty-1',
            name: 'Test Faculty',
            initial: 'TF',
            maxSections: 2,
            maxOverload: 0,
            canOverload: false,
          },
        ],
      },
    };

    // All operations should work without triggering network requests
    vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
    await saveState(testState);

    vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(testState);
    const loadedState = await loadState();

    expect(loadedState).toEqual(testState);
    
    // Verify fetch was never called (even though it would fail if called)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not make network requests during import/export operations', async () => {
    const testState: UnifiedState = {
      ...defaultState,
      schedule: [
        {
          sectionId: 'section-1',
          facultyId: 'faculty-1',
          timeslotId: 'slot-1',
          roomId: 'room-1',
          locked: true,
        },
      ],
    };

    // Export operation
    const blob = exportStateAsJSON(testState);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/json');
    expect(mockFetch).not.toHaveBeenCalled();

    // Import operation
    const jsonText = JSON.stringify(testState);
    const file = new File([jsonText], 'export.json', { type: 'application/json' });
    const imported = await parseStateFromFile(file);
    
    expect(imported).toEqual(testState);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not make network requests during snapshot operations', async () => {
    const snapshot: Snapshot = {
      id: 'snapshot-test',
      timestamp: new Date().toISOString(),
      snapshotName: 'Offline Snapshot',
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
    expect(mockFetch).not.toHaveBeenCalled();

    // Load snapshots
    vi.mocked(indexedDb.listOfflineSnapshots).mockResolvedValue([snapshot]);
    const snapshots = await loadSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(mockFetch).not.toHaveBeenCalled();

    // Delete snapshot
    vi.mocked(indexedDb.deleteOfflineSnapshot).mockResolvedValue();
    await deleteSnapshot(snapshot.id);
    expect(mockFetch).not.toHaveBeenCalled();

    // Verify no network activity
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });
});
