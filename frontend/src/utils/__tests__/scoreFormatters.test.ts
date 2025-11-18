import { describe, it, expect } from 'vitest';
import {
  formatScore,
  calculatePreferenceBreakdown,
  buildScoreTooltip,
  type PreferenceBreakdown,
} from '../scoreFormatters';
import type { ConfigData, Preferences } from '../../types';
import type { GridAssignment } from '../../hooks/useScheduleGrid';

describe('Score Formatters', () => {
  describe('formatScore', () => {
    it('should format positive values with + prefix', () => {
      expect(formatScore(2.5)).toBe('+2.5');
      expect(formatScore(1.0)).toBe('+1.0');
      expect(formatScore(0.1)).toBe('+0.1');
    });

    it('should format negative values with - prefix', () => {
      expect(formatScore(-2.5)).toBe('-2.5');
      expect(formatScore(-1.0)).toBe('-1.0');
      expect(formatScore(-0.1)).toBe('-0.1');
    });

    it('should format zero as 0.0', () => {
      expect(formatScore(0)).toBe('0.0');
      expect(formatScore(-0)).toBe('0.0');
    });

    it('should round to one decimal place', () => {
      expect(formatScore(2.56)).toBe('+2.6');
      expect(formatScore(2.54)).toBe('+2.5');
      expect(formatScore(-1.46)).toBe('-1.5');
      expect(formatScore(-1.44)).toBe('-1.4');
    });
  });

  describe('calculatePreferenceBreakdown', () => {
    const mockConfig: ConfigData = {
      sections: [
        { id: 'sec1', subjectId: 'subj1', roomId: 'room1', timeslotId: 'ts1' },
        { id: 'sec2', subjectId: 'subj2', roomId: 'room2', timeslotId: 'ts2' },
      ],
      subjects: [],
      faculty: [],
      rooms: [],
      timeslots: [],
      buildings: [],
    };

    it('should calculate breakdown with all preferences present', () => {
      const preferences: Preferences = {
        facultySubject: {
          fac1: { subj1: 3 },
        },
        facultyTimeslot: {
          fac1: { ts1: 2 },
        },
        facultyBuilding: {
          fac1: { bldg1: -1 },
        },
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result).toEqual({
        subject: 3,
        timeslot: 2,
        building: -1,
        total: 4,
      });
    });

    it('should handle missing subject preference', () => {
      const preferences: Preferences = {
        facultySubject: {},
        facultyTimeslot: {
          fac1: { ts1: 1 },
        },
        facultyBuilding: {
          fac1: { bldg1: -2 },
        },
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result.subject).toBe(0);
      expect(result.total).toBe(-1);
    });

    it('should handle missing timeslot preference', () => {
      const preferences: Preferences = {
        facultySubject: {
          fac1: { subj1: 2 },
        },
        facultyTimeslot: {},
        facultyBuilding: {
          fac1: { bldg1: 1 },
        },
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result.timeslot).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should handle missing building preference', () => {
      const preferences: Preferences = {
        facultySubject: {
          fac1: { subj1: 1 },
        },
        facultyTimeslot: {
          fac1: { ts1: 2 },
        },
        facultyBuilding: {},
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result.building).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should return 0 for building when buildingId is undefined', () => {
      const preferences: Preferences = {
        facultySubject: {
          fac1: { subj1: 2 },
        },
        facultyTimeslot: {
          fac1: { ts1: 1 },
        },
        facultyBuilding: {
          fac1: { bldg1: -3 },
        },
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        undefined,
        preferences,
        mockConfig,
      );

      expect(result.building).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should handle section not found in config', () => {
      const preferences: Preferences = {
        facultySubject: {
          fac1: { subj1: 2 },
        },
        facultyTimeslot: {
          fac1: { ts1: 1 },
        },
        facultyBuilding: {},
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'nonexistent',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result.subject).toBe(0);
      expect(result.total).toBe(1);
    });

    it('should handle all preferences missing', () => {
      const preferences: Preferences = {
        facultySubject: {},
        facultyTimeslot: {},
        facultyBuilding: {},
        mobility: {},
        consecutive: {},
      };

      const result = calculatePreferenceBreakdown(
        'fac1',
        'sec1',
        'ts1',
        'bldg1',
        preferences,
        mockConfig,
      );

      expect(result).toEqual({
        subject: 0,
        timeslot: 0,
        building: 0,
        total: 0,
      });
    });
  });

  describe('buildScoreTooltip', () => {
    const mockPreferenceBreakdown: PreferenceBreakdown = {
      subject: 3,
      timeslot: 2,
      building: -1,
      total: 4,
    };

    it('should build complete tooltip with all data', () => {
      const assignment: GridAssignment = {
        facultyId: 'fac1',
        sectionId: 'sec1',
        timeslotId: 'ts1',
        subjectName: 'Mathematics',
        subjectCode: 'MATH101',
        roomLabel: 'A101',
        buildingLabel: 'Science Building',
        buildingId: 'bldg1',
        score: {
          preference: 4,
          mobility: -1,
          seniority: 5,
          consecutive: -2,
          capacityPenalty: 0,
          total: 6,
        },
      };

      const result = buildScoreTooltip(
        assignment,
        mockPreferenceBreakdown,
        'John Doe',
        'Monday 8:00 AM',
      );

      expect(result).toContain('John Doe at Monday 8:00 AM');
      expect(result).toContain('MATH101 • Mathematics');
      expect(result).toContain('Room: A101 • Building: Science Building');
      expect(result).toContain('Score Breakdown:');
      expect(result).toContain('Preference: +4.0');
      expect(result).toContain('Subject: +3.0');
      expect(result).toContain('Timeslot: +2.0');
      expect(result).toContain('Building: -1.0');
      expect(result).toContain('Mobility: -1.0');
      expect(result).toContain('Seniority: +5.0');
      expect(result).toContain('Consecutive: -2.0');
      expect(result).toContain('Total: +6.0');
    });

    it('should handle assignment without building', () => {
      const assignment: GridAssignment = {
        facultyId: 'fac1',
        sectionId: 'sec1',
        timeslotId: 'ts1',
        subjectName: 'Mathematics',
        subjectCode: 'MATH101',
        roomLabel: 'A101',
        buildingLabel: undefined,
        buildingId: undefined,
        score: {
          preference: 5,
          mobility: 0,
          seniority: 3,
          consecutive: 0,
          capacityPenalty: 0,
          total: 8,
        },
      };

      const breakdown: PreferenceBreakdown = {
        subject: 3,
        timeslot: 2,
        building: 0,
        total: 5,
      };

      const result = buildScoreTooltip(
        assignment,
        breakdown,
        'Jane Smith',
        'Tuesday 10:00 AM',
      );

      expect(result).toContain('Building: N/A');
      expect(result).not.toContain('Building: +0.0');
    });

    it('should handle assignment without score data', () => {
      const assignment: GridAssignment = {
        facultyId: 'fac1',
        sectionId: 'sec1',
        timeslotId: 'ts1',
        subjectName: 'Physics',
        subjectCode: 'PHYS101',
        roomLabel: 'B202',
        buildingLabel: 'Engineering',
        buildingId: 'bldg2',
        score: undefined,
      };

      const result = buildScoreTooltip(
        assignment,
        mockPreferenceBreakdown,
        'Bob Johnson',
        'Wednesday 2:00 PM',
      );

      expect(result).toContain('Bob Johnson at Wednesday 2:00 PM');
      expect(result).toContain('PHYS101 • Physics');
      expect(result).toContain('Score breakdown not available');
      expect(result).not.toContain('Preference:');
    });

    it('should handle assignment without subject code', () => {
      const assignment: GridAssignment = {
        facultyId: 'fac1',
        sectionId: 'sec1',
        timeslotId: 'ts1',
        subjectName: 'Chemistry',
        subjectCode: undefined,
        roomLabel: 'C303',
        buildingLabel: 'Lab Building',
        buildingId: 'bldg3',
        score: {
          preference: 2,
          mobility: -1,
          seniority: 4,
          consecutive: 0,
          capacityPenalty: 0,
          total: 5,
        },
      };

      const result = buildScoreTooltip(
        assignment,
        mockPreferenceBreakdown,
        'Alice Brown',
        'Thursday 11:00 AM',
      );

      expect(result).toContain('Chemistry');
      expect(result).not.toContain('undefined');
    });

    it('should handle assignment without room or building labels', () => {
      const assignment: GridAssignment = {
        facultyId: 'fac1',
        sectionId: 'sec1',
        timeslotId: 'ts1',
        subjectName: 'History',
        subjectCode: 'HIST101',
        roomLabel: undefined,
        buildingLabel: undefined,
        buildingId: undefined,
        score: {
          preference: 1,
          mobility: 0,
          seniority: 2,
          consecutive: -1,
          capacityPenalty: 0,
          total: 2,
        },
      };

      const breakdown: PreferenceBreakdown = {
        subject: 1,
        timeslot: 0,
        building: 0,
        total: 1,
      };

      const result = buildScoreTooltip(
        assignment,
        breakdown,
        'Charlie Davis',
        'Friday 3:00 PM',
      );

      expect(result).toContain('Charlie Davis at Friday 3:00 PM');
      expect(result).toContain('HIST101 • History');
      expect(result).not.toContain('Room:');
      expect(result).toContain('Building: N/A');
      expect(result).toContain('Score Breakdown:');
    });
  });
});
