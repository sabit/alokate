# Requirements Document

## Introduction

This feature enhances the Schedule UI to improve usability and navigation for users managing complex timetables. The improvements include sortable column headers to organize timeslots, sticky headers that remain visible during scrolling, and day-based filtering to focus on specific days of the week. These enhancements will help users efficiently navigate large schedules with many faculty members and timeslots.

## Glossary

- **Schedule Grid**: The table component displaying faculty assignments across timeslots
- **Timeslot Header**: The column header in the Schedule Grid showing timeslot information (label and day)
- **Faculty Row**: A row in the Schedule Grid representing a single faculty member
- **Day Filter**: A UI control that allows users to show/hide timeslots based on the day of the week
- **Sort Order**: The arrangement of timeslot columns (ascending or descending by time or day)
- **Sticky Header**: A header element that remains fixed at the top of the viewport during vertical scrolling
- **Viewport**: The visible area of the Schedule Grid within the browser window

## Requirements

### Requirement 1

**User Story:** As a scheduler, I want to sort timeslot columns by time or day, so that I can view the schedule in a logical order that matches my workflow

#### Acceptance Criteria

1. WHEN the user clicks on a timeslot header, THE Schedule Grid SHALL sort all timeslot columns in ascending order by time
2. WHEN the user clicks on a timeslot header that is already sorted in ascending order, THE Schedule Grid SHALL sort all timeslot columns in descending order by time
3. WHEN the user clicks on a timeslot header that is already sorted in descending order, THE Schedule Grid SHALL sort all timeslot columns in ascending order by time
4. THE Schedule Grid SHALL display a visual indicator (arrow icon) showing the current sort direction on the timeslot headers
5. THE Schedule Grid SHALL persist the sort order when the user navigates away and returns to the schedule page

### Requirement 2

**User Story:** As a scheduler, I want the faculty column and timeslot headers to remain visible while scrolling, so that I can always see which faculty member and timeslot I am viewing

#### Acceptance Criteria

1. WHILE the user scrolls vertically through the Schedule Grid, THE faculty column SHALL remain fixed on the left side of the Viewport
2. WHILE the user scrolls horizontally through the Schedule Grid, THE timeslot headers SHALL remain fixed at the top of the Viewport
3. WHILE the user scrolls both vertically and horizontally, THE Schedule Grid SHALL maintain both the faculty column and timeslot headers in their fixed positions
4. THE Schedule Grid SHALL apply appropriate z-index layering to ensure the faculty column header appears above both the faculty column and timeslot headers
5. THE Schedule Grid SHALL maintain visual consistency (borders, backgrounds, shadows) for sticky elements to clearly distinguish them from scrolling content

### Requirement 3

**User Story:** As a scheduler, I want to filter timeslots by day of the week, so that I can focus on scheduling for specific days without visual clutter

#### Acceptance Criteria

1. THE Schedule Grid SHALL display a day filter control above the schedule table with options for each unique day present in the timeslots
2. WHEN the user selects one or more days in the day filter, THE Schedule Grid SHALL display only timeslot columns matching the selected days
3. WHEN the user deselects all days in the day filter, THE Schedule Grid SHALL display all timeslot columns
4. THE Schedule Grid SHALL display a count of visible timeslots and total timeslots in the filter control (e.g., "Showing 5 of 15 timeslots")
5. THE Schedule Grid SHALL persist the selected day filters when the user navigates away and returns to the schedule page
6. WHEN day filters are active, THE Schedule Grid SHALL display a visual indicator showing that filters are applied
7. THE Schedule Grid SHALL provide a "Clear filters" action to reset all day filters to show all timeslots

### Requirement 4

**User Story:** As a scheduler, I want the sort and filter controls to work together seamlessly, so that I can organize and focus on the schedule data I need

#### Acceptance Criteria

1. WHEN the user applies day filters, THE Schedule Grid SHALL maintain the current sort order for the visible timeslot columns
2. WHEN the user changes the sort order, THE Schedule Grid SHALL apply the sort only to the currently visible (filtered) timeslot columns
3. THE Schedule Grid SHALL update the timeslot count display when both sorting and filtering are active
4. WHEN the user clears day filters, THE Schedule Grid SHALL restore all timeslot columns while maintaining the current sort order
