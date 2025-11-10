# Requirements Document

## Introduction

The Preference View feature enables users to capture, visualize, and manage faculty teaching preferences across multiple dimensions (subjects, timeslots, buildings, and mobility). The system provides an interactive matrix interface where users can set preference levels ranging from strong preference (+3) to strong avoidance (-3), with visual color coding to indicate preference strength. This feature is essential for the scheduling system to optimize faculty assignments based on their preferences and constraints.

## Glossary

- **Preference System**: The application component that manages faculty teaching preferences
- **Faculty**: Teaching staff members who have preferences for subjects, timeslots, and buildings
- **Preference Level**: A numeric value from -3 to +3 indicating preference strength
- **Preference Matrix**: A tabular interface displaying faculty members as rows and preference dimensions as columns
- **Preference View**: One of four modes (subjects, timeslots, buildings, mobility) for editing preferences
- **Mobility**: A faculty member's tolerance for moving between buildings during their schedule
- **Configuration Data**: The system's base data including faculty, subjects, timeslots, and buildings
- **Persistence Layer**: The backend storage system that saves preference changes

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to view and edit faculty preferences in a matrix format, so that I can efficiently manage preferences for multiple faculty members across different dimensions.

#### Acceptance Criteria

1. WHEN the Preference System loads, THE Preference System SHALL display a matrix with faculty members as rows and the selected dimension items as columns
2. WHEN no faculty members exist in Configuration Data, THE Preference System SHALL display a message indicating that faculty must be added before editing preferences
3. WHEN no items exist for the selected dimension in Configuration Data, THE Preference System SHALL display a message indicating that items must be added before editing preferences
4. THE Preference System SHALL provide four view tabs labeled "Subjects", "Timeslots", "Buildings", and "Mobility"
5. WHEN a user clicks a view tab, THE Preference System SHALL switch to display the corresponding Preference Matrix within 100 milliseconds

### Requirement 2

**User Story:** As a scheduler, I want to adjust preference values using mouse and keyboard interactions, so that I can quickly set preferences in a way that suits my workflow.

#### Acceptance Criteria

1. WHEN a user left-clicks a preference cell, THE Preference System SHALL increment the Preference Level by 1 up to a maximum of +3
2. WHEN a user right-clicks a preference cell, THE Preference System SHALL decrement the Preference Level by 1 down to a minimum of -3
3. WHEN a preference cell has keyboard focus AND a user presses the up arrow or right arrow key, THE Preference System SHALL increment the Preference Level by 1 up to a maximum of +3
4. WHEN a preference cell has keyboard focus AND a user presses the down arrow or left arrow key, THE Preference System SHALL decrement the Preference Level by 1 down to a minimum of -3
5. WHEN a Preference Level reaches its minimum or maximum value AND a user attempts to adjust it further in that direction, THE Preference System SHALL maintain the current value without change

### Requirement 3

**User Story:** As a scheduler, I want to see visual indicators of preference strength, so that I can quickly identify strong preferences and avoidances across the matrix.

#### Acceptance Criteria

1. WHEN a preference cell has a value of +3, THE Preference System SHALL display the cell with an emerald background at 80% opacity
2. WHEN a preference cell has a value of +2, THE Preference System SHALL display the cell with an emerald background at 70% opacity
3. WHEN a preference cell has a value of +1, THE Preference System SHALL display the cell with an emerald background at 60% opacity
4. WHEN a preference cell has a value of 0, THE Preference System SHALL display the cell with a slate gray background at 50% opacity
5. WHEN a preference cell has a value of -1, THE Preference System SHALL display the cell with an amber background at 50% opacity
6. WHEN a preference cell has a value of -2, THE Preference System SHALL display the cell with a rose background at 60% opacity
7. WHEN a preference cell has a value of -3, THE Preference System SHALL display the cell with a rose background at 80% opacity
8. THE Preference System SHALL display a legend showing all seven preference levels with their corresponding colors and labels

### Requirement 4

**User Story:** As a scheduler, I want to adjust mobility values for individual faculty members, so that I can model their tolerance for cross-building assignments.

#### Acceptance Criteria

1. WHEN the user selects the Mobility view, THE Preference System SHALL display a list of faculty members with individual slider controls
2. THE Preference System SHALL provide a slider for each faculty member with a range from 0 to 5
3. WHEN a user adjusts a mobility slider, THE Preference System SHALL update the mobility value for that faculty member
4. THE Preference System SHALL display the current numeric mobility value next to each slider
5. THE Preference System SHALL display descriptive text indicating that higher values penalize cross-building moves less

### Requirement 5

**User Story:** As a scheduler, I want to reset all preferences to neutral values, so that I can quickly start fresh when redesigning a schedule.

#### Acceptance Criteria

1. THE Preference System SHALL provide a "Reset to neutral" action in the quick fill tools
2. WHEN a user triggers the reset action in a matrix view, THE Preference System SHALL set all preference values in the current view to 0
3. WHEN a user triggers the reset action in the mobility view, THE Preference System SHALL set all mobility values to 0
4. WHEN the reset operation completes successfully, THE Preference System SHALL display a success message confirming the reset
5. WHEN the reset operation fails to persist, THE Preference System SHALL display an error message indicating that changes are saved locally only

### Requirement 6

**User Story:** As a scheduler, I want my preference changes to be automatically saved, so that I don't lose work if I navigate away or close the application.

#### Acceptance Criteria

1. WHEN a user modifies any preference value, THE Preference System SHALL schedule a persistence operation to occur 500 milliseconds after the last change
2. WHEN a new preference change occurs before the scheduled persistence, THE Preference System SHALL cancel the previous scheduled operation and schedule a new one
3. WHEN the persistence operation fails, THE Preference System SHALL display an error message indicating that changes are kept locally
4. WHEN the persistence operation succeeds, THE Preference System SHALL maintain the updated preferences without displaying a message
5. THE Preference System SHALL persist all preference changes to the Persistence Layer

### Requirement 7

**User Story:** As a scheduler, I want to see faculty information in the matrix, so that I can make informed decisions about preference assignments.

#### Acceptance Criteria

1. THE Preference System SHALL display each faculty member's name in the first column of the Preference Matrix
2. THE Preference System SHALL display each faculty member's maximum section count below their name
3. THE Preference System SHALL keep the faculty name column visible when the user scrolls horizontally through the matrix
4. WHEN displaying subject columns, THE Preference System SHALL use the subject code if available, otherwise the subject name
5. WHEN displaying timeslot columns, THE Preference System SHALL use the timeslot label
6. WHEN displaying building columns, THE Preference System SHALL use the building label

### Requirement 8

**User Story:** As a scheduler, I want to understand how to use the preference interface, so that I can effectively capture faculty preferences without confusion.

#### Acceptance Criteria

1. THE Preference System SHALL display an instructional panel above the Preference Matrix
2. THE Preference System SHALL provide instructions for left-click and right-click interactions
3. THE Preference System SHALL provide instructions for keyboard arrow key adjustments
4. THE Preference System SHALL reference the legend for understanding color mappings
5. THE Preference System SHALL explain the purpose of mobility sliders
6. THE Preference System SHALL explain the reset to neutral functionality
