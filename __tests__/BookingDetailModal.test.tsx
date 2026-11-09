import React from 'react';
import { Text, Pressable, Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookingDetailModal } from '../src/components/dashboard/BookingDetailModal';
import { ScheduleBooking } from '../src/types/schedule';
import { formatDateKey } from '../src/utils/dateUtils';

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

describe('BookingDetailModal Component', () => {
  const todayKey = formatDateKey(new Date());
  const futureDate = formatDateKey(new Date(Date.now() + 5 * 24 * 3600 * 1000));

  const baseBooking: ScheduleBooking = {
    id: '101',
    bookingNumber: 'BK-101',
    date: futureDate,
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    timeSlot: '10:00 AM - 12:00 PM',
    durationMinutes: 120,
    titleTamil: 'கணபதி ஹோமம்',
    titleEnglish: 'Ganapathi Homam',
    clientName: 'சுப்பிரமணியன்',
    clientPhone: '9876543210',
    alternatePhone: '9123456780',
    locationTamil: 'திருவண்ணாமலை',
    address: '12, காந்தி ரோடு',
    area: 'அண்ணா நகர்',
    pincode: '600040',
    priestNameTamil: 'சுவாமி சுந்தரமூர்த்தி குருக்கள்',
    priestPhone: '9988776655',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    venueType: 'temple',
    status: 'confirmed',
    statusLabelTamil: 'உறுதி செய்யப்பட்டது',
    totalEventCharge: 6000,
    clientAdvanceAmount: 2000,
    clientTotalReceived: 2000,
    clientBalanceAmount: 4000,
    clientPaymentStatus: 'partial',
    samagriBy: 'priest',
    notes: 'சிறப்பு அலங்காரம் தேவை',
  };

  it('renders all detailed sections correctly for a booking', async () => {
    const onClose = jest.fn();
    const onEdit = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <BookingDetailModal
            visible={true}
            booking={baseBooking}
            onClose={onClose}
            onEdit={onEdit}
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Booking ID / Number
    expect(texts.some(t => t.includes('BK-101'))).toBe(true);

    // Devotee details
    expect(texts.some(t => t.includes('சுப்பிரமணியன்'))).toBe(true);
    expect(texts.some(t => t.includes('9876543210'))).toBe(true);
    expect(texts.some(t => t.includes('9123456780'))).toBe(true);

    // Event & Timings
    expect(texts.some(t => t.includes('கணபதி ஹோமம்') || t.includes('Ganapathi Homam'))).toBe(true);
    expect(texts.some(t => t.includes('10:00 AM - 12:00 PM'))).toBe(true);

    // Priest & Venue
    expect(texts.some(t => t.includes('சுவாமி சுந்தரமூர்த்தி குருக்கள்'))).toBe(true);
    expect(texts.some(t => t.includes('9988776655'))).toBe(true);
    expect(texts.some(t => t.includes('12, காந்தி ரோடு'))).toBe(true);

    // Financials
    expect(texts.some(t => t.includes('6,000'))).toBe(true);
    expect(texts.some(t => t.includes('2,000'))).toBe(true);
    expect(texts.some(t => t.includes('4,000'))).toBe(true);

    // Samagri & Notes
    expect(texts.some(t => t.includes('சிறப்பு அலங்காரம் தேவை'))).toBe(true);
  });

  it('allows editing when booking is scheduled more than 24 hours in future', async () => {
    const onClose = jest.fn();
    const onEdit = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <BookingDetailModal
            visible={true}
            booking={baseBooking} // date is 5 days in future
            onClose={onClose}
            onEdit={onEdit}
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // Header edit button
    const editBtn = root.findByProps({ testID: 'booking-detail-edit-button' });
    expect(editBtn).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      editBtn.props.onPress();
    });

    expect(onEdit).toHaveBeenCalledWith(baseBooking);
  });

  it('disables editing and displays 24-hour restriction notice for bookings scheduled today', async () => {
    const onClose = jest.fn();
    const onEdit = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert');

    const todayBooking: ScheduleBooking = {
      ...baseBooking,
      date: todayKey,
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <BookingDetailModal
            visible={true}
            booking={todayBooking}
            onClose={onClose}
            onEdit={onEdit}
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Restriction banner must be visible
    expect(texts.some(t => t.includes('24 மணி நேரத்திற்கு முன்பு') || t.includes('24 hours before'))).toBe(true);

    // Tapping edit button must show Alert and NOT trigger onEdit
    const editBtn = root.findByProps({ testID: 'booking-detail-edit-button' });
    expect(editBtn).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      editBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
