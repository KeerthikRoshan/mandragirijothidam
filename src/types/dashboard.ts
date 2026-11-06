/**
 * Dashboard Type Definitions for Mandhragiri Jothidam
 * Strongly typed boundaries for UI and future API integration.
 */

export interface PanchangamInnerCard {
  id: string;
  category: string; // e.g. 'திதி • TITHI', 'நட்சத்திரம் • STAR', 'நல்ல நேரம்', 'ராகு காலம்'
  title: string; // e.g. 'சுக்கில துவாதசி', 'உத்திரம்', '09:15 – 10:15', '07:30 – 09:00'
  subtitle: string; // e.g. 'Dwadashi (பகல் 02:44 வரை)', 'Uthiram (மாலை 04:12 வரை)'
  badgeText?: string; // e.g. 'சுபம்', 'விலக்குக'
  badgeType?: 'success' | 'danger';
  iconType: 'lotus' | 'moon' | 'time' | 'alert';
}

export interface PanchangamData {
  titleTamil: string;
  gregorianDateBadge: string;
  tamilDateBadge: string;
  cards: PanchangamInnerCard[];
  actionText: string;
}

import type { ImageSourcePropType } from 'react-native';

export interface OverviewStatItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  image?: ImageSourcePropType;
  iconType?: 'calendar' | 'clock' | 'clipboard' | 'check';
  badgeColor?: string;
  iconColor?: string;
  valueColor?: string;
  accentColor?: string;
}

export interface LiveOperationData {
  time: string;
  title: string;
  subtitle: string;
  location: string;
  priestName: string;
}

export interface EventBookingItem {
  id: string;
  timeRange: string;
  category: string; // e.g. 'ஜாதகம்', 'வெளியூர்'
  categoryBg: string;
  categoryTextColor: string;
  iconType: 'book' | 'heart';
  iconBg: string;
  iconColor: string;
  titleTamil: string;
  titleEnglish: string;
  customerName: string;
  adminOrPriestInfo: string;
  location?: string;
  isPriestRow?: boolean;
  status: string; // e.g. 'உறுதியானது'
}

export type DashboardBottomTabId = 'home' | 'date' | 'priest' | 'settings' | 'profile';
