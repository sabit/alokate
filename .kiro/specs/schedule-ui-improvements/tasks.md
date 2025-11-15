# Implementation Plan

- [x] 1. Extend scheduleUiStore with sort and filter state management





  - Add SortConfig and DayFilterConfig interfaces to the store
  - Implement setSortConfig, toggleSortDirection, setDayFilter, clearDayFilter, and initializeDayFilter actions
  - Add zustand persist middleware to save sort and filter preferences to localStorage
  - Set default values: sort by time ascending, no day filters active
  - _Requirements: 1.5, 3.5_

- [x] 2. Enhance useScheduleGrid hook to support sorting and filtering






- [x] 2.1 Add filtering logic for timeslots by day


  - Accept dayFilter parameter in useScheduleGrid options
  - Filter timeslots array based on selected days from dayFilter
  - Return filtered timeslots when dayFilter is active, otherwise return all timeslots
  - _Requirements: 3.2, 3.3_

- [x] 2.2 Add sorting logic for timeslots

  - Accept sortConfig parameter in useScheduleGrid options
  - Implement sort by time (using start time string comparison)
  - Implement sort by day (using day order: Monday through Sunday)
  - Apply sort direction (ascending or descending)
  - Apply sorting after filtering to maintain correct behavior
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 2.3 Update row generation to use filtered and sorted timeslots

  - Modify the rows generation logic to use the filtered and sorted timeslots array
  - Ensure cells are created in the correct order matching sorted timeslots
  - Update summary calculations to reflect filtered timeslots
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 3. Create SortableTimeslotHeader component





  - Create new component file at frontend/src/components/schedule/ScheduleGrid/SortableTimeslotHeader.tsx
  - Accept timeslot, sortConfig, and onSort props
  - Render timeslot label and day with existing styling
  - Add click handler to trigger sort toggle
  - Display sort indicator icon (↑ for ascending, ↓ for descending) when column is sorted
  - Show sort icon on hover for unsorted columns
  - Apply sticky positioning (top: 0, z-index: 10)
  - Ensure keyboard accessibility (Enter/Space to toggle sort)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2_

- [x] 4. Create DayFilterControl component





  - Create new component file at frontend/src/components/schedule/DayFilterControl.tsx
  - Accept availableDays, selectedDays, visibleCount, totalCount, onDayToggle, and onClearFilters props
  - Render horizontal list of day chips (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  - Apply accent styling to selected day chips
  - Display count text: "Showing X of Y timeslots"
  - Render "Clear filters" button (visible only when filters are active)
  - Ensure keyboard accessibility for day chips and clear button
  - _Requirements: 3.1, 3.4, 3.6, 3.7_

- [x] 5. Update ScheduleGrid component to integrate sorting and filtering






- [x] 5.1 Connect ScheduleGrid to scheduleUiStore for sort and filter state


  - Import and use scheduleUiStore to get sortConfig and dayFilter state
  - Import and use store actions for setSortConfig, toggleSortDirection, setDayFilter, clearDayFilter
  - Initialize dayFilter with available days from timeslots on mount
  - _Requirements: 1.5, 3.5_

- [x] 5.2 Pass sort and filter config to useScheduleGrid hook


  - Update useScheduleGrid call to pass sortConfig and dayFilter as options
  - Receive filtered and sorted timeslots from the hook
  - _Requirements: 4.1, 4.2_

- [x] 5.3 Replace timeslot headers with SortableTimeslotHeader components


  - Replace existing <th> elements in thead with SortableTimeslotHeader components
  - Pass timeslot, sortConfig, and handleSort callback to each header
  - Implement handleSort to toggle sort direction or change sort field
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5.4 Add DayFilterControl above the schedule table


  - Calculate availableDays from all timeslots (unique days)
  - Calculate visibleCount from filtered timeslots length
  - Calculate totalCount from all timeslots length
  - Render DayFilterControl with appropriate props
  - Implement handleDayToggle to update dayFilter in store
  - Implement handleClearFilters to clear dayFilter in store
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

- [ ] 6. Apply sticky header CSS styling
  - Add sticky positioning to faculty column header (top: 0, left: 0, z-index: 20)
  - Add sticky positioning to faculty cells (left: 0, z-index: 10)
  - Add sticky positioning to timeslot headers (already done in SortableTimeslotHeader)
  - Add subtle box-shadow to sticky elements for depth perception
  - Ensure opaque backgrounds on sticky elements to prevent content bleed-through
  - Test scroll behavior in both directions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Update FilterBar to integrate DayFilterControl




  - Move DayFilterControl rendering from ScheduleGrid to FilterBar component
  - Pass necessary props from ScheduleGrid context to FilterBar
  - Adjust FilterBar layout to accommodate day filter controls
  - Ensure visual consistency with existing filter controls
  - _Requirements: 3.1, 3.6_

- [x] 8. Handle edge cases and error states





  - Add guards for empty timeslots (disable sort, hide day filter)
  - Add fallback for invalid persisted sort config (reset to default)
  - Add fallback for invalid persisted day filter (clear filter)
  - Display appropriate empty state when no timeslots exist
  - Log warnings to console for debugging when fallbacks are triggered
  - _Requirements: 1.5, 3.5_
