import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, Pressable, TextInput, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AttendanceManagementScreen } from '../src/screens/attendance/AttendanceManagementScreen';
import { StaffAttendanceDetailScreen } from '../src/screens/attendance/StaffAttendanceDetailScreen';
import * as attendanceService from '../src/services/attendanceService';

const Stack = createNativeStackNavigator();

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function extractText(node: any): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
}

describe('AttendanceManagementScreen - New Actions, Spacing, Keyboard & Month Picker', () => {
  it('renders pending staff actions for unrecorded staff', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="AttendanceManagement">
              <Stack.Screen
                name="AttendanceManagement"
                component={AttendanceManagementScreen}
                initialParams={{ initialDate: '2026-11-05' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // Pending staff member Venkat has "Mark Present" and "Mark Absent" action buttons
    const markPresentBtn = root.findByProps({ accessibilityLabel: 'Mark Venkat Present' });
    const markAbsentBtn = root.findByProps({ accessibilityLabel: 'Mark Venkat Absent' });
    expect(markPresentBtn).toBeDefined();
    expect(markAbsentBtn).toBeDefined();

    // Triggering Mark Absent invokes updateStaffAttendance
    const updateSpy = jest.spyOn(attendanceService, 'updateStaffAttendance');
    await ReactTestRenderer.act(async () => {
      markAbsentBtn.props.onPress();
    });
    expect(updateSpy).toHaveBeenCalledWith(
      'p-venkat',
      expect.any(String),
      'absent',
      'வரவில்லை (Absent)',
      undefined
    );
    updateSpy.mockRestore();
  });

  it('allows tapping month/year to open month-year picker modal and select a month', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="AttendanceManagement">
              <Stack.Screen
                name="AttendanceManagement"
                component={AttendanceManagementScreen}
                initialParams={{ initialDate: '2026-11-05' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // 1. Month/Year header button exists
    const monthYearBtn = root.findByProps({ accessibilityLabel: 'Select month and year' });
    expect(monthYearBtn).toBeDefined();

    // 2. Tap to open month picker modal
    await ReactTestRenderer.act(async () => {
      monthYearBtn.props.onPress();
    });

    // 3. Modal is open
    const modal = root.findByType(Modal);
    expect(modal.props.visible).toBe(true);

    // 4. Select March of current year
    const marchBtn = root.find(node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.includes('March')
    );
    expect(marchBtn).toBeDefined();

    await ReactTestRenderer.act(async () => {
      marchBtn.props.onPress();
    });

    // 5. Modal closes after month selection
    expect(modal.props.visible).toBe(false);
  });

  it('supports search input with returnKeyType and clear button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="AttendanceManagement">
              <Stack.Screen
                name="AttendanceManagement"
                component={AttendanceManagementScreen}
                initialParams={{ initialDate: '2026-11-05' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // 1. Search input exists with returnKeyType="search"
    const searchInput = root.findByType(TextInput);
    expect(searchInput.props.returnKeyType).toBe('search');

    // 2. Type query
    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('Shastriji');
    });

    // 3. Clear button appears
    const clearBtn = root.findByProps({ accessibilityLabel: 'Clear search' });
    expect(clearBtn).toBeDefined();

    // 4. Tap clear
    await ReactTestRenderer.act(async () => {
      clearBtn.props.onPress();
    });
    expect(searchInput.props.value).toBe('');
  });

  it('StaffAttendanceDetailScreen allows tapping month/year to open month-year picker modal without calendar icon', async () => {
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

    // 1. Verify calendar emoji is removed
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts.some(t => t.includes('🗓️'))).toBe(false);

    // 2. Month/Year header button exists
    const monthYearBtn = root.findByProps({ accessibilityLabel: 'Select month and year' });
    expect(monthYearBtn).toBeDefined();

    // 3. Tap to open month picker modal
    await ReactTestRenderer.act(async () => {
      monthYearBtn.props.onPress();
    });

    // 4. Modal is open
    const modals = root.findAllByType(Modal);
    const visibleModal = modals.find(m => m.props.visible === true);
    expect(visibleModal).toBeDefined();

    // 5. Select May of current year
    const mayBtn = root.find(node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.includes('May')
    );
    expect(mayBtn).toBeDefined();

    await ReactTestRenderer.act(async () => {
      mayBtn.props.onPress();
    });

    // 6. Modal closes and header updates
    expect(visibleModal!.props.visible).toBe(false);
  });
});
