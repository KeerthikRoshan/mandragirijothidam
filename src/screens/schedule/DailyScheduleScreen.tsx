/**
 * DailyScheduleScreen Component
 * Complete, production-ready Daily Schedule & Tamil Calendar screen for Mandhragiri Jothidam.
 *
 * Combines TWO view modes into a single unified screen:
 * 1. Weekly Calendar View (Default) — 7-day strip, gold-bordered selected date, booking counts.
 * 2. Full Monthly Calendar View — 7-column grid, Tamil date numbers, verified Muhurtham markings,
 *    star indicators, booking dots, and month navigator.
 *
 * Shares state:
 * - selectedDate (local YYYY-MM-DD)
 * - calendarMode ('week' | 'month')
 * - viewMode ('time' | 'priest')
 * - selectedCategory ('all' | 'jathagam' | 'temple' | 'outdoor')
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PoojaBookingFormModal, NewBookingFormData } from '../../components/common/PoojaBookingFormModal';
import { ScheduleHeader } from '../../components/schedule/ScheduleHeader';
import { WeeklyCalendar } from '../../components/schedule/WeeklyCalendar';
import { MonthlyCalendar } from '../../components/schedule/MonthlyCalendar';
import { DateSummary } from '../../components/schedule/DateSummary';
import { ScheduleViewToggle } from '../../components/schedule/ScheduleViewToggle';
import { ScheduleCategoryFilters } from '../../components/schedule/ScheduleCategoryFilters';
import { BookingTimeline } from '../../components/schedule/BookingTimeline';
import { BookingDetailModal } from '../../components/common/BookingDetailModal';
import { buildBookingPayload, isBookingEditable, sortBookingsChronologically } from '../../utils/bookingRules';
import { NewBookingButton } from '../../components/dashboard/NewBookingButton';
import { DashboardBottomNav } from '../../components/dashboard/DashboardBottomNav';
import {
  BookingCategory,
  CalendarMode,
  CategoryFilterItem,
  ScheduleBooking,
  ScheduleViewMode,
} from '../../types/schedule';
import {
  DailyScheduleScreenNavigationProp,
  DailyScheduleScreenRouteProp,
} from '../../types/navigation';
import { getTamilDateInfo } from '../../services/tamilCalendarService';
import {
  getDateBookingSummary,
  validateBookingAvailability,
} from '../../services/scheduleAvailabilityService';
import {
  INITIAL_SCHEDULE_BLOCKS,
  INITIAL_SCHEDULE_BOOKINGS,
} from '../../data/scheduleMockData';
import { formatTamilDisplayDate, formatDateKey } from '../../utils/dateUtils';
import { bookingApiService } from '../../services/bookingApiService';

export const DailyScheduleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DailyScheduleScreenNavigationProp>();
  const route = useRoute<DailyScheduleScreenRouteProp>();
  const { t } = useTranslation();

  // Automatically select current date (today) by default, or route initialDate if provided
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const defaultDate = route?.params?.initialDate || todayKey;

  // Shared Screen State
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('time');
  const [selectedCategory, setSelectedCategory] = useState<BookingCategory>('all');
  const [bookings, setBookings] = useState<ScheduleBooking[]>(INITIAL_SCHEDULE_BOOKINGS);
  const [blocks] = useState(INITIAL_SCHEDULE_BLOCKS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Add Function Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<ScheduleBooking | null>(null);

  // Dynamic API load for bookings
  const loadBookings = useCallback(async () => {
    try {
      const data = await bookingApiService.listBookings();
      if (data && data.length > 0) {
        setBookings(data);
      }
    } catch (err) {
      console.warn('⚠️ [DailyScheduleScreen] Failed to load bookings from API:', err);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  }, [loadBookings]);

  // Derived Tamil Info & Dynamic Summary for Selected Date
  const tamilInfo = useMemo(() => getTamilDateInfo(selectedDate), [selectedDate]);
  const dateSummary = useMemo(
    () => getDateBookingSummary(selectedDate, bookings, blocks),
    [selectedDate, bookings, blocks]
  );

  // Compute Dynamic Category Filter Counts for the Selected Date
  const categoriesWithCounts: CategoryFilterItem[] = useMemo(() => {
    const dateBookings = bookings.filter(b => b.date === selectedDate);
    const jathagamCount = dateBookings.filter(b => b.category === 'jathagam').length;
    const templeCount = dateBookings.filter(b => b.category === 'temple').length;
    const outdoorCount = dateBookings.filter(b => b.category === 'outdoor').length;

    return [
      { id: 'all', labelTamil: t('schedule.categories.all'), labelEnglish: 'All', count: dateBookings.length },
      { id: 'jathagam', labelTamil: t('schedule.categories.jathagam'), labelEnglish: 'Horoscope', count: jathagamCount },
      { id: 'temple', labelTamil: t('schedule.categories.temple'), labelEnglish: 'Temple', count: templeCount },
      { id: 'outdoor', labelTamil: t('schedule.categories.outdoor'), labelEnglish: 'Outdoor', count: outdoorCount },
    ];
  }, [selectedDate, bookings, t]);

  // Filter Bookings for Timeline Display (Strictly sorted chronologically)
  const displayedBookings = useMemo(() => {
    const filtered = bookings
      .filter(b => b.date === selectedDate)
      .filter(b => (selectedCategory === 'all' ? true : b.category === selectedCategory));
    return sortBookingsChronologically(filtered);
  }, [bookings, selectedDate, selectedCategory]);

  // Handlers
  const handleToggleCalendarMode = () => {
    setCalendarMode(prev => (prev === 'week' ? 'month' : 'week'));
  };

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
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
    setIsAddModalVisible(true);
  };

  const handleCreateBooking = async (formData: NewBookingFormData) => {
    try {
      const payload = buildBookingPayload(formData);

      if (editingBooking) {
        const updated = await bookingApiService.updateBooking(editingBooking.id, payload);
        setBookings(prev => prev.map(b => (b.id === updated.id ? updated : b)));
        setIsAddModalVisible(false);
        setEditingBooking(null);

        Alert.alert(
          t('schedule.bookingUpdatedAlert') || 'முன்பதிவு புதுப்பிக்கப்பட்டது',
          t('schedule.bookingUpdatedMessage', {
            title: updated.titleTamil || updated.titleEnglish || updated.title,
          }) || `${updated.titleTamil || updated.titleEnglish || updated.title} விவரங்கள் வெற்றிகரமாக மாற்றப்பட்டது.`
        );
      } else {
        const newBookingItem = await bookingApiService.createBooking(payload);
        setBookings(prev => [newBookingItem, ...prev]);
        setIsAddModalVisible(false);

        Alert.alert(
          t('schedule.bookingConfirmedAlert'),
          t('schedule.bookingAddedMessage', {
            date: formatTamilDisplayDate(formData.dateKey),
            title: newBookingItem.titleTamil || newBookingItem.titleEnglish,
          })
        );
      }
    } catch (err: any) {
      Alert.alert(
        t('schedule.conflictTitle') || 'பதிவு பிழை',
        err?.message || 'பதிவை சேமிக்க முடியவில்லை'
      );
      throw err;
    }
  };


  // Safe area metrics for responsive bottom positioning
  const bottomNavHeight = 56 + Math.max(insets.bottom, 8);
  const fabBottomOffset = bottomNavHeight + 12;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Top Safe Area Spacer */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Schedule Header */}
      <ScheduleHeader
        calendarMode={calendarMode}
        onPressBack={() => navigation?.navigate('Dashboard')}
        onToggleCalendarMode={handleToggleCalendarMode}
      />

      {/* Scrollable Main Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomNavHeight + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#0B5E41']}
            tintColor="#0B5E41"
          />
        }
      >
        {/* 2. Calendar Display: Weekly or Monthly */}
        {calendarMode === 'week' ? (
          <WeeklyCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onExpandToMonth={() => setCalendarMode('month')}
            bookings={bookings}
          />
        ) : (
          <MonthlyCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            bookings={bookings}
          />
        )}

        {/* 3. Selected Date Summary Card */}
        <DateSummary
          selectedDate={selectedDate}
          tamilInfo={tamilInfo}
          summary={dateSummary}
          calendarMode={calendarMode}
          onSwitchToWeekly={() => setCalendarMode('week')}
        />

        {/* 4. Schedule View Toggle (நேர வரிசை vs குருக்கள் வாரியாக) */}
        <ScheduleViewToggle
          viewMode={viewMode}
          onSelectViewMode={setViewMode}
        />

        {/* 5. Category Filters (அனைத்தும், ஜாதகம், கோவில், வெளி நிகழ்வு) */}
        <ScheduleCategoryFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categoriesWithCounts.map(c => ({
            id: c.id,
            label: c.labelTamil,
            count: c.count,
          }))}
        />

        {/* 6. Vertical Booking Timeline */}
        <BookingTimeline
          bookings={displayedBookings}
          viewMode={viewMode}
          onSelectBooking={handleBookingPress}
        />
      </ScrollView>

      {/* Floating New Booking Button */}
      <NewBookingButton
        title={t('dashboard.newBookingBtnTitle')}
        subtext={t('dashboard.newBookingBtnSub')}
        bottomOffset={fabBottomOffset}
        align="right"
        onPress={() => setIsAddModalVisible(true)}
      />


      {/* Bottom Navigation with 'date' active */}
      <DashboardBottomNav
        activeTab="date"
        onTabPress={tabId => {
          if (tabId === 'home') {
            navigation?.navigate('Dashboard');
          } else if (tabId === 'priest') {
            navigation?.navigate('Priest');
          } else if (tabId === 'settings' || tabId === 'profile') {
            navigation?.navigate('Settings');
          }
        }}
      />

      {/* Shared Bottom-Up Registration / Edit Modal */}
      <PoojaBookingFormModal
        visible={isAddModalVisible}
        initialBooking={editingBooking || undefined}
        editBooking={editingBooking || undefined}
        onClose={() => {
          setIsAddModalVisible(false);
          setEditingBooking(null);
        }}
        onSubmit={handleCreateBooking}
        selectedDate={selectedDate}
      />

      {/* Shared Pooja Details Modal */}
      <BookingDetailModal
        visible={isDetailModalVisible}
        booking={selectedBooking}
        onClose={() => setIsDetailModalVisible(false)}
        onEdit={handleEditBooking}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
