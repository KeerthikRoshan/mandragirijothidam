/**
 * Event Service for Mandhragiri Jothidam Staff Portal
 * Manages assigned poojas, horoscope consultations, and temple/outdoor events.
 * Connects directly with the Admin event data model.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIEST_MOCK_STAFF } from '../data/priestMockData';
import { StaffAssignedEvent } from '../types/staffPortal';
import { addDays, formatDateKey } from '../utils/dateUtils';

const EVENTS_STORAGE_KEY = '@mandhragiri_staff_events_v1';

let eventsCache: Record<string, StaffAssignedEvent> | null = null;

/**
 * Generate initial seed events connecting each staff member with realistic bookings
 */
function generateSeedEvents(): Record<string, StaffAssignedEvent> {
  const records: Record<string, StaffAssignedEvent> = {};
  const todayKey = formatDateKey(new Date());
  const tomorrowKey = formatDateKey(addDays(new Date(), 1));
  const yesterdayKey = formatDateKey(addDays(new Date(), -1));
  const nextWeekKey = formatDateKey(addDays(new Date(), 3));

  // 1. Gather bookings from PRIEST_MOCK_STAFF
  PRIEST_MOCK_STAFF.forEach(staff => {
    // Add existing bookings from priestMockData
    staff.bookings.forEach((booking, idx) => {
      // Anchor dates around today for rich dashboard interaction
      let eventDate = booking.date;
      let status = booking.status;

      if (idx === 0) {
        eventDate = todayKey; // Today's primary event
        status = 'confirmed';
      } else if (idx === 1) {
        eventDate = tomorrowKey;
        status = 'upcoming';
      } else if (idx === 2) {
        eventDate = nextWeekKey;
        status = 'upcoming';
      } else if (idx >= 3 && idx <= 5) {
        eventDate = yesterdayKey;
        status = 'completed';
      }

      records[booking.id] = {
        id: booking.id,
        staffId: staff.id,
        date: eventDate,
        timeSlot: booking.timeSlot,
        startTime: booking.startTime,
        endTime: booking.endTime,
        titleTamil: booking.titleTamil,
        titleEnglish: booking.titleEnglish,
        category: booking.category,
        categoryLabelTamil: booking.categoryLabelTamil,
        status: status,
        statusLabelTamil:
          status === 'completed'
            ? 'முடிவுற்றது'
            : status === 'confirmed'
            ? 'நிகழ்வில் உள்ளது'
            : 'அடுத்து வருவது',
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        locationTamil: booking.locationTamil,
        locationEnglish: booking.locationEnglish,
        notesTamil: booking.notesTamil,
        completedAt:
          status === 'completed' ? new Date().toISOString() : undefined,
        completedBy: status === 'completed' ? staff.nameTamil : undefined,
      };
    });

    // Ensure every staff member has a dedicated event for Today
    const todayEventId = `ev-today-${staff.id}`;
    if (!records[todayEventId]) {
      records[todayEventId] = {
        id: todayEventId,
        staffId: staff.id,
        date: todayKey,
        timeSlot: '09:00 AM - 10:30 AM',
        startTime: '09:00 AM',
        endTime: '10:30 AM',
        titleTamil:
          staff.roleCategory === 'assistant'
            ? 'யாகசாலை உதவி & பொருட்கள் ஏற்பாடு'
            : 'கணபதி ஹோமம் & சங்கல்ப பூஜை',
        titleEnglish:
          staff.roleCategory === 'assistant'
            ? 'Yagasalai Assistance & Setup'
            : 'Ganapathi Homam & Sankalpam',
        category: 'temple',
        categoryLabelTamil: 'கோவில்',
        status: 'confirmed',
        statusLabelTamil: 'நிகழ்வில் உள்ளது',
        clientName: 'திரு. எஸ். கல்யாணசுந்தரம்',
        clientPhone: '+91 98401 22334',
        locationTamil: 'ஸ்ரீ மந்திரகிரி யாகசாலை',
        locationEnglish: 'Sri Mandhragiri Temple Complex',
        notesTamil: 'பூஜா திரவியங்கள் மற்றும் பூர்ணாஹுதி தயார் செய்தல்',
      };
    }
  });

  return records;
}

/**
 * Load events cache from AsyncStorage
 */
async function loadEventsCache(): Promise<Record<string, StaffAssignedEvent>> {
  if (eventsCache) {
    return eventsCache;
  }
  try {
    const raw = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      eventsCache = JSON.parse(raw);
      return eventsCache!;
    }
  } catch (_e) {}

  const seed = generateSeedEvents();
  eventsCache = seed;
  try {
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(seed));
  } catch (_e) {}
  return eventsCache;
}

/**
 * Persist events cache to AsyncStorage
 */
async function persistEventsCache(): Promise<void> {
  if (!eventsCache) return;
  try {
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsCache));
  } catch (_e) {}
}

/**
 * Retrieve all events assigned to a specific staff member
 */
export async function getEventsForStaff(
  staffId: string
): Promise<StaffAssignedEvent[]> {
  const cache = await loadEventsCache();
  return Object.values(cache).filter(e => e.staffId === staffId);
}

/**
 * Retrieve events assigned to staff for today's date
 */
export async function getTodayEventsForStaff(
  staffId: string
): Promise<StaffAssignedEvent[]> {
  const cache = await loadEventsCache();
  const todayKey = formatDateKey(new Date());
  return Object.values(cache).filter(
    e => e.staffId === staffId && e.date === todayKey
  );
}

/**
 * Retrieve counts of events by status for staff dashboard
 */
export async function getStaffEventCounts(staffId: string): Promise<{
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  pendingCompletionCount: number;
}> {
  const events = await getEventsForStaff(staffId);
  const todayKey = formatDateKey(new Date());

  const todayCount = events.filter(e => e.date === todayKey).length;
  const upcomingCount = events.filter(
    e => e.date > todayKey && e.status !== 'completed' && e.status !== 'cancelled'
  ).length;
  const completedCount = events.filter(e => e.status === 'completed').length;
  const pendingCompletionCount = events.filter(
    e => (e.date <= todayKey) && e.status !== 'completed' && e.status !== 'cancelled'
  ).length;

  return {
    todayCount,
    upcomingCount,
    completedCount,
    pendingCompletionCount,
  };
}

/**
 * Mark an assigned event as Completed by authenticated staff
 */
export async function markEventCompleted(
  eventId: string,
  staffId: string,
  notes?: string
): Promise<{ success: boolean; event?: StaffAssignedEvent; message?: string }> {
  const cache = await loadEventsCache();
  const event = cache[eventId];

  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  // Security: only assigned staff can mark their event completed
  if (event.staffId !== staffId) {
    return {
      success: false,
      message: 'Unauthorized: You can only complete events assigned to you.',
    };
  }

  event.status = 'completed';
  event.statusLabelTamil = 'முடிவுற்றது';
  event.completedAt = new Date().toISOString();
  event.completedBy = staffId;
  event.completionNotes = notes?.trim() || undefined;

  cache[eventId] = event;
  await persistEventsCache();

  return { success: true, event };
}

/**
 * Reset events service to initial state (for tests)
 */
export async function resetEventService(): Promise<void> {
  eventsCache = generateSeedEvents();
  await persistEventsCache();
}
