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
import { useNavigation } from '@react-navigation/native';
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

function convertMockToScheduleBooking(
  mock: EventBookingItem,
  todayKey: string
): ScheduleBooking {
  const parts = (mock.timeRange || '09:00 AM – 10:00 AM').split('–');
  const start = parts[0]?.trim() || '09:00 AM';
  const end = parts[1]?.trim() || '10:00 AM';
  return {
    id: mock.id,
    bookingNumber: `#BK-${mock.id.replace('event-', '')}`,
    date: todayKey,
    startTime: start,
    endTime: end,
    timeSlot: `${start} - ${end}`,
    durationMinutes: 60,
    titleTamil: mock.titleTamil,
    titleEnglish: mock.titleEnglish || '',
    clientName: mock.customerName,
    clientPhone: '98401 23456',
    locationTamil: mock.location || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்',
    priestNameTamil: mock.adminOrPriestInfo || 'சுவாமி சுந்தரமூர்த்தி குருக்கள்',
    category: mock.category === 'ஜாதகம்' ? 'jathagam' : 'outdoor',
    categoryLabelTamil: mock.category,
    status: 'confirmed',
    statusLabelTamil: mock.status || 'உறுதியானது',
    totalEventCharge: 5000,
    clientAdvanceAmount: 1500,
    clientTotalReceived: 1500,
    clientBalanceAmount: 3500,
    clientPaymentStatus: 'partial',
    venueType: 'home',
  };
}

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { t, i18n } = useTranslation();
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
  const [todayBookings, setTodayBookings] = useState<ScheduleBooking[]>(() =>
    sortTodayBookingsByStatusOrder(
      DASHBOARD_MOCK_DATA.todayEvents.bookings.map(m =>
        convertMockToScheduleBooking(m, todayKey)
      )
    )
  );
  const [todayCount, setTodayCount] = useState<number>(
    DASHBOARD_MOCK_DATA.todayEvents.bookings.length
  );

  const loadTodayBookings = useCallback(async () => {
    try {
      const list = await bookingApiService.getBookingsByDate(todayKey);
      if (list && list.length > 0) {
        // Strictly filter bookings scheduled for current local date only
        const strictlyToday = list.filter(b => b.date === todayKey);
        // Sort in strict order: LIVE -> UPCOMING -> COMPLETED
        const sorted = sortTodayBookingsByStatusOrder(strictlyToday);
        setTodayBookings(sorted);
        setTodayCount(sorted.length);
        return;
      }
    } catch (err) {
      console.warn('⚠️ [DashboardScreen] Failed to load today bookings:', err);
    }
    // Fallback to sample bookings for today if live database has none yet
    const fallback = DASHBOARD_MOCK_DATA.todayEvents.bookings.map(m =>
      convertMockToScheduleBooking(m, todayKey)
    );
    const sortedFallback = sortTodayBookingsByStatusOrder(fallback);
    setTodayBookings(sortedFallback);
    setTodayCount(sortedFallback.length);
  }, [todayKey]);

  useEffect(() => {
    loadTodayBookings();
  }, [loadTodayBookings]);

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
    const { todayTotal, liveCount, upcomingCount, completedCount } = overviewCounts;

    return DASHBOARD_MOCK_DATA.overview.stats.map(stat => {
      if (stat.id === '1' || stat.id === 'stat-today') {
        return {
          ...stat,
          value: String(todayTotal).padStart(2, '0'),
        };
      }
      if (stat.id === '2' || stat.id === 'stat-upcoming') {
        return {
          ...stat,
          value: String(upcomingCount).padStart(2, '0'),
          subtitle: isTa ? 'இன்று வரவிருப்பவை' : "Today's Upcoming",
        };
      }
      if (stat.id === '3' || stat.id === 'stat-financial') {
        return {
          ...stat,
          title: liveCount > 0 ? (isTa ? 'நேரலை நிகழ்வுகள்' : 'Live Events') : stat.title,
          value: liveCount > 0 ? String(liveCount).padStart(2, '0') : stat.value,
          subtitle: liveCount > 0 ? (isTa ? 'நடைபெறுகிறது' : 'In Progress') : stat.subtitle,
          valueColor: liveCount > 0 ? '#16A34A' : stat.valueColor,
        };
      }
      if (stat.id === '4' || stat.id === 'stat-completed') {
        return {
          ...stat,
          value: String(completedCount).padStart(2, '0'),
          subtitle: isTa ? 'இன்று முடிவுற்றவை' : "Today's Completed",
        };
      }
      return stat;
    });
  }, [overviewCounts, i18n.language]);

  const handleNotificationsPress = () => {
    Alert.alert(
      t('dashboard.notificationsTitle'),
      t('dashboard.notificationsMessage', { count: 3 })
    );
  };

  const handleViewFullPanchangam = () => {
    Alert.alert(
      t('dashboard.fullPanchangamTitle'),
      t('dashboard.fullPanchangamMessage')
    );
  };

  const handleReportsPress = () => {
    (navigation as any)?.navigate('FinancialAudits');
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
    // 3. Financial Audits or Live Events
    if (id === 'stat-financial' || id === 'stat-pending' || id === '3' || id === 'stat-live') {
      if (overviewCounts.liveCount > 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, todaySectionY - 12),
          animated: true,
        });
        return;
      }
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

  const handleLiveOperationPress = () => {
    const live = DASHBOARD_MOCK_DATA.todayEvents.liveOperation;
    Alert.alert(
      t('dashboard.liveEventTitle'),
      `${live.title}\n${t('common.location')}: ${live.location}`
    );
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
        notificationCount={DASHBOARD_MOCK_DATA.header.notificationCount}
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
          actionText={t('dashboard.statsReports')}
          stats={dynamicStats}
          onPressReports={handleReportsPress}
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
            liveOperation={DASHBOARD_MOCK_DATA.todayEvents.liveOperation}
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
