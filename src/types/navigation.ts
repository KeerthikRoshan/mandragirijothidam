/**
 * Navigation Type Definitions for Mandhragiri Jothidam
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  DailySchedule: { initialDate?: string } | undefined;
  Priest: undefined;
  Settings: undefined;
  Profile: undefined;
  AttendanceManagement: { initialDate?: string } | undefined;
  StaffAttendanceDetail: { staffId: string; initialDate?: string };
  // Staff Portal Routes
  StaffDashboard: { staffId?: string } | undefined;
  StaffEvents: { staffId?: string; filter?: 'today' | 'upcoming' | 'completed' } | undefined;
  StaffReminders: { staffId?: string } | undefined;
  StaffAttendance: { staffId?: string; initialDate?: string } | undefined;
  StaffLeaves: { staffId?: string } | undefined;
  StaffMore: { staffId?: string } | undefined;
  // Admin Leave Management Route
  AdminLeaveManagement: undefined;
  // Event & Audit Routes
  UpcomingEvents: undefined;
  CompletedEvents: undefined;
  FinancialAudits: undefined;
};

export type AttendanceManagementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AttendanceManagement'
>;

export type AttendanceManagementScreenRouteProp = RouteProp<
  RootStackParamList,
  'AttendanceManagement'
>;

export type StaffAttendanceDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffAttendanceDetail'
>;

export type StaffAttendanceDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffAttendanceDetail'
>;

export type PriestScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Priest'
>;

export type PriestScreenRouteProp = RouteProp<
  RootStackParamList,
  'Priest'
>;

export type DashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

export type DashboardScreenRouteProp = RouteProp<
  RootStackParamList,
  'Dashboard'
>;

export type DailyScheduleScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DailySchedule'
>;

export type DailyScheduleScreenRouteProp = RouteProp<
  RootStackParamList,
  'DailySchedule'
>;

export type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export type SettingsScreenRouteProp = RouteProp<
  RootStackParamList,
  'Settings'
>;

export type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

export type ProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  'Profile'
>;

export type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

export type SplashScreenRouteProp = RouteProp<RootStackParamList, 'Splash'>;

export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

export type StaffDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffDashboard'
>;
export type StaffDashboardScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffDashboard'
>;

export type StaffEventsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffEvents'
>;
export type StaffEventsScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffEvents'
>;

export type StaffRemindersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffReminders'
>;
export type StaffRemindersScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffReminders'
>;

export type StaffAttendanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffAttendance'
>;
export type StaffAttendanceScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffAttendance'
>;

export type StaffLeavesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffLeaves'
>;
export type StaffLeavesScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffLeaves'
>;

export type StaffMoreScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StaffMore'
>;
export type StaffMoreScreenRouteProp = RouteProp<
  RootStackParamList,
  'StaffMore'
>;

export type AdminLeaveManagementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminLeaveManagement'
>;
export type AdminLeaveManagementScreenRouteProp = RouteProp<
  RootStackParamList,
  'AdminLeaveManagement'
>;

export type UpcomingEventsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UpcomingEvents'
>;
export type UpcomingEventsScreenRouteProp = RouteProp<
  RootStackParamList,
  'UpcomingEvents'
>;

export type CompletedEventsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CompletedEvents'
>;
export type CompletedEventsScreenRouteProp = RouteProp<
  RootStackParamList,
  'CompletedEvents'
>;

export type FinancialAuditsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FinancialAudits'
>;
export type FinancialAuditsScreenRouteProp = RouteProp<
  RootStackParamList,
  'FinancialAudits'
>;
