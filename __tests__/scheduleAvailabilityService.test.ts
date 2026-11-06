import {
  getDateBookingSummary,
  isDateBlocked,
  isTimeSlotAvailable,
  validateBookingAvailability,
} from '../src/services/scheduleAvailabilityService';
import { INITIAL_SCHEDULE_BLOCKS, INITIAL_SCHEDULE_BOOKINGS } from '../src/data/scheduleMockData';

describe('scheduleAvailabilityService', () => {
  it('correctly calculates dynamic booking summary for 2026-11-21', () => {
    const summary = getDateBookingSummary(
      '2026-11-21',
      INITIAL_SCHEDULE_BOOKINGS,
      INITIAL_SCHEDULE_BLOCKS
    );

    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(2);
    expect(summary.upcoming).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.isBlocked).toBe(false);
  });

  it('correctly calculates dynamic booking summary for 2026-10-12', () => {
    const summary = getDateBookingSummary(
      '2026-10-12',
      INITIAL_SCHEDULE_BOOKINGS,
      INITIAL_SCHEDULE_BLOCKS
    );

    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(2);
    expect(summary.isMuhurtham).toBe(true);
  });

  it('detects blocked dates', () => {
    expect(isDateBlocked('2026-10-25', INITIAL_SCHEDULE_BLOCKS)).toBe(true);
    expect(isDateBlocked('2026-10-26', INITIAL_SCHEDULE_BLOCKS)).toBe(false);
  });

  it('detects timeslot collisions and validates booking availability', () => {
    // 09:30 AM is already booked on 2026-11-21
    expect(
      isTimeSlotAvailable(
        '2026-11-21',
        '09:30 AM',
        '10:30 AM',
        INITIAL_SCHEDULE_BOOKINGS
      )
    ).toBe(false);

    // 01:30 PM is free
    expect(
      isTimeSlotAvailable(
        '2026-11-21',
        '01:30 PM',
        '02:30 PM',
        INITIAL_SCHEDULE_BOOKINGS
      )
    ).toBe(true);

    // Validation fails on blocked date
    const blockedValidation = validateBookingAvailability(
      '2026-10-25',
      '10:00 AM',
      '11:00 AM',
      INITIAL_SCHEDULE_BOOKINGS,
      INITIAL_SCHEDULE_BLOCKS
    );
    expect(blockedValidation.isValid).toBe(false);

    // Validation fails on slot collision
    const collisionValidation = validateBookingAvailability(
      '2026-11-21',
      '09:30 AM',
      '10:30 AM',
      INITIAL_SCHEDULE_BOOKINGS,
      INITIAL_SCHEDULE_BLOCKS
    );
    expect(collisionValidation.isValid).toBe(false);

    // Validation succeeds on open slot
    const freeValidation = validateBookingAvailability(
      '2026-11-21',
      '01:30 PM',
      '02:30 PM',
      INITIAL_SCHEDULE_BOOKINGS,
      INITIAL_SCHEDULE_BLOCKS
    );
    expect(freeValidation.isValid).toBe(true);
  });
});
