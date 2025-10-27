import type { ConfigData, Preferences, ScheduleEntry, Settings } from '../types';
import { normalizeSeed } from './seed';

interface OptimizerOptions {
  seed: number;
  weights?: Settings['weights'];
}

interface FacultyCandidate {
  facultyId: string;
  score: number;
  preferenceScore: number;
  load: number;
  capacity: number;
  tieBreaker: number;
}

const DEFAULT_WEIGHTS: Settings['weights'] = {
  preference: 1,
  mobility: 1,
  seniority: 1,
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

const cloneScheduleEntry = (entry: ScheduleEntry): ScheduleEntry => ({
  ...entry,
  scoreBreakdown: entry.scoreBreakdown ? { ...entry.scoreBreakdown } : undefined,
});

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

  const assignedSections = new Set<string>();
  const facultyLoad = new Map<string, number>();

  const sanitizedLockedEntries: ScheduleEntry[] = [];
  currentSchedule.forEach((entry) => {
    const section = sectionById.get(entry.sectionId);
    const faculty = facultyById.get(entry.facultyId);
    if (!section || !faculty) {
      return;
    }

    // ensure timeslot/room fall back to section defaults if omitted
    const resolvedTimeslotId = entry.timeslotId ?? section.timeslotId;
    const resolvedRoomId = entry.roomId ?? section.roomId;
    const sanitizedEntry: ScheduleEntry = cloneScheduleEntry({
      ...entry,
      timeslotId: resolvedTimeslotId,
      roomId: resolvedRoomId,
    });

    const isLocked = Boolean(entry.locked);
    if (isLocked) {
      sanitizedLockedEntries.push(sanitizedEntry);
      assignedSections.add(section.id);
      facultyLoad.set(faculty.id, (facultyLoad.get(faculty.id) ?? 0) + 1);
    }
  });

  const buildCandidateList = (sectionId: string): FacultyCandidate[] => {
    const section = sectionById.get(sectionId);
    if (!section) {
      return [];
    }

    const room = section.roomId ? roomById.get(section.roomId) : undefined;
    const buildingId = room?.buildingId;

    return config.faculty.map((faculty) => {
      const load = facultyLoad.get(faculty.id) ?? 0;
      const capacity = getFacultyCapacity(faculty);
      const subjectPreference = preferences.facultySubject?.[faculty.id]?.[section.subjectId] ?? 0;
      const timeslotPreference = section.timeslotId
        ? preferences.facultyTimeslot?.[faculty.id]?.[section.timeslotId] ?? 0
        : 0;
      const buildingPreference = buildingId
        ? preferences.facultyBuilding?.[faculty.id]?.[buildingId] ?? 0
        : 0;

      const combinedPreference = subjectPreference + timeslotPreference + buildingPreference;

      const remainingCapacity = capacity - load;
      // discourage exceeding capacity but allow if necessary
      const capacityAdjustment = capacity === 0
        ? remainingCapacity > 0
          ? 0
          : -5
        : remainingCapacity >= 0
          ? remainingCapacity / Math.max(1, capacity)
          : remainingCapacity - 1;

      const preferenceComponent = combinedPreference * weights.preference;
      const loadComponent = capacityAdjustment;
      const tieBreaker = hashValue(`${seed}:${faculty.id}:${section.id}`);

      return {
        facultyId: faculty.id,
        score: preferenceComponent + loadComponent,
        preferenceScore: combinedPreference,
        load,
        capacity,
        tieBreaker,
      } satisfies FacultyCandidate;
    });
  };

  const pickTimeslot = (sectionId: string, facultyId: string): string | undefined => {
    const section = sectionById.get(sectionId);
    if (!section) {
      return undefined;
    }
    if (section.timeslotId) {
      return section.timeslotId;
    }
    if (timeslotIds.length === 0) {
      return undefined;
    }

    const facultyTimeslotPrefs = preferences.facultyTimeslot?.[facultyId] ?? {};
    let bestTimeslotId = timeslotIds[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    timeslotIds.forEach((candidateTimeslotId) => {
      const score = facultyTimeslotPrefs?.[candidateTimeslotId] ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestTimeslotId = candidateTimeslotId;
      }
    });
    return bestTimeslotId;
  };

  const result: ScheduleEntry[] = [...sanitizedLockedEntries];

  config.sections.forEach((section) => {
    if (assignedSections.has(section.id)) {
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
      return;
    }

    const resolvedTimeslotId = pickTimeslot(section.id, bestCandidate.facultyId);
    if (!resolvedTimeslotId) {
      return;
    }

    const scheduleEntry: ScheduleEntry = {
      sectionId: section.id,
      facultyId: bestCandidate.facultyId,
      timeslotId: resolvedTimeslotId,
      roomId: section.roomId,
      locked: false,
      scoreBreakdown: {
        preference: bestCandidate.preferenceScore,
        mobility: 0,
        seniority: 0,
        total: bestCandidate.preferenceScore * weights.preference,
      },
    };

    result.push(scheduleEntry);
    assignedSections.add(section.id);
    facultyLoad.set(bestCandidate.facultyId, (facultyLoad.get(bestCandidate.facultyId) ?? 0) + 1);
  });

  return result;
};
