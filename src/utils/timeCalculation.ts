/**
 * Duration-Based End Time & Date Calculation Utilities for Mandhragiri Jothidam
 * Timezone: Asia/Kolkata
 *
 * Implements proper duration-based date and time calculation:
 * - Calculates end time using start date/time + duration in hours/minutes.
 * - Automatically increments the calendar date when duration crosses midnight.
 * - Displays a clear Next Day indicator whenever the end date differs from start date.
 * - Never determines whether an end time is earlier by comparing AM/PM clock values alone.
 * - Validates that the complete end date/time is strictly later than start date/time.
 * - Supports durations greater than 24 hours without losing day offset.
 */

export interface CalculatedTimings {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  startDateKey: string;
  endDateKey: string;
  startDateTime: Date;
  endDateTime: Date;
  startDateTimeISO: string;
  endDateTimeISO: string;
  startMinutes: number;
  endMinutes: number; // total elapsed minutes from start day midnight: startMins + duration
  startTime24: string;
  endTime24: string;
  startTime12: string;
  endTime12: string;
  durationMinutes: number;
  durationHours: number;
  daysOffset: number; // 0 for Same Day, 1 for Next Day, 2 for +2 Days, etc.
  crossesMidnight: boolean;
  dayLabel: string; // "(Same Day)" | "(Next Day)" | "(+N Days)"
  dayLabelTamil: string; // "(அதே நாள்)" | "(அடுத்த நாள்)" | "(+N நாட்கள்)"
  nextDayBadge: string; // "" | "Next Day" | "+N Days"
  nextDayBadgeTamil: string; // "" | "அடுத்த நாள்" | "+N நாட்கள்"
  endTimeDisplay: string; // "5:00 PM (Same Day)" | "12:00 AM (Next Day)"
  endTimeDisplayTamil: string; // "5:00 PM (அதே நாள்)" | "12:00 AM (அடுத்த நாள்)"
  timeSlot: string;
  isEndAfterStart: boolean;
}

/**
 * Format a Date object to local YYYY-MM-DD string avoiding UTC timezone skew.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses either YYYY-MM-DD or DD-MM-YYYY into local year, month (1-based), day.
 */
export function parseLocalDateParts(dateStr?: string): { year: number; month: number; day: number } {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  const trimmed = dateStr.trim();
  // YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10),
    };
  }
  // DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    return {
      year: parseInt(dmyMatch[3], 10),
      month: parseInt(dmyMatch[2], 10),
      day: parseInt(dmyMatch[1], 10),
    };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * Parse time string (e.g. "07:00 AM", "7:00 AM", "17:00") into minutes since 00:00 (0 - 1439).
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

/**
 * Convert minutes from 00:00 to 12-hour format string (e.g. "07:00 AM" or "7:00 AM").
 */
export function minutesTo12(totalMinutes: number, padHours = true): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  let h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = padHours ? String(h).padStart(2, '0') : String(h);
  return `${hStr}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Convert minutes from 00:00 to 24-hour format string (e.g. "07:00:00").
 */
export function minutesTo24(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Format Date to 12-hour string (e.g. "05:00 PM" or "5:00 PM").
 */
export function formatTime12(date: Date, padHours = false): string {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = padHours ? String(h).padStart(2, '0') : String(h);
  return `${hStr}:${m} ${ampm}`;
}

/**
 * Format Date to 24-hour string (e.g. "17:00:00").
 */
export function formatTime24(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

/**
 * Validate that complete end date/time is strictly later than start date/time.
 * Never compares AM/PM clock values alone.
 */
export function validateBookingDateTimeRange(
  startDateTime: Date,
  endDateTime: Date
): { isValid: boolean; error?: string } {
  if (!(startDateTime instanceof Date) || isNaN(startDateTime.getTime())) {
    return { isValid: false, error: 'Invalid start date and time.' };
  }
  if (!(endDateTime instanceof Date) || isNaN(endDateTime.getTime())) {
    return { isValid: false, error: 'Invalid end date and time.' };
  }
  if (endDateTime.getTime() <= startDateTime.getTime()) {
    return {
      isValid: false,
      error: 'End date and time must be strictly later than start date and time.',
    };
  }
  return { isValid: true };
}

/**
 * Calculate full duration-based booking timings.
 *
 * @param startTimeStr - Start time string (e.g. "07:00 AM", "7:00 AM")
 * @param durationMinutesInput - Duration in minutes (e.g. 600 for 10 hrs, 1020 for 17 hrs, etc.)
 * @param startDateStr - Optional start date string ("YYYY-MM-DD" or "DD-MM-YYYY"). Defaults to today.
 */
export function calculateBookingTimings(
  startTimeStr: string,
  durationMinutesInput: number,
  startDateStr?: string
): CalculatedTimings {
  const startMins = parseTimeToMinutes(startTimeStr);
  if (startMins === null) {
    throw new Error('Invalid start time format. Use HH:mm AM/PM (e.g. 07:00 AM).');
  }

  const duration = parseInt(String(durationMinutesInput), 10);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Duration must be a positive number of minutes.');
  }

  // Construct precise start Date object in local time
  const { year, month, day } = parseLocalDateParts(startDateStr);
  const startHours = Math.floor(startMins / 60);
  const startMinutesRemainder = startMins % 60;
  const startDateTime = new Date(year, month - 1, day, startHours, startMinutesRemainder, 0, 0);

  // Compute end Date object by adding exact duration milliseconds
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

  // Calculate midnight boundaries in local calendar to determine exact day offset
  const startMidnight = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
  const endMidnight = new Date(
    endDateTime.getFullYear(),
    endDateTime.getMonth(),
    endDateTime.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
  const daysOffset = Math.round((endMidnight - startMidnight) / 86400000);
  const crossesMidnight = daysOffset > 0;

  const startDateKey = formatLocalDate(startDateTime);
  const endDateKey = formatLocalDate(endDateTime);

  // Formatted 12-hour strings (both standard and padded)
  const startTime12 = minutesTo12(startMins, true);
  const endTime12 = minutesTo12(endDateTime.getHours() * 60 + endDateTime.getMinutes(), true);

  const startTime24 = formatTime24(startDateTime);
  const endTime24 = formatTime24(endDateTime);

  // Day offset labels
  let dayLabel = '(Same Day)';
  let dayLabelTamil = '(அதே நாள்)';
  let nextDayBadge = '';
  let nextDayBadgeTamil = '';

  if (daysOffset === 1) {
    dayLabel = '(Next Day)';
    dayLabelTamil = '(அடுத்த நாள்)';
    nextDayBadge = 'Next Day';
    nextDayBadgeTamil = 'அடுத்த நாள்';
  } else if (daysOffset > 1) {
    dayLabel = `(+${daysOffset} Days)`;
    dayLabelTamil = `(+${daysOffset} நாட்கள்)`;
    nextDayBadge = `+${daysOffset} Days`;
    nextDayBadgeTamil = `+${daysOffset} நாட்கள்`;
  }

  const endTimeDisplay = `${endTime12} ${dayLabel}`;
  const endTimeDisplayTamil = `${endTime12} ${dayLabelTamil}`;

  const timeSlot = crossesMidnight
    ? `${startTime12} - ${endTime12} ${dayLabel}`
    : `${startTime12} - ${endTime12}`;

  // Complete date-time validation
  const validation = validateBookingDateTimeRange(startDateTime, endDateTime);

  return {
    startDate: startDateKey,
    endDate: endDateKey,
    startDateKey,
    endDateKey,
    startDateTime,
    endDateTime,
    startDateTimeISO: startDateTime.toISOString(),
    endDateTimeISO: endDateTime.toISOString(),
    startMinutes: startMins,
    endMinutes: startMins + duration,
    startTime24,
    endTime24,
    startTime12,
    endTime12,
    durationMinutes: duration,
    durationHours: Math.round((duration / 60) * 10) / 10,
    daysOffset,
    crossesMidnight,
    dayLabel,
    dayLabelTamil,
    nextDayBadge,
    nextDayBadgeTamil,
    endTimeDisplay,
    endTimeDisplayTamil,
    timeSlot,
    isEndAfterStart: validation.isValid,
  };
}
