import { Subject } from '../types';

// Default color palette for subjects
const DEFAULT_SUBJECT_COLORS = [
  '#F4D1AE', // Light peach
  '#B8E6B8', // Light green
  '#B8D8E8', // Light blue
  '#D8B8E8', // Light purple
  '#C8C8C8', // Light gray
  '#F4C8A0', // Light orange
];

/**
 * Get default color for a subject based on its index
 * Colors cycle through the palette if there are more subjects than colors
 */
export const getDefaultSubjectColor = (index: number): string => {
  return DEFAULT_SUBJECT_COLORS[index % DEFAULT_SUBJECT_COLORS.length];
};

/**
 * Ensure all subjects have colors assigned
 * Assigns default colors to subjects without colors
 */
export const ensureSubjectColors = (subjects: Subject[]): Subject[] => {
  return subjects.map((subject, index) => ({
    ...subject,
    color: subject.color || getDefaultSubjectColor(index),
  }));
};

/**
 * Calculate contrasting text color for accessibility
 * Returns black or white based on background luminance
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
};

/**
 * Validate hexadecimal color code
 * Returns true if the color is a valid 6-digit hex code
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};
