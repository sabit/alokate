/**
 * CSV Parser Utilities
 * Handles parsing of CSV files for faculty and rooms data import
 */

import type { ParsedFacultyRow, ParsedRoomRow } from '../types';

export class CSVParseError extends Error {
  constructor(
    message: string,
    public row?: number,
    public field?: string
  ) {
    super(message);
    this.name = 'CSVParseError';
  }
}

/**
 * Generic CSV parser that handles text parsing with proper quote and comma handling
 * @param csvText - Raw CSV text content
 * @param headerMap - Map of expected headers to property names
 * @returns Array of parsed objects
 */
export function parseCSV<T>(
  csvText: string,
  headerMap: Record<string, string>
): T[] {
  const lines = csvText.split(/\r?\n/);
  const results: T[] = [];
  
  if (lines.length === 0) {
    throw new CSVParseError('CSV file is empty');
  }

  // Extract and parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Create a mapping from CSV column index to property name
  const columnMapping: (string | null)[] = headers.map(header => {
    const trimmedHeader = header.trim();
    return headerMap[trimmedHeader] || null;
  });

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty rows
    if (!line) {
      continue;
    }

    try {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};

      // Map values to properties based on column mapping
      for (let j = 0; j < values.length && j < columnMapping.length; j++) {
        const propertyName = columnMapping[j];
        if (propertyName) {
          row[propertyName] = values[j].trim();
        }
      }

      results.push(row as T);
    } catch (error) {
      throw new CSVParseError(
        `Failed to parse row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        i + 1
      );
    }
  }

  return results;
}

/**
 * Parse a single CSV line handling quotes and commas properly
 * @param line - Single line of CSV text
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Parse section field to extract course shortcode and section identifier
 * @param sectionValue - Section value in format "SHORTCODE [IDENTIFIER]" (e.g., "M3 [A]" or "M2[B]")
 * @returns Object containing courseShortcode and sectionIdentifier
 * @throws CSVParseError if format is invalid or values are empty
 */
export function parseSectionField(sectionValue: string): {
  courseShortcode: string;
  sectionIdentifier: string;
} {
  const trimmedValue = sectionValue.trim();
  
  // Regex pattern: capture shortcode (non-greedy), optional whitespace, then identifier in brackets
  const pattern = /^(.+?)\s*\[(.+)\]$/;
  const match = trimmedValue.match(pattern);
  
  if (!match) {
    throw new CSVParseError(
      `Invalid section format '${sectionValue}'. Expected format: 'SHORTCODE [IDENTIFIER]'`
    );
  }
  
  const courseShortcode = match[1].trim();
  const sectionIdentifier = match[2].trim();
  
  if (courseShortcode === '') {
    throw new CSVParseError(
      `Empty course shortcode in section '${sectionValue}'`
    );
  }
  
  if (sectionIdentifier === '') {
    throw new CSVParseError(
      `Empty section identifier in section '${sectionValue}'`
    );
  }
  
  return {
    courseShortcode,
    sectionIdentifier,
  };
}

/**
 * Parse faculty CSV file
 * @param csvText - Raw CSV text content
 * @returns Array of parsed faculty rows
 * @throws CSVParseError if required fields are missing
 */
export function parseFacultyCSV(csvText: string): ParsedFacultyRow[] {
  const headerMap: Record<string, string> = {
    'Name': 'name',
    'Initial': 'initial',
  };

  const rows = parseCSV<ParsedFacultyRow>(csvText, headerMap);

  // Validate required fields
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    if (!row.name || row.name.trim() === '') {
      throw new CSVParseError(
        `Missing required field 'Name' in faculty CSV`,
        i + 2, // +2 because we skip header and arrays are 0-indexed
        'Name'
      );
    }
    
    if (!row.initial || row.initial.trim() === '') {
      throw new CSVParseError(
        `Missing required field 'Initial' in faculty CSV`,
        i + 2,
        'Initial'
      );
    }
  }

  return rows;
}

/**
 * Parse rooms CSV file
 * @param csvText - Raw CSV text content
 * @returns Array of parsed room rows
 * @throws CSVParseError if required fields are missing or invalid
 */
export function parseRoomsCSV(csvText: string): ParsedRoomRow[] {
  const headerMap: Record<string, string> = {
    'Sl No': 'slNo',
    'Course': 'course',
    'Capacity': 'capacity',
    'Registration': 'registration',
    'Section': 'section',
    'Slot Day': 'slotDay',
    'Slot Time': 'slotTime',
    'Room': 'room',
  };

  const rawRows = parseCSV<Record<string, string>>(csvText, headerMap);
  const rows: ParsedRoomRow[] = [];

  // Validate and convert required fields
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

    // Validate required string fields
    const requiredFields = ['course', 'section', 'slotDay', 'slotTime', 'room'];
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        throw new CSVParseError(
          `Missing required field '${field}' in rooms CSV`,
          rowNumber,
          field
        );
      }
    }

    // Parse and validate numeric fields
    const capacity = parseInt(row.capacity, 10);
    if (isNaN(capacity)) {
      throw new CSVParseError(
        `Invalid capacity value '${row.capacity}' in rooms CSV. Expected a number.`,
        rowNumber,
        'Capacity'
      );
    }

    const registration = parseInt(row.registration, 10);
    if (isNaN(registration)) {
      throw new CSVParseError(
        `Invalid registration value '${row.registration}' in rooms CSV. Expected a number.`,
        rowNumber,
        'Registration'
      );
    }

    // Parse section field to extract shortcode and identifier
    let courseShortcode: string;
    let sectionIdentifier: string;
    
    try {
      const parsed = parseSectionField(row.section);
      courseShortcode = parsed.courseShortcode;
      sectionIdentifier = parsed.sectionIdentifier;
    } catch (error) {
      if (error instanceof CSVParseError) {
        // Add row number and field context to the error
        throw new CSVParseError(
          `${error.message} at row ${rowNumber}`,
          rowNumber,
          'Section'
        );
      }
      throw error;
    }

    rows.push({
      slNo: row.slNo || '',
      course: row.course.trim(),
      capacity,
      registration,
      section: row.section.trim(),
      courseShortcode,
      sectionIdentifier,
      slotDay: row.slotDay.trim(),
      slotTime: row.slotTime.trim(),
      room: row.room.trim(),
    });
  }

  return rows;
}
