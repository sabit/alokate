import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { useSchedulerPersistence } from '../../hooks/useSchedulerPersistence';
import { useToast } from '../../hooks/useToast';
import { useSchedulerStore } from '../../store/schedulerStore';
import type { ConfigData, PreferenceLevel, Preferences } from '../../types';
import { QuickFillTools } from './QuickFillTools';

type PreferenceView = 'subjects' | 'timeslots' | 'buildings' | 'mobility';
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
];

const domainKeyMap = {
  subjects: 'facultySubject',
  timeslots: 'facultyTimeslot',
  buildings: 'facultyBuilding',
} as const;

const isMatrixView = (view: PreferenceView): view is MatrixView => view !== 'mobility';

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

export const PreferenceMatrix = () => {
  const [activeView, setActiveView] = useState<PreferenceView>('subjects');
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
    return matrixColumnMeta[activeView](config);
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
          {faculties.map((faculty) => (
            <div
              key={faculty.id}
              className="flex flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-100">{faculty.name}</p>
                <p className="text-xs text-slate-400">Higher values penalise cross-building moves less.</p>
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

    if (columns.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
          Add {activeView} in the configuration section to begin editing preferences.
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead>
            <tr className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <th scope="col" className="sticky left-0 z-10 bg-slate-900/80 px-4 py-3 font-semibold text-slate-300">
                Faculty
              </th>
              {columns.map((column) => (
                <th key={column.id} scope="col" className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {faculties.map((faculty) => (
              <tr key={faculty.id} className="bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-slate-950/60 px-4 py-3 text-left text-sm font-medium text-slate-100"
                >
                  <div>{faculty.name}</div>
                  <div className="text-xs text-slate-500">Max sections {faculty.maxSections}</div>
                </th>
                {columns.map((column) => {
                  const columnIdentifier = column.id;
                  const value = getValue(faculty.id, columnIdentifier);
                  return (
                    <td key={columnIdentifier} className="px-4 py-2">
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
