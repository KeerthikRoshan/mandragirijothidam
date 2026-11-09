/**
 * Priest & Assistant Booking Selectors & Data Synchronization Utility
 * Timezone: Asia/Kolkata
 *
 * Implements strict date-time classification:
 * 1. Upcoming Events: currentDateTime < bookingStartDateTime (has not started yet)
 * 2. Live Events: bookingStartDateTime <= currentDateTime < bookingEndDateTime (in progress)
 * 3. Completed Events: currentDateTime >= bookingEndDateTime OR status === 'completed' (already passed)
 *
 * Guarantees:
 * - Shows all past bookings regardless of date (not restricted to today).
 * - Sorts completed bookings by most recently completed first (descending endDateTime).
 * - Sorts active & upcoming bookings by nearest start time first (ascending startDateTime).
 * - Correctly handles midnight rollover and durations > 24 hours.
 * - Zero duplicates across categories: total === past.length + active.length + upcoming.length.
 */

import { ScheduleBooking } from '../types/schedule';
import {
  formatDateKey,
  getWeekDates,
  parseDateKey,
} from './dateUtils';
import { getBookingDateTimes } from './bookingRules';
import { parseLocalDateParts } from './timeCalculation';

export interface PriestBookingCategoryResults {
  all: ScheduleBooking[];
  past: ScheduleBooking[];
  active: ScheduleBooking[];
  upcoming: ScheduleBooking[];
  thisWeek: ScheduleBooking[];
  conflicts: ScheduleBooking[];
  counts: {
    total: number;
    past: number;
    active: number;
    upcoming: number;
    thisWeek: number;
    conflicts: number;
  };
}

/**
 * Filter bookings and compute exact, synchronized counts for a priest or assistant.
 *
 * @param bookings Array of bookings for this priest/assistant
 * @param referenceDateOrNow Optional anchor date (Date object or string, defaults to new Date())
 */
export function getPriestBookingCategories(
  bookings: ScheduleBooking[] = [],
  referenceDateOrNow: Date | string = new Date()
): PriestBookingCategoryResults {
  // Exclude cancelled bookings if any
  const validBookings = bookings.filter(b => (b.status || '').toLowerCase() !== 'cancelled');

  // Resolve anchor Date object
  let now: Date;
  if (referenceDateOrNow instanceof Date) {
    now = referenceDateOrNow;
  } else if (typeof referenceDateOrNow === 'string') {
    if (referenceDateOrNow.includes('T')) {
      now = new Date(referenceDateOrNow);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(referenceDateOrNow)) {
      const parts = parseLocalDateParts(referenceDateOrNow);
      // For string date anchor like "2026-10-16", anchor at 08:00 AM so morning poojas fall into active interval
      now = new Date(parts.year, parts.month - 1, parts.day, 8, 0, 0, 0);
    } else {
      now = new Date();
    }
  } else {
    now = new Date();
  }

  const nowMs = now.getTime();

  // Compute current week date keys around anchor date
  const weekDateKeys = new Set(
    getWeekDates(now, true).map(d => formatDateKey(d))
  );

  const past: ScheduleBooking[] = [];
  const active: ScheduleBooking[] = [];
  const upcoming: ScheduleBooking[] = [];
  const thisWeek: ScheduleBooking[] = [];

  validBookings.forEach(booking => {
    const { startDateTime, endDateTime } = getBookingDateTimes(booking);
    const startMs = startDateTime.getTime();
    const endMs = endDateTime.getTime();
    const status = (booking.status || '').toLowerCase();

    // Check if in current week
    const dateKey = booking.date || formatDateKey(startDateTime);
    if (weekDateKeys.has(dateKey)) {
      thisWeek.push(booking);
    }

    // Classification Rules:
    // 1. Completed Events: currentDateTime >= bookingEndDateTime OR status === 'completed'
    if (status === 'completed' || nowMs >= endMs) {
      past.push(booking);
    }
    // 2. Live Events: bookingStartDateTime <= currentDateTime < bookingEndDateTime
    else if (startMs <= nowMs && nowMs < endMs) {
      active.push(booking);
    }
    // 3. Upcoming Events: currentDateTime < bookingStartDateTime
    else if (nowMs < startMs) {
      upcoming.push(booking);
    }
    // Fallback: past
    else {
      past.push(booking);
    }
  });

  // Sort Completed bookings: most recently completed first (descending end date/time)
  past.sort((a, b) => {
    const timeA = getBookingDateTimes(a).endDateTime.getTime();
    const timeB = getBookingDateTimes(b).endDateTime.getTime();
    return timeB - timeA;
  });

  // Sort Live / Active bookings: nearest start time first (ascending start date/time)
  active.sort((a, b) => {
    const timeA = getBookingDateTimes(a).startDateTime.getTime();
    const timeB = getBookingDateTimes(b).startDateTime.getTime();
    return timeA - timeB;
  });

  // Sort Upcoming bookings: nearest start time first (ascending start date/time)
  upcoming.sort((a, b) => {
    const timeA = getBookingDateTimes(a).startDateTime.getTime();
    const timeB = getBookingDateTimes(b).startDateTime.getTime();
    return timeA - timeB;
  });

  // Detect genuine time slot collisions (overlapping start & end times)
  const conflicts: ScheduleBooking[] = [];
  for (let i = 0; i < validBookings.length; i++) {
    const bA = validBookings[i];
    const timesA = getBookingDateTimes(bA);
    for (let j = i + 1; j < validBookings.length; j++) {
      const bB = validBookings[j];
      const timesB = getBookingDateTimes(bB);
      // Overlap condition: startA < endB && startB < endA
      if (
        timesA.startDateTime.getTime() < timesB.endDateTime.getTime() &&
        timesB.startDateTime.getTime() < timesA.endDateTime.getTime()
      ) {
        if (!conflicts.includes(bA)) conflicts.push(bA);
        if (!conflicts.includes(bB)) conflicts.push(bB);
      }
    }
  }

  return {
    all: validBookings,
    past,
    active,
    upcoming,
    thisWeek,
    conflicts,
    counts: {
      total: validBookings.length,
      past: past.length,
      active: active.length,
      upcoming: upcoming.length,
      thisWeek: thisWeek.length,
      conflicts: conflicts.length,
    },
  };
}
