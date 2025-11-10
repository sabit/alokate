/**
 * Configuration Data Validation Utilities
 * Validates ConfigData structure and entity references
 */

import type { ConfigData } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  context?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a ConfigData object for completeness and referential integrity
 * @param config - ConfigData object to validate
 * @returns ValidationResult with valid flag and array of errors
 */
export function validateConfigData(config: ConfigData): ValidationResult {
  const errors: ValidationError[] = [];

  // Check all required arrays are present and non-empty
  if (!config.faculty || !Array.isArray(config.faculty)) {
    errors.push({
      field: 'faculty',
      message: 'Faculty array is missing or not an array',
    });
  } else if (config.faculty.length === 0) {
    errors.push({
      field: 'faculty',
      message: 'Faculty array is empty',
    });
  }

  if (!config.subjects || !Array.isArray(config.subjects)) {
    errors.push({
      field: 'subjects',
      message: 'Subjects array is missing or not an array',
    });
  } else if (config.subjects.length === 0) {
    errors.push({
      field: 'subjects',
      message: 'Subjects array is empty',
    });
  }

  if (!config.timeslots || !Array.isArray(config.timeslots)) {
    errors.push({
      field: 'timeslots',
      message: 'Timeslots array is missing or not an array',
    });
  } else if (config.timeslots.length === 0) {
    errors.push({
      field: 'timeslots',
      message: 'Timeslots array is empty',
    });
  }

  if (!config.buildings || !Array.isArray(config.buildings)) {
    errors.push({
      field: 'buildings',
      message: 'Buildings array is missing or not an array',
    });
  } else if (config.buildings.length === 0) {
    errors.push({
      field: 'buildings',
      message: 'Buildings array is empty',
    });
  }

  if (!config.rooms || !Array.isArray(config.rooms)) {
    errors.push({
      field: 'rooms',
      message: 'Rooms array is missing or not an array',
    });
  } else if (config.rooms.length === 0) {
    errors.push({
      field: 'rooms',
      message: 'Rooms array is empty',
    });
  }

  if (!config.sections || !Array.isArray(config.sections)) {
    errors.push({
      field: 'sections',
      message: 'Sections array is missing or not an array',
    });
  } else if (config.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'Sections array is empty',
    });
  }

  // If basic structure validation failed, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Create lookup sets for reference validation
  const subjectIds = new Set(config.subjects.map((s) => s.id));
  const timeslotIds = new Set(config.timeslots.map((t) => t.id));
  const roomIds = new Set(config.rooms.map((r) => r.id));
  const buildingIds = new Set(config.buildings.map((b) => b.id));

  // Validate all section references point to existing entities
  for (const section of config.sections) {
    if (!subjectIds.has(section.subjectId)) {
      errors.push({
        field: 'sections',
        message: `Section references non-existent subject`,
        context: `Section ID: ${section.id}, Subject ID: ${section.subjectId}`,
      });
    }

    if (!timeslotIds.has(section.timeslotId)) {
      errors.push({
        field: 'sections',
        message: `Section references non-existent timeslot`,
        context: `Section ID: ${section.id}, Timeslot ID: ${section.timeslotId}`,
      });
    }

    if (!roomIds.has(section.roomId)) {
      errors.push({
        field: 'sections',
        message: `Section references non-existent room`,
        context: `Section ID: ${section.id}, Room ID: ${section.roomId}`,
      });
    }
  }

  // Validate all room references to buildings
  for (const room of config.rooms) {
    if (!buildingIds.has(room.buildingId)) {
      errors.push({
        field: 'rooms',
        message: `Room references non-existent building`,
        context: `Room ID: ${room.id}, Building ID: ${room.buildingId}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
