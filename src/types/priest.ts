/**
 * Priest and Assistant Type Definitions for Mandhragiri Jothidam
 */

import { ImageSourcePropType } from 'react-native';
import { ScheduleBooking } from './schedule';

export type PriestBookingTab = 'past' | 'active' | 'upcoming';
export type PriestStatus = 'active' | 'inactive';

export interface PriestStats {
  total: number;
  thisWeek: number;
  conflicts: number;
}

export interface PriestTabCounts {
  past: number;
  active: number;
  upcoming: number;
}

export interface PriestStaffItem {
  id: string;
  nameEnglish: string;
  nameTamil: string;
  designationTamil: string;
  designationEnglish?: string;
  roleBadge?: string; // e.g. "SENIOR LEAD"
  fullTitleTamil: string;
  traditionTamil: string;
  traditionEnglish?: string;
  certificationTamil: string;
  certificationEnglish: string;
  phone: string;
  phoneDisplay: string;
  expertiseTamil: string;
  languagesTamil: string;
  avatar?: ImageSourcePropType | null;
  status: PriestStatus;
  bookings: ScheduleBooking[];
  stats?: PriestStats;
  tabCounts?: PriestTabCounts;
  scheduledPoojasCount?: number;
  role?: string;
  password?: string;
  staffId?: string;
  email?: string;
}
