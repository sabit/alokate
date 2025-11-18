# Design Document

## Overview

This feature enhances the Schedule Grid tooltip to display a detailed breakdown of assignment scores. Currently, the tooltip shows basic assignment information and a combined preference score, but doesn't reveal the individual components that make up the total score. This enhancement will add transparency by showing:

1. **Preference breakdown**: Subject, Timeslot, and Building preferences
2. **Other score components**: Mobility, Seniority, and Consecutive scores
3. **Total score**: The weighted sum of all components

The implementation will leverage existing data structures (`ScoreBreakdown` in `ScheduleEntry`) and preference data to calculate and display the breakdown without requiring backend changes.

## Architecture

### Current State

The Schedule Grid currently displays:
- Cell tooltip with faculty name, timeslot label, and assignment details
- A combined "Assignment Preference" score calculated as the average of all assignments' preference scores
- Individual assignment details in the active cell detail panel (which already shows score breakdown)

### Proposed Changes

1. **Tooltip Enhancement**: Modify the tooltip content generation in `ScheduleGrid.tsx` to include score breakdown
2. **Preference Calculation**: Add utility functions to calculate individual preference components (subject, timeslot, building) from the stored data
3. **Formatting**: Create consistent formatting for score display in tooltips

### Data Flow

```
ScheduleEntry (with scoreBreakdown) 
    ↓
GridAssignment (includes score)
    ↓
ScheduleGridCell (contains assignments)
    ↓
Tooltip Builder (NEW: calculates preference breakdown)
    ↓
Enhanced Tooltip Display
```

## Components and Interfaces

### 1. Tooltip Content Builder

**Location**: `frontend/src/components/schedule/ScheduleGrid/ScheduleGrid.tsx`

**Changes**:
- Enhance the tooltip building logic within the cell rendering section
- Add preference breakdown calculation for each assignment
- Format score components for display

### 2. Utility Functions

**Location**: `frontend/src/utils/scoreFormatters.ts` (new file)

**Functions**:

```typescript
/**
 * Calculate individual preference components for an assignment
 */
export interface PreferenceBreakdown {
  subject: number;
  timeslot: number;
  building: number;
  total: number;
}

export const calculatePreferenceBreakdown = (
  facultyId: string,
  sectionId: string,
  timeslotId: string,
  buildingId: string | undefined,
  preferences: Preferences,
  config: ConfigData,
): PreferenceBreakdown => {
  // Implementation details in tasks
};

/**
 * Format score value with +/- prefix and one decimal place
 */
export const formatScore = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
};

/**
 * Build tooltip text with score breakdown
 */
export const buildScoreTooltip = (
  assignment: GridAssignment,
  preferenceBreakdown: PreferenceBreakdown,
  facultyName: string,
  timeslotLabel: string,
): string => {
  // Implementation details in tasks
};
```

### 3. Type Extensions

No new types are needed. We'll use existing types:
- `ScoreBreakdown` from `types/index.ts` (contains preference, mobility, seniority, consecutive, total)
- `Preferences` from `types/index.ts` (contains facultySubject, facultyTimeslot, facultyBuilding)
- `GridAssignment` from `hooks/useScheduleGrid.ts` (already includes score)

## Data Models

### Existing Data Structures

**ScoreBreakdown** (already exists):
```typescript
interface ScoreBreakdown {
  preference: number;      // Combined: subject + timeslot + building
  mobility: number;        // Building transition penalty
  seniority: number;       // Faculty seniority score
  consecutive: number;     // Consecutive timeslot penalty
  capacityPenalty: number; // Not displayed (internal optimization use only)
  total: number;          // Weighted sum of components
}
```

**Preferences** (already exists):
```typescript
interface Preferences {
  facultySubject: Record<string, Record<string, PreferenceLevel>>;   // [facultyId][subjectId]
  facultyTimeslot: Record<string, Record<string, PreferenceLevel>>;  // [facultyId][timeslotId]
  facultyBuilding: Record<string, Record<string, PreferenceLevel>>;  // [facultyId][buildingId]
  mobility: Record<string, number>;                                   // [facultyId]
  consecutive: Record<string, number>;                                // [facultyId]
}
```

### Calculated Data

**PreferenceBreakdown** (new, calculated on-the-fly):
```typescript
interface PreferenceBreakdown {
  subject: number;    // From preferences.facultySubject[facultyId][subjectId]
  timeslot: number;   // From preferences.facultyTimeslot[facultyId][timeslotId]
  building: number;   // From preferences.facultyBuilding[facultyId][buildingId] or 0
  total: number;      // subject + timeslot + building (should match scoreBreakdown.preference)
}
```

## Implementation Details

### Tooltip Format

The enhanced tooltip will display information in this structure:

```
[Faculty Name] at [Timeslot Label]

[Assignment 1]
[Subject Code] • [Subject Name]
Room: [Room Label] • Building: [Building Label]

Score Breakdown:
  Preference: +2.0
    Subject: +3.0
    Timeslot: +1.0
    Building: -2.0
  Mobility: -1.0
  Seniority: +5.0
  Consecutive: -2.0
  Total: +4.0

[Assignment 2]
...
```

For cells with no assignments, the tooltip will remain unchanged (showing only faculty name, timeslot, and timeslot preference).

### Calculation Logic

1. **Preference Breakdown**:
   - Look up `preferences.facultySubject[facultyId][subjectId]` → subject preference
   - Look up `preferences.facultyTimeslot[facultyId][timeslotId]` → timeslot preference
   - Look up `preferences.facultyBuilding[facultyId][buildingId]` → building preference (or 0 if no building)
   - Sum: subject + timeslot + building = total preference

2. **Other Components**:
   - Use values directly from `assignment.score` (mobility, seniority, consecutive, total)

3. **Formatting**:
   - All scores formatted with one decimal place
   - Positive values prefixed with "+"
   - Negative values show "-" naturally
   - Zero values show "0.0"

### Edge Cases

1. **No Building Assignment**: Display "—" or "N/A" for building preference
2. **Missing Score Data**: If `assignment.score` is undefined, show "Score not available"
3. **Multiple Assignments**: Display breakdown for each assignment separately
4. **Empty Cells**: Keep existing behavior (show only timeslot preference)

## Error Handling

1. **Missing Preference Data**: Default to 0 if preference lookup returns undefined
2. **Missing Score Breakdown**: Display message "Score breakdown not available" if `assignment.score` is undefined
3. **Invalid Data**: Use defensive checks to prevent crashes if data structure is malformed

## Testing Strategy

### Unit Tests

1. **Utility Functions**:
   - Test `calculatePreferenceBreakdown` with various preference combinations
   - Test `formatScore` with positive, negative, and zero values
   - Test `buildScoreTooltip` with complete and partial data

2. **Edge Cases**:
   - Missing building preference
   - Missing score breakdown
   - Zero values for all components
   - Multiple assignments in one cell

### Integration Tests

1. **Tooltip Display**:
   - Verify tooltip shows breakdown for cells with assignments
   - Verify tooltip maintains existing behavior for empty cells
   - Verify breakdown matches stored score data

2. **User Interaction**:
   - Hover over cells with single assignment
   - Hover over cells with multiple assignments
   - Hover over cells with no assignments
   - Verify tooltip doesn't overflow viewport

### Manual Testing

1. Generate a schedule with the optimizer
2. Hover over various cells to verify score breakdown display
3. Compare tooltip breakdown with active cell detail panel (should match)
4. Test with different screen sizes to ensure tooltip readability

## Performance Considerations

1. **Calculation Overhead**: Preference breakdown calculation is lightweight (3 object lookups + addition)
2. **Tooltip Rendering**: Uses native browser tooltip (title attribute) - no custom rendering overhead
3. **Memory**: No additional data storage required - calculations done on-demand during tooltip generation

## Accessibility

1. **ARIA Labels**: Update `aria-label` attribute to include score breakdown information
2. **Screen Readers**: Ensure breakdown is announced in a logical order
3. **Keyboard Navigation**: Tooltip information available when cell is focused (not just on hover)

## Future Enhancements

1. **Custom Tooltip Component**: Replace native title attribute with a custom tooltip for better formatting and styling
2. **Visual Indicators**: Add color coding for positive/negative scores
3. **Weighted Scores**: Show both raw and weighted scores
4. **Comparison View**: Show how score compares to other potential assignments
