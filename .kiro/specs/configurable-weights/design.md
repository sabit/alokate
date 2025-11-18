# Design Document

## Overview

This feature adds interactive weight configuration controls to the Settings Panel, allowing users to adjust the four optimizer weights (preference, mobility, seniority, consecutive) through number input fields. The design leverages the existing settings infrastructure in the Scheduler Store and IndexedDB persistence layer, requiring minimal changes to the state management architecture.

## Architecture

### Component Structure

```
SettingsPanel (modified)
├── Algorithm Weights Section (new)
│   ├── Weight Input Controls (4x)
│   │   ├── Label
│   │   ├── Number Input
│   │   └── Helper Text
│   └── Reset Button
├── Randomize Seed Button (existing)
├── Theme Section (existing)
└── Data Management Section (existing)
```

### Data Flow

1. **User Input → State Update**
   - User modifies weight value in input field
   - onChange handler validates and clamps value
   - updateSettings called with new settings object
   - Scheduler Store updates settings state

2. **State Update → Persistence**
   - Settings change triggers persistence effect
   - saveState called with complete unified state
   - IndexedDB stores updated state

3. **Application Load → State Restoration**
   - App initialization loads state from IndexedDB
   - Scheduler Store hydrates with loaded state
   - Settings Panel renders with restored weight values

4. **Optimizer Execution**
   - Optimizer reads weights from settings state
   - Weights applied to score calculations
   - Schedule generated with configured weights

## Components and Interfaces

### Modified Component: SettingsPanel

**Location:** `frontend/src/components/settings/SettingsPanel.tsx`

**Changes:**
- Add weight input controls section
- Add reset weights button
- Add weight change handlers
- Add validation logic for weight inputs
- Trigger persistence on weight changes

**New UI Elements:**

```typescript
// Weight input control structure
interface WeightInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helperText: string;
}

// Weight configuration
const WEIGHT_CONFIG = {
  preference: {
    label: 'Preference Weight',
    helperText: 'Affects subject, timeslot, and building preferences',
  },
  mobility: {
    label: 'Mobility Weight',
    helperText: 'Affects building transition penalties',
  },
  seniority: {
    label: 'Seniority Weight',
    helperText: 'Affects faculty seniority priority',
  },
  consecutive: {
    label: 'Consecutive Weight',
    helperText: 'Affects consecutive timeslot penalties',
  },
};

// Validation constants
const MIN_WEIGHT = 0;
const MAX_WEIGHT = 10;
const WEIGHT_STEP = 0.1;
```

### State Management

**No changes required to:**
- `SchedulerState` interface (already has updateSettings)
- `Settings` type (already has weights structure)
- `useSchedulerStore` (already has updateSettings action)

**Persistence Strategy:**
- Use existing `saveState` function from `data/storage.ts`
- Call after each weight update to persist changes
- Leverage existing IndexedDB infrastructure

## Data Models

### Existing Settings Type (No Changes)

```typescript
interface Settings {
  weights: {
    mobility: number;
    seniority: number;
    preference: number;
    consecutive: number;
  };
  theme: 'light' | 'dark';
  optimizerSeed?: number;
}
```

### Default Weight Values

```typescript
const DEFAULT_WEIGHTS = {
  preference: 1,
  mobility: 1,
  seniority: 1,
  consecutive: 1,
};
```

**Note:** The current default in `schedulerStore.ts` has non-standard values (mobility: 0.8, seniority: 1.2). The reset functionality will use the standard defaults (all 1.0) to provide a neutral baseline.

## Error Handling

### Input Validation

1. **Out of Range Values**
   - Clamp to MIN_WEIGHT (0) or MAX_WEIGHT (10)
   - No error messages needed (silent correction)
   - Display clamped value in input

2. **Invalid Input (NaN)**
   - Preserve previous valid value
   - Do not update state
   - Input field shows previous value

3. **Decimal Precision**
   - Round to 2 decimal places
   - Use `toFixed(2)` for display
   - Store as number (not string)

### Persistence Errors

1. **Save Failure**
   - Log error to console
   - Show toast notification to user
   - State remains updated in memory
   - User can retry by modifying another setting

2. **Load Failure**
   - Fall back to default weights
   - Log error to console
   - Application continues with defaults

## Testing Strategy

### Unit Tests

**File:** `frontend/src/components/settings/__tests__/SettingsPanel.test.tsx`

1. **Weight Input Rendering**
   - Verify all 4 weight inputs render
   - Verify labels and helper text display correctly
   - Verify initial values match store state

2. **Weight Value Updates**
   - Test valid value updates (0-10 range)
   - Test boundary values (0, 10)
   - Test decimal values (e.g., 1.5, 2.75)
   - Verify updateSettings called with correct values

3. **Input Validation**
   - Test values below minimum (should clamp to 0)
   - Test values above maximum (should clamp to 10)
   - Test invalid input (NaN, empty string)
   - Test decimal precision (rounds to 2 places)

4. **Reset Functionality**
   - Test reset button click
   - Verify all weights reset to 1.0
   - Verify updateSettings called with default values

5. **Persistence Integration**
   - Mock saveState function
   - Verify saveState called after weight updates
   - Verify correct state passed to saveState

### Integration Tests

**File:** `frontend/src/__tests__/weight-configuration.test.ts`

1. **End-to-End Weight Configuration**
   - Load application with default weights
   - Modify weights through UI
   - Verify optimizer uses updated weights
   - Verify weights persist across page reload

2. **Optimizer Integration**
   - Configure custom weights
   - Run optimizer
   - Verify score calculations use custom weights
   - Compare results with default weights

### Manual Testing Checklist

1. Navigate to Settings page
2. Verify weight inputs display current values
3. Modify each weight individually
4. Verify values update in real-time
5. Test boundary values (0, 10)
6. Test invalid inputs (negative, >10, text)
7. Click reset button
8. Verify all weights return to 1.0
9. Reload page
10. Verify weights persist
11. Run optimizer with custom weights
12. Verify schedule reflects weight priorities

## Implementation Notes

### Styling Approach

- Use existing Tailwind classes for consistency
- Match styling of other Settings Panel sections
- Use grid layout for weight inputs (2 columns on larger screens)
- Ensure responsive design for mobile devices

### Accessibility Considerations

- Use semantic HTML (label, input type="number")
- Ensure keyboard navigation works
- Add aria-labels for screen readers
- Maintain sufficient color contrast

### Performance Considerations

- Debounce weight updates to avoid excessive persistence calls
- Use controlled inputs for immediate visual feedback
- Avoid re-rendering entire panel on weight changes
- Consider memoization for weight input components

### Browser Compatibility

- Number input type supported in all modern browsers
- IndexedDB available in all target browsers
- No polyfills required
