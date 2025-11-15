import type { ConfigData, ScheduleEntry } from '../types';

export type ConflictSeverity = 'info' | 'warning' | 'critical';

export interface Conflict {
  id: string;
  title: string;
  description: string;
  severity: ConflictSeverity;
  relatedFacultyIds: string[];
  relatedSectionIds: string[];
  relatedRoomIds: string[];
  relatedTimeslotIds: string[];
  affectedCells: Array<{ facultyId: string; timeslotId: string }>;
}

export interface CellConflictSummary {
  severity: ConflictSeverity;
  conflictIds: string[];
}

export interface ConflictAnalysis {
  conflicts: Conflict[];
  byCell: Record<string, Record<string, CellConflictSummary>>;
  bySection: Record<string, { severity: ConflictSeverity; conflictIds: string[] }>;
}

const severityRank: Record<ConflictSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

const higherSeverity = (current: ConflictSeverity | undefined, incoming: ConflictSeverity): ConflictSeverity => {
  if (!current) {
    return incoming;
  }
  return severityRank[incoming] > severityRank[current] ? incoming : current;
};

const dedupeStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const dedupeCells = (cells: Array<{ facultyId: string; timeslotId: string }>) => {
  const seen = new Set<string>();
  const result: Array<{ facultyId: string; timeslotId: string }> = [];
  cells.forEach((cell) => {
    const key = `${cell.facultyId}::${cell.timeslotId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cell);
    }
  });
  return result;
};

const registerCellConflict = (
  map: Record<string, Record<string, CellConflictSummary>>,
  entry: ScheduleEntry,
  severity: ConflictSeverity,
  conflictId: string,
) => {
  const { facultyId, timeslotId } = entry;
  if (!facultyId || !timeslotId) {
    return;
  }

  if (!map[facultyId]) {
    map[facultyId] = {};
  }

  const existing = map[facultyId][timeslotId];
  if (!existing) {
    map[facultyId][timeslotId] = {
      severity,
      conflictIds: [conflictId],
    };
    return;
  }

  if (!existing.conflictIds.includes(conflictId)) {
    existing.conflictIds.push(conflictId);
  }
  existing.severity = higherSeverity(existing.severity, severity);
};

const registerSectionConflict = (
  map: Record<string, { severity: ConflictSeverity; conflictIds: string[] }>,
  sectionId: string,
  severity: ConflictSeverity,
  conflictId: string,
) => {
  if (!sectionId) {
    return;
  }
  const existing = map[sectionId];
  if (!existing) {
    map[sectionId] = {
      severity,
      conflictIds: [conflictId],
    };
    return;
  }

  if (!existing.conflictIds.includes(conflictId)) {
    existing.conflictIds.push(conflictId);
  }
  existing.severity = higherSeverity(existing.severity, severity);
};

interface ConflictBuilderInput {
  id: string;
  title: string;
  description: string;
  severity: ConflictSeverity;
  entries: ScheduleEntry[];
}

const buildConflict = ({ id, title, description, severity, entries }: ConflictBuilderInput): Conflict => {
  const affectedCells = dedupeCells(entries.map((entry) => ({ facultyId: entry.facultyId, timeslotId: entry.timeslotId })));
  return {
    id,
    title,
    description,
    severity,
    relatedFacultyIds: dedupeStrings(entries.map((entry) => entry.facultyId)),
    relatedSectionIds: dedupeStrings(entries.map((entry) => entry.sectionId)),
    relatedRoomIds: dedupeStrings(entries.map((entry) => entry.roomId)),
    relatedTimeslotIds: dedupeStrings(entries.map((entry) => entry.timeslotId)),
    affectedCells,
  };
};

export const analyzeConflicts = (config: ConfigData, schedule: ScheduleEntry[]): ConflictAnalysis => {
  if (schedule.length === 0) {
    return {
      conflicts: [],
      byCell: {},
      bySection: {},
    };
  }

  const facultyMap = new Map(config.faculty.map((item) => [item.id, item]));
  const timeslotMap = new Map(config.timeslots.map((item) => [item.id, item]));
  const roomMap = new Map(config.rooms.map((item) => [item.id, item]));
  const sectionMap = new Map(config.sections.map((item) => [item.id, item]));
  const subjectMap = new Map(config.subjects.map((item) => [item.id, item]));

  const facultyTimeslotBuckets = new Map<string, ScheduleEntry[]>();
  const roomTimeslotBuckets = new Map<string, ScheduleEntry[]>();
  const sectionBuckets = new Map<string, ScheduleEntry[]>();
  const facultyAssignments = new Map<string, ScheduleEntry[]>();

  schedule.forEach((entry) => {
    const facultyTimeslotKey = `${entry.facultyId}::${entry.timeslotId}`;
    const roomTimeslotKey = `${entry.roomId}::${entry.timeslotId}`;

    if (!facultyTimeslotBuckets.has(facultyTimeslotKey)) {
      facultyTimeslotBuckets.set(facultyTimeslotKey, []);
    }
    facultyTimeslotBuckets.get(facultyTimeslotKey)!.push(entry);

    if (entry.roomId) {
      if (!roomTimeslotBuckets.has(roomTimeslotKey)) {
        roomTimeslotBuckets.set(roomTimeslotKey, []);
      }
      roomTimeslotBuckets.get(roomTimeslotKey)!.push(entry);
    }

    if (!sectionBuckets.has(entry.sectionId)) {
      sectionBuckets.set(entry.sectionId, []);
    }
    sectionBuckets.get(entry.sectionId)!.push(entry);

    if (!facultyAssignments.has(entry.facultyId)) {
      facultyAssignments.set(entry.facultyId, []);
    }
    facultyAssignments.get(entry.facultyId)!.push(entry);
  });

  const conflicts: Conflict[] = [];
  const byCell: Record<string, Record<string, CellConflictSummary>> = {};
  const bySection: Record<string, { severity: ConflictSeverity; conflictIds: string[] }> = {};

  const registerConflict = (conflict: Conflict, entries: ScheduleEntry[]) => {
    conflicts.push(conflict);
    entries.forEach((entry) => {
      registerCellConflict(byCell, entry, conflict.severity, conflict.id);
      registerSectionConflict(bySection, entry.sectionId, conflict.severity, conflict.id);
    });
  };

  facultyTimeslotBuckets.forEach((entries, key) => {
    if (entries.length <= 1) {
      return;
    }
    const [facultyId, timeslotId] = key.split('::');
    const facultyName = facultyMap.get(facultyId)?.name ?? facultyId;
    const timeslotLabel = timeslotMap.get(timeslotId)?.label ?? timeslotId;
    const description = `${facultyName} is assigned to ${entries.length} sections during ${timeslotLabel}.`;
    const conflict = buildConflict({
      id: `faculty-double:${facultyId}:${timeslotId}`,
      title: 'Faculty double-booked',
      description,
      severity: 'critical',
      entries,
    });
    registerConflict(conflict, entries);
  });

  roomTimeslotBuckets.forEach((entries, key) => {
    if (entries.length <= 1) {
      return;
    }
    const [roomId, timeslotId] = key.split('::');
    const roomLabel = roomMap.get(roomId)?.label ?? roomId;
    const timeslotLabel = timeslotMap.get(timeslotId)?.label ?? timeslotId;
    const description = `${roomLabel} hosts ${entries.length} sections during ${timeslotLabel}.`;
    const conflict = buildConflict({
      id: `room-double:${roomId}:${timeslotId}`,
      title: 'Room double-booked',
      description,
      severity: 'warning',
      entries,
    });
    registerConflict(conflict, entries);
  });

  sectionBuckets.forEach((entries, sectionId) => {
    if (entries.length <= 1) {
      return;
    }
    const section = sectionMap.get(sectionId);
    const subject = section ? subjectMap.get(section.subjectId) : undefined;
    const facultyList = entries
      .map((entry) => facultyMap.get(entry.facultyId)?.name ?? entry.facultyId)
      .join(', ');
    const description = `${subject?.code ?? sectionId} is assigned to multiple faculty: ${facultyList}.`;
    const conflict = buildConflict({
      id: `section-multiple:${sectionId}`,
      title: 'Section assigned multiple times',
      description,
      severity: 'critical',
      entries,
    });
    registerConflict(conflict, entries);
  });

  facultyAssignments.forEach((entries, facultyId) => {
    const faculty = facultyMap.get(facultyId);
    if (!faculty) {
      return;
    }
    const hardLimit = faculty.maxSections + (faculty.canOverload ? faculty.maxOverload : 0);
    const preferredLimit = faculty.maxSections;
    
    if (entries.length > hardLimit) {
      const conflict = buildConflict({
        id: `faculty-load:${facultyId}:critical`,
        title: 'Faculty overload (limit exceeded)',
        description: `${faculty.name} has ${entries.length} sections, exceeding the allowed maximum of ${hardLimit}.`,
        severity: 'critical',
        entries,
      });
      registerConflict(conflict, entries);
      return;
    }
    
    // Only show warning if faculty cannot overload and exceeds preferred limit
    if (entries.length > preferredLimit && !faculty.canOverload) {
      // Faculty cannot overload - any excess is a warning
      const conflict = buildConflict({
        id: `faculty-load:${facultyId}:warning`,
        title: 'Faculty over preferred limit',
        description: `${faculty.name} has ${entries.length} sections, above the preferred limit of ${preferredLimit}.`,
        severity: 'warning',
        entries,
      });
      registerConflict(conflict, entries);
    }
    // If faculty can overload and is within hardLimit, no warning is shown
  });

  conflicts.sort((a, b) => {
    const severityDifference = severityRank[b.severity] - severityRank[a.severity];
    if (severityDifference !== 0) {
      return severityDifference;
    }
    return a.title.localeCompare(b.title);
  });

  return {
    conflicts,
    byCell,
    bySection,
  };
};

export const findConflicts = (config: ConfigData, schedule: ScheduleEntry[]): Conflict[] =>
  analyzeConflicts(config, schedule).conflicts;
