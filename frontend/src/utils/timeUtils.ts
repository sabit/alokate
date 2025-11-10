/**
 * Converts 12-hour time format to 24-hour format
 * @param time12 - Time string in 12-hour format (e.g., "2:40 PM", "8:00 AM")
 * @returns Time string in 24-hour format (e.g., "14:40", "08:00")
 * @throws Error if the time format is invalid
 */
export function parseTime12to24(time12: string): string {
  const trimmed = time12.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  
  if (!match) {
    throw new Error(`Invalid time format: "${time12}". Expected format: "H:MM AM/PM"`);
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  // Validate hours and minutes
  if (hours < 1 || hours > 12) {
    throw new Error(`Invalid hours: ${hours}. Hours must be between 1 and 12`);
  }
  
  const minutesNum = parseInt(minutes, 10);
  if (minutesNum < 0 || minutesNum > 59) {
    throw new Error(`Invalid minutes: ${minutes}. Minutes must be between 00 and 59`);
  }
  
  // Convert to 24-hour format
  if (period === 'AM') {
    // 12:00 AM is 00:00 (midnight)
    if (hours === 12) {
      hours = 0;
    }
  } else {
    // 12:00 PM stays as 12:00 (noon)
    // 1:00 PM becomes 13:00, etc.
    if (hours !== 12) {
      hours += 12;
    }
  }
  
  // Format with leading zero for hours
  const hoursStr = hours.toString().padStart(2, '0');
  
  return `${hoursStr}:${minutes}`;
}

/**
 * Calculates the end time by adding duration to a start time
 * @param startTime - Start time in 24-hour format (e.g., "08:00", "14:40")
 * @param durationMinutes - Duration to add in minutes
 * @returns End time in 24-hour format (e.g., "09:30", "16:10")
 * @throws Error if the start time format is invalid
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const match = startTime.match(/^(\d{2}):(\d{2})$/);
  
  if (!match) {
    throw new Error(`Invalid time format: "${startTime}". Expected format: "HH:MM"`);
  }
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  // Validate hours and minutes
  if (hours < 0 || hours > 23) {
    throw new Error(`Invalid hours: ${hours}. Hours must be between 00 and 23`);
  }
  
  if (minutes < 0 || minutes > 59) {
    throw new Error(`Invalid minutes: ${minutes}. Minutes must be between 00 and 59`);
  }
  
  // Convert to total minutes
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  
  // Calculate new hours and minutes (handle day overflow)
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  // Format with leading zeros
  const hoursStr = newHours.toString().padStart(2, '0');
  const minutesStr = newMinutes.toString().padStart(2, '0');
  
  return `${hoursStr}:${minutesStr}`;
}
