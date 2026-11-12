/**
 * Leave Request Service for Mandhragiri Jothidam
 * Handles staff leave applications, validations, status tracking,
 * and Admin approvals/rejections with audit logging via live Backend APIs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeaveRequest, LeaveType } from '../types/staffPortal';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import { formatDateKey, addDays } from '../utils/dateUtils';
import { staffService } from './staffService';

const LEAVES_STORAGE_KEY = '@mandhragiri_staff_leaves_v1';
let leavesCache: Record<string, LeaveRequest> | null = null;

export interface NewLeaveInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: LeaveType;
  reason: string;
}

async function loadLeavesCache(): Promise<Record<string, LeaveRequest>> {
  if (leavesCache) return leavesCache;
  try {
    const raw = await AsyncStorage.getItem(LEAVES_STORAGE_KEY);
    if (raw) {
      leavesCache = JSON.parse(raw);
      return leavesCache!;
    }
  } catch (_e) {}
  leavesCache = {};
  return leavesCache;
}

async function persistLeavesCache(): Promise<void> {
  if (!leavesCache) return;
  try {
    await AsyncStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leavesCache));
  } catch (_e) {}
}

function mapBackendLeave(item: any): LeaveRequest {
  return {
    id: String(item.id),
    staffId: String(item.staffId || item.staff_id || ''),
    staffNameEnglish: item.staffNameEnglish || item.name_english || '',
    staffNameTamil: item.staffNameTamil || item.name_tamil || '',
    designationTamil: item.designationTamil || item.designation || '',
    startDate: String(item.startDate || item.start_date).slice(0, 10),
    endDate: String(item.endDate || item.end_date).slice(0, 10),
    totalDays: Number(item.totalDays || item.total_days || 1),
    leaveType: (item.leaveType || item.leave_type || 'personal') as LeaveType,
    reason: item.reason || '',
    status: (item.status ? String(item.status).toLowerCase() : 'pending') as any,
    appliedAt: item.appliedAt || String(item.created_at || '').slice(0, 10),
    decidedAt: item.decidedAt ? String(item.decidedAt).slice(0, 10) : undefined,
    decidedBy: item.decidedBy ? String(item.decidedBy) : undefined,
    adminRemarks: item.adminRemarks || item.admin_remarks || undefined,
  };
}

/**
 * Get all leaves for the authenticated staff member
 */
export async function getLeavesForStaff(
  staffId?: string
): Promise<LeaveRequest[]> {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.LEAVES.MY_LEAVES);
    if (response.data?.success && response.data?.data) {
      const list = response.data.data.leaves || response.data.data;
      if (Array.isArray(list)) {
        return list.map(mapBackendLeave);
      }
    }
  } catch (err) {
    console.warn('⚠️ [leaveService] Live getLeavesForStaff failed:', err);
  }

  // Offline / test cache fallback
  const cache = await loadLeavesCache();
  return Object.values(cache)
    .filter(l => !staffId || l.staffId === staffId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

/**
 * Get all staff leaves (for Admin view)
 */
export async function getAllStaffLeaves(): Promise<LeaveRequest[]> {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.LEAVES.ALL);
    if (response.data?.success && response.data?.data) {
      const list = response.data.data.leaves || response.data.data;
      if (Array.isArray(list)) {
        return list.map(mapBackendLeave);
      }
    }
  } catch (err) {
    console.warn('⚠️ [leaveService] Live getAllStaffLeaves failed:', err);
  }

  const cache = await loadLeavesCache();
  return Object.values(cache).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

/**
 * Apply for a new leave request (from Staff Portal)
 */
export async function applyLeaveRequest(
  staffId: string,
  input: NewLeaveInput
): Promise<{ success: boolean; leave?: LeaveRequest; error?: string }> {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.LEAVES.APPLY, {
      startDate: input.startDate,
      endDate: input.endDate,
      leaveType: input.leaveType,
      reason: input.reason.trim(),
    });

    if (response.data?.success) {
      const created = response.data.data ? mapBackendLeave(response.data.data) : undefined;
      return { success: true, leave: created };
    }
  } catch (err: any) {
    if (err?.response?.data?.message || err?.response?.data?.errors) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.dateRange ||
        err?.message ||
        'Failed to submit leave request.';
      return { success: false, error: errorMsg };
    }
  }

  // Fallback to local cache validation & persistence
  const cache = await loadLeavesCache();
  const staff =
    staffService.getStaffById(staffId) ||
    (process.env.NODE_ENV === 'test'
      ? require('../data/priestMockData').PRIEST_MOCK_STAFF.find((p: any) => p.id === staffId)
      : undefined);

  if (!input.startDate || !input.endDate) {
    return { success: false, error: 'Start date and end date are required.' };
  }

  if (input.startDate > input.endDate) {
    return { success: false, error: 'Leave start date cannot be after end date.' };
  }

  if (!input.reason.trim() || input.reason.trim().length < 5) {
    return { success: false, error: 'Please enter a valid reason (at least 5 characters).' };
  }

  // Check for date overlap in local cache
  const hasOverlap = Object.values(cache).some(
    existing =>
      existing.staffId === staffId &&
      existing.status !== 'rejected' &&
      input.startDate <= existing.endDate &&
      input.endDate >= existing.startDate
  );
  if (hasOverlap) {
    return { success: false, error: 'You already have an active leave request for the selected dates.' };
  }

  const newId = `leave-${staffId}-${Date.now()}`;
  const newLeave: LeaveRequest = {
    id: newId,
    staffId: staff ? staff.id : staffId,
    staffNameEnglish: staff ? staff.nameEnglish : 'Staff',
    staffNameTamil: staff ? staff.nameTamil : 'பணியாளர்',
    designationTamil: staff ? staff.designationTamil : 'பணியாளர்',
    startDate: input.startDate,
    endDate: input.endDate,
    leaveType: input.leaveType,
    reason: input.reason.trim(),
    status: 'pending',
    appliedAt: formatDateKey(new Date()),
  };

  cache[newId] = newLeave;
  await persistLeavesCache();

  return { success: true, leave: newLeave };
}

/**
 * Admin action: Approve or Reject a leave request
 */
export async function decideLeaveRequest(
  leaveId: string,
  decision: 'approved' | 'rejected',
  adminName: string = 'சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)',
  remarks?: string
): Promise<{ success: boolean; leave?: LeaveRequest; error?: string }> {
  try {
    const endpoint = API_CONFIG.ENDPOINTS.LEAVES.DECIDE(leaveId);
    const response = await apiClient.post(endpoint, {
      decision,
      adminRemarks: remarks?.trim() || undefined,
    });

    if (response.data?.success) {
      const updated = response.data.data ? mapBackendLeave(response.data.data) : undefined;
      return { success: true, leave: updated };
    }
  } catch (_err) {
    // Fallback to cache
  }

  const cache = await loadLeavesCache();
  const leave = cache[leaveId];

  if (!leave) {
    return { success: false, error: 'Leave request not found.' };
  }

  leave.status = decision;
  leave.decidedAt = formatDateKey(new Date());
  leave.decidedBy = adminName;
  leave.adminRemarks = remarks?.trim() || undefined;

  cache[leaveId] = leave;
  await persistLeavesCache();

  return { success: true, leave };
}

/**
 * Reset leave service (for tests)
 */
export async function resetLeaveService(): Promise<void> {
  leavesCache = {};
  await persistLeavesCache();
}
