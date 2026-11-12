/**
 * Notification Context for Mandhragiri Jothidam (Phase 3)
 * Centralized reactive unread notification count, optimistic read updates with rollback,
 * deduplication, and multi-user authentication lifecycle synchronization.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationApiService } from '../services/notificationApiService';

export interface NotificationContextType {
  unreadCount: number;
  isLoading: boolean;
  fetchUnreadCount: () => Promise<number>;
  markAsRead: (id: number | string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  resetNotificationState: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Track the user ID associated with the current notification state to ensure clean account switching
  const lastUserIdRef = useRef<string | number | null>(null);

  // In-flight tracking to prevent duplicate concurrent API calls for the same notification ID
  const inFlightReadsRef = useRef<Set<string>>(new Set());
  const isMarkingAllReadRef = useRef<boolean>(false);

  /**
   * Reset notification state completely (used on logout or account switch)
   */
  const resetNotificationState = useCallback(() => {
    setUnreadCount(0);
    setIsLoading(false);
    inFlightReadsRef.current.clear();
    isMarkingAllReadRef.current = false;
    lastUserIdRef.current = null;
  }, []);

  /**
   * Fetch total unread count dynamically from backend for the authenticated user
   */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return 0;
    }

    setIsLoading(true);
    try {
      const count = await notificationApiService.getUnreadCount();
      const safeCount = typeof count === 'number' && count >= 0 ? count : 0;
      setUnreadCount(safeCount);
      return safeCount;
    } catch (error) {
      console.warn('⚠️ [NotificationContext] Failed to fetch unread count:', error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Handle user account changes and session termination
   */
  useEffect(() => {
    if (isAuthLoading) {
      // Wait for auth hydration to complete
      return;
    }

    if (!isAuthenticated || !user) {
      if (lastUserIdRef.current !== null || unreadCount > 0) {
        resetNotificationState();
      }
      return;
    }

    const currentUserId = user.id;

    // If account switched or initial authenticated bootstrap
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      resetNotificationState();
      lastUserIdRef.current = currentUserId;
      fetchUnreadCount().catch(() => {});
    }
  }, [isAuthLoading, isAuthenticated, user, resetNotificationState, fetchUnreadCount, unreadCount]);

  /**
   * Refresh unread notification count on app foregrounding
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isAuthenticated && user && !isAuthLoading) {
        fetchUnreadCount().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, user, isAuthLoading, fetchUnreadCount]);

  /**
   * Mark a single notification as read with optimistic decrement and failure rollback
   */
  const markAsRead = useCallback(async (id: number | string): Promise<boolean> => {
    const key = String(id);

    // Prevent duplicate concurrent requests for the same notification
    if (inFlightReadsRef.current.has(key)) {
      return false;
    }

    inFlightReadsRef.current.add(key);

    // Optimistically decrement count
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationApiService.markAsRead(id);
      return true;
    } catch (error) {
      // Rollback optimistic decrement on network/server failure
      setUnreadCount(prev => prev + 1);
      throw error;
    } finally {
      inFlightReadsRef.current.delete(key);
    }
  }, []);

  /**
   * Mark all notifications as read for current user with optimistic reset and rollback
   */
  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (isMarkingAllReadRef.current) {
      return 0;
    }

    isMarkingAllReadRef.current = true;
    const previousCount = unreadCount;

    // Optimistically set unread count to 0
    setUnreadCount(0);

    try {
      const markedCount = await notificationApiService.markAllAsRead();
      return markedCount;
    } catch (error) {
      // Rollback to previous count on failure
      setUnreadCount(previousCount);
      throw error;
    } finally {
      isMarkingAllReadRef.current = false;
    }
  }, [unreadCount]);

  const value = useMemo<NotificationContextType>(
    () => ({
      unreadCount,
      isLoading,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      resetNotificationState,
    }),
    [
      unreadCount,
      isLoading,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      resetNotificationState,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

const DEFAULT_NOTIFICATION_CONTEXT: NotificationContextType = {
  unreadCount: 0,
  isLoading: false,
  fetchUnreadCount: async () => 0,
  markAsRead: async () => true,
  markAllAsRead: async () => 0,
  resetNotificationState: () => {},
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context || DEFAULT_NOTIFICATION_CONTEXT;
};
