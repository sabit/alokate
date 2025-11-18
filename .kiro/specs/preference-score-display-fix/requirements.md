# Requirements Document

## Introduction

This document specifies requirements for fixing the preference score display issue in the Schedule Grid. Currently, all preference scores show as 0 in the grid cells, even though the actual assignment preference scores are calculated correctly by the optimizer. The issue is that the grid displays only the faculty-timeslot preference component instead of the complete assignment preference score.

## Glossary

- **Schedule Grid**: The visual table component that displays faculty assignments across timeslots
- **Cell**: An individual grid cell representing a faculty member at a specific timeslot
- **Assignment**: A scheduled section assigned to a faculty member at a specific timeslot
- **Preference Score**: The combined preference value including subject, timeslot, and building preferences
- **Faculty-Timeslot Preference**: A single component of the preference score representing only the timeslot preference
- **Score Breakdown**: The detailed scoring information stored with each assignment including preference, mobility, seniority, and total scores

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to see the correct preference scores in the Schedule Grid cell tooltips, so that I can make informed decisions about assignments.

#### Acceptance Criteria

1. WHEN an assignment exists in a cell, THE Schedule Grid tooltip SHALL display the assignment's combined preference score from the score breakdown
2. WHEN multiple assignments exist in a cell, THE Schedule Grid tooltip SHALL display the average preference score across all assignments
3. WHEN no assignments exist in a cell, THE Schedule Grid tooltip SHALL display the faculty-timeslot preference value
4. THE Schedule Grid tooltip SHALL display preference scores with proper formatting (positive values with + prefix, negative values with - prefix)

### Requirement 2

**User Story:** As a scheduler, I want the cell tooltip to clearly distinguish between different types of preference information, so that I understand what the score represents.

#### Acceptance Criteria

1. WHEN hovering over a cell with assignments, THE Schedule Grid tooltip SHALL label the score as the assignment preference score
2. WHEN hovering over a cell without assignments, THE Schedule Grid tooltip SHALL label the score as the faculty-timeslot preference
3. THE tooltip SHALL use clear labeling to distinguish between assignment-based and timeslot-based preferences

### Requirement 3

**User Story:** As a scheduler, I want the cell styling to reflect the actual assignment preference scores, so that I can visually identify favorable and unfavorable assignments.

#### Acceptance Criteria

1. WHEN an assignment exists in a cell, THE Schedule Grid SHALL apply styling based on the assignment's preference score
2. THE Schedule Grid SHALL use the existing preference badge classes to style cells according to preference levels (-3 to +3)
3. WHEN multiple assignments exist in a cell, THE Schedule Grid SHALL apply styling based on the average preference score
