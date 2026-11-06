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

import React, { useState } from 'react';
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
import { DashboardScreenNavigationProp } from '../../types/navigation';
import { useTranslation } from 'react-i18next';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('home');
  const [isRegistrationModalVisible, setIsRegistrationModalVisible] =
    useState<boolean>(false);

  const handleNotificationsPress = () => {
    Alert.alert(
      t('dashboard.notificationsTitle'),
      t('dashboard.notificationsMessage', { count: 3 }),
    );
  };

  const handleViewFullPanchangam = () => {
    Alert.alert(
      t('dashboard.fullPanchangamTitle'),
      t('dashboard.fullPanchangamMessage'),
    );
  };

  const handleReportsPress = () => {
    Alert.alert(
      t('dashboard.reportsTitle'),
      t('dashboard.reportsMessage'),
    );
  };

  const handleStatPress = (stat: OverviewStatItem) => {
    Alert.alert(stat.title, `${stat.value} ${stat.subtitle}`);
  };

  const handleViewAllEvents = () => {
    navigation?.navigate('DailySchedule');
  };

  const handleLiveOperationPress = () => {
    const live = DASHBOARD_MOCK_DATA.todayEvents.liveOperation;
    Alert.alert(
      t('dashboard.liveEventTitle'),
      `${live.title}\n${t('common.location')}: ${live.location}`,
    );
  };

  const handleBookingPress = (booking: EventBookingItem) => {
    Alert.alert(
      `${booking.titleTamil} • ${booking.titleEnglish}`,
      `${t('common.time')}: ${booking.timeRange}\n${t('common.client')}: ${booking.customerName}\n${t('common.status')}: ${booking.status}`,
    );
  };

  const handleNewBooking = () => {
    setIsRegistrationModalVisible(true);
  };

  const handleRegistrationSubmit = (payload: NewBookingFormData) => {
    Alert.alert(
      t('dashboard.bookingSuccessTitle'),
      `${payload.title} (${payload.timeSlot})\n${t('common.client')}: ${payload.clientName}\n${t('common.location')}: ${payload.location}\n${t('common.priest')}: ${payload.priestName}`,
      [
        {
          text: t('dashboard.viewScheduleBtn'),
          onPress: () => navigation?.navigate('DailySchedule'),
        },
        { text: t('common.ok') },
      ],
    );
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
          stats={DASHBOARD_MOCK_DATA.overview.stats}
          onPressReports={handleReportsPress}
          onPressStat={handleStatPress}
        />

        {/* SECTION 5: Today's Events */}
        <TodayEventsSection
          title={t('dashboard.todayEventsTitle')}
          count={DASHBOARD_MOCK_DATA.todayEvents.count}
          actionText={t('common.viewAll')}
          liveOperation={DASHBOARD_MOCK_DATA.todayEvents.liveOperation}
          bookings={DASHBOARD_MOCK_DATA.todayEvents.bookings}
          onPressViewAll={handleViewAllEvents}
          onPressLiveOperation={handleLiveOperationPress}
          onPressBooking={handleBookingPress}
        />
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

      {/* Shared Bottom-Up Registration Modal */}
      <PoojaBookingFormModal
        visible={isRegistrationModalVisible}
        onClose={() => setIsRegistrationModalVisible(false)}
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
