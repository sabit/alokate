# Requirements Document

## Introduction

This feature enhances the Configuration view by adding section count information grouped by subject and implementing sorting for rooms and subjects to improve data organization and readability. These improvements help users quickly understand their course distribution and locate specific entities in the configuration tables.

## Glossary

- **Config View**: The Configuration page component that displays imported datasets including faculty, subjects, sections, timeslots, rooms, and buildings
- **Section**: A specific course offering with assigned timeslot, room, and capacity
- **Subject**: An academic subject/course with a code and name
- **Room**: A physical classroom with capacity and building assignment
- **Building**: A physical structure containing one or more rooms
- **Course Shortcode**: The abbreviated identifier for a course (e.g., "CS101")

## Requirements

### Requirement 1

**User Story:** As a scheduler administrator, I want to see section counts grouped by subject in the sections table, so that I can quickly understand the distribution of course offerings across different subjects

#### Acceptance Criteria

1. WHEN the sections table is expanded in the Config View, THE System SHALL display a count of sections for each unique subject
2. THE System SHALL group section count information by subject code in a visually distinct manner
3. THE System SHALL display the section count alongside or within the subject information in the sections table
4. THE System SHALL update section counts dynamically when configuration data changes

### Requirement 2

**User Story:** As a scheduler administrator, I want rooms to be sorted alphabetically by building name in the rooms table, so that I can easily locate rooms within specific buildings

#### Acceptance Criteria

1. WHEN the rooms table is displayed in the Config View, THE System SHALL sort rooms primarily by building name in ascending alphabetical order
2. WHERE rooms share the same building, THE System SHALL sort those rooms by room label in ascending alphabetical order as a secondary sort
3. THE System SHALL maintain the sorted order when the rooms table is collapsed and re-expanded
4. THE System SHALL apply sorting automatically when new room data is loaded

### Requirement 3

**User Story:** As a scheduler administrator, I want subjects to be sorted alphabetically by their shortcode in the subjects table, so that I can quickly find specific courses in a predictable order

#### Acceptance Criteria

1. WHEN the subjects table is displayed in the Config View, THE System SHALL sort subjects by their code property in ascending alphabetical order
2. THE System SHALL maintain the sorted order when the subjects table is collapsed and re-expanded
3. THE System SHALL apply sorting automatically when new subject data is loaded
4. THE System SHALL use case-insensitive comparison for subject code sorting
