import { useMemo, useState } from 'react';
import { useSchedulerStore } from '../../store/schedulerStore';
import type { ConfigData, Faculty } from '../../types';

interface ConfigDataTablesProps {
  config: ConfigData;
}

export const ConfigDataTables = ({ config }: ConfigDataTablesProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const updateConfig = useSchedulerStore((state) => state.updateConfig);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  const isEmpty =
    config.faculty.length === 0 &&
    config.subjects.length === 0 &&
    config.sections.length === 0 &&
    config.timeslots.length === 0 &&
    config.rooms.length === 0 &&
    config.buildings.length === 0;

  // Sort timeslots by label
  const sortedTimeslots = useMemo(
    () => [...config.timeslots].sort((a, b) => a.label.localeCompare(b.label)),
    [config.timeslots],
  );

  // Computed states for select all toggle
  const allCanOverload = useMemo(
    () => config.faculty.length > 0 && config.faculty.every((f) => f.canOverload),
    [config.faculty],
  );

  const noneCanOverload = useMemo(
    () => config.faculty.length > 0 && config.faculty.every((f) => !f.canOverload),
    [config.faculty],
  );

  const isIndeterminate = useMemo(
    () => !allCanOverload && !noneCanOverload && config.faculty.length > 0,
    [allCanOverload, noneCanOverload, config.faculty.length],
  );

  const updateFaculty = (facultyId: string, updates: Partial<Faculty>) => {
    const updatedFaculty = config.faculty.map((f) =>
      f.id === facultyId ? { ...f, ...updates } : f,
    );
    updateConfig({ ...config, faculty: updatedFaculty });
  };

  const handleToggleAllCanOverload = () => {
    // If all are checked or indeterminate, uncheck all
    // If all are unchecked, check all
    const newValue = noneCanOverload;

    const updatedFaculty = config.faculty.map((f) => ({
      ...f,
      canOverload: newValue,
    }));

    updateConfig({ ...config, faculty: updatedFaculty });
  };

  if (isEmpty) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Faculty */}
      {config.faculty.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('faculty')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Faculty ({config.faculty.length})</h4>
            <span className="text-slate-400">{isExpanded('faculty') ? '−' : '+'}</span>
          </button>
          {isExpanded('faculty') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Initial
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Max Sections
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Max Overload
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allCanOverload}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isIndeterminate;
                            }
                          }}
                          onChange={handleToggleAllCanOverload}
                          disabled={config.faculty.length === 0}
                          className="h-4 w-4 rounded border-white/10 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                          aria-label="Toggle all faculty overload capability"
                        />
                        <span>Can Overload</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.faculty.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-white/5" data-id={faculty.id}>
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.name}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.initial}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={faculty.maxSections}
                          onChange={(e) =>
                            updateFaculty(faculty.id, {
                              maxSections: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-20 rounded border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={faculty.maxOverload}
                          onChange={(e) =>
                            updateFaculty(faculty.id, {
                              maxOverload: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-20 rounded border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={faculty.canOverload}
                          onChange={(e) =>
                            updateFaculty(faculty.id, { canOverload: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-white/10 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subjects */}
      {config.subjects.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('subjects')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Subjects ({config.subjects.length})</h4>
            <span className="text-slate-400">{isExpanded('subjects') ? '−' : '+'}</span>
          </button>
          {isExpanded('subjects') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-white/5" data-id={subject.id}>
                      <td className="px-4 py-2 text-sm text-slate-300">{subject.code}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{subject.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timeslots */}
      {config.timeslots.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('timeslots')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Timeslots ({config.timeslots.length})</h4>
            <span className="text-slate-400">{isExpanded('timeslots') ? '−' : '+'}</span>
          </button>
          {isExpanded('timeslots') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Label
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Day
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      End
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedTimeslots.map((timeslot) => (
                    <tr key={timeslot.id} className="hover:bg-white/5" data-id={timeslot.id}>
                      <td className="px-4 py-2 text-sm text-slate-300">{timeslot.label}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{timeslot.day}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{timeslot.start}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{timeslot.end}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Buildings */}
      {config.buildings.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('buildings')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Buildings ({config.buildings.length})</h4>
            <span className="text-slate-400">{isExpanded('buildings') ? '−' : '+'}</span>
          </button>
          {isExpanded('buildings') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.buildings.map((building) => (
                    <tr key={building.id} className="hover:bg-white/5" data-id={building.id}>
                      <td className="px-4 py-2 text-sm text-slate-300">{building.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rooms */}
      {config.rooms.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('rooms')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Rooms ({config.rooms.length})</h4>
            <span className="text-slate-400">{isExpanded('rooms') ? '−' : '+'}</span>
          </button>
          {isExpanded('rooms') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Room
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Building
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Capacity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.rooms.map((room) => {
                    const building = config.buildings.find((b) => b.id === room.buildingId);
                    return (
                      <tr key={room.id} className="hover:bg-white/5" data-id={room.id}>
                        <td className="px-4 py-2 text-sm text-slate-300">{room.label}</td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {building?.label || room.buildingId}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">{room.capacity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      {config.sections.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-slate-950/60">
          <button
            onClick={() => toggleSection('sections')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
          >
            <h4 className="font-semibold">Sections ({config.sections.length})</h4>
            <span className="text-slate-400">{isExpanded('sections') ? '−' : '+'}</span>
          </button>
          {isExpanded('sections') && (
            <div className="overflow-x-auto border-t border-white/5">
              <table className="w-full">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Subject
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Course Shortcode
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Section ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Timeslot
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Room
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Capacity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.sections.map((section) => {
                    const subject = config.subjects.find((s) => s.id === section.subjectId);
                    const timeslot = config.timeslots.find((t) => t.id === section.timeslotId);
                    const room = config.rooms.find((r) => r.id === section.roomId);
                    return (
                      <tr key={section.id} className="hover:bg-white/5" data-id={section.id}>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {subject ? `${subject.code} - ${subject.name}` : section.subjectId}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {section.courseShortcode}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {section.sectionIdentifier}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {timeslot?.label || section.timeslotId}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {room?.label || section.roomId}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">{section.capacity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
