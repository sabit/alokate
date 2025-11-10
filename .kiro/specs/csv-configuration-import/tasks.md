# Implementation Plan

- [x] 1. Create CSV parsing utilities





  - [x] 1.1 Create `frontend/src/utils/csvParser.ts` with generic CSV parsing function


    - Implement `parseCSV<T>()` function that handles CSV text parsing with proper quote and comma handling
    - Handle header row extraction and field mapping
    - Trim whitespace from all fields
    - Skip empty rows
    - _Requirements: 1.1, 2.1_
  - [x] 1.2 Implement faculty CSV parser


    - Create `parseFacultyCSV()` function that parses Name and Initial columns
    - Validate required fields (Name, Initial) are present
    - Return array of `ParsedFacultyRow` objects
    - _Requirements: 1.1, 4.3_
  - [x] 1.3 Implement rooms CSV parser


    - Create `parseRoomsCSV()` function that parses all room/section columns
    - Validate required fields (Course, Section, Slot Day, Slot Time, Room, Capacity) are present
    - Return array of `ParsedRoomRow` objects
    - _Requirements: 2.1, 4.3_

- [x] 2. Create time conversion utilities




  - [x] 2.1 Implement time format conversion in `frontend/src/utils/timeUtils.ts`


    - Create `parseTime12to24()` function to convert "2:40 PM" to "14:40"
    - Create `calculateEndTime()` function to add duration to start time
    - Handle edge cases (midnight, noon, single-digit hours)
    - _Requirements: 2.3_

- [x] 3. Create data transformation utilities





  - [x] 3.1 Create `frontend/src/utils/csvTransformer.ts` with ID generation helpers


    - Implement `sanitizeId()` function to remove special characters and spaces
    - Implement `generateFacultyId()`, `generateSubjectId()`, etc.
    - Ensure IDs are unique and consistent
    - _Requirements: 1.4, 3.1_
  - [x] 3.2 Implement faculty data transformer


    - Create `transformFacultyData()` function
    - Generate faculty IDs from initials
    - Trim whitespace from names
    - Set default values for maxSections, maxOverload, canOverload
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 3.3 Implement rooms data transformer


    - Create `transformRoomsData()` function
    - Extract and deduplicate subjects from course codes
    - Parse and deduplicate timeslots with time conversion
    - Extract and deduplicate buildings from room codes
    - Create room objects with building references
    - Create section objects with all references
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.4 Implement config data merger


    - Create `mergeConfigData()` function to combine faculty and rooms data
    - Validate all references are valid
    - Return complete `ConfigData` object
    - _Requirements: 3.1, 3.2_

- [x] 4. Add CSV import to ConfigImporter component





  - [x] 4.1 Update ConfigImporter UI to support CSV files


    - Modify file input accept attribute to include CSV: `accept="application/json,text/csv"`
    - Add "Import CSV" button alongside existing "Import JSON" button
    - Allow multiple file selection for CSV import
    - _Requirements: 1.1, 2.1_
  - [x] 4.2 Implement CSV file handling logic

    - Add file type detection based on file extension
    - Create `handleCSVImport()` function to process CSV files
    - Validate that both faculty.csv and rooms.csv are provided
    - Read both files using FileReader API
    - _Requirements: 1.1, 2.1, 4.1_
  - [x] 4.3 Integrate CSV parsing and transformation

    - Call `parseFacultyCSV()` and `parseRoomsCSV()` with file contents
    - Call `transformFacultyData()` and `transformRoomsData()` with parsed data
    - Call `mergeConfigData()` to create final ConfigData
    - Pass ConfigData to existing `updateConfig()` flow
    - _Requirements: 3.1, 3.2_
  - [x] 4.4 Add error handling and user feedback

    - Wrap CSV processing in try-catch blocks
    - Display specific error messages for different failure types
    - Show success toast on successful import
    - Log detailed errors to console
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Add validation utilities




  - [x] 5.1 Create `frontend/src/utils/configValidator.ts`


    - Implement `validateConfigData()` function
    - Check all required arrays are present and non-empty
    - Validate all section references point to existing entities
    - Return validation errors with context
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.3_
  - [x] 5.2 Integrate validation into import flow


    - Call `validateConfigData()` after transformation
    - Display validation errors to user if any
    - Prevent import if critical validation fails
    - _Requirements: 3.2, 4.2_

- [x] 6. Update TypeScript types




  - [x] 6.1 Add CSV-specific types to `frontend/src/types/index.ts` or new types file


    - Define `ParsedFacultyRow` interface
    - Define `ParsedRoomRow` interface
    - Define `CSVParseError` interface for error handling
    - _Requirements: 1.1, 2.1, 4.2_

- [x] 7. Add tests for CSV functionality






  - [x]* 7.1 Create unit tests for CSV parser

    - Test `parseFacultyCSV()` with valid and invalid data
    - Test `parseRoomsCSV()` with valid and invalid data
    - Test error handling for malformed CSV
    - _Requirements: 1.1, 2.1, 4.2, 4.3_
  - [x]* 7.2 Create unit tests for time utilities


    - Test `parseTime12to24()` with various time formats
    - Test `calculateEndTime()` with different durations
    - Test edge cases (midnight, noon)
    - _Requirements: 2.3_
  - [x]* 7.3 Create unit tests for data transformers


    - Test `transformFacultyData()` with sample data
    - Test `transformRoomsData()` with sample data
    - Test ID generation and deduplication
    - Test `mergeConfigData()` integration
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5, 3.1_
  - [x]* 7.4 Create integration tests for ConfigImporter


    - Test CSV file selection and processing
    - Test error display in UI
    - Test successful import flow
    - _Requirements: 1.1, 2.1, 4.1, 4.4_
