# Implementation Plan

- [x] 1. Create ContextMenu component





  - Create a new reusable ContextMenu component that displays a positioned overlay menu
  - Implement click-outside detection to close the menu
  - Implement Escape key handler to close the menu
  - Add proper ARIA attributes (role="menu", aria-label)
  - Handle viewport edge detection to keep menu within bounds
  - Style with Tailwind CSS matching existing component patterns
  - _Requirements: 1.1, 1.3, 1.4, 4.4_

- [x] 2. Create MenuItem component





  - Create a reusable MenuItem component for use within ContextMenu
  - Implement disabled state with appropriate styling
  - Handle keyboard activation (Enter and Space keys)
  - Add hover and focus states
  - Add proper ARIA attributes (role="menuitem", aria-disabled)
  - Style with Tailwind CSS matching existing patterns
  - _Requirements: 2.2, 2.4, 4.3_

- [x] 3. Integrate context menu into ScheduleGrid





- [x] 3.1 Add context menu state management


  - Add local state to track context menu open/closed status
  - Add state to track context menu position (x, y coordinates)
  - Add state to track which cell (facultyId, timeslotId) triggered the menu
  - Create handler to open context menu with cell data
  - Create handler to close context menu
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3.2 Add right-click event handling to cells


  - Add onContextMenu handler to cell buttons
  - Prevent default browser context menu
  - Calculate menu position from mouse event
  - Open context menu with cell's facultyId and timeslotId
  - _Requirements: 1.1, 1.2_

- [x] 3.3 Add keyboard context menu trigger


  - Add keyboard event handler for Shift+F10 and Context Menu key
  - Calculate menu position relative to focused cell
  - Open context menu for the currently focused cell
  - _Requirements: 4.1_

- [x] 3.4 Implement clear assignment functionality


  - Create handler function to clear assignments
  - Filter schedule entries to remove all entries matching the cell's facultyId and timeslotId
  - Call updateSchedule with filtered schedule array
  - Close context menu after clearing
  - Add toast notification for user feedback (optional)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.5 Render ContextMenu with MenuItem


  - Render ContextMenu component when context menu state is open
  - Pass position and close handler to ContextMenu
  - Render "Clear Assignment" MenuItem inside ContextMenu
  - Determine if cell has assignments to set disabled state
  - Show count of assignments in label when multiple exist
  - Pass clear assignment handler to MenuItem onClick
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_

- [x] 3.6 Handle context menu closure on cell changes


  - Close context menu when activeCell changes
  - Close context menu when user navigates with arrow keys
  - Ensure context menu doesn't interfere with existing cell interactions
  - _Requirements: 1.3_

- [ ]* 4. Add tests for ContextMenu component
  - Test menu renders at correct position
  - Test menu closes on outside click
  - Test menu closes on Escape key
  - Test ARIA attributes are present
  - _Requirements: 1.1, 1.3, 1.4, 4.4_

- [ ]* 5. Add tests for MenuItem component
  - Test MenuItem renders with correct label
  - Test MenuItem handles click events
  - Test MenuItem respects disabled state
  - Test MenuItem handles keyboard activation
  - Test ARIA attributes are present
  - _Requirements: 2.4, 4.3_

- [ ]* 6. Add integration tests for clear assignment flow
  - Test right-click opens context menu
  - Test clicking "Clear Assignment" removes assignments from schedule
  - Test context menu closes after clearing
  - Test disabled state when cell has no assignments
  - Test clearing multiple assignments at once
  - Test keyboard shortcut opens context menu
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1_
