import type { GridTimeslot } from '../../../hooks/useScheduleGrid';

interface TimeslotHeaderProps {
  timeslot: GridTimeslot;
}

export const TimeslotHeader = ({ timeslot }: TimeslotHeaderProps) => {
  return (
    <th className="sticky top-0 z-10 min-w-[180px] bg-slate-950 px-3 py-3 text-left">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">{timeslot.label}</div>
    </th>
  );
};
