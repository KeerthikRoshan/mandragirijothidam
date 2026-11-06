import {
  formatDateKey,
  formatTamilDisplayDate,
  getDaysInMonth,
  getMonthCalendarCells,
  getWeekDates,
  isSameDay,
  parseDateKey,
} from '../src/utils/dateUtils';

describe('dateUtils', () => {
  it('safely formats and parses dates in local time without UTC offset bugs', () => {
    const originalKey = '2026-10-12';
    const parsed = parseDateKey(originalKey);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed October
    expect(parsed.getDate()).toBe(12);

    const formatted = formatDateKey(parsed);
    expect(formatted).toBe(originalKey);
  });

  it('correctly compares same day', () => {
    const d1 = new Date(2026, 9, 12, 10, 0, 0);
    const d2 = new Date(2026, 9, 12, 18, 30, 0);
    const d3 = new Date(2026, 9, 13, 10, 0, 0);
    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });

  it('returns exactly 7 days for getWeekDates', () => {
    const anchor = new Date(2026, 10, 21); // Nov 21, 2026
    const week = getWeekDates(anchor, true);
    expect(week).toHaveLength(7);
  });

  it('generates complete calendar grid weeks for October 2026', () => {
    const cells = getMonthCalendarCells(2026, 9);
    // Must be multiple of 7
    expect(cells.length % 7).toBe(0);
    expect(cells.length).toBeGreaterThanOrEqual(28);

    const oct12Cell = cells.find(c => c.dateKey === '2026-10-12');
    expect(oct12Cell).toBeDefined();
    expect(oct12Cell?.dayNumber).toBe(12);
    expect(oct12Cell?.isCurrentMonth).toBe(true);
  });

  it('formats Tamil display date correctly', () => {
    expect(formatTamilDisplayDate('2026-10-12')).toBe('அக்டோபர் 12, 2026');
    expect(formatTamilDisplayDate('2026-11-21')).toBe('நவம்பர் 21, 2026');
  });

  it('returns correct days in month', () => {
    expect(getDaysInMonth(2026, 9)).toBe(31); // October
    expect(getDaysInMonth(2026, 10)).toBe(30); // November
    expect(getDaysInMonth(2026, 1)).toBe(28); // Feb 2026 (non leap year)
  });
});
