# Design Document

## Overview

This design enhances the Schedule Grid component with three key improvements: sortable timeslot headers, sticky headers for better navigation, and day-based filtering. The implementation will extend the existing `ScheduleGrid` component and `scheduleUiStore` to manage sort and filter state, while maintaining backward compatibility with existing features like keyboard navigation, conflict display, and cell editing.

## Architecture

### Component Structure

```
SchedulePage
├── FilterBar (existing - will add day filter controls)
├── ScheduleGrid (enhanced)
│   ├── DayFilterControl (new)
│   ├── SortableTimeslotHeader (new)
│   └── ScheduleGridTable (refactored from existing table)
├── ConflictPanel (existing - unchanged)
└── EditDialog (existing - unchanged)
```

### State Management

The `scheduleUiStore` will be extended to manage:
- Sort state (field, direction)
- Day filter state (selected days)
- Persistence to localStorage

### Data Flow

1. User interacts with sort/filter controls
2. Store updates sort/filter state
3. `useScheduleGrid` hook applies transformations to timeslot data
4. ScheduleGrid re-renders with filtered/sorted columns
5. State persists to localStorage for session continuity

## Components and Interfaces

### 1. Enhanced scheduleUiStore

```typescript
interface SortConfig {
  field: 'time' | 'day';
  direction: 'asc' | 'desc';
}

interface DayFilterConfig {
  selectedDays: Set<string>; // e.g., Set(['Monday', 'Wednesday'])
  availableDays: string[];
}

interface SchedulerUIState {
  // Existing state
  activeCell: ActiveScheduleCell | null;
  isEditDialogOpen: boolean;
  
  // New state
  sortConfig: SortConfig;
  dayFilter: DayFilterConfig;
  
  // Existing actions
  setActiveCell: (cell: ActiveScheduleCell | null) => void;
  openEditDialog: (cell?: ActiveScheduleCell) => void;
  closeEditDialog: () => void;
  
  // New actions
  setSortConfig: (config: SortConfig) => void;
  toggleSortDirection: () => void;
  setDayFilter: (days: Set<string>) => void;
  clearDayFilter: () => void;
  initializeDayFilter: (availableDays: string[]) => void;
}
```

**Persistence Strategy:**
- Use zustand's `persist` middleware
- Store sort and filter preferences in localStorage under key `schedule-ui-preferences`
- Restore on mount, with fallback to defaults

### 2. DayFilterControl Component

```typescript
interface DayFilterControlProps {
  availableDays: string[];
  selectedDays: Set<string>;
  visibleCount: number;
  totalCount: number;
  onDayToggle: (day: string) => void;
  onClearFilters: () => void;
}
```

**UI Design:**
- Horizontal list of day chips (e.g., Mon, Tue, Wed, Thu, Fri)
- Selected days have accent background
- Display count: "Showing X of Y timeslots"
- "Clear filters" button (only visible when filters active)
- Positioned above the schedule table, integrated into FilterBar

### 3. SortableTimeslotHeader Component

```typescript
interface SortableTimeslotHeaderProps {
  timeslot: GridTimeslot;
  sortConfig: SortConfig;
  onSort: () => void;
}
```

**UI Design:**
- Clickable header with hover state
- Sort indicator icon (↑ for asc, ↓ for desc)
- Icon only visible on sorted column or on hover
- Maintains existing styling (sticky positioning, background, borders)

### 4. Enhanced useScheduleGrid Hook

The hook will be extended to accept and apply sort/filter configurations:

```typescript
interface UseScheduleGridOptions {
  sortConfig?: SortConfig;
  dayFilter?: Set<string>;
}

export const useScheduleGrid = (options?: UseScheduleGridOptions): ScheduleGridData => {
  // Existing logic...
  
  // Apply day filter
  const filteredTimeslots = useMemo(() => {
    if (!options?.dayFilter || options.dayFilter.size === 0) {
      return timeslots;
    }
    return timeslots.filter(slot => options.dayFilter.has(slot.day));
  }, [timeslots, options?.dayFilter]);
  
  // Apply sort
  const sortedTimeslots = useMemo(() => {
    if (!options?.sortConfig) {
      return filteredTimeslots;
    }
    
    const sorted = [...filteredTimeslots].sort((a, b) => {
      if (options.sortConfig.field === 'time') {
        // Sort by start time
        return a.start.localeCompare(b.start);
      } else {
        // Sort by day (using day order: Mon, Tue, Wed, Thu, Fri, Sat, Sun)
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      }
    });
    
    return options.sortConfig.direction === 'desc' ? sorted.reverse() : sorted;
  }, [filteredTimeslots, options?.sortConfig]);
  
  // Build rows using sortedTimeslots instead of timeslots
  // ...
}
```

## Data Models

### Sort Configuration

```typescript
type SortField = 'time' | 'day';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Default: Sort by time ascending
const DEFAULT_SORT: SortConfig = {
  field: 'time',
  direction: 'asc'
};
```

### Day Filter Configuration

```typescript
interface DayFilterConfig {
  selectedDays: Set<string>;
  availableDays: string[];
}

// Default: All days selected (no filtering)
const DEFAULT_DAY_FILTER: DayFilterConfig = {
  selectedDays: new Set(),
  availableDays: []
};
```

### Persistence Schema

```typescript
interface ScheduleUIPreferences {
  version: number; // For future migrations
  sort: {
    field: SortField;
    direction: SortDirection;
  };
  dayFilter: {
    selectedDays: string[]; // Array for JSON serialization
  };
}
```

## Sticky Header Implementation

### CSS Strategy

Use CSS `position: sticky` with appropriate z-index layering:

```css
/* Timeslot headers - sticky top */
.timeslot-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: slate-950;
}

/* Faculty column - sticky left */
.faculty-cell {
  position: sticky;
  left: 0;
  z-index: 10;
  background: slate-950;
}

/* Faculty header (top-left corner) - sticky both */
.faculty-header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 20; /* Highest to appear above both */
  background: slate-950;
}
```

### Visual Enhancements

- Add subtle shadow to sticky elements to create depth
- Ensure background is opaque to prevent content bleeding through
- Maintain border consistency during scroll

## Error Handling

### Invalid Sort Configuration

- If persisted sort field is invalid, fall back to default (time, asc)
- Log warning to console for debugging

### Invalid Day Filter

- If persisted days don't match available days, clear filter
- Initialize with all days when timeslots change

### Empty Timeslots

- Disable sort controls when no timeslots exist
- Hide day filter when no timeslots exist
- Display appropriate empty state message

## Testing Strategy

### Unit Tests

1. **scheduleUiStore Tests**
   - Test sort config updates
   - Test day filter toggle
   - Test clear filters action
   - Test persistence (mock localStorage)

2. **useScheduleGrid Hook Tests**
   - Test timeslot sorting (time ascending/descending)
   - Test timeslot sorting (day ascending/descending)
   - Test day filtering (single day, multiple days, all days)
   - Test combined sort and filter
   - Test empty timeslots handling

3. **DayFilterControl Tests**
   - Test day selection/deselection
   - Test clear filters button
   - Test count display accuracy

4. **SortableTimeslotHeader Tests**
   - Test sort toggle on click
   - Test sort indicator display
   - Test accessibility (keyboard interaction)

### Integration Tests

1. **Sort + Filter Interaction**
   - Apply day filter, then sort → verify correct columns shown in correct order
   - Sort, then apply day filter → verify sort maintained on filtered columns
   - Clear filter → verify all columns restored with sort maintained

2. **Persistence**
   - Set sort and filter → refresh page → verify state restored
   - Clear localStorage → verify defaults applied

3. **Sticky Headers**
   - Scroll vertically → verify faculty column stays fixed
   - Scroll horizontally → verify timeslot headers stay fixed
   - Scroll both directions → verify both stay fixed

### Accessibility Tests

1. Keyboard navigation works with sorted/filtered columns
2. Sort controls are keyboard accessible (Enter/Space to toggle)
3. Day filter chips are keyboard accessible
4. Screen reader announces sort state changes
5. Screen reader announces filter state changes

## Performance Considerations

### Memoization

- Memoize filtered timeslots to avoid recalculation
- Memoize sorted timeslots to avoid recalculation
- Memoize row cells based on sorted timeslots

### Rendering Optimization

- Use React.memo for DayFilterControl if parent re-renders frequently
- Use React.memo for SortableTimeslotHeader
- Avoid inline function creation in map callbacks

### Large Datasets

- Current implementation handles up to ~100 timeslots efficiently
- If performance degrades, consider virtualization (react-window)
- Monitor render times with React DevTools Profiler

## Migration Strategy

### Phase 1: Add State Management
- Extend scheduleUiStore with sort and filter state
- Add persistence layer
- No UI changes yet

### Phase 2: Implement Sorting
- Add SortableTimeslotHeader component
- Update useScheduleGrid to apply sort
- Test thoroughly

### Phase 3: Implement Filtering
- Add DayFilterControl component
- Update useScheduleGrid to apply filter
- Integrate into FilterBar
- Test sort + filter interaction

### Phase 4: Sticky Headers
- Apply CSS sticky positioning
- Add visual enhancements (shadows, borders)
- Test scroll behavior across browsers

### Phase 5: Polish
- Add animations/transitions
- Optimize performance
- Comprehensive testing
- Documentation updates

## Browser Compatibility

- CSS `position: sticky` is supported in all modern browsers
- localStorage is universally supported
- No polyfills required
- Test in Chrome, Firefox, Safari, Edge

## Future Enhancements

- Sort by faculty name (ascending/descending)
- Filter by faculty (search/select)
- Filter by subject
- Save multiple filter presets
- Export filtered view to CSV
- Keyboard shortcuts for common filters (e.g., "1" for Monday)
