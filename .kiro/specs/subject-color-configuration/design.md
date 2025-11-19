# Design Document

## Overview

This feature adds color configuration capabilities to subjects, allowing users to visually distinguish subjects throughout the application. Each subject will have an associated color that appears in the Config View (for editing), Preferences Page (subject headers), and Schedule Grid (cell backgrounds). The system will automatically assign default colors from a predefined palette and allow users to customize them through a color picker interface.

## Architecture

### Data Model Changes

The `Subject` interface will be extended to include an optional `color` field:

```typescript
export interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string; // Hexadecimal color code (e.g., "#F4D1AE")
}
```

The color field is optional to maintain backward compatibility with existing configurations that don't have colors defined.

### Default Color Palette

A predefined palette of six colors will be used for automatic color assignment:

```typescript
const DEFAULT_SUBJECT_COLORS = [
  '#F4D1AE', // Light peach
  '#B8E6B8', // Light green
  '#B8D8E8', // Light blue
  '#D8B8E8', // Light purple
  '#C8C8C8', // Light gray
  '#F4C8A0', // Light orange
];
```

### Color Assignment Strategy

When subjects are loaded without colors:
1. Iterate through subjects in their current order
2. Assign colors sequentially from the palette
3. Cycle back to the beginning if there are more than 6 subjects
4. Store the assigned colors in the configuration

## Components and Interfaces

### 1. Color Utility Functions

**Location:** `frontend/src/utils/colorUtils.ts`

```typescript
// Get default color for a subject based on its index
export const getDefaultSubjectColor = (index: number): string => {
  return DEFAULT_SUBJECT_COLORS[index % DEFAULT_SUBJECT_COLORS.length];
};

// Ensure all subjects have colors assigned
export const ensureSubjectColors = (subjects: Subject[]): Subject[] => {
  return subjects.map((subject, index) => ({
    ...subject,
    color: subject.color || getDefaultSubjectColor(index),
  }));
};

// Calculate contrasting text color for accessibility
export const getContrastTextColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
};

// Validate hexadecimal color code
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};
```

### 2. Color Picker Component

**Location:** `frontend/src/components/config/ColorPicker.tsx`

A reusable color picker component that displays a color swatch and opens a native color input when clicked.

```typescript
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  // Render a button with the current color
  // On click, open native color input
  // Validate and update color on change
};
```

**Features:**
- Display current color as a circular swatch
- Use native HTML5 color input for color selection
- Validate color format before applying
- Accessible with keyboard navigation and ARIA labels

### 3. ConfigDataTables Enhancement

**Location:** `frontend/src/components/config/ConfigDataTables.tsx`

Modify the subjects table to include a color column:

**Changes:**
1. Add a "Color" column header in the subjects table
2. Render `ColorPicker` component for each subject row
3. Implement `updateSubject` function to handle color changes
4. Ensure colors are assigned when subjects are first loaded

```typescript
const updateSubject = (subjectId: string, updates: Partial<Subject>) => {
  const updatedSubjects = config.subjects.map((s) =>
    s.id === subjectId ? { ...s, ...updates } : s,
  );
  updateConfig({ ...config, subjects: updatedSubjects });
};
```

### 4. PreferenceMatrix Enhancement

**Location:** `frontend/src/components/preferences/PreferenceMatrix.tsx`

Apply subject colors to column headers in the subjects view:

**Changes:**
1. When `activeView === 'subjects'`, apply subject colors to header backgrounds
2. Use `getContrastTextColor` to ensure readable text
3. Retrieve subject color from config using subject ID

```typescript
// In the table header rendering
{columns.map((column) => {
  const subject = config.subjects.find(s => s.id === column.id);
  const backgroundColor = subject?.color || '#475569'; // fallback to slate
  const textColor = getContrastTextColor(backgroundColor);
  
  return (
    <th
      key={column.id}
      style={{ backgroundColor, color: textColor }}
      // ... rest of props
    >
      {column.label}
    </th>
  );
})}
```

### 5. ScheduleGrid Enhancement

**Location:** `frontend/src/components/schedule/ScheduleGrid/ScheduleGrid.tsx`

Apply subject colors to schedule cell backgrounds:

**Changes:**
1. For each cell with an assigned section, retrieve the subject color
2. Apply the color as the cell background
3. Use `getContrastTextColor` for text elements
4. Maintain existing border styles for conflicts and locked states

```typescript
// In cell rendering logic
const section = config.sections.find(s => s.id === entry.sectionId);
const subject = section ? config.subjects.find(sub => sub.id === section.subjectId) : null;
const cellBackgroundColor = subject?.color || 'bg-slate-800'; // fallback

// Apply as inline style or dynamic class
style={{ backgroundColor: subject?.color }}
```

### 6. Store Integration

**Location:** `frontend/src/store/schedulerStore.ts`

Ensure color assignment happens when configuration is loaded:

**Changes:**
1. When `updateConfig` is called, automatically assign default colors to subjects without colors
2. This ensures backward compatibility with existing configurations

```typescript
updateConfig: (config) => {
  const configWithColors = {
    ...config,
    subjects: ensureSubjectColors(config.subjects),
  };
  set({ config: configWithColors });
}
```

## Data Models

### Updated Subject Interface

```typescript
export interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string; // Optional for backward compatibility
}
```

### Configuration Data

Subject colors will be persisted in the configuration JSON:

```json
{
  "subjects": [
    {
      "id": "subject-math101",
      "name": "Foundations of Algebra",
      "code": "MATH-101",
      "color": "#F4D1AE"
    },
    {
      "id": "subject-phys210",
      "name": "Classical Mechanics",
      "code": "PHYS-210",
      "color": "#B8E6B8"
    }
  ]
}
```

## Error Handling

### Invalid Color Codes

- Validate color input using `isValidHexColor` function
- If invalid, show error toast and revert to previous color
- Prevent non-hexadecimal values from being saved

### Missing Colors

- Automatically assign default colors when subjects are loaded without colors
- Ensure all subjects always have a valid color value before rendering

### Import/Export

- When importing configuration without colors, assign defaults automatically
- When exporting, include color values in the JSON
- Maintain backward compatibility with configurations that don't have colors

## Testing Strategy

### Unit Tests

1. **Color Utility Functions** (`colorUtils.test.ts`)
   - Test `getDefaultSubjectColor` with various indices
   - Test `ensureSubjectColors` with subjects with and without colors
   - Test `getContrastTextColor` with light and dark backgrounds
   - Test `isValidHexColor` with valid and invalid inputs

2. **ColorPicker Component** (`ColorPicker.test.tsx`)
   - Test rendering with initial color
   - Test color change callback
   - Test validation of invalid colors
   - Test keyboard accessibility

### Integration Tests

1. **ConfigDataTables** (`ConfigDataTables.test.tsx`)
   - Test color picker appears in subjects table
   - Test updating subject color persists to store
   - Test default colors are assigned to new subjects

2. **PreferenceMatrix** (`PreferenceMatrix.test.tsx`)
   - Test subject headers display correct background colors
   - Test text contrast is readable
   - Test color updates reflect immediately

3. **ScheduleGrid** (`ScheduleGrid.test.tsx`)
   - Test schedule cells display subject colors
   - Test text contrast in colored cells
   - Test fallback color for subjects without colors

### Manual Testing

1. Load configuration without colors and verify defaults are assigned
2. Change subject colors in Config View and verify changes appear in Preferences and Schedule
3. Export configuration and verify colors are included
4. Import configuration with colors and verify they are applied
5. Test accessibility with screen readers and keyboard navigation
6. Test color contrast meets WCAG AA standards

## Accessibility Considerations

### Color Contrast

- Use `getContrastTextColor` to ensure text is readable on colored backgrounds
- Target WCAG AA standard (4.5:1 contrast ratio for normal text)
- Test with various color combinations

### Keyboard Navigation

- Ensure color picker is keyboard accessible
- Support Enter/Space to open color input
- Support Escape to close without changes

### Screen Readers

- Add ARIA labels to color pickers: "Color for [Subject Code]"
- Announce color changes to screen readers
- Ensure color is not the only way to distinguish subjects (use labels/codes as well)

### Color Blindness

- Provide additional visual cues beyond color (subject codes, labels)
- Consider offering high-contrast mode in future iterations
- Test with color blindness simulators

## Performance Considerations

### Color Assignment

- Assign default colors only once when configuration is loaded
- Cache color calculations to avoid repeated computations
- Use memoization for contrast calculations if needed

### Rendering

- Apply colors using inline styles for dynamic values
- Avoid re-rendering entire tables when only one color changes
- Use React.memo for ColorPicker component if performance issues arise

## Future Enhancements

1. **Color Themes**: Predefined color schemes (e.g., "Pastel", "Bold", "Monochrome")
2. **Auto-contrast**: Automatically adjust colors for better contrast
3. **Color Picker Presets**: Quick access to recently used or favorite colors
4. **Bulk Color Assignment**: Apply colors to multiple subjects at once
5. **Color Export/Import**: Share color schemes between users
6. **Accessibility Mode**: High-contrast color palette option
