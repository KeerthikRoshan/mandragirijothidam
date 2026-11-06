/**
 * Local Date Utilities for Mandhragiri Jothidam
 * Safe local calendar calculations avoiding timezone/UTC boundary bugs.
 */

export const TAMIL_WEEKDAY_ABBREVIATIONS = [
  'ஞா',   // Sun
  'திங்',  // Mon
  'செவ்', // Tue
  'புத',   // Wed
  'வியா', // Thu
  'வெள்', // Fri
  'சனி',   // Sat
] as const;

export const TAMIL_WEEKDAY_FULL = [
  'ஞாயிற்றுக்கிழமை',
  'திங்கட்கிழமை',
  'செவ்வாய்க்கிழமை',
  'புதன்கிழமை',
  'வியாழக்கிழமை',
  'வெள்ளிக்கிழமை',
  'சனிக்கிழமை',
] as const;

export const TAMIL_GREGORIAN_MONTH_NAMES = [
  'ஜனவரி',
  'பிப்ரவரி',
  'மார்ச்',
  'ஏப்ரல்',
  'மே',
  'ஜூன்',
  'ஜூலை',
  'ஆகஸ்ட்',
  'செப்டம்பர்',
  'அக்டோபர்',
  'நவம்பர்',
  'டிசம்பர்',
] as const;

export const ENGLISH_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Format a Date object to YYYY-MM-DD using local calendar year, month, date.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parse a YYYY-MM-DD string into a local Date at 00:00:00 local time.
 */
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split('-');
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

/**
 * Check if two dates represent the exact same calendar day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today in local time.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Add or subtract days from a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add or subtract months from a date.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const originalDay = date.getDate();
  const daysInNewMonth = getDaysInMonth(result.getFullYear(), result.getMonth());
  result.setDate(Math.min(originalDay, daysInNewMonth));
  return result;
}

/**
 * Returns the number of days in a given year and month (0-indexed).
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Get 7 consecutive dates representing the week containing the specified date.
 * Week starts on Sunday (index 0) or can anchor to the date.
 */
export function getWeekDates(anchorDate: Date, startOnSunday = true): Date[] {
  const currentDayOfWeek = anchorDate.getDay(); // 0 is Sun, 6 is Sat
  const offset = startOnSunday ? -currentDayOfWeek : -((currentDayOfWeek + 6) % 7);
  
  const startDate = addDays(anchorDate, offset);
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    week.push(addDays(startDate, i));
  }
  return week;
}

/**
 * Get a 7-day sliding window centered on anchorDate (3 days before, anchor, 3 days after).
 */
export function getSlidingWeekDates(anchorDate: Date): Date[] {
  const week: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    week.push(addDays(anchorDate, i));
  }
  return week;
}

export interface MonthCalendarCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  dayOfWeek: number; // 0=Sun, 6=Sat
}

/**
 * Generate calendar grid cells for a given month and year.
 * Always returns complete weeks (rows of 7 days) starting Sunday.
 */
export function getMonthCalendarCells(year: number, monthIndex: number): MonthCalendarCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  
  const cells: MonthCalendarCell[] = [];

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(year, monthIndex - 1);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, monthIndex - 1, day);
    cells.push({
      date: prevDate,
      dateKey: formatDateKey(prevDate),
      dayNumber: day,
      isCurrentMonth: false,
      dayOfWeek: prevDate.getDay(),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, monthIndex, day);
    cells.push({
      date: currentDate,
      dateKey: formatDateKey(currentDate),
      dayNumber: day,
      isCurrentMonth: true,
      dayOfWeek: currentDate.getDay(),
    });
  }

  // Next month leading days to complete the last week
  const remainingCells = 7 - (cells.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, monthIndex + 1, day);
      cells.push({
        date: nextDate,
        dateKey: formatDateKey(nextDate),
        dayNumber: day,
        isCurrentMonth: false,
        dayOfWeek: nextDate.getDay(),
      });
    }
  }

  return cells;
}

/**
 * Format a Tamil display string, e.g. "அக்டோபர் 12, 2026"
 */
export function formatTamilDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDate();
  const monthName = TAMIL_GREGORIAN_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${monthName} ${day}, ${year}`;
}

/**
 * Format a bilingual display date string based on language ("ta" or "en").
 */
export function formatDisplayDate(dateKey: string, lang: 'ta' | 'en' | string = 'ta'): string {
  if (!dateKey) return '';
  try {
    const date = parseDateKey(dateKey.slice(0, 10));
    const day = date.getDate();
    const year = date.getFullYear();
    if (lang === 'en') {
      const monthName = ENGLISH_MONTH_NAMES[date.getMonth()];
      return `${monthName} ${day}, ${year}`;
    }
    const monthName = TAMIL_GREGORIAN_MONTH_NAMES[date.getMonth()];
    return `${monthName} ${day}, ${year}`;
  } catch (_e) {
    return dateKey;
  }
}

/**
 * Calculate the number of calendar days between two date keys (inclusive).
 */
export function calculateDaysBetween(startDateKey: string, endDateKey: string): number {
  try {
    const start = parseDateKey(startDateKey.slice(0, 10));
    const end = parseDateKey(endDateKey.slice(0, 10));
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  } catch (_e) {
    return 1;
  }
}
