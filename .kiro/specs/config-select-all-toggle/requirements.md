# Requirements Document

## Introduction

This feature adds a "select all" toggle to the Can Overload column header in the Faculty configuration table. This enhancement allows users to quickly enable or disable the overload capability for all faculty members at once, improving efficiency when managing large faculty rosters.

## Glossary

- **Faculty Configuration Table**: The table in the Configuration section displaying faculty members and their properties
- **Can Overload Column**: The column in the Faculty Configuration Table containing checkboxes that indicate whether each faculty member can take overload assignments
- **Select All Toggle**: A checkbox in the column header that controls the state of all checkboxes in that column
- **Overload Capability**: The ability for a faculty member to be assigned sections beyond their maximum section limit

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to toggle all faculty members' overload capability at once, so that I can quickly enable or disable overload for the entire faculty roster

#### Acceptance Criteria

1. THE Faculty Configuration Table SHALL display a checkbox in the Can Overload column header
2. WHEN the user clicks the header checkbox and all faculty members have canOverload set to false, THE Faculty Configuration Table SHALL set canOverload to true for all faculty members
3. WHEN the user clicks the header checkbox and all faculty members have canOverload set to true, THE Faculty Configuration Table SHALL set canOverload to false for all faculty members
4. WHEN the user clicks the header checkbox and faculty members have mixed canOverload states, THE Faculty Configuration Table SHALL set canOverload to true for all faculty members
5. THE Faculty Configuration Table SHALL update all individual row checkboxes to reflect the new state after the header checkbox is clicked

### Requirement 2

**User Story:** As a scheduler, I want to see the current state of the select all toggle, so that I can understand whether all, some, or no faculty members can take overload

#### Acceptance Criteria

1. WHEN all faculty members have canOverload set to true, THE Faculty Configuration Table SHALL display the header checkbox as checked
2. WHEN all faculty members have canOverload set to false, THE Faculty Configuration Table SHALL display the header checkbox as unchecked
3. WHEN some faculty members have canOverload set to true and others have it set to false, THE Faculty Configuration Table SHALL display the header checkbox in an indeterminate state (dash or partial check)
4. WHEN the user modifies an individual faculty member's canOverload checkbox, THE Faculty Configuration Table SHALL update the header checkbox state to reflect the new overall state

### Requirement 3

**User Story:** As a scheduler, I want the select all toggle to work seamlessly with existing functionality, so that I can use it alongside individual checkbox controls without issues

#### Acceptance Criteria

1. WHEN the user toggles the header checkbox, THE Faculty Configuration Table SHALL trigger the same state persistence mechanism used for individual checkbox changes
2. WHEN the user toggles the header checkbox, THE Faculty Configuration Table SHALL maintain the expanded/collapsed state of the Faculty section
3. THE Faculty Configuration Table SHALL apply the same visual styling to the header checkbox as used for individual row checkboxes
4. WHEN the Faculty Configuration Table has no faculty members, THE Faculty Configuration Table SHALL disable the header checkbox
