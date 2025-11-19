import { describe, it, expect, beforeEach } from 'vitest';
import { useSchedulerStore } from '../store/schedulerStore';
import type { ConfigData, UnifiedState } from '../types';

describe('Color Import/Export Compatibility', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useSchedulerStore.getState();
    store.hydrate({
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
        weights: { mobility: 1.0, seniority: 1.0, preference: 1.0, consecutive: 1.0 },
        theme: 'dark',
        optimizerSeed: 42,
      },
    });
  });

  it('should include subject colors when exporting configuration', () => {
    // Arrange: Create config with subjects that have colors
    const configWithColors: ConfigData = {
      faculty: [],
      subjects: [
        {
          id: 'subject-1',
          name: 'Mathematics',
          code: 'MATH-101',
          color: '#F4D1AE',
        },
        {
          id: 'subject-2',
          name: 'Physics',
          code: 'PHYS-210',
          color: '#B8E6B8',
        },
      ],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    // Act: Update config in store
    const store = useSchedulerStore.getState();
    store.updateConfig(configWithColors);

    // Get the exported state
    const exportedState = useSchedulerStore.getState();

    // Assert: Verify colors are preserved in export
    expect(exportedState.config.subjects[0].color).toBe('#F4D1AE');
    expect(exportedState.config.subjects[1].color).toBe('#B8E6B8');
  });

  it('should preserve subject colors when importing configuration with colors', () => {
    // Arrange: Create a UnifiedState with subjects that have colors
    const stateWithColors: UnifiedState = {
      config: {
        faculty: [],
        subjects: [
          {
            id: 'subject-1',
            name: 'Chemistry',
            code: 'CHEM-101',
            color: '#B8D8E8',
          },
          {
            id: 'subject-2',
            name: 'Biology',
            code: 'BIO-101',
            color: '#D8B8E8',
          },
        ],
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
        weights: { mobility: 1.0, seniority: 1.0, preference: 1.0, consecutive: 1.0 },
        theme: 'dark',
        optimizerSeed: 42,
      },
    };

    // Act: Import the state
    const store = useSchedulerStore.getState();
    store.hydrate(stateWithColors);

    // Assert: Verify colors are preserved
    const importedState = useSchedulerStore.getState();
    expect(importedState.config.subjects[0].color).toBe('#B8D8E8');
    expect(importedState.config.subjects[1].color).toBe('#D8B8E8');
  });

  it('should assign default colors when importing configuration without colors', () => {
    // Arrange: Create config without colors
    const configWithoutColors: ConfigData = {
      faculty: [],
      subjects: [
        {
          id: 'subject-1',
          name: 'English',
          code: 'ENG-101',
        },
        {
          id: 'subject-2',
          name: 'History',
          code: 'HIST-101',
        },
        {
          id: 'subject-3',
          name: 'Art',
          code: 'ART-101',
        },
      ],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    // Act: Import config using updateConfig (which calls ensureSubjectColors)
    const store = useSchedulerStore.getState();
    store.updateConfig(configWithoutColors);

    // Assert: Verify default colors are assigned
    const importedState = useSchedulerStore.getState();
    expect(importedState.config.subjects[0].color).toBe('#F4D1AE'); // First default color
    expect(importedState.config.subjects[1].color).toBe('#B8E6B8'); // Second default color
    expect(importedState.config.subjects[2].color).toBe('#B8D8E8'); // Third default color
  });

  it('should cycle through default colors when importing many subjects without colors', () => {
    // Arrange: Create config with 8 subjects (more than 6 default colors)
    const configWithManySubjects: ConfigData = {
      faculty: [],
      subjects: [
        { id: 'subject-1', name: 'Subject 1', code: 'SUB-1' },
        { id: 'subject-2', name: 'Subject 2', code: 'SUB-2' },
        { id: 'subject-3', name: 'Subject 3', code: 'SUB-3' },
        { id: 'subject-4', name: 'Subject 4', code: 'SUB-4' },
        { id: 'subject-5', name: 'Subject 5', code: 'SUB-5' },
        { id: 'subject-6', name: 'Subject 6', code: 'SUB-6' },
        { id: 'subject-7', name: 'Subject 7', code: 'SUB-7' },
        { id: 'subject-8', name: 'Subject 8', code: 'SUB-8' },
      ],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    // Act: Import config
    const store = useSchedulerStore.getState();
    store.updateConfig(configWithManySubjects);

    // Assert: Verify colors cycle through the palette
    const importedState = useSchedulerStore.getState();
    const subjects = importedState.config.subjects;
    
    // First 6 subjects get the default colors
    expect(subjects[0].color).toBe('#F4D1AE');
    expect(subjects[1].color).toBe('#B8E6B8');
    expect(subjects[2].color).toBe('#B8D8E8');
    expect(subjects[3].color).toBe('#D8B8E8');
    expect(subjects[4].color).toBe('#C8C8C8');
    expect(subjects[5].color).toBe('#F4C8A0');
    
    // 7th and 8th subjects cycle back to the beginning
    expect(subjects[6].color).toBe('#F4D1AE');
    expect(subjects[7].color).toBe('#B8E6B8');
  });

  it('should preserve existing colors and only assign defaults to subjects without colors', () => {
    // Arrange: Create config with mixed subjects (some with colors, some without)
    const mixedConfig: ConfigData = {
      faculty: [],
      subjects: [
        {
          id: 'subject-1',
          name: 'Subject 1',
          code: 'SUB-1',
          color: '#FF0000', // Custom color
        },
        {
          id: 'subject-2',
          name: 'Subject 2',
          code: 'SUB-2',
          // No color
        },
        {
          id: 'subject-3',
          name: 'Subject 3',
          code: 'SUB-3',
          color: '#00FF00', // Custom color
        },
        {
          id: 'subject-4',
          name: 'Subject 4',
          code: 'SUB-4',
          // No color
        },
      ],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    // Act: Import config
    const store = useSchedulerStore.getState();
    store.updateConfig(mixedConfig);

    // Assert: Verify custom colors are preserved and defaults are assigned to others
    const importedState = useSchedulerStore.getState();
    const subjects = importedState.config.subjects;
    
    expect(subjects[0].color).toBe('#FF0000'); // Preserved custom color
    expect(subjects[1].color).toBe('#B8E6B8'); // Assigned default (index 1)
    expect(subjects[2].color).toBe('#00FF00'); // Preserved custom color
    expect(subjects[3].color).toBe('#D8B8E8'); // Assigned default (index 3)
  });

  it('should handle round-trip export and import with colors', () => {
    // Arrange: Create initial config with colors
    const initialConfig: ConfigData = {
      faculty: [],
      subjects: [
        {
          id: 'subject-1',
          name: 'Computer Science',
          code: 'CS-101',
          color: '#F4D1AE',
        },
        {
          id: 'subject-2',
          name: 'Data Structures',
          code: 'CS-201',
          color: '#B8E6B8',
        },
      ],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    // Act: Import, export, and re-import
    const store = useSchedulerStore.getState();
    store.updateConfig(initialConfig);
    
    // Simulate export by getting current state
    const exportedState = useSchedulerStore.getState();
    const exportedJSON = JSON.stringify(exportedState);
    
    // Simulate import by parsing and hydrating
    const reimportedState = JSON.parse(exportedJSON) as UnifiedState;
    store.hydrate(reimportedState);

    // Assert: Verify colors survive round-trip
    const finalState = useSchedulerStore.getState();
    expect(finalState.config.subjects[0].color).toBe('#F4D1AE');
    expect(finalState.config.subjects[1].color).toBe('#B8E6B8');
  });
});
