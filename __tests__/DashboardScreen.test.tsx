import React from 'react';
import { Text, Pressable } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DashboardScreen } from '../src/screens/dashboard/DashboardScreen';
import { bookingApiService } from '../src/services/bookingApiService';
import { formatDateKey } from '../src/utils/dateUtils';
import { TodayBookingCard } from '../src/components/dashboard/TodayBookingCard';
import { BookingDetailModal } from '../src/components/dashboard/BookingDetailModal';
import { ScheduleBooking } from '../src/types/schedule';

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

describe('DashboardScreen Component', () => {
  const todayKey = formatDateKey(new Date());

  const mockBooking: ScheduleBooking = {
    id: 'b-today-1',
    bookingNumber: 'BK-TODAY-001',
    date: todayKey,
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    timeSlot: '09:00 AM - 10:00 AM',
    durationMinutes: 60,
    titleTamil: 'கணபதி ஹோமம்',
    titleEnglish: 'Ganapathi Homam',
    clientName: 'ரமேஷ்',
    clientPhone: '9840123456',
    locationTamil: 'சென்னை',
    priestNameTamil: 'சுவாமி முருகன்',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'confirmed',
    statusLabelTamil: 'உறுதி செய்யப்பட்டது',
    totalEventCharge: 5000,
    clientAdvanceAmount: 2000,
    clientTotalReceived: 2000,
    clientBalanceAmount: 3000,
    clientPaymentStatus: 'partial',
    venueType: 'home',
  };

  beforeEach(() => {
    jest.spyOn(bookingApiService, 'getBookingsByDate').mockResolvedValue([mockBooking]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all sections and today events matching the updated reference design', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <DashboardScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Section 1: Top App Header
    expect(texts).toContain('மந்திரகிரி ஜோதிடம்');

    // Section 2: Dashboard Welcome Area
    expect(texts).toContain('வணக்கம், நிர்வாகி');

    // Section 3: Today's Panchangam
    expect(texts).toContain('இன்றைய');
    expect(texts).toContain('பஞ்சாங்கம்');
    expect(texts).toContain('சுக்கில துவாதசி');

    // Section 4: Today's Overview
    expect(texts).toContain('இன்றைய நிலை');
    expect(texts).toContain('அறிக்கைகள் ›');

    // Section 5: Today's Events
    expect(texts).toContain('இன்றைய நிகழ்வுகள்');
    expect(texts.some(t => t.includes('கணபதி ஹோமம்') || t.includes('Ganapathi Homam'))).toBe(true);
    expect(texts.some(t => t.includes('ரமேஷ்'))).toBe(true);

    // Section 6: Floating Action Button
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('(New)');

    // Section 7: Bottom Navigation
    expect(texts).toContain('முகப்பு');
    expect(texts).toContain('நாள்வாரி');
    expect(texts).toContain('புரோகிதர்');
    expect(texts).toContain('அமைப்புகள்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('opens BookingDetailModal when a booking card in Today Events is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <DashboardScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;

    // Find TodayBookingCard component directly
    const bookingCards = root.findAllByType(TodayBookingCard);
    expect(bookingCards.length).toBeGreaterThan(0);

    // Tap the booking card
    await ReactTestRenderer.act(async () => {
      bookingCards[0].props.onPress();
    });

    const modal = root.findByType(BookingDetailModal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.booking).toBeTruthy();
    expect(modal.props.booking.clientName).toBe('ரமேஷ்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
