# Implementation Plan

- [x] 1. Create score formatting utility functions





  - Create `frontend/src/utils/scoreFormatters.ts` file
  - Implement `formatScore` function to format numbers with +/- prefix and one decimal place
  - Implement `calculatePreferenceBreakdown` function to extract subject, timeslot, and building preferences from the preferences object
  - Implement `buildScoreTooltip` function to generate formatted tooltip text with score breakdown
  - _Requirements: 1.2, 1.3, 2.2_

- [x] 1.1 Write unit tests for score formatting utilities






  - Create test file `frontend/src/utils/__tests__/scoreFormatters.test.ts`
  - Test `formatScore` with positive, negative, and zero values
  - Test `calculatePreferenceBreakdown` with various preference combinations and missing data
  - Test `buildScoreTooltip` with complete data, partial data, and edge cases
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 2. Enhance tooltip content in ScheduleGrid component





  - Modify the tooltip building logic in `frontend/src/components/schedule/ScheduleGrid/ScheduleGrid.tsx`
  - Import the utility functions from `scoreFormatters.ts`
  - Update the tooltip text generation to include score breakdown for cells with assignments
  - Calculate preference breakdown for each assignment using the new utility function
  - Format the tooltip to display all score components (preference breakdown, mobility, seniority, consecutive, total)
  - Handle edge cases: missing building, missing score data, multiple assignments
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 2.1, 2.2, 2.3, 2.5_

- [x] 3. Update accessibility labels





  - Update the `aria-label` attribute in the cell button to include score breakdown information
  - Ensure the accessible label follows a logical reading order for screen readers
  - Maintain existing accessibility for cells without assignments
  - _Requirements: 3.3_

- [ ]* 3.1 Test tooltip display and accessibility
  - Verify tooltip shows breakdown for cells with single assignment
  - Verify tooltip shows breakdown for cells with multiple assignments
  - Verify tooltip maintains existing behavior for empty cells
  - Test with keyboard navigation to ensure tooltip information is accessible
  - Test with screen reader to verify aria-label announces score breakdown
  - Verify tooltip doesn't overflow viewport on different screen sizes
  - _Requirements: 1.1, 1.4, 2.5, 3.1, 3.2, 3.3_
