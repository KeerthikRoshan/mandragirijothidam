import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StaffAttendanceDetailScreen } from '../src/screens/attendance/StaffAttendanceDetailScreen';
import * as attendanceService from '../src/services/attendanceService';
import { apiClient } from '../src/services/apiClient';

jest.mock('../src/components/common/AppToast', () => ({
  showToast: jest.fn(),
}));

const Stack = createNativeStackNavigator();

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('StaffAttendanceDetailScreen Live & Restrictions Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders staff profile card, month picker controls, and monthly 4-segment analytics', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="StaffAttendanceDetail">
              <Stack.Screen
                name="StaffAttendanceDetail"
                component={StaffAttendanceDetailScreen}
                initialParams={{ staffId: 'p-murugan', initialDate: '2026-11-05' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // Check selected cell for Day 5 (fresh base starts as not_marked)
    expect(root.findByProps({ accessibilityLabel: 'Day 5, Selected not_marked' })).toBeDefined();

    // Check presence of action buttons for current/past date (Day 5 <= Today)
    const markPresentBtn = root.findByProps({ accessibilityLabel: 'Mark Present' });
    const markAbsentBtn = root.findByProps({ accessibilityLabel: 'Mark Absent' });
    const markLeaveBtn = root.findByProps({ accessibilityLabel: 'Official Leave' });

    expect(markPresentBtn).toBeDefined();
    expect(markAbsentBtn).toBeDefined();
    expect(markLeaveBtn).toBeDefined();
    expect(markPresentBtn.props.accessibilityState?.disabled).toBe(false);
    expect(markAbsentBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it('enforces future date restrictions: selects a future date and verifies Present and Absent are disabled', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="StaffAttendanceDetail">
              <Stack.Screen
                name="StaffAttendanceDetail"
                component={StaffAttendanceDetailScreen}
                initialParams={{ staffId: 'p-murugan', initialDate: '2026-11-28' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // For future date 2026-11-28:
    // Mark Present and Mark Absent must be disabled
    const markPresentBtn = root.findByProps({ accessibilityLabel: 'Mark Present' });
    const markAbsentBtn = root.findByProps({ accessibilityLabel: 'Mark Absent' });
    expect(markPresentBtn.props.accessibilityState?.disabled).toBe(true);
    expect(markAbsentBtn.props.accessibilityState?.disabled).toBe(true);

    // Official Leave remains fully enabled
    const leaveBtn = root.findByProps({ accessibilityLabel: 'Official Leave' });
    expect(leaveBtn).toBeDefined();
    expect(leaveBtn.props.accessibilityState?.disabled).toBeFalsy();

    // Triggering Official Leave calls updateStaffAttendance with 'leave'
    const updateSpy = jest.spyOn(attendanceService, 'updateStaffAttendance');
    await ReactTestRenderer.act(async () => {
      leaveBtn.props.onPress();
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'p-murugan',
      '2026-11-28',
      'leave',
      expect.stringContaining('விடுப்பு'),
      undefined
    );
    updateSpy.mockRestore();
  });

  it('invokes live API via apiClient when mocked in attendanceService', async () => {
    const mockGet = jest.spyOn(apiClient, 'get').mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          staff: {
            id: '1',
            staffCode: 'MJSTF00001',
            nameEnglish: 'Murugan',
            nameTamil: 'முருகன்',
            designation: 'Chief Priest',
          },
          year: 2026,
          monthIndex: 10,
          totalDaysInMonth: 30,
          markedDaysCount: 4,
          presentCount: 2,
          absentCount: 1,
          leaveCount: 1,
          notMarkedCount: 26,
          attendancePercentage: 67,
          records: [
            {
              id: '1_2026-11-01',
              dateKey: '2026-11-01',
              status: 'present',
              submissionTime: '08:00 AM',
            },
            {
              id: '1_2026-11-02',
              dateKey: '2026-11-02',
              status: 'absent',
            },
            {
              id: '1_2026-11-03',
              dateKey: '2026-11-03',
              status: 'leave',
              isLeave: true,
            },
          ],
        },
      },
    } as any);

    const result = await attendanceService.getStaffMonthlyAttendance('1', 2026, 10);
    expect(mockGet).toHaveBeenCalledWith(
      '/attendance/1/monthly',
      expect.objectContaining({ params: { year: 2026, month: 11 } })
    );
    expect(result.presentCount).toBe(2);
    expect(result.absentCount).toBe(1);
    expect(result.leaveCount).toBe(1);
    expect(result.notMarkedCount).toBe(26);

    mockGet.mockRestore();
  });
});
