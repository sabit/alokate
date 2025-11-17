# Requirements Document

## Introduction

This feature enhances the CSV import functionality to split the Section column into two distinct fields: course shortcode and section identifier. Currently, the Section column contains combined data (e.g., "M3 [A]") where "M3" represents the course shortcode and "A" represents the section identifier. This split will provide better data granularity and enable more flexible querying and display of section information.

## Glossary

- **CSV Import System**: The system component responsible for parsing and transforming CSV files into the application's ConfigData structure
- **Section Column**: The CSV column containing combined course shortcode and section identifier (e.g., "M3 [A]", "M2[B]")
- **Course Shortcode**: The abbreviated course identifier extracted from the Section column (e.g., "M3", "M2", "M6")
- **Section Identifier**: The specific section letter or code extracted from the Section column (e.g., "A", "B", "AA", "B10")
- **ParsedRoomRow**: The TypeScript interface representing a parsed row from the rooms CSV file
- **Section Entity**: The data structure in ConfigData that represents a course section with references to subject, timeslot, and room
- **ConfigData**: The unified data structure containing all configuration entities (faculty, subjects, sections, timeslots, rooms, buildings)

## Requirements

### Requirement 1

**User Story:** As a scheduling administrator, I want the Section column data to be split into course shortcode and section identifier, so that I can better understand and query section information.

#### Acceptance Criteria

1. WHEN the CSV Import System parses a rooms CSV file, THE CSV Import System SHALL extract the course shortcode from the Section column
2. WHEN the CSV Import System parses a rooms CSV file, THE CSV Import System SHALL extract the section identifier from the Section column
3. THE CSV Import System SHALL handle Section column formats with spaces before brackets (e.g., "M3 [A]")
4. THE CSV Import System SHALL handle Section column formats without spaces before brackets (e.g., "M2[B]")
5. THE CSV Import System SHALL handle multi-character section identifiers (e.g., "AA", "B10", "D1")

### Requirement 2

**User Story:** As a developer, I want the parsed section data to include both course shortcode and section identifier fields, so that I can access these values independently in the application.

#### Acceptance Criteria

1. THE ParsedRoomRow interface SHALL include a courseShortcode property of type string
2. THE ParsedRoomRow interface SHALL include a sectionIdentifier property of type string
3. WHEN a rooms CSV row is parsed, THE CSV Import System SHALL populate the courseShortcode property with the extracted shortcode
4. WHEN a rooms CSV row is parsed, THE CSV Import System SHALL populate the sectionIdentifier property with the extracted identifier
5. THE ParsedRoomRow interface SHALL retain the original section property for backward compatibility

### Requirement 3

**User Story:** As a scheduling administrator, I want the Section entity to store both course shortcode and section identifier, so that this information is available throughout the application.

#### Acceptance Criteria

1. THE Section Entity SHALL include a courseShortcode property of type string
2. THE Section Entity SHALL include a sectionIdentifier property of type string
3. WHEN the CSV Import System transforms ParsedRoomRow data into Section entities, THE CSV Import System SHALL populate the courseShortcode property
4. WHEN the CSV Import System transforms ParsedRoomRow data into Section entities, THE CSV Import System SHALL populate the sectionIdentifier property
5. THE Section Entity SHALL maintain all existing properties (id, subjectId, timeslotId, roomId, capacity)

### Requirement 4

**User Story:** As a scheduling administrator, I want the import process to validate that section data can be successfully split, so that I receive clear error messages for malformed data.

#### Acceptance Criteria

1. IF a Section column value cannot be parsed into shortcode and identifier, THEN THE CSV Import System SHALL throw a CSVParseError with a descriptive message
2. THE CSVParseError SHALL include the row number where the parsing failed
3. THE CSVParseError SHALL include the field name "Section"
4. WHEN a Section column value is empty or whitespace only, THEN THE CSV Import System SHALL throw a CSVParseError
5. THE CSV Import System SHALL trim whitespace from extracted shortcode and identifier values

### Requirement 5

**User Story:** As a developer, I want existing tests to pass and new tests to validate the section splitting logic, so that I can ensure the feature works correctly.

#### Acceptance Criteria

1. WHEN the section splitting feature is implemented, THE CSV Import System SHALL pass all existing CSV parser tests
2. WHEN the section splitting feature is implemented, THE CSV Import System SHALL pass all existing CSV transformer tests
3. THE CSV Import System SHALL include tests for Section column formats with spaces (e.g., "M3 [A]")
4. THE CSV Import System SHALL include tests for Section column formats without spaces (e.g., "M2[B]")
5. THE CSV Import System SHALL include tests for multi-character section identifiers (e.g., "AA", "B10")
