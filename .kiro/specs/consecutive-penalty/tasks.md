# Implementation Plan

- [x] 1. Update type definitions and data structures





  - Add `consecutive: Record<string, number>` field to the `Preferences` interface in `frontend/src/types/index.ts`
  - Add `consecutive: number` field to the `ScoreBreakdown` interface
  - Add `consecutive: number` field to the `Settings.weights` interface
  - _Requirements: 1.1, 1.4, 4.1, 4.4, 5.2_

- [x] 2. Initialize consecutive preferences in store





  - Update `emptyState` function in `frontend/src/store/schedulerStore.ts` to initialize `consecutive: {}` in preferences
  - Add `consecutive: 1.0` to the default weights in settings
  - _Requirements: 1.1, 1.4, 4.3_

- [x] 3. Implement consecutive penalty calculation logic





  - [x] 3.1 Create time parsing utility function


    - Implement `parseTimeToMinutes` function to convert "HH:MM" format to minutes
    - _Requirements: 3.4_

  - [x] 3.2 Create lunch hour detection function


    - Implement `isLunchHourPair` function to detect if consecutive timeslots span lunch hours (11:00-14:00)
    - Use `parseTimeToMinutes` to parse timeslot start and end times
    - _Requirements: 3.3, 3.4_

  - [x] 3.3 Create consecutive penalty calculation function


    - Implement `calculateConsecutivePenalty` function in `frontend/src/engine/optimizer.ts`
    - Get faculty's chronological assignments using timeslot index map
    - Insert new assignment and sort by timeslot index
    - Count consecutive pairs (adjacent timeslot indices)
    - Apply doubled penalty for lunch hour pairs using `isLunchHourPair`
    - Return penalty as `-1 * consecutiveValue * consecutiveCount`
    - Handle edge case where consecutive value is 0 (return 0 immediately)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4. Integrate consecutive penalty into optimizer algorithm





  - [x] 4.1 Update DEFAULT_WEIGHTS constant


    - Add `consecutive: 1` to the `DEFAULT_WEIGHTS` object in `frontend/src/engine/optimizer.ts`
    - _Requirements: 4.3_

  - [x] 4.2 Update FacultyCandidate interface

    - Add `consecutiveScore: number` field to the `FacultyCandidate` interface
    - _Requirements: 5.2_

  - [x] 4.3 Update buildCandidateList function

    - Calculate consecutive score for each faculty candidate using `calculateConsecutivePenalty`
    - Get consecutive value from preferences with default of 1: `preferences.consecutive?.[faculty.id] ?? 1`
    - Apply consecutive weight: `consecutiveComponent = consecutiveScore * weights.consecutive`
    - Include consecutive component in total score calculation
    - Add `consecutiveScore` to returned candidate object
    - _Requirements: 1.3, 3.1, 3.2, 3.5, 4.2, 5.1_

  - [x] 4.4 Update schedule entry creation for new assignments

    - Include `consecutive: selectedCandidate.consecutiveScore` in the `scoreBreakdown` object
    - Update total score calculation to include consecutive component
    - _Requirements: 5.1, 5.2, 5.5_


  - [x] 4.5 Update locked entry score calculation

    - Calculate consecutive score for locked entries using `calculateConsecutivePenalty`
    - Include consecutive component in total score calculation
    - Add `consecutive: consecutiveScore` to the score breakdown
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 5. Add consecutive penalty UI to preferences page





  - [x] 5.1 Update PreferenceMatrix component structure


    - Add `'consecutive'` to the `PreferenceView` type in `frontend/src/components/preferences/PreferenceMatrix.tsx`
    - Add consecutive view definition to `matrixViews` array with label "Consecutive" and description
    - _Requirements: 2.1, 2.2_


  - [x] 5.2 Implement consecutive view rendering

    - Add conditional rendering for `activeView === 'consecutive'` in `renderMatrix` function
    - Display list of faculty members with range sliders (min=0, max=3, step=1)
    - Show current consecutive value with default of 1: `preferences.consecutive?.[faculty.id] ?? 1`
    - Use amber accent color for sliders to distinguish from mobility (emerald)
    - Add descriptive text explaining penalty doubles for lunch hours
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.3 Implement consecutive change handler

    - Create `handleConsecutiveChange` callback function
    - Update preferences with new consecutive value for faculty
    - Call `schedulePersist` to save changes
    - _Requirements: 2.3, 2.5_

  - [x] 5.4 Update fill neutral functionality


    - Add handling for `activeView === 'consecutive'` in `handleFillNeutral` function
    - Set all faculty consecutive values to 1 (default value)
    - Persist changes to storage
    - _Requirements: 2.5_

- [x] 6. Update settings panel to display consecutive weight





  - Modify algorithm weights display text in `frontend/src/components/settings/SettingsPanel.tsx`
  - Add consecutive weight to the displayed weights: `consecutive weight: {settings.weights.consecutive.toFixed(2)}`
  - _Requirements: 4.5_

- [x] 7. Verify data persistence and migration





  - Test that consecutive preferences are saved to IndexedDB when modified
  - Test that consecutive weight is persisted in settings
  - Verify that existing data without consecutive field loads correctly with defaults
  - _Requirements: 1.4, 4.4_
