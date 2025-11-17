# Implementation Plan

- [x] 1. Update TypeScript interfaces to include new section fields





  - [x] 1.1 Add courseShortcode and sectionIdentifier to ParsedRoomRow interface


    - Modify `frontend/src/types/index.ts`
    - Add `courseShortcode: string` property
    - Add `sectionIdentifier: string` property
    - _Requirements: 2.1, 2.2_

  - [x] 1.2 Add courseShortcode and sectionIdentifier to Section interface


    - Modify `frontend/src/types/index.ts`
    - Add `courseShortcode: string` property
    - Add `sectionIdentifier: string` property
    - _Requirements: 3.1, 3.2_

- [x] 2. Implement section field parsing logic





  - [x] 2.1 Create parseSectionField() function


    - Add function to `frontend/src/utils/csvParser.ts`
    - Implement regex pattern to extract shortcode and identifier
    - Handle formats with and without spaces before brackets
    - Trim extracted values
    - Return object with courseShortcode and sectionIdentifier
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.5_

  - [x] 2.2 Add error handling to parseSectionField()

    - Throw CSVParseError for invalid format
    - Throw CSVParseError for empty shortcode
    - Throw CSVParseError for empty identifier
    - Include descriptive error messages
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 2.3 Integrate parseSectionField() into parseRoomsCSV()


    - Call parseSectionField() for each parsed row
    - Populate courseShortcode and sectionIdentifier in ParsedRoomRow
    - Wrap in try-catch to add row number to errors
    - Retain original section field value
    - _Requirements: 2.3, 2.4, 2.5, 4.2_

- [x] 3. Update CSV transformation logic



  - [x] 3.1 Modify transformRoomsData() to populate new Section fields


    - Update section creation in `frontend/src/utils/csvTransformer.ts`
    - Map courseShortcode from ParsedRoomRow to Section entity
    - Map sectionIdentifier from ParsedRoomRow to Section entity
    - Maintain all existing Section properties
    - _Requirements: 3.3, 3.4, 3.5_

- [ ] 4. Write unit tests for section parsing
  - [ ]* 4.1 Create tests for parseSectionField() function
    - Create test file or add to existing `frontend/src/utils/__tests__/csvParser.test.ts`
    - Test parsing "M3 [A]" format (with space)
    - Test parsing "M2[B]" format (without space)
    - Test parsing multi-character identifiers ("M1 [B10]", "M6 [AA]")
    - Test parsing with extra whitespace
    - Test error on invalid format
    - Test error on empty shortcode
    - Test error on empty identifier
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 4.2 Create integration tests for parseRoomsCSV()
    - Add tests to `frontend/src/utils/__tests__/csvParser.test.ts`
    - Verify courseShortcode is populated in parsed rows
    - Verify sectionIdentifier is populated in parsed rows
    - Verify original section field is retained
    - Verify error includes row number when parsing fails
    - _Requirements: 5.1_

  - [ ]* 4.3 Create tests for transformRoomsData() with new fields
    - Add tests to `frontend/src/utils/__tests__/csvTransformer.test.ts`
    - Verify Section entities include courseShortcode
    - Verify Section entities include sectionIdentifier
    - Verify values match parsed data
    - Verify existing fields remain unchanged
    - _Requirements: 5.2_

- [ ] 5. Verify existing tests pass
  - [ ]* 5.1 Run existing CSV parser tests
    - Execute `npm run test --workspace frontend -- --run csvParser`
    - Verify all existing tests pass
    - Fix any breaking changes
    - _Requirements: 5.1_

  - [ ]* 5.2 Run existing CSV transformer tests
    - Execute `npm run test --workspace frontend -- --run csvTransformer`
    - Verify all existing tests pass
    - Fix any breaking changes
    - _Requirements: 5.2_

  - [ ]* 5.3 Run full test suite
    - Execute `npm run test --workspace frontend -- --run`
    - Verify no regressions in other components
    - _Requirements: 5.1, 5.2_
