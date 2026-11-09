import { notificationApiService } from '../src/services/notificationApiService';
import { apiClient } from '../src/services/apiClient';
import { API_CONFIG } from '../src/config/apiConfig';

describe('notificationApiService (Phase 2 Notification System)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches paginated notifications with query params and returns unwrapped data', async () => {
      const mockNotifications = [
        {
          id: 1,
          recipientId: 10,
          eventType: 'BOOKING_CREATED',
          title: 'புதிய முன்பதிவு',
          body: 'ஒரு புதிய பூஜை முன்பதிவு செய்யப்பட்டுள்ளது.',
          entityType: 'booking',
          entityId: '101',
          data: { bookingId: 101 },
          priority: 'normal',
          isRead: false,
          readAt: null,
          deliveryStatus: 'SENT',
          createdAt: '2026-11-10T00:00:00Z',
        },
      ];

      const mockPagination = {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        unreadCount: 1,
      };

      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            notifications: mockNotifications,
            pagination: mockPagination,
          },
        },
      });

      const params = { page: 1, limit: 20, unreadOnly: true, eventType: 'BOOKING_CREATED' };
      const result = await notificationApiService.getNotifications(params);

      expect(getSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST, { params });
      expect(result.notifications).toEqual(mockNotifications);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('provides fallback defaults if API response data is empty or missing', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const result = await notificationApiService.getNotifications({ page: 2, limit: 10 });
      expect(result.notifications).toEqual([]);
      expect(result.pagination).toEqual({
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        unreadCount: 0,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('fetches unread count from /notifications/unread-count', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: { unreadCount: 7 },
        },
      });

      const count = await notificationApiService.getUnreadCount();
      expect(getSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      expect(count).toBe(7);
    });

    it('returns 0 if response data is missing', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const count = await notificationApiService.getUnreadCount();
      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('calls PATCH /notifications/:id/read with correct endpoint', async () => {
      const patchSpy = jest.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 42, readAt: '2026-11-10T00:05:00Z' },
        },
      });

      const result = await notificationApiService.markAsRead(42);
      expect(patchSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.READ(42));
      expect(result).toEqual({ id: 42, readAt: '2026-11-10T00:05:00Z' });
    });
  });

  describe('markAllAsRead', () => {
    it('calls PATCH /notifications/read-all and returns markedCount', async () => {
      const patchSpy = jest.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          data: { markedCount: 5 },
        },
      });

      const count = await notificationApiService.markAllAsRead();
      expect(patchSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.READ_ALL);
      expect(count).toBe(5);
    });
  });

  describe('deleteNotification', () => {
    it('calls DELETE /notifications/:id and returns boolean deleted flag', async () => {
      const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 99, deleted: true },
        },
      });

      const deleted = await notificationApiService.deleteNotification(99);
      expect(deleteSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(99));
      expect(deleted).toBe(true);
    });
  });

  describe('getPreferences', () => {
    it('calls GET /notifications/preferences and returns preferences array', async () => {
      const mockPreferences = [
        { eventType: 'BOOKING_CREATED', pushEnabled: true, inAppEnabled: true },
        { eventType: 'BOOKING_ASSIGNED', pushEnabled: false, inAppEnabled: true },
      ];

      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: { preferences: mockPreferences },
        },
      });

      const prefs = await notificationApiService.getPreferences();
      expect(getSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PREFERENCES);
      expect(prefs).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('calls PUT /notifications/preferences with payload and returns updatedCount', async () => {
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          data: { updatedCount: 2 },
        },
      });

      const updates = [
        { eventType: 'BOOKING_CREATED', pushEnabled: true, inAppEnabled: false },
        { eventType: 'LEAVE_APPROVED', pushEnabled: true, inAppEnabled: true },
      ];

      const count = await notificationApiService.updatePreferences(updates);
      expect(putSpy).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PREFERENCES, {
        preferences: updates,
      });
      expect(count).toBe(2);
    });
  });
});
