# Requirements Document

## Introduction

This document specifies requirements for improving the schedule optimizer algorithm. The current optimizer uses a greedy assignment approach that assigns faculty to sections based on preferences and capacity constraints. The improvements will address conflict detection, implement unused scoring components (mobility and seniority), add global optimization capabilities, and enhance the overall quality of generated schedules.

## Glossary

- **Optimizer**: The algorithm that automatically assigns faculty members to course sections based on preferences, constraints, and optimization criteria
- **Schedule Entry**: A single assignment linking a faculty member to a section with a specific timeslot and room
- **Conflict**: A situation where a faculty member is assigned to multiple sections that overlap in time
- **Locked Entry**: A schedule entry that has been manually pinned by the user and must not be changed by the optimizer
- **Faculty Load**: The number of sections currently assigned to a faculty member
- **Capacity**: The maximum number of sections a faculty member can teach (base + optional overload)
- **Preference Score**: A numeric value (-3 to +3) indicating how much a faculty member prefers teaching a subject, timeslot, or building
- **Mobility Score**: A numeric value indicating how easily a faculty member can move between buildings
- **Seniority**: A measure of faculty member experience or rank used for prioritization
- **Greedy Algorithm**: An algorithm that makes locally optimal choices at each step without considering global optimization
- **Backtracking**: The ability to undo previous assignments and try alternative solutions

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want the optimizer to detect and prevent scheduling conflicts, so that no faculty member is assigned to overlapping sections

#### Acceptance Criteria

1. WHEN the Optimizer assigns a faculty member to a section, THE Optimizer SHALL verify that the timeslot does not overlap with any existing assignments for that faculty member
2. IF a timeslot assignment would create a conflict, THEN THE Optimizer SHALL exclude that timeslot from consideration for the assignment
3. WHEN the Optimizer completes schedule generation, THE Optimizer SHALL produce a schedule with zero timeslot conflicts for all faculty members
4. WHEN a locked entry creates a conflict with a potential assignment, THE Optimizer SHALL respect the locked entry and find an alternative assignment

### Requirement 2

**User Story:** As a scheduler, I want the optimizer to consider faculty mobility between buildings, so that faculty with low mobility are not assigned to sections in distant buildings

#### Acceptance Criteria

1. WHEN the Optimizer calculates a candidate score, THE Optimizer SHALL incorporate the mobility score multiplied by the mobility weight from settings
2. WHEN a faculty member has a low mobility score and a section is in a different building than their previous assignment, THE Optimizer SHALL apply a penalty to the candidate score
3. WHEN the mobility weight is set to zero in settings, THE Optimizer SHALL exclude mobility from score calculations
4. THE Optimizer SHALL calculate building transitions by comparing the building of consecutive timeslots in chronological order

### Requirement 3

**User Story:** As a scheduler, I want the optimizer to consider faculty seniority, so that senior faculty receive priority for preferred assignments

#### Acceptance Criteria

1. WHEN the Optimizer calculates a candidate score, THE Optimizer SHALL incorporate the seniority value multiplied by the seniority weight from settings
2. WHEN the seniority weight is set to zero in settings, THE Optimizer SHALL exclude seniority from score calculations
3. THE Optimizer SHALL retrieve seniority values from the faculty configuration data
4. WHEN a faculty member has no seniority value defined, THE Optimizer SHALL treat the seniority as zero

### Requirement 4

**User Story:** As a scheduler, I want the optimizer to balance workload across faculty members, so that no faculty member is significantly overloaded while others are underutilized

#### Acceptance Criteria

1. WHEN the Optimizer assigns sections, THE Optimizer SHALL prioritize faculty members with lower current load when scores are equal
2. WHEN a faculty member reaches their maximum capacity, THE Optimizer SHALL apply a significant penalty to further assignments
3. WHEN a faculty member exceeds their maximum capacity, THE Optimizer SHALL apply an escalating penalty based on the degree of overload
4. THE Optimizer SHALL calculate load balance by comparing the standard deviation of faculty loads before and after each assignment

### Requirement 5

**User Story:** As a scheduler, I want the optimizer to provide multiple solution attempts, so that I can choose from different schedule variations

#### Acceptance Criteria

1. WHEN the Optimizer is invoked with a different seed value, THE Optimizer SHALL produce a different but valid schedule
2. THE Optimizer SHALL use the seed value to deterministically break ties in candidate scoring
3. WHEN the Optimizer completes, THE Optimizer SHALL include a total score in the result that represents overall schedule quality
4. THE Optimizer SHALL calculate the total score by summing all individual assignment scores

### Requirement 6

**User Story:** As a scheduler, I want the optimizer to prioritize sections that are harder to assign, so that difficult assignments are made first before options become limited

#### Acceptance Criteria

1. WHEN the Optimizer begins assignment, THE Optimizer SHALL sort sections by the number of feasible faculty candidates in ascending order
2. THE Optimizer SHALL define a feasible candidate as a faculty member who can teach the section without exceeding capacity or creating conflicts
3. WHEN a section has zero feasible candidates, THE Optimizer SHALL attempt assignment with the least-penalized candidate
4. THE Optimizer SHALL process sections in the calculated priority order rather than configuration order

### Requirement 7

**User Story:** As a scheduler, I want the optimizer to provide detailed scoring information, so that I can understand why specific assignments were made

#### Acceptance Criteria

1. WHEN the Optimizer creates a schedule entry, THE Optimizer SHALL populate the score breakdown with preference, mobility, and seniority components
2. THE Optimizer SHALL calculate the total score as the sum of all weighted components
3. WHEN a penalty is applied for capacity or conflicts, THE Optimizer SHALL include the penalty in the score breakdown
4. THE Optimizer SHALL store the score breakdown in each schedule entry for user inspection

### Requirement 8

**User Story:** As a scheduler, I want the optimizer to handle edge cases gracefully, so that the system remains stable even with unusual configurations

#### Acceptance Criteria

1. WHEN no faculty members are available for a section, THE Optimizer SHALL skip the section and continue processing
2. WHEN a section has no valid timeslot, THE Optimizer SHALL skip the section and continue processing
3. WHEN all timeslots for a faculty member are occupied, THE Optimizer SHALL consider alternative faculty members
4. THE Optimizer SHALL complete execution without errors even when optimal assignments are impossible

### Requirement 9

**User Story:** As a scheduler, I want the optimizer to provide visual feedback during processing, so that I know the system is working on large datasets

#### Acceptance Criteria

1. THE Optimizer SHALL use efficient data structures to minimize lookup time for conflicts and preferences
2. THE Optimizer SHALL avoid redundant calculations by caching intermediate results where appropriate
3. WHEN the Optimizer processes sections, THE Optimizer SHALL provide progress updates that can be displayed to the user
4. THE Optimizer SHALL report the number of sections processed and remaining during execution
