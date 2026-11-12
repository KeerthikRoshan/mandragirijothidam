import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, FlatList, Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { NotificationScreen } from '../src/screens/notifications/NotificationScreen';
import { NotificationProvider } from '../src/context/NotificationContext';
import { useAuth } from '../src/context/AuthContext';
import { notificationApiService } from '../src/services/notificationApiService';
import { bookingApiService } from '../src/services/bookingApiService';
import { BookingDetailModal } from '../src/components/dashboard/BookingDetailModal';
import { NotificationItem } from '../src/types/notification';
import { ScheduleBooking } from '../src/types/schedule';
import i18n from '../src/i18n';

jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

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

describe('NotificationScreen Component (Phase 3 UI Integration)', () => {
  const mockUseAuth = useAuth as jest.Mock;

  const mockBookingNotification: NotificationItem = {
    id: 2,
    recipientId: 10,
    eventType: 'BOOKING_CREATED',
    title: 'புதிய பூஜை முன்பதிவு',
    body: 'பக்தர் ரமேஷ் நாளை காலை 09:00 மணிக்கு கணபதி ஹோமம் முன்பதிவு செய்துள்ளார்.',
    titleEn: 'New Pooja Booking Created',
    bodyEn: 'Devotee Ramesh has booked Ganapathi Homam for tomorrow 09:00 AM.',
    titleTa: 'புதிய பூஜை முன்பதிவு',
    bodyTa: 'பக்தர் ரமேஷ் நாளை காலை 09:00 மணிக்கு கணபதி ஹோமம் முன்பதிவு செய்துள்ளார்.',
    entityType: 'booking',
    entityId: '947', // Mismatched test entityId
    data: {
      bookingId: 101, // Actual booking primary key
      bookingNumber: 'BK-000101',
      devoteeName: 'Ramesh',
    },
    priority: 'normal',
    isRead: false,
    readAt: null,
    deliveryStatus: 'SENT',
    createdAt: '2026-11-11T09:00:00Z',
  };

  const mockReadNotification: NotificationItem = {
    id: 1,
    recipientId: 10,
    eventType: 'SYSTEM_ANNOUNCEMENT',
    title: 'கோவில் முக்கிய அறிவிப்பு',
    body: 'நாளை காலை கோவில் நடை திறப்பு நேரம் மாற்றப்பட்டுள்ளது.',
    titleEn: 'Temple Announcement',
    bodyEn: 'Temple opening hours have been updated for tomorrow morning.',
    titleTa: 'கோவில் முக்கிய அறிவிப்பு',
    bodyTa: 'நாளை காலை கோவில் நடை திறப்பு நேரம் மாற்றப்பட்டுள்ளது.',
    entityType: 'system',
    entityId: null,
    data: {},
    priority: 'high',
    isRead: true,
    readAt: '2026-11-10T12:00:00Z',
    deliveryStatus: 'SENT',
    createdAt: '2026-11-10T08:00:00Z',
  };

  const mockBookingDetails: ScheduleBooking = {
    id: '101',
    bookingNumber: 'BK-000101',
    date: '2026-11-12',
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
    category: 'outdoor',
    categoryLabelTamil: 'வெளிப்புற நிகழ்வு',
    status: 'confirmed',
    statusLabelTamil: 'உறுதியானது',
    totalEventCharge: 5000,
    clientAdvanceAmount: 2000,
    clientTotalReceived: 2000,
    clientBalanceAmount: 3000,
    clientPaymentStatus: 'partial',
    venueType: 'home',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(1);
    jest.spyOn(notificationApiService, 'getNotifications').mockResolvedValue({
      notifications: [mockBookingNotification, mockReadNotification],
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        unreadCount: 1,
      },
    });
    jest.spyOn(notificationApiService, 'markAsRead').mockResolvedValue({
      id: 2,
      readAt: '2026-11-11T12:00:00Z',
    });
    jest.spyOn(bookingApiService, 'getBookingDetails').mockResolvedValue(mockBookingDetails);
  });

  const renderScreen = async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NotificationProvider>
            <NavigationContainer>
              <NotificationScreen />
            </NavigationContainer>
          </NotificationProvider>
        </SafeAreaProvider>
      );
    });
    return renderer!;
  };

  it('renders notifications list with items and badges', async () => {
    const renderer = await renderScreen();
    const flatList = renderer.root.findByType(FlatList);
    expect(flatList.props.data.length).toBe(2);

    // Test renderItem for notification card
    const renderedCard1 = flatList.props.renderItem({ item: flatList.props.data[0] });
    const renderedCard2 = flatList.props.renderItem({ item: flatList.props.data[1] });

    expect(extractText(renderedCard1)).toContain('புதிய பூஜை முன்பதிவு');
    expect(extractText(renderedCard2)).toContain('கோவில் முக்கிய அறிவிப்பு');
  });

  it('displays all notifications in All tab when all records are read (unreadCount: 0)', async () => {
    const allReadNotifications: NotificationItem[] = [
      { ...mockBookingNotification, isRead: true, readAt: '2026-11-11T10:22:09' },
      { ...mockReadNotification, isRead: true, readAt: '2026-11-11T10:18:11' },
    ];

    jest.spyOn(notificationApiService, 'getNotifications').mockResolvedValueOnce({
      notifications: allReadNotifications,
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        unreadCount: 0,
      },
    });

    const renderer = await renderScreen();
    const flatList = renderer.root.findByType(FlatList);
    expect(flatList.props.data.length).toBe(2);

    const renderedCard1 = flatList.props.renderItem({ item: flatList.props.data[0] });
    const renderedCard2 = flatList.props.renderItem({ item: flatList.props.data[1] });

    expect(extractText(renderedCard1)).toContain('புதிய பூஜை முன்பதிவு');
    expect(extractText(renderedCard2)).toContain('கோவில் முக்கிய அறிவிப்பு');
  });

  it('switches between All and Unread filter tabs resetting pagination', async () => {
    const getNotifsSpy = jest.spyOn(notificationApiService, 'getNotifications');
    const renderer = await renderScreen();

    // Find tab buttons by testID
    const unreadTab = renderer.root.findByProps({ testID: 'tab-unread' });
    expect(unreadTab).toBeDefined();

    // Switch to Unread tab
    await ReactTestRenderer.act(async () => {
      unreadTab.props.onPress();
    });

    expect(getNotifsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ unreadOnly: true, page: 1 })
    );
  });

  it('resolves mismatched booking identifier prioritizing data.bookingId over entityId', async () => {
    const renderer = await renderScreen();
    const flatList = renderer.root.findByType(FlatList);

    // Execute onPress on the booking notification card
    const bookingCardElement = flatList.props.renderItem({ item: flatList.props.data[0] });

    await ReactTestRenderer.act(async () => {
      await bookingCardElement.props.onPress();
    });

    // Check that bookingApiService.getBookingDetails was called with 101 (data.bookingId), NOT 947!
    expect(bookingApiService.getBookingDetails).toHaveBeenCalledWith(101);

    // Check that markAsRead was also called for notification 2
    expect(notificationApiService.markAsRead).toHaveBeenCalledWith(2);

    // Check that BookingDetailModal received the booking
    const modal = renderer.root.findByType(BookingDetailModal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.booking?.id).toBe('101');
  });

  it('handles missing booking / 404 failure gracefully without crashing and marks read', async () => {
    jest
      .spyOn(bookingApiService, 'getBookingDetails')
      .mockRejectedValue(new Error('Booking not found'));

    const alertSpy = jest.spyOn(Alert, 'alert');

    const renderer = await renderScreen();
    const flatList = renderer.root.findByType(FlatList);
    const bookingCardElement = flatList.props.renderItem({ item: flatList.props.data[0] });

    await ReactTestRenderer.act(async () => {
      await bookingCardElement.props.onPress();
    });

    // Alert should have been displayed informing user
    expect(alertSpy).toHaveBeenCalled();

    // Notification was still marked as read
    expect(notificationApiService.markAsRead).toHaveBeenCalledWith(2);

    // Modal remains closed
    const modal = renderer.root.findByType(BookingDetailModal);
    expect(modal.props.visible).toBe(false);
  });

  it('renders bilingual English content when language is switched to en', async () => {
    const originalLang = i18n.language;
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('en');
    });

    const renderer = await renderScreen();
    const flatList = renderer.root.findByType(FlatList);

    const renderedCard1 = flatList.props.renderItem({ item: flatList.props.data[0] });
    const renderedCard2 = flatList.props.renderItem({ item: flatList.props.data[1] });

    expect(extractText(renderedCard1)).toContain('New Pooja Booking Created');
    expect(extractText(renderedCard2)).toContain('Temple Announcement');

    // Restore language
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage(originalLang);
    });
  });
});
