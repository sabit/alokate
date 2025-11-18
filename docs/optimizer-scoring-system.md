# Optimizer Scoring System

## Overview

The Alokate optimizer uses a weighted scoring system to assign faculty members to course sections. Each potential assignment is evaluated based on multiple factors, and the assignment with the highest total score is selected.

## Architecture

### Single Source of Truth

All scoring calculations happen in **one place**: `frontend/src/engine/optimizer.ts`

- **Optimizer**: Calculates both raw and weighted scores, stores them in `scoreBreakdown`
- **UI Formatter** (`scoreFormatters.ts`): Displays pre-calculated scores (no recalculation)

This design prevents inconsistencies and makes the scoring logic easier to maintain.

## Score Components

### 1. Preference Score (Raw)

Combines three preference types:

```typescript
preference = subjectPreference + timeslotPreference + buildingPreference
```

- **Subject Preference**: Faculty's preference for teaching the subject (-3 to +3)
- **Timeslot Preference**: Faculty's preference for the time slot (-3 to +3)
- **Building Preference**: Faculty's preference for the building location (-3 to +3)

**Range**: -9 to +9 (sum of three components)

### 2. Mobility Score (Raw)

Penalizes faculty who must move between buildings throughout the day.

```typescript
mobilityScore = -1 × mobilityValue × transitionCount
```

- **mobilityValue**: Faculty's mobility constraint (0 = highly mobile, higher = less mobile)
- **transitionCount**: Number of building changes in chronological order

**Example**: 
- Faculty with mobility = 5
- 2 building transitions in a day
- Score: -1 × 5 × 2 = **-10**

**Range**: 0 to negative (more transitions = more negative)

### 3. Seniority Score (Raw)

Prioritizes senior faculty based on their position in the faculty list.

```typescript
seniority = totalFaculty - facultyIndex
```

- First faculty in list gets highest seniority
- Last faculty gets seniority of 1

**Example**: With 50 faculty members:
- 1st faculty: seniority = 50
- 25th faculty: seniority = 26
- 50th faculty: seniority = 1

**Range**: 1 to totalFaculty

### 4. Consecutive Score (Raw)

Penalizes back-to-back classes (with optional lunch hour multiplier).

**Algorithm**:
1. Group timeslots by day
2. Sort each day's timeslots chronologically by start time
3. Assign each timeslot an index within its day (0, 1, 2, ...)
4. Check if faculty has assignments at consecutive indices

```typescript
consecutiveScore = -1 × consecutiveValue × consecutiveCount
```

- **consecutiveValue**: Faculty's consecutive preference (higher = dislikes consecutive more)
- **consecutiveCount**: Number of consecutive pairs
- **Lunch hour pairs**: Count as 2 instead of 1 (11:00-14:00 span)

**Example**:
- Faculty with consecutive = 1
- Has classes at indices 0, 1, 2 (three consecutive slots)
- Consecutive pairs: (0→1) and (1→2) = 2 pairs
- Score: -1 × 1 × 2 = **-2**

**Range**: 0 to negative (more consecutive = more negative)

### 5. Capacity Penalty (Unweighted)

Hard constraint to prevent overloading faculty beyond their limits.

```typescript
if (currentLoad < maxSections) {
  penalty = 0  // Within normal capacity
}
else if (!canOverload) {
  penalty = -1000  // Cannot overload - hard block
}
else if (overloadAmount >= maxOverload) {
  penalty = -1000  // Exceeds overload limit - hard block
}
else {
  penalty = -50 × overloadAmount  // Escalating penalty
}
```

**Example**: Faculty with maxSections=3, maxOverload=2, canOverload=true
- Load 1-3: penalty = 0
- Load 4: penalty = -50 (1st overload)
- Load 5: penalty = -100 (2nd overload)
- Load 6+: penalty = -1000 (exceeds limit)

**Range**: 0, -50, -100, ..., or -1000

## Weight Application

### Configurable Weights

Users can configure four weights in the Settings panel:

- **Preference Weight** (default: 1.0)
- **Mobility Weight** (default: 1.0)
- **Seniority Weight** (default: 1.0)
- **Consecutive Weight** (default: 1.0)

**Range**: 0.0 to 10.0 (with 0.1 increments)

### Total Score Calculation

```typescript
total = (preference × preferenceWeight) 
      + (mobility × mobilityWeight)
      + (seniority × seniorityWeight)
      + (consecutive × consecutiveWeight)
      + capacityPenalty  // Not weighted
```

**Note**: Capacity penalty is NOT weighted because it's a hard constraint.

### Weighted Components

The optimizer stores both raw and weighted scores:

```typescript
scoreBreakdown = {
  // Raw scores (before weights)
  preference: number,
  mobility: number,
  seniority: number,
  consecutive: number,
  capacityPenalty: number,
  total: number,
  
  // Weighted contributions (raw × weight)
  weighted: {
    preference: number,
    mobility: number,
    seniority: number,
    consecutive: number
  }
}
```

## Optimizer Flow

### 1. Initialization

```
1. Load configuration (faculty, sections, timeslots, rooms, buildings)
2. Load preferences (subject, timeslot, building, mobility, consecutive)
3. Load current schedule (locked entries)
4. Load weights from settings
5. Build lookup maps and caches:
   - Faculty by ID
   - Section by ID
   - Room by ID
   - Timeslot index within day (for consecutive detection)
   - Faculty seniority cache
   - Faculty capacity cache
```

### 2. Process Locked Entries

```
For each locked entry:
  1. Validate section and faculty exist
  2. Calculate all score components
  3. Apply weights
  4. Store in sanitized locked entries
  5. Update faculty load
  6. Mark section as assigned
  7. Add to conflict tracker
```

### 3. Analyze Section Feasibility

```
For each unassigned section:
  Count feasible faculty candidates:
    - Within capacity (or can overload)
    - No timeslot conflicts
  
Sort sections by feasibility (ascending):
  - Sections with fewer candidates processed first
  - Ensures difficult assignments are handled early
```

### 4. Assignment Loop

```
For each section (in priority order):
  
  1. Build candidate list:
     For each faculty:
       - Calculate preference score
       - Calculate mobility score
       - Calculate seniority score
       - Calculate consecutive score
       - Calculate capacity penalty
       - Apply weights
       - Calculate total score
  
  2. Sort candidates by:
     - Total score (descending)
     - Current load (ascending - prefer less loaded)
     - Capacity (descending - prefer higher capacity)
     - Tie breaker (deterministic hash)
  
  3. Select best candidate
  
  4. Find valid timeslot:
     - If section has fixed timeslot, check for conflicts
     - Otherwise, pick best available timeslot based on preferences
     - If no valid timeslot, try alternative candidates
  
  5. Create schedule entry:
     - Store raw scores
     - Store weighted scores
     - Store total score
  
  6. Update state:
     - Add to result schedule
     - Mark section as assigned
     - Increment faculty load
     - Add to conflict tracker
```

### 5. Return Results

```
Return schedule entries with complete score breakdowns
```

## Score Breakdown Display

### Tooltip Format

```
Dr. [Name] at [Day] [Time]

[Subject Code] • [Subject Name]
Room: [Room] • Building: [Building]

Score Breakdown:
  Preference: +2.0 (+2.0 × weight)
    Subject: +1.0
    Timeslot: +1.0
    Building: 0.0
  Mobility: -5.0 (-5.0 × weight)
  Seniority: +0.3 (+32.0 × weight)
  Consecutive: -1.5 (-1.0 × weight)
  Capacity Penalty: -50.0
  Total: -54.2
```

### Interpretation

- **Weighted scores** show actual contribution to total
- **Raw scores** (in parentheses) show pre-weight values
- **Capacity penalty** is always unweighted
- **Total** = sum of all weighted components + capacity penalty

## Example Scenarios

### Scenario 1: Ideal Assignment

```
Faculty: Senior professor, highly mobile, no consecutive classes
Preferences: Loves subject (+3), prefers timeslot (+2), likes building (+1)
Weights: All 1.0
Load: 2/5 (within capacity)

Calculation:
  Preference: (+3 + 2 + 1) × 1.0 = +6.0
  Mobility: 0 × 1.0 = 0.0
  Seniority: 50 × 1.0 = +50.0
  Consecutive: 0 × 1.0 = 0.0
  Capacity: 0
  Total: +56.0 ✓ Excellent score
```

### Scenario 2: Overloaded Faculty

```
Faculty: Junior professor, low mobility
Preferences: Neutral (0, 0, 0)
Weights: All 1.0
Load: 4/3 (1 into overload, max overload = 2)

Calculation:
  Preference: 0 × 1.0 = 0.0
  Mobility: 0 × 1.0 = 0.0
  Seniority: 5 × 1.0 = +5.0
  Consecutive: 0 × 1.0 = 0.0
  Capacity: -50 (overload penalty)
  Total: -45.0 ⚠️ Discouraged but allowed
```

### Scenario 3: High Consecutive Penalty

```
Faculty: Mid-level professor
Preferences: Neutral (0, 0, 0)
Weights: Consecutive = 50.0 (very high), others = 1.0
Load: 2/5 (within capacity)
Consecutive: 3 back-to-back classes

Calculation:
  Preference: 0 × 1.0 = 0.0
  Mobility: 0 × 1.0 = 0.0
  Seniority: 25 × 1.0 = +25.0
  Consecutive: -2 × 50.0 = -100.0
  Capacity: 0
  Total: -75.0 ❌ Heavily penalized
```

## Configuration Best Practices

### Balanced Weights (Default)

```
Preference: 1.0
Mobility: 1.0
Seniority: 1.0
Consecutive: 1.0
```

Use when all factors are equally important.

### Preference-Focused

```
Preference: 5.0
Mobility: 1.0
Seniority: 0.5
Consecutive: 1.0
```

Prioritizes faculty preferences over seniority.

### Seniority-Focused

```
Preference: 1.0
Mobility: 1.0
Seniority: 3.0
Consecutive: 1.0
```

Gives senior faculty strong priority for preferred assignments.

### Minimize Consecutive Classes

```
Preference: 1.0
Mobility: 1.0
Seniority: 1.0
Consecutive: 10.0
```

Strongly discourages back-to-back classes.

### Minimize Building Transitions

```
Preference: 1.0
Mobility: 5.0
Seniority: 1.0
Consecutive: 1.0
```

Reduces faculty movement between buildings.

## Technical Details

### Consecutive Detection Algorithm

1. **Group timeslots by day**
   ```typescript
   timeslotsByDay = {
     'Monday': [ts1, ts2, ts3],
     'Tuesday': [ts4, ts5],
     ...
   }
   ```

2. **Sort each day by start time**
   ```typescript
   'Monday': [
     { id: 'ts1', start: '08:00' },  // index 0
     { id: 'ts2', start: '09:40' },  // index 1
     { id: 'ts3', start: '11:20' },  // index 2
   ]
   ```

3. **Assign day-based indices**
   ```typescript
   timeslotDayIndex = {
     'ts1': 0,
     'ts2': 1,
     'ts3': 2,
     ...
   }
   ```

4. **Check for consecutive indices**
   ```typescript
   if (currentDayIndex === prevDayIndex + 1 && sameDay) {
     consecutiveCount++
   }
   ```

### Lunch Hour Detection

Timeslots are considered lunch-spanning if:
- Previous slot ends between 11:00-13:00
- Current slot starts between 11:00-14:00

```typescript
const isLunchHourPair = (prev, current) => {
  const prevEnd = parseTimeToMinutes(prev.end)
  const currentStart = parseTimeToMinutes(current.start)
  
  return prevEnd >= 660 && prevEnd <= 780 &&  // 11:00-13:00
         currentStart >= 660 && currentStart <= 840  // 11:00-14:00
}
```

### Mobility Calculation

1. **Get faculty assignments in chronological order**
2. **Extract building for each assignment**
3. **Count transitions where building changes**

```typescript
assignments = [
  { time: '08:00', building: 'A' },
  { time: '09:40', building: 'A' },  // No transition
  { time: '11:20', building: 'B' },  // Transition! (+1)
  { time: '14:00', building: 'B' },  // No transition
]
transitionCount = 1
```

## Troubleshooting

### Issue: Scores don't add up to total

**Check**: Is capacity penalty being displayed?

The capacity penalty is often hidden but contributes significantly to the total.

### Issue: Seniority seems ignored

**Check**: What is the seniority weight?

If seniority weight is very low (e.g., 0.01), even high seniority scores (e.g., 50) contribute minimally (50 × 0.01 = 0.5).

### Issue: Consecutive penalty is always 0

**Check**: Are timeslots properly ordered by time?

The consecutive detection relies on timeslots being sorted chronologically within each day.

### Issue: Faculty overloaded despite having capacity

**Check**: Is `canOverload` enabled?

Faculty must have `canOverload = true` to use their overload capacity.

## Future Enhancements

Potential improvements to the scoring system:

1. **Custom penalty curves**: Allow non-linear capacity penalties
2. **Time-of-day preferences**: Weight preferences by time (morning vs afternoon)
3. **Room capacity matching**: Penalize room size mismatches
4. **Workload balancing**: Additional penalty for uneven distribution
5. **Multi-day patterns**: Detect and penalize/reward specific weekly patterns

## References

- Optimizer implementation: `frontend/src/engine/optimizer.ts`
- Score formatting: `frontend/src/utils/scoreFormatters.ts`
- Type definitions: `frontend/src/types/index.ts`
- Tests: `frontend/src/engine/__tests__/optimizer.test.ts`
