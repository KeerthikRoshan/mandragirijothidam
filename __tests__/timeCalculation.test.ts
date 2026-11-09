import {
  calculateBookingTimings,
  validateBookingDateTimeRange,
  parseTimeToMinutes,
  minutesTo12,
  minutesTo24,
  formatLocalDate,
} from '../src/utils/timeCalculation';

describe('Duration-Based End Time Calculation', () => {
  const START_DATE = '2026-11-21';

  // Example Scenario 1: 7:00 AM + 10 hrs -> 5:00 PM (Same Day)
  it('calculates 7:00 AM + 10 hrs as 5:00 PM (Same Day)', () => {
    const res = calculateBookingTimings('7:00 AM', 10 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('05:00 PM');
    expect(res.daysOffset).toBe(0);
    expect(res.crossesMidnight).toBe(false);
    expect(res.dayLabel).toBe('(Same Day)');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-21');
    expect(res.isEndAfterStart).toBe(true);
    expect(res.timeSlot).toBe('07:00 AM - 05:00 PM');
  });

  // Example Scenario 2: 7:00 AM + 17 hrs -> 12:00 AM (Next Day)
  it('calculates 7:00 AM + 17 hrs as 12:00 AM (Next Day)', () => {
    const res = calculateBookingTimings('7:00 AM', 17 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('12:00 AM');
    expect(res.daysOffset).toBe(1);
    expect(res.crossesMidnight).toBe(true);
    expect(res.dayLabel).toBe('(Next Day)');
    expect(res.nextDayBadge).toBe('Next Day');
    expect(res.nextDayBadgeTamil).toBe('அடுத்த நாள்');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-22');
    expect(res.isEndAfterStart).toBe(true);
    expect(res.timeSlot).toContain('12:00 AM (Next Day)');
  });

  // Example Scenario 3: 7:00 AM + 18 hrs -> 1:00 AM (Next Day)
  it('calculates 7:00 AM + 18 hrs as 1:00 AM (Next Day)', () => {
    const res = calculateBookingTimings('7:00 AM', 18 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('01:00 AM');
    expect(res.daysOffset).toBe(1);
    expect(res.crossesMidnight).toBe(true);
    expect(res.dayLabel).toBe('(Next Day)');
    expect(res.nextDayBadge).toBe('Next Day');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-22');
    expect(res.isEndAfterStart).toBe(true);
    expect(res.timeSlot).toContain('01:00 AM (Next Day)');
  });

  // Example Scenario 4: 7:00 AM + 24 hrs -> 7:00 AM (Next Day)
  it('calculates 7:00 AM + 24 hrs as 7:00 AM (Next Day)', () => {
    const res = calculateBookingTimings('7:00 AM', 24 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('07:00 AM');
    expect(res.daysOffset).toBe(1);
    expect(res.crossesMidnight).toBe(true);
    expect(res.dayLabel).toBe('(Next Day)');
    expect(res.nextDayBadge).toBe('Next Day');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-22');
    expect(res.isEndAfterStart).toBe(true);
    expect(res.timeSlot).toContain('07:00 AM (Next Day)');
  });

  // Example Scenario 5: 7:00 AM + 30 hrs -> 1:00 PM (Next Day)
  it('calculates 7:00 AM + 30 hrs as 1:00 PM (Next Day)', () => {
    const res = calculateBookingTimings('7:00 AM', 30 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('01:00 PM');
    expect(res.daysOffset).toBe(1);
    expect(res.crossesMidnight).toBe(true);
    expect(res.dayLabel).toBe('(Next Day)');
    expect(res.nextDayBadge).toBe('Next Day');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-22');
    expect(res.isEndAfterStart).toBe(true);
    expect(res.timeSlot).toContain('01:00 PM (Next Day)');
  });

  // Durations greater than 24 hours: 48 hours
  it('calculates durations greater than 24 hours (e.g. 48 hrs) correctly with +2 Days offset', () => {
    const res = calculateBookingTimings('7:00 AM', 48 * 60, START_DATE);

    expect(res.startTime12).toBe('07:00 AM');
    expect(res.endTime12).toBe('07:00 AM');
    expect(res.daysOffset).toBe(2);
    expect(res.crossesMidnight).toBe(true);
    expect(res.dayLabel).toBe('(+2 Days)');
    expect(res.nextDayBadge).toBe('+2 Days');
    expect(res.startDateKey).toBe('2026-11-21');
    expect(res.endDateKey).toBe('2026-11-23');
    expect(res.isEndAfterStart).toBe(true);
  });

  // Month boundary rollover
  it('handles month boundary correctly (Nov 30 + 17 hrs -> Dec 1)', () => {
    const res = calculateBookingTimings('7:00 AM', 17 * 60, '2026-11-30');

    expect(res.startDateKey).toBe('2026-11-30');
    expect(res.endDateKey).toBe('2026-12-01');
    expect(res.daysOffset).toBe(1);
    expect(res.endTime12).toBe('12:00 AM');
  });

  // Year boundary rollover
  it('handles year boundary correctly (Dec 31 + 17 hrs -> Jan 1 next year)', () => {
    const res = calculateBookingTimings('7:00 AM', 17 * 60, '2026-12-31');

    expect(res.startDateKey).toBe('2026-12-31');
    expect(res.endDateKey).toBe('2027-01-01');
    expect(res.daysOffset).toBe(1);
    expect(res.endTime12).toBe('12:00 AM');
  });

  // Complete Date-Time Validation: never uses AM/PM clock strings alone
  it('validates complete date-time range and never determines earlier end-time by clock strings alone', () => {
    const start = new Date(2026, 10, 21, 7, 0, 0, 0); // 7:00 AM Nov 21
    const end = new Date(2026, 10, 22, 0, 0, 0, 0); // 12:00 AM Nov 22

    // Even though 00:00 (12:00 AM) has smaller hour than 07:00 (7:00 AM),
    // the complete date-time range is strictly valid because it is on the next day!
    const validResult = validateBookingDateTimeRange(start, end);
    expect(validResult.isValid).toBe(true);

    // If end is truly before start:
    const invalidEnd = new Date(2026, 10, 21, 6, 59, 0, 0);
    const invalidResult = validateBookingDateTimeRange(start, invalidEnd);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.error).toBeDefined();
  });

  // Error handling for invalid inputs
  it('throws descriptive errors on invalid start time or duration', () => {
    expect(() => calculateBookingTimings('invalid', 60)).toThrow('Invalid start time format');
    expect(() => calculateBookingTimings('07:00 AM', 0)).toThrow('Duration must be a positive number');
    expect(() => calculateBookingTimings('07:00 AM', -30)).toThrow('Duration must be a positive number');
  });
});
