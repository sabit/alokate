import type { GridTimeslot } from '../../../hooks/useScheduleGrid';

interface TimeslotHeaderProps {
  timeslot: GridTimeslot;
}

export const TimeslotHeader = ({ timeslot }: TimeslotHeaderProps) => {
  // Format: "Sunday 08:00–09:30" becomes two lines
  const timeRange = timeslot.start && timeslot.end ? `${timeslot.start}–${timeslot.end}` : '';
  
  return (
    <th className="sticky top-0 z-10 min-w-[120px] bg-slate-950 px-3 py-3 text-center">
      <div className="text-xs font-semibold text-slate-200">{timeslot.day}</div>
      <div className="text-[10px] font-medium text-slate-400">{timeRange || timeslot.label}</div>
    </th>
  );
};
