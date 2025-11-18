export interface Faculty {
  id: string;
  name: string;
  initial: string;
  maxSections: number;
  maxOverload: number;
  canOverload: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Section {
  id: string;
  subjectId: string;
  timeslotId: string;
  roomId: string;
  capacity: number;
  courseShortcode: string;
  sectionIdentifier: string;
}

export interface Timeslot {
  id: string;
  label: string;
  day: string;
  start: string;
  end: string;
}

export interface Room {
  id: string;
  label: string;
  buildingId: string;
  capacity: number;
}

export interface Building {
  id: string;
  label: string;
}

export interface ConfigData {
  faculty: Faculty[];
  subjects: Subject[];
  sections: Section[];
  timeslots: Timeslot[];
  rooms: Room[];
  buildings: Building[];
}

export type PreferenceLevel = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface Preferences {
  facultySubject: Record<string, Record<string, PreferenceLevel>>;
  facultyTimeslot: Record<string, Record<string, PreferenceLevel>>;
  facultyBuilding: Record<string, Record<string, PreferenceLevel>>;
  mobility: Record<string, number>;
  consecutive: Record<string, number>;
}

export interface ScoreBreakdown {
  preference: number;
  mobility: number;
  seniority: number;
  capacityPenalty: number;
  consecutive: number;
  total: number;
  // Weighted contributions (raw score × weight)
  weighted?: {
    preference: number;
    mobility: number;
    seniority: number;
    consecutive: number;
  };
}

export interface ScheduleEntry {
  sectionId: string;
  facultyId: string;
  timeslotId: string;
  roomId: string;
  locked: boolean;
  scoreBreakdown?: ScoreBreakdown;
}

export interface Settings {
  weights: {
    mobility: number;
    seniority: number;
    preference: number;
    consecutive: number;
  };
  theme: 'light' | 'dark';
  optimizerSeed?: number;
}

export interface SnapshotData {
  config: ConfigData;
  preferences: Preferences;
  schedule: ScheduleEntry[];
  settings: Settings;
}

export interface Snapshot {
  id: string;
  snapshotName?: string;
  timestamp: string;
  hash?: string;
  data?: SnapshotData;
}

export interface UnifiedState {
  config: ConfigData;
  preferences: Preferences;
  schedule: ScheduleEntry[];
  snapshots: Snapshot[];
  settings: Settings;
}

// CSV Import Types

export interface ParsedFacultyRow {
  name: string;
  initial: string;
}

export interface ParsedRoomRow {
  slNo: string;
  course: string;
  capacity: number;
  registration: number;
  section: string;
  courseShortcode: string;
  sectionIdentifier: string;
  slotDay: string;
  slotTime: string;
  room: string;
}

export interface CSVParseError {
  message: string;
  row?: number;
  field?: string;
}
