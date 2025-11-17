# Design Document

## Overview

This design implements a "select all" toggle checkbox in the Can Overload column header of the Faculty configuration table. The feature allows users to efficiently manage overload capabilities for all faculty members simultaneously while maintaining visual feedback about the current state (all checked, none checked, or indeterminate).

The implementation will be contained within the existing `ConfigDataTables.tsx` component, leveraging React hooks for state management and the existing `updateConfig` mechanism for persistence.

## Architecture

### Component Structure

The feature will be implemented entirely within the `ConfigDataTables` component:

```
ConfigDataTables
├── Faculty Table Section
│   ├── Table Header
│   │   ├── Name Column
│   │   ├── Initial Column
│   │   ├── Max Sections Column
│   │   ├── Max Overload Column
│   │   └── Can Overload Column (with select all checkbox) ← NEW
│   └── Table Body
│       └── Faculty Rows (existing individual checkboxes)
```

### State Management

No new state is required. The component will:
- Derive the header checkbox state from the existing `config.faculty` array
- Use the existing `updateConfig` function to persist changes
- Leverage React's reactivity to automatically update the UI when faculty data changes

## Components and Interfaces

### Modified Component: ConfigDataTables

**New Computed Values:**

```typescript
// Derived state for header checkbox
const allCanOverload = useMemo(
  () => config.faculty.length > 0 && config.faculty.every((f) => f.canOverload),
  [config.faculty]
);

const noneCanOverload = useMemo(
  () => config.faculty.length > 0 && config.faculty.every((f) => !f.canOverload),
  [config.faculty]
);

const isIndeterminate = useMemo(
  () => !allCanOverload && !noneCanOverload && config.faculty.length > 0,
  [allCanOverload, noneCanOverload, config.faculty.length]
);
```

**New Handler Function:**

```typescript
const handleToggleAllCanOverload = () => {
  // If all are checked or indeterminate, uncheck all
  // If all are unchecked, check all
  const newValue = noneCanOverload;
  
  const updatedFaculty = config.faculty.map((f) => ({
    ...f,
    canOverload: newValue,
  }));
  
  updateConfig({ ...config, faculty: updatedFaculty });
};
```

**Modified JSX:**

The Can Overload header cell will be updated to include a checkbox:

```tsx
<th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={allCanOverload}
      ref={(el) => {
        if (el) {
          el.indeterminate = isIndeterminate;
        }
      }}
      onChange={handleToggleAllCanOverload}
      disabled={config.faculty.length === 0}
      className="h-4 w-4 rounded border-white/10 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      aria-label="Toggle all faculty overload capability"
    />
    <span>Can Overload</span>
  </div>
</th>
```

### No New Interfaces Required

The feature uses existing types:
- `Faculty` interface (already has `canOverload: boolean`)
- `ConfigData` interface (already contains `faculty: Faculty[]`)

## Data Models

No changes to data models are required. The feature operates on the existing `Faculty.canOverload` boolean property.

## Error Handling

### Edge Cases

1. **Empty Faculty List**: The header checkbox will be disabled when `config.faculty.length === 0`
2. **Single Faculty Member**: The toggle will work normally, toggling between checked and unchecked states
3. **Rapid Toggling**: React's batching will handle multiple rapid clicks efficiently
4. **Concurrent Updates**: The existing state management system handles concurrent updates through the Zustand store

### No Additional Error Handling Required

The feature leverages existing error handling mechanisms:
- State updates go through the existing `updateConfig` function
- Persistence is handled by the existing storage layer
- No network calls or async operations are introduced

## Testing Strategy

### Unit Tests

Focus on the core logic for determining checkbox states:

1. **Test: All faculty can overload**
   - Given: All faculty have `canOverload: true`
   - Expected: Header checkbox is checked, not indeterminate

2. **Test: No faculty can overload**
   - Given: All faculty have `canOverload: false`
   - Expected: Header checkbox is unchecked, not indeterminate

3. **Test: Mixed overload states**
   - Given: Some faculty have `canOverload: true`, others `false`
   - Expected: Header checkbox is indeterminate

4. **Test: Empty faculty list**
   - Given: `config.faculty` is empty array
   - Expected: Header checkbox is disabled

5. **Test: Toggle from all unchecked**
   - Given: All faculty have `canOverload: false`
   - When: User clicks header checkbox
   - Expected: All faculty updated to `canOverload: true`

6. **Test: Toggle from all checked**
   - Given: All faculty have `canOverload: true`
   - When: User clicks header checkbox
   - Expected: All faculty updated to `canOverload: false`

7. **Test: Toggle from indeterminate**
   - Given: Mixed `canOverload` states
   - When: User clicks header checkbox
   - Expected: All faculty updated to `canOverload: true`

### Integration Tests

Test interaction with existing functionality:

1. **Test: Individual checkbox updates header state**
   - Given: All faculty have `canOverload: true`
   - When: User unchecks one individual checkbox
   - Expected: Header checkbox becomes indeterminate

2. **Test: State persistence**
   - Given: User toggles header checkbox
   - When: Component re-renders or page reloads
   - Expected: Changes are persisted via existing storage mechanism

### Manual Testing Checklist

- [ ] Visual appearance matches existing checkbox styling
- [ ] Indeterminate state displays correctly (dash icon)
- [ ] Keyboard navigation works (tab to checkbox, space to toggle)
- [ ] Screen reader announces state correctly
- [ ] Works when faculty section is expanded/collapsed
- [ ] Performance is acceptable with large faculty lists (100+ members)

## Implementation Notes

### Accessibility

- Use `aria-label` on the header checkbox for screen reader support
- Maintain keyboard navigation compatibility
- Ensure sufficient color contrast for the checkbox states

### Performance Considerations

- Use `useMemo` to avoid unnecessary recalculations of derived states
- The `updateConfig` call will trigger a single re-render for all checkboxes
- For very large faculty lists (100+), the current approach should still perform well due to React's efficient reconciliation

### Visual Design

- Match the existing checkbox styling used in individual rows
- Use the same color scheme (blue-500 for checked state)
- Ensure the indeterminate state is visually distinct (typically a dash icon)
- Align the checkbox and label horizontally in the header cell

### Browser Compatibility

The indeterminate checkbox state is supported in all modern browsers. The implementation uses the standard `HTMLInputElement.indeterminate` property, which has universal support.
