# Design Document

## Overview

This feature adds a context menu to the Schedule Grid that allows users to quickly clear (remove) faculty assignments from specific cells. The context menu appears on right-click and provides a "Clear Assignment" action that removes all schedule entries for the selected faculty-timeslot combination.

The implementation follows the existing patterns in the codebase:
- Uses Zustand stores for state management
- Integrates with the existing ScheduleGrid component
- Follows the established UI/UX patterns with Tailwind CSS styling
- Maintains accessibility standards with keyboard navigation and ARIA attributes

## Architecture

### Component Structure

```
ScheduleGrid (existing)
├── ContextMenu (new component)
│   └── MenuItem (new component)
└── Cell buttons (existing, enhanced with context menu triggers)
```

### State Management

The context menu state will be managed locally within the ScheduleGrid component using React's `useState` hook. This is appropriate because:
- The context menu state is ephemeral and UI-specific
- It doesn't need to be shared across components
- It's tightly coupled to the ScheduleGrid's cell interactions

The actual schedule data modification will use the existing `useSchedulerStore` store's `updateSchedule` method.

### Data Flow

1. User right-clicks on a schedule cell → Context menu opens with cell coordinates
2. User clicks "Clear Assignment" → Filter schedule entries to remove matching assignments
3. Call `updateSchedule` with filtered schedule → Store updates and triggers re-render
4. Grid reflects the cleared assignments → Context menu closes

## Components and Interfaces

### ContextMenu Component

A new reusable component for displaying context menus.

**Props Interface:**
```typescript
interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  children: React.ReactNode;
}
```

**Behavior:**
- Renders a positioned overlay menu at the specified coordinates
- Handles click-outside detection to close the menu
- Handles Escape key to close the menu
- Manages focus trap for keyboard navigation
- Provides ARIA attributes for accessibility

### MenuItem Component

A reusable menu item component for use within ContextMenu.

**Props Interface:**
```typescript
interface MenuItemProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}
```

**Behavior:**
- Renders a clickable menu item with hover states
- Supports disabled state with appropriate styling
- Handles keyboard activation (Enter/Space)
- Provides ARIA attributes

### ScheduleGrid Enhancements

**New State:**
```typescript
interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  facultyId: string | null;
  timeslotId: string | null;
}
```

**New Methods:**
```typescript
const handleContextMenu = (
  event: React.MouseEvent,
  facultyId: string,
  timeslotId: string
) => void;

const handleClearAssignment = () => void;

const closeContextMenu = () => void;
```

## Data Models

No new data models are required. The feature uses existing types:

- `ScheduleEntry`: Represents a faculty assignment (existing)
- `ActiveScheduleCell`: Represents the selected cell (existing)

## Error Handling

### User-Facing Errors

1. **No assignments to clear**: The "Clear Assignment" option is disabled when the cell has no assignments
2. **Store update failure**: If `updateSchedule` fails, show a toast notification with error message

### Edge Cases

1. **Context menu positioning near viewport edges**: Calculate position to ensure menu stays within viewport bounds
2. **Multiple rapid context menu triggers**: Close existing menu before opening new one
3. **Context menu open during cell navigation**: Close context menu when active cell changes
4. **Locked assignments**: Clear all assignments including locked ones (consistent with bulk clear behavior)

### Error Recovery

- If clearing fails, the schedule state remains unchanged
- User can retry the operation
- Toast notification provides feedback on success/failure

## Testing Strategy

### Unit Tests

1. **ContextMenu Component**
   - Renders at correct position
   - Closes on outside click
   - Closes on Escape key
   - Handles keyboard navigation
   - Provides correct ARIA attributes

2. **MenuItem Component**
   - Renders with correct label
   - Handles click events
   - Respects disabled state
   - Handles keyboard activation

3. **ScheduleGrid Context Menu Integration**
   - Opens context menu on right-click
   - Opens context menu on keyboard shortcut (Shift+F10)
   - Prevents default browser context menu
   - Closes context menu when clicking outside
   - Closes context menu when cell changes

### Integration Tests

1. **Clear Assignment Flow**
   - Right-click on cell with assignments → Context menu opens
   - Click "Clear Assignment" → Assignments removed from schedule
   - Verify schedule state updated correctly
   - Verify UI reflects cleared state
   - Verify context menu closes after action

2. **Disabled State**
   - Right-click on empty cell → "Clear Assignment" is disabled
   - Clicking disabled option does nothing

3. **Multiple Assignments**
   - Right-click on cell with multiple assignments
   - Clear all assignments at once
   - Verify all entries removed

### Accessibility Tests

1. Keyboard navigation works correctly
2. Screen reader announces menu items properly
3. Focus management is correct
4. ARIA attributes are present and accurate

## Implementation Notes

### Positioning Logic

The context menu should be positioned near the cursor but adjusted to stay within the viewport:

```typescript
const calculateMenuPosition = (
  clickX: number,
  clickY: number,
  menuWidth: number,
  menuHeight: number
): { x: number; y: number } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let x = clickX;
  let y = clickY;
  
  // Adjust if menu would overflow right edge
  if (x + menuWidth > viewportWidth) {
    x = viewportWidth - menuWidth - 8;
  }
  
  // Adjust if menu would overflow bottom edge
  if (y + menuHeight > viewportHeight) {
    y = viewportHeight - menuHeight - 8;
  }
  
  return { x, y };
};
```

### Clear Assignment Logic

```typescript
const handleClearAssignment = () => {
  if (!contextMenuState.facultyId || !contextMenuState.timeslotId) {
    return;
  }
  
  const updatedSchedule = schedule.filter(
    (entry) =>
      !(entry.facultyId === contextMenuState.facultyId &&
        entry.timeslotId === contextMenuState.timeslotId)
  );
  
  updateSchedule(updatedSchedule);
  closeContextMenu();
  
  // Optional: Show success toast
  pushToast({
    message: 'Assignment cleared successfully',
    variant: 'success'
  });
};
```

### Keyboard Support

- **Right-click**: Opens context menu
- **Shift+F10** or **Context Menu key**: Opens context menu for focused cell
- **Escape**: Closes context menu
- **Arrow Up/Down**: Navigate menu items
- **Enter/Space**: Activate focused menu item
- **Tab**: Close menu and return focus to grid

### Styling Considerations

- Use existing Tailwind classes for consistency
- Match the visual style of the EditDialog component
- Ensure sufficient contrast for accessibility
- Add subtle animations for menu open/close
- Use backdrop blur for visual separation

### Performance Considerations

- Context menu state is local to avoid unnecessary re-renders
- Menu component only renders when `isOpen` is true
- Use `useCallback` for event handlers to prevent recreation
- Debounce position calculations if needed

## Future Enhancements

Potential additions that are out of scope for this feature but could be added later:

1. **Additional menu options**: "Lock Assignment", "View Details", "Swap with..."
2. **Confirmation dialog**: Optional confirmation before clearing (especially for multiple assignments)
3. **Undo/Redo**: Integration with a command pattern for undo functionality
4. **Bulk operations**: Select multiple cells and clear all at once
5. **Context menu for other grid elements**: Headers, empty cells with different options
