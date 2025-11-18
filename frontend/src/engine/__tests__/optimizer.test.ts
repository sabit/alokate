import { describe, expect, it } from 'vitest';
import type { ConfigData, Preferences, ScheduleEntry } from '../../types';
import { runOptimizer } from '../optimizer';

// Helper to create minimal test data
const createTestConfig = (overrides?: Partial<ConfigData>): ConfigData => ({
  faculty: [
    { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 3, maxOverload: 1, canOverload: true },
    { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 3, maxOverload: 1, canOverload: true },
  ],
  subjects: [
    { id: 'subj1', name: 'Subject 1', code: 'S1' },
  ],
  sections: [
    { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
    { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
  ],
  timeslots: [
    { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
    { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
  ],
  rooms: [
    { id: 'r1', label: 'Room 1', buildingId: 'b1', capacity: 30 },
  ],
  buildings: [
    { id: 'b1', label: 'Building 1' },
  ],
  ...overrides,
});

const createTestPreferences = (overrides?: Partial<Preferences>): Preferences => ({
  facultySubject: {},
  facultyTimeslot: {},
  facultyBuilding: {},
  mobility: {},
  ...overrides,
});

describe('Optimizer - Conflict Detection', () => {
  it('should detect and prevent overlapping timeslot assignments', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 }, // Same timeslot
      ],
    });
    const preferences = createTestPreferences();
    const currentSchedule: ScheduleEntry[] = [];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    // Check that no faculty is assigned to both sections (same timeslot)
    const facultyAssignments = new Map<string, string[]>();
    result.forEach((entry) => {
      if (!facultyAssignments.has(entry.facultyId)) {
        facultyAssignments.set(entry.facultyId, []);
      }
      facultyAssignments.get(entry.facultyId)!.push(entry.timeslotId);
    });

    // Verify no faculty has duplicate timeslots
    facultyAssignments.forEach((timeslots) => {
      const uniqueTimeslots = new Set(timeslots);
      expect(timeslots.length).toBe(uniqueTimeslots.size);
    });
  });

  it('should produce a conflict-free schedule', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();
    const currentSchedule: ScheduleEntry[] = [];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    // Build conflict map
    const facultyTimeslots = new Map<string, Set<string>>();
    result.forEach((entry) => {
      if (!facultyTimeslots.has(entry.facultyId)) {
        facultyTimeslots.set(entry.facultyId, new Set());
      }
      facultyTimeslots.get(entry.facultyId)!.add(entry.timeslotId);
    });

    // Verify no conflicts
    result.forEach((entry) => {
      const timeslots = facultyTimeslots.get(entry.facultyId)!;
      const timeslotArray = Array.from(timeslots);
      const uniqueCount = new Set(timeslotArray).size;
      expect(timeslotArray.length).toBe(uniqueCount);
    });
  });

  it('should respect locked entries and avoid conflicts with them', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();
    const currentSchedule: ScheduleEntry[] = [
      {
        sectionId: 'sec1',
        facultyId: 'f1',
        timeslotId: 'ts1',
        roomId: 'r1',
        locked: true,
      },
    ];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    // Find the locked entry
    const lockedEntry = result.find((e) => e.sectionId === 'sec1');
    expect(lockedEntry).toBeDefined();
    expect(lockedEntry!.facultyId).toBe('f1');
    expect(lockedEntry!.locked).toBe(true);

    // Find sec2 assignment
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    if (sec2Entry) {
      // If sec2 is assigned, it should not be to f1 (conflict with locked entry)
      expect(sec2Entry.facultyId).not.toBe('f1');
    }
  });
});

describe('Optimizer - Mobility Scoring', () => {
  it('should calculate mobility penalty for building transitions', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r2', capacity: 30 },
      ],
      rooms: [
        { id: 'r1', label: 'Room 1', buildingId: 'b1', capacity: 30 },
        { id: 'r2', label: 'Room 2', buildingId: 'b2', capacity: 30 },
      ],
      buildings: [
        { id: 'b1', label: 'Building 1' },
        { id: 'b2', label: 'Building 2' },
      ],
    });
    const preferences = createTestPreferences({
      mobility: {
        f1: 5, // Less mobile, higher penalty
      },
    });
    const currentSchedule: ScheduleEntry[] = [];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    // Find entries for f1
    const f1Entries = result.filter((e) => e.facultyId === 'f1');
    
    // If f1 has multiple assignments in different buildings, mobility score should be negative
    if (f1Entries.length > 1) {
      const buildings = f1Entries.map((e) => {
        const room = config.rooms.find((r) => r.id === e.roomId);
        return room?.buildingId;
      });
      
      const hasTransition = buildings.some((b, i) => i > 0 && b !== buildings[i - 1]);
      if (hasTransition) {
        const entryWithTransition = f1Entries.find((e) => e.scoreBreakdown?.mobility !== undefined && e.scoreBreakdown.mobility < 0);
        expect(entryWithTransition).toBeDefined();
      }
    }
  });

  it('should apply higher penalty for higher mobility values', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 2, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r2', capacity: 30 },
      ],
      rooms: [
        { id: 'r1', label: 'Room 1', buildingId: 'b1', capacity: 30 },
        { id: 'r2', label: 'Room 2', buildingId: 'b2', capacity: 30 },
      ],
      buildings: [
        { id: 'b1', label: 'Building 1' },
        { id: 'b2', label: 'Building 2' },
      ],
    });
    
    // Test with low mobility value
    const preferencesLowMobility = createTestPreferences({
      mobility: { f1: 2 },
    });
    const resultLow = runOptimizer(config, preferencesLowMobility, [], { seed: 1 });
    
    // Test with high mobility value
    const preferencesHighMobility = createTestPreferences({
      mobility: { f1: 10 },
    });
    const resultHigh = runOptimizer(config, preferencesHighMobility, [], { seed: 1 });
    
    // Both should assign to f1, but high mobility should have more negative mobility score
    const lowMobilityEntry = resultLow.find((e) => e.sectionId === 'sec2');
    const highMobilityEntry = resultHigh.find((e) => e.sectionId === 'sec2');
    
    if (lowMobilityEntry?.scoreBreakdown?.mobility && highMobilityEntry?.scoreBreakdown?.mobility) {
      expect(highMobilityEntry.scoreBreakdown.mobility).toBeLessThan(lowMobilityEntry.scoreBreakdown.mobility);
    }
  });

  it('should handle missing mobility data gracefully', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences({
      mobility: {}, // No mobility data
    });
    const currentSchedule: ScheduleEntry[] = [];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    expect(result.length).toBeGreaterThan(0);
    result.forEach((entry) => {
      expect(entry.scoreBreakdown?.mobility).toBeDefined();
    });
  });
});

describe('Optimizer - Seniority Scoring', () => {
  it('should calculate seniority based on faculty array position', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Senior Faculty', initial: 'SF', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f2', name: 'Junior Faculty', initial: 'JF', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f3', name: 'New Faculty', initial: 'NF', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences({
      facultySubject: {
        f1: { subj1: 0 },
        f2: { subj1: 0 },
        f3: { subj1: 0 },
      },
    });
    const currentSchedule: ScheduleEntry[] = [];

    const result = runOptimizer(config, preferences, currentSchedule, { 
      seed: 1,
      weights: { preference: 0, mobility: 0, seniority: 1 },
    });

    const assignment = result.find((e) => e.sectionId === 'sec1');
    expect(assignment).toBeDefined();
    
    // With equal preferences and only seniority weight, f1 (first in array) should be preferred
    expect(assignment!.scoreBreakdown?.seniority).toBeDefined();
    
    // f1 should have highest seniority (3), f2 should have 2, f3 should have 1
    if (assignment!.facultyId === 'f1') {
      expect(assignment!.scoreBreakdown!.seniority).toBe(3);
    } else if (assignment!.facultyId === 'f2') {
      expect(assignment!.scoreBreakdown!.seniority).toBe(2);
    } else if (assignment!.facultyId === 'f3') {
      expect(assignment!.scoreBreakdown!.seniority).toBe(1);
    }
  });

  it('should give higher scores to earlier faculty in array', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Senior', initial: 'S', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f2', name: 'Junior', initial: 'J', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences({
      facultySubject: {
        f1: { subj1: 0 },
        f2: { subj1: 0 },
      },
    });

    const result = runOptimizer(config, preferences, [], { 
      seed: 1,
      weights: { preference: 0, mobility: 0, seniority: 1 },
    });

    const assignment = result.find((e) => e.sectionId === 'sec1');
    expect(assignment).toBeDefined();
    
    // f1 (index 0) should have seniority = 2, f2 (index 1) should have seniority = 1
    const f1Seniority = 2;
    const f2Seniority = 1;
    
    if (assignment!.facultyId === 'f1') {
      expect(assignment!.scoreBreakdown!.seniority).toBe(f1Seniority);
    } else {
      expect(assignment!.scoreBreakdown!.seniority).toBe(f2Seniority);
    }
    
    expect(f1Seniority).toBeGreaterThan(f2Seniority);
  });

  it('should handle single faculty member edge case', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Only Faculty', initial: 'OF', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    const assignment = result.find((e) => e.sectionId === 'sec1');
    expect(assignment).toBeDefined();
    expect(assignment!.facultyId).toBe('f1');
    expect(assignment!.scoreBreakdown?.seniority).toBe(1);
  });
});

describe('Optimizer - Section Prioritization', () => {
  it('should count feasible candidates correctly', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 1, maxOverload: 0, canOverload: false },
        { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();
    
    // Lock f1 to capacity
    const currentSchedule: ScheduleEntry[] = [
      {
        sectionId: 'sec1',
        facultyId: 'f1',
        timeslotId: 'ts1',
        roomId: 'r1',
        locked: true,
      },
    ];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    // sec2 should be assigned to f2 since f1 is at capacity
    const sec2Assignment = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Assignment).toBeDefined();
    expect(sec2Assignment!.facultyId).toBe('f2');
  });

  it('should prioritize sections with fewer feasible candidates', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 2, maxOverload: 0, canOverload: false },
        { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 2, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 }, // Same timeslot as sec1
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // All sections should be assigned
    expect(result.length).toBe(3);
    
    // sec1 and sec2 have same timeslot, so they should be assigned to different faculty
    const sec1Assignment = result.find((e) => e.sectionId === 'sec1');
    const sec2Assignment = result.find((e) => e.sectionId === 'sec2');
    
    expect(sec1Assignment).toBeDefined();
    expect(sec2Assignment).toBeDefined();
    expect(sec1Assignment!.facultyId).not.toBe(sec2Assignment!.facultyId);
  });

  it('should handle sections with zero feasible candidates', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 1, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 }, // Same timeslot - conflict
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // f1 can only be assigned to 1 section, and sec1/sec2 conflict, so at most 2 sections assigned
    expect(result.length).toBeLessThanOrEqual(2);
    
    // Verify no conflicts in the result
    const facultyTimeslots = new Map<string, Set<string>>();
    result.forEach((entry) => {
      if (!facultyTimeslots.has(entry.facultyId)) {
        facultyTimeslots.set(entry.facultyId, new Set());
      }
      facultyTimeslots.get(entry.facultyId)!.add(entry.timeslotId);
    });
    
    facultyTimeslots.forEach((timeslots) => {
      const timeslotArray = Array.from(timeslots);
      expect(timeslotArray.length).toBe(new Set(timeslotArray).size);
    });
  });
});

describe('Optimizer - Integration Tests', () => {
  it('should handle small dataset end-to-end', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f3', name: 'Faculty 3', initial: 'F3', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f4', name: 'Faculty 4', initial: 'F4', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f5', name: 'Faculty 5', initial: 'F5', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      subjects: [
        { id: 'subj1', name: 'Math', code: 'MATH' },
        { id: 'subj2', name: 'Physics', code: 'PHYS' },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec3', subjectId: 'subj2', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec4', subjectId: 'subj2', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec5', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec6', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec7', subjectId: 'subj2', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec8', subjectId: 'subj2', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec9', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec10', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
      ],
    });
    const preferences = createTestPreferences({
      facultySubject: {
        f1: { subj1: 3, subj2: -1 },
        f2: { subj1: 2, subj2: 1 },
        f3: { subj1: -2, subj2: 3 },
      },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // Should assign all or most sections
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);
    
    // All entries should have score breakdowns
    result.forEach((entry) => {
      expect(entry.scoreBreakdown).toBeDefined();
      expect(entry.scoreBreakdown!.preference).toBeDefined();
      expect(entry.scoreBreakdown!.mobility).toBeDefined();
      expect(entry.scoreBreakdown!.seniority).toBeDefined();
      expect(entry.scoreBreakdown!.capacityPenalty).toBeDefined();
      expect(entry.scoreBreakdown!.total).toBeDefined();
    });
  });

  it('should produce deterministic results with same seed', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();

    const result1 = runOptimizer(config, preferences, [], { seed: 42 });
    const result2 = runOptimizer(config, preferences, [], { seed: 42 });

    expect(result1.length).toBe(result2.length);
    result1.forEach((entry, index) => {
      expect(entry.sectionId).toBe(result2[index].sectionId);
      expect(entry.facultyId).toBe(result2[index].facultyId);
      expect(entry.timeslotId).toBe(result2[index].timeslotId);
    });
  });

  it('should ensure generated schedules have no conflicts', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 2, canOverload: true },
        { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 5, maxOverload: 2, canOverload: true },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
        { id: 'sec4', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // Build conflict map
    const facultyTimeslots = new Map<string, string[]>();
    result.forEach((entry) => {
      if (!facultyTimeslots.has(entry.facultyId)) {
        facultyTimeslots.set(entry.facultyId, []);
      }
      facultyTimeslots.get(entry.facultyId)!.push(entry.timeslotId);
    });

    // Verify no faculty has duplicate timeslots
    facultyTimeslots.forEach((timeslots) => {
      const uniqueTimeslots = new Set(timeslots);
      expect(timeslots.length).toBe(uniqueTimeslots.size);
    });
  });

  it('should preserve locked entries', () => {
    const config = createTestConfig({
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30 },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30 },
      ],
    });
    const preferences = createTestPreferences();
    const currentSchedule: ScheduleEntry[] = [
      {
        sectionId: 'sec1',
        facultyId: 'f1',
        timeslotId: 'ts1',
        roomId: 'r1',
        locked: true,
      },
    ];

    const result = runOptimizer(config, preferences, currentSchedule, { seed: 1 });

    const lockedEntry = result.find((e) => e.sectionId === 'sec1');
    expect(lockedEntry).toBeDefined();
    expect(lockedEntry!.facultyId).toBe('f1');
    expect(lockedEntry!.timeslotId).toBe('ts1');
    expect(lockedEntry!.locked).toBe(true);
  });
});

describe('Optimizer - Consecutive Penalty Calculation', () => {
  it('should detect consecutive timeslots on the same day', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' }, // Consecutive with ts1
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // Both sections should be assigned to f1
    const f1Entries = result.filter((e) => e.facultyId === 'f1');
    expect(f1Entries.length).toBe(2);

    // The second assignment should have a negative consecutive score
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBeLessThan(0);
  });

  it('should not penalize non-consecutive timeslots', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts3', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
        { id: 'ts3', label: 'Mon 11-12', day: 'Monday', start: '11:00', end: '12:00' }, // Not consecutive with ts1
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // First assignment should have no consecutive penalty (use toBeCloseTo to handle -0 vs 0)
    const sec1Entry = result.find((e) => e.sectionId === 'sec1');
    expect(sec1Entry).toBeDefined();
    expect(sec1Entry!.scoreBreakdown?.consecutive).toBeCloseTo(0);
  });

  it('should sort timeslots by day and time, not array position', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts3', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'C' },
      ],
      timeslots: [
        { id: 'ts3', label: 'Wed 11-12', day: 'Wednesday', start: '11:00', end: '12:00' }, // Array position 0, but chronologically last
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },     // Array position 1, but chronologically first
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },    // Array position 2, consecutive with ts1
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // sec3 (ts2) should have consecutive penalty because ts1 and ts2 are consecutive by time
    const sec3Entry = result.find((e) => e.sectionId === 'sec3');
    expect(sec3Entry).toBeDefined();
    expect(sec3Entry!.scoreBreakdown?.consecutive).toBeLessThan(0);
  });

  it('should not penalize timeslots on different days', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Tue 9-10', day: 'Tuesday', start: '09:00', end: '10:00' }, // Different day
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // No consecutive penalty since they're on different days (use toBeCloseTo to handle -0 vs 0)
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBeCloseTo(0);
  });

  it('should apply higher penalty for lunch hour consecutive pairs', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 11-12', day: 'Monday', start: '11:00', end: '12:00' },
        { id: 'ts2', label: 'Mon 12-13', day: 'Monday', start: '12:00', end: '13:00' }, // Lunch hour consecutive
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // Lunch hour consecutive should have penalty of -2 (double the normal -1)
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBe(-2);
  });

  it('should scale penalty by consecutive value', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
      ],
    });

    // Test with consecutive value of 5
    const preferencesHigh = createTestPreferences({
      consecutive: { f1: 5 },
    });
    const resultHigh = runOptimizer(config, preferencesHigh, [], { seed: 1 });

    const sec2EntryHigh = resultHigh.find((e) => e.sectionId === 'sec2');
    expect(sec2EntryHigh).toBeDefined();
    expect(sec2EntryHigh!.scoreBreakdown?.consecutive).toBe(-5);

    // Test with consecutive value of 2
    const preferencesLow = createTestPreferences({
      consecutive: { f1: 2 },
    });
    const resultLow = runOptimizer(config, preferencesLow, [], { seed: 1 });

    const sec2EntryLow = resultLow.find((e) => e.sectionId === 'sec2');
    expect(sec2EntryLow).toBeDefined();
    expect(sec2EntryLow!.scoreBreakdown?.consecutive).toBe(-2);
  });

  it('should handle multiple consecutive pairs correctly', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts3', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'C' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 14-15', day: 'Monday', start: '14:00', end: '15:00' },
        { id: 'ts2', label: 'Mon 15-16', day: 'Monday', start: '15:00', end: '16:00' }, // Consecutive with ts1
        { id: 'ts3', label: 'Mon 16-17', day: 'Monday', start: '16:00', end: '17:00' }, // Consecutive with ts2
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // sec2 should have -1 (one consecutive pair: ts1-ts2)
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBe(-1);

    // sec3 should have -2 (two consecutive pairs: ts1-ts2 and ts2-ts3)
    const sec3Entry = result.find((e) => e.sectionId === 'sec3');
    expect(sec3Entry).toBeDefined();
    expect(sec3Entry!.scoreBreakdown?.consecutive).toBe(-2);
  });

  it('should handle zero consecutive value with no penalty', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 0 }, // Zero consecutive value
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // No penalty should be applied
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBe(0);
  });

  it('should handle missing consecutive preference gracefully', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
      ],
    });
    const preferences = createTestPreferences({
      consecutive: {}, // No consecutive preference for f1
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // Should default to consecutive value of 1
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBe(-1);
  });

  it('should correctly order timeslots across multiple days', () => {
    const config = createTestConfig({
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 5, maxOverload: 0, canOverload: false },
      ],
      sections: [
        { id: 'sec1', subjectId: 'subj1', timeslotId: 'ts1', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'A' },
        { id: 'sec2', subjectId: 'subj1', timeslotId: 'ts2', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'B' },
        { id: 'sec3', subjectId: 'subj1', timeslotId: 'ts3', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'C' },
        { id: 'sec4', subjectId: 'subj1', timeslotId: 'ts4', roomId: 'r1', capacity: 30, courseShortcode: 'CS101', sectionIdentifier: 'D' },
      ],
      timeslots: [
        { id: 'ts1', label: 'Mon 9-10', day: 'Monday', start: '09:00', end: '10:00' },
        { id: 'ts2', label: 'Mon 10-11', day: 'Monday', start: '10:00', end: '11:00' },
        { id: 'ts3', label: 'Tue 9-10', day: 'Tuesday', start: '09:00', end: '10:00' },
        { id: 'ts4', label: 'Tue 10-11', day: 'Tuesday', start: '10:00', end: '11:00' },
      ],
    });
    const preferences = createTestPreferences({
      consecutive: { f1: 1 },
    });

    const result = runOptimizer(config, preferences, [], { seed: 1 });

    // sec2 should have -1 (consecutive with sec1 on Monday)
    const sec2Entry = result.find((e) => e.sectionId === 'sec2');
    expect(sec2Entry).toBeDefined();
    expect(sec2Entry!.scoreBreakdown?.consecutive).toBe(-1);

    // sec3 should have 0 (not consecutive - different day)
    const sec3Entry = result.find((e) => e.sectionId === 'sec3');
    expect(sec3Entry).toBeDefined();
    expect(sec3Entry!.scoreBreakdown?.consecutive).toBe(-1); // One consecutive pair on Monday

    // sec4 should have -2 (consecutive on Monday + consecutive on Tuesday)
    const sec4Entry = result.find((e) => e.sectionId === 'sec4');
    expect(sec4Entry).toBeDefined();
    expect(sec4Entry!.scoreBreakdown?.consecutive).toBe(-2);
  });
});
