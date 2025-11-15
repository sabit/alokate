# Design Document

## Overview

This design document outlines improvements to the schedule optimizer algorithm. The current implementation uses a greedy assignment approach that processes sections sequentially and assigns the best-scoring faculty member to each section. The improvements will add conflict detection, implement mobility and seniority scoring, improve section prioritization, and enhance the overall quality and transparency of generated schedules.

The design maintains backward compatibility with the existing optimizer interface while extending its capabilities through enhanced scoring, conflict checking, and intelligent section ordering.

## Architecture

### High-Level Flow

```
Input: ConfigData, Preferences, CurrentSchedule, OptimizerOptions
  ↓
1. Initialize State
   - Preserve locked entries
   - Build lookup maps
   - Initialize faculty load tracking
  ↓
2. Analyze Sections
   - Calculate feasibility scores
   - Sort by difficulty (fewest candidates first)
  ↓
3. Assign Sections (in priority order)
   For each section:
   - Build candidate list with enhanced scoring
   - Check for conflicts
   - Select best candidate
   - Update state
  ↓
4. Return Schedule with Score Breakdown
```

### Key Design Principles

1. **Incremental Enhancement**: Build on existing algorithm rather than complete rewrite
2. **Deterministic Behavior**: Same inputs and seed produce identical outputs
3. **Conflict-Free Guarantee**: No faculty member assigned to overlapping timeslots
4. **Transparency**: Detailed score breakdowns for all assignments
5. **Performance**: Efficient data structures for O(1) conflict lookups

## Components and Interfaces

### 1. Enhanced Optimizer Function

The main `runOptimizer` function signature remains unchanged for backward compatibility:

```typescript
export const runOptimizer = (
  config: ConfigData,
  preferences: Preferences,
  currentSchedule: ScheduleEntry[],
  options: OptimizerOptions,
): ScheduleEntry[]
```

### 2. Conflict Detection System

**Purpose**: Track faculty timeslot assignments and detect overlapping schedules

**Data Structure**:
```typescript
interface ConflictTracker {
  // Map: facultyId -> Set of assigned timeslot IDs
  facultyTimeslots: Map<string, Set<string>>;
  
  // Check if assignment would create conflict
  hasConflict(facultyId: string, timeslotId: string): boolean;
  
  // Add assignment to tracker
  addAssignment(facultyId: string, timeslotId: string): void;
}
```

**Implementation Details**:
- Use `Map<string, Set<string>>` for O(1) conflict checking
- Initialize with locked entries during setup phase
- Check conflicts before finalizing any assignment
- Timeslot conflicts are based on exact timeslot ID matches (sections with same timeslot ID overlap)

### 3. Enhanced Candidate Scoring

**Current Scoring Components**:
- Preference (subject + timeslot + building)
- Capacity adjustment

**New Scoring Components**:
- Mobility penalty
- Seniority bonus
- Load balance adjustment

**Updated Score Calculation**:
```typescript
interface EnhancedFacultyCandidate extends FacultyCandidate {
  mobilityScore: number;
  seniorityScore: number;
  capacityPenalty: number;
  loadBalanceBonus: number;
}

// Total score formula:
score = (preferenceScore * weights.preference) 
      + (mobilityScore * weights.mobility)
      + (seniorityScore * weights.seniority)
      + loadBalanceBonus
      + capacityPenalty
```

**Tie-Breaking with Seed**:
When multiple candidates have identical scores, the optimizer uses the seed value to deterministically select one candidate. This ensures:
- Same seed + same inputs = identical schedule
- Different seeds = different valid schedules
- Enables generation of multiple solution attempts for comparison

### 4. Mobility Scoring

**Purpose**: Penalize assignments that require faculty to move between distant buildings

**Algorithm**:
1. Get all current assignments for faculty (including locked entries)
2. Sort assignments by timeslot chronologically
3. For each consecutive pair of assignments in different buildings:
   - Calculate mobility penalty = -1 * (mobilityValue from preferences)
   - Higher mobility values (less mobile) = higher penalty
   - Lower mobility values (more mobile) = lower penalty
4. Apply penalty only if new assignment creates building transition

**Data Requirements**:
- Use `mobility` values from `Preferences` interface (already exists)
- Mobility values range from 0 (very mobile, no penalty) to higher values (less mobile, high penalty)

**Edge Cases**:
- If faculty has no mobility value, treat as 0 (no penalty)
- If section has no room/building, skip mobility calculation
- First assignment of the day has no mobility penalty
- Only penalize when consecutive timeslots are in different buildings

### 5. Seniority Scoring

**Purpose**: Give priority to senior faculty for preferred assignments

**Algorithm**:
1. Calculate seniority based on faculty position in configuration array
2. Seniority = (totalFaculty - facultyIndex) to give higher scores to earlier entries
3. Apply as additive bonus: `seniorityScore = seniority * weights.seniority`
4. Higher seniority (earlier in list) = higher score = higher priority

**Data Requirements**:
- Use faculty array index from `ConfigData.faculty`
- First faculty in array has highest seniority
- Last faculty in array has lowest seniority (seniority = 1)

**Edge Cases**:
- If seniority weight is 0, skip calculation
- Single faculty member gets seniority = 1

### 6. Section Prioritization

**Purpose**: Assign difficult sections first to avoid dead-ends

**Algorithm**:
```typescript
interface SectionPriority {
  sectionId: string;
  feasibleCandidates: number;
  priority: number; // lower = higher priority
}

function calculateSectionPriorities(
  sections: Section[],
  facultyById: Map<string, Faculty>,
  conflictTracker: ConflictTracker,
  facultyLoad: Map<string, number>
): SectionPriority[]
```

**Feasibility Criteria**:
A faculty member is feasible for a section if:
1. Assignment would not create a timeslot conflict
2. Faculty is within capacity OR overload is allowed
3. Faculty exists in configuration

**Sorting**:
- Primary: Feasible candidates (ascending - fewer candidates = higher priority)
- Secondary: Section ID (for deterministic ordering)

### 7. Load Balancing System

**Purpose**: Distribute workload evenly across faculty members to prevent overloading some while underutilizing others

**Algorithm**:
1. Track current load for each faculty member (number of assigned sections)
2. When scoring candidates with equal preference/mobility/seniority scores, apply load balance bonus
3. Calculate load balance bonus: `loadBalanceBonus = (maxLoad - currentLoad) * loadBalanceWeight`
   - Faculty with lower current load receive higher bonus
   - Encourages even distribution of assignments

**Capacity Penalty Strategy**:
```typescript
function calculateCapacityPenalty(
  currentLoad: number,
  maxSections: number,
  maxOverload: number,
  canOverload: boolean
): number {
  if (currentLoad < maxSections) {
    return 0; // Within normal capacity
  }
  
  if (!canOverload) {
    return -1000; // Cannot overload - severe penalty
  }
  
  const overloadAmount = currentLoad - maxSections;
  if (overloadAmount >= maxOverload) {
    return -1000; // Exceeds overload limit - severe penalty
  }
  
  // Escalating penalty based on overload degree
  return -50 * (overloadAmount + 1);
}
```

**Design Rationale**:
- Significant penalty (-1000) prevents assignments that violate hard constraints
- Escalating penalty for overload discourages excessive loading
- Load balance bonus is additive and smaller in magnitude than capacity penalties
- This ensures capacity constraints are respected while encouraging balance

**Load Balance Metrics**:
The optimizer can optionally calculate standard deviation of faculty loads to measure schedule quality:
```typescript
function calculateLoadStandardDeviation(facultyLoads: Map<string, number>): number {
  const loads = Array.from(facultyLoads.values());
  const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
  const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
  return Math.sqrt(variance);
}
```

Lower standard deviation indicates better load balance across faculty.

### 8. Deterministic Randomization for Multiple Solutions

**Purpose**: Generate different valid schedules from the same input data to provide options

**Algorithm**:
```typescript
function seedBasedTieBreaker(
  candidates: EnhancedFacultyCandidate[],
  seed: number
): EnhancedFacultyCandidate {
  // Find all candidates with the highest score
  const maxScore = Math.max(...candidates.map(c => c.score));
  const topCandidates = candidates.filter(c => c.score === maxScore);
  
  if (topCandidates.length === 1) {
    return topCandidates[0];
  }
  
  // Use seed to deterministically select from tied candidates
  const index = Math.abs(seed) % topCandidates.length;
  return topCandidates[index];
}
```

**Design Rationale**:
- Seed value is passed through OptimizerOptions
- When scores are equal, seed determines selection
- Incrementing seed by 1 produces different but valid schedules
- Users can generate multiple attempts and compare total scores
- Each schedule is valid and respects all constraints

**Total Score Calculation**:
```typescript
function calculateTotalScheduleScore(schedule: ScheduleEntry[]): number {
  return schedule.reduce((sum, entry) => sum + entry.scoreBreakdown.total, 0);
}
```

Higher total score indicates better overall schedule quality based on preferences, mobility, seniority, and load balance.

### 9. Enhanced Score Breakdown

**Updated Interface**:
```typescript
interface ScoreBreakdown {
  preference: number;        // Existing
  mobility: number;          // New
  seniority: number;         // New
  loadBalance: number;       // New
  capacityPenalty: number;   // New (separated from total)
  total: number;             // Sum of all components
}
```

**Transparency Goals**:
- Show exact contribution of each scoring component
- Allow users to understand why assignments were made
- Enable debugging of unexpected assignments
- Support comparison of multiple solution attempts

### 10. Progress Tracking and Feedback

**Purpose**: Provide real-time feedback during optimization for large datasets

**Data Structure**:
```typescript
interface OptimizerProgress {
  totalSections: number;
  processedSections: number;
  assignedSections: number;
  skippedSections: number;
  currentPhase: 'initialization' | 'analysis' | 'assignment' | 'complete';
}

type ProgressCallback = (progress: OptimizerProgress) => void;
```

**Integration**:
```typescript
export interface OptimizerOptions {
  seed?: number;
  allowOverload?: boolean;
  weights?: {
    preference?: number;
    mobility?: number;
    seniority?: number;
    loadBalance?: number;
  };
  onProgress?: ProgressCallback; // New optional callback
}
```

**Progress Update Points**:
1. After initialization phase (locked entries processed)
2. After section analysis phase (priorities calculated)
3. During assignment loop (after each section processed)
4. Upon completion

**Design Rationale**:
- Optional callback maintains backward compatibility
- Progress updates don't block the main algorithm
- UI can display progress bar or status message
- Helps users understand processing time for large datasets
- No performance impact when callback is not provided

## Data Models

### Type Extensions

```typescript
// Faculty interface - no changes needed
// Seniority is derived from array index, not stored in data
export interface Faculty {
  id: string;
  name: string;
  initial: string;
  maxSections: number;
  maxOverload: number;
  canOverload: boolean;
}

// Preferences already has mobility, no changes needed
export interface Preferences {
  facultySubject: Record<string, Record<string, PreferenceLevel>>;
  facultyTimeslot: Record<string, Record<string, PreferenceLevel>>;
  facultyBuilding: Record<string, Record<string, PreferenceLevel>>;
  mobility: Record<string, number>;  // Existing - higher value = less mobile
}

// Update ScoreBreakdown
export interface ScoreBreakdown {
  preference: number;
  mobility: number;
  seniority: number;
  loadBalance: number;       // NEW: Load balancing bonus
  capacityPenalty: number;   // NEW: Separated from total
  total: number;
}

// Update OptimizerOptions
export interface OptimizerOptions {
  seed?: number;
  allowOverload?: boolean;
  weights?: {
    preference?: number;
    mobility?: number;
    seniority?: number;
    loadBalance?: number;    // NEW: Weight for load balancing
  };
  onProgress?: ProgressCallback; // NEW: Optional progress callback
}
```

### Internal Data Structures

```typescript
// Conflict tracking
interface FacultyScheduleMap {
  timeslots: Set<string>;
  assignments: ScheduleEntry[];
}

// Section analysis
interface SectionAnalysis {
  sectionId: string;
  feasibleCount: number;
  candidates: EnhancedFacultyCandidate[];
}

// Progress tracking
interface OptimizerProgress {
  totalSections: number;
  processedSections: number;
  assignedSections: number;
  skippedSections: number;
  currentPhase: 'initialization' | 'analysis' | 'assignment' | 'complete';
}

type ProgressCallback = (progress: OptimizerProgress) => void;

// Load tracking
interface FacultyLoadTracker {
  loads: Map<string, number>;
  maxLoad: number;
  
  getLoad(facultyId: string): number;
  incrementLoad(facultyId: string): void;
  calculateStandardDeviation(): number;
}
```

## Error Handling

### Graceful Degradation

1. **Missing Faculty/Section Data**
   - Skip invalid entries
   - Log warning
   - Continue processing

2. **No Feasible Candidates**
   - Attempt assignment with least-penalized candidate
   - If still impossible, skip section
   - Track skipped sections for reporting

3. **Invalid Preferences**
   - Treat missing preferences as 0 (neutral)
   - Validate preference levels are within range
   - Continue with valid data

4. **Timeslot Conflicts in Locked Entries**
   - Preserve locked entries as-is (user responsibility)
   - Mark conflicts in conflict tracker
   - Prevent new assignments from creating additional conflicts

### Error Reporting

```typescript
interface OptimizerResult {
  schedule: ScheduleEntry[];
  metadata: {
    totalScore: number;
    assignedCount: number;
    skippedCount: number;
    conflictsFree: boolean;
    warnings: string[];
  };
}
```

Note: For backward compatibility, the main function still returns `ScheduleEntry[]`, but we can add an optional extended result format in the future.

## Testing Strategy

### Unit Tests

1. **Conflict Detection**
   - Test conflict identification with overlapping timeslots
   - Test conflict-free assignment verification
   - Test locked entry conflict handling

2. **Scoring Components**
   - Test preference scoring (existing + verify still works)
   - Test mobility penalty calculation (higher mobility value = higher penalty)
   - Test seniority bonus calculation (earlier in array = higher bonus)
   - Test capacity penalty calculation
   - Test combined score calculation

3. **Section Prioritization**
   - Test feasibility counting
   - Test priority sorting
   - Test edge cases (no candidates, all candidates)

4. **Edge Cases**
   - Test with empty faculty list
   - Test with empty section list
   - Test with all locked entries
   - Test with no valid timeslots
   - Test with missing preference data
   - Test with missing seniority/mobility data

### Integration Tests

1. **End-to-End Scenarios**
   - Small dataset (5 faculty, 10 sections)
   - Medium dataset (20 faculty, 50 sections)
   - Large dataset (50 faculty, 100 sections)
   - All sections locked
   - No sections locked
   - Mixed locked/unlocked

2. **Determinism Tests**
   - Same seed produces identical results
   - Different seeds produce different results
   - Results are valid regardless of seed
   - Tie-breaking is deterministic with seed

3. **Quality Tests**
   - Generated schedules have no conflicts
   - Preference scores are respected
   - Load balancing is reasonable (low standard deviation)
   - Locked entries are preserved
   - Capacity constraints are respected
   - No faculty exceeds maximum overload

4. **Multiple Solution Tests**
   - Generate 5 schedules with different seeds
   - Verify all schedules are valid
   - Compare total scores across solutions
   - Verify different assignments are made

### Performance Tests

1. **Timing Benchmarks**
   - Measure execution time for various dataset sizes
   - Identify performance bottlenecks
   - Verify O(n*m) complexity (n=sections, m=faculty)

2. **Memory Usage**
   - Monitor memory allocation
   - Verify no memory leaks
   - Test with large datasets

## Implementation Notes

### Phase 1: Conflict Detection
- Add ConflictTracker class
- Integrate into existing assignment flow
- Update tests

### Phase 2: Enhanced Scoring
- Implement mobility scoring (penalty for building transitions)
- Implement seniority scoring (based on faculty array index)
- Implement load balancing (bonus for lower-loaded faculty)
- Update score breakdown
- Update ScoreBreakdown interface

### Phase 3: Section Prioritization
- Implement feasibility analysis
- Add section sorting
- Update assignment loop

### Phase 4: Deterministic Randomization
- Implement seed-based tie-breaking
- Add total score calculation
- Support multiple solution generation

### Phase 5: Progress Tracking
- Add progress callback support
- Implement progress updates at key points
- Add phase tracking

### Phase 6: Polish & Optimization
- Optimize data structures
- Add comprehensive error handling
- Performance tuning
- Calculate load balance metrics

### Backward Compatibility

- Existing function signature unchanged
- No changes to Faculty interface (seniority derived from array index)
- Graceful handling of missing mobility data
- Default weights work as before (new weights default to 0 if not specified)
- ScoreBreakdown extended with new fields (loadBalance)
- OptimizerOptions extended with optional onProgress callback
- Existing code without progress callback continues to work

### Future Enhancements (Out of Scope)

- Backtracking algorithm for global optimization
- Multi-objective optimization (Pareto frontier)
- Constraint satisfaction solver integration
- Machine learning for preference prediction
- Real-time optimization during manual editing
