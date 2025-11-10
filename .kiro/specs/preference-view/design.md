# Design Document

## Overview

This design document outlines the technical approach for implementing four enhancements to the PreferenceMatrix component:

1. **Sticky Table Headers**: Make column headers remain visible during vertical scrolling
2. **Sorted Columns**: Sort columns alphabetically by label for easier navigation
3. **Consolidated Mobility Text**: Display mobility explanation once instead of repeating per faculty
4. **Preference Count Tooltips**: Show preference distribution summaries on column header hover

These enhancements improve usability for schedulers working with large datasets by providing better navigation, organization, and data insights.

## Architecture

### Component Structure

The implementation will modify the existing `PreferenceMatrix` component located at `frontend/src/components/preferences/PreferenceMatrix.tsx`. No new components are required, but we will:

- Enhance the `columns` memoized value to include sorting logic
- Add CSS classes for sticky positioning on table headers
- Refactor the mobility view rendering to consolidate explanatory text
- Create a new tooltip component or use inline tooltip rendering for column headers
- Add a helper function to calculate preference counts per column

### Data Flow

```
Config Data (subjects/timeslots/buildings)
  ↓
matrixColumnMeta (extract columns)
  ↓
Sort by label (case-insensitive)
  ↓
Render table with sticky headers
  ↓
On header hover → Calculate preference counts → Display tooltip
```

## Components and Interfaces

### Modified: PreferenceMatrix Component

#### New Helper Function: sortColumns

```typescript
const sortColumns = (columns: Array<{ id: string; label: string }>): Array<{ id: string; label: string }> => {
  return [...columns].sort((a, b) => 
    a.label.toLowerCase().localeCompare(b.label.toLowerCase())
  );
};
```

#### Modified: columns useMemo

```typescript
const columns = useMemo(() => {
  if (!isMatrixView(activeView)) {
    return [] as Array<{ id: string; label: string }>;
  }
  const unsortedColumns = matrixColumnMeta[activeView](config);
  return sortColumns(unsortedColumns);
}, [activeView, config]);
```

#### New Helper Function: calculatePreferenceCounts

```typescript
const calculatePreferenceCounts = useCallback(
  (columnId: string): Record<PreferenceLevel, number> => {
    const counts: Record<PreferenceLevel, number> = {
      '-3': 0, '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0, '3': 0
    };
    
    faculties.forEach((faculty) => {
      const value = getValue(faculty.id, columnId);
      counts[value]++;
    });
    
    return counts;
  },
  [faculties, getValue]
);
```

### New Component: PreferenceTooltip

A simple tooltip component to display preference counts:

```typescript
interface PreferenceTooltipProps {
  counts: Record<PreferenceLevel, number>;
}

const PreferenceTooltip: React.FC<PreferenceTooltipProps> = ({ counts }) => (
  <div className="absolute z-50 mt-2 rounded-lg border border-white/10 bg-slate-900 p-3 text-xs shadow-xl">
    <div className="space-y-1">
      {Object.entries(counts).map(([level, count]) => (
        <div key={level} className="flex justify-between gap-4">
          <span className="font-medium">{level > 0 ? `+${level}` : level}:</span>
          <span className="text-slate-400">{count}</span>
        </div>
      ))}
    </div>
  </div>
);
```

## Data Models

### Preference Count Model

```typescript
type PreferenceCounts = Record<PreferenceLevel, number>;
```

### Column Model (existing, no changes)

```typescript
interface Column {
  id: string;
  label: string;
}
```

## Implementation Details

### 1. Sticky Table Headers

**Problem with Current Approach**: The `position: sticky` on `<thead>` doesn't work when the table is inside a scrollable container (`overflow-auto` div). Sticky positioning requires the sticky element to be a direct child of the scroll container.

**New Approach**: Use a fixed-height container with `overflow-auto` and ensure the table is the direct child. Apply `position: sticky` to individual `<th>` elements rather than the `<thead>`.

**Changes**:
- Wrap the table in a container with a maximum height (e.g., `max-h-[600px]`) and `overflow-auto`
- Apply `position: sticky` and `top: 0` to each `<th>` element in the header row
- Add a solid background color to header cells to prevent content from showing through
- Ensure proper z-index layering for both column headers and the sticky faculty column

**Implementation**:
```typescript
<div className="max-h-[600px] overflow-auto rounded-lg border border-white/5">
  <table className="min-w-full divide-y divide-white/5 text-sm">
    <thead>
      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
        <th 
          scope="col" 
          className="sticky left-0 top-0 z-30 bg-slate-900 px-4 py-3 font-semibold text-slate-300"
        >
          Faculty
        </th>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            className="sticky top-0 z-20 bg-slate-900 px-4 py-3 font-semibold"
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      {/* body content */}
    </tbody>
  </table>
</div>
```

**Key Points**:
- The scroll container must have a defined height (`max-h-[600px]`)
- Each `<th>` gets `position: sticky` individually
- The faculty column header needs both `left: 0` and `top: 0` with higher z-index (z-30)
- Use solid background colors (not semi-transparent) to prevent visual overlap
- The sticky left column in tbody also needs solid background

### 2. Sorted Columns

**Approach**: Sort the columns array alphabetically by label using case-insensitive comparison.

**Changes**:
- Create a `sortColumns` helper function
- Apply sorting in the `columns` useMemo hook
- Use `localeCompare` for proper alphabetical sorting

**Implementation**:
```typescript
const columns = useMemo(() => {
  if (!isMatrixView(activeView)) {
    return [] as Array<{ id: string; label: string }>;
  }
  const unsortedColumns = matrixColumnMeta[activeView](config);
  return [...unsortedColumns].sort((a, b) => 
    a.label.toLowerCase().localeCompare(b.label.toLowerCase())
  );
}, [activeView, config]);
```

### 3. Consolidated Mobility Text

**Approach**: Move the explanatory text outside the faculty list loop and display it once at the top.

**Changes**:
- Extract the explanatory text from individual faculty cards
- Add a header section above the faculty list with the explanation
- Keep only faculty name and slider in each card

**Implementation**:
```typescript
if (activeView === 'mobility') {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Higher values penalise cross-building moves less.
      </p>
      {faculties.map((faculty) => (
        <div key={faculty.id} className="flex flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-slate-100">{faculty.name}</p>
          <div className="flex items-center gap-3">
            {/* slider implementation */}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4. Preference Count Tooltips

**Approach**: Add hover state management and calculate preference counts on demand.

**Changes**:
- Add `useState` for tracking hovered column
- Create `calculatePreferenceCounts` helper function
- Render tooltip conditionally when column is hovered
- Use `onMouseEnter` and `onMouseLeave` events on header cells

**Implementation**:
```typescript
const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

// In the header cell rendering:
<th
  key={column.id}
  scope="col"
  className="relative px-4 py-3 font-semibold"
  onMouseEnter={() => setHoveredColumn(column.id)}
  onMouseLeave={() => setHoveredColumn(null)}
>
  {column.label}
  {hoveredColumn === column.id && (
    <PreferenceTooltip counts={calculatePreferenceCounts(column.id)} />
  )}
</th>
```

## Error Handling

### Sorting Edge Cases

- **Empty columns**: The sort function handles empty arrays gracefully
- **Missing labels**: Labels are guaranteed by the `matrixColumnMeta` functions
- **Special characters**: `localeCompare` handles special characters correctly

### Tooltip Rendering

- **No faculties**: Tooltip will show all zeros, which is acceptable
- **Missing preferences**: `getValue` returns 0 by default for missing preferences
- **Rapid hover changes**: React state updates handle rapid hover changes automatically

### Sticky Header Browser Compatibility

- **Modern browsers**: `position: sticky` is widely supported (95%+ browsers)
- **Fallback**: If sticky is not supported, headers will scroll normally (graceful degradation)
- **Z-index conflicts**: Use z-20 to ensure headers stay above content

## Testing Strategy

### Unit Testing Approach

1. **Column Sorting**:
   - Test that columns are sorted alphabetically
   - Test case-insensitive sorting
   - Test with special characters and numbers

2. **Preference Count Calculation**:
   - Test with various preference distributions
   - Test with empty faculty list
   - Test with all neutral preferences

3. **Tooltip Display**:
   - Test tooltip appears on hover
   - Test tooltip disappears on mouse leave
   - Test tooltip shows correct counts

### Manual Testing Checklist

1. **Sticky Headers**:
   - Scroll vertically and verify headers stay visible
   - Scroll horizontally and verify headers scroll with content
   - Check z-index layering with other UI elements

2. **Sorted Columns**:
   - Verify columns are in alphabetical order for subjects
   - Verify columns are in alphabetical order for timeslots
   - Verify columns are in alphabetical order for buildings
   - Switch between views and verify sorting persists

3. **Mobility Text**:
   - Verify explanation appears once at the top
   - Verify no repetition in individual faculty cards
   - Check responsive layout on mobile

4. **Tooltips**:
   - Hover over each column header and verify tooltip appears
   - Verify tooltip shows correct preference counts
   - Test tooltip positioning near viewport edges
   - Verify tooltip disappears when mouse leaves

### Accessibility Testing

- **Keyboard navigation**: Ensure tooltips are accessible via keyboard focus
- **Screen readers**: Add `aria-label` to header cells with preference counts
- **Color contrast**: Verify tooltip text meets WCAG AA standards

## Performance Considerations

### Sorting Performance

- Sorting is performed in a `useMemo` hook, so it only recalculates when `activeView` or `config` changes
- Typical column counts (10-50 items) make sorting negligible in performance impact

### Tooltip Calculation

- Preference counts are calculated on-demand during hover
- For large faculty lists (100+), calculation time is still minimal (<10ms)
- Consider memoizing counts if performance issues arise

### Sticky Header Performance

- CSS `position: sticky` is hardware-accelerated in modern browsers
- No JavaScript scroll listeners required, so no performance overhead

## Migration and Rollout

### Implementation Order

1. **Phase 1**: Implement column sorting (lowest risk, highest value)
2. **Phase 2**: Implement sticky headers (CSS-only change)
3. **Phase 3**: Consolidate mobility text (simple refactor)
4. **Phase 4**: Add preference count tooltips (most complex)

### Backward Compatibility

- All changes are additive or modify existing UI behavior
- No breaking changes to data structures or APIs
- No database migrations required

### Rollback Plan

- Each enhancement is independent and can be rolled back individually
- Git revert of specific commits will cleanly remove features
- No data persistence changes, so rollback has no data implications
