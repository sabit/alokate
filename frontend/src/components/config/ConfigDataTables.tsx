import { useState } from 'react';
import type { ConfigData } from '../../types';

interface ConfigDataTablesProps {
  config: ConfigData;
}

export const ConfigDataTables = ({ config }: ConfigDataTablesProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Max Sections
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Max Overload
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Can Overload
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.faculty.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.id}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.name}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.maxSections}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{faculty.maxOverload}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">
                        {faculty.canOverload ? 'Yes' : 'No'}
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
                      ID
                    </th>
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
                    <tr key={subject.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-sm text-slate-300">{subject.id}</td>
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
                      ID
                    </th>
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
                  {config.timeslots.map((timeslot) => (
                    <tr key={timeslot.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-sm text-slate-300">{timeslot.id}</td>
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
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Label
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {config.buildings.map((building) => (
                    <tr key={building.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-sm text-slate-300">{building.id}</td>
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
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Label
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
                      <tr key={room.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-sm text-slate-300">{room.id}</td>
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
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      Subject
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
                      <tr key={section.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-sm text-slate-300">{section.id}</td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {subject ? `${subject.code} - ${subject.name}` : section.subjectId}
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
