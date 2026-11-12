/**
 * Staff Reminder Service for Mandhragiri Jothidam
 * Manages daily and upcoming reminders for priests and assistants.
 * Connected directly with assigned events.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderStatus, StaffReminder } from '../types/staffPortal';
import { addDays, formatDateKey } from '../utils/dateUtils';

const REMINDERS_STORAGE_KEY = '@mandhragiri_staff_reminders_v1';

let remindersCache: Record<string, StaffReminder> | null = null;

function generateTestSeedReminders(): Record<string, StaffReminder> {
  const records: Record<string, StaffReminder> = {};
  const todayKey = formatDateKey(new Date());
  const tomorrowKey = formatDateKey(addDays(new Date(), 1));
  const testStaffId = 'p-murugan';

  records[`rem-td-1-${testStaffId}`] = {
    id: `rem-td-1-${testStaffId}`,
    staffId: testStaffId,
    eventId: `ev-today-${testStaffId}`,
    title: 'Pooja Materials & Draviyam Verification',
    titleTamil: 'பூஜை திரவியங்கள் & பொருட்கள் சரிபார்த்தல்',
    description: 'Verify all sacred materials.',
    descriptionTamil: 'காலை ஹோமத்திற்கான சமித்து, நெய், மலர்கள் சரிபார்க்கவும்.',
    date: todayKey,
    time: '08:00 AM',
    status: 'pending',
    isToday: true,
    createdAt: new Date().toISOString(),
  };

  records[`rem-td-2-${testStaffId}`] = {
    id: `rem-td-2-${testStaffId}`,
    staffId: testStaffId,
    eventId: `ev-today-${testStaffId}`,
    title: 'Client Confirmation & Timings Call',
    titleTamil: 'பக்தர் வருகை & நேர உறுதிப்படுத்தல்',
    description: 'Confirm client arrival.',
    descriptionTamil: 'சுபமுகூர்த்தத்திற்கு 30 நிமிடங்கள் முன்பாக பக்தர் வருகையை உறுதிப்படுத்தவும்.',
    date: todayKey,
    time: '08:30 AM',
    status: 'pending',
    isToday: true,
    createdAt: new Date().toISOString(),
  };

  records[`rem-up-1-${testStaffId}`] = {
    id: `rem-up-1-${testStaffId}`,
    staffId: testStaffId,
    title: 'Next Day Pooja Preparation',
    titleTamil: 'நாளைய விசேஷ பூஜை முன்னேற்பாடுகள்',
    description: 'Prepare sacred vessels.',
    descriptionTamil: 'நாளைய நிகழ்விற்கான கலசங்கள் தயார் செய்தல்.',
    date: tomorrowKey,
    time: '05:30 PM',
    status: 'pending',
    isToday: false,
    createdAt: new Date().toISOString(),
  };

  return records;
}

/**
 * Load reminders cache from AsyncStorage
 */
async function loadRemindersCache(): Promise<Record<string, StaffReminder>> {
  if (remindersCache) {
    return remindersCache;
  }
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) {
      remindersCache = JSON.parse(raw);
      return remindersCache!;
    }
  } catch (_e) {}

  remindersCache = process.env.NODE_ENV === 'test' ? generateTestSeedReminders() : {};
  return remindersCache;
}

/**
 * Persist cache back to AsyncStorage
 */
async function persistRemindersCache(): Promise<void> {
  if (!remindersCache) return;
  try {
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(remindersCache));
  } catch (_e) {}
}

/**
 * Get all reminders for a specific staff member
 */
export async function getRemindersForStaff(
  staffId: string
): Promise<StaffReminder[]> {
  const cache = await loadRemindersCache();
  return Object.values(cache).filter(r => r.staffId === staffId);
}

/**
 * Complete a reminder
 */
export async function completeReminder(
  reminderId: string,
  staffId: string
): Promise<{ success: boolean; reminder?: StaffReminder }> {
  const cache = await loadRemindersCache();
  const rem = cache[reminderId];

  if (!rem || rem.staffId !== staffId) {
    return { success: false };
  }

  rem.status = 'completed';
  rem.completedAt = new Date().toISOString();
  cache[reminderId] = rem;
  await persistRemindersCache();

  return { success: true, reminder: rem };
}

/**
 * Triggered automatically when an event is marked completed
 */
export async function onEventCompleted(
  eventId: string,
  staffId: string
): Promise<void> {
  const cache = await loadRemindersCache();
  let modified = false;

  Object.values(cache).forEach(r => {
    if (r.staffId === staffId && r.eventId === eventId && r.status !== 'completed') {
      r.status = 'completed';
      r.completedAt = new Date().toISOString();
      modified = true;
    }
  });

  if (modified) {
    await persistRemindersCache();
  }
}

/**
 * Reset reminder service (for testing)
 */
export async function resetReminderService(): Promise<void> {
  remindersCache = process.env.NODE_ENV === 'test' ? generateTestSeedReminders() : {};
  await persistRemindersCache();
}
