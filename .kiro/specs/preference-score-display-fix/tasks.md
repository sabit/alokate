# Implementation Plan

- [x] 1. Update tooltip preference calculation in ScheduleGrid component





  - Modify the tooltip generation logic to calculate effective preference based on assignments
  - When assignments exist, calculate average preference from assignment score breakdowns
  - When no assignments exist, use the existing cell.preference value
  - Update the tooltip to include appropriate labeling (Assignment Preference vs Timeslot Preference)
  - Handle edge cases where assignment.score might be undefined
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 2. Handle decimal preference values in formatting





  - Update or verify formatPreference function handles decimal values from averaging
  - Round averaged preference values to appropriate precision for display
  - Ensure formatting maintains the +/- prefix convention
  - _Requirements: 1.4_

- [ ]* 3. Test the preference score display fix
  - Verify tooltips show correct preference scores for cells with assignments
  - Verify tooltips show timeslot preference for empty cells
  - Test cells with multiple assignments show averaged values
  - Verify detail panel continues to show individual assignment scores correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_
