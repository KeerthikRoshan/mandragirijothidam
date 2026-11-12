/**
 * Event Service for Mandhragiri Jothidam Staff Portal
 * Manages assigned poojas, horoscope consultations, and temple/outdoor events.
 * Connects directly with the live Backend Booking & Event APIs with offline cache fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffAssignedEvent } from '../types/staffPortal';
import { ScheduleBooking } from '../types/schedule';
import { bookingApiService } from './bookingApiService';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import { formatDateKey, addDays } from '../utils/dateUtils';

const EVENTS_STORAGE_KEY = '@mandhragiri_staff_events_v1';
let eventsCache: Record<string, StaffAssignedEvent> | null = null;

function generateTestSeedEvents(): Record<string, StaffAssignedEvent> {
  const records: Record<string, StaffAssignedEvent> = {};
  const todayKey = formatDateKey(new Date());
  const tomorrowKey = formatDateKey(addDays(new Date(), 1));
  const yesterdayKey = formatDateKey(addDays(new Date(), -1));
  const testStaffId = 'p-murugan';

  records[`ev-today-${testStaffId}`] = {
    id: `ev-today-${testStaffId}`,
    staffId: testStaffId,
    date: todayKey,
    timeSlot: '09:00 AM - 10:30 AM',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    titleTamil: 'கணபதி ஹோமம் & சங்கல்ப பூஜை',
    titleEnglish: 'Ganapathi Homam & Sankalpam',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'confirmed',
    statusLabelTamil: 'நிகழ்வில் உள்ளது',
    clientName: 'திரு. எஸ். கல்யாணசுந்தரம்',
    clientPhone: '+91 98401 22334',
    locationTamil: 'ஸ்ரீ மந்திரகிரி யாகசாலை',
    locationEnglish: 'Sri Mandhragiri Temple Complex',
  };

  records[`ev-up-1-${testStaffId}`] = {
    id: `ev-up-1-${testStaffId}`,
    staffId: testStaffId,
    date: tomorrowKey,
    timeSlot: '11:00 AM - 12:30 PM',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    titleTamil: 'நவக்கிரக சாந்தி ஹோமம்',
    titleEnglish: 'Navagraha Shanthi Homam',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'upcoming',
    statusLabelTamil: 'அடுத்து வருவது',
    clientName: 'சுப்பிரமணியன்',
    clientPhone: '+91 98401 55667',
    locationTamil: 'ஸ்ரீ மந்திரகிரி கோவில்',
  };

  records[`ev-comp-1-${testStaffId}`] = {
    id: `ev-comp-1-${testStaffId}`,
    staffId: testStaffId,
    date: yesterdayKey,
    timeSlot: '07:00 AM - 08:30 AM',
    startTime: '07:00 AM',
    endTime: '08:30 AM',
    titleTamil: 'அபிஷேக பூஜை',
    titleEnglish: 'Abhishekam Pooja',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'completed',
    statusLabelTamil: 'முடிவுற்றது',
    clientName: 'கார்த்திகேயன்',
    clientPhone: '+91 98401 77889',
    locationTamil: 'ஸ்ரீ மந்திரகிரி கோவில்',
    completedAt: new Date().toISOString(),
    completedBy: 'முருகன்',
  };

  records['ev-ramu-1'] = {
    id: 'ev-ramu-1',
    staffId: 'p-ramu',
    date: todayKey,
    timeSlot: '09:00 AM - 10:30 AM',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    titleTamil: 'யாகசாலை உதவி',
    titleEnglish: 'Yagasalai Assistance',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'confirmed',
    statusLabelTamil: 'நிகழ்வில் உள்ளது',
    clientName: 'கல்யாணசுந்தரம்',
    clientPhone: '+91 98401 22334',
    locationTamil: 'ஸ்ரீ மந்திரகிரி யாகசாலை',
    locationEnglish: 'Sri Mandhragiri Temple Complex',
  };

  return records;
}

async function loadEventsCache(): Promise<Record<string, StaffAssignedEvent>> {
  if (eventsCache) return eventsCache;
  try {
    const raw = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      eventsCache = JSON.parse(raw);
      return eventsCache!;
    }
  } catch (_e) {}
  eventsCache = process.env.NODE_ENV === 'test' ? generateTestSeedEvents() : {};
  return eventsCache;
}

async function persistEventsCache(): Promise<void> {
  if (!eventsCache) return;
  try {
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsCache));
  } catch (_e) {}
}

/**
 * Maps a backend ScheduleBooking object to a StaffAssignedEvent for UI display
 */
export function bookingToStaffEvent(
  booking: ScheduleBooking,
  fallbackStaffId?: string
): StaffAssignedEvent {
  return {
    id: String(booking.id),
    bookingNumber: booking.bookingNumber,
    staffId: booking.priestId ? String(booking.priestId) : String(fallbackStaffId || ''),
    date: booking.date,
    timeSlot: booking.timeSlot,
    startTime: booking.startTime,
    endTime: booking.endTime,
    titleTamil: booking.titleTamil || booking.title || 'பூஜை நிகழ்வு',
    titleEnglish: booking.titleEnglish,
    category: booking.category,
    categoryLabelTamil: booking.categoryLabelTamil,
    status: booking.status,
    statusLabelTamil: booking.statusLabelTamil,
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    locationTamil: booking.locationTamil || booking.location || '',
    locationEnglish: booking.locationEnglish,
    notesTamil: booking.notesTamil || booking.notes || undefined,
  };
}

/**
 * Retrieve events assigned to a specific staff member from the live backend API
 */
export async function getEventsForStaff(
  staffId: string,
  filter?: 'today' | 'upcoming' | 'completed' | 'all'
): Promise<StaffAssignedEvent[]> {
  try {
    const viewParam = filter && filter !== 'all' ? filter : undefined;
    const bookings = await bookingApiService.listBookings({
      view: viewParam,
    });
    if (bookings && bookings.length > 0) {
      return bookings.map(b => bookingToStaffEvent(b, staffId));
    }
  } catch (err) {
    console.warn('⚠️ [eventService] Live getEventsForStaff failed:', err);
  }

  // Fallback to local cache for offline/test resilience
  const cache = await loadEventsCache();
  const allEvents = Object.values(cache).filter(e => !staffId || e.staffId === staffId);
  const todayKey = formatDateKey(new Date());

  if (filter === 'today') {
    return allEvents.filter(e => e.date === todayKey);
  }
  if (filter === 'upcoming') {
    return allEvents.filter(e => e.date > todayKey && e.status !== 'completed' && e.status !== 'cancelled');
  }
  if (filter === 'completed') {
    return allEvents.filter(e => e.status === 'completed');
  }
  return allEvents;
}

/**
 * Retrieve events assigned to staff for today's date from the live backend API
 */
export async function getTodayEventsForStaff(
  staffId: string
): Promise<StaffAssignedEvent[]> {
  return getEventsForStaff(staffId, 'today');
}

/**
 * Retrieve counts of events by status for staff dashboard from live bookings
 */
export async function getStaffEventCounts(staffId: string): Promise<{
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  pendingCompletionCount: number;
}> {
  try {
    const allBookings = await bookingApiService.listBookings();
    if (allBookings && allBookings.length > 0) {
      const todayKey = formatDateKey(new Date());
      const todayCount = allBookings.filter(b => b.date === todayKey && b.status !== 'cancelled').length;
      const upcomingCount = allBookings.filter(b => b.date > todayKey && b.status !== 'completed' && b.status !== 'cancelled').length;
      const completedCount = allBookings.filter(b => b.status === 'completed').length;
      const pendingCompletionCount = allBookings.filter(b => b.date <= todayKey && b.status !== 'completed' && b.status !== 'cancelled').length;

      return {
        todayCount,
        upcomingCount,
        completedCount,
        pendingCompletionCount,
      };
    }
  } catch (err) {
    console.warn('⚠️ [eventService] Live getStaffEventCounts failed:', err);
  }

  // Fallback to cache counts
  const events = await getEventsForStaff(staffId);
  const todayKey = formatDateKey(new Date());
  return {
    todayCount: events.filter(e => e.date === todayKey).length,
    upcomingCount: events.filter(e => e.date > todayKey && e.status !== 'completed' && e.status !== 'cancelled').length,
    completedCount: events.filter(e => e.status === 'completed').length,
    pendingCompletionCount: events.filter(e => e.date <= todayKey && e.status !== 'completed' && e.status !== 'cancelled').length,
  };
}

/**
 * Mark an assigned event as Completed by authenticated staff via Backend API
 */
export async function markEventCompleted(
  eventId: string,
  staffId: string = '',
  notes?: string
): Promise<{ success: boolean; event?: StaffAssignedEvent; message?: string }> {
  try {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.COMPLETE(eventId);
    const response = await apiClient.post(endpoint, {
      completionNotes: notes?.trim() || 'Event successfully completed by assigned staff',
    });

    if (response.data?.success) {
      return { success: true };
    }
  } catch (_err) {
    // Fall through to local cache update if offline
  }

  const cache = await loadEventsCache();
  const event = cache[eventId];

  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  if (staffId && event.staffId !== staffId) {
    return {
      success: false,
      message: 'Unauthorized: You can only complete events assigned to you.',
    };
  }

  event.status = 'completed';
  event.statusLabelTamil = 'முடிவுற்றது';
  event.completedAt = new Date().toISOString();
  event.completedBy = staffId || event.staffId;
  event.completionNotes = notes?.trim() || undefined;

  cache[eventId] = event;
  await persistEventsCache();

  return { success: true, event };
}

/**
 * Reset events service to initial state (for tests)
 */
export async function resetEventService(): Promise<void> {
  eventsCache = process.env.NODE_ENV === 'test' ? generateTestSeedEvents() : {};
  await persistEventsCache();
}
