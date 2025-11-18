# Implementation Plan

- [x] 1. Create weight input component and validation utilities





  - Create a reusable WeightInput component with label, number input, and helper text
  - Implement validation logic to clamp values between 0 and 10
  - Implement decimal precision rounding to 2 places
  - Handle invalid input (NaN) by preserving previous value
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3_

- [x] 2. Modify SettingsPanel to add weight configuration UI





  - [x] 2.1 Add weight input controls section to SettingsPanel


    - Import and render 4 WeightInput components (preference, mobility, seniority, consecutive)
    - Use grid layout for responsive design (2 columns on larger screens)
    - Add section heading and description
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.2 Implement weight change handlers


    - Create onChange handler that validates input and calls updateSettings
    - Ensure handler updates the complete settings object (not just weights)
    - Add debouncing to avoid excessive state updates (300ms delay)
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.3 Add reset weights button


    - Create reset button in algorithm weights section
    - Implement click handler that resets all weights to 1.0
    - Call updateSettings with default weight values
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 2.4 Add persistence on weight changes


    - Call saveState after updateSettings in weight change handler
    - Handle persistence errors with toast notifications
    - Ensure complete unified state is saved (not just settings)
    - _Requirements: 1.3, 3.4_

- [x] 3. Update default weights in schedulerStore





  - Change default weights from current values (mobility: 0.8, seniority: 1.2) to standard defaults (all 1.0)
  - Ensure consistency with DEFAULT_WEIGHTS constant in optimizer
  - _Requirements: 3.2_

- [ ] 4. Verify optimizer integration
  - Confirm optimizer reads weights from settings state correctly
  - Verify weight changes affect score calculations in runOptimizer
  - Test that schedule generation uses updated weights
  - _Requirements: 1.4, 1.5_

- [ ]* 5. Write unit tests for weight configuration
  - [ ]* 5.1 Create tests for WeightInput component
    - Test rendering with different props
    - Test value updates and onChange callback
    - Test validation (min, max, decimal precision)
    - Test invalid input handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 5.2 Create tests for SettingsPanel weight controls
    - Test all 4 weight inputs render correctly
    - Test weight value updates call updateSettings
    - Test reset button functionality
    - Test persistence integration (mock saveState)
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 5.3 Create integration test for weight configuration
    - Test end-to-end weight modification flow
    - Test persistence across page reload
    - Test optimizer uses updated weights
    - _Requirements: 1.4, 1.5_
