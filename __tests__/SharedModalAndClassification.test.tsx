import React from 'react';
import { Modal, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DailyScheduleScreen } from '../src/screens/schedule/DailyScheduleScreen';
import { PriestScreen } from '../src/screens/priest/PriestScreen';
import { BookingDetailModal } from '../src/components/common/BookingDetailModal';
import { BookingCard } from '../src/components/schedule/BookingCard';
import { PriestBookingTabs } from '../src/components/priest/PriestBookingTabs';
import { getPriestBookingCategories } from '../src/utils/priestBookingSelectors';
import {
  getBookingDateTimes,
  classifyTodayBooking,
  sortTodayBookingsByStatusOrder,
} from '../src/utils/bookingRules';
import { calculateBookingTimings } from '../src/utils/timeCalculation';
import { bookingApiService } from '../src/services/bookingApiService';
import { staffService } from '../src/services/staffService';
import { ScheduleBooking } from '../src/types/schedule';
import { PriestStaffItem } from '../src/types/priest';
import { formatDateKey } from '../src/utils/dateUtils';

const Stack = createNativeStackNavigator();

const extractText = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
};

const initialMetrics = {
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

describe('Shared Pooja Details Modal, Animations & Event Classification', () => {
  const todayKey = formatDateKey(new Date());

  const testBooking: ScheduleBooking = {
    id: 'test-bk-100',
    bookingNumber: 'BK-TEST-100',
    date: todayKey,
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    timeSlot: '10:00 AM - 11:30 AM',
    durationMinutes: 90,
    titleTamil: 'சண்டி ஹோமம்',
    titleEnglish: 'Chandi Homam',
    clientName: 'கல்யாணசுந்தரம்',
    clientPhone: '9840122334',
    locationTamil: 'கோவில் வளாகம்',
    priestNameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
    category: 'temple',
    status: 'confirmed',
    totalEventCharge: 15000,
    clientAdvanceAmount: 5000,
    clientTotalReceived: 5000,
    clientBalanceAmount: 10000,
    clientPaymentStatus: 'partial',
  };

  const mockPriest: PriestStaffItem = {
    id: '1',
    staffId: 'MJSTF00001',
    nameEnglish: 'Sundaramoorthy Gurukkal',
    nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
    role: 'Priest',
    roleBadge: 'Priest',
    designationTamil: 'தலைமை அர்ச்சகர்',
    phone: '+919840123456',
    status: 'active',
    bookings: [
      {
        ...testBooking,
        id: 'bk-live-now',
        date: todayKey,
        startTime: '12:01 AM',
        endTime: '11:59 PM',
        durationMinutes: 24 * 60,
        timeSlot: '12:01 AM - 11:59 PM',
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(bookingApiService, 'listBookings').mockResolvedValue([testBooking]);
    jest.spyOn(bookingApiService, 'getBookingsByDate').mockResolvedValue([testBooking]);
    jest.spyOn(bookingApiService, 'getPriestBookings').mockResolvedValue(mockPriest.bookings);
    jest.spyOn(staffService, 'fetchStaff').mockResolvedValue([mockPriest]);
    jest.spyOn(staffService, 'getAllStaff').mockReturnValue([mockPriest]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. DailyScheduleScreen opens the shared BookingDetailModal when a booking is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name="DailySchedule"
                component={DailyScheduleScreen}
                initialParams={{ initialDate: todayKey }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const cards = root.findAllByType(BookingCard);
    expect(cards.length).toBeGreaterThan(0);

    // Tap booking card
    await ReactTestRenderer.act(async () => {
      cards[0].props.onPress();
    });

    const modal = root.findByType(BookingDetailModal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.booking).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('2. PriestScreen opens the shared BookingDetailModal when a booking is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <PriestScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    // Wait for staff & priest bookings fetch
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const root = renderer.root;
    const cards = root.findAllByType(BookingCard);
    expect(cards.length).toBeGreaterThan(0);

    // Tap booking card
    await ReactTestRenderer.act(async () => {
      cards[0].props.onPress();
    });

    const modal = root.findByType(BookingDetailModal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.booking).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('3. BookingDetailModal renders with animationType="fade"', () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <BookingDetailModal
            visible={true}
            booking={testBooking}
            onClose={() => {}}
          />
        </SafeAreaProvider>
      );
    });

    const modalInstance = renderer.root.findByType(Modal);
    expect(modalInstance.props.animationType).toBe('fade');

    ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  it('4. Event Classification: Correctly distinguishes Upcoming, Live, and Completed using true date-times', () => {
    const anchor = new Date('2026-11-07T10:00:00+05:30');

    // Past booking (ended at 09:30 AM today)
    const pastBooking: ScheduleBooking = {
      id: 'bk-past',
      date: '2026-11-07',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      durationMinutes: 90,
      titleTamil: 'கடந்த நிகழ்வு',
      status: 'confirmed',
      clientName: 'பக்தர் 1',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '08:00 AM - 09:30 AM',
    };

    // Live booking (09:30 AM - 11:30 AM today, anchor is 10:00 AM)
    const liveBooking: ScheduleBooking = {
      id: 'bk-live',
      date: '2026-11-07',
      startTime: '09:30 AM',
      endTime: '11:30 AM',
      durationMinutes: 120,
      titleTamil: 'தற்போதைய நிகழ்வு',
      status: 'confirmed',
      clientName: 'பக்தர் 2',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '09:30 AM - 11:30 AM',
    };

    // Upcoming booking (02:00 PM - 03:00 PM today)
    const upcomingBooking: ScheduleBooking = {
      id: 'bk-upcoming',
      date: '2026-11-07',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      durationMinutes: 60,
      titleTamil: 'வரவிருக்கும் நிகழ்வு',
      status: 'confirmed',
      clientName: 'பக்தர் 3',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '02:00 PM - 03:00 PM',
    };

    const categories = getPriestBookingCategories(
      [pastBooking, liveBooking, upcomingBooking],
      anchor
    );

    // Strict classification validation:
    expect(categories.past.map(b => b.id)).toEqual(['bk-past']);
    expect(categories.active.map(b => b.id)).toEqual(['bk-live']);
    expect(categories.upcoming.map(b => b.id)).toEqual(['bk-upcoming']);

    // Zero duplicates across lists
    expect(categories.counts.total).toBe(3);
    expect(categories.counts.past).toBe(1);
    expect(categories.counts.active).toBe(1);
    expect(categories.counts.upcoming).toBe(1);
  });

  it('5. Midnight rollover & > 24 hours duration calculations work without losing day offset', () => {
    // 7:00 AM start, 17 hrs duration -> ends at 12:00 AM Next Day
    const res17 = calculateBookingTimings('07:00 AM', 17 * 60, '2026-11-07');
    expect(res17.endTime12).toBe('12:00 AM');
    expect(res17.daysOffset).toBe(1);
    expect(res17.crossesMidnight).toBe(true);

    // 7:00 AM start, 30 hrs duration -> ends at 1:00 PM Next Day (+1 Day)
    const res30 = calculateBookingTimings('07:00 AM', 30 * 60, '2026-11-07');
    expect(res30.endTime12).toBe('01:00 PM');
    expect(res30.daysOffset).toBe(1);
    expect(res30.endDateTime.getTime()).toBeGreaterThan(res30.startDateTime.getTime());

    // Booking crossing midnight classified correctly
    const midnightBooking: ScheduleBooking = {
      id: 'bk-midnight',
      date: '2026-11-07',
      startTime: '07:00 AM',
      endTime: '12:00 AM',
      durationMinutes: 17 * 60,
      daysOffset: 1,
      titleTamil: 'அஹோராத்ர பூஜை',
      status: 'confirmed',
      clientName: 'பக்தர்',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '07:00 AM - 12:00 AM (Next Day)',
    };

    const times = getBookingDateTimes(midnightBooking);
    expect(times.endDateTime.getTime()).toBeGreaterThan(times.startDateTime.getTime());
    // At 11:00 PM on 2026-11-07, it should still be LIVE
    const checkTime = new Date('2026-11-07T23:00:00+05:30');
    expect(checkTime.getTime()).toBeLessThan(times.endDateTime.getTime());
    expect(checkTime.getTime()).toBeGreaterThan(times.startDateTime.getTime());
  });

  it('6. Past events are not restricted to today and are sorted most recently completed first', () => {
    const anchor = new Date('2026-11-07T12:00:00+05:30');

    const pastOlder: ScheduleBooking = {
      id: 'bk-old',
      date: '2026-11-01',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      durationMinutes: 60,
      titleTamil: 'பழைய நிகழ்வு',
      status: 'completed',
      clientName: 'பக்தர் A',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '09:00 AM - 10:00 AM',
    };

    const pastRecent: ScheduleBooking = {
      id: 'bk-recent',
      date: '2026-11-06',
      startTime: '04:00 PM',
      endTime: '05:00 PM',
      durationMinutes: 60,
      titleTamil: 'நேற்றைய நிகழ்வு',
      status: 'completed',
      clientName: 'பக்தர் B',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '04:00 PM - 05:00 PM',
    };

    const categories = getPriestBookingCategories([pastOlder, pastRecent], anchor);
    expect(categories.past.length).toBe(2);
    // Most recently completed first: Nov 6 comes before Nov 1
    expect(categories.past[0].id).toBe('bk-recent');
    expect(categories.past[1].id).toBe('bk-old');
  });

  it('7. BookingCard displays Completed (✓ முடிவுற்றது) for an ended booking even if status is confirmed', () => {
    // Booking ended 2 hours ago
    const endedBooking: ScheduleBooking = {
      id: 'bk-ended',
      date: '2020-01-01', // Past date
      startTime: '08:00 AM',
      endTime: '09:00 AM',
      durationMinutes: 60,
      titleTamil: 'முடிவுற்ற பூஜை',
      status: 'confirmed', // Saved as confirmed in DB
      clientName: 'பக்தர்',
      locationTamil: 'கோவில்',
      priestNameTamil: 'சுவாமி',
      category: 'temple',
      timeSlot: '08:00 AM - 09:00 AM',
    };

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <BookingCard booking={endedBooking} />
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Must NOT display "உறுதி செய்யப்பட்டது" (Confirmed)
    expect(texts).not.toContain('✓ உறுதி செய்யப்பட்டது');
    // Must display "முடிவுற்றது" (Completed)
    expect(texts.some(t => t.includes('முடிவுற்றது') || t.includes('Completed'))).toBe(true);

    ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  it('8. Today Overview counts strictly satisfy: Total === Live + Upcoming + Completed', () => {
    const today = formatDateKey(new Date());

    const bookings: ScheduleBooking[] = [
      {
        id: 'b-1',
        date: today,
        startTime: '01:00 AM',
        endTime: '02:00 AM',
        status: 'confirmed',
        titleTamil: 'காலை பூஜை',
        clientName: 'பக்தர் 1',
        category: 'temple',
      },
      {
        id: 'b-2',
        date: today,
        startTime: '11:00 PM',
        endTime: '11:59 PM',
        status: 'confirmed',
        titleTamil: 'இரவு பூஜை',
        clientName: 'பக்தர் 2',
        category: 'temple',
      },
    ];

    const now = new Date();
    const live = bookings.filter(b => classifyTodayBooking(b, now) === 'LIVE');
    const upcoming = bookings.filter(b => classifyTodayBooking(b, now) === 'UPCOMING');
    const completed = bookings.filter(b => classifyTodayBooking(b, now) === 'COMPLETED');

    expect(bookings.length).toBe(live.length + upcoming.length + completed.length);
  });
});
