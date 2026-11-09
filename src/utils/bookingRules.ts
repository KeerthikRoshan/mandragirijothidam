/**
 * Booking Rules & Helper Utilities for Mandhragiri Jothidam
 * Timezone: Asia/Kolkata
 *
 * Implements:
 * 1. Strict 24-hour edit restriction logic.
 * 2. LIVE event detection (running right now).
 * 3. Chronological sorting by start time.
 * 4. Today filtering.
 */

import { ScheduleBooking } from '../types/schedule';
import { parseLocalDateParts, parseTimeToMinutes } from './timeCalculation';

export interface BookingEditCheck {
  isEditable: boolean;
  reasonEn: string;
  reasonTa: string;
}

export interface BookingLiveStatus {
  isLive: boolean;
  isPast: boolean;
  isUpcoming: boolean;
}

/**
 * Checks whether a booking is eligible for editing.
 *
 * Requirements:
 * - Allow editing ONLY for bookings scheduled MORE THAN 24 HOURS in the future.
 * - Prohibit editing for:
 *   1. Bookings scheduled within the next 24 hours.
 *   2. All bookings scheduled for today.
 *   3. Currently running / LIVE bookings.
 *   4. Completed bookings.
 *   5. Past bookings.
 */
export function isBookingEditable(
  booking: ScheduleBooking | null | undefined,
  now: Date = new Date()
): BookingEditCheck {
  if (!booking) {
    return {
      isEditable: false,
      reasonEn: 'Booking details not available',
      reasonTa: 'முன்பதிவு விவரங்கள் கிடைக்கவில்லை',
    };
  }

  // 1. Prohibit completed or cancelled bookings
  const status = (booking.status || '').toLowerCase();
  if (status === 'completed') {
    return {
      isEditable: false,
      reasonEn: 'Completed bookings cannot be edited',
      reasonTa: 'முடிவுற்ற பதிவுகளை திருத்த முடியாது',
    };
  }
  if (status === 'cancelled') {
    return {
      isEditable: false,
      reasonEn: 'Cancelled bookings cannot be edited',
      reasonTa: 'ரத்து செய்யப்பட்ட பதிவுகளை திருத்த முடியாது',
    };
  }

  // 2. Resolve booking start timestamp
  const dateStr = booking.date || '';
  const { year, month, day } = parseLocalDateParts(dateStr);
  const startMinutes = parseTimeToMinutes(booking.startTime || '00:00') ?? 0;
  const startHour = Math.floor(startMinutes / 60);
  const startMinute = startMinutes % 60;

  const eventStart = new Date(year, month - 1, day, startHour, startMinute, 0, 0);

  // Calendar day check (strictly prohibit all bookings on today or in past)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const bookingDay = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (bookingDay.getTime() <= todayStart.getTime()) {
    return {
      isEditable: false,
      reasonEn: 'Editing is available only 24 hours before the event',
      reasonTa: 'நிகழ்விற்கு 24 மணி நேரத்திற்கு முன்பு மட்டுமே திருத்த முடியும்',
    };
  }

  // Hourly delta check: must be strictly > 24 hours
  const diffHours = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 24) {
    return {
      isEditable: false,
      reasonEn: 'Editing is available only 24 hours before the event',
      reasonTa: 'நிகழ்விற்கு 24 மணி நேரத்திற்கு முன்பு மட்டுமே திருத்த முடியும்',
    };
  }

  return {
    isEditable: true,
    reasonEn: '',
    reasonTa: '',
  };
}

/**
 * Resolves complete start Date and end Date objects for a booking.
 */
export function getBookingDateTimes(booking: ScheduleBooking): {
  startDateTime: Date;
  endDateTime: Date;
} {
  // If booking has startDateTime and endDateTime already as ISO strings or Date instances:
  if (booking.startDateTime && booking.endDateTime) {
    const s = new Date(booking.startDateTime);
    const e = new Date(booking.endDateTime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e.getTime() > s.getTime()) {
      return { startDateTime: s, endDateTime: e };
    }
  }

  let startTimeStr = booking.startTime;
  let endTimeStr = booking.endTime;

  if ((!startTimeStr || !endTimeStr) && booking.timeSlot) {
    const parts = booking.timeSlot.split(/[-–—]/);
    if (parts[0] && !startTimeStr) startTimeStr = parts[0].trim();
    if (parts[1] && !endTimeStr) endTimeStr = parts[1].trim();
  }

  const { year, month, day } = parseLocalDateParts(booking.date);
  const startMins = parseTimeToMinutes(startTimeStr || '09:00 AM') ?? 540;
  const startHour = Math.floor(startMins / 60);
  const startMinute = startMins % 60;
  const startDateTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);

  // If durationMinutes is explicitly specified and > 0
  if (booking.durationMinutes && booking.durationMinutes > 0) {
    const endDateTime = new Date(startDateTime.getTime() + booking.durationMinutes * 60 * 1000);
    return { startDateTime, endDateTime };
  }

  // If endTimeStr is available, calculate duration from it
  if (endTimeStr) {
    const endMins = parseTimeToMinutes(endTimeStr);
    if (endMins !== null) {
      let durationMins = endMins - startMins;
      if (durationMins <= 0) {
        // Crossed midnight
        durationMins += 1440;
      }
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60 * 1000);
      return { startDateTime, endDateTime };
    }
  }

  // Fallback 60 minutes
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  return { startDateTime, endDateTime };
}

export type BookingStatusCategory = 'LIVE' | 'UPCOMING' | 'COMPLETED';

/**
 * Classifies a booking into LIVE, UPCOMING, or COMPLETED using actual start/end date/time.
 */
export function classifyTodayBooking(
  booking: ScheduleBooking,
  now: Date = new Date()
): BookingStatusCategory {
  const status = (booking.status || '').toLowerCase();
  const { startDateTime, endDateTime } = getBookingDateTimes(booking);
  const nowMs = now.getTime();

  // If marked completed or current time >= end date/time
  if (status === 'completed' || nowMs >= endDateTime.getTime()) {
    return 'COMPLETED';
  }

  // If current date/time is >= start date/time and < end date/time (and not cancelled)
  if (nowMs >= startDateTime.getTime() && nowMs < endDateTime.getTime() && status !== 'cancelled') {
    return 'LIVE';
  }

  // Otherwise, it has not started yet
  return 'UPCOMING';
}

/**
 * Determines whether a booking is currently LIVE, UPCOMING, or COMPLETED/PAST.
 *
 * Rules:
 * - LIVE: Current time falls between start and end date/time (and not completed/cancelled).
 * - PAST: Current time is past end time OR status is 'completed'.
 * - UPCOMING: Current time is before start time (and not completed/cancelled).
 */
export function getBookingLiveStatus(
  booking: ScheduleBooking,
  now: Date = new Date()
): BookingLiveStatus {
  const status = (booking.status || '').toLowerCase();
  if (status === 'completed') {
    return { isLive: false, isPast: true, isUpcoming: false };
  }
  if (status === 'cancelled') {
    return { isLive: false, isPast: true, isUpcoming: false };
  }

  const { startDateTime, endDateTime } = getBookingDateTimes(booking);
  const nowMs = now.getTime();
  const startMs = startDateTime.getTime();
  const endMs = endDateTime.getTime();

  if (nowMs >= startMs && nowMs < endMs) {
    return { isLive: true, isPast: false, isUpcoming: false };
  }

  if (nowMs >= endMs) {
    return { isLive: false, isPast: true, isUpcoming: false };
  }

  return { isLive: false, isPast: false, isUpcoming: true };
}

/**
 * Sorts today's bookings in the strict order:
 * 1. LIVE (currently running)
 * 2. UPCOMING (nearest start time first)
 * 3. COMPLETED (most recently completed first)
 */
export function sortTodayBookingsByStatusOrder(
  bookings: ScheduleBooking[],
  now: Date = new Date()
): ScheduleBooking[] {
  const live: ScheduleBooking[] = [];
  const upcoming: ScheduleBooking[] = [];
  const completed: ScheduleBooking[] = [];

  for (const b of bookings) {
    const category = classifyTodayBooking(b, now);
    if (category === 'LIVE') {
      live.push(b);
    } else if (category === 'UPCOMING') {
      upcoming.push(b);
    } else {
      completed.push(b);
    }
  }

  // 1. LIVE: sorted by start time
  live.sort((a, b) => {
    const timeA = getBookingDateTimes(a).startDateTime.getTime();
    const timeB = getBookingDateTimes(b).startDateTime.getTime();
    return timeA - timeB;
  });

  // 2. UPCOMING: sorted by nearest start time first
  upcoming.sort((a, b) => {
    const timeA = getBookingDateTimes(a).startDateTime.getTime();
    const timeB = getBookingDateTimes(b).startDateTime.getTime();
    return timeA - timeB;
  });

  // 3. COMPLETED: sorted consistently by most recently completed first
  completed.sort((a, b) => {
    const timeA = getBookingDateTimes(a).endDateTime.getTime();
    const timeB = getBookingDateTimes(b).endDateTime.getTime();
    return timeB - timeA;
  });

  return [...live, ...upcoming, ...completed];
}

/**
 * Sorts bookings chronologically based on start time.
 */
export function sortBookingsChronologically(bookings: ScheduleBooking[]): ScheduleBooking[] {
  return [...bookings].sort((a, b) => {
    const timeA = getBookingDateTimes(a).startDateTime.getTime();
    const timeB = getBookingDateTimes(b).startDateTime.getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Normalizes NewBookingFormData into the comprehensive backend payload
 * providing both camelCase and snake_case properties for guaranteed backend compatibility.
 */
export function buildBookingPayload(formData: any) {
  const startTime = formData.timeSlot ? formData.timeSlot.split('-')[0].trim() : (formData.startTime || '07:00 AM');
  const targetPriestId = formData.priestId ? String(formData.priestId) : '';
  const priestIds = formData.priestIds && formData.priestIds.length > 0
    ? formData.priestIds.map(String)
    : (targetPriestId ? [targetPriestId] : []);

  return {
    id: formData.id ? String(formData.id) : undefined,
    bookingId: formData.id ? String(formData.id) : undefined,
    booking_id: formData.id ? String(formData.id) : undefined,
    dateKey: formData.dateKey,
    booking_date: formData.dateKey,
    date: formData.dateKey,
    endDate: formData.endDateKey || formData.dateKey,
    end_date: formData.endDateKey || formData.dateKey,
    daysOffset: formData.daysOffset || 0,
    days_offset: formData.daysOffset || 0,
    crossesMidnight: formData.crossesMidnight || false,
    title: (formData.title || '').trim(),
    eventTypeId: formData.eventTypeId || null,
    event_type_id: formData.eventTypeId || null,
    clientName: (formData.clientName || '').trim(),
    client_name: (formData.clientName || '').trim(),
    phone: (formData.phone || '').trim(),
    client_phone: (formData.phone || '').trim(),
    mobileNumber: (formData.phone || '').trim(),
    alternatePhone: formData.alternatePhone ? String(formData.alternatePhone).trim() : null,
    alternate_phone: formData.alternatePhone ? String(formData.alternatePhone).trim() : null,
    startTime: startTime,
    start_time: startTime,
    endTime: formData.endTime || startTime,
    end_time: formData.endTime || startTime,
    durationMinutes: Number(formData.durationMinutes) || 60,
    duration_minutes: Number(formData.durationMinutes) || 60,
    timeSlot: formData.timeSlot || `${startTime} - ${formData.endTime || startTime}`,
    time_slot: formData.timeSlot || `${startTime} - ${formData.endTime || startTime}`,
    venueType: formData.venueType || 'home',
    venue_type: formData.venueType || 'home',
    location: (formData.location || formData.address || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்').trim(),
    address: formData.address ? String(formData.address).trim() : (formData.location ? String(formData.location).trim() : null),
    area: formData.area ? String(formData.area).trim() : null,
    pincode: formData.pincode ? String(formData.pincode).trim() : null,
    samagriBy: formData.samagriBy || 'customer',
    samagri_by: formData.samagriBy || 'customer',
    notes: formData.notes ? String(formData.notes).trim() : null,
    priestId: targetPriestId,
    priest_id: targetPriestId,
    priestIds: priestIds,
    priest_ids: priestIds,
    priestName: formData.priestName || null,
    priest_name: formData.priestName || null,
    priestPhone: formData.priestPhone || null,
    priest_phone: formData.priestPhone || null,
    category: formData.category || 'outdoor',
    categoryLabelTamil: formData.categoryLabelTamil || 'நிகழ்வு',
    category_label_tamil: formData.categoryLabelTamil || 'நிகழ்வு',
    totalEventCharge: Number(formData.totalEventCharge) || 0,
    total_event_charge: Number(formData.totalEventCharge) || 0,
    clientAdvanceAmount: Number(formData.clientAdvanceAmount) || 0,
    client_advance_amount: Number(formData.clientAdvanceAmount) || 0,
    clientTotalReceived: Number(formData.clientTotalReceived !== undefined ? formData.clientTotalReceived : formData.clientAdvanceAmount) || 0,
    client_total_received: Number(formData.clientTotalReceived !== undefined ? formData.clientTotalReceived : formData.clientAdvanceAmount) || 0,
    priestTotalPay: Number(formData.priestTotalPay) || 0,
    priest_total_pay: Number(formData.priestTotalPay) || 0,
    priestAdvancePaid: Number(formData.priestAdvancePaid) || 0,
    priest_advance_paid: Number(formData.priestAdvancePaid) || 0,
  };
}

