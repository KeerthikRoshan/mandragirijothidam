/**
 * Notification System Type Definitions for Mandhragiri Jothidam (Phase 2)
 */

export type NotificationEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_ASSIGNED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_COMPLETED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'ATTENDANCE_REMINDER'
  | 'PAYMENT_UPDATED'
  | 'SYSTEM_ANNOUNCEMENT';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface NotificationItem {
  id: number;
  recipientId: number;
  eventType: NotificationEventType | string;
  title: string;
  body: string;
  titleEn?: string;
  bodyEn?: string;
  titleTa?: string;
  bodyTa?: string;
  entityType: string;
  entityId: string | null;
  data: Record<string, any>;
  priority: NotificationPriority;
  isRead: boolean;
  readAt: string | null;
  deliveryStatus: NotificationDeliveryStatus;
  createdAt: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  pagination: NotificationPagination;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  lang?: string;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationReadResponse {
  id: number;
  readAt: string;
}

export interface NotificationReadAllResponse {
  markedCount: number;
}

export interface NotificationDeleteResponse {
  id: number;
  deleted: boolean;
}

export interface NotificationPreferenceItem {
  eventType: string;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  updatedAt?: string;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreferenceItem[];
}

export interface NotificationPreferenceUpdate {
  eventType: string;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
}
