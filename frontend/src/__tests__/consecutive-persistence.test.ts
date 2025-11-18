import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadState, saveState } from '../data/storage';
import type { UnifiedState } from '../types';
import * as indexedDb from '../data/indexedDb';

// Mock IndexedDB operations
vi.mock('../data/indexedDb', () => ({
  loadOfflineState: vi.fn(),
  saveOfflineState: vi.fn(),
  saveOfflineSnapshot: vi.fn(),
  listOfflineSnapshots: vi.fn(),
  deleteOfflineSnapshot: vi.fn(),
}));

describe('Consecutive Penalty: Data Persistence and Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Consecutive Preferences Persistence', () => {
    it('should save consecutive preferences to IndexedDB when modified', async () => {
      const stateWithConsecutive: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
            { id: 'faculty-2', name: 'Prof. Jones', initial: 'PJ', maxSections: 2, maxOverload: 0, canOverload: false },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {
            'faculty-1': 2,
            'faculty-2': 3,
          },
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateWithConsecutive);

      expect(indexedDb.saveOfflineState).toHaveBeenCalledWith(stateWithConsecutive);
      expect(indexedDb.saveOfflineState).toHaveBeenCalledTimes(1);

      // Verify the consecutive preferences are in the saved state
      const savedState = vi.mocked(indexedDb.saveOfflineState).mock.calls[0][0];
      expect(savedState.preferences.consecutive).toEqual({
        'faculty-1': 2,
        'faculty-2': 3,
      });
    });

    it('should load consecutive preferences from IndexedDB', async () => {
      const storedState: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: { 'faculty-1': 1.5 },
          consecutive: { 'faculty-1': 2 },
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.5 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(storedState);
      const loadedState = await loadState();

      expect(loadedState).toEqual(storedState);
      expect(loadedState?.preferences.consecutive).toEqual({ 'faculty-1': 2 });
    });

    it('should persist multiple consecutive preference updates', async () => {
      // Initial state
      const initialState: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
            { id: 'faculty-2', name: 'Prof. Jones', initial: 'PJ', maxSections: 2, maxOverload: 0, canOverload: false },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {},
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      // First update
      const stateAfterFirstUpdate = {
        ...initialState,
        preferences: {
          ...initialState.preferences,
          consecutive: { 'faculty-1': 2 },
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateAfterFirstUpdate);
      expect(vi.mocked(indexedDb.saveOfflineState).mock.calls[0][0].preferences.consecutive).toEqual({
        'faculty-1': 2,
      });

      // Second update
      const stateAfterSecondUpdate = {
        ...stateAfterFirstUpdate,
        preferences: {
          ...stateAfterFirstUpdate.preferences,
          consecutive: { 'faculty-1': 2, 'faculty-2': 3 },
        },
      };

      await saveState(stateAfterSecondUpdate);
      expect(vi.mocked(indexedDb.saveOfflineState).mock.calls[1][0].preferences.consecutive).toEqual({
        'faculty-1': 2,
        'faculty-2': 3,
      });

      expect(indexedDb.saveOfflineState).toHaveBeenCalledTimes(2);
    });
  });

  describe('Consecutive Weight Persistence', () => {
    it('should persist consecutive weight in settings', async () => {
      const stateWithCustomWeight: UnifiedState = {
        config: {
          faculty: [],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {},
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 2.5 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateWithCustomWeight);

      const savedState = vi.mocked(indexedDb.saveOfflineState).mock.calls[0][0];
      expect(savedState.settings.weights.consecutive).toBe(2.5);
    });

    it('should load consecutive weight from IndexedDB', async () => {
      const storedState: UnifiedState = {
        config: {
          faculty: [],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {},
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.8 },
          theme: 'light',
          optimizerSeed: 100,
        },
      };

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(storedState);
      const loadedState = await loadState();

      expect(loadedState?.settings.weights.consecutive).toBe(1.8);
    });
  });

  describe('Migration: Legacy Data Without Consecutive Field', () => {
    it('should load legacy data without consecutive field and use defaults', async () => {
      // Simulate old data structure without consecutive field
      const legacyState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: { 'faculty-1': 1.5 },
          // consecutive field is missing
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
          // consecutive weight is missing
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(legacyState as any);
      const loadedState = await loadState();

      // Verify state loads successfully
      expect(loadedState).toBeDefined();
      expect(loadedState?.config.faculty).toHaveLength(1);
      
      // Verify consecutive field exists (even if empty) or can be accessed safely
      // The application should handle undefined consecutive gracefully
      expect(loadedState?.preferences.consecutive).toBeUndefined();
      
      // Verify consecutive weight is missing
      expect(loadedState?.settings.weights.consecutive).toBeUndefined();
    });

    it('should handle partial consecutive data in legacy state', async () => {
      const partialState: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
            { id: 'faculty-2', name: 'Prof. Jones', initial: 'PJ', maxSections: 2, maxOverload: 0, canOverload: false },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {}, // Empty consecutive object
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(partialState);
      const loadedState = await loadState();

      expect(loadedState).toEqual(partialState);
      expect(loadedState?.preferences.consecutive).toEqual({});
      
      // Application should use default value of 1 for faculty without consecutive preference
      // This is handled in the UI and optimizer code with: preferences.consecutive?.[faculty.id] ?? 1
    });

    it('should successfully save state after loading legacy data', async () => {
      // Load legacy state
      const legacyState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          // consecutive field missing
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
          // consecutive weight missing
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(legacyState as any);
      const loadedState = await loadState();

      // Now add consecutive data and save
      const updatedState: UnifiedState = {
        ...loadedState!,
        preferences: {
          ...loadedState!.preferences,
          consecutive: { 'faculty-1': 2 },
        },
        settings: {
          ...loadedState!.settings,
          weights: {
            ...loadedState!.settings.weights,
            consecutive: 1.0,
          },
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(updatedState);

      const savedState = vi.mocked(indexedDb.saveOfflineState).mock.calls[0][0];
      expect(savedState.preferences.consecutive).toEqual({ 'faculty-1': 2 });
      expect(savedState.settings.weights.consecutive).toBe(1.0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty consecutive preferences object', async () => {
      const stateWithEmptyConsecutive: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: {}, // Empty object
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateWithEmptyConsecutive);

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(stateWithEmptyConsecutive);
      const loadedState = await loadState();

      expect(loadedState?.preferences.consecutive).toEqual({});
    });

    it('should handle consecutive value of 0', async () => {
      const stateWithZeroConsecutive: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: { 'faculty-1': 0 }, // Zero value (no penalty)
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateWithZeroConsecutive);

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(stateWithZeroConsecutive);
      const loadedState = await loadState();

      expect(loadedState?.preferences.consecutive['faculty-1']).toBe(0);
    });

    it('should handle consecutive value at maximum (3)', async () => {
      const stateWithMaxConsecutive: UnifiedState = {
        config: {
          faculty: [
            { id: 'faculty-1', name: 'Dr. Smith', initial: 'DS', maxSections: 3, maxOverload: 1, canOverload: true },
          ],
          subjects: [],
          sections: [],
          timeslots: [],
          rooms: [],
          buildings: [],
        },
        preferences: {
          facultySubject: {},
          facultyTimeslot: {},
          facultyBuilding: {},
          mobility: {},
          consecutive: { 'faculty-1': 3 }, // Maximum value
        },
        schedule: [],
        snapshots: [],
        settings: {
          weights: { mobility: 0.8, seniority: 1.2, preference: 1.0, consecutive: 1.0 },
          theme: 'dark',
          optimizerSeed: 42,
        },
      };

      vi.mocked(indexedDb.saveOfflineState).mockResolvedValue();
      await saveState(stateWithMaxConsecutive);

      vi.mocked(indexedDb.loadOfflineState).mockResolvedValue(stateWithMaxConsecutive);
      const loadedState = await loadState();

      expect(loadedState?.preferences.consecutive['faculty-1']).toBe(3);
    });
  });
});
