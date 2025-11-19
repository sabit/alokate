# Implementation Plan

- [x] 1. Update data model and create color utilities





  - Add optional `color` field to `Subject` interface in `frontend/src/types/index.ts`
  - Create `frontend/src/utils/colorUtils.ts` with utility functions: `getDefaultSubjectColor`, `ensureSubjectColors`, `getContrastTextColor`, `isValidHexColor`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.5_

- [x] 2. Implement ColorPicker component





  - Create `frontend/src/components/config/ColorPicker.tsx` component
  - Implement color swatch display with current color
  - Add native HTML5 color input integration
  - Implement color validation and change handler
  - Add ARIA labels and keyboard accessibility support
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 3. Integrate color assignment in store





  - Modify `updateConfig` function in `frontend/src/store/schedulerStore.ts` to call `ensureSubjectColors`
  - Ensure default colors are assigned when subjects are loaded without colors
  - _Requirements: 1.1, 1.2, 1.3, 5.3_

- [x] 4. Add color picker to Config View subjects table





  - Modify `ConfigDataTables.tsx` to add a "Color" column in the subjects table
  - Implement `updateSubject` function to handle subject updates including color changes
  - Render `ColorPicker` component for each subject row
  - Ensure color changes persist to the store
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Apply subject colors to Preferences page headers





  - Modify `PreferenceMatrix.tsx` to apply subject colors to column headers when `activeView === 'subjects'`
  - Use `getContrastTextColor` to ensure readable text on colored backgrounds
  - Retrieve subject color from config using subject ID
  - Apply colors using inline styles
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Apply subject colors to Schedule grid cells





  - Modify `ScheduleGrid.tsx` to apply subject colors to cell backgrounds
  - Retrieve subject from section, then get color from subject
  - Use `getContrastTextColor` for text elements within colored cells
  - Maintain existing border styles for conflicts and locked states
  - Provide fallback color for subjects without colors
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Ensure import/export compatibility





  - Verify that subject colors are included when exporting configuration
  - Test importing configurations with and without colors
  - Ensure default colors are assigned when importing configurations without colors
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 8. Write unit tests for color utilities
  - Create `frontend/src/utils/__tests__/colorUtils.test.ts`
  - Test `getDefaultSubjectColor` with various indices including cycling
  - Test `ensureSubjectColors` with subjects with and without colors
  - Test `getContrastTextColor` with light and dark backgrounds
  - Test `isValidHexColor` with valid and invalid color codes

- [ ]* 9. Write tests for ColorPicker component
  - Create `frontend/src/components/config/__tests__/ColorPicker.test.tsx`
  - Test rendering with initial color
  - Test color change callback is invoked
  - Test validation rejects invalid colors
  - Test keyboard accessibility (Enter/Space to open)

- [ ]* 10. Write integration tests for Config View
  - Update `frontend/src/components/config/__tests__/ConfigDataTables.test.tsx`
  - Test color picker appears in subjects table
  - Test updating subject color persists to store
  - Test default colors are assigned to subjects without colors
