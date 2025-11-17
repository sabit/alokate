# Design Document

## Overview

This design implements the section field splitting feature by enhancing the CSV parsing and transformation logic. The solution adds a parsing function to extract course shortcode and section identifier from the combined Section column value, updates TypeScript interfaces to include the new fields, and modifies the transformation logic to populate these fields in the resulting Section entities.

The design maintains backward compatibility by retaining the original section field while adding the new split fields. This approach ensures existing code continues to work while enabling new functionality that leverages the granular section data.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CSV Import Flow                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  csvParser.ts                                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ parseRoomsCSV()                                     │    │
│  │  - Parses CSV text into ParsedRoomRow[]            │    │
│  │  - Calls parseSectionField() for each row          │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ parseSectionField()  [NEW]                          │    │
│  │  - Extracts courseShortcode and sectionIdentifier   │    │
│  │  - Handles formats: "M3 [A]" and "M2[B]"           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  types/index.ts                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ParsedRoomRow (UPDATED)                             │    │
│  │  + courseShortcode: string                          │    │
│  │  + sectionIdentifier: string                        │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Section (UPDATED)                                   │    │
│  │  + courseShortcode: string                          │    │
│  │  + sectionIdentifier: string                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  csvTransformer.ts                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ transformRoomsData() (UPDATED)                      │    │
│  │  - Maps courseShortcode to Section entity           │    │
│  │  - Maps sectionIdentifier to Section entity         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **CSV Parsing Phase**:
   - `parseRoomsCSV()` reads the Section column value
   - `parseSectionField()` splits the value into shortcode and identifier
   - Returns `ParsedRoomRow` with all three fields: `section`, `courseShortcode`, `sectionIdentifier`

2. **Transformation Phase**:
   - `transformRoomsData()` receives `ParsedRoomRow[]`
   - Creates `Section` entities with the new fields populated
   - Section ID generation continues to use the full section value for uniqueness

3. **Storage Phase**:
   - `Section` entities with split fields are stored in ConfigData
   - Available for use throughout the application

## Components and Interfaces

### New Function: parseSectionField()

**Location**: `frontend/src/utils/csvParser.ts`

**Purpose**: Extract course shortcode and section identifier from combined Section column value

**Signature**:
```typescript
function parseSectionField(sectionValue: string): {
  courseShortcode: string;
  sectionIdentifier: string;
}
```

**Algorithm**:
1. Trim whitespace from input
2. Match pattern: `{shortcode}[optional-space][{identifier}]`
3. Extract shortcode (everything before the bracket)
4. Extract identifier (everything inside the brackets)
5. Trim both values
6. Validate both are non-empty
7. Return object with both fields

**Regex Pattern**: `/^(.+?)\s*\[(.+)\]$/`
- `^(.+?)` - Capture shortcode (non-greedy)
- `\s*` - Optional whitespace
- `\[(.+)\]` - Capture identifier inside brackets
- `$` - End of string

**Error Handling**:
- Throw `CSVParseError` if pattern doesn't match
- Throw `CSVParseError` if shortcode or identifier is empty after trimming

### Updated Interface: ParsedRoomRow

**Location**: `frontend/src/types/index.ts`

**Changes**:
```typescript
export interface ParsedRoomRow {
  slNo: string;
  course: string;
  capacity: number;
  registration: number;
  section: string;                    // Existing - full value
  courseShortcode: string;            // NEW
  sectionIdentifier: string;          // NEW
  slotDay: string;
  slotTime: string;
  room: string;
}
```

### Updated Interface: Section

**Location**: `frontend/src/types/index.ts`

**Changes**:
```typescript
export interface Section {
  id: string;
  subjectId: string;
  timeslotId: string;
  roomId: string;
  capacity: number;
  courseShortcode: string;            // NEW
  sectionIdentifier: string;          // NEW
}
```

### Updated Function: parseRoomsCSV()

**Location**: `frontend/src/utils/csvParser.ts`

**Changes**:
- After parsing each row, call `parseSectionField(row.section)`
- Add `courseShortcode` and `sectionIdentifier` to the returned row object
- Wrap parsing in try-catch to provide row-specific error messages

### Updated Function: transformRoomsData()

**Location**: `frontend/src/utils/csvTransformer.ts`

**Changes**:
- When creating Section entities, include `courseShortcode` and `sectionIdentifier` from `ParsedRoomRow`
- No changes to ID generation logic (continues using full section value)

## Data Models

### Example Data Transformation

**Input CSV Row**:
```csv
01548,MAT2101,40,40,M3 [A],Sunday,2:40 PM,DS0605
```

**Parsed Row (ParsedRoomRow)**:
```typescript
{
  slNo: "01548",
  course: "MAT2101",
  capacity: 40,
  registration: 40,
  section: "M3 [A]",
  courseShortcode: "M3",
  sectionIdentifier: "A",
  slotDay: "Sunday",
  slotTime: "2:40 PM",
  room: "DS0605"
}
```

**Transformed Section Entity**:
```typescript
{
  id: "section-mat2101-m3-a",
  subjectId: "subject-mat2101",
  timeslotId: "slot-sun-1440",
  roomId: "room-ds0605",
  capacity: 40,
  courseShortcode: "M3",
  sectionIdentifier: "A"
}
```

### Supported Section Formats

| Format | Example | Shortcode | Identifier |
|--------|---------|-----------|------------|
| With space | `M3 [A]` | `M3` | `A` |
| Without space | `M2[B]` | `M2` | `B` |
| Multi-char identifier | `M1 [B10]` | `M1` | `B10` |
| Multi-char identifier | `M6 [AA]` | `M6` | `AA` |
| Special format | `Math Archi[D1]` | `Math Archi` | `D1` |

## Error Handling

### Parse Errors

**Scenario 1: Invalid Format**
- Input: `"M3-A"` (no brackets)
- Error: `CSVParseError: Invalid section format 'M3-A' at row X. Expected format: 'SHORTCODE [IDENTIFIER]'`

**Scenario 2: Empty Shortcode**
- Input: `" [A]"` (empty before bracket)
- Error: `CSVParseError: Empty course shortcode in section ' [A]' at row X`

**Scenario 3: Empty Identifier**
- Input: `"M3 []"` (empty inside brackets)
- Error: `CSVParseError: Empty section identifier in section 'M3 []' at row X`

**Scenario 4: Missing Section Value**
- Input: `""` (empty string)
- Error: `CSVParseError: Missing required field 'section' in rooms CSV at row X`

### Error Context

All `CSVParseError` instances include:
- `message`: Descriptive error message
- `row`: Row number where error occurred (1-indexed, accounting for header)
- `field`: Field name (`"Section"`)

## Testing Strategy

### Unit Tests

**File**: `frontend/src/utils/__tests__/csvParser.test.ts`

Test cases for `parseSectionField()`:
1. Parse section with space: `"M3 [A]"` → `{ courseShortcode: "M3", sectionIdentifier: "A" }`
2. Parse section without space: `"M2[B]"` → `{ courseShortcode: "M2", sectionIdentifier: "B" }`
3. Parse multi-character identifier: `"M1 [B10]"` → `{ courseShortcode: "M1", sectionIdentifier: "B10" }`
4. Parse double-letter identifier: `"M6 [AA]"` → `{ courseShortcode: "M6", sectionIdentifier: "AA" }`
5. Parse with extra whitespace: `"M3  [  A  ]"` → `{ courseShortcode: "M3", sectionIdentifier: "A" }`
6. Error on invalid format: `"M3-A"` → throws `CSVParseError`
7. Error on empty shortcode: `" [A]"` → throws `CSVParseError`
8. Error on empty identifier: `"M3 []"` → throws `CSVParseError`

Test cases for `parseRoomsCSV()` integration:
1. Verify `courseShortcode` and `sectionIdentifier` are populated in parsed rows
2. Verify original `section` field is retained
3. Verify error includes row number when section parsing fails

**File**: `frontend/src/utils/__tests__/csvTransformer.test.ts`

Test cases for `transformRoomsData()`:
1. Verify Section entities include `courseShortcode` field
2. Verify Section entities include `sectionIdentifier` field
3. Verify values match the parsed data
4. Verify existing fields (id, subjectId, etc.) are unchanged

### Integration Tests

**File**: `frontend/src/__tests__/integration.test.ts`

Test end-to-end CSV import:
1. Import sample rooms.csv with various section formats
2. Verify all sections have `courseShortcode` and `sectionIdentifier` populated
3. Verify data can be stored and retrieved from IndexedDB
4. Verify ConfigData validation passes with new fields

### Regression Tests

Ensure existing functionality continues to work:
1. All existing CSV parser tests pass
2. All existing CSV transformer tests pass
3. Section ID generation remains unchanged
4. ConfigData validation logic works with new fields

## Migration Considerations

### Backward Compatibility

**Existing Data**: 
- Existing Section entities in IndexedDB will not have the new fields
- Application should handle missing fields gracefully
- Consider adding a migration utility to populate fields from existing section IDs

**API Compatibility**:
- New fields are additive (not breaking changes)
- Existing code that doesn't use the new fields continues to work
- TypeScript will require new fields in new Section objects

### Future Enhancements

Potential uses for the split section data:
1. **Filtering**: Filter schedule by course shortcode (e.g., show all M3 sections)
2. **Grouping**: Group sections by shortcode in UI displays
3. **Validation**: Validate that section identifiers are unique within a shortcode
4. **Reporting**: Generate reports grouped by course shortcode
5. **Search**: Enable search by shortcode or identifier independently
