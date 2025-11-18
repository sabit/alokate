# Requirements Document

## Introduction

This feature enhances the Schedule Grid tooltip to display a detailed breakdown of assignment preference scores. Currently, the tooltip shows a combined preference score for each cell, but users cannot see how this score is composed of subject, timeslot, and building preferences. This enhancement will provide transparency into the scoring system and help schedulers understand why certain assignments received specific preference scores.

## Glossary

- **Schedule Grid**: The table component displaying faculty assignments across timeslots
- **Cell Tooltip**: The hover tooltip that appears when a user hovers over a cell in the Schedule Grid
- **Assignment Score**: The total score for an assignment, calculated using weighted components: preference, mobility, seniority, and consecutive
- **Preference Score**: The combined preference rating calculated as the sum of subject preference, timeslot preference, and building preference
- **Subject Preference**: The faculty member's preference rating for teaching a specific subject (range: -3 to +3)
- **Timeslot Preference**: The faculty member's preference rating for a specific timeslot (range: -3 to +3)
- **Building Preference**: The faculty member's preference rating for a specific building location (range: -3 to +3)
- **Mobility Score**: The penalty applied based on building transitions in the faculty's schedule
- **Seniority Score**: The score component based on the faculty member's position in the faculty list
- **Consecutive Score**: The penalty applied for consecutive timeslot assignments, with additional penalty for lunch-hour spanning assignments
- **Score Breakdown**: The detailed display showing all individual components that comprise the total assignment score
- **Cell Assignment**: A section assigned to a faculty member at a specific timeslot in the Schedule Grid

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to see the complete breakdown of assignment scores in the tooltip, so that I can understand how all scoring components (preference, mobility, seniority, consecutive) contribute to the total assignment score

#### Acceptance Criteria

1. WHEN the user hovers over a cell with assignments in the Schedule Grid, THE Cell Tooltip SHALL display the complete score breakdown showing preference score, mobility score, seniority score, and consecutive score as separate values
2. THE Cell Tooltip SHALL display the preference score further broken down into subject preference, timeslot preference, and building preference components
3. THE Cell Tooltip SHALL display each score component with a numeric value formatted with one decimal place and a +/- prefix (e.g., "+2.0", "-1.5", "0.0")
4. THE Cell Tooltip SHALL display the score breakdown for each assignment in the cell when multiple assignments exist
5. WHEN a cell has no building assignment, THE Cell Tooltip SHALL display "N/A" or "—" for the building preference component
6. THE Cell Tooltip SHALL maintain the existing tooltip information (faculty name, timeslot label, section details) while adding the score breakdown

### Requirement 2

**User Story:** As a scheduler, I want the score breakdown to be clearly labeled and easy to read, so that I can quickly identify which scoring components are favorable or unfavorable

#### Acceptance Criteria

1. THE Cell Tooltip SHALL label each score component with clear text: "Preference" (with sub-labels "Subject", "Timeslot", "Building"), "Mobility", "Seniority", and "Consecutive"
2. THE Cell Tooltip SHALL use consistent formatting and alignment for all score values in the breakdown
3. THE Cell Tooltip SHALL display the total assignment score alongside the breakdown components
4. THE Cell Tooltip SHALL use visual hierarchy (font size, weight, spacing, or indentation) to distinguish the preference sub-components from other score components
5. WHEN multiple assignments exist in a cell, THE Cell Tooltip SHALL group each assignment's score breakdown with its corresponding section information

### Requirement 3

**User Story:** As a scheduler, I want the tooltip to remain accessible and performant, so that the enhanced information does not degrade the user experience

#### Acceptance Criteria

1. THE Cell Tooltip SHALL render the preference breakdown without noticeable delay when hovering over cells
2. THE Cell Tooltip SHALL remain readable and not overflow the viewport when displaying preference breakdowns for multiple assignments
3. THE Cell Tooltip SHALL maintain accessibility standards by providing appropriate ARIA labels that include the preference breakdown information
4. THE Cell Tooltip SHALL use the existing tooltip mechanism (HTML title attribute or custom tooltip component) without introducing new UI patterns
5. THE Cell Tooltip SHALL display preference breakdown only for cells with assignments, maintaining the existing behavior for empty cells
