export const formatTimeslot = (label: string, start?: string, end?: string) =>
  start && end ? `${label} (${start} - ${end})` : label;

export const formatFacultyName = (name: string) => name;

/**
 * Get initials from a full name
 * @param name - Full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD")
 */
export const getInitials = (name: string): string => {
  if (!name || name.trim().length === 0) {
    return '';
  }
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single name: return first two characters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple names: return first letter of first and last name
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];
  
  return (firstInitial + lastInitial).toUpperCase();
};
