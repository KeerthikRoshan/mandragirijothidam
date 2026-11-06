/**
 * Attendance Service Boundary for Mandhragiri Jothidam
 * Manages staff attendance data persistence, summary calculations,
 * and date-wise / monthly history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIEST_MOCK_STAFF } from '../data/priestMockData';
import {
  AttendanceStatus,
  DateAttendanceSummary,
  StaffAttendanceRecord,
  StaffMonthlyAttendanceSummary,
} from '../types/attendance';
import { PriestStaffItem } from '../types/priest';
import {
  addDays,
  formatDateKey,
  getDaysInMonth,
  parseDateKey,
} from '../utils/dateUtils';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

const STORAGE_KEY = '@mandhragiri_staff_attendance_v1';

// In-memory cache for fast synchronous reads when initialized
let attendanceCache: Record<string, StaffAttendanceRecord> | null = null;

/**
 * Determine role category from designation
 */
function resolveRoleCategory(priest: PriestStaffItem): 'priest' | 'assistant' {
  const des = priest.designationEnglish.toLowerCase();
  if (des.includes('assistant') || des.includes('asst')) {
    return 'assistant';
  }
  return 'priest';
}

/**
 * Fresh base: No pre-recorded attendance data.
 * All staff attendance records start fresh and unrecorded ('not_marked').
 */
function generateSeedAttendanceRecords(): Record<string, StaffAttendanceRecord> {
  return {};
}

/**
 * Clear all cached attendance records from memory and local storage
 * to ensure a 100% clean, fresh slate.
 */
export async function clearAttendanceCache(): Promise<void> {
  attendanceCache = {};
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (_e) {
    // Ignore storage clear error
  }
}

/**
 * Initialize and load attendance cache from storage
 */
async function loadAttendanceCache(): Promise<Record<string, StaffAttendanceRecord>> {
  if (attendanceCache) {
    return attendanceCache;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      attendanceCache = JSON.parse(raw);
      return attendanceCache!;
    }
  } catch (_e) {
    // Fallback to fresh base
  }

  const seed = generateSeedAttendanceRecords();
  attendanceCache = seed;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch (_e) {
    // Ignore storage write error
  }
  return attendanceCache;
}

/**
 * Save cache back to AsyncStorage
 */
async function persistCache(): Promise<void> {
  if (!attendanceCache) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(attendanceCache));
  } catch (_e) {
    // Ignore storage write error
  }
}

/**
 * Retrieve all active staff members
 */
export function getAllStaffMembers(): PriestStaffItem[] {
  return PRIEST_MOCK_STAFF.filter(s => s.status === 'active');
}

/**
 * Retrieve staff member by ID
 */
export function getStaffById(staffId: string): PriestStaffItem | undefined {
  return PRIEST_MOCK_STAFF.find(s => s.id === staffId);
}

/**
 * Map backend attendance record to frontend StaffAttendanceRecord
 */
function mapBackendAttendanceRecord(row: any, fallbackDateKey: string): StaffAttendanceRecord {
  const staffId = String(row.staffId || row.staff_id || '');
  const dateKey = row.dateKey || row.date_key || fallbackDateKey;
  const statusLower = (row.status || 'not_marked').toLowerCase() as AttendanceStatus;
  const roleCategory = (row.roleCategory || (row.staffRole && row.staffRole.toLowerCase() === 'assistant' ? 'assistant' : 'priest')) as 'priest' | 'assistant';

  return {
    id: row.id || `${staffId}_${dateKey}`,
    staffId,
    staffCode: row.staffCode || row.staff_code,
    staffNameEnglish: row.staffNameEnglish || row.name_english || '',
    staffNameTamil: row.staffNameTamil || row.name_tamil || '',
    designationTamil: row.designationTamil || row.designation || '',
    designationEnglish: row.designationEnglish || row.designation || '',
    roleCategory,
    dateKey,
    status: statusLower,
    isLeave: statusLower === 'leave' || row.isLeave === true,
    submissionTime: row.submissionTime || row.submission_time || undefined,
    remarks: row.remarks || undefined,
    phone: row.phone,
    avatarUrl: row.avatarUrl || row.avatar_url,
    updatedAt: row.updatedAt || row.updated_at,
    updatedBy: row.updatedBy || row.updated_by,
  };
}

/**
 * Get date-wise attendance records for all active staff members on dateKey (YYYY-MM-DD).
 * Guarantees exactly one record per staff member.
 */
export async function getAttendanceForDate(
  dateKey: string
): Promise<StaffAttendanceRecord[]> {
  if (process.env.NODE_ENV !== 'test' || (apiClient.get as any)?.mock) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ATTENDANCE.DAILY, {
        params: { date: dateKey },
      });

      if (response.data?.success && Array.isArray(response.data?.data?.records)) {
        const records = response.data.data.records.map((r: any) =>
          mapBackendAttendanceRecord(r, dateKey)
        );

        // Update in-memory cache and persistent storage
        const cache = await loadAttendanceCache();
        records.forEach(r => {
          cache[r.id] = r;
        });
        persistCache();

        return records;
      }
    } catch (err) {
      console.warn('⚠️ [attendanceService] Live GET /attendance/daily failed, falling back to cache:', err);
    }
  }

  const cache = await loadAttendanceCache();
  const staffList = getAllStaffMembers();

  return staffList.map(staff => {
    const recordId = `${staff.id}_${dateKey}`;
    const existing = cache[recordId];

    if (existing) {
      return existing;
    }

    // Default to 'not_marked' if no explicit record exists yet
    return {
      id: recordId,
      staffId: staff.id,
      staffNameEnglish: staff.nameEnglish,
      staffNameTamil: staff.nameTamil,
      designationTamil: staff.designationTamil,
      designationEnglish: staff.designationEnglish,
      roleCategory: resolveRoleCategory(staff),
      dateKey,
      status: 'not_marked',
      submissionTime: undefined,
      remarks: undefined,
    };
  });
}

/**
 * Get summary metrics (total, present, absent, leave, not_marked) for dateKey.
 */
export async function getDateAttendanceSummary(
  dateKey: string
): Promise<DateAttendanceSummary> {
  if (process.env.NODE_ENV !== 'test' || (apiClient.get as any)?.mock) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ATTENDANCE.DAILY, {
        params: { date: dateKey },
      });

      if (response.data?.success && response.data?.data?.summary) {
        const s = response.data.data.summary;
        return {
          dateKey,
          totalStaff: Number(s.totalStaff || 0),
          presentCount: Number(s.presentCount || 0),
          absentCount: Number(s.absentCount || 0),
          leaveCount: Number(s.leaveCount || 0),
          notMarkedCount: Number(s.notMarkedCount || 0),
        };
      }
    } catch (_e) {
      // Fall back to computing from getAttendanceForDate
    }
  }

  const records = await getAttendanceForDate(dateKey);
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let notMarkedCount = 0;

  records.forEach(r => {
    if (r.status === 'present') presentCount++;
    else if (r.status === 'absent') absentCount++;
    else if (r.status === 'leave') leaveCount++;
    else notMarkedCount++;
  });

  return {
    dateKey,
    totalStaff: records.length,
    presentCount,
    absentCount,
    leaveCount,
    notMarkedCount,
  };
}

/**
 * Get monthly attendance history and statistics for a specific staff member.
 */
export async function getStaffMonthlyAttendance(
  staffId: string,
  year: number,
  monthIndex: number
): Promise<StaffMonthlyAttendanceSummary> {
  if (process.env.NODE_ENV !== 'test' || (apiClient.get as any)?.mock) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ATTENDANCE.MONTHLY(staffId), {
        params: { year, month: monthIndex + 1 },
      });

      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        const records: StaffAttendanceRecord[] = (d.records || []).map((r: any) =>
          mapBackendAttendanceRecord(r, r.dateKey)
        );

        const cache = await loadAttendanceCache();
        records.forEach(r => {
          cache[r.id] = r;
        });
        persistCache();

        return {
          staffId: String(d.staff?.id || staffId),
          staffNameEnglish: d.staff?.nameEnglish || '',
          staffNameTamil: d.staff?.nameTamil || '',
          designationTamil: d.staff?.designationTamil || d.staff?.designation || '',
          designationEnglish: d.staff?.designationEnglish || d.staff?.designation || '',
          year: Number(d.year || year),
          monthIndex: Number(d.monthIndex !== undefined ? d.monthIndex : monthIndex),
          totalDaysInMonth: Number(d.totalDaysInMonth || getDaysInMonth(year, monthIndex)),
          markedDaysCount: Number(d.markedDaysCount || 0),
          presentCount: Number(d.presentCount || 0),
          absentCount: Number(d.absentCount || 0),
          leaveCount: Number(d.leaveCount || 0),
          notMarkedCount: Number(d.notMarkedCount || 0),
          attendancePercentage: Number(d.attendancePercentage || 0),
          records,
        };
      }
    } catch (err) {
      console.warn('⚠️ [attendanceService] Live monthly attendance failed, falling back to cache:', err);
    }
  }

  const cache = await loadAttendanceCache();
  const staff = getStaffById(staffId) || PRIEST_MOCK_STAFF[0];
  const daysInMonth = getDaysInMonth(year, monthIndex);

  const records: StaffAttendanceRecord[] = [];
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let notMarkedCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dateKey = formatDateKey(date);
    const recordId = `${staff.id}_${dateKey}`;
    const existing = cache[recordId];

    if (existing) {
      records.push(existing);
      if (existing.status === 'present') presentCount++;
      else if (existing.status === 'absent') absentCount++;
      else if (existing.status === 'leave') leaveCount++;
      else notMarkedCount++;
    } else {
      const defaultRecord: StaffAttendanceRecord = {
        id: recordId,
        staffId: staff.id,
        staffNameEnglish: staff.nameEnglish,
        staffNameTamil: staff.nameTamil,
        designationTamil: staff.designationTamil,
        designationEnglish: staff.designationEnglish,
        roleCategory: resolveRoleCategory(staff),
        dateKey,
        status: 'not_marked',
      };
      records.push(defaultRecord);
      notMarkedCount++;
    }
  }

  const markedDaysCount = presentCount + absentCount + leaveCount;
  const attendancePercentage =
    markedDaysCount > 0
      ? Math.round((presentCount / markedDaysCount) * 100)
      : 0;

  return {
    staffId: staff.id,
    staffNameEnglish: staff.nameEnglish,
    staffNameTamil: staff.nameTamil,
    designationTamil: staff.designationTamil,
    designationEnglish: staff.designationEnglish,
    year,
    monthIndex,
    totalDaysInMonth: daysInMonth,
    markedDaysCount,
    presentCount,
    absentCount,
    leaveCount,
    notMarkedCount,
    attendancePercentage,
    records,
  };
}

/**
 * Update or correct attendance status for a staff member on a specific date.
 * Enforces one record per staff per date.
 */
export async function updateStaffAttendance(
  staffId: string,
  dateKey: string,
  status: AttendanceStatus,
  remarks?: string,
  submissionTime?: string
): Promise<StaffAttendanceRecord> {
  let backendRecord: any = null;
  if (process.env.NODE_ENV !== 'test' || (apiClient.put as any)?.mock) {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.ATTENDANCE.RECORD, {
        staffId,
        dateKey,
        status,
        remarks,
        submissionTime,
      });
      if (response.data?.success && response.data?.data) {
        backendRecord = response.data.data;
      }
    } catch (err: any) {
      console.warn('⚠️ [attendanceService] Live PUT /attendance/record failed, updating local cache:', err?.response?.data || err.message);
      if (err?.response?.data?.message) {
        throw err;
      }
    }
  }

  const cache = await loadAttendanceCache();
  const staff = getStaffById(staffId) || PRIEST_MOCK_STAFF[0];
  const recordId = `${staff.id}_${dateKey}`;

  const updatedRecord: StaffAttendanceRecord = {
    id: recordId,
    staffId: staff.id,
    staffNameEnglish: staff.nameEnglish,
    staffNameTamil: staff.nameTamil,
    designationTamil: staff.designationTamil,
    designationEnglish: staff.designationEnglish,
    roleCategory: resolveRoleCategory(staff),
    dateKey,
    status,
    isLeave: status === 'leave',
    submissionTime:
      status === 'present'
        ? submissionTime || backendRecord?.submissionTime || cache[recordId]?.submissionTime || formatCurrentTimeString()
        : undefined,
    remarks: remarks || backendRecord?.remarks || cache[recordId]?.remarks,
    updatedAt: backendRecord?.updatedAt || new Date().toISOString(),
    updatedBy: backendRecord?.updatedBy || 'Chief Administrator',
  };

  cache[recordId] = updatedRecord;
  await persistCache();

  return updatedRecord;
}

/**
 * Result of self-attendance submission via Staff Portal swipe
 */
export type SelfAttendanceResult =
  | {
      success: true;
      record: StaffAttendanceRecord;
    }
  | {
      success: false;
      reason: 'ALREADY_SUBMITTED' | 'STAFF_NOT_FOUND' | 'ERROR';
      message: string;
      record?: StaffAttendanceRecord;
    };

/**
 * Get saved attendance record for a specific staff member on a specific date.
 */
export async function getStaffAttendanceRecordForDate(
  staffId: string,
  dateKey: string
): Promise<StaffAttendanceRecord | null> {
  const cache = await loadAttendanceCache();
  const recordId = `${staffId}_${dateKey}`;
  const existing = cache[recordId];
  if (existing && (existing.status === 'present' || existing.status === 'absent')) {
    return existing;
  }
  return null;
}

/**
 * Format current local time into "hh:mm AM/PM"
 */
function formatCurrentTimeString(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Self-attendance submission for Staff Portal (Swipe right = Present, Swipe left = Absent).
 * Enforces the strict ONCE-PER-DAY rule.
 */
export async function submitSelfAttendance(
  staffId: string,
  dateKey: string,
  status: 'present' | 'absent',
  remarks?: string
): Promise<SelfAttendanceResult> {
  const cache = await loadAttendanceCache();
  const staff = getStaffById(staffId);

  if (!staff) {
    return {
      success: false,
      reason: 'STAFF_NOT_FOUND',
      message: 'Staff member record not found.',
    };
  }

  const recordId = `${staff.id}_${dateKey}`;
  const existing = cache[recordId];

  // Strictly enforce once-per-day submission
  if (existing && (existing.status === 'present' || existing.status === 'absent')) {
    return {
      success: false,
      reason: 'ALREADY_SUBMITTED',
      message: 'Attendance has already been recorded for today.',
      record: existing,
    };
  }

  const submissionTime = status === 'present' ? formatCurrentTimeString() : undefined;

  const newRecord: StaffAttendanceRecord = {
    id: recordId,
    staffId: staff.id,
    staffNameEnglish: staff.nameEnglish,
    staffNameTamil: staff.nameTamil,
    designationTamil: staff.designationTamil,
    designationEnglish: staff.designationEnglish,
    roleCategory: resolveRoleCategory(staff),
    dateKey,
    status,
    submissionTime,
    remarks: status === 'absent' ? remarks || 'சுய விடுப்பு பதிவு (Self Reported Leave)' : undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Self (Staff Portal)',
  };

  cache[recordId] = newRecord;
  await persistCache();

  return {
    success: true,
    record: newRecord,
  };
}

/**
 * Reset attendance data to seed state (useful for tests)
 */
export async function resetAttendanceService(): Promise<void> {
  attendanceCache = generateSeedAttendanceRecords();
  await persistCache();
}
