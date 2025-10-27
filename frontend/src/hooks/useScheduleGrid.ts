import { useMemo } from 'react';
import { analyzeConflicts, type Conflict, type ConflictSeverity } from '../engine/conflictChecker';
import { useSchedulerStore } from '../store/schedulerStore';
import type {
    Building,
    PreferenceLevel,
    Room,
    ScheduleEntry,
    ScoreBreakdown,
    Section,
    Subject,
} from '../types';

export interface GridFaculty {
  id: string;
  name: string;
  maxSections: number;
  maxOverload: number;
  canOverload: boolean;
}

export interface GridTimeslot {
  id: string;
  label: string;
  day: string;
  start: string;
  end: string;
}

export interface GridAssignment {
  sectionId: string;
  subjectId: string;
  subjectCode?: string;
  subjectName: string;
  roomId?: string;
  roomLabel?: string;
  buildingId?: string;
  buildingLabel?: string;
  locked: boolean;
  score?: ScoreBreakdown;
}

export interface ScheduleGridCell {
  facultyId: string;
  timeslotId: string;
  preference: PreferenceLevel;
  isUnfavourable: boolean;
  assignments: GridAssignment[];
  conflictIds: string[];
  conflictSeverity: ConflictSeverity | null;
}

export interface GridRow {
  faculty: GridFaculty;
  cells: ScheduleGridCell[];
  totalAssignments: number;
}

export interface OrphanAssignment {
  entry: ScheduleEntry;
  reason: 'missing-faculty' | 'missing-timeslot' | 'missing-section';
}

export interface UnscheduledSection {
  sectionId: string;
  subjectName: string;
  subjectCode?: string;
  timeslotLabel?: string;
  roomLabel?: string;
  buildingLabel?: string;
}

export interface ScheduleGridData {
  faculties: GridFaculty[];
  timeslots: GridTimeslot[];
  rows: GridRow[];
  unscheduledSections: UnscheduledSection[];
  orphanAssignments: OrphanAssignment[];
  conflicts: Conflict[];
  conflictIndex: Record<string, Conflict>;
  summary: {
    totalAssignments: number;
    scheduledSections: number;
    totalSections: number;
    conflicts: number;
  };
}

const toPreferenceLevel = (value: number | undefined): PreferenceLevel => {
  const numeric = typeof value === 'number' ? value : 0;
  if (numeric < -3) {
    return -3;
  }
  if (numeric > 3) {
    return 3;
  }
  return numeric as PreferenceLevel;
};

export const useScheduleGrid = (): ScheduleGridData => {
  const { config, preferences, schedule } = useSchedulerStore((state) => ({
    config: state.config,
    preferences: state.preferences,
    schedule: state.schedule,
  }));

  return useMemo<ScheduleGridData>(() => {
    const faculties: GridFaculty[] = config.faculty.map((faculty) => ({
      id: faculty.id,
      name: faculty.name,
      maxSections: faculty.maxSections,
      maxOverload: faculty.maxOverload,
      canOverload: faculty.canOverload,
    }));

    const timeslots: GridTimeslot[] = config.timeslots.map((timeslot) => ({
      id: timeslot.id,
      label: timeslot.label,
      day: timeslot.day,
      start: timeslot.start,
      end: timeslot.end,
    }));

    const facultyById = new Map(faculties.map((faculty) => [faculty.id, faculty]));
    const timeslotById = new Map(timeslots.map((timeslot) => [timeslot.id, timeslot]));
    const sectionById = new Map<string, Section>(config.sections.map((section) => [section.id, section]));
    const subjectById = new Map<string, Subject>(config.subjects.map((subject) => [subject.id, subject]));
    const roomById = new Map<string, Room>(config.rooms.map((room) => [room.id, room]));
    const buildingById = new Map<string, Building>(config.buildings.map((building) => [building.id, building]));

    const cells: Record<string, Record<string, ScheduleGridCell>> = {};
    faculties.forEach((faculty) => {
      const facultyPreferences = preferences.facultyTimeslot?.[faculty.id] ?? {};
      cells[faculty.id] = {};
      timeslots.forEach((timeslot) => {
        const preferenceValue = toPreferenceLevel(facultyPreferences[timeslot.id]);
        cells[faculty.id][timeslot.id] = {
          facultyId: faculty.id,
          timeslotId: timeslot.id,
          preference: preferenceValue,
          isUnfavourable: preferenceValue < 0,
          assignments: [],
          conflictIds: [],
          conflictSeverity: null,
        };
      });
    });

    const orphanAssignments: OrphanAssignment[] = [];
    const scheduledSectionIds = new Set<string>();

    const ensureCell = (facultyId: string, timeslotId: string): ScheduleGridCell | undefined =>
      cells[facultyId]?.[timeslotId];

    const buildAssignment = (entry: ScheduleEntry): GridAssignment | null => {
      const section = sectionById.get(entry.sectionId);
      const subject = section ? subjectById.get(section.subjectId) : undefined;
      const room = entry.roomId ? roomById.get(entry.roomId) : section?.roomId ? roomById.get(section.roomId) : undefined;
      const building = room?.buildingId ? buildingById.get(room.buildingId) : undefined;

      if (!section || !subject) {
        return null;
      }

      return {
        sectionId: section.id,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        roomId: room?.id ?? section.roomId,
        roomLabel: room?.label,
        buildingId: building?.id,
        buildingLabel: building?.label,
        locked: entry.locked,
        score: entry.scoreBreakdown,
      };
    };

    schedule.forEach((entry) => {
      const faculty = facultyById.get(entry.facultyId);
      const section = sectionById.get(entry.sectionId);
      const targetTimeslotId = entry.timeslotId ?? section?.timeslotId;
      const timeslot = targetTimeslotId ? timeslotById.get(targetTimeslotId) : undefined;

      if (!faculty) {
        orphanAssignments.push({ entry, reason: 'missing-faculty' });
        return;
      }

      if (!section) {
        orphanAssignments.push({ entry, reason: 'missing-section' });
        return;
      }

      if (!timeslot) {
        orphanAssignments.push({ entry, reason: 'missing-timeslot' });
        return;
      }

      const cell = ensureCell(faculty.id, timeslot.id);
      if (!cell) {
        orphanAssignments.push({ entry, reason: 'missing-timeslot' });
        return;
      }

      const assignment = buildAssignment(entry);
      if (assignment) {
        cell.assignments.push(assignment);
        scheduledSectionIds.add(assignment.sectionId);
      }
    });

    const conflictAnalysis = analyzeConflicts(config, schedule);
    const conflictIndex = conflictAnalysis.conflicts.reduce<Record<string, Conflict>>((accumulator, conflict) => {
      accumulator[conflict.id] = conflict;
      return accumulator;
    }, {});

    Object.entries(conflictAnalysis.byCell).forEach(([facultyId, timeslotMapSummary]) => {
      Object.entries(timeslotMapSummary).forEach(([timeslotId, summary]) => {
        const cell = cells[facultyId]?.[timeslotId];
        if (cell) {
          cell.conflictIds = summary.conflictIds;
          cell.conflictSeverity = summary.severity;
        }
      });
    });

    const rows: GridRow[] = faculties.map((faculty) => {
      const facultyCells = timeslots.map((timeslot) => cells[faculty.id][timeslot.id]);
      const assignmentCount = facultyCells.reduce((total, cell) => total + cell.assignments.length, 0);
      return {
        faculty,
        cells: facultyCells,
        totalAssignments: assignmentCount,
      };
    });

    const unscheduledSections: UnscheduledSection[] = config.sections
      .filter((section) => !scheduledSectionIds.has(section.id))
      .map((section) => {
        const subject = subjectById.get(section.subjectId);
        const timeslot = section.timeslotId ? timeslotById.get(section.timeslotId) : undefined;
        const room = section.roomId ? roomById.get(section.roomId) : undefined;
        const building = room?.buildingId ? buildingById.get(room.buildingId) : undefined;

        return {
          sectionId: section.id,
          subjectName: subject?.name ?? 'Unknown subject',
          subjectCode: subject?.code,
          timeslotLabel: timeslot?.label,
          roomLabel: room?.label,
          buildingLabel: building?.label,
        };
      });

    return {
      faculties,
      timeslots,
      rows,
      unscheduledSections,
      orphanAssignments,
      conflicts: conflictAnalysis.conflicts,
      conflictIndex,
      summary: {
        totalAssignments: schedule.length,
        scheduledSections: scheduledSectionIds.size,
        totalSections: config.sections.length,
        conflicts: conflictAnalysis.conflicts.length,
      },
    };
  }, [config, preferences, schedule]);
};
