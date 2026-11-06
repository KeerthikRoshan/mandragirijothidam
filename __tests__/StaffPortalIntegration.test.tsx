/**
 * StaffPortalIntegration.test.tsx
 * Comprehensive Integration & Unit Test Suite for Mandhragiri Jothidam Staff Portal
 *
 * Covers:
 * 1. Dual-Role Authentication & Session Persistence (authService & LoginScreen switch)
 * 2. Daily Attendance Swipe Control & Strict Once-Per-Day Rule (attendanceService & AttendanceSwipeControl)
 * 3. Assigned Events Management & Completion Workflow (eventService & StaffEventsScreen)
 * 4. Staff Reminders & Event Linking (reminderService & StaffRemindersScreen)
 * 5. Staff Personal Monthly Attendance History & Isolation (StaffAttendanceScreen)
 * 6. Leave Request Application, Overlap Validation & Admin Approval (leaveService & AdminLeaveManagementScreen)
 * 7. Staff Dashboard Screen Rendering (StaffDashboardScreen)
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { authService } from '../src/services/auth/authService';
import { apiClient } from '../src/services/apiClient';
import {
  getStaffAttendanceRecordForDate,
  resetAttendanceService,
  submitSelfAttendance,
} from '../src/services/attendanceService';
import {
  getEventsForStaff,
  getStaffEventCounts,
  getTodayEventsForStaff,
  markEventCompleted,
  resetEventService,
} from '../src/services/eventService';
import {
  completeReminder,
  getRemindersForStaff,
  resetReminderService,
} from '../src/services/reminderService';
import {
  applyLeaveRequest,
  decideLeaveRequest,
  getLeavesForStaff,
  resetLeaveService,
} from '../src/services/leaveService';

import { AttendanceSwipeControl } from '../src/components/attendance/AttendanceSwipeControl';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { StaffDashboardScreen } from '../src/screens/staff/StaffDashboardScreen';
import { StaffEventsScreen } from '../src/screens/staff/StaffEventsScreen';
import { StaffRemindersScreen } from '../src/screens/staff/StaffRemindersScreen';
import { StaffAttendanceScreen } from '../src/screens/staff/StaffAttendanceScreen';
import { StaffLeavesScreen } from '../src/screens/staff/StaffLeavesScreen';
import { AdminLeaveManagementScreen } from '../src/screens/admin/AdminLeaveManagementScreen';

import { addDays, formatDateKey } from '../src/utils/dateUtils';
import { StaffAttendanceRecord } from '../src/types/attendance';
import { setAppLanguage } from '../src/i18n';

const Stack = createNativeStackNavigator();

const initialMetrics = {
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

const extractText = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
};

const getAllRenderedText = (root: ReactTestRenderer.ReactTestInstance): string => {
  try {
    const textNodes = root.findAllByType(Text);
    return textNodes.map(t => extractText(t.props.children)).join(' ');
  } catch {
    return '';
  }
};

describe('Staff Portal Integration & Functional Suite', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('ta');
    });
    await authService.logout();
    await resetAttendanceService();
    await resetEventService();
    await resetReminderService();
    await resetLeaveService();
  });

  // =========================================================================
  // 1. Dual-Role Authentication & Session Persistence
  // =========================================================================
  describe('1. Dual-Role Authentication & Session Persistence', () => {
    it('authenticates a priest/assistant staff member with registered mobile number and PIN', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 200,
        data: {
          status: 1,
          success: true,
          message: 'பணியாளர் உள்நுழைவு வெற்றிகரமாக முடிந்தது',
          data: {
            token: 'staff-token-murugan',
            refreshToken: 'staff-refresh-murugan',
            user: {
              id: 'p-murugan',
              staffId: 'p-murugan',
              role: 'staff',
              staffRole: 'Priest',
              nameEnglish: 'Murugan',
              nameTamil: 'முருகன்',
              designationTamil: 'தலைமை குருக்கள்',
              designationEnglish: 'Chief Priest',
              phone: '+919840123456',
              phoneDisplay: '+91 98401 23456',
            },
          },
        },
      } as any);

      // p-murugan phone: "+919840123456"
      const result = await authService.loginStaff({
        countryCode: '+91',
        mobileNumber: '9840123456',
        password: '1234',
      });
      expect(result.status).toBe('success');
      expect(result.session).toBeDefined();
      expect(result.session?.role).toBe('staff');
      expect(result.session?.staffId).toBe('p-murugan');
      expect(result.session?.user.nameEnglish).toBe('Murugan');
      expect(result.session?.user.id).toBe('p-murugan');

      // Verify session was persisted
      const currentSession = await authService.getCurrentSession();
      expect(currentSession).not.toBeNull();
      expect(currentSession?.role).toBe('staff');
      expect(currentSession?.staffId).toBe('p-murugan');
      expect(currentSession?.user.nameEnglish).toBe('Murugan');

      const currentStaff = await authService.getCurrentStaff();
      expect(currentStaff.id).toBe('p-murugan');
      expect(currentStaff.nameTamil).toBe('முருகன்');

      mockPost.mockRestore();
    });

    it('rejects staff login with unregistered mobile number or incorrect credentials', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            status: 0,
            success: false,
            message: 'பதிவுசெய்யப்பட்ட பணியாளர் விபரம் காணப்படவில்லை (Staff record not found)',
            errors: { credentials: 'Staff record not found' },
          },
        },
      });

      const result = await authService.loginStaff({
        countryCode: '+91',
        mobileNumber: '9999999999',
        password: '1234',
      });
      expect(result.status).toBe('error');
      expect(result.message).toContain('காணப்படவில்லை');

      const session = await authService.getCurrentSession();
      expect(session).toBeNull();

      mockPost.mockRestore();
    });

    it('allows switching between staff sessions without session leak', async () => {
      await authService.setStaffSession('p-ramu');
      let staff = await authService.getCurrentStaff();
      expect(staff.id).toBe('p-ramu');
      expect(staff.nameEnglish).toBe('Ramu');

      await authService.setStaffSession('p-shastriji');
      staff = await authService.getCurrentStaff();
      expect(staff.id).toBe('p-shastriji');
      expect(staff.nameEnglish).toBe('Shastriji');
    });

    it('clears session completely on logout', async () => {
      await authService.setStaffSession('p-murugan');
      expect(await authService.getCurrentSession()).not.toBeNull();

      await authService.logout();
      expect(await authService.getCurrentSession()).toBeNull();
    });

    it('renders LoginScreen with SIGN IN AS divider and dual-role switch', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <LoginScreen />
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      // Verify the subtle divider and branding elements
      expect(allText).toContain('Mandhragiri Jothidam');
      expect(allText).toContain('உள்நுழையவும்');
      expect(allText).toContain('நிர்வாகி');
      expect(allText).toContain('புரோகிதர்');

      const adminButton = root.findByProps({ accessibilityLabel: 'Admin Login' });
      const staffButton = root.findByProps({ accessibilityLabel: 'Priest & Assistant Login' });

      expect(adminButton).toBeDefined();
      expect(staffButton).toBeDefined();

      // Tap staff button to switch role
      await ReactTestRenderer.act(async () => {
        staffButton.props.onPress();
        await new Promise(r => setTimeout(r, 60));
      });

      // Verify staff role indicator is active
      const updatedText = getAllRenderedText(root);
      expect(updatedText).toContain('புரோகிதர்');

      // Switch language to English and verify SIGN IN AS, Admin, and Priest
      const englishBtn = root.findByProps({ accessibilityLabel: 'Switch to English' });
      await ReactTestRenderer.act(async () => {
        englishBtn.props.onPress();
        await new Promise(r => setTimeout(r, 60));
      });

      const englishText = getAllRenderedText(root);
      expect(englishText).toContain('SIGN IN AS');
      expect(englishText).toContain('Admin');
      expect(englishText).toContain('Priest');
      expect(englishText).toContain('MOBILE NUMBER');
      expect(englishText).toContain('PASSWORD');
      expect(englishText).toContain('SIGN IN');
    });
  });

  // =========================================================================
  // 2. Daily Attendance Swipe Control & Strict Once-Per-Day Rule
  // =========================================================================
  describe('2. Daily Attendance & Once-Per-Day Enforcement', () => {
    const todayKey = formatDateKey(new Date());

    it('records self attendance as present for today and stores local time', async () => {
      // p-venkat has status 'not_marked' for today in seed data
      const res = await submitSelfAttendance('p-venkat', todayKey, 'present');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.record.status).toBe('present');
        expect(res.record.submissionTime).toBeDefined();
        expect(res.record.dateKey).toBe(todayKey);
      }

      const saved = await getStaffAttendanceRecordForDate('p-venkat', todayKey);
      expect(saved).not.toBeNull();
      expect(saved?.status).toBe('present');
    });

    it('strictly enforces the ONCE-PER-DAY rule and rejects subsequent submissions', async () => {
      // First submission for p-venkat succeeds
      const firstRes = await submitSelfAttendance('p-venkat', todayKey, 'present');
      expect(firstRes.success).toBe(true);

      // Attempt second submission on the same day (e.g. absent or present again)
      const secondRes = await submitSelfAttendance('p-venkat', todayKey, 'absent', 'Trying to change');
      expect(secondRes.success).toBe(false);
      if (!secondRes.success) {
        expect(secondRes.reason).toBe('ALREADY_SUBMITTED');
        expect(secondRes.message).toContain('Attendance has already been recorded');
        expect(secondRes.record?.status).toBe('present');
      }
    });

    it('rejects self-attendance submission for unknown staff member', async () => {
      const res = await submitSelfAttendance('unknown-staff-id', todayKey, 'present');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('STAFF_NOT_FOUND');
      }
    });

    it('renders swipe control instructions when no attendance is recorded yet', () => {
      const mockSwipe = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <AttendanceSwipeControl
            todayDateDisplay="29 அக்டோபர் 2026, வியாழன்"
            staffName="வெங்கட்ராமன்"
            designation="வேத உதவியாளர்"
            existingRecord={null}
            onSwipeAttendance={mockSwipe}
          />
        );
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      expect(allText).toContain('Swipe right for Present');
      expect(allText).toContain('Present');
      expect(allText).toContain('Absent');
    });

    it('renders locked confirmation card when attendance is already recorded for today', () => {
      const mockSwipe = jest.fn();
      const mockExistingRecord: StaffAttendanceRecord = {
        id: `p-murugan_${todayKey}`,
        staffId: 'p-murugan',
        staffNameEnglish: 'Murugan',
        staffNameTamil: 'முருகன் சுவாமிகள்',
        designationTamil: 'தலைமை குருக்கள்',
        roleCategory: 'priest',
        dateKey: todayKey,
        status: 'present',
        submissionTime: '08:30 AM',
        updatedAt: new Date().toISOString(),
      };

      let renderer: ReactTestRenderer.ReactTestRenderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <AttendanceSwipeControl
            todayDateDisplay="29 அக்டோபர் 2026, வியாழன்"
            staffName="முருகன் சுவாமிகள்"
            designation="தலைமை குருக்கள்"
            existingRecord={mockExistingRecord}
            onSwipeAttendance={mockSwipe}
          />
        );
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      // Verify locked confirmation card elements
      expect(allText).toContain("Today's Attendance Recorded (Present)");
      expect(allText).toContain('08:30 AM');
      expect(allText).toContain('Recorded once per day');
    });
  });

  // =========================================================================
  // 3. Assigned Events Management & Event Completion Workflow
  // =========================================================================
  describe('3. Assigned Events Management & Completion Workflow', () => {
    it('retrieves assigned events strictly isolated to the specified staff member', async () => {
      const muruganEvents = await getEventsForStaff('p-murugan');
      expect(muruganEvents.length).toBeGreaterThan(0);
      muruganEvents.forEach(event => {
        expect(event.staffId).toBe('p-murugan');
      });

      const ramuEvents = await getEventsForStaff('p-ramu');
      expect(ramuEvents.length).toBeGreaterThan(0);
      ramuEvents.forEach(event => {
        expect(event.staffId).toBe('p-ramu');
      });
    });

    it('retrieves today events and correct event metrics for staff', async () => {
      const todayEvents = await getTodayEventsForStaff('p-murugan');
      expect(todayEvents.length).toBeGreaterThan(0);

      const counts = await getStaffEventCounts('p-murugan');
      expect(counts.todayCount).toBeGreaterThanOrEqual(1);
      expect(counts.upcomingCount).toBeGreaterThanOrEqual(1);
      expect(counts.completedCount).toBeGreaterThanOrEqual(1);
    });

    it('allows assigned staff member to mark their event completed with notes and timestamp', async () => {
      const todayEvents = await getTodayEventsForStaff('p-murugan');
      const targetEvent = todayEvents[0];
      expect(targetEvent).toBeDefined();

      const completionResult = await markEventCompleted(
        targetEvent.id,
        'p-murugan',
        'அனைத்து சடங்குகளும் சுபவேளையில் சிறப்பாக நடந்தேறியது.'
      );

      expect(completionResult.success).toBe(true);
      expect(completionResult.event?.status).toBe('completed');
      expect(completionResult.event?.completedBy).toBe('p-murugan');
      expect(completionResult.event?.completedAt).toBeDefined();
      expect(completionResult.event?.completionNotes).toContain('அனைத்து சடங்குகளும்');
    });

    it('prevents an unauthorized staff member from marking someone else event completed', async () => {
      const muruganEvents = await getTodayEventsForStaff('p-murugan');
      const targetEvent = muruganEvents[0];

      const unauthorizedResult = await markEventCompleted(
        targetEvent.id,
        'p-ramu', // Ramu tries to complete Murugan's event
        'Unauthorized attempt'
      );

      expect(unauthorizedResult.success).toBe(false);
      expect(unauthorizedResult.message).toContain('Unauthorized');
    });
  });

  // =========================================================================
  // 4. Staff Reminders & Linked Event Automation
  // =========================================================================
  describe('4. Staff Reminders Management', () => {
    it('retrieves reminders for staff with today and upcoming distinction', async () => {
      const reminders = await getRemindersForStaff('p-murugan');
      expect(reminders.length).toBeGreaterThanOrEqual(3);

      const todayReminders = reminders.filter(r => r.isToday && r.status === 'pending');
      expect(todayReminders.length).toBeGreaterThanOrEqual(1);
    });

    it('allows staff to mark a pending reminder as completed', async () => {
      const reminders = await getRemindersForStaff('p-murugan');
      const pending = reminders.find(r => r.status === 'pending');
      expect(pending).toBeDefined();

      const result = await completeReminder(pending!.id, 'p-murugan');
      expect(result.success).toBe(true);
      expect(result.reminder?.status).toBe('completed');
      expect(result.reminder?.completedAt).toBeDefined();
    });
  });

  // =========================================================================
  // 5. Leave Requests: Application, Overlap Validation & Admin Decision Flow
  // =========================================================================
  describe('5. Staff Leave Requests & Admin Decision Flow', () => {
    const today = new Date();
    const futureStart = formatDateKey(addDays(today, 20));
    const futureEnd = formatDateKey(addDays(today, 22));

    it('validates date range and rejects requests where end date is before start date', async () => {
      const result = await applyLeaveRequest('p-murugan', {
        startDate: futureEnd,
        endDate: futureStart, // Invalid: end is before start
        leaveType: 'personal',
        reason: 'Invalid range',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Leave start date cannot be after end date.');
    });

    it('successfully submits a valid leave request in pending status', async () => {
      const result = await applyLeaveRequest('p-murugan', {
        startDate: futureStart,
        endDate: futureEnd,
        leaveType: 'temple_duty',
        reason: 'மதுரை மீனாட்சி சுந்தரேஸ்வரர் கோவில் விசேஷ யாகசாலை பணி',
      });

      expect(result.success).toBe(true);
      expect(result.leave).toBeDefined();
      expect(result.leave?.status).toBe('pending');
      expect(result.leave?.staffId).toBe('p-murugan');
      expect(result.leave?.staffNameEnglish).toBe('Murugan');
    });

    it('rejects duplicate or overlapping leave applications for the same staff member', async () => {
      // First submission
      await applyLeaveRequest('p-ramu', {
        startDate: futureStart,
        endDate: futureEnd,
        leaveType: 'medical',
        reason: 'மருத்துவ பரிசோதனை மற்றும் சிகிச்சை',
      });

      // Overlapping submission (starts inside existing range)
      const overlapStart = formatDateKey(addDays(today, 21));
      const overlapEnd = formatDateKey(addDays(today, 25));

      const overlapResult = await applyLeaveRequest('p-ramu', {
        startDate: overlapStart,
        endDate: overlapEnd,
        leaveType: 'personal',
        reason: 'Overlapping request with valid length',
      });

      expect(overlapResult.success).toBe(false);
      expect(overlapResult.error).toBe('You already have an active leave request for the selected dates.');
    });

    it('allows Admin to approve a pending leave request with administrative remarks', async () => {
      // Apply a new leave
      const newLeaveRes = await applyLeaveRequest('p-shastriji', {
        startDate: formatDateKey(addDays(today, 40)),
        endDate: formatDateKey(addDays(today, 42)),
        leaveType: 'personal',
        reason: 'குடும்ப விழா நிகழ்வு',
      });

      expect(newLeaveRes.success).toBe(true);
      const leaveId = newLeaveRes.leave!.id;

      // Admin decision: approve
      const decisionResult = await decideLeaveRequest(
        leaveId,
        'approved',
        'சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)',
        'அனுமதி வழங்கப்பட்டது. மாற்று அர்ச்சகர் நியமிக்கப்பட்டுள்ளார்.'
      );

      expect(decisionResult.success).toBe(true);
      expect(decisionResult.leave?.status).toBe('approved');
      expect(decisionResult.leave?.decidedBy).toContain('சுந்தரமூர்த்தி குருக்கள்');
      expect(decisionResult.leave?.adminRemarks).toContain('அனுமதி வழங்கப்பட்டது');

      // Verify it appears in staff's leave list
      const staffLeaves = await getLeavesForStaff('p-shastriji');
      const updated = staffLeaves.find(l => l.id === leaveId);
      expect(updated?.status).toBe('approved');
    });

    it('allows Admin to reject a pending leave request with feedback', async () => {
      const newLeaveRes = await applyLeaveRequest('p-sundaram', {
        startDate: formatDateKey(addDays(today, 45)),
        endDate: formatDateKey(addDays(today, 47)),
        leaveType: 'festival',
        reason: 'ஊர் திருவிழா பயணம்',
      });

      const leaveId = newLeaveRes.leave!.id;

      const decisionResult = await decideLeaveRequest(
        leaveId,
        'rejected',
        'Chief Administrator',
        'கோவில் மகா சிவராத்திரி தினங்கள் என்பதால் மாற்று தேதியில் விண்ணப்பிக்கவும்.'
      );

      expect(decisionResult.success).toBe(true);
      expect(decisionResult.leave?.status).toBe('rejected');
      expect(decisionResult.leave?.adminRemarks).toContain('சிவராத்திரி');
    });
  });

  // =========================================================================
  // 6. UI Screen Renderings & Navigation Integration
  // =========================================================================
  describe('6. Staff Portal Screens Rendering & Navigation Integration', () => {
    it('renders StaffDashboardScreen with greeting, attendance swipe, events, and shortcuts', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="StaffDashboard"
                  component={StaffDashboardScreen}
                  initialParams={{ staffId: 'p-murugan' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      // Verify Vedic greeting and staff profile
      expect(allText).toContain('வணக்கம்');
      expect(allText).toContain('முருகன்');
      expect(allText).toContain('தலைமை');

      // Verify Today's Events section
      expect(allText).toContain("Today's Events");

      // Verify Quick Shortcuts
      expect(allText).toContain('Quick Links');
    });

    it('renders StaffEventsScreen with Today, Upcoming, and Completed filter tabs', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="StaffEvents"
                  component={StaffEventsScreen}
                  initialParams={{ staffId: 'p-murugan' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      expect(allText).toContain('எனது நிகழ்வுகள்');
      expect(allText).toContain('இன்று (Today)');
      expect(allText).toContain('அடுத்து (Upcoming)');
      expect(allText).toContain('நிறைவு (Done)');
    });

    it('renders StaffAttendanceScreen with monthly metrics and isolated records', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="StaffAttendance"
                  component={StaffAttendanceScreen}
                  initialParams={{ staffId: 'p-murugan' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      expect(allText).toContain('எனது வருகை');
      expect(allText).toContain('வருகை (Present)');
      expect(allText).toContain('விடுப்பு (Absent)');
      expect(allText).toContain('2026');
    });

    it('renders StaffRemindersScreen with category tabs and actionable tasks', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="StaffReminders"
                  component={StaffRemindersScreen}
                  initialParams={{ staffId: 'p-murugan' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      const root = renderer!.root;
      const allText = getAllRenderedText(root);

      expect(allText).toContain('நினைவூட்டல்கள்');
      expect(allText).toContain('இன்று (Today)');
      expect(allText).toContain('அடுத்து (Upcoming)');
      expect(allText).toContain('நிறைவு (Done)');
    });

    it('renders StaffLeavesScreen with leave application triggers and tabs in Tamil and English', async () => {
      // 1. Render in Tamil
      await setAppLanguage('ta');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="StaffLeaves"
                  component={StaffLeavesScreen}
                  initialParams={{ staffId: 'p-murugan' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      let root = renderer!.root;
      let allText = getAllRenderedText(root);

      expect(allText).toContain('விடுப்பு விண்ணப்பங்கள்');
      expect(allText).toContain('புதிய விடுப்பு விண்ணப்பிக்க');
      expect(allText).toContain('நிலுவை');
      expect(allText).toContain('அங்கீகரிக்கப்பட்டது');

      // 2. Switch to English dynamically and verify bilingual rendering
      await ReactTestRenderer.act(async () => {
        await setAppLanguage('en');
        await new Promise(r => setTimeout(r, 60));
      });

      allText = getAllRenderedText(root);
      expect(allText).toContain('Staff Leave Application');
      expect(allText).toContain('+ Apply for Leave');
      expect(allText).toContain('Pending');
      expect(allText).toContain('Approved');

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('renders AdminLeaveManagementScreen with all staff requests and decision controls in Tamil and English', async () => {
      // 1. Render in Tamil
      await setAppLanguage('ta');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="AdminLeaveManagement"
                  component={AdminLeaveManagementScreen}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        await new Promise(r => setTimeout(r, 60));
      });

      let root = renderer!.root;
      let allText = getAllRenderedText(root);

      expect(allText).toContain('பணியாளர் விடுப்பு மேலாண்மை');
      expect(allText).toContain('நிலுவை (Pending)');
      expect(allText).toContain('அங்கீகரித்தவை');
      expect(allText).toContain('நிராகரித்தவை');
      expect(allText).toContain('அனைத்தும்');

      // 2. Switch to English dynamically and verify bilingual rendering
      await ReactTestRenderer.act(async () => {
        await setAppLanguage('en');
        await new Promise(r => setTimeout(r, 60));
      });

      allText = getAllRenderedText(root);
      expect(allText).toContain('Staff Leave Management');
      expect(allText).toContain('Pending');
      expect(allText).toContain('Approved');
      expect(allText).toContain('Rejected');
      expect(allText).toContain('All');

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });
  });
});
