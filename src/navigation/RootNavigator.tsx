/**
 * RootNavigator Component
 * Configures minimal root navigation stack for Mandhragiri Jothidam
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { DailyScheduleScreen } from '../screens/schedule/DailyScheduleScreen';
import { PriestScreen } from '../screens/priest/PriestScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AttendanceManagementScreen } from '../screens/attendance/AttendanceManagementScreen';
import { StaffAttendanceDetailScreen } from '../screens/attendance/StaffAttendanceDetailScreen';
import { StaffDashboardScreen } from '../screens/staff/StaffDashboardScreen';
import { StaffEventsScreen } from '../screens/staff/StaffEventsScreen';
import { StaffRemindersScreen } from '../screens/staff/StaffRemindersScreen';
import { StaffAttendanceScreen } from '../screens/staff/StaffAttendanceScreen';
import { StaffLeavesScreen } from '../screens/staff/StaffLeavesScreen';
import { StaffMoreScreen } from '../screens/staff/StaffMoreScreen';
import { AdminLeaveManagementScreen } from '../screens/admin/AdminLeaveManagementScreen';
import { UpcomingEventsScreen } from '../screens/events/UpcomingEventsScreen';
import { CompletedEventsScreen } from '../screens/events/CompletedEventsScreen';
import { FinancialAuditsScreen } from '../screens/financial/FinancialAuditsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* Animated Splash Screen: Plays animated MP4 then transitions to Login */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Authentication Stack: Login screen */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Dashboard Screen */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* Daily Schedule / நிகழ்வு அட்டவணை Screen */}
        <Stack.Screen name="DailySchedule" component={DailyScheduleScreen} />

        {/* Priest & Assistant / புரோகிதர் & உதவியாளர் Screen */}
        <Stack.Screen name="Priest" component={PriestScreen} />

        {/* Settings / அமைப்புகள் Screen */}
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Profile / நிர்வாகி சுயவிவரம் Screen */}
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Date-wise Attendance Management / பணியாளர் வருகை மேலாண்மை Screen */}
        <Stack.Screen name="AttendanceManagement" component={AttendanceManagementScreen} />

        {/* Individual Staff Attendance Details / தனிப்பட்ட பணியாளர் வருகை விவரம் Screen */}
        <Stack.Screen name="StaffAttendanceDetail" component={StaffAttendanceDetailScreen} />

        {/* Staff Portal: Dashboard (Priests & Assistants) */}
        <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />

        {/* Staff Portal: My Events Screen */}
        <Stack.Screen name="StaffEvents" component={StaffEventsScreen} />

        {/* Staff Portal: Reminders Screen */}
        <Stack.Screen name="StaffReminders" component={StaffRemindersScreen} />

        {/* Staff Portal: Personal Attendance Screen */}
        <Stack.Screen name="StaffAttendance" component={StaffAttendanceScreen} />

        {/* Staff Portal: Leave Application Screen */}
        <Stack.Screen name="StaffLeaves" component={StaffLeavesScreen} />

        {/* Staff Portal: More & Profile Screen */}
        <Stack.Screen name="StaffMore" component={StaffMoreScreen} />

        {/* Admin: Staff Leave Requests Management Screen */}
        <Stack.Screen name="AdminLeaveManagement" component={AdminLeaveManagementScreen} />

        {/* Dedicated Event & Financial Screens */}
        <Stack.Screen name="UpcomingEvents" component={UpcomingEventsScreen} />
        <Stack.Screen name="CompletedEvents" component={CompletedEventsScreen} />
        <Stack.Screen name="FinancialAudits" component={FinancialAuditsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
