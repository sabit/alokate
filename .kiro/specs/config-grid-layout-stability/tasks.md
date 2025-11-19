# Implementation Plan

- [x] 1. Apply fixed width to preference score table cells





  - Add `w-20` class to `<td>` elements containing preference score buttons (around line 465)
  - Apply the same width class to corresponding `<th>` header cells (around line 398-425)
  - Ensure the fixed width applies to all three matrix views (subjects, timeslots, buildings)
  - Verify that existing padding (`px-4 py-2`) and button styling (`w-full`) remain unchanged
  - Test that preference value changes (0 → +1 → +2 → +3 → -3) no longer cause horizontal grid shifting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_
