export const formatTimeslot = (label: string, start?: string, end?: string) =>
  start && end ? `${label} (${start} - ${end})` : label;

export const formatFacultyName = (name: string) => name;
