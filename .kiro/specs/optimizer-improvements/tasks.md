# Implementation Plan

- [x] 1. Update type definitions for enhanced score breakdown




  - Modify `ScoreBreakdown` interface in `frontend/src/types/index.ts` to include `capacityPenalty` field
  - Ensure backward compatibility with existing code
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement conflict detection system in optimizer



  - [x] 2.1 Create ConflictTracker class in optimizer.ts


    - Implement `Map<string, Set<string>>` data structure for faculty timeslot tracking
    - Add `hasConflict(facultyId, timeslotId)` method for O(1) conflict checking
    - Add `addAssignment(facultyId, timeslotId)` method to register assignments
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Initialize conflict tracker with locked entries


    - Extract locked entries from current schedule during initialization
    - Populate conflict tracker with all locked faculty-timeslot pairs
    - _Requirements: 1.4_

  - [x] 2.3 Integrate conflict checking into assignment flow


    - Check for conflicts before finalizing any faculty assignment
    - Filter out conflicting timeslots from candidate consideration
    - Ensure final schedule has zero conflicts
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement seniority scoring





  - [x] 3.1 Create seniority calculation helper function


    - Calculate seniority as `(totalFaculty - facultyIndex)` based on array position
    - Handle edge case of single faculty member
    - _Requirements: 3.1, 3.4_

  - [x] 3.2 Integrate seniority into candidate scoring


    - Add `seniorityScore` field to `FacultyCandidate` interface
    - Calculate seniority bonus: `seniority * weights.seniority`
    - Include seniority in total score calculation
    - Skip calculation when seniority weight is zero
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Update score breakdown with seniority component


    - Store seniority score in `ScoreBreakdown` for each schedule entry
    - _Requirements: 7.1, 7.4_

- [x] 4. Implement mobility scoring





  - [x] 4.1 Create helper to get faculty's chronological assignments


    - Collect all assignments for a faculty member (locked + current)
    - Sort assignments by timeslot chronologically using timeslot order from config
    - Extract building IDs from room assignments
    - _Requirements: 2.1, 2.4_

  - [x] 4.2 Calculate building transition penalty


    - Identify consecutive assignments in different buildings
    - Apply penalty: `-1 * mobilityValue` for each transition
    - Higher mobility value = higher penalty (less mobile faculty)
    - _Requirements: 2.1, 2.2_

  - [x] 4.3 Integrate mobility into candidate scoring


    - Add `mobilityScore` field to `FacultyCandidate` interface
    - Calculate mobility penalty for potential assignment
    - Include mobility in total score calculation
    - Skip calculation when mobility weight is zero or no mobility data exists
    - _Requirements: 2.1, 2.3_

  - [x] 4.4 Update score breakdown with mobility component


    - Store mobility score in `ScoreBreakdown` for each schedule entry
    - _Requirements: 7.1, 7.4_

- [x] 5. Implement section prioritization





  - [x] 5.1 Create feasibility analysis function


    - For each section, count faculty members who can be assigned without conflicts
    - Check capacity constraints (within limit or overload allowed)
    - Return feasibility count for each section
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Sort sections by difficulty


    - Sort sections by feasible candidate count (ascending)
    - Use section ID as secondary sort for determinism
    - Process sections in calculated priority order
    - _Requirements: 6.1, 6.4_

  - [x] 5.3 Handle sections with zero feasible candidates


    - Attempt assignment with least-penalized candidate
    - Skip section if assignment is impossible
    - Track skipped sections for reporting
    - _Requirements: 6.3, 8.1_

- [x] 6. Enhance capacity penalty calculation





  - [x] 6.1 Separate capacity penalty from total score


    - Extract capacity penalty calculation into separate variable
    - Store in `capacityPenalty` field of score breakdown
    - _Requirements: 7.3_

  - [x] 6.2 Improve capacity penalty logic


    - Apply escalating penalty for overload assignments
    - Ensure penalty increases with degree of overload
    - Use formula: `-50 * (overloadAmount + 1)` for escalating penalty
    - Apply severe penalty (-1000) when exceeding hard limits
    - _Requirements: 4.2, 4.3_

- [x] 7. Update score calculation and breakdown






  - [x] 7.1 Refactor total score calculation

    - Combine preference, mobility, seniority, and capacity components
    - Use formula: `(preference * weight) + (mobility * weight) + (seniority * weight) + capacityPenalty`
    - _Requirements: 7.2_

  - [x] 7.2 Populate complete score breakdown for all entries


    - Set all score breakdown fields (preference, mobility, seniority, capacityPenalty, total)
    - Ensure locked entries also have score breakdowns
    - _Requirements: 7.1, 7.4_

- [x] 8. Improve edge case handling





  - [x] 8.1 Handle missing faculty or section data gracefully


    - Skip invalid entries without throwing errors
    - Continue processing remaining sections
    - _Requirements: 8.1, 8.2, 8.4_


  - [x] 8.2 Handle missing preference and mobility data

    - Treat missing preferences as 0 (neutral)
    - Treat missing mobility as 0 (no penalty)
    - _Requirements: 8.4_

  - [x] 8.3 Handle fully occupied faculty schedules


    - When all timeslots are occupied, consider alternative faculty
    - Ensure algorithm doesn't get stuck
    - _Requirements: 8.3, 8.4_

- [x] 9. Add optional progress tracking infrastructure






  - [x]* 9.1 Create progress tracking data structure


    - Track total sections, processed sections, assigned sections, skipped sections
    - _Requirements: 9.3, 9.4_

  - [x]* 9.2 Add progress update hooks


    - Update progress counters during section processing
    - Provide mechanism for external progress monitoring (console.log or callback)
    - _Requirements: 9.3, 9.4_

- [x] 10. Optimize data structures and performance






  - [x]* 10.1 Use efficient lookup maps

    - Maintain existing Map structures for O(1) lookups
    - Add timeslot lookup map if needed for chronological sorting
    - _Requirements: 9.1_


  - [ ]* 10.2 Cache intermediate calculations
    - Cache faculty seniority values
    - Cache timeslot chronological order
    - Avoid redundant preference lookups
    - _Requirements: 9.2_

- [x] 11. Add test coverage for optimizer improvements






  - [x]* 11.1 Add conflict detection tests


    - Test conflict identification with overlapping timeslots
    - Test conflict-free schedule generation
    - Test locked entry conflict handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_


  - [ ]* 11.2 Add mobility scoring tests
    - Test mobility penalty calculation for building transitions
    - Test that higher mobility values create higher penalties
    - Test edge cases (no mobility data, no building data)
    - _Requirements: 2.1, 2.2, 2.3_


  - [x]* 11.3 Add seniority scoring tests

    - Test seniority calculation from array index
    - Test that earlier faculty get higher scores
    - Test edge case of single faculty member
    - _Requirements: 3.1, 3.2, 3.4_


  - [x]* 11.4 Add section prioritization tests

    - Test feasibility counting
    - Test priority sorting (fewest candidates first)
    - Test handling of sections with zero candidates
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 11.5 Add integration tests


    - Test end-to-end with small dataset (5 faculty, 10 sections)
    - Test determinism (same seed produces same results)
    - Test that generated schedules have no conflicts
    - Test that locked entries are preserved
    - _Requirements: 1.3, 4.1, 8.4_
