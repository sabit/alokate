import type { ConfigData, Preferences, ScoreBreakdown } from '../types';
import type { GridAssignment } from '../hooks/useScheduleGrid';

/**
 * Interface representing the breakdown of preference components
 */
export interface PreferenceBreakdown {
  subject: number;
  timeslot: number;
  building: number;
  total: number;
}

/**
 * Format a score value with +/- prefix and one decimal place
 * @param value - The numeric score value to format
 * @returns Formatted string with +/- prefix (e.g., "+2.0", "-1.5", "0.0")
 */
export const formatScore = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
};

/**
 * Calculate individual preference components for an assignment
 * @param facultyId - The ID of the faculty member
 * @param sectionId - The ID of the section
 * @param timeslotId - The ID of the timeslot
 * @param buildingId - The ID of the building (optional)
 * @param preferences - The preferences object containing all preference data
 * @param config - The configuration data containing subjects and sections
 * @returns PreferenceBreakdown object with subject, timeslot, building, and total preferences
 */
export const calculatePreferenceBreakdown = (
  facultyId: string,
  sectionId: string,
  timeslotId: string,
  buildingId: string | undefined,
  preferences: Preferences,
  config: ConfigData,
): PreferenceBreakdown => {
  // Find the section to get the subject ID
  const section = config.sections.find((s) => s.id === sectionId);
  const subjectId = section?.subjectId;

  // Look up subject preference
  const subjectPreference = subjectId
    ? preferences.facultySubject?.[facultyId]?.[subjectId] ?? 0
    : 0;

  // Look up timeslot preference
  const timeslotPreference = preferences.facultyTimeslot?.[facultyId]?.[timeslotId] ?? 0;

  // Look up building preference (0 if no building)
  const buildingPreference = buildingId
    ? preferences.facultyBuilding?.[facultyId]?.[buildingId] ?? 0
    : 0;

  // Calculate total
  const total = subjectPreference + timeslotPreference + buildingPreference;

  return {
    subject: subjectPreference,
    timeslot: timeslotPreference,
    building: buildingPreference,
    total,
  };
};

/**
 * Build tooltip text with score breakdown
 * @param assignment - The grid assignment containing score data
 * @param preferenceBreakdown - The calculated preference breakdown
 * @param facultyName - The name of the faculty member
 * @param timeslotLabel - The label of the timeslot
 * @returns Formatted tooltip string with complete score breakdown
 */
export const buildScoreTooltip = (
  assignment: GridAssignment,
  preferenceBreakdown: PreferenceBreakdown,
  facultyName: string,
  timeslotLabel: string,
): string => {
  const lines: string[] = [];

  // Header
  lines.push(`${facultyName} at ${timeslotLabel}`);
  lines.push('');

  // Assignment details
  const subjectDisplay = assignment.subjectCode
    ? `${assignment.subjectCode} • ${assignment.subjectName}`
    : assignment.subjectName;
  lines.push(subjectDisplay);

  // Room and building info
  if (assignment.roomLabel || assignment.buildingLabel) {
    const roomPart = assignment.roomLabel ? `Room: ${assignment.roomLabel}` : '';
    const buildingPart = assignment.buildingLabel ? `Building: ${assignment.buildingLabel}` : '';
    const locationLine = [roomPart, buildingPart].filter(Boolean).join(' • ');
    if (locationLine) {
      lines.push(locationLine);
    }
  }

  lines.push('');

  // Score breakdown
  if (assignment.score) {
    lines.push('Score Breakdown:');
    
    // Use pre-calculated weighted scores if available (single source of truth from optimizer)
    if (assignment.score.weighted) {
      const { weighted } = assignment.score;
      
      lines.push(`  Preference: ${formatScore(weighted.preference)} (${formatScore(assignment.score.preference)} × weight)`);
      lines.push(`    Subject: ${formatScore(preferenceBreakdown.subject)}`);
      lines.push(`    Timeslot: ${formatScore(preferenceBreakdown.timeslot)}`);
      
      // Show building preference or N/A if no building
      if (assignment.buildingId) {
        lines.push(`    Building: ${formatScore(preferenceBreakdown.building)}`);
      } else {
        lines.push(`    Building: N/A`);
      }
      
      lines.push(`  Mobility: ${formatScore(weighted.mobility)} (${formatScore(assignment.score.mobility)} × weight)`);
      lines.push(`  Seniority: ${formatScore(weighted.seniority)} (${formatScore(assignment.score.seniority)} × weight)`);
      lines.push(`  Consecutive: ${formatScore(weighted.consecutive)} (${formatScore(assignment.score.consecutive)} × weight)`);
      lines.push(`  Capacity Penalty: ${formatScore(assignment.score.capacityPenalty)}`);
    } else {
      // Fallback to showing raw scores if weighted scores not available (backward compatibility)
      lines.push(`  Preference: ${formatScore(assignment.score.preference)}`);
      lines.push(`    Subject: ${formatScore(preferenceBreakdown.subject)}`);
      lines.push(`    Timeslot: ${formatScore(preferenceBreakdown.timeslot)}`);
      
      // Show building preference or N/A if no building
      if (assignment.buildingId) {
        lines.push(`    Building: ${formatScore(preferenceBreakdown.building)}`);
      } else {
        lines.push(`    Building: N/A`);
      }
      
      lines.push(`  Mobility: ${formatScore(assignment.score.mobility)}`);
      lines.push(`  Seniority: ${formatScore(assignment.score.seniority)}`);
      lines.push(`  Consecutive: ${formatScore(assignment.score.consecutive)}`);
      lines.push(`  Capacity Penalty: ${formatScore(assignment.score.capacityPenalty)}`);
    }
    
    lines.push(`  Total: ${formatScore(assignment.score.total)}`);
  } else {
    lines.push('Score breakdown not available');
  }

  return lines.join('\n');
};
