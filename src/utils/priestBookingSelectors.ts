/**
 * Priest Booking Selectors & Data Synchronization Utility
 *
 * Guarantees 100% mathematical synchronization between:
 * - Summary counts (மொத்தம், இந்த வாரம், முரண்பாடுகள்)
 * - Booking tab counters (கடந்தவை, நிகழ்வு, அடுத்தவை)
 * - Displayed booking lists for every priest.
 */

import { ScheduleBooking } from '../types/schedule';
import {
  formatDateKey,
  getWeekDates,
  parseDateKey,
} from './dateUtils';

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
 * Filter bookings and compute exact, synchronized counts for a priest.
 *
 * @param bookings Array of bookings for this priest
 * @param referenceDateKey Optional anchor date (defaults to 2026-10-16)
 */
export function getPriestBookingCategories(
  bookings: ScheduleBooking[] = [],
  referenceDateKey: string = '2026-10-16'
): PriestBookingCategoryResults {
  // Exclude cancelled bookings if any
  const validBookings = bookings.filter(b => b.status !== 'cancelled');

  // Compute current week date keys
  const anchorDateObj = parseDateKey(referenceDateKey);
  const weekDateKeys = new Set(
    getWeekDates(anchorDateObj, true).map(d => formatDateKey(d))
  );

  const past: ScheduleBooking[] = [];
  const active: ScheduleBooking[] = [];
  const upcoming: ScheduleBooking[] = [];
  const thisWeek: ScheduleBooking[] = [];

  validBookings.forEach(booking => {
    // Check if in current week
    if (weekDateKeys.has(booking.date)) {
      thisWeek.push(booking);
    }

    // Determine category based on date & status
    if (booking.date === referenceDateKey) {
      if (booking.status === 'completed') {
        past.push(booking);
      } else {
        active.push(booking);
      }
    } else if (booking.date < referenceDateKey || booking.status === 'completed') {
      past.push(booking);
    } else {
      upcoming.push(booking);
    }
  });

  // Detect genuine time slot collisions on same date
  const conflicts: ScheduleBooking[] = [];
  const slotMap: Record<string, ScheduleBooking[]> = {};

  validBookings.forEach(b => {
    const key = `${b.date}_${b.startTime || b.timeSlot}`;
    if (!slotMap[key]) {
      slotMap[key] = [];
    }
    slotMap[key].push(b);
  });

  Object.values(slotMap).forEach(group => {
    if (group.length > 1) {
      conflicts.push(...group);
    }
  });

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
