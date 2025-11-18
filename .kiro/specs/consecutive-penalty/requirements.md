# Requirements Document

## Introduction

This document specifies the requirements for adding a "Consecutive" penalty score to the schedule optimizer preferences. The Consecutive penalty will penalize faculty assignments when they are scheduled for two consecutive timeslot classes, with an increased penalty when consecutive timeslots occur around lunch hours (e.g., 11:20 and 13:00). This feature extends the existing penalty system (similar to the Mobility penalty) to help create more balanced and faculty-friendly schedules.

## Glossary

- **Scheduler System**: The application that manages faculty assignments to course sections across timeslots
- **Consecutive Penalty**: A numeric penalty value (0-3) applied when a faculty member is assigned to consecutive timeslots
- **Consecutive Timeslots**: Two timeslots that occur back-to-back in the schedule (e.g., 08:00-09:30 followed by 09:30-11:00)
- **Lunch Hour**: The time period typically between 11:00 AM and 2:00 PM when consecutive classes are particularly undesirable
- **Faculty**: An instructor who can be assigned to teach course sections
- **Preferences**: User-defined scoring values that influence the optimizer's assignment decisions
- **Optimizer Algorithm**: The scheduling algorithm that assigns faculty to sections based on various scoring factors
- **Penalty Weight**: A multiplier applied to penalty scores in the optimizer's scoring calculation

## Requirements

### Requirement 1

**User Story:** As a scheduler administrator, I want to configure a consecutive penalty value for each faculty member, so that I can influence the optimizer to avoid back-to-back class assignments based on individual faculty preferences.

#### Acceptance Criteria

1. THE Scheduler System SHALL store a consecutive penalty value for each faculty member in the preferences data structure
2. THE Scheduler System SHALL accept consecutive penalty values in the range of 0 to 3 inclusive
3. WHEN a consecutive penalty value is not explicitly set for a faculty member, THE Scheduler System SHALL use a default value of 1
4. THE Scheduler System SHALL persist consecutive penalty values along with other preference data

### Requirement 2

**User Story:** As a scheduler administrator, I want to set consecutive penalty values through the preferences interface, so that I can easily configure this setting for all faculty members.

#### Acceptance Criteria

1. THE Scheduler System SHALL provide a user interface component for setting consecutive penalty values
2. THE Scheduler System SHALL display the consecutive penalty input alongside other faculty preference settings
3. THE Scheduler System SHALL validate that consecutive penalty input values are numeric and within the range 0 to 3
4. WHEN a user enters an invalid consecutive penalty value, THE Scheduler System SHALL display an error message and prevent saving
5. THE Scheduler System SHALL save consecutive penalty changes to the preferences data store

### Requirement 3

**User Story:** As a scheduler administrator, I want the optimizer to apply consecutive penalties during schedule generation, so that faculty with higher consecutive penalty values are less likely to receive back-to-back class assignments.

#### Acceptance Criteria

1. WHEN the optimizer evaluates a faculty assignment, THE Scheduler System SHALL calculate the number of consecutive timeslot pairs that would result from the assignment
2. WHEN a faculty member has consecutive timeslots, THE Scheduler System SHALL apply a penalty equal to negative one times the consecutive penalty value times the number of consecutive pairs
3. WHEN consecutive timeslots span the lunch hour period, THE Scheduler System SHALL double the penalty for that consecutive pair
4. THE Scheduler System SHALL define lunch hour as timeslots where one ends between 11:00 and 13:00 and the next starts between 11:00 and 14:00
5. THE Scheduler System SHALL incorporate the consecutive penalty into the total score calculation for faculty assignments

### Requirement 4

**User Story:** As a scheduler administrator, I want to configure a weight for the consecutive penalty in the settings, so that I can control how much influence consecutive penalties have relative to other scoring factors.

#### Acceptance Criteria

1. THE Scheduler System SHALL provide a consecutive penalty weight setting in the algorithm weights configuration
2. THE Scheduler System SHALL apply the consecutive penalty weight as a multiplier to consecutive penalty scores during optimization
3. THE Scheduler System SHALL initialize the consecutive penalty weight to a default value of 1.0
4. THE Scheduler System SHALL persist the consecutive penalty weight value in the settings data store
5. THE Scheduler System SHALL display the current consecutive penalty weight value in the settings interface

### Requirement 5

**User Story:** As a scheduler administrator, I want to see the consecutive penalty contribution in the score breakdown for each assignment, so that I can understand how consecutive penalties affected the schedule.

#### Acceptance Criteria

1. THE Scheduler System SHALL calculate a consecutive penalty score for each schedule entry
2. THE Scheduler System SHALL include the consecutive penalty score in the score breakdown data structure
3. THE Scheduler System SHALL display the consecutive penalty score alongside other score components in the schedule interface
4. WHEN a schedule entry has no consecutive timeslots, THE Scheduler System SHALL display a consecutive penalty score of 0
5. THE Scheduler System SHALL update consecutive penalty scores when the schedule is regenerated
