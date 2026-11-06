import {
  getMuhurthamCountForMonth,
  getTamilDateInfo,
  getTamilMonthDisplayForGregorian,
  isMuhurthamDate,
} from '../src/services/tamilCalendarService';

describe('tamilCalendarService', () => {
  it('correctly retrieves verified Tamil calendar metadata for 2026-10-12 (Monthly Reference)', () => {
    const info = getTamilDateInfo('2026-10-12');
    expect(info.tamilMonth).toBe('புரட்டாசி');
    expect(info.tamilDay).toBe(26);
    expect(info.tamilYearName).toBe('சுபகிருது');
    expect(info.tamilWeekday).toBe('திங்கள்');
    expect(info.tamilWeekdayFull).toBe('திங்கட்கிழமை');
    expect(info.isMuhurtham).toBe(true);
    expect(info.isVerified).toBe(true);
    expect(info.nakshatra).toBe('சுவாதி');
  });

  it('correctly retrieves verified Tamil calendar metadata for 2026-11-21 (Weekly Reference)', () => {
    const info = getTamilDateInfo('2026-11-21');
    expect(info.tamilMonth).toBe('கார்த்திகை');
    expect(info.tamilDay).toBe(5);
    expect(info.tamilYearName).toBe('சுபகிருது');
    expect(info.tamilWeekday).toBe('திங்கள்');
    expect(info.tamilWeekdayFull).toBe('திங்கட்கிழமை');
    expect(info.isVerified).toBe(true);
  });

  it('accurately identifies verified Muhurtham dates in October 2026', () => {
    // 5 Muhurtham days in Oct 2026
    expect(isMuhurthamDate('2026-10-09')).toBe(true);
    expect(isMuhurthamDate('2026-10-11')).toBe(true);
    expect(isMuhurthamDate('2026-10-12')).toBe(true);
    expect(isMuhurthamDate('2026-10-22')).toBe(true);
    expect(isMuhurthamDate('2026-10-28')).toBe(true);

    // Non-muhurtham dates
    expect(isMuhurthamDate('2026-10-10')).toBe(false);
    expect(isMuhurthamDate('2026-10-15')).toBe(false);

    // Count is exactly 5
    expect(getMuhurthamCountForMonth(2026, 9)).toBe(5);
  });

  it('returns appropriate Tamil month display for Gregorian months', () => {
    expect(getTamilMonthDisplayForGregorian(2026, 9)).toBe('புரட்டாசி – ஐப்பசி மாதம்');
    expect(getTamilMonthDisplayForGregorian(2026, 10)).toBe('ஐப்பசி – கார்த்திகை மாதம்');
  });
});
