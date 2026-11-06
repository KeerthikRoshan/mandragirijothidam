/**
 * Time calculation utilities for Event / Pooja bookings
 * Timezone: Asia/Kolkata
 */

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const s = String(timeStr).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function minutesTo12(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  let h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function minutesTo24(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export interface CalculatedTimings {
  startMinutes: number;
  endMinutes: number;
  startTime24: string;
  endTime24: string;
  startTime12: string;
  endTime12: string;
  timeSlot: string;
  durationMinutes: number;
  crossesMidnight: boolean;
}

export function calculateBookingTimings(
  startTimeStr: string,
  durationMinutesInput: number
): CalculatedTimings {
  const startMins = parseTimeToMinutes(startTimeStr);
  if (startMins === null) {
    throw new Error('Invalid start time format. Use HH:mm AM/PM (e.g. 09:00 AM).');
  }

  const duration = parseInt(String(durationMinutesInput), 10);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Duration must be a positive number of minutes.');
  }

  const endMins = startMins + duration;
  const crossesMidnight = endMins >= 1440;

  const startTime24 = minutesTo24(startMins);
  const endTime24 = minutesTo24(endMins);
  const startTime12 = minutesTo12(startMins);
  const endTime12 = minutesTo12(endMins);
  const timeSlot = `${startTime12} - ${endTime12}`;

  return {
    startMinutes: startMins,
    endMinutes: endMins,
    startTime24,
    endTime24,
    startTime12,
    endTime12,
    timeSlot,
    durationMinutes: duration,
    crossesMidnight,
  };
}
