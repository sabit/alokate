import { describe, it, expect } from 'vitest';
import { parseFacultyCSV, parseRoomsCSV, CSVParseError } from '../csvParser';

describe('CSV Parser', () => {
  describe('parseFacultyCSV', () => {
    it('should parse valid faculty CSV', () => {
      const csvText = `Name,Initial
Dr. Kh. Abdul Maleque,AM
Dr. Md Jashim Uddin,JU
Prodip Kumar Ghose ,PK`;

      const result = parseFacultyCSV(csvText);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Dr. Kh. Abdul Maleque', initial: 'AM' });
      expect(result[1]).toEqual({ name: 'Dr. Md Jashim Uddin', initial: 'JU' });
      expect(result[2]).toEqual({ name: 'Prodip Kumar Ghose', initial: 'PK' });
    });

    it('should throw error for missing Name field', () => {
      const csvText = `Name,Initial
,AM`;

      expect(() => parseFacultyCSV(csvText)).toThrow(CSVParseError);
      expect(() => parseFacultyCSV(csvText)).toThrow("Missing required field 'Name'");
    });

    it('should throw error for missing Initial field', () => {
      const csvText = `Name,Initial
Dr. Test,`;

      expect(() => parseFacultyCSV(csvText)).toThrow(CSVParseError);
      expect(() => parseFacultyCSV(csvText)).toThrow("Missing required field 'Initial'");
    });
  });

  describe('parseRoomsCSV', () => {
    it('should parse valid rooms CSV', () => {
      const csvText = `Sl No,Course,Capacity,Registration,Section,Slot Day,Slot Time,Room
01548,MAT2101,40,40,M3 [A],Sunday,2:40 PM,DS0605
01574,MAT2101,40,40,M3 [AA],Sunday,11:20 AM,DS0608`;

      const result = parseRoomsCSV(csvText);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        slNo: '01548',
        course: 'MAT2101',
        capacity: 40,
        registration: 40,
        section: 'M3 [A]',
        courseShortcode: 'M3',
        sectionIdentifier: 'A',
        slotDay: 'Sunday',
        slotTime: '2:40 PM',
        room: 'DS0605',
      });
      expect(result[1]).toEqual({
        slNo: '01574',
        course: 'MAT2101',
        capacity: 40,
        registration: 40,
        section: 'M3 [AA]',
        courseShortcode: 'M3',
        sectionIdentifier: 'AA',
        slotDay: 'Sunday',
        slotTime: '11:20 AM',
        room: 'DS0608',
      });
    });

    it('should throw error for missing required field', () => {
      const csvText = `Sl No,Course,Capacity,Registration,Section,Slot Day,Slot Time,Room
01548,,40,40,M3 [A],Sunday,2:40 PM,DS0605`;

      expect(() => parseRoomsCSV(csvText)).toThrow(CSVParseError);
      expect(() => parseRoomsCSV(csvText)).toThrow("Missing required field 'course'");
    });

    it('should throw error for invalid capacity', () => {
      const csvText = `Sl No,Course,Capacity,Registration,Section,Slot Day,Slot Time,Room
01548,MAT2101,invalid,40,M3 [A],Sunday,2:40 PM,DS0605`;

      expect(() => parseRoomsCSV(csvText)).toThrow(CSVParseError);
      expect(() => parseRoomsCSV(csvText)).toThrow('Invalid capacity value');
    });
  });
});
