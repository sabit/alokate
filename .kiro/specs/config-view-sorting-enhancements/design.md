# Design Document

## Overview

This design implements three enhancements to the ConfigDataTables component:
1. Display section counts grouped by subject in the sections table header or as a summary
2. Sort rooms by building name (primary) and room label (secondary)
3. Sort subjects alphabetically by their code property

These changes improve data organization and help users quickly understand their configuration data distribution.

## Architecture

### Component Structure

The implementation will modify the existing `ConfigDataTables.tsx` component, which already uses `useMemo` for computed data like sorted timeslots. We'll follow the same pattern for the new sorting and counting requirements.

**Affected Component:**
- `frontend/src/components/config/ConfigDataTables.tsx`

**No new components required** - all changes are contained within the existing component.

## Components and Interfaces

### 1. Section Count by Subject

**Approach:** Create a computed map that groups sections by subject and counts them.

**Data Structure:**
```typescript
// Computed using useMemo
const sectionCountBySubject: Map<string, { subject: Subject; count: number }> = useMemo(() => {
  const countMap = new Map<string, { subject: Subject; count: number }>();
  
  config.sections.forEach((section) => {
    const subject = config.subjects.find((s) => s.id === section.subjectId);
    if (subject) {
      const existing = countMap.get(subject.id);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(subject.id, { subject, count: 1 });
      }
    }
  });
  
  return countMap;
}, [config.sections, config.subjects]);
```

**Display Strategy:**
- Add a summary row or section above the sections table showing subject breakdown
- Format: "Subject Code (count)" for each subject with sections
- Example: "CS (5) | MATH (3) | ENG (4)"
- Alternative: Display count in parentheses next to subject name in each row

**Chosen Approach:** Display a compact summary above the sections table when expanded, showing each subject code with its section count in a badge-style format.

### 2. Sort Rooms by Building Name

**Implementation:**
```typescript
const sortedRooms = useMemo(() => {
  return [...config.rooms].sort((a, b) => {
    const buildingA = config.buildings.find((bldg) => bldg.id === a.buildingId);
    const buildingB = config.buildings.find((bldg) => bldg.id === b.buildingId);
    
    const buildingNameA = buildingA?.label || a.buildingId;
    const buildingNameB = buildingB?.label || b.buildingId;
    
    // Primary sort: building name
    const buildingCompare = buildingNameA.localeCompare(buildingNameB);
    if (buildingCompare !== 0) {
      return buildingCompare;
    }
    
    // Secondary sort: room label
    return a.label.localeCompare(b.label);
  });
}, [config.rooms, config.buildings]);
```

**Usage:** Replace `config.rooms.map(...)` with `sortedRooms.map(...)` in the rooms table rendering.

### 3. Sort Subjects by Code

**Implementation:**
```typescript
const sortedSubjects = useMemo(() => {
  return [...config.subjects].sort((a, b) => 
    a.code.localeCompare(b.code, undefined, { sensitivity: 'base' })
  );
}, [config.subjects]);
```

**Usage:** Replace `config.subjects.map(...)` with `sortedSubjects.map(...)` in the subjects table rendering.

**Note:** The `localeCompare` with `sensitivity: 'base'` option provides case-insensitive sorting as required.

## Data Models

No changes to existing data models. All implementations use existing TypeScript interfaces:
- `Subject` - has `id`, `name`, and `code` properties
- `Section` - has `subjectId` for linking to subjects
- `Room` - has `buildingId` for linking to buildings
- `Building` - has `label` for building name

## Error Handling

### Missing References
- **Rooms without buildings:** Display buildingId as fallback (already implemented)
- **Sections without subjects:** Skip in count calculation, display subjectId as fallback in table
- **Empty arrays:** No special handling needed - empty arrays will result in empty sorted arrays

### Edge Cases
- **No sections for a subject:** Subject won't appear in section count summary (expected behavior)
- **Multiple sections with same subject:** Correctly counted and grouped
- **Case sensitivity:** Handled by `localeCompare` with appropriate options

## Testing Strategy

### Unit Tests (Optional)

Test files to create/modify:
- `frontend/src/components/config/__tests__/ConfigDataTables.test.tsx`

**Test Cases:**
1. **Section Count Calculation**
   - Verify correct count for single subject with multiple sections
   - Verify multiple subjects with different counts
   - Verify sections without valid subject references are handled

2. **Room Sorting**
   - Verify rooms sorted by building name alphabetically
   - Verify secondary sort by room label within same building
   - Verify rooms without building references appear in sorted list

3. **Subject Sorting**
   - Verify subjects sorted by code alphabetically
   - Verify case-insensitive sorting (e.g., "cs" before "MATH")
   - Verify empty subject list doesn't cause errors

### Manual Testing

1. **Visual Verification:**
   - Load sample configuration with multiple subjects, rooms, and buildings
   - Expand sections table and verify section count summary displays correctly
   - Expand rooms table and verify rooms are grouped by building
   - Expand subjects table and verify alphabetical order by code

2. **Dynamic Updates:**
   - Import new configuration and verify sorting/counting updates
   - Verify collapsed/expanded state maintains sorting

## Implementation Notes

### Performance Considerations
- All sorting and counting operations use `useMemo` to prevent unnecessary recalculations
- Dependency arrays include only the relevant config arrays
- Sorting operations are O(n log n) which is acceptable for typical dataset sizes (< 1000 items)

### Accessibility
- Section count summary should use semantic HTML (e.g., `<div role="status">` or simple text)
- No interactive elements added, so no additional ARIA labels needed
- Maintain existing table accessibility patterns

### Styling
- Section count summary: Use existing badge/chip styling from the design system
- Match the compact, inline style similar to the ConfigSummary component
- Use slate color palette consistent with existing tables
