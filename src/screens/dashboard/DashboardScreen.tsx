/**
 * DashboardScreen Component
 * Phase 1 — Complete, Responsive Mandhragiri Jothidam Dashboard Screen
 * Built directly from the updated official reference UI screenshot.
 *
 * Section Sequence:
 * 1. Top App Header (Brand title & Notification Bell)
 * 2. Dashboard Welcome Area (Temple logo, greeting, dynamic Tamil date, star badge)
 * 3. Today's Panchangam (Forest-green card, 2x2 grid, full panchangam action)
 * 4. Today's Overview (2x2 stats grid, reports action)
 * 5. Today's Events (Live Operations card & event booking cards)
 * 6. Floating New Booking Button (+ பூஜை பதிவு (New))
 * 7. Bottom Navigation (முகப்பு, நாள்வாரி, புரோகிதர், profile)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome';
import { PanchangamCard } from '../../components/dashboard/PanchangamCard';
import { OverviewSection } from '../../components/dashboard/OverviewSection';
import { TodayEventsSection } from '../../components/dashboard/TodayEventsSection';
import { BookingDetailModal } from '../../components/dashboard/BookingDetailModal';
import { NewBookingButton } from '../../components/dashboard/NewBookingButton';
import {
  PoojaBookingFormModal,
  NewBookingFormData,
} from '../../components/common/PoojaBookingFormModal';
import {
  DashboardBottomNav,
  DashboardTabId,
} from '../../components/dashboard/DashboardBottomNav';
import { DASHBOARD_MOCK_DATA } from '../../data/dashboardMockData';
import { EventBookingItem, OverviewStatItem } from '../../types/dashboard';
import { ScheduleBooking } from '../../types/schedule';
import { DashboardScreenNavigationProp } from '../../types/navigation';
import { formatDateKey } from '../../utils/dateUtils';
import { bookingApiService } from '../../services/bookingApiService';
import {
  buildBookingPayload,
  classifyTodayBooking,
  isBookingEditable,
  sortBookingsChronologically,
  sortTodayBookingsByStatusOrder,
} from '../../utils/bookingRules';
import { useTranslation } from 'react-i18next';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { unreadCount, fetchUnreadCount } = useNotification();
  const { t, i18n } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount().catch(() => {});
    }, [fetchUnreadCount])
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [todaySectionY, setTodaySectionY] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('home');
  const [isRegistrationModalVisible, setIsRegistrationModalVisible] =
    useState<boolean>(false);
  const [isDetailModalVisible, setIsDetailModalVisible] =
    useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] =
    useState<ScheduleBooking | null>(null);
  const [editingBooking, setEditingBooking] =
    useState<ScheduleBooking | null>(null);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [todayBookings, setTodayBookings] = useState<ScheduleBooking[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [overallUpcomingCount, setOverallUpcomingCount] = useState<number>(0);
  const [financialTotalCollected, setFinancialTotalCollected] = useState<number | null>(null);
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingDashboardStats(true);
    try {
      const [todayRes, upcomingRes, financialRes] = await Promise.allSettled([
        bookingApiService.getBookingsByDate(todayKey),
        bookingApiService.listBookings({ view: 'upcoming' }),
        bookingApiService.getFinancialAuditSummary(),
      ]);

      if (todayRes.status === 'fulfilled' && todayRes.value) {
        const strictlyToday = todayRes.value.filter(b => b.date === todayKey);
        const sorted = sortTodayBookingsByStatusOrder(strictlyToday);
        setTodayBookings(sorted);
        setTodayCount(sorted.length);
      } else {
        setTodayBookings([]);
        setTodayCount(0);
      }

      if (upcomingRes.status === 'fulfilled' && upcomingRes.value) {
        // Exclude cancelled and deleted bookings
        const validUpcoming = upcomingRes.value.filter(b => {
          const s = (b.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'deleted';
        });
        setOverallUpcomingCount(validUpcoming.length);
      } else {
        setOverallUpcomingCount(0);
      }

      if (financialRes.status === 'fulfilled' && financialRes.value?.summary) {
        const collected = Number(financialRes.value.summary.totalCollected ?? 0);
        setFinancialTotalCollected(collected);
      } else {
        setFinancialTotalCollected(0);
      }
    } catch (err) {
      console.warn('⚠️ [DashboardScreen] Failed to load dashboard data:', err);
    } finally {
      setIsLoadingDashboardStats(false);
    }
  }, [todayKey]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Backward compatibility alias for single-function refresh
  const loadTodayBookings = loadDashboardData;

  // Periodic refresh to keep LIVE / UPCOMING / COMPLETED classification accurate as time passes
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayBookings(prev => sortTodayBookingsByStatusOrder(prev));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Overview Stats:
  // Strict Constraint: Today's Events === Live + Upcoming + Completed
  // - Exclude cancelled or deleted bookings
  // - Count unique bookings by ID only
  const overviewCounts = useMemo(() => {
    // Exclude cancelled / deleted
    const valid = todayBookings.filter(b => {
      const s = (b.status || '').toLowerCase();
      return s !== 'cancelled' && s !== 'deleted';
    });

    // Unique by ID only
    const seen = new Set<string>();
    const uniqueList: ScheduleBooking[] = [];
    for (const b of valid) {
      const id = String(b.id);
      if (!seen.has(id)) {
        seen.add(id);
        uniqueList.push(b);
      }
    }

    const now = new Date();
    let live = 0;
    let upcoming = 0;
    let completed = 0;

    for (const b of uniqueList) {
      const cat = classifyTodayBooking(b, now);
      if (cat === 'LIVE') {
        live++;
      } else if (cat === 'UPCOMING') {
        upcoming++;
      } else {
        completed++;
      }
    }

    return {
      todayTotal: uniqueList.length,
      liveCount: live,
      upcomingCount: upcoming,
      completedCount: completed,
    };
  }, [todayBookings]);

  const dynamicStats: OverviewStatItem[] = useMemo(() => {
    const isTa = (i18n.language || 'ta').startsWith('ta');
    const { todayTotal, completedCount } = overviewCounts;

    return DASHBOARD_MOCK_DATA.overview.stats.map(stat => {
      if (stat.id === '1' || stat.id === 'stat-today') {
        return {
          ...stat,
          value: isLoadingDashboardStats ? '--' : String(todayTotal).padStart(2, '0'),
        };
      }
      if (stat.id === '2' || stat.id === 'stat-upcoming') {
        return {
          ...stat,
          title: isTa ? 'வரவிருப்பவை' : 'Upcoming',
          value: isLoadingDashboardStats ? '--' : String(overallUpcomingCount).padStart(2, '0'),
          subtitle: isTa ? 'அனைத்து வரவிருப்பவை' : 'All Upcoming',
        };
      }
      if (stat.id === '3' || stat.id === 'stat-financial') {
        const displayVal =
          financialTotalCollected === null || isLoadingDashboardStats
            ? '--'
            : `₹ ${Number(financialTotalCollected).toLocaleString('en-IN')}`;
        return {
          ...stat,
          title: isTa ? 'நிதி தணிக்கைகள்' : 'Financial Audits',
          value: displayVal,
          subtitle: isTa ? 'கட்டண வசூல்' : 'Total Collections',
          valueColor: '#B08D43',
        };
      }
      if (stat.id === '4' || stat.id === 'stat-completed') {
        return {
          ...stat,
          value: isLoadingDashboardStats ? '--' : String(completedCount).padStart(2, '0'),
          subtitle: isTa ? 'இன்று முடிவுற்றவை' : "Today's Completed",
        };
      }
      return stat;
    });
  }, [overviewCounts, overallUpcomingCount, financialTotalCollected, isLoadingDashboardStats, i18n.language]);

  const handleNotificationsPress = () => {
    navigation.navigate('Notification');
  };

  const handleViewFullPanchangam = () => {
    Alert.alert(
      t('dashboard.fullPanchangamTitle'),
      t('dashboard.fullPanchangamMessage')
    );
  };

  const handleStatPress = (stat: OverviewStatItem) => {
    const id = stat.id;
    // 1. Today's Events: Smoothly scroll directly to Today's Events section
    if (id === 'stat-today' || id === '1') {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, todaySectionY - 12),
        animated: true,
      });
      return;
    }
    // 2. Upcoming: Navigate to dedicated UpcomingEventsScreen
    if (id === 'stat-upcoming' || id === '2') {
      (navigation as any)?.navigate('UpcomingEvents');
      return;
    }
    // 3. Financial Audits: Navigate directly to FinancialAuditsScreen
    if (id === 'stat-financial' || id === 'stat-pending' || id === '3' || id === 'stat-live') {
      (navigation as any)?.navigate('FinancialAudits');
      return;
    }
    // 4. Completed: Navigate to dedicated CompletedEventsScreen
    if (id === 'stat-completed' || id === '4') {
      (navigation as any)?.navigate('CompletedEvents');
      return;
    }
    Alert.alert(stat.title, `${stat.value} ${stat.subtitle}`);
  };

  const handleViewAllEvents = () => {
    navigation?.navigate('DailySchedule');
  };

  const liveBooking = useMemo(() => {
    return todayBookings.find(b => {
      const cls = classifyTodayBooking(b);
      return cls === 'LIVE';
    });
  }, [todayBookings]);

  const liveOperationData = useMemo(() => {
    if (!liveBooking) return undefined;
    const isTa = (i18n.language || 'ta').startsWith('ta');
    return {
      statusBadge: isTa ? 'நேரலை நிகழ்வு' : 'Live Event',
      title: isTa
        ? liveBooking.titleTamil || liveBooking.titleEnglish || ''
        : liveBooking.titleEnglish || liveBooking.titleTamil || '',
      location: isTa
        ? liveBooking.locationTamil || liveBooking.venueType || ''
        : liveBooking.locationTamil || liveBooking.venueType || '',
      timeRange: liveBooking.timeSlot || `${liveBooking.startTime} – ${liveBooking.endTime}`,
      priestInfo: liveBooking.priestNameTamil || '',
      assistantInfo: liveBooking.assistantNameTamil || '',
    };
  }, [liveBooking, i18n.language]);

  const handleLiveOperationPress = () => {
    if (liveOperationData) {
      Alert.alert(
        t('dashboard.liveEventTitle'),
        `${liveOperationData.title}\n${t('common.location')}: ${liveOperationData.location}`
      );
    }
  };

  const handleBookingPress = (booking: ScheduleBooking) => {
    setSelectedBooking(booking);
    setIsDetailModalVisible(true);
  };

  const handleEditBooking = (booking: ScheduleBooking) => {
    const check = isBookingEditable(booking);
    if (!check.isEditable) {
      Alert.alert(
        t('bookingDetail.editUnavailable'),
        check.reasonTa || check.reasonEn || t('bookingDetail.editNotice')
      );
      return;
    }
    setIsDetailModalVisible(false);
    setEditingBooking(booking);
    setIsRegistrationModalVisible(true);
  };

  const handleNewBooking = () => {
    setEditingBooking(null);
    setIsRegistrationModalVisible(true);
  };

  const handleRegistrationSubmit = async (formData: NewBookingFormData) => {
    try {
      const payload = buildBookingPayload(formData);

      if (editingBooking) {
        // Edit flow: Update existing booking via PUT /api/v1/bookings/:id
        const updated = await bookingApiService.updateBooking(editingBooking.id, payload);
        setIsRegistrationModalVisible(false);
        setEditingBooking(null);
        setSelectedBooking(updated);
        await loadTodayBookings();
        Alert.alert(
          t('bookingDetail.updateSuccess') || 'பூஜை பதிவு புதுப்பிக்கப்பட்டது',
          `${updated.titleTamil || updated.titleEnglish} (${formData.timeSlot})\n${t('common.client')}: ${formData.clientName}`
        );
      } else {
        // Create flow: Add new booking via POST /api/v1/bookings
        const newBooking = await bookingApiService.createBooking(payload);
        setIsRegistrationModalVisible(false);
        await loadTodayBookings();
        Alert.alert(
          t('dashboard.bookingSuccessTitle'),
          `${newBooking.titleTamil || newBooking.titleEnglish} (${formData.timeSlot})\n${t('common.client')}: ${formData.clientName}\n${t('common.location')}: ${formData.location}\n${t('common.priest')}: ${formData.priestName}`,
          [
            {
              text: t('dashboard.viewScheduleBtn'),
              onPress: () => navigation?.navigate('DailySchedule'),
            },
            { text: t('common.ok') },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('பதிவு பிழை', err?.message || 'செயல்பாட்டை முடிக்க முடியவில்லை');
      throw err;
    }
  };

  // Safe area metrics for responsive bottom positioning
  const bottomNavHeight = 56 + Math.max(insets.bottom, 8);
  const fabBottomOffset = bottomNavHeight + 12;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Top Safe Area View Spacer */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* SECTION 1: Top App Header */}
      <DashboardHeader
        brandTitle={DASHBOARD_MOCK_DATA.header.brandTitle}
        notificationCount={unreadCount}
        onPressNotifications={handleNotificationsPress}
      />

      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomNavHeight + 80, // Ample room to scroll past floating button
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 2: Dashboard Welcome Area */}
        <DashboardWelcome
          dashboardLabel={DASHBOARD_MOCK_DATA.welcome.dashboardLabel}
          greeting={t('dashboard.greeting')}
        />

        {/* SECTION 3: Today's Panchangam */}
        <PanchangamCard
          data={DASHBOARD_MOCK_DATA.panchangam}
          onPressViewFull={handleViewFullPanchangam}
        />

        {/* SECTION 4: Today's Overview */}
        <OverviewSection
          title={t('dashboard.overviewTitle')}
          stats={dynamicStats}
          onPressStat={handleStatPress}
        />

        {/* SECTION 5: Today's Events */}
        <View
          onLayout={event => {
            const layout = event.nativeEvent.layout;
            setTodaySectionY(layout.y);
          }}
        >
          <TodayEventsSection
            title={t('dashboard.todayEventsTitle')}
            count={todayCount}
            actionText={t('common.viewAll')}
            liveOperation={liveOperationData}
            bookings={todayBookings}
            onPressViewAll={handleViewAllEvents}
            onPressLiveOperation={handleLiveOperationPress}
            onPressBooking={handleBookingPress}
          />
        </View>
      </ScrollView>

      {/* SECTION 6: Floating New Booking Button */}
      <NewBookingButton
        title={t('dashboard.newBookingBtnTitle')}
        subtext={t('dashboard.newBookingBtnSub')}
        bottomOffset={fabBottomOffset}
        align="right"
        onPress={handleNewBooking}
      />

      {/* SECTION 7: Bottom Navigation */}
      <DashboardBottomNav
        activeTab={activeTab}
        onTabPress={tabId => {
          setActiveTab(tabId);
          if (tabId === 'date') {
            navigation?.navigate('DailySchedule');
          } else if (tabId === 'priest') {
            navigation?.navigate('Priest');
          } else if (tabId === 'settings' || tabId === 'profile') {
            navigation?.navigate('Settings');
          }
        }}
      />

      {/* Booking Detail Modal */}
      <BookingDetailModal
        visible={isDetailModalVisible}
        booking={selectedBooking}
        onClose={() => {
          setIsDetailModalVisible(false);
          loadTodayBookings();
        }}
        onEdit={handleEditBooking}
      />

      {/* Shared Bottom-Up Registration / Edit Modal */}
      <PoojaBookingFormModal
        visible={isRegistrationModalVisible}
        initialBooking={editingBooking || undefined}
        editBooking={editingBooking || undefined}
        onClose={() => {
          setIsRegistrationModalVisible(false);
          setEditingBooking(null);
          loadTodayBookings();
        }}
        onSubmit={handleRegistrationSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white matching reference
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
