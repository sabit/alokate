# Requirements Document

## Introduction

This feature enables users to configure the scoring weights used by the optimizer algorithm through the Settings UI. Currently, the weights (preference, mobility, seniority, consecutive) are hardcoded with default values and only displayed as read-only text. This feature will add interactive controls to allow users to adjust these weights according to their scheduling priorities, with the changes persisting across sessions.

## Glossary

- **Optimizer**: The scheduling algorithm that assigns faculty to sections based on preferences and constraints
- **Weight**: A multiplier applied to a scoring component that determines its relative importance in the optimizer's decision-making
- **Settings Panel**: The UI component located in the Settings page that displays and manages application settings
- **Scheduler Store**: The Zustand state management store that maintains the application's scheduling data and settings
- **Preference Weight**: The multiplier applied to combined preference scores (subject, timeslot, building)
- **Mobility Weight**: The multiplier applied to building transition penalties
- **Seniority Weight**: The multiplier applied to faculty seniority scores
- **Consecutive Weight**: The multiplier applied to consecutive timeslot penalties

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to adjust the optimizer weights through the Settings UI, so that I can prioritize different factors according to my institution's scheduling policies.

#### Acceptance Criteria

1. WHEN the user navigates to the Settings page, THE Settings Panel SHALL display interactive input controls for each weight (preference, mobility, seniority, consecutive)
2. WHEN the user modifies a weight value, THE Scheduler Store SHALL update the corresponding weight in the settings state
3. WHEN the user modifies a weight value, THE Settings Panel SHALL persist the updated settings to IndexedDB storage
4. WHERE the user has modified weights, THE Optimizer SHALL use the updated weight values in all subsequent schedule generation operations
5. WHEN the application loads, THE Scheduler Store SHALL restore previously saved weight values from IndexedDB storage

### Requirement 2

**User Story:** As a scheduler, I want reasonable constraints on weight values, so that I cannot accidentally configure invalid or extreme values that would break the optimizer.

#### Acceptance Criteria

1. THE Settings Panel SHALL enforce a minimum weight value of 0 for all weights
2. THE Settings Panel SHALL enforce a maximum weight value of 10 for all weights
3. WHEN the user enters a value outside the valid range, THE Settings Panel SHALL clamp the value to the nearest valid boundary
4. THE Settings Panel SHALL accept decimal values with up to 2 decimal places for all weights
5. WHEN the user enters an invalid input, THE Settings Panel SHALL display the current valid value without throwing errors

### Requirement 3

**User Story:** As a scheduler, I want to reset weights to their default values, so that I can quickly return to the standard configuration if my custom weights produce undesirable results.

#### Acceptance Criteria

1. THE Settings Panel SHALL display a reset button in the algorithm weights section
2. WHEN the user clicks the reset button, THE Settings Panel SHALL restore all weights to their default values (preference: 1, mobility: 1, seniority: 1, consecutive: 1)
3. WHEN the user clicks the reset button, THE Scheduler Store SHALL update the settings state with the default weight values
4. WHEN the user clicks the reset button, THE Settings Panel SHALL persist the default weight values to IndexedDB storage

### Requirement 4

**User Story:** As a scheduler, I want clear labels and helpful descriptions for each weight control, so that I understand what each weight affects in the scheduling algorithm.

#### Acceptance Criteria

1. THE Settings Panel SHALL display a descriptive label for each weight input control
2. THE Settings Panel SHALL display helper text explaining what each weight affects in the optimizer
3. THE Settings Panel SHALL use consistent formatting and spacing for all weight controls
4. THE Settings Panel SHALL group all weight controls together in a visually distinct section
