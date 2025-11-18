# Design Document: Consecutive Penalty Feature

## Overview

This design document outlines the implementation approach for adding a "Consecutive" penalty feature to the schedule optimizer. The feature will penalize faculty assignments when they have consecutive timeslot classes, with doubled penalties for consecutive slots around lunch hours. This design follows the existing patterns established by the Mobility penalty feature.

The implementation will touch four main areas:
1. **Data Model** - Extend the Preferences type to include consecutive penalty values
2. **UI Components** - Add consecutive penalty input to the preferences interface
3. **Optimizer Algorithm** - Implement consecutive penalty calculation logic
4. **Settings** - Add consecutive penalty weight to algorithm weights

## Architecture

### Data Flow

```
User Input (Preferences UI)
    ↓
Preferences Store (consecutive: Record<string, number>)
    ↓
Optimizer Algorithm (calculateConsecutivePenalty)
    ↓
Schedule Entry (scoreBreakdown.consecutive)
    ↓
Schedule Display (shows consecutive penalty score)
```

### Component Hierarchy

```
PreferencesPage
  └── PreferenceMatrix
        ├── View Tabs (subjects, timeslots, buildings, mobility, consecutive)
        └── Consecutive View
              └── Faculty List with Slider Inputs (0-3 range)

SettingsPage
  └── SettingsPanel
        └── Algorithm Weights Display (includes consecutive weight)
```

## Components and Interfaces

### 1. Type Definitions (`frontend/src/types/index.ts`)

**Changes Required:**

Add `consecutive` field to the `Preferences` interface:

```typescript
export interface Preferences {
  facultySubject: Record<string, Record<string, PreferenceLevel>>;
  facultyTimeslot: Record<string, Record<string, PreferenceLevel>>;
  facultyBuilding: Record<string, Record<string, PreferenceLevel>>;
  mobility: Record<string, number>;
  consecutive: Record<string, number>; // NEW: 0-3 range, default 1
}
```

Add `consecutive` field to the `ScoreBreakdown` interface:

```typescript
export interface ScoreBreakdown {
  preference: number;
  mobility: number;
  seniority: number;
  capacityPenalty: number;
  consecutive: number; // NEW
  total: number;
}
```

Add `consecutive` field to the `Settings.weights` interface:

```typescript
export interface Settings {
  weights: {
    mobility: number;
    seniority: number;
    preference: number;
    consecutive: number; // NEW: default 1.0
  };
  theme: 'light' | 'dark';
  optimizerSeed?: number;
}
```

### 2. Store Initialization (`frontend/src/store/schedulerStore.ts`)

**Changes Required:**

Update the `emptyState` function to initialize consecutive preferences and weight:

```typescript
const emptyState = (): UnifiedState => ({
  config: { /* ... */ },
  preferences: {
    facultySubject: {},
    facultyTimeslot: {},
    facultyBuilding: {},
    mobility: {},
    consecutive: {}, // NEW
  },
  schedule: [],
  snapshots: [],
  settings: {
    weights: { 
      mobility: 0.8, 
      seniority: 1.2, 
      preference: 1.0,
      consecutive: 1.0, // NEW
    },
    theme: 'dark',
    optimizerSeed: 42,
  },
});
```

### 3. Preference Matrix UI (`frontend/src/components/preferences/PreferenceMatrix.tsx`)

**Changes Required:**

Add "Consecutive" to the `matrixViews` array:

```typescript
const matrixViews: Array<{
  id: PreferenceView;
  label: string;
  description: string;
}> = [
  // ... existing views
  {
    id: 'consecutive',
    label: 'Consecutive',
    description: 'Set penalty for back-to-back classes (doubled around lunch hours).',
  },
];
```

Update the `PreferenceView` type:

```typescript
type PreferenceView = 'subjects' | 'timeslots' | 'buildings' | 'mobility' | 'consecutive';
```

Add consecutive handling to the `renderMatrix` function (similar to mobility view):

```typescript
if (activeView === 'consecutive') {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Higher values penalize consecutive timeslots more. Penalty doubles for slots around lunch (11:00-14:00).
      </p>
      {faculties.map((faculty) => (
        <div key={faculty.id} className="flex flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-100">{faculty.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={preferences.consecutive?.[faculty.id] ?? 1}
              onChange={(event) => handleConsecutiveChange(faculty.id, Number(event.target.value))}
              className="h-1 w-48 accent-amber-500"
            />
            <span className="w-6 text-sm font-semibold text-amber-200 text-right">
              {preferences.consecutive?.[faculty.id] ?? 1}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Add `handleConsecutiveChange` callback:

```typescript
const handleConsecutiveChange = useCallback(
  (facultyId: string, value: number) => {
    const updatedPreferences: Preferences = {
      ...preferences,
      consecutive: {
        ...(preferences.consecutive ?? {}),
        [facultyId]: value,
      },
    };
    updatePreferences(updatedPreferences);
    schedulePersist();
  },
  [preferences, schedulePersist, updatePreferences],
);
```

Update `handleFillNeutral` to handle consecutive view:

```typescript
if (activeView === 'consecutive') {
  const nextConsecutive: Record<string, number> = {};
  faculties.forEach((faculty) => {
    nextConsecutive[faculty.id] = 1; // Default value
  });
  const updatedPreferences: Preferences = {
    ...preferences,
    consecutive: nextConsecutive,
  };
  updatePreferences(updatedPreferences);
}
```

### 4. Optimizer Algorithm (`frontend/src/engine/optimizer.ts`)

**Changes Required:**

#### 4.1 Add Consecutive Penalty Calculation Function

Create a new function to calculate consecutive penalties:

```typescript
const calculateConsecutivePenalty = (
  facultyId: string,
  newTimeslotId: string,
  currentAssignments: ScheduleEntry[],
  timeslotIndexMap: Map<string, number>,
  timeslots: ConfigData['timeslots'],
  consecutiveValue: number,
): number => {
  if (consecutiveValue === 0) {
    return 0; // No penalty if consecutive value is 0
  }

  // Get all current assignments for this faculty in chronological order
  const facultyAssignments = currentAssignments
    .filter((entry) => entry.facultyId === facultyId)
    .map((entry) => ({
      timeslotId: entry.timeslotId,
      timeslotIndex: timeslotIndexMap.get(entry.timeslotId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.timeslotIndex - b.timeslotIndex);

  // Insert the new assignment in chronological order
  const newTimeslotIndex = timeslotIndexMap.get(newTimeslotId) ?? Number.MAX_SAFE_INTEGER;
  const allAssignments = [...facultyAssignments, { timeslotId: newTimeslotId, timeslotIndex: newTimeslotIndex }]
    .sort((a, b) => a.timeslotIndex - b.timeslotIndex);

  // Count consecutive pairs
  let consecutiveCount = 0;
  
  for (let i = 1; i < allAssignments.length; i++) {
    const prevIndex = allAssignments[i - 1].timeslotIndex;
    const currentIndex = allAssignments[i].timeslotIndex;

    // Check if timeslots are consecutive (adjacent indices)
    if (currentIndex === prevIndex + 1) {
      const prevTimeslot = timeslots[prevIndex];
      const currentTimeslot = timeslots[currentIndex];
      
      // Check if this consecutive pair spans lunch hour
      const isLunchPair = isLunchHourPair(prevTimeslot, currentTimeslot);
      
      // Add 1 for regular consecutive, 2 for lunch-spanning consecutive
      consecutiveCount += isLunchPair ? 2 : 1;
    }
  }

  // Apply penalty: -1 * consecutiveValue for each consecutive occurrence
  return -1 * consecutiveValue * consecutiveCount;
};

const isLunchHourPair = (
  prevTimeslot: ConfigData['timeslots'][number],
  currentTimeslot: ConfigData['timeslots'][number],
): boolean => {
  // Parse time strings (format: "HH:MM")
  const prevEnd = parseTimeToMinutes(prevTimeslot.end);
  const currentStart = parseTimeToMinutes(currentTimeslot.start);
  
  // Lunch hour definition: one slot ends between 11:00-13:00 and next starts between 11:00-14:00
  const lunchEndStart = 11 * 60; // 11:00 in minutes
  const lunchEndEnd = 13 * 60; // 13:00 in minutes
  const lunchStartEnd = 14 * 60; // 14:00 in minutes
  
  return (
    prevEnd >= lunchEndStart &&
    prevEnd <= lunchEndEnd &&
    currentStart >= lunchEndStart &&
    currentStart <= lunchStartEnd
  );
};

const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};
```

#### 4.2 Update DEFAULT_WEIGHTS

```typescript
const DEFAULT_WEIGHTS: Settings['weights'] = {
  preference: 1,
  mobility: 1,
  seniority: 1,
  consecutive: 1, // NEW
};
```

#### 4.3 Update buildCandidateList Function

Add consecutive penalty calculation to the candidate scoring:

```typescript
const buildCandidateList = (sectionId: string): FacultyCandidate[] => {
  // ... existing code ...
  
  // Calculate consecutive score
  let consecutiveScore = 0;
  if (section.timeslotId) {
    const consecutiveValue = preferences.consecutive?.[faculty.id] ?? 1;
    if (consecutiveValue > 0) {
      consecutiveScore = calculateConsecutivePenalty(
        faculty.id,
        section.timeslotId,
        result,
        timeslotIndexMap,
        config.timeslots,
        consecutiveValue
      );
    }
  }
  const consecutiveComponent = consecutiveScore * weights.consecutive;
  
  // Update total score calculation
  const totalScore = preferenceComponent + mobilityComponent + seniorityComponent + consecutiveComponent + capacityPenalty;
  
  return {
    facultyId: faculty.id,
    score: totalScore,
    preferenceScore: combinedPreference,
    seniorityScore: seniority,
    mobilityScore: mobilityScore,
    consecutiveScore: consecutiveScore, // NEW
    capacityPenalty,
    load,
    capacity,
    tieBreaker,
  } satisfies FacultyCandidate;
};
```

#### 4.4 Update FacultyCandidate Interface

```typescript
interface FacultyCandidate {
  facultyId: string;
  score: number;
  preferenceScore: number;
  seniorityScore: number;
  mobilityScore: number;
  consecutiveScore: number; // NEW
  capacityPenalty: number;
  load: number;
  capacity: number;
  tieBreaker: number;
}
```

#### 4.5 Update Schedule Entry Creation

Include consecutive score in the score breakdown:

```typescript
const scheduleEntry: ScheduleEntry = {
  sectionId: section.id,
  facultyId: selectedCandidate.facultyId,
  timeslotId: resolvedTimeslotId,
  roomId: section.roomId,
  locked: false,
  scoreBreakdown: {
    preference: selectedCandidate.preferenceScore,
    mobility: selectedCandidate.mobilityScore,
    seniority: selectedCandidate.seniorityScore,
    consecutive: selectedCandidate.consecutiveScore, // NEW
    capacityPenalty,
    total: totalScore,
  },
};
```

#### 4.6 Update Locked Entry Score Calculation

Add consecutive score calculation for locked entries:

```typescript
// Calculate consecutive score
let consecutiveScore = 0;
if (resolvedTimeslotId) {
  const consecutiveValue = preferences.consecutive?.[faculty.id] ?? 1;
  if (consecutiveValue > 0) {
    consecutiveScore = calculateConsecutivePenalty(
      faculty.id,
      resolvedTimeslotId,
      sanitizedLockedEntries,
      timeslotIndexMap,
      config.timeslots,
      consecutiveValue
    );
  }
}

// Update total score calculation
const consecutiveComponent = consecutiveScore * weights.consecutive;
const totalScore = preferenceComponent + mobilityComponent + seniorityComponent + consecutiveComponent + capacityPenalty;

const sanitizedEntry: ScheduleEntry = {
  ...entry,
  timeslotId: resolvedTimeslotId,
  roomId: resolvedRoomId,
  scoreBreakdown: {
    preference: combinedPreference,
    mobility: mobilityScore,
    seniority: seniority,
    consecutive: consecutiveScore, // NEW
    capacityPenalty,
    total: totalScore,
  },
};
```

### 5. Settings Panel (`frontend/src/components/settings/SettingsPanel.tsx`)

**Changes Required:**

Update the algorithm weights display to include consecutive weight:

```typescript
<p className="text-sm text-slate-400">
  Current mobility weight: {settings.weights.mobility.toFixed(2)}, preference weight:{' '}
  {settings.weights.preference.toFixed(2)}, seniority weight: {settings.weights.seniority.toFixed(2)}, 
  consecutive weight: {settings.weights.consecutive.toFixed(2)}
</p>
```

## Data Models

### Preferences Data Structure

```typescript
{
  facultySubject: { [facultyId]: { [subjectId]: PreferenceLevel } },
  facultyTimeslot: { [facultyId]: { [timeslotId]: PreferenceLevel } },
  facultyBuilding: { [facultyId]: { [buildingId]: PreferenceLevel } },
  mobility: { [facultyId]: number }, // 0-5 range
  consecutive: { [facultyId]: number }, // 0-3 range, default 1
}
```

### Score Breakdown Data Structure

```typescript
{
  preference: number,
  mobility: number,
  seniority: number,
  consecutive: number, // NEW
  capacityPenalty: number,
  total: number
}
```

### Settings Data Structure

```typescript
{
  weights: {
    mobility: number,
    seniority: number,
    preference: number,
    consecutive: number, // NEW: default 1.0
  },
  theme: 'light' | 'dark',
  optimizerSeed?: number
}
```

## Error Handling

### Input Validation

1. **Range Validation**: Consecutive penalty values must be between 0 and 3 (inclusive)
   - Handled by HTML5 range input constraints (`min={0} max={3} step={1}`)
   - Type system ensures numeric values

2. **Missing Data Handling**: 
   - If `preferences.consecutive[facultyId]` is undefined, default to 1
   - If `settings.weights.consecutive` is undefined, default to 1.0
   - Use optional chaining and nullish coalescing: `preferences.consecutive?.[faculty.id] ?? 1`

3. **Invalid Timeslot Data**:
   - If timeslot parsing fails, treat as non-lunch-hour pair
   - Gracefully handle missing timeslot data in calculations

### Edge Cases

1. **No Consecutive Timeslots**: Return penalty of 0
2. **Single Assignment**: No consecutive pairs possible, return 0
3. **Consecutive Value of 0**: Skip penalty calculation entirely
4. **Missing Timeslot Information**: Cannot determine consecutiveness, return 0

## Testing Strategy

### Unit Tests

1. **Consecutive Penalty Calculation**:
   - Test with no consecutive timeslots (expect 0)
   - Test with one consecutive pair (expect -1 * value)
   - Test with multiple consecutive pairs
   - Test lunch hour detection (expect doubled penalty)
   - Test with consecutive value of 0 (expect 0)

2. **Time Parsing**:
   - Test `parseTimeToMinutes` with various time formats
   - Test `isLunchHourPair` with various timeslot combinations

3. **UI Component**:
   - Test consecutive view renders correctly
   - Test slider updates preferences
   - Test default value of 1 is displayed
   - Test fill neutral sets all values to 1

### Integration Tests

1. **Optimizer Integration**:
   - Test that consecutive penalties affect faculty selection
   - Test that lunch hour pairs receive doubled penalties
   - Test that consecutive weight multiplier is applied correctly
   - Test score breakdown includes consecutive score

2. **Data Persistence**:
   - Test consecutive preferences are saved to IndexedDB
   - Test consecutive preferences are loaded on app startup
   - Test consecutive weight is persisted in settings

### Manual Testing Scenarios

1. Set consecutive penalty to 3 for a faculty member, run optimizer, verify they receive fewer consecutive assignments
2. Create a schedule with lunch-hour consecutive slots, verify penalty is doubled in score breakdown
3. Set consecutive penalty to 0, verify no penalty is applied
4. Test that consecutive weight slider in settings affects optimization results
5. Export and import data, verify consecutive preferences are preserved

## Implementation Notes

### Design Decisions

1. **Default Value of 1**: Unlike mobility (default 0), consecutive defaults to 1 to encourage the optimizer to avoid consecutive assignments by default
2. **Range 0-3**: Matches the preference level range for consistency, though semantically different
3. **Lunch Hour Definition**: 11:00-14:00 window chosen to cover typical lunch periods
4. **Doubled Penalty**: Lunch hour consecutive pairs are particularly undesirable, so penalty is doubled
5. **UI Color**: Using amber accent (vs emerald for mobility) to visually distinguish the penalty type

### Performance Considerations

1. **Caching**: Timeslot index map is already cached in optimizer
2. **Complexity**: Consecutive calculation is O(n) where n is number of faculty assignments (typically small)
3. **Early Exit**: Skip calculation entirely when consecutive value is 0

### Future Enhancements

1. **Configurable Lunch Hours**: Allow users to define custom lunch hour windows
2. **Triple Consecutive**: Additional penalty for 3+ consecutive classes
3. **Day Boundaries**: Option to not penalize consecutive slots across different days
4. **Visual Indicators**: Highlight consecutive assignments in schedule grid UI
