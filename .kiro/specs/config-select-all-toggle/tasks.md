# Implementation Plan

- [x] 1. Add select all toggle logic to ConfigDataTables component





  - Add three useMemo hooks to compute `allCanOverload`, `noneCanOverload`, and `isIndeterminate` states based on the faculty array
  - Implement `handleToggleAllCanOverload` function that updates all faculty members' canOverload property
  - The handler should set all to true when none are checked, and set all to false when all are checked or indeterminate
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 2. Update the Can Overload column header JSX





  - Modify the Can Overload `<th>` element to include a checkbox input alongside the label text
  - Use a flex container with gap-2 to align the checkbox and label horizontally
  - Set the checkbox's checked state to `allCanOverload`
  - Use a ref callback to set the indeterminate property when `isIndeterminate` is true
  - Add onChange handler to call `handleToggleAllCanOverload`
  - Disable the checkbox when faculty array is empty
  - Apply the same CSS classes used for individual row checkboxes
  - Add aria-label for accessibility
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 3.3, 3.4_

- [ ]* 3. Write tests for select all toggle functionality
  - Create test file for ConfigDataTables component if it doesn't exist
  - Write unit tests for the three computed states (allCanOverload, noneCanOverload, isIndeterminate)
  - Write tests for handleToggleAllCanOverload behavior in all scenarios (all checked, none checked, indeterminate)
  - Write integration test verifying that individual checkbox changes update the header checkbox state
  - Write test for disabled state when faculty array is empty
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4_
