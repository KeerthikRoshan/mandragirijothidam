/**
 * Notification API Service for Mandhragiri Jothidam (Phase 2)
 * Handles in-app notifications, unread count tracking, read/unread states, and user channel preferences.
 */

import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import {
  NotificationListParams,
  NotificationListResponse,
  NotificationReadResponse,
  NotificationPreferenceItem,
  NotificationPreferenceUpdate,
} from '../types/notification';

export const notificationApiService = {
  /**
   * Fetch paginated list of notifications for the authenticated user
   */
  async getNotifications(params?: NotificationListParams): Promise<NotificationListResponse> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST, { params });
    const data = response.data?.data;
    return {
      notifications: data?.notifications || [],
      pagination: data?.pagination || {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: 0,
        unreadCount: 0,
      },
    };
  },

  /**
   * Fetch total unread count of in-app notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return response.data?.data?.unreadCount ?? 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number | string): Promise<NotificationReadResponse> {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATIONS.READ(id));
    return response.data?.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<number> {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATIONS.READ_ALL);
    return response.data?.data?.markedCount ?? 0;
  },

  /**
   * Soft-delete / hide a notification for the current user
   */
  async deleteNotification(id: number | string): Promise<boolean> {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return Boolean(response.data?.data?.deleted);
  },

  /**
   * Get notification preferences for authenticated user
   */
  async getPreferences(): Promise<NotificationPreferenceItem[]> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PREFERENCES);
    return response.data?.data?.preferences || [];
  },

  /**
   * Update notification preferences for authenticated user
   */
  async updatePreferences(preferences: NotificationPreferenceUpdate[]): Promise<number> {
    const response = await apiClient.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PREFERENCES, {
      preferences,
    });
    return response.data?.data?.updatedCount ?? 0;
  },
};
