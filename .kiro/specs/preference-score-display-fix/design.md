# Design Document

## Overview

This design addresses the bug where preference scores display as 0 in the Schedule Grid tooltips. The root cause is that the grid currently displays only the faculty-timeslot preference component instead of the complete assignment preference score from the score breakdown. The fix involves modifying the tooltip generation logic to use assignment preference scores when available.

## Architecture

The fix is localized to the Schedule Grid component (`ScheduleGrid.tsx`). No changes are needed to:
- The `useScheduleGrid` hook (data structure is correct)
- The optimizer (score calculation is correct)
- The store or state management

## Components and Interfaces

### Modified Component: ScheduleGrid.tsx

**Current Behavior:**
- Line 424: Tooltip shows `Preference: ${formatPreference(cell.preference)}`
- `cell.preference` contains only the faculty-timeslot preference value
- This value is 0 when no explicit timeslot preference is set

**New Behavior:**
- Calculate the effective preference score based on whether assignments exist
- If assignments exist: use the average of assignment preference scores from `assignment.score.preference`
- If no assignments: use the existing `cell.preference` (faculty-timeslot preference)
- Update tooltip to show the calculated preference with appropriate labeling

### Data Flow

```
Current (Incorrect):
cell.preference (faculty-timeslot only) → tooltip

Fixed (Correct):
cell.assignments.length > 0 
  ? average(assignment.score.preference) → tooltip as "Assignment Preference"
  : cell.preference → tooltip as "Timeslot Preference"
```

## Implementation Details

### Preference Score Calculation

Add a helper function or inline calculation to compute the effective preference:

```typescript
const effectivePreference = cell.assignments.length > 0
  ? cell.assignments.reduce((sum, a) => sum + (a.score?.preference ?? 0), 0) / cell.assignments.length
  : cell.preference;

const preferenceLabel = cell.assignments.length > 0 
  ? 'Assignment Preference' 
  : 'Timeslot Preference';
```

### Tooltip Update

Update the tooltip generation (around line 424) to use the calculated effective preference:

```typescript
const tooltipParts = [
  `${row.faculty.name} at ${timeslotLabel}`,
  `${preferenceLabel}: ${formatPreference(effectivePreference as PreferenceLevel)}`,
];
```

### Cell Styling

The cell styling should continue to use `cell.preference` for the background color, as this represents the base timeslot preference. The assignment-specific preference is shown in the tooltip and detail panel, not in the cell background.

## Error Handling

- Handle cases where `assignment.score` is undefined (shouldn't happen with optimizer-generated assignments, but defensive coding)
- Handle division by zero when calculating average (already handled by checking `cell.assignments.length > 0`)
- Ensure `formatPreference` can handle decimal values from averaging (may need rounding)

## Testing Strategy

### Manual Testing
1. Load a schedule with assignments
2. Hover over cells with assignments - verify tooltip shows non-zero preference scores
3. Hover over cells without assignments - verify tooltip shows timeslot preference
4. Verify cells with multiple assignments show averaged preference
5. Check that the detail panel still shows individual assignment scores correctly

### Edge Cases
- Cell with no assignments (should show timeslot preference)
- Cell with one assignment (should show that assignment's preference)
- Cell with multiple assignments (should show average)
- Assignment with missing score breakdown (should default to 0)

## Notes

- The `formatPreference` function currently expects integer PreferenceLevel values (-3 to +3)
- When averaging multiple assignments, we may get decimal values
- Consider rounding to nearest integer or updating formatPreference to handle decimals
- The existing detail panel (lines 501-507) already correctly shows individual assignment preference scores
