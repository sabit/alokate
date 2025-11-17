/**
 * CSV Data Transformation Utilities
 * Transforms parsed CSV data into ConfigData structure
 */

import type {
  ConfigData,
  Faculty,
  Subject,
  Timeslot,
  Building,
  Room,
  Section,
  ParsedFacultyRow,
  ParsedRoomRow,
} from '../types';
import { parseTime12to24, calculateEndTime } from './timeUtils';

/**
 * Sanitizes a string to be used as an ID by removing special characters and spaces
 * @param str - String to sanitize
 * @returns Sanitized string suitable for use as an ID
 */
export function sanitizeId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a faculty ID from initial or name
 * @param initial - Faculty initial
 * @param name - Faculty name (fallback if initial is not suitable)
 * @returns Faculty ID in format "faculty-{sanitized-initial}"
 */
export function generateFacultyId(initial: string, name: string): string {
  const sanitized = sanitizeId(initial || name);
  return `faculty-${sanitized}`;
}

/**
 * Generates a subject ID from course code
 * @param courseCode - Course code (e.g., "MAT2101")
 * @returns Subject ID in format "subject-{sanitized-code}"
 */
export function generateSubjectId(courseCode: string): string {
  const sanitized = sanitizeId(courseCode);
  return `subject-${sanitized}`;
}

/**
 * Generates a timeslot ID from day and time
 * @param day - Day of week
 * @param time24 - Time in 24-hour format (e.g., "14:40")
 * @returns Timeslot ID in format "slot-{day-abbrev}-{time}"
 */
export function generateTimeslotId(day: string, time24: string): string {
  const dayAbbrev = day.substring(0, 3).toLowerCase();
  const timeStr = time24.replace(':', '');
  return `slot-${dayAbbrev}-${timeStr}`;
}

/**
 * Generates a building ID from building prefix
 * @param buildingPrefix - Building prefix (e.g., "DS", "DN")
 * @returns Building ID in format "building-{prefix}"
 */
export function generateBuildingId(buildingPrefix: string): string {
  const sanitized = sanitizeId(buildingPrefix);
  return `building-${sanitized}`;
}

/**
 * Generates a room ID from room code
 * @param roomCode - Room code (e.g., "DS0605")
 * @returns Room ID in format "room-{sanitized-code}"
 */
export function generateRoomId(roomCode: string): string {
  const sanitized = sanitizeId(roomCode);
  return `room-${sanitized}`;
}

/**
 * Generates a section ID from course code and section identifier
 * @param courseCode - Course code (e.g., "MAT2101")
 * @param section - Section identifier (e.g., "M3 [A]")
 * @returns Section ID in format "section-{course}-{section}"
 */
export function generateSectionId(courseCode: string, section: string): string {
  const courseSanitized = sanitizeId(courseCode);
  const sectionSanitized = sanitizeId(section);
  return `section-${courseSanitized}-${sectionSanitized}`;
}

/**
 * Transforms parsed faculty CSV data into Faculty objects
 * @param rows - Array of parsed faculty rows
 * @returns Array of Faculty objects with generated IDs and default values
 */
export function transformFacultyData(rows: ParsedFacultyRow[]): Faculty[] {
  const faculty: Faculty[] = [];
  const usedIds = new Set<string>();

  for (const row of rows) {
    // Trim whitespace from name
    const name = row.name.trim();
    const initial = row.initial.trim();

    // Generate unique ID
    let id = generateFacultyId(initial, name);
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${generateFacultyId(initial, name)}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    // Create faculty object with defaults
    faculty.push({
      id,
      name,
      initial,
      maxSections: 5,
      maxOverload: 1,
      canOverload: false,
    });
  }

  return faculty;
}

/**
 * Extracts building prefix from room code
 * @param roomCode - Room code (e.g., "DS0605", "3207")
 * @returns Building prefix (e.g., "DS", "3")
 */
function extractBuildingPrefix(roomCode: string): string {
  // Match letters at the start, or first digit(s) for numeric buildings
  const match = roomCode.match(/^([A-Z]+)|^(\d)/);
  if (match) {
    return match[1] || match[2];
  }
  // Fallback: use first character
  return roomCode.charAt(0);
}

/**
 * Transforms parsed rooms CSV data into related entities
 * @param rows - Array of parsed room rows
 * @returns Object containing subjects, timeslots, buildings, rooms, and sections
 */
export function transformRoomsData(rows: ParsedRoomRow[]): {
  subjects: Subject[];
  timeslots: Timeslot[];
  buildings: Building[];
  rooms: Room[];
  sections: Section[];
} {
  // Maps to track unique entities
  const subjectsMap = new Map<string, Subject>();
  const timeslotsMap = new Map<string, Timeslot>();
  const buildingsMap = new Map<string, Building>();
  const roomsMap = new Map<string, Room>();
  const sections: Section[] = [];
  
  // Track course shortcode to course code mapping for validation
  const shortcodeToCodeMap = new Map<string, string>();

  for (const row of rows) {
    const courseCode = row.course.trim();
    const courseShortcode = row.courseShortcode.trim();
    const sectionName = row.section.trim();
    const day = row.slotDay.trim();
    const time12 = row.slotTime.trim();
    const roomCode = row.room.trim();
    
    // Validate course shortcode uniqueness
    const existingCourseCode = shortcodeToCodeMap.get(courseShortcode);
    if (existingCourseCode && existingCourseCode !== courseCode) {
      throw new Error(
        `Course shortcode "${courseShortcode}" maps to multiple course codes: "${existingCourseCode}" and "${courseCode}". Each shortcode must correspond to exactly one course.`
      );
    }
    shortcodeToCodeMap.set(courseShortcode, courseCode);

    // Extract and deduplicate subjects
    const subjectId = generateSubjectId(courseCode);
    if (!subjectsMap.has(subjectId)) {
      subjectsMap.set(subjectId, {
        id: subjectId,
        name: courseCode,
        code: courseShortcode,
      });
    }

    // Parse and deduplicate timeslots
    let time24: string;
    try {
      time24 = parseTime12to24(time12);
    } catch (error) {
      throw new Error(
        `Failed to parse time "${time12}" for section ${sectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const endTime = calculateEndTime(time24, 90); // Assume 1.5 hour (90 minutes) duration
    const timeslotId = generateTimeslotId(day, time24);
    
    if (!timeslotsMap.has(timeslotId)) {
      timeslotsMap.set(timeslotId, {
        id: timeslotId,
        label: `${day} ${time24}–${endTime}`,
        day,
        start: time24,
        end: endTime,
      });
    }

    // Extract and deduplicate buildings
    const buildingPrefix = extractBuildingPrefix(roomCode);
    const buildingId = generateBuildingId(buildingPrefix);
    
    if (!buildingsMap.has(buildingId)) {
      buildingsMap.set(buildingId, {
        id: buildingId,
        label: buildingPrefix,
      });
    }

    // Deduplicate rooms
    const roomId = generateRoomId(roomCode);
    
    if (!roomsMap.has(roomId)) {
      roomsMap.set(roomId, {
        id: roomId,
        label: `${buildingPrefix} ${roomCode}`,
        buildingId,
        capacity: row.capacity,
      });
    }

    // Create section with all references
    const sectionId = generateSectionId(courseCode, sectionName);
    sections.push({
      id: sectionId,
      subjectId,
      timeslotId,
      roomId,
      capacity: row.capacity,
      courseShortcode: row.courseShortcode,
      sectionIdentifier: row.sectionIdentifier,
    });
  }

  return {
    subjects: Array.from(subjectsMap.values()),
    timeslots: Array.from(timeslotsMap.values()),
    buildings: Array.from(buildingsMap.values()),
    rooms: Array.from(roomsMap.values()),
    sections,
  };
}

/**
 * Merges faculty and rooms data into a complete ConfigData object
 * @param faculty - Array of Faculty objects
 * @param roomsData - Object containing subjects, timeslots, buildings, rooms, and sections
 * @returns Complete ConfigData object
 * @throws Error if validation fails
 */
export function mergeConfigData(
  faculty: Faculty[],
  roomsData: {
    subjects: Subject[];
    timeslots: Timeslot[];
    buildings: Building[];
    rooms: Room[];
    sections: Section[];
  }
): ConfigData {
  const { subjects, timeslots, buildings, rooms, sections } = roomsData;

  // Create lookup sets for validation
  const subjectIds = new Set(subjects.map((s) => s.id));
  const timeslotIds = new Set(timeslots.map((t) => t.id));
  const roomIds = new Set(rooms.map((r) => r.id));
  const buildingIds = new Set(buildings.map((b) => b.id));

  // Validate all section references
  const errors: string[] = [];

  for (const section of sections) {
    if (!subjectIds.has(section.subjectId)) {
      errors.push(
        `Section ${section.id} references non-existent subject ${section.subjectId}`
      );
    }
    if (!timeslotIds.has(section.timeslotId)) {
      errors.push(
        `Section ${section.id} references non-existent timeslot ${section.timeslotId}`
      );
    }
    if (!roomIds.has(section.roomId)) {
      errors.push(
        `Section ${section.id} references non-existent room ${section.roomId}`
      );
    }
  }

  // Validate all room references to buildings
  for (const room of rooms) {
    if (!buildingIds.has(room.buildingId)) {
      errors.push(
        `Room ${room.id} references non-existent building ${room.buildingId}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}`
    );
  }

  // Return complete ConfigData object
  return {
    faculty,
    subjects,
    timeslots,
    buildings,
    rooms,
    sections,
  };
}
