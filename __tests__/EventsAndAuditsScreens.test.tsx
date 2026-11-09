import React from 'react';
import { Text, Pressable } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { UpcomingEventsScreen } from '../src/screens/events/UpcomingEventsScreen';
import { CompletedEventsScreen } from '../src/screens/events/CompletedEventsScreen';
import { FinancialAuditsScreen } from '../src/screens/financial/FinancialAuditsScreen';
import { bookingApiService } from '../src/services/bookingApiService';
import { ScheduleBooking } from '../src/types/schedule';
import { PoojaBookingFormModal } from '../src/components/common/PoojaBookingFormModal';
import { BookingDetailModal } from '../src/components/common/BookingDetailModal';

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

describe('Events and Financial Audits Screens', () => {
  jest.setTimeout(25000);
  const futureDate = '2028-11-20';
  const pastDate = '2024-01-10';

  const mockUpcomingBooking: ScheduleBooking = {
    id: 'b-up-1',
    bookingNumber: 'BK-UP-001',
    date: futureDate,
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    timeSlot: '10:00 AM - 11:30 AM',
    durationMinutes: 90,
    titleTamil: 'சண்டி ஹோமம்',
    titleEnglish: 'Chandi Homam',
    clientName: 'கார்த்திகேயன்',
    clientPhone: '9840199999',
    locationTamil: 'கோவில்',
    priestNameTamil: 'சுவாமி',
    category: 'temple',
    status: 'confirmed',
    totalEventCharge: 10000,
    clientAdvanceAmount: 3000,
    clientTotalReceived: 3000,
    clientBalanceAmount: 7000,
    clientPaymentStatus: 'partial',
  };

  const mockCompletedBooking: ScheduleBooking = {
    id: 'b-past-1',
    bookingNumber: 'BK-PAST-001',
    date: pastDate,
    startTime: '08:00 AM',
    endTime: '09:00 AM',
    timeSlot: '08:00 AM - 09:00 AM',
    durationMinutes: 60,
    titleTamil: 'ஆயுஷ் ஹோமம்',
    titleEnglish: 'Ayush Homam',
    clientName: 'சுரேஷ் குமார்',
    clientPhone: '9840188888',
    locationTamil: 'வீடு',
    priestNameTamil: 'சுவாமி',
    category: 'home',
    status: 'completed',
    totalEventCharge: 4000,
    clientAdvanceAmount: 4000,
    clientTotalReceived: 4000,
    clientBalanceAmount: 0,
    clientPaymentStatus: 'completed',
  };

  beforeEach(() => {
    jest.spyOn(bookingApiService, 'listBookings').mockResolvedValue([
      mockUpcomingBooking,
      mockCompletedBooking,
    ]);
    jest.spyOn(bookingApiService, 'getFinancialAuditSummary').mockResolvedValue({
      summary: {
        totalBookings: 12,
        totalBilled: 120000,
        totalCollected: 90000,
        clientOutstanding: 30000,
        priestTotalDue: 45000,
        priestSettled: 35000,
        priestPendingSettlement: 10000,
        netPeedamMargin: 55000,
        fullyPaidCount: 8,
        partialPaidCount: 4,
        pendingPaidCount: 0,
        priestSettledCount: 3,
        priestPendingCount: 1,
      },
      receivables: [
        {
          id: 'b-up-1',
          bookingNumber: 'BK-UP-001',
          dateKey: futureDate,
          title: 'சண்டி ஹோமம்',
          clientName: 'கார்த்திகேயன்',
          clientPhone: '9840199999',
          totalEventCharge: 10000,
          clientAdvanceAmount: 3000,
          clientTotalReceived: 3000,
          clientBalanceAmount: 7000,
          clientPaymentStatus: 'partial',
          status: 'confirmed',
        },
      ],
      count: 1,
    });
    jest.spyOn(bookingApiService, 'getPriestSettlements').mockResolvedValue({
      settlements: [
        {
          priestId: 'p-1',
          priestName: 'Karthik Sastri',
          priestNameTamil: 'சிவஸ்ரீ கார்த்திக் சாஸ்திரிகள்',
          staffRole: 'Chief Priest',
          bookingCount: 5,
          totalPay: 25000,
          advancePaid: 15000,
          balanceDue: 10000,
          settlementStatus: 'partial',
        },
      ],
      count: 1,
    });
    jest.spyOn(bookingApiService, 'getFinancialAuditTransactions').mockResolvedValue({
      transactions: [
        {
          id: 'tx-1',
          bookingId: 'b-up-1',
          bookingNumber: 'BK-UP-001',
          party: 'client',
          amount: 3000,
          paymentMethod: 'upi',
          transactionType: 'advance',
          clientName: 'கார்த்திகேயன்',
          paidAt: '2026-11-05T10:00:00Z',
        },
      ],
      count: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('UpcomingEventsScreen renders upcoming bookings and filters correctly', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <UpcomingEventsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    expect(texts.some(t => t.includes('வரவிருக்கும் நிகழ்வுகள்') || t.includes('Upcoming Events'))).toBe(true);
    expect(texts.some(t => t.includes('சண்டி ஹோமம்') || t.includes('Chandi Homam'))).toBe(true);
    expect(texts.some(t => t.includes('கார்த்திகேயன்'))).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('UpcomingEventsScreen calls updateBooking on existing booking ID when edited and submitted', async () => {
    const updateSpy = jest.spyOn(bookingApiService, 'updateBooking').mockResolvedValue({
      ...mockUpcomingBooking,
      titleTamil: 'மாற்றிய சண்டி ஹோமம்',
    });
    const createSpy = jest.spyOn(bookingApiService, 'createBooking');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <UpcomingEventsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const detailModal = root.findByType(BookingDetailModal);
    expect(detailModal).toBeDefined();

    // Trigger onEdit with the upcoming booking
    await ReactTestRenderer.act(async () => {
      detailModal.props.onEdit(mockUpcomingBooking);
    });

    const modal = root.findByType(PoojaBookingFormModal);
    expect(modal).toBeDefined();
    expect(modal.props.initialBooking).toEqual(mockUpcomingBooking);

    // Submit form with updated values
    await ReactTestRenderer.act(async () => {
      await modal.props.onSubmit({
        dateKey: futureDate,
        title: 'மாற்றிய சண்டி ஹோமம்',
        clientName: 'கார்த்திகேயன்',
        phone: '9840199999',
        venueType: 'temple',
        location: 'கோவில்',
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        durationMinutes: 90,
        timeSlot: '10:00 AM - 11:30 AM',
        priestId: '1',
        category: 'temple',
        categoryLabelTamil: 'கோவில்',
        totalEventCharge: 10000,
        clientAdvanceAmount: 3000,
        clientTotalReceived: 3000,
        clientBalanceAmount: 7000,
        priestTotalPay: 3000,
        priestAdvancePaid: 1000,
        priestBalanceAmount: 2000,
      });
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'b-up-1',
      expect.objectContaining({
        title: 'மாற்றிய சண்டி ஹோமம்',
        clientName: 'கார்த்திகேயன்',
      })
    );
    expect(createSpy).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('CompletedEventsScreen renders completed bookings correctly', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <CompletedEventsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    expect(texts.some(t => t.includes('நிறைவடைந்த நிகழ்வுகள்') || t.includes('Completed Events'))).toBe(true);
    expect(texts.some(t => t.includes('ஆயுஷ் ஹோமம்') || t.includes('Ayush Homam'))).toBe(true);
    expect(texts.some(t => t.includes('சுரேஷ் குமார்'))).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('FinancialAuditsScreen renders summary metrics and tab views', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <FinancialAuditsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    expect(texts.some(t => t.includes('நிதி தணிக்கைகள்') || t.includes('Financial Audits'))).toBe(true);
    // Net Margin display
    expect(texts.some(t => t.includes('55,000'))).toBe(true);
    // Total Billed
    expect(texts.some(t => t.includes('1,20,000'))).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
