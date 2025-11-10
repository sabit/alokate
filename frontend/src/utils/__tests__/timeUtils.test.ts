import { describe, it, expect } from 'vitest';
import { parseTime12to24, calculateEndTime } from '../timeUtils';

describe('Time Utilities', () => {
  describe('parseTime12to24', () => {
    it('should convert AM times correctly', () => {
      expect(parseTime12to24('8:00 AM')).toBe('08:00');
      expect(parseTime12to24('11:20 AM')).toBe('11:20');
      expect(parseTime12to24('1:15 AM')).toBe('01:15');
    });

    it('should convert PM times correctly', () => {
      expect(parseTime12to24('2:40 PM')).toBe('14:40');
      expect(parseTime12to24('5:30 PM')).toBe('17:30');
      expect(parseTime12to24('11:45 PM')).toBe('23:45');
    });

    it('should handle midnight correctly', () => {
      expect(parseTime12to24('12:00 AM')).toBe('00:00');
      expect(parseTime12to24('12:30 AM')).toBe('00:30');
    });

    it('should handle noon correctly', () => {
      expect(parseTime12to24('12:00 PM')).toBe('12:00');
      expect(parseTime12to24('12:45 PM')).toBe('12:45');
    });

    it('should throw error for invalid format', () => {
      expect(() => parseTime12to24('25:00 PM')).toThrow('Invalid hours');
      expect(() => parseTime12to24('8:00')).toThrow('Invalid time format');
      expect(() => parseTime12to24('invalid')).toThrow('Invalid time format');
    });
  });

  describe('calculateEndTime', () => {
    it('should add duration correctly', () => {
      expect(calculateEndTime('08:00', 90)).toBe('09:30');
      expect(calculateEndTime('14:40', 90)).toBe('16:10');
      expect(calculateEndTime('10:00', 60)).toBe('11:00');
    });

    it('should handle hour boundary correctly', () => {
      expect(calculateEndTime('09:45', 30)).toBe('10:15');
      expect(calculateEndTime('23:30', 45)).toBe('00:15');
    });

    it('should throw error for invalid format', () => {
      expect(() => calculateEndTime('8:00', 90)).toThrow('Invalid time format');
      expect(() => calculateEndTime('25:00', 90)).toThrow('Invalid hours');
    });
  });
});
