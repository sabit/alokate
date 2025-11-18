import type { ConfigData, Preferences, ScheduleEntry, Settings } from '../types';
import { normalizeSeed } from './seed';

interface OptimizerProgress {
  totalSections: number;
  processedSections: number;
  assignedSections: number;
  skippedSections: number;
  currentPhase: 'initialization' | 'analysis' | 'assignment' | 'complete';
}

type ProgressCallback = (progress: OptimizerProgress) => void;

interface OptimizerOptions {
  seed: number;
  weights?: Settings['weights'];
  onProgress?: ProgressCallback;
}

interface FacultyCandidate {
  facultyId: string;
  score: number;
  preferenceScore: number;
  seniorityScore: number;
  mobilityScore: number;
  consecutiveScore: number;
  capacityPenalty: number;
  load: number;
  capacity: number;
  tieBreaker: number;
}

class ConflictTracker {
  private facultyTimeslots: Map<string, Set<string>>;

  constructor() {
    this.facultyTimeslots = new Map();
  }

  hasConflict(facultyId: string, timeslotId: string): boolean {
    const timeslots = this.facultyTimeslots.get(facultyId);
    return timeslots ? timeslots.has(timeslotId) : false;
  }

  addAssignment(facultyId: string, timeslotId: string): void {
    if (!this.facultyTimeslots.has(facultyId)) {
      this.facultyTimeslots.set(facultyId, new Set());
    }
    this.facultyTimeslots.get(facultyId)!.add(timeslotId);
  }
}

const DEFAULT_WEIGHTS: Settings['weights'] = {
  preference: 1,
  mobility: 1,
  seniority: 1,
  consecutive: 1,
};

/**
 * Parse time string in "HH:MM" format to minutes since midnight
 */
const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Detect if consecutive timeslots span lunch hours (11:00-14:00)
 */
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

const hashValue = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

const getFacultyCapacity = (faculty: ConfigData['faculty'][number]) => {
  const base = faculty.maxSections ?? 0;
  const overload = faculty.canOverload ? faculty.maxOverload ?? 0 : 0;
  return Math.max(0, base + overload);
};

const calculateCapacityPenalty = (
  currentLoad: number,
  maxSections: number,
  maxOverload: number,
  canOverload: boolean,
): number => {
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

  // Escalating penalty based on overload degree (starts at -50 for first overload)
  return -50 * overloadAmount;
};

const calculateSeniority = (facultyIndex: number, totalFaculty: number): number => {
  return totalFaculty - facultyIndex;
};

interface FacultyAssignment {
  timeslotId: string;
  buildingId: string | undefined;
}

const getFacultyChronologicalAssignments = (
  facultyId: string,
  currentAssignments: ScheduleEntry[],
  timeslotIndexMap: Map<string, number>,
  roomById: Map<string, ConfigData['rooms'][number]>,
): FacultyAssignment[] => {
  // Collect all assignments for this faculty
  const facultyAssignments = currentAssignments.filter(
    (entry) => entry.facultyId === facultyId
  );

  // Sort by timeslot chronologically and extract building IDs
  const sortedAssignments = facultyAssignments
    .map((entry) => {
      const room = entry.roomId ? roomById.get(entry.roomId) : undefined;
      return {
        timeslotId: entry.timeslotId,
        buildingId: room?.buildingId,
        timeslotIndex: timeslotIndexMap.get(entry.timeslotId) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.timeslotIndex - b.timeslotIndex)
    .map(({ timeslotId, buildingId }) => ({ timeslotId, buildingId }));

  return sortedAssignments;
};

const calculateBuildingTransitionPenalty = (
  facultyId: string,
  newTimeslotId: string,
  newBuildingId: string | undefined,
  currentAssignments: ScheduleEntry[],
  timeslotIndexMap: Map<string, number>,
  roomById: Map<string, ConfigData['rooms'][number]>,
  mobilityValue: number,
): number => {
  // Get all current assignments for this faculty in chronological order
  const assignments = getFacultyChronologicalAssignments(
    facultyId,
    currentAssignments,
    timeslotIndexMap,
    roomById
  );

  // Insert the new assignment in chronological order
  const allAssignments = [...assignments, { timeslotId: newTimeslotId, buildingId: newBuildingId }]
    .map((assignment) => ({
      ...assignment,
      timeslotIndex: timeslotIndexMap.get(assignment.timeslotId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.timeslotIndex - b.timeslotIndex);

  // Count building transitions
  let transitionCount = 0;
  for (let i = 1; i < allAssignments.length; i++) {
    const prevBuilding = allAssignments[i - 1].buildingId;
    const currentBuilding = allAssignments[i].buildingId;

    // Only count as transition if both buildings are defined and different
    if (prevBuilding && currentBuilding && prevBuilding !== currentBuilding) {
      transitionCount++;
    }
  }

  // Apply penalty: -1 * mobilityValue for each transition
  // Higher mobility value = higher penalty (less mobile faculty)
  return -1 * mobilityValue * transitionCount;
};

/**
 * Calculate consecutive penalty for faculty assignments
 */
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

  // Create a map of timeslot ID to timeslot data for quick lookup
  const timeslotById = new Map(timeslots.map((ts) => [ts.id, ts]));
  
  // Build a map of timeslot ID to its index within its day (sorted by time)
  // Group timeslots by day
  const timeslotsByDay = new Map<string, Array<{ id: string; start: string }>>();
  timeslots.forEach((ts) => {
    if (!timeslotsByDay.has(ts.day)) {
      timeslotsByDay.set(ts.day, []);
    }
    timeslotsByDay.get(ts.day)!.push({ id: ts.id, start: ts.start });
  });
  
  // Sort each day's timeslots by start time and assign indices
  const timeslotDayIndex = new Map<string, number>();
  timeslotsByDay.forEach((dayTimeslots, day) => {
    dayTimeslots.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
    dayTimeslots.forEach((ts, index) => {
      timeslotDayIndex.set(ts.id, index);
    });
  });

  // Get all current assignments for this faculty
  const facultyAssignments = currentAssignments
    .filter((entry) => entry.facultyId === facultyId)
    .map((entry) => ({
      timeslotId: entry.timeslotId,
      timeslot: timeslotById.get(entry.timeslotId),
      dayIndex: timeslotDayIndex.get(entry.timeslotId) ?? -1,
    }))
    .filter((entry) => entry.timeslot !== undefined && entry.dayIndex !== -1);

  // Add the new assignment
  const newTimeslot = timeslotById.get(newTimeslotId);
  const newDayIndex = timeslotDayIndex.get(newTimeslotId) ?? -1;
  if (!newTimeslot || newDayIndex === -1) {
    return 0; // Invalid timeslot ID
  }
  
  const allAssignments = [
    ...facultyAssignments, 
    { timeslotId: newTimeslotId, timeslot: newTimeslot, dayIndex: newDayIndex }
  ];

  // Sort by day and day index
  const dayOrder: Record<string, number> = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7,
  };
  
  allAssignments.sort((a, b) => {
    const dayA = dayOrder[a.timeslot!.day] ?? 999;
    const dayB = dayOrder[b.timeslot!.day] ?? 999;
    
    if (dayA !== dayB) {
      return dayA - dayB;
    }
    
    // Same day - sort by day index
    return a.dayIndex - b.dayIndex;
  });

  // Count consecutive pairs
  let consecutiveCount = 0;
  
  for (let i = 1; i < allAssignments.length; i++) {
    const prevTimeslot = allAssignments[i - 1].timeslot!;
    const currentTimeslot = allAssignments[i].timeslot!;
    const prevDayIndex = allAssignments[i - 1].dayIndex;
    const currentDayIndex = allAssignments[i].dayIndex;

    // Check if timeslots are consecutive (same day, adjacent indices)
    if (prevTimeslot.day === currentTimeslot.day && currentDayIndex === prevDayIndex + 1) {
      // Check if this consecutive pair spans lunch hour
      const isLunchPair = isLunchHourPair(prevTimeslot, currentTimeslot);
      
      // Add 1 for regular consecutive, 2 for lunch-spanning consecutive
      consecutiveCount += isLunchPair ? 2 : 1;
    }
  }

  // Apply penalty: -1 * consecutiveValue for each consecutive occurrence
  return -1 * consecutiveValue * consecutiveCount;
};

interface SectionFeasibility {
  sectionId: string;
  feasibleCount: number;
}

const analyzeSectionFeasibility = (
  sections: ConfigData['sections'],
  facultyById: Map<string, ConfigData['faculty'][number]>,
  facultyLoad: Map<string, number>,
  conflictTracker: ConflictTracker,
  assignedSections: Set<string>,
  facultyCapacityCache: Map<string, number>,
): SectionFeasibility[] => {
  return sections
    .filter((section) => !assignedSections.has(section.id))
    .map((section) => {
      let feasibleCount = 0;

      // Check each faculty member for feasibility
      for (const [facultyId, faculty] of facultyById) {
        const load = facultyLoad.get(facultyId) ?? 0;
        const capacity = facultyCapacityCache.get(facultyId) ?? 0;

        // Check capacity constraint
        const withinCapacity = load < capacity;
        const canOverload = faculty.canOverload && load < (faculty.maxSections + faculty.maxOverload);
        const capacityOk = withinCapacity || canOverload;

        if (!capacityOk) {
          continue;
        }

        // Check conflict constraint
        if (section.timeslotId) {
          // Section has fixed timeslot - check if it conflicts
          if (conflictTracker.hasConflict(facultyId, section.timeslotId)) {
            continue;
          }
        }
        // If section has no fixed timeslot, we assume at least one timeslot is available
        // (will be checked during actual assignment)

        // Faculty is feasible for this section
        feasibleCount++;
      }

      return {
        sectionId: section.id,
        feasibleCount,
      };
    });
};

export const runOptimizer = (
  config: ConfigData,
  preferences: Preferences,
  currentSchedule: ScheduleEntry[],
  options: OptimizerOptions,
): ScheduleEntry[] => {
  const seed = normalizeSeed(options?.seed);
  const weights = {
    ...DEFAULT_WEIGHTS,
    ...(options?.weights ?? {}),
  } satisfies Settings['weights'];

  const facultyById = new Map(config.faculty.map((faculty) => [faculty.id, faculty]));
  const sectionById = new Map(config.sections.map((section) => [section.id, section]));
  const roomById = new Map(config.rooms.map((room) => [room.id, room]));
  const timeslotIds = config.timeslots.map((timeslot) => timeslot.id);
  
  // Cache timeslot order for O(1) lookups (10.1)
  const timeslotIndexMap = new Map(
    timeslotIds.map((id, index) => [id, index])
  );
  
  // Cache faculty seniority values (10.2)
  const facultySeniorityCache = new Map(
    config.faculty.map((faculty, index) => [
      faculty.id,
      calculateSeniority(index, config.faculty.length)
    ])
  );
  
  // Cache faculty capacity values (10.2)
  const facultyCapacityCache = new Map(
    config.faculty.map((faculty) => [faculty.id, getFacultyCapacity(faculty)])
  );

  const assignedSections = new Set<string>();
  const facultyLoad = new Map<string, number>();
  const conflictTracker = new ConflictTracker();

  // Initialize progress tracking
  const totalSections = config.sections.length;
  const progressState: OptimizerProgress = {
    totalSections,
    processedSections: 0,
    assignedSections: 0,
    skippedSections: 0,
    currentPhase: 'initialization',
  };

  const updateProgress = (updates: Partial<OptimizerProgress>) => {
    Object.assign(progressState, updates);
    if (options.onProgress) {
      options.onProgress({ ...progressState });
    }
  };

  const sanitizedLockedEntries: ScheduleEntry[] = [];
  currentSchedule.forEach((entry) => {
    const section = sectionById.get(entry.sectionId);
    const faculty = facultyById.get(entry.facultyId);
    // Skip invalid entries without throwing errors (8.1)
    if (!section || !faculty) {
      return;
    }

    // ensure timeslot/room fall back to section defaults if omitted
    const resolvedTimeslotId = entry.timeslotId ?? section.timeslotId;
    const resolvedRoomId = entry.roomId ?? section.roomId;
    
    // Skip entries with no valid timeslot (8.1)
    if (!resolvedTimeslotId) {
      return;
    }

    const isLocked = Boolean(entry.locked);
    if (isLocked) {
      // Calculate score breakdown for locked entries
      const room = resolvedRoomId ? roomById.get(resolvedRoomId) : undefined;
      const buildingId = room?.buildingId;
      
      // Calculate preference scores (8.2: treat missing preferences as 0)
      const subjectPreference = preferences.facultySubject?.[faculty.id]?.[section.subjectId] ?? 0;
      const timeslotPreference = resolvedTimeslotId
        ? preferences.facultyTimeslot?.[faculty.id]?.[resolvedTimeslotId] ?? 0
        : 0;
      const buildingPreference = buildingId
        ? preferences.facultyBuilding?.[faculty.id]?.[buildingId] ?? 0
        : 0;
      const combinedPreference = subjectPreference + timeslotPreference + buildingPreference;
      
      // Calculate seniority (use cached value - 10.2)
      const seniority = facultySeniorityCache.get(faculty.id) ?? 0;
      
      // Calculate mobility score (8.2: treat missing mobility as 0)
      let mobilityScore = 0;
      if (resolvedTimeslotId) {
        const mobilityValue = preferences.mobility?.[faculty.id] ?? 0;
        if (mobilityValue > 0) {
          mobilityScore = calculateBuildingTransitionPenalty(
            faculty.id,
            resolvedTimeslotId,
            buildingId,
            sanitizedLockedEntries,
            timeslotIndexMap,
            roomById,
            mobilityValue
          );
        }
      }
      
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
      
      // Calculate capacity penalty
      const currentLoad = facultyLoad.get(faculty.id) ?? 0;
      const capacityPenalty = calculateCapacityPenalty(
        currentLoad,
        faculty.maxSections ?? 0,
        faculty.maxOverload ?? 0,
        faculty.canOverload
      );
      
      // Calculate total score using the formula: (preference * weight) + (mobility * weight) + (seniority * weight) + (consecutive * weight) + capacityPenalty
      const preferenceComponent = combinedPreference * weights.preference;
      const mobilityComponent = mobilityScore * weights.mobility;
      const seniorityComponent = seniority * weights.seniority;
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
          consecutive: consecutiveScore,
          capacityPenalty,
          total: totalScore,
          weighted: {
            preference: preferenceComponent,
            mobility: mobilityComponent,
            seniority: seniorityComponent,
            consecutive: consecutiveComponent,
          },
        },
      };

      sanitizedLockedEntries.push(sanitizedEntry);
      assignedSections.add(section.id);
      facultyLoad.set(faculty.id, (facultyLoad.get(faculty.id) ?? 0) + 1);
      conflictTracker.addAssignment(faculty.id, resolvedTimeslotId);
    }
  });

  // Update progress after initialization phase
  updateProgress({
    currentPhase: 'analysis',
    assignedSections: assignedSections.size,
  });

  const buildCandidateList = (sectionId: string): FacultyCandidate[] => {
    const section = sectionById.get(sectionId);
    // Handle missing section data gracefully (8.1)
    if (!section) {
      return [];
    }

    const room = section.roomId ? roomById.get(section.roomId) : undefined;
    const buildingId = room?.buildingId;

    return config.faculty.map((faculty) => {
      const load = facultyLoad.get(faculty.id) ?? 0;
      const capacity = facultyCapacityCache.get(faculty.id) ?? 0;
      // Treat missing preferences as 0 (8.2)
      const subjectPreference = preferences.facultySubject?.[faculty.id]?.[section.subjectId] ?? 0;
      const timeslotPreference = section.timeslotId
        ? preferences.facultyTimeslot?.[faculty.id]?.[section.timeslotId] ?? 0
        : 0;
      const buildingPreference = buildingId
        ? preferences.facultyBuilding?.[faculty.id]?.[buildingId] ?? 0
        : 0;

      const combinedPreference = subjectPreference + timeslotPreference + buildingPreference;

      // Calculate capacity penalty separately
      const capacityPenalty = calculateCapacityPenalty(
        load,
        faculty.maxSections ?? 0,
        faculty.maxOverload ?? 0,
        faculty.canOverload
      );

      // Calculate preference component
      const preferenceComponent = combinedPreference * weights.preference;
      
      // Calculate seniority score (use cached value - 10.2)
      const seniority = facultySeniorityCache.get(faculty.id) ?? 0;
      const seniorityComponent = seniority * weights.seniority;
      
      // Calculate mobility score (8.2: treat missing mobility as 0)
      let mobilityScore = 0;
      if (section.timeslotId) {
        const mobilityValue = preferences.mobility?.[faculty.id] ?? 0;
        if (mobilityValue > 0) {
          mobilityScore = calculateBuildingTransitionPenalty(
            faculty.id,
            section.timeslotId,
            buildingId,
            result,
            timeslotIndexMap,
            roomById,
            mobilityValue
          );
        }
      }
      const mobilityComponent = mobilityScore * weights.mobility;
      
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
      
      const tieBreaker = hashValue(`${seed}:${faculty.id}:${section.id}`);

      // Total score formula: (preference * weight) + (mobility * weight) + (seniority * weight) + (consecutive * weight) + capacityPenalty
      const totalScore = preferenceComponent + mobilityComponent + seniorityComponent + consecutiveComponent + capacityPenalty;

      return {
        facultyId: faculty.id,
        score: totalScore,
        preferenceScore: combinedPreference,
        seniorityScore: seniority,
        mobilityScore: mobilityScore,
        consecutiveScore: consecutiveScore,
        capacityPenalty,
        load,
        capacity,
        tieBreaker,
      } satisfies FacultyCandidate;
    });
  };

  const pickTimeslot = (sectionId: string, facultyId: string): string | undefined => {
    const section = sectionById.get(sectionId);
    // Handle missing section data gracefully (8.1)
    if (!section) {
      return undefined;
    }
    if (section.timeslotId) {
      // Check if the section's fixed timeslot conflicts with faculty schedule
      if (conflictTracker.hasConflict(facultyId, section.timeslotId)) {
        return undefined;
      }
      return section.timeslotId;
    }
    if (timeslotIds.length === 0) {
      return undefined;
    }

    // Filter out conflicting timeslots (8.3: handle fully occupied schedules)
    const availableTimeslots = timeslotIds.filter(
      (timeslotId) => !conflictTracker.hasConflict(facultyId, timeslotId)
    );

    // When all timeslots are occupied, return undefined (8.3)
    // This allows the algorithm to consider alternative faculty
    if (availableTimeslots.length === 0) {
      return undefined;
    }

    // Treat missing preferences as 0 (8.2)
    const facultyTimeslotPrefs = preferences.facultyTimeslot?.[facultyId] ?? {};
    let bestTimeslotId = availableTimeslots[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    availableTimeslots.forEach((candidateTimeslotId) => {
      const score = facultyTimeslotPrefs?.[candidateTimeslotId] ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestTimeslotId = candidateTimeslotId;
      }
    });
    return bestTimeslotId;
  };

  const result: ScheduleEntry[] = [...sanitizedLockedEntries];
  const skippedSections: string[] = [];

  // Analyze section feasibility and sort by difficulty
  const feasibilityAnalysis = analyzeSectionFeasibility(
    config.sections,
    facultyById,
    facultyLoad,
    conflictTracker,
    assignedSections,
    facultyCapacityCache
  );

  // Sort sections by feasible candidate count (ascending) with section ID as tiebreaker
  const sortedSectionIds = feasibilityAnalysis
    .sort((a, b) => {
      if (a.feasibleCount !== b.feasibleCount) {
        return a.feasibleCount - b.feasibleCount; // Ascending: fewer candidates = higher priority
      }
      return a.sectionId.localeCompare(b.sectionId); // Deterministic tiebreaker
    })
    .map((item) => item.sectionId);

  // Update progress after analysis phase
  updateProgress({
    currentPhase: 'assignment',
  });

  // Process sections in priority order
  sortedSectionIds.forEach((sectionId) => {
    const section = sectionById.get(sectionId);
    // Skip invalid entries without throwing errors (8.1)
    if (!section || assignedSections.has(section.id)) {
      return;
    }

    const candidates = buildCandidateList(section.id).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.load !== b.load) {
        return a.load - b.load;
      }
      if (a.capacity !== b.capacity) {
        return b.capacity - a.capacity;
      }
      return a.tieBreaker - b.tieBreaker;
    });

    const bestCandidate = candidates[0];
    if (!bestCandidate) {
      // No candidates available - skip section and continue processing (8.1)
      skippedSections.push(section.id);
      updateProgress({
        processedSections: progressState.processedSections + 1,
        skippedSections: progressState.skippedSections + 1,
      });
      return;
    }

    // Try to find a valid timeslot for the best candidate (8.3)
    let resolvedTimeslotId = pickTimeslot(section.id, bestCandidate.facultyId);
    
    // If best candidate has no available timeslots, try alternative faculty (8.3)
    if (!resolvedTimeslotId && candidates.length > 1) {
      // Iterate through remaining candidates to find one with available timeslots
      for (let i = 1; i < candidates.length; i++) {
        const alternativeCandidate = candidates[i];
        const alternativeTimeslot = pickTimeslot(section.id, alternativeCandidate.facultyId);
        if (alternativeTimeslot) {
          // Found an alternative faculty with available timeslot
          resolvedTimeslotId = alternativeTimeslot;
          // Update bestCandidate reference to use the alternative
          candidates[0] = alternativeCandidate;
          break;
        }
      }
    }
    
    if (!resolvedTimeslotId) {
      // No valid timeslot available for any candidate - skip section and continue (8.1, 8.3)
      skippedSections.push(section.id);
      updateProgress({
        processedSections: progressState.processedSections + 1,
        skippedSections: progressState.skippedSections + 1,
      });
      return;
    }

    // Use the selected candidate (may have been swapped to alternative)
    const selectedCandidate = candidates[0];
    
    // Calculate total score using the formula: (preference * weight) + (mobility * weight) + (seniority * weight) + (consecutive * weight) + capacityPenalty
    const preferenceComponent = selectedCandidate.preferenceScore * weights.preference;
    const mobilityComponent = selectedCandidate.mobilityScore * weights.mobility;
    const seniorityComponent = selectedCandidate.seniorityScore * weights.seniority;
    const consecutiveComponent = selectedCandidate.consecutiveScore * weights.consecutive;
    const capacityPenalty = selectedCandidate.capacityPenalty;
    const totalScore = preferenceComponent + mobilityComponent + seniorityComponent + consecutiveComponent + capacityPenalty;
    
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
        consecutive: selectedCandidate.consecutiveScore,
        capacityPenalty,
        total: totalScore,
        weighted: {
          preference: preferenceComponent,
          mobility: mobilityComponent,
          seniority: seniorityComponent,
          consecutive: consecutiveComponent,
        },
      },
    };

    result.push(scheduleEntry);
    assignedSections.add(section.id);
    facultyLoad.set(selectedCandidate.facultyId, (facultyLoad.get(selectedCandidate.facultyId) ?? 0) + 1);
    conflictTracker.addAssignment(selectedCandidate.facultyId, resolvedTimeslotId);

    // Update progress after each successful assignment
    updateProgress({
      processedSections: progressState.processedSections + 1,
      assignedSections: assignedSections.size,
    });
  });

  // Update progress to complete phase
  updateProgress({
    currentPhase: 'complete',
  });

  return result;
};
