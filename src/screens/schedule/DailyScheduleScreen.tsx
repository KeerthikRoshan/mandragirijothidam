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

  // Filter Bookings for Timeline Display
  const displayedBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === selectedDate)
      .filter(b => (selectedCategory === 'all' ? true : b.category === selectedCategory));
  }, [bookings, selectedDate, selectedCategory]);

  // Handlers
  const handleToggleCalendarMode = () => {
    setCalendarMode(prev => (prev === 'week' ? 'month' : 'week'));
  };

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  const handleBookingPress = (booking: ScheduleBooking) => {
    Alert.alert(
      booking.titleTamil,
      `நேரம்: ${booking.timeSlot}\nவாடிக்கையாளர்: ${booking.clientName}\nதொலைபேசி: ${booking.clientPhone}\nஇடம்: ${booking.locationTamil}\nபுரோகிதர்: ${booking.priestNameTamil}\nநிலை: ${booking.statusLabelTamil}`,
      [{ text: t('common.ok') }]
    );
  };

  const handleCreateBooking = async (formData: NewBookingFormData) => {
    try {
      const startTime = formData.timeSlot.split('-')[0].trim();
      const payload = {
        dateKey: formData.dateKey,
        booking_date: formData.dateKey,
        date: formData.dateKey,
        title: formData.title,
        clientName: formData.clientName,
        client_name: formData.clientName,
        phone: formData.phone,
        client_phone: formData.phone,
        alternatePhone: formData.alternatePhone || null,
        alternate_phone: formData.alternatePhone || null,
        startTime: startTime,
        start_time: startTime,
        durationMinutes: formData.durationMinutes,
        duration_minutes: formData.durationMinutes,
        timeSlot: formData.timeSlot,
        venueType: formData.venueType,
        venue_type: formData.venueType,
        location: formData.location,
        address: formData.address || null,
        area: formData.area || null,
        pincode: formData.pincode || null,
        samagriBy: formData.samagriBy,
        samagri_by: formData.samagriBy,
        notes: formData.notes || null,
        priestId: formData.priestId,
        priest_id: formData.priestId,
        priestIds: formData.priestId ? [formData.priestId] : [],
        priest_ids: formData.priestId ? [formData.priestId] : [],
        category: formData.category || 'outdoor',
        category_label_tamil: formData.categoryLabelTamil,
        totalEventCharge: formData.totalEventCharge,
        total_event_charge: formData.totalEventCharge,
        clientAdvanceAmount: formData.clientAdvanceAmount,
        client_advance_amount: formData.clientAdvanceAmount,
        clientTotalReceived: formData.clientTotalReceived,
        client_total_received: formData.clientTotalReceived,
        priestTotalPay: formData.priestTotalPay,
        priest_total_pay: formData.priestTotalPay,
        priestAdvancePaid: formData.priestAdvancePaid,
        priest_advance_paid: formData.priestAdvancePaid,
      };

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
    } catch (err: any) {
      Alert.alert(
        t('schedule.conflictTitle') || 'பதிவு பிழை',
        err?.message || 'பதிவை சேமிக்க முடியவில்லை'
      );
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

      {/* Shared Bottom-Up Registration Modal */}
      <PoojaBookingFormModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateBooking}
        selectedDate={selectedDate}
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
