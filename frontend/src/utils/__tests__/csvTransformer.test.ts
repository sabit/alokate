import { describe, it, expect } from 'vitest';
import {
  sanitizeId,
  generateFacultyId,
  generateSubjectId,
  generateTimeslotId,
  generateBuildingId,
  generateRoomId,
  generateSectionId,
  transformFacultyData,
  transformRoomsData,
  mergeConfigData,
} from '../csvTransformer';
import type { ParsedFacultyRow, ParsedRoomRow } from '../../types';

describe('CSV Transformer', () => {
  describe('ID generation', () => {
    it('should sanitize IDs correctly', () => {
      expect(sanitizeId('MAT2101')).toBe('mat2101');
      expect(sanitizeId('M3 [A]')).toBe('m3-a');
      expect(sanitizeId('Dr. Test')).toBe('dr-test');
    });

    it('should generate faculty IDs', () => {
      expect(generateFacultyId('AM', 'Dr. Test')).toBe('faculty-am');
      expect(generateFacultyId('', 'Dr. Test')).toBe('faculty-dr-test');
    });

    it('should generate subject IDs', () => {
      expect(generateSubjectId('MAT2101')).toBe('subject-mat2101');
    });

    it('should generate timeslot IDs', () => {
      expect(generateTimeslotId('Sunday', '14:40')).toBe('slot-sun-1440');
    });

    it('should generate building IDs', () => {
      expect(generateBuildingId('DS')).toBe('building-ds');
    });

    it('should generate room IDs', () => {
      expect(generateRoomId('DS0605')).toBe('room-ds0605');
    });

    it('should generate section IDs', () => {
      expect(generateSectionId('MAT2101', 'M3 [A]')).toBe('section-mat2101-m3-a');
    });
  });

  describe('transformFacultyData', () => {
    it('should transform faculty rows correctly', () => {
      const rows: ParsedFacultyRow[] = [
        { name: 'Dr. Kh. Abdul Maleque', initial: 'AM' },
        { name: 'Dr. Md Jashim Uddin', initial: 'JU' },
      ];

      const result = transformFacultyData(rows);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'faculty-am',
        name: 'Dr. Kh. Abdul Maleque',
        maxSections: 3,
        maxOverload: 1,
        canOverload: true,
      });
      expect(result[1]).toEqual({
        id: 'faculty-ju',
        name: 'Dr. Md Jashim Uddin',
        maxSections: 3,
        maxOverload: 1,
        canOverload: true,
      });
    });

    it('should handle duplicate IDs', () => {
      const rows: ParsedFacultyRow[] = [
        { name: 'Dr. Test One', initial: 'AM' },
        { name: 'Dr. Test Two', initial: 'AM' },
      ];

      const result = transformFacultyData(rows);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('faculty-am');
      expect(result[1].id).toBe('faculty-am-1');
    });
  });

  describe('transformRoomsData', () => {
    it('should transform rooms data correctly', () => {
      const rows: ParsedRoomRow[] = [
        {
          slNo: '01548',
          course: 'MAT2101',
          capacity: 40,
          registration: 40,
          section: 'M3 [A]',
          slotDay: 'Sunday',
          slotTime: '2:40 PM',
          room: 'DS0605',
        },
      ];

      const result = transformRoomsData(rows);

      expect(result.subjects).toHaveLength(1);
      expect(result.subjects[0]).toEqual({
        id: 'subject-mat2101',
        name: 'MAT2101',
        code: 'MAT2101',
      });

      expect(result.timeslots).toHaveLength(1);
      expect(result.timeslots[0]).toEqual({
        id: 'slot-sun-1440',
        label: 'Sunday 14:40–16:10',
        day: 'Sunday',
        start: '14:40',
        end: '16:10',
      });

      expect(result.buildings).toHaveLength(1);
      expect(result.buildings[0]).toEqual({
        id: 'building-ds',
        label: 'DS',
      });

      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0]).toEqual({
        id: 'room-ds0605',
        label: 'DS DS0605',
        buildingId: 'building-ds',
        capacity: 40,
      });

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0]).toEqual({
        id: 'section-mat2101-m3-a',
        subjectId: 'subject-mat2101',
        timeslotId: 'slot-sun-1440',
        roomId: 'room-ds0605',
        capacity: 40,
      });
    });

    it('should deduplicate entities', () => {
      const rows: ParsedRoomRow[] = [
        {
          slNo: '01548',
          course: 'MAT2101',
          capacity: 40,
          registration: 40,
          section: 'M3 [A]',
          slotDay: 'Sunday',
          slotTime: '2:40 PM',
          room: 'DS0605',
        },
        {
          slNo: '01549',
          course: 'MAT2101',
          capacity: 40,
          registration: 40,
          section: 'M3 [B]',
          slotDay: 'Sunday',
          slotTime: '2:40 PM',
          room: 'DS0606',
        },
      ];

      const result = transformRoomsData(rows);

      expect(result.subjects).toHaveLength(1);
      expect(result.timeslots).toHaveLength(1);
      expect(result.buildings).toHaveLength(1);
      expect(result.rooms).toHaveLength(2);
      expect(result.sections).toHaveLength(2);
    });
  });

  describe('mergeConfigData', () => {
    it('should merge faculty and rooms data', () => {
      const faculty = transformFacultyData([
        { name: 'Dr. Test', initial: 'AM' },
      ]);

      const roomsData = transformRoomsData([
        {
          slNo: '01548',
          course: 'MAT2101',
          capacity: 40,
          registration: 40,
          section: 'M3 [A]',
          slotDay: 'Sunday',
          slotTime: '2:40 PM',
          room: 'DS0605',
        },
      ]);

      const result = mergeConfigData(faculty, roomsData);

      expect(result.faculty).toHaveLength(1);
      expect(result.subjects).toHaveLength(1);
      expect(result.timeslots).toHaveLength(1);
      expect(result.buildings).toHaveLength(1);
      expect(result.rooms).toHaveLength(1);
      expect(result.sections).toHaveLength(1);
    });
  });
});
