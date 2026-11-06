/**
 * Staff Portal Type Definitions for Mandhragiri Jothidam
 * Unified interfaces for Priests & Assistants Staff Portal:
 * - Authentication & Role management
 * - Assigned Events & Event Completion
 * - Staff Reminders
 * - Leave Applications & Admin Decisions
 */

import { BookingCategory, BookingStatus } from './schedule';

export type UserRole = 'admin' | 'staff';

export interface StaffUserProfile {
  id: string; // e.g. "1" or "p-murugan"
  staffId?: string; // e.g. "MJSTF00001"
  role: 'staff';
  staffRole?: string; // e.g. "Priest" or "Assistant"
  nameEnglish: string;
  nameTamil: string;
  designationTamil: string;
  designationEnglish?: string;
  designation?: string;
  roleBadge?: string; // e.g. "Priest" or "SENIOR LEAD"
  roleCategory?: string;
  phone: string;
  phoneDisplay?: string;
  traditionTamil?: string;
  tradition?: string;
  certificationTamil?: string;
  certification?: string;
  expertiseTamil?: string;
  expertise?: string;
  languagesTamil?: string;
  languagesSpoken?: string;
  avatarUrl?: string | null;
  status?: string;
}

export interface AdminUserProfile {
  id: string;
  role: 'admin';
  nameEnglish: string;
  nameTamil: string;
  title: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
  status?: string;
}

export type AuthUserProfile = StaffUserProfile | AdminUserProfile;

export interface StaffAssignedEvent {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  startTime: string;
  endTime: string;
  titleTamil: string;
  titleEnglish?: string;
  category: BookingCategory;
  categoryLabelTamil: string;
  status: BookingStatus;
  statusLabelTamil: string;
  clientName: string;
  clientPhone: string;
  locationTamil: string;
  locationEnglish?: string;
  notesTamil?: string;
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
}

export type ReminderStatus = 'pending' | 'completed';

export interface StaffReminder {
  id: string;
  staffId: string;
  eventId?: string;
  title: string;
  titleTamil: string;
  description: string;
  descriptionTamil: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:00 AM"
  status: ReminderStatus;
  isToday: boolean;
  createdAt: string;
  completedAt?: string;
}

export type LeaveType =
  | 'personal'
  | 'medical'
  | 'temple_duty'
  | 'festival'
  | 'emergency';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffNameEnglish: string;
  staffNameTamil: string;
  designationTamil: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  adminRemarks?: string;
}
