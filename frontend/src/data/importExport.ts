import type { UnifiedState } from '../types';

/**
 * Serialize UnifiedState to a JSON Blob
 * @param state The unified state to export
 * @returns Blob containing JSON data
 */
export const exportStateAsJSON = (state: UnifiedState): Blob => {
  const jsonString = JSON.stringify(state, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
};

/**
 * Trigger browser download of state as JSON file
 * @param state The unified state to download
 * @param filename Optional filename (defaults to timestamp-based name)
 */
export const downloadStateAsJSON = (state: UnifiedState, filename?: string): void => {
  const blob = exportStateAsJSON(state);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename || `alokate-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Read and parse JSON file
 * @param file The file to parse
 * @returns Parsed UnifiedState
 * @throws Error if file cannot be read or parsed
 */
export const parseStateFromFile = async (file: File): Promise<UnifiedState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        // Validate the parsed data
        if (!validateImportedState(data)) {
          reject(new Error('Invalid state structure'));
          return;
        }
        
        resolve(data);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Invalid JSON format: ' + error.message));
        } else {
          reject(error);
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validate that imported data matches UnifiedState schema
 * @param data The data to validate
 * @returns True if valid, throws Error with details if invalid
 */
export const validateImportedState = (data: unknown): data is UnifiedState => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: must be an object');
  }

  const state = data as Record<string, unknown>;

  // Check for required top-level keys
  const requiredKeys = ['config', 'preferences', 'schedule', 'snapshots', 'settings'];
  for (const key of requiredKeys) {
    if (!(key in state)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  // Validate config
  validateConfig(state.config);

  // Validate preferences
  validatePreferences(state.preferences);

  // Validate schedule
  validateSchedule(state.schedule);

  // Validate snapshots
  validateSnapshots(state.snapshots);

  // Validate settings
  validateSettings(state.settings);

  return true;
};

/**
 * Validate ConfigData structure
 */
const validateConfig = (config: unknown): void => {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: must be an object');
  }

  const cfg = config as Record<string, unknown>;
  const requiredArrays = ['faculty', 'subjects', 'sections', 'timeslots', 'rooms', 'buildings'];

  for (const key of requiredArrays) {
    if (!Array.isArray(cfg[key])) {
      throw new Error(`Invalid config: '${key}' must be an array`);
    }
  }

  // Validate faculty array
  const faculty = cfg.faculty as unknown[];
  faculty.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid faculty at index ${index}: must be an object`);
    }
    const f = item as Record<string, unknown>;
    if (typeof f.id !== 'string' || typeof f.name !== 'string' || typeof f.initial !== 'string') {
      throw new Error(`Invalid faculty at index ${index}: missing required string fields (id, name, initial)`);
    }
    if (typeof f.maxSections !== 'number' || typeof f.maxOverload !== 'number') {
      throw new Error(`Invalid faculty at index ${index}: maxSections and maxOverload must be numbers`);
    }
    if (typeof f.canOverload !== 'boolean') {
      throw new Error(`Invalid faculty at index ${index}: canOverload must be a boolean`);
    }
  });

  // Validate subjects array
  const subjects = cfg.subjects as unknown[];
  subjects.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid subject at index ${index}: must be an object`);
    }
    const s = item as Record<string, unknown>;
    if (typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.code !== 'string') {
      throw new Error(`Invalid subject at index ${index}: missing required string fields (id, name, code)`);
    }
  });

  // Validate sections array
  const sections = cfg.sections as unknown[];
  sections.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid section at index ${index}: must be an object`);
    }
    const s = item as Record<string, unknown>;
    if (typeof s.id !== 'string' || typeof s.subjectId !== 'string' || 
        typeof s.timeslotId !== 'string' || typeof s.roomId !== 'string') {
      throw new Error(`Invalid section at index ${index}: missing required string fields`);
    }
    if (typeof s.capacity !== 'number') {
      throw new Error(`Invalid section at index ${index}: capacity must be a number`);
    }
  });

  // Validate timeslots array
  const timeslots = cfg.timeslots as unknown[];
  timeslots.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid timeslot at index ${index}: must be an object`);
    }
    const t = item as Record<string, unknown>;
    if (typeof t.id !== 'string' || typeof t.label !== 'string' || 
        typeof t.day !== 'string' || typeof t.start !== 'string' || typeof t.end !== 'string') {
      throw new Error(`Invalid timeslot at index ${index}: missing required string fields`);
    }
  });

  // Validate rooms array
  const rooms = cfg.rooms as unknown[];
  rooms.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid room at index ${index}: must be an object`);
    }
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.label !== 'string' || typeof r.buildingId !== 'string') {
      throw new Error(`Invalid room at index ${index}: missing required string fields`);
    }
    if (typeof r.capacity !== 'number') {
      throw new Error(`Invalid room at index ${index}: capacity must be a number`);
    }
  });

  // Validate buildings array
  const buildings = cfg.buildings as unknown[];
  buildings.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid building at index ${index}: must be an object`);
    }
    const b = item as Record<string, unknown>;
    if (typeof b.id !== 'string' || typeof b.label !== 'string') {
      throw new Error(`Invalid building at index ${index}: missing required string fields (id, label)`);
    }
  });
};

/**
 * Validate Preferences structure
 */
const validatePreferences = (preferences: unknown): void => {
  if (!preferences || typeof preferences !== 'object') {
    throw new Error('Invalid preferences: must be an object');
  }

  const prefs = preferences as Record<string, unknown>;
  const requiredMaps = ['facultySubject', 'facultyTimeslot', 'facultyBuilding', 'mobility'];

  for (const key of requiredMaps) {
    if (!prefs[key] || typeof prefs[key] !== 'object') {
      throw new Error(`Invalid preferences: '${key}' must be an object`);
    }
  }

  // Validate that preference maps contain valid preference levels (-3 to 3)
  const validLevels = [-3, -2, -1, 0, 1, 2, 3];
  
  for (const mapKey of ['facultySubject', 'facultyTimeslot', 'facultyBuilding']) {
    const map = prefs[mapKey] as Record<string, unknown>;
    for (const [facultyId, innerMap] of Object.entries(map)) {
      if (!innerMap || typeof innerMap !== 'object') {
        throw new Error(`Invalid preferences.${mapKey}: value for '${facultyId}' must be an object`);
      }
      for (const [key, value] of Object.entries(innerMap as Record<string, unknown>)) {
        if (!validLevels.includes(value as number)) {
          throw new Error(`Invalid preferences.${mapKey}: preference level for '${facultyId}.${key}' must be between -3 and 3`);
        }
      }
    }
  }

  // Validate mobility map (values should be numbers)
  const mobility = prefs.mobility as Record<string, unknown>;
  for (const [facultyId, value] of Object.entries(mobility)) {
    if (typeof value !== 'number') {
      throw new Error(`Invalid preferences.mobility: value for '${facultyId}' must be a number`);
    }
  }
};

/**
 * Validate Schedule array
 */
const validateSchedule = (schedule: unknown): void => {
  if (!Array.isArray(schedule)) {
    throw new Error('Invalid schedule: must be an array');
  }

  schedule.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid schedule entry at index ${index}: must be an object`);
    }
    const entry = item as Record<string, unknown>;
    if (typeof entry.sectionId !== 'string' || typeof entry.facultyId !== 'string' ||
        typeof entry.timeslotId !== 'string' || typeof entry.roomId !== 'string') {
      throw new Error(`Invalid schedule entry at index ${index}: missing required string fields`);
    }
    if (typeof entry.locked !== 'boolean') {
      throw new Error(`Invalid schedule entry at index ${index}: 'locked' must be a boolean`);
    }
  });
};

/**
 * Validate Snapshots array
 */
const validateSnapshots = (snapshots: unknown): void => {
  if (!Array.isArray(snapshots)) {
    throw new Error('Invalid snapshots: must be an array');
  }

  snapshots.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid snapshot at index ${index}: must be an object`);
    }
    const snapshot = item as Record<string, unknown>;
    if (typeof snapshot.id !== 'string' || typeof snapshot.timestamp !== 'string') {
      throw new Error(`Invalid snapshot at index ${index}: missing required fields (id, timestamp)`);
    }
  });
};

/**
 * Validate Settings structure
 */
const validateSettings = (settings: unknown): void => {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings: must be an object');
  }

  const s = settings as Record<string, unknown>;
  
  if (!s.weights || typeof s.weights !== 'object') {
    throw new Error('Invalid settings: missing or invalid weights object');
  }

  const weights = s.weights as Record<string, unknown>;
  if (typeof weights.mobility !== 'number' || typeof weights.seniority !== 'number' || 
      typeof weights.preference !== 'number') {
    throw new Error('Invalid settings.weights: mobility, seniority, and preference must be numbers');
  }

  if (typeof s.theme !== 'string' || !['light', 'dark'].includes(s.theme)) {
    throw new Error('Invalid settings.theme: must be "light" or "dark"');
  }

  if (s.optimizerSeed !== undefined && typeof s.optimizerSeed !== 'number') {
    throw new Error('Invalid settings.optimizerSeed: must be a number if provided');
  }
};
