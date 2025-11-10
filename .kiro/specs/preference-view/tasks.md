# Implementation Plan

- [x] 1. Implement column sorting for preference matrix





  - Add sortColumns helper function that performs case-insensitive alphabetical sorting
  - Modify the columns useMemo hook to apply sorting to the column array
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Implement sticky table headers






- [x] 2.1 Wrap table in fixed-height scroll container


  - Replace the current `overflow-auto` div with a container that has `max-h-[600px] overflow-auto`
  - Add rounded border styling to the container
  - _Requirements: 1.1, 1.2_


- [x] 2.2 Apply sticky positioning to individual header cells

  - Add `sticky top-0 z-20` classes to each column header `<th>` element
  - Change background from semi-transparent to solid (e.g., `bg-slate-900` instead of `bg-slate-900/60`)
  - For the faculty column header, use `sticky left-0 top-0 z-30` to stick both vertically and horizontally
  - _Requirements: 1.3, 1.4_


- [x] 2.3 Update sticky faculty column in tbody

  - Change the faculty column background in tbody rows from semi-transparent to solid (e.g., `bg-slate-950` instead of `bg-slate-950/60`)
  - Ensure z-index is appropriate (z-10) for proper layering
  - _Requirements: 1.5_

- [x] 3. Consolidate mobility explanation text



  - Move the explanatory text outside the faculty map loop
  - Display the text once at the top of the mobility view section
  - Remove the repeated text from individual faculty card divs
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Implement preference count tooltips on column headers





- [x] 4.1 Create calculatePreferenceCounts helper function


  - Write function that iterates through all faculties and counts preferences for a given column
  - Return a Record<PreferenceLevel, number> with counts for each preference level
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.2 Add hover state management


  - Add useState hook to track the currently hovered column ID
  - Implement onMouseEnter and onMouseLeave handlers on header cells
  - _Requirements: 4.4, 4.5_

- [x] 4.3 Create tooltip rendering logic


  - Create inline tooltip component or JSX that displays preference counts
  - Format the tooltip to show each preference level with its count
  - Position the tooltip appropriately relative to the header cell
  - Conditionally render tooltip when hoveredColumn matches the column ID
  - _Requirements: 4.6_

- [x] 5. Make "How to edit preferences" section collapsible and collapsed by default



- [x] 5.1 Add collapsible state management





  - Add useState hook to track whether the instructions section is expanded or collapsed
  - Initialize the state to false (collapsed by default)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 5.2 Implement toggle button and collapsible UI




  - Add a clickable header with an expand/collapse icon (e.g., chevron down/up)
  - Conditionally render the instruction list based on the expanded state
  - Add smooth transition animation when expanding/collapsing
  - Ensure the section remains accessible via keyboard navigation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
