# Design Document

## Overview

This design addresses the visual instability in the PreferenceMatrix component where clicking preference score cells causes the grid layout to shift horizontally. The issue occurs because preference values change from single-character ("0") to multi-character ("+1", "+2", "-3") strings, causing button widths to adjust dynamically. The solution involves applying fixed or minimum widths to preference score cells to maintain consistent column widths regardless of content.

## Architecture

The fix is localized to the PreferenceMatrix component (`PreferenceMatrix.tsx`). The component renders a table with:
- Sticky left column for faculty names
- Sticky top row for column headers (subjects/timeslots/buildings)
- Grid cells containing clickable buttons that display preference scores

No changes are needed to:
- State management or data structures
- Preference calculation logic
- Other components

## Components and Interfaces

### Modified Component: PreferenceMatrix.tsx

**Current Behavior:**
- Line 465-483: Preference score buttons use `w-full` class with dynamic content width
- Button content changes from "0" to "+1", "+2", "+3", "-1", "-2", "-3"
- Single-character values ("0") are narrower than multi-character values ("+3", "-3")
- Table columns adjust width based on content, causing horizontal shift

**New Behavior:**
- Apply fixed or minimum width to table cells containing preference buttons
- Ensure buttons accommodate the widest possible value ("-3" or "+3")
- Maintain consistent column width across all preference values
- Preserve responsive behavior for other columns

### CSS Strategy

Two approaches to consider:

#### Option 1: Fixed Width on Table Cells
Apply a fixed width directly to the `<td>` elements containing preference buttons:

```tsx
<td key={columnIdentifier} className="px-4 py-2 w-20">
```

Pros:
- Simple, declarative approach
- Guaranteed consistency
- Works well with Tailwind utilities

Cons:
- Less flexible for different font sizes or zoom levels

#### Option 2: Minimum Width with Text Centering
Apply minimum width and ensure text is centered:

```tsx
<td key={columnIdentifier} className="px-4 py-2 min-w-[5rem]">
  <button
    type="button"
    className={clsx(
      'w-full min-w-[3rem] rounded-md ...',
      preferenceColors[value],
    )}
  >
```

Pros:
- More flexible for edge cases
- Allows slight expansion if needed
- Better for accessibility (zoom, font scaling)

Cons:
- Slightly more complex

**Recommended Approach:** Option 1 (Fixed Width) for simplicity and guaranteed stability.

### Width Calculation

The widest preference value is "-3" or "+3" (2 characters). With:
- Font size: `text-sm` (0.875rem / 14px)
- Padding: `px-2` (0.5rem / 8px on each side)
- Border: `border` (1px on each side)

Estimated minimum button width: ~3rem (48px)
Recommended cell width: 5rem (80px) to provide comfortable spacing

### Implementation Details

1. **Table Cell Width:**
   - Add fixed width class to preference score `<td>` elements
   - Apply to all three matrix views (subjects, timeslots, buildings)
   - Maintain existing padding (`px-4 py-2`)

2. **Button Styling:**
   - Keep existing `w-full` class for buttons to fill cell width
   - Ensure text remains centered within button
   - Preserve all existing interaction styles (hover, focus, colors)

3. **Responsive Behavior:**
   - Fixed width applies at all viewport sizes
   - Faculty name column (sticky left) remains flexible
   - Header columns maintain fixed width
   - Table container continues to scroll horizontally when needed

### Code Changes

**Location:** `frontend/src/components/preferences/PreferenceMatrix.tsx`

**Line ~465-483:** Update the table cell rendering:

```tsx
// Before:
<td key={columnIdentifier} className="px-4 py-2">
  <button
    type="button"
    className={clsx(
      'w-full rounded-md border border-white/5 px-2 py-1 text-sm font-semibold transition hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400',
      preferenceColors[value],
    )}
    // ... event handlers
  >
    {value > 0 ? `+${value}` : value}
  </button>
</td>

// After:
<td key={columnIdentifier} className="px-4 py-2 w-20">
  <button
    type="button"
    className={clsx(
      'w-full rounded-md border border-white/5 px-2 py-1 text-sm font-semibold transition hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400',
      preferenceColors[value],
    )}
    // ... event handlers (unchanged)
  >
    {value > 0 ? `+${value}` : value}
  </button>
</td>
```

**Line ~398-425:** Update header cells to match:

```tsx
<th
  key={column.id}
  scope="col"
  className="relative sticky top-0 z-20 px-4 py-3 font-semibold w-20"
  // ... rest unchanged
>
```

## Error Handling

No error handling changes required. This is a pure CSS/styling fix.

## Testing Strategy

### Manual Testing
1. Load the preference matrix with subjects view
2. Click multiple preference cells to cycle through values (0 → +1 → +2 → +3 → -3 → -2 → -1 → 0)
3. Verify that columns do not shift horizontally during value changes
4. Switch to timeslots view and repeat test
5. Switch to buildings view and repeat test
6. Test with different numbers of columns (few vs many subjects/timeslots/buildings)
7. Test responsive behavior at different viewport widths
8. Verify table scrolls horizontally when needed without layout shift

### Visual Regression
1. Compare before/after screenshots of the preference matrix
2. Verify column alignment remains consistent
3. Ensure no unintended spacing changes
4. Check that sticky columns (faculty names, headers) still work correctly

### Edge Cases
- Single column (one subject/timeslot/building)
- Many columns (20+ subjects)
- Long faculty names in left column
- Narrow viewport (mobile)
- Browser zoom at 150%, 200%

## Notes

- The `w-20` class (5rem / 80px) provides comfortable spacing for preference values
- If the width feels too wide or narrow after implementation, adjust to `w-16` (4rem) or `w-24` (6rem)
- The fixed width only applies to preference score columns, not the faculty name column
- This fix does not affect the mobility or consecutive views, which use sliders instead of buttons
- Consider applying similar fixed-width treatment to other numeric columns in the application if they exhibit similar behavior
