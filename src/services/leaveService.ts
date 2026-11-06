/**
 * Leave Request Service for Mandhragiri Jothidam
 * Handles staff leave applications, validations, status tracking,
 * and Admin approvals/rejections with audit logging.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIEST_MOCK_STAFF } from '../data/priestMockData';
import { LeaveRequest, LeaveStatus, LeaveType } from '../types/staffPortal';
import { addDays, formatDateKey } from '../utils/dateUtils';

const LEAVES_STORAGE_KEY = '@mandhragiri_staff_leaves_v1';

let leavesCache: Record<string, LeaveRequest> | null = null;

/**
 * Generate initial realistic seed leaves for testing
 */
function generateSeedLeaves(): Record<string, LeaveRequest> {
  const records: Record<string, LeaveRequest> = {};
  const today = new Date();

  // 1. Shastriji - Approved past leave
  const l1Id = 'leave-shastriji-1';
  records[l1Id] = {
    id: l1Id,
    staffId: 'p-shastriji',
    staffNameEnglish: 'Shastriji',
    staffNameTamil: 'சாஸ்திரிஜி வெங்கடேஸ்வரன்',
    designationTamil: 'அர்ச்சகர்',
    startDate: formatDateKey(addDays(today, -14)),
    endDate: formatDateKey(addDays(today, -13)),
    leaveType: 'personal',
    reason: 'குடும்ப சுபநிகழ்ச்சி (Family Function at Native Village)',
    status: 'approved',
    appliedAt: formatDateKey(addDays(today, -20)),
    decidedAt: formatDateKey(addDays(today, -18)),
    decidedBy: 'சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)',
    adminRemarks: 'அனுமதிக்கப்பட்டது (Approved). Have a blessed time.',
  };

  // 2. Ramu - Pending upcoming leave
  const l2Id = 'leave-ramu-1';
  records[l2Id] = {
    id: l2Id,
    staffId: 'p-ramu',
    staffNameEnglish: 'Ramu',
    staffNameTamil: 'ராமு சர்மா',
    designationTamil: 'உதவியாளர்',
    startDate: formatDateKey(addDays(today, 5)),
    endDate: formatDateKey(addDays(today, 7)),
    leaveType: 'medical',
    reason: 'பல் மருத்துவ சிகிச்சை மற்றும் பரிசோதனை (Dental Surgery & Rest)',
    status: 'pending',
    appliedAt: formatDateKey(today),
  };

  // 3. Sundaram - Rejected leave example
  const l3Id = 'leave-sundaram-1';
  records[l3Id] = {
    id: l3Id,
    staffId: 'p-sundaram',
    staffNameEnglish: 'Sundaram',
    staffNameTamil: 'சுந்தரம் தீட்சிதர்',
    designationTamil: 'வேத உதவியாளர்',
    startDate: formatDateKey(addDays(today, -30)),
    endDate: formatDateKey(addDays(today, -28)),
    leaveType: 'festival',
    reason: 'ஊர் திருவிழா பயணம் (Village Festival)',
    status: 'rejected',
    appliedAt: formatDateKey(addDays(today, -35)),
    decidedAt: formatDateKey(addDays(today, -34)),
    decidedBy: 'சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)',
    adminRemarks: 'முக்கிய கோவில் மஹோற்சவ தினங்கள் என்பதால் மாற்று தேதியில் விண்ணப்பிக்கவும்.',
  };

  // 4. Murugan - Approved upcoming temple visit
  const l4Id = 'leave-murugan-1';
  records[l4Id] = {
    id: l4Id,
    staffId: 'p-murugan',
    staffNameEnglish: 'Murugan',
    staffNameTamil: 'முருகன் சுவாமிகள்',
    designationTamil: 'தலைமை குருக்கள்',
    startDate: formatDateKey(addDays(today, 10)),
    endDate: formatDateKey(addDays(today, 12)),
    leaveType: 'temple_duty',
    reason: 'திருச்செந்தூர் கோவில் வருடாந்திர கும்பாபிஷேக பணி (Temple Consecration Duty)',
    status: 'approved',
    appliedAt: formatDateKey(addDays(today, -2)),
    decidedAt: formatDateKey(addDays(today, -1)),
    decidedBy: 'சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)',
    adminRemarks: 'அங்கீகரிக்கப்பட்டது (Official Temple Duty Approved).',
  };

  return records;
}

/**
 * Load cache from AsyncStorage
 */
async function loadLeavesCache(): Promise<Record<string, LeaveRequest>> {
  if (leavesCache) {
    return leavesCache;
  }
  try {
    const raw = await AsyncStorage.getItem(LEAVES_STORAGE_KEY);
    if (raw) {
      leavesCache = JSON.parse(raw);
      return leavesCache!;
    }
  } catch (_e) {}

  const seed = generateSeedLeaves();
  leavesCache = seed;
  try {
    await AsyncStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(seed));
  } catch (_e) {}
  return leavesCache;
}

/**
 * Persist leaves to AsyncStorage
 */
async function persistLeavesCache(): Promise<void> {
  if (!leavesCache) return;
  try {
    await AsyncStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leavesCache));
  } catch (_e) {}
}

/**
 * Get all leaves for a specific staff member
 */
export async function getLeavesForStaff(
  staffId: string
): Promise<LeaveRequest[]> {
  const cache = await loadLeavesCache();
  return Object.values(cache)
    .filter(l => l.staffId === staffId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

/**
 * Get all staff leaves (for Admin view)
 */
export async function getAllStaffLeaves(): Promise<LeaveRequest[]> {
  const cache = await loadLeavesCache();
  return Object.values(cache).sort((a, b) =>
    b.appliedAt.localeCompare(a.appliedAt)
  );
}

export interface NewLeaveInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: LeaveType;
  reason: string;
}

/**
 * Apply for a new leave request (from Staff Portal)
 */
export async function applyLeaveRequest(
  staffId: string,
  input: NewLeaveInput
): Promise<{ success: boolean; leave?: LeaveRequest; error?: string }> {
  const cache = await loadLeavesCache();
  const staff = PRIEST_MOCK_STAFF.find(p => p.id === staffId);

  if (!staff) {
    return { success: false, error: 'Staff account not found.' };
  }

  // 1. Date validation
  if (!input.startDate || !input.endDate) {
    return { success: false, error: 'Start date and end date are required.' };
  }

  if (input.startDate > input.endDate) {
    return {
      success: false,
      error: 'Leave start date cannot be after end date.',
    };
  }

  // 2. Reason validation
  if (!input.reason.trim() || input.reason.trim().length < 5) {
    return {
      success: false,
      error: 'Please enter a valid reason (at least 5 characters).',
    };
  }

  // 3. Overlap check
  const staffLeaves = Object.values(cache).filter(
    l => l.staffId === staffId && l.status !== 'rejected'
  );

  const hasOverlap = staffLeaves.some(l => {
    return (
      (input.startDate >= l.startDate && input.startDate <= l.endDate) ||
      (input.endDate >= l.startDate && input.endDate <= l.endDate) ||
      (input.startDate <= l.startDate && input.endDate >= l.endDate)
    );
  });

  if (hasOverlap) {
    return {
      success: false,
      error: 'You already have an active leave request for the selected dates.',
    };
  }

  const newId = `leave-${staffId}-${Date.now()}`;
  const newLeave: LeaveRequest = {
    id: newId,
    staffId: staff.id,
    staffNameEnglish: staff.nameEnglish,
    staffNameTamil: staff.nameTamil,
    designationTamil: staff.designationTamil,
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
  leavesCache = generateSeedLeaves();
  await persistLeavesCache();
}
