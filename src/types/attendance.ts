/**
 * Staff Attendance Type Definitions for Mandhragiri Jothidam
 * Supports Priests and Assistants combined attendance tracking.
 */

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not_marked';

export interface StaffAttendanceRecord {
  /** Unique primary key: `${staffId}_${dateKey}` ensures one record per staff per date */
  id: string;
  staffId: string;
  staffCode?: string;
  staffNameEnglish: string;
  staffNameTamil: string;
  designationTamil: string;
  designationEnglish: string;
  roleCategory: 'priest' | 'assistant';
  dateKey: string; // YYYY-MM-DD
  status: AttendanceStatus;
  isLeave?: boolean;
  submissionTime?: string; // e.g. "08:15 AM"
  remarks?: string; // e.g. "மருத்துவ விடுப்பு (Medical Leave)"
  phone?: string;
  avatarUrl?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DateAttendanceSummary {
  dateKey: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  notMarkedCount: number;
}

export interface StaffMonthlyAttendanceSummary {
  staffId: string;
  staffNameEnglish: string;
  staffNameTamil: string;
  designationTamil: string;
  designationEnglish: string;
  year: number;
  monthIndex: number;
  totalDaysInMonth: number;
  markedDaysCount: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  notMarkedCount: number;
  attendancePercentage: number;
  records: StaffAttendanceRecord[];
}
