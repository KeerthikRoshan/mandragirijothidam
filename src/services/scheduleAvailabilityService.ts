/**
 * Schedule Availability & Date Blocking Service for Mandhragiri Jothidam
 * Handles date locking, timeslot collision detection, and dynamic status computation.
 */

import { ScheduleBooking, ScheduleBlock, DateBookingSummary } from '../types/schedule';
import { isMuhurthamDate } from './tamilCalendarService';

/**
 * Check if a specific date has an all-day or active block.
 */
export function isDateBlocked(dateKey: string, blocks: ScheduleBlock[]): boolean {
  return blocks.some(b => b.date === dateKey && b.isAllDay);
}

/**
 * Get all active blocks for a given date.
 */
export function getDateBlocks(dateKey: string, blocks: ScheduleBlock[]): ScheduleBlock[] {
  return blocks.filter(b => b.date === dateKey);
}

/**
 * Check if a specific time slot overlaps with existing bookings.
 */
export function isTimeSlotAvailable(
  dateKey: string,
  startTime: string,
  endTime: string,
  existingBookings: ScheduleBooking[]
): boolean {
  const sameDateBookings = existingBookings.filter(
    b => b.date === dateKey && b.status !== 'cancelled'
  );

  return !sameDateBookings.some(b => {
    return b.startTime === startTime || b.timeSlot.includes(startTime);
  });
}

/**
 * Compute the dynamic booking summary for a specific date.
 */
export function getDateBookingSummary(
  dateKey: string,
  bookings: ScheduleBooking[],
  blocks: ScheduleBlock[] = []
): DateBookingSummary {
  const dateBookings = bookings.filter(b => b.date === dateKey);
  const total = dateBookings.length;
  const confirmed = dateBookings.filter(b => b.status === 'confirmed').length;
  const pending = dateBookings.filter(b => b.status === 'pending').length;
  const upcoming = dateBookings.filter(b => b.status === 'upcoming').length;
  const completed = dateBookings.filter(b => b.status === 'completed').length;
  const blocked = isDateBlocked(dateKey, blocks);
  const muhurtham = isMuhurthamDate(dateKey);

  return {
    date: dateKey,
    total,
    confirmed,
    pending,
    upcoming,
    completed,
    isBlocked: blocked,
    isMuhurtham: muhurtham,
  };
}

/**
 * Validates whether a booking can be scheduled without collision.
 */
export function validateBookingAvailability(
  dateKey: string,
  startTime: string,
  endTime: string,
  existingBookings: ScheduleBooking[],
  blocks: ScheduleBlock[] = []
): { isValid: boolean; reason?: string } {
  if (isDateBlocked(dateKey, blocks)) {
    return {
      isValid: false,
      reason: 'இந்த தேதி கோவில் நிர்வாகத்தால் முடக்கப்பட்டுள்ளது (Date is blocked)',
    };
  }

  if (!isTimeSlotAvailable(dateKey, startTime, endTime, existingBookings)) {
    return {
      isValid: false,
      reason: 'இந்த நேரத்தில் ஏற்கனவே மற்றொரு நிகழ்வு முன்பதிவு செய்யப்பட்டுள்ளது',
    };
  }

  return { isValid: true };
}
