import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { useSchedulerPersistence } from '../../hooks/useSchedulerPersistence';
import { useToast } from '../../hooks/useToast';
import { useSchedulerStore } from '../../store/schedulerStore';
import type { ConfigData, PreferenceLevel, Preferences } from '../../types';
import { getContrastTextColor } from '../../utils/colorUtils';
import { QuickFillTools } from './QuickFillTools';

type PreferenceView = 'subjects' | 'timeslots' | 'buildings' | 'mobility' | 'consecutive';
type MatrixView = 'subjects' | 'timeslots' | 'buildings';

const preferenceColors: Record<PreferenceLevel, string> = {
  '-3': 'bg-rose-700/80 text-rose-50',
  '-2': 'bg-rose-700/60 text-rose-50/90',
  '-1': 'bg-amber-600/50 text-amber-100',
  0: 'bg-slate-700/50 text-slate-200',
  1: 'bg-emerald-600/60 text-emerald-50',
  2: 'bg-emerald-600/70 text-emerald-50/90',
  3: 'bg-emerald-500/80 text-white',
};

const matrixViews: Array<{
  id: PreferenceView;
  label: string;
  description: string;
}> = [
  {
    id: 'subjects',
    label: 'Subjects',
    description: 'Set how strongly faculty prefer teaching each subject.',
  },
  {
    id: 'timeslots',
    label: 'Timeslots',
    description: 'Capture availability and preferences for meeting times.',
  },
  {
    id: 'buildings',
    label: 'Buildings',
    description: 'Model cross-campus mobility constraints and building affinity.',
  },
  {
    id: 'mobility',
    label: 'Mobility',
    description: 'Adjust mobility penalty weights for individual faculty.',
  },
  {
    id: 'consecutive',
    label: 'Consecutive',
    description: 'Set penalty for back-to-back classes (doubled around lunch hours).',
  },
];

const domainKeyMap = {
  subjects: 'facultySubject',
  timeslots: 'facultyTimeslot',
  buildings: 'facultyBuilding',
} as const;

const isMatrixView = (view: PreferenceView): view is MatrixView => 
  view !== 'mobility' && view !== 'consecutive';

const matrixColumnMeta: Record<MatrixView, (config: ConfigData) => Array<{ id: string; label: string }>> = {
  subjects: (config) =>
    config.subjects.map((subject) => ({
      id: subject.id,
      label: subject.code || subject.name,
    })),
  timeslots: (config) =>
    config.timeslots.map((slot) => ({
      id: slot.id,
      label: slot.label,
    })),
  buildings: (config) =>
    config.buildings.map((building) => ({
      id: building.id,
      label: building.label,
    })),
};

const sortColumns = (columns: Array<{ id: string; label: string }>): Array<{ id: string; label: string }> => {
  return [...columns].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
};

export const PreferenceMatrix = () => {
  const [activeView, setActiveView] = useState<PreferenceView>('subjects');
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const { preferences, updatePreferences } = usePreferences();
  const config = useSchedulerStore((state) => state.config);
  const { success: showSuccess, error: showError } = useToast();
  const persistSchedulerState = useSchedulerPersistence();

  const persistTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const schedulePersist = useCallback(() => {
    clearTimer();
    persistTimerRef.current = window.setTimeout(() => {
      persistSchedulerState().catch((error) => {
        console.error('Failed to persist preferences', error);
        showError('Unable to sync preferences. Changes kept locally.');
      });
    }, 500);
  }, [clearTimer, persistSchedulerState, showError]);

  const faculties = config.faculty;

  const columns = useMemo(() => {
    if (!isMatrixView(activeView)) {
      return [] as Array<{ id: string; label: string }>;
    }
    const unsortedColumns = matrixColumnMeta[activeView](config);
    return sortColumns(unsortedColumns);
  }, [activeView, config]);

  const getValue = useCallback(
    (facultyId: string, columnIdValue: string): PreferenceLevel => {
      if (!isMatrixView(activeView)) {
        return 0;
      }
      const domainKey = domainKeyMap[activeView];
        const domain = (preferences[domainKey] ?? {}) as Record<string, Record<string, PreferenceLevel>>;
      const facultyPrefs = domain[facultyId] ?? {};
      return (facultyPrefs[columnIdValue] ?? 0) as PreferenceLevel;
    },
    [activeView, preferences],
  );

  const setValue = useCallback(
    (facultyId: string, columnIdValue: string, value: PreferenceLevel) => {
      if (!isMatrixView(activeView)) {
        return;
      }
      const domainKey = domainKeyMap[activeView];
      const currentMatrix = (preferences[domainKey] ?? {}) as Record<string, Record<string, PreferenceLevel>>;
      const nextDomain: Record<string, Record<string, PreferenceLevel>> = {
        ...currentMatrix,
        [facultyId]: {
          ...(currentMatrix[facultyId] ?? {}),
          [columnIdValue]: value,
        },
      };

      const updatedPreferences: Preferences = {
        ...preferences,
        [domainKey]: nextDomain,
      };
      updatePreferences(updatedPreferences);
      schedulePersist();
    },
    [activeView, preferences, schedulePersist, updatePreferences],
  );

  const adjustCellValue = useCallback(
    (facultyId: string, columnIdValue: string, delta: 1 | -1) => {
      const current = getValue(facultyId, columnIdValue);
      const nextNumeric = Math.max(-3, Math.min(3, current + delta));
      if (nextNumeric === current) {
        return;
      }
      setValue(facultyId, columnIdValue, nextNumeric as PreferenceLevel);
    },
    [getValue, setValue],
  );

  const calculatePreferenceCounts = useCallback(
    (columnId: string): Record<PreferenceLevel, number> => {
      const counts: Record<PreferenceLevel, number> = {
        '-3': 0,
        '-2': 0,
        '-1': 0,
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
      };

      faculties.forEach((faculty) => {
        const value = getValue(faculty.id, columnId);
        counts[value]++;
      });

      return counts;
    },
    [faculties, getValue],
  );

  const handleFillNeutral = useCallback(async () => {
    clearTimer();
    if (activeView === 'mobility') {
      const nextMobility: Record<string, number> = {};
      faculties.forEach((faculty) => {
        nextMobility[faculty.id] = 0;
      });
      const updatedPreferences: Preferences = {
        ...preferences,
        mobility: nextMobility,
      };
      updatePreferences(updatedPreferences);
    } else if (activeView === 'consecutive') {
      const nextConsecutive: Record<string, number> = {};
      faculties.forEach((faculty) => {
        nextConsecutive[faculty.id] = 1;
      });
      const updatedPreferences: Preferences = {
        ...preferences,
        consecutive: nextConsecutive,
      };
      updatePreferences(updatedPreferences);
    } else {
      if (!isMatrixView(activeView)) {
        return;
      }
      const domainKey = domainKeyMap[activeView];
      const nextDomain: Record<string, Record<string, PreferenceLevel>> = {};
      faculties.forEach((faculty) => {
        const row: Record<string, PreferenceLevel> = {};
        columns.forEach((column) => {
          row[column.id] = 0;
        });
        nextDomain[faculty.id] = row;
      });
      const updatedPreferences: Preferences = {
        ...preferences,
        [domainKey]: nextDomain,
      };
      updatePreferences(updatedPreferences);
    }

    try {
      await persistSchedulerState();
      showSuccess('All preferences reset to neutral.');
    } catch (error) {
      console.error('Failed to persist neutral fill', error);
      showError('Could not sync preferences. Changes saved locally.');
    }
  }, [activeView, clearTimer, columns, faculties, persistSchedulerState, preferences, showError, showSuccess, updatePreferences]);

  const handleCopyLast = useCallback(() => {
    showError('Importing last semester data is coming soon.');
  }, [showError]);

  const handleImportCsv = useCallback(() => {
    showError('CSV import support is not yet available.');
  }, [showError]);

  const handleMobilityChange = useCallback(
    (facultyId: string, value: number) => {
      const updatedPreferences: Preferences = {
        ...preferences,
        mobility: {
          ...(preferences.mobility ?? {}),
          [facultyId]: value,
        },
      };
      updatePreferences(updatedPreferences);
      schedulePersist();
    },
    [preferences, schedulePersist, updatePreferences],
  );

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

  const renderMatrix = () => {
    if (faculties.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
          Add faculty in the configuration section to begin editing preferences.
        </div>
      );
    }

    if (activeView === 'mobility') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Higher values penalise cross-building moves less.</p>
          {faculties.map((faculty) => (
            <div
              key={faculty.id}
              className="flex flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-100">{faculty.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={preferences.mobility?.[faculty.id] ?? 0}
                  onChange={(event) => handleMobilityChange(faculty.id, Number(event.target.value))}
                  className="h-1 w-48 accent-emerald-500"
                />
                <span className="w-6 text-sm font-semibold text-emerald-200 text-right">
                  {preferences.mobility?.[faculty.id] ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeView === 'consecutive') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Higher values penalize consecutive timeslots more. Penalty doubles for slots around lunch (11:00-14:00).
          </p>
          {faculties.map((faculty) => (
            <div
              key={faculty.id}
              className="flex flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
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

    if (columns.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
          Add {activeView} in the configuration section to begin editing preferences.
        </div>
      );
    }

    return (
      <div className="max-h-[600px] overflow-auto rounded-lg border border-white/5">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th scope="col" className="sticky left-0 top-0 z-30 bg-slate-900 px-4 py-3 font-semibold text-slate-300">
                Faculty
              </th>
              {columns.map((column) => {
                // Apply subject colors when in subjects view
                const subject = activeView === 'subjects' 
                  ? config.subjects.find(s => s.id === column.id)
                  : null;
                const backgroundColor = subject?.color || '#0f172a'; // fallback to slate-900
                const textColor = subject?.color ? getContrastTextColor(backgroundColor) : undefined;
                
                // Split timeslot labels into day and time for better readability
                const labelParts = activeView === 'timeslots' && column.label.includes(' ') 
                  ? column.label.split(' ', 2) 
                  : null;
                
                return (
                <th
                  key={column.id}
                  scope="col"
                  className="relative sticky top-0 z-20 px-4 py-3 font-semibold min-w-20"
                  style={subject?.color ? { backgroundColor, color: textColor } : { backgroundColor: '#0f172a' }}
                  onMouseEnter={() => setHoveredColumn(column.id)}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  {labelParts ? (
                    <div className="flex flex-col items-center">
                      <div>{labelParts[0]}</div>
                      <div className="text-xs font-normal">{labelParts[1]}</div>
                    </div>
                  ) : (
                    column.label
                  )}
                  {hoveredColumn === column.id && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 p-3 text-xs shadow-xl">
                      <div className="space-y-1">
                        {([3, 2, 1, 0, -1, -2, -3] as PreferenceLevel[]).map((level) => {
                          const count = calculatePreferenceCounts(column.id)[level];
                          const colorClass = level === 3 ? 'bg-emerald-400' :
                                           level === 2 ? 'bg-emerald-500' :
                                           level === 1 ? 'bg-emerald-700' :
                                           level === 0 ? 'bg-slate-600' :
                                           level === -1 ? 'bg-amber-600' :
                                           level === -2 ? 'bg-rose-500' :
                                           'bg-rose-600';
                          return (
                            <div key={level} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${colorClass}`} />
                                <span className="font-medium">{level > 0 ? `+${level}` : level}</span>
                              </div>
                              <span className="text-slate-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {faculties.map((faculty) => (
              <tr key={faculty.id} className="bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-slate-950 px-4 py-3 text-left text-sm font-medium text-slate-100"
                >
                  <div>{faculty.name}</div>
                  <div className="text-xs text-slate-500">Max sections {faculty.maxSections}</div>
                </th>
                {columns.map((column) => {
                  const columnIdentifier = column.id;
                  const value = getValue(faculty.id, columnIdentifier);
                  return (
                    <td key={columnIdentifier} className="px-4 py-2 min-w-20">
                      <button
                        type="button"
                        className={clsx(
                          'w-full rounded-md border border-white/5 px-2 py-1 text-sm font-semibold transition hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400',
                          preferenceColors[value],
                        )}
                        onClick={() => adjustCellValue(faculty.id, columnIdentifier, 1)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          adjustCellValue(faculty.id, columnIdentifier, -1);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            adjustCellValue(faculty.id, columnIdentifier, 1);
                          } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
                            event.preventDefault();
                            adjustCellValue(faculty.id, columnIdentifier, -1);
                          }
                        }}
                      >
                        {value > 0 ? `+${value}` : value}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5 rounded-xl border border-white/5 bg-slate-950/40 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Preference workspace</h3>
          <p className="text-sm text-slate-400">
            {matrixViews.find((view) => view.id === activeView)?.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
            {matrixViews.map((view) => (
              <button
                key={view.id}
                type="button"
                className={clsx(
                  'px-3 py-2 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
                  activeView === view.id
                    ? 'bg-brand-500 text-white shadow-inner shadow-brand-400/40'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/80',
                )}
                onClick={() => setActiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
          <QuickFillTools
            onFillNeutral={handleFillNeutral}
            onCopyLast={handleCopyLast}
            onImportCsv={handleImportCsv}
            disabled={faculties.length === 0}
          />
        </div>
      </div>
      {renderMatrix()}
    </div>
  );
};
