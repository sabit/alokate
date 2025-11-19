# Implementation Plan

- [x] 1. Implement subject sorting in ConfigDataTables





  - Add `sortedSubjects` computed value using `useMemo` that sorts subjects by code property with case-insensitive comparison
  - Replace `config.subjects.map()` with `sortedSubjects.map()` in the subjects table rendering
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement room sorting by building name in ConfigDataTables





  - Add `sortedRooms` computed value using `useMemo` that sorts rooms by building label (primary) and room label (secondary)
  - Handle rooms with missing building references by using buildingId as fallback
  - Replace `config.rooms.map()` with `sortedRooms.map()` in the rooms table rendering
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Implement section count by subject feature




- [x] 3.1 Create section count computation


  - Add `sectionCountBySubject` computed value using `useMemo` that groups sections by subject and counts them
  - Create a Map structure with subject ID as key and object containing subject reference and count as value
  - Handle sections with missing subject references gracefully
  - _Requirements: 1.1, 1.4_

- [x] 3.2 Add section count summary display


  - Create a summary section above the sections table that displays when the table is expanded
  - Format each subject as a badge showing "Subject Code (count)"
  - Use inline/flex layout with appropriate spacing and styling consistent with existing design
  - Apply slate color palette matching other UI elements
  - _Requirements: 1.2, 1.3_

- [ ]* 4. Write unit tests for sorting and counting logic
  - Create or update `frontend/src/components/config/__tests__/ConfigDataTables.test.tsx`
  - Test subject sorting with various code formats and case sensitivity
  - Test room sorting with multiple buildings and secondary sort by room label
  - Test section count calculation with multiple subjects and edge cases
  - Test handling of missing references (sections without subjects, rooms without buildings)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
