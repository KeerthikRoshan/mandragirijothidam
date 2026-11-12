/**
 * NotificationScreen Component
 * Phase 3 — In-App Notification UI for Mandhiragiri Jothidam
 *
 * Implements:
 * 1. Mandhiragiri Jothidam Vedic Design System (Forest Green, Temple Gold, Cream Background).
 * 2. Segmented filtering ("All" vs "Unread") with synchronized unread badges.
 * 3. Pull-to-refresh and paginated infinite scrolling with duplicate request guards.
 * 4. Optimistic read state updates with rollback on API failure.
 * 5. Safe booking identifier resolution (handling mismatched entityId vs data.bookingId).
 * 6. In-place inspection via BookingDetailModal.
 * 7. Bilingual Tamil and English content rendering with localized timestamps.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react-native';

import { useNotification } from '../../context/NotificationContext';
import { notificationApiService } from '../../services/notificationApiService';
import { bookingApiService } from '../../services/bookingApiService';
import { BookingDetailModal } from '../../components/dashboard/BookingDetailModal';
import { NotificationItem, NotificationListParams } from '../../types/notification';
import { ScheduleBooking } from '../../types/schedule';
import { NotificationScreenNavigationProp } from '../../types/navigation';

export const NotificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NotificationScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const {
    unreadCount,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  // Filter tabs: 'all' | 'unread'
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // List and pagination states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Booking detail modal inspection states
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState<boolean>(false);
  const [isLoadingBooking, setIsLoadingBooking] = useState<boolean>(false);

  // Request token ref to avoid race conditions when switching tabs rapidly
  const requestIdRef = useRef<number>(0);

  /**
   * Fetch paginated notifications for the specified tab and page
   */
  const loadNotifications = useCallback(
    async (targetPage = 1, append = false, isRefresh = false) => {
      const currentRequestId = ++requestIdRef.current;
      setError(null);

      if (targetPage === 1 && !isRefresh) {
        setIsLoading(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params: NotificationListParams = {
          page: targetPage,
          limit: 20,
          lang: i18n.language,
        };

        if (activeTab === 'unread') {
          params.unreadOnly = true;
        }

        const response = await notificationApiService.getNotifications(params);

        // Ignore response if user switched tabs or another request was fired
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const newItems = response.notifications || [];
        const pagination = response.pagination;

        if (append) {
          // Merge items while preventing duplicate IDs
          setNotifications(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const filteredNew = newItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setNotifications(newItems);
        }

        setPage(pagination.page || targetPage);
        setTotalPages(pagination.totalPages || 1);
      } catch (err: any) {
        if (currentRequestId === requestIdRef.current) {
          console.warn('⚠️ [NotificationScreen] Load error:', err);
          setError(err?.message || t('notifications.retry'));
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [activeTab, i18n.language, t]
  );

  // Reload from page 1 when active tab changes
  useEffect(() => {
    setNotifications([]);
    setPage(1);
    setTotalPages(1);
    loadNotifications(1, false);
  }, [activeTab, loadNotifications]);

  /**
   * Pull-to-refresh handler
   */
  const handleRefresh = useCallback(() => {
    fetchUnreadCount().catch(() => {});
    loadNotifications(1, false, true);
  }, [fetchUnreadCount, loadNotifications]);

  /**
   * Infinite scroll pagination handler
   */
  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || isRefreshing) return;
    if (page < totalPages) {
      loadNotifications(page + 1, true);
    }
  }, [isLoading, isLoadingMore, isRefreshing, page, totalPages, loadNotifications]);

  /**
   * Mark all notifications as read handler with confirmation
   */
  const handleMarkAllAsReadPress = useCallback(() => {
    if (unreadCount === 0 && (activeTab !== 'unread' || notifications.length === 0)) {
      return;
    }

    Alert.alert(
      t('notifications.markAllConfirmTitle', 'அனைத்தையும் படித்ததாகக் குறிக்கவா?'),
      t(
        'notifications.markAllConfirmMessage',
        'அனைத்து அறிவிப்புகளையும் படித்ததாகக் குறிக்க நிச்சயமாக விரும்புகிறீர்களா?'
      ),
      [
        { text: t('common.cancel', 'ரத்து'), style: 'cancel' },
        {
          text: t('common.ok', 'சரி'),
          onPress: async () => {
            // Backup current list in case of rollback
            const previousList = [...notifications];

            // Optimistic update
            if (activeTab === 'unread') {
              setNotifications([]);
            } else {
              setNotifications(prev =>
                prev.map(item => ({
                  ...item,
                  isRead: true,
                  readAt: item.readAt || new Date().toISOString(),
                }))
              );
            }

            try {
              await markAllAsRead();
            } catch (_err) {
              // Rollback list on error
              setNotifications(previousList);
              Alert.alert(
                t('common.error', 'பிழை'),
                t('notifications.retry', 'மீண்டும் முயற்சி செய்')
              );
            }
          },
        },
      ]
    );
  }, [unreadCount, activeTab, notifications, markAllAsRead, t]);

  /**
   * Safe booking identifier resolution & inspection
   */
  const handleNotificationPress = useCallback(
    async (item: NotificationItem) => {
      // 1. If unread, trigger optimistic mark as read
      if (!item.isRead) {
        // Backup previous notification state for rollback
        const prevItemState = { ...item };

        if (activeTab === 'unread') {
          setNotifications(prev => prev.filter(n => n.id !== item.id));
        } else {
          setNotifications(prev =>
            prev.map(n =>
              n.id === item.id
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          );
        }

        markAsRead(item.id).catch(() => {
          // Rollback on failure
          if (activeTab === 'unread') {
            setNotifications(prev => [prevItemState, ...prev]);
          } else {
            setNotifications(prev =>
              prev.map(n => (n.id === item.id ? prevItemState : n))
            );
          }
        });
      }

      // 2. Check if this notification references a booking
      const isBookingEntity =
        item.entityType?.toLowerCase() === 'booking' ||
        item.eventType?.startsWith('BOOKING_');

      if (!isBookingEntity) {
        return;
      }

      // 3. Resolve booking ID safely (prioritize data.bookingId over entityId)
      const dataBookingId = item.data?.bookingId;
      const entityId = item.entityId;

      const candidate1 =
        dataBookingId && !isNaN(Number(dataBookingId))
          ? Number(dataBookingId)
          : null;
      const candidate2 =
        entityId && !isNaN(Number(entityId)) ? Number(entityId) : null;

      const primaryId = candidate1 || candidate2;

      if (!primaryId) {
        Alert.alert(
          t('common.notice', 'அறிவிப்பு'),
          t('notifications.bookingNotFound')
        );
        return;
      }

      setIsLoadingBooking(true);

      try {
        let booking: ScheduleBooking | null = null;

        // Attempt 1: Fetch using primary ID
        try {
          booking = await bookingApiService.getBookingDetails(primaryId);
        } catch (_firstErr) {
          // Attempt 2: If primary ID failed and an alternate candidate exists, try fallback candidate
          const alternateId = primaryId === candidate1 ? candidate2 : candidate1;
          if (alternateId && alternateId !== primaryId) {
            try {
              booking = await bookingApiService.getBookingDetails(alternateId);
            } catch (_secondErr) {
              booking = null;
            }
          }
        }

        if (booking) {
          setSelectedBooking(booking);
          setIsBookingModalVisible(true);
        } else {
          Alert.alert(
            t('common.notice', 'அறிவிப்பு'),
            t('notifications.bookingNotFound')
          );
        }
      } catch (_e) {
        Alert.alert(
          t('common.notice', 'அறிவிப்பு'),
          t('notifications.bookingNotFound')
        );
      } finally {
        setIsLoadingBooking(false);
      }
    },
    [activeTab, markAsRead, t]
  );

  /**
   * Helper to format relative or localized timestamps
   */
  const formatTimestamp = useCallback(
    (isoDate: string) => {
      try {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) {
          return t('notifications.justNow', 'சற்றுமுன்');
        }
        if (diffMinutes < 60) {
          return t('notifications.minutesAgo', { count: diffMinutes });
        }
        if (diffHours < 24) {
          return t('notifications.hoursAgo', { count: diffHours });
        }
        if (diffDays < 7) {
          return t('notifications.daysAgo', { count: diffDays });
        }

        // Formatted date
        return date.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (_e) {
        return '';
      }
    },
    [isTa, t]
  );

  /**
   * Helper to pick appropriate event category icon
   */
  const renderCategoryIcon = (eventType: string) => {
    switch (eventType) {
      case 'BOOKING_CREATED':
      case 'BOOKING_ASSIGNED':
        return <Calendar size={18} color="#145C43" />;
      case 'BOOKING_COMPLETED':
        return <CheckCircle2 size={18} color="#074735" />;
      case 'BOOKING_REMINDER':
      case 'ATTENDANCE_REMINDER':
        return <Clock size={18} color="#8C6D23" />;
      case 'BOOKING_RESCHEDULED':
        return <RefreshCw size={18} color="#218665" />;
      case 'BOOKING_CANCELLED':
        return <XCircle size={18} color="#DC2626" />;
      case 'PAYMENT_UPDATED':
        return <CreditCard size={18} color="#145C43" />;
      case 'LEAVE_REQUESTED':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        return <FileText size={18} color="#074735" />;
      default:
        return <Bell size={18} color="#8C6D23" />;
    }
  };

  /**
   * Render individual notification card
   */
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.isRead;
    const title = isTa ? item.titleTa || item.title : item.titleEn || item.title;
    const body = isTa ? item.bodyTa || item.body : item.bodyEn || item.body;
    const timeText = formatTimestamp(item.createdAt);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.card,
          isUnread ? styles.cardUnread : styles.cardRead,
        ]}
      >
        {/* Left Icon Container */}
        <View
          style={[
            styles.iconWrapper,
            isUnread ? styles.iconWrapperUnread : styles.iconWrapperRead,
          ]}
        >
          {renderCategoryIcon(item.eventType)}
        </View>

        {/* Text Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text
              style={[
                styles.cardTitle,
                isUnread ? styles.cardTitleUnread : styles.cardTitleRead,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isUnread && <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{t('notifications.newBadge', 'NEW')}</Text></View>}
          </View>

          <Text
            style={[
              styles.cardBody,
              isUnread ? styles.cardBodyUnread : styles.cardBodyRead,
            ]}
            numberOfLines={2}
          >
            {body}
          </Text>

          <View style={styles.cardFooterRow}>
            <Text style={styles.cardTime}>{timeText}</Text>
            {item.entityType?.toLowerCase() === 'booking' && (
              <Text style={styles.bookingTapHint}>
                {isTa ? 'விவரம் பார்க்க தட்டவும் ›' : 'Tap to view details ›'}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  /**
   * Empty List State
   */
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#145C43" />
          <Text style={styles.loadingText}>
            {t('notifications.loading', 'அறிவிப்புகள் ஏற்றப்படுகின்றன...')}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <XCircle size={44} color="#DC2626" />
          <Text style={styles.emptyTitle}>{t('common.error', 'பிழை')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => loadNotifications(1, false)}
            style={styles.retryButton}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>
              {t('notifications.retry', 'மீண்டும் முயற்சி செய்')}
            </Text>
          </Pressable>
        </View>
      );
    }

    const isUnreadTab = activeTab === 'unread';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          {isUnreadTab ? (
            <Sparkles size={36} color="#145C43" />
          ) : (
            <BellOff size={36} color="#145C43" />
          )}
        </View>
        <Text style={styles.emptyTitle}>
          {isUnreadTab
            ? t('notifications.emptyUnreadTitle', 'படிக்காத அறிவிப்புகள் இல்லை')
            : t('notifications.emptyAllTitle', 'அறிவிப்புகள் எதுவும் இல்லை')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isUnreadTab
            ? t(
                'notifications.emptyUnreadSubtitle',
                'தங்களிடம் உள்ள அனைத்து அறிவிப்புகளும் ஏற்கனவே படிக்கப்பட்டுவிட்டன.'
              )
            : t(
                'notifications.emptyAllSubtitle',
                'புதிய பூஜை மற்றும் கோவில் செயல்பாட்டு அறிவிப்புகள் வரும்போது இங்கு தோன்றும்.'
              )}
        </Text>
      </View>
    );
  };

  /**
   * Footer component for infinite scrolling spinner
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#145C43" />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Header Bar matching Mandhiragiri app standard */}
      <View style={styles.headerContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'Back')}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('notifications.title', 'அறிவிப்புகள்')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t('notifications.subtitle', 'Temple Announcements & Updates')}
          </Text>
        </View>

        {/* Mark All As Read Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('notifications.markAllAsRead', 'Mark All Read')}
          onPress={handleMarkAllAsReadPress}
          disabled={unreadCount === 0 && (activeTab !== 'unread' || notifications.length === 0)}
          style={[
            styles.markAllButton,
            (unreadCount === 0 && (activeTab !== 'unread' || notifications.length === 0)) &&
              styles.markAllButtonDisabled,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <CheckCheck
            size={18}
            color={
              unreadCount > 0 || (activeTab === 'unread' && notifications.length > 0)
                ? '#145C43'
                : '#94A3B8'
            }
          />
        </Pressable>
      </View>

      {/* 2. Filter Tabs (All vs Unread) */}
      <View style={styles.tabsContainer}>
        {/* All Tab */}
        <Pressable
          testID="tab-all"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}
          onPress={() => setActiveTab('all')}
          style={[
            styles.tabButton,
            activeTab === 'all' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.tabTextActive,
            ]}
          >
            {t('notifications.filterAll', 'அனைத்தும்')}
          </Text>
        </Pressable>

        {/* Unread Tab */}
        <Pressable
          testID="tab-unread"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'unread' }}
          onPress={() => setActiveTab('unread')}
          style={[
            styles.tabButton,
            activeTab === 'unread' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'unread' && styles.tabTextActive,
            ]}
          >
            {t('notifications.filterUnread', 'படிக்காதவை')}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 3. Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#145C43']}
            tintColor="#145C43"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 24 },
        ]}
      />

      {/* 4. Booking Detail Modal Inspection */}
      <BookingDetailModal
        visible={isBookingModalVisible}
        booking={selectedBooking}
        onClose={() => setIsBookingModalVisible(false)}
      />

      {/* 5. Booking Loading Indicator Overlay */}
      {isLoadingBooking && (
        <Modal transparent animationType="fade" visible={isLoadingBooking}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#145C43" />
              <Text style={styles.loadingBoxText}>
                {t('notifications.loadingBooking', 'பூஜை விவரங்கள் ஏற்றப்படுகின்றன...')}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topSafeArea: {
    backgroundColor: '#FAF9F5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DF',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5EAE7',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#5A6B63',
    marginTop: 1,
  },
  markAllButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButtonDisabled: {
    backgroundColor: '#F1F5F3',
    opacity: 0.6,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF9F5',
    gap: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE7',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#145C43',
    borderColor: '#145C43',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B63',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  /* List */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5EAE7',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardUnread: {
    backgroundColor: '#F2F8F4',
    borderLeftWidth: 4,
    borderLeftColor: '#145C43',
    borderColor: '#D4E5DB',
  },
  cardRead: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5EAE7',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapperUnread: {
    backgroundColor: '#E8F3EB',
  },
  iconWrapperRead: {
    backgroundColor: '#F1F5F3',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    marginRight: 6,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#074735',
  },
  cardTitleRead: {
    fontWeight: '600',
    color: '#1E293B',
  },
  unreadPill: {
    backgroundColor: '#145C43',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardBodyUnread: {
    color: '#1B2D25',
    fontWeight: '500',
  },
  cardBodyRead: {
    color: '#64748B',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: 11,
    color: '#8C6D23',
    fontWeight: '500',
  },
  bookingTapHint: {
    fontSize: 11,
    color: '#145C43',
    fontWeight: '600',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4E5DB',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#074735',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5A6B63',
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#5A6B63',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#145C43',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  /* Overlay Loader */
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingBoxText: {
    marginTop: 12,
    fontSize: 13,
    color: '#074735',
    fontWeight: '600',
  },
});
