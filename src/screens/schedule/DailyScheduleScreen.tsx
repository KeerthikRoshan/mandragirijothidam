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

import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { formatTamilDisplayDate } from '../../utils/dateUtils';

export const DailyScheduleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DailyScheduleScreenNavigationProp>();
  const route = useRoute<DailyScheduleScreenRouteProp>();
  const { t } = useTranslation();

  // Default to 2026-11-21 (matches weekly reference) or route initialDate
  const defaultDate = route?.params?.initialDate || '2026-11-21';

  // Shared Screen State
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('time');
  const [selectedCategory, setSelectedCategory] = useState<BookingCategory>('all');
  const [bookings, setBookings] = useState<ScheduleBooking[]>(INITIAL_SCHEDULE_BOOKINGS);
  const [blocks] = useState(INITIAL_SCHEDULE_BLOCKS);

  // Add Function Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

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

  const handleCreateBooking = (formData: NewBookingFormData) => {
    const startTime = formData.timeSlot.split('-')[0].trim();
    const endTime = formData.timeSlot.split('-')[1]?.trim() || '';

    // Validate availability
    const validation = validateBookingAvailability(
      formData.dateKey,
      startTime,
      endTime,
      bookings,
      blocks
    );

    if (!validation.isValid) {
      Alert.alert(t('schedule.conflictTitle'), validation.reason || t('schedule.conflictDefault'));
      return;
    }

    const newBookingItem: ScheduleBooking = {
      id: `b-${Date.now()}`,
      date: formData.dateKey,
      timeSlot: formData.timeSlot,
      startTime,
      endTime,
      titleTamil: formData.title,
      category: formData.category,
      categoryLabelTamil: formData.categoryLabelTamil,
      status: 'confirmed',
      statusLabelTamil: 'உறுதி செய்யப்பட்டது',
      clientName: formData.clientName,
      clientPhone: formData.phone,
      locationTamil: formData.location,
      priestId: formData.priestId,
      priestNameTamil: formData.priestName,
      priestPhone: formData.priestPhone,
      amount: formData.totalEventCharge > 0 ? `₹ ${formData.totalEventCharge.toLocaleString('en-IN')}` : undefined,
      totalEventCharge: formData.totalEventCharge,
      clientAdvanceAmount: formData.clientAdvanceAmount,
      clientTotalReceived: formData.clientTotalReceived,
      clientBalanceAmount: formData.clientBalanceAmount,
      priestTotalPay: formData.priestTotalPay,
      priestAdvancePaid: formData.priestAdvancePaid,
      priestBalanceAmount: formData.priestBalanceAmount,
    };

    setBookings(prev => [...prev, newBookingItem]);

    setIsAddModalVisible(false);

    Alert.alert(
      t('schedule.bookingConfirmedAlert'),
      t('schedule.bookingAddedMessage', {
        date: formatTamilDisplayDate(formData.dateKey),
        title: newBookingItem.titleTamil,
      })
    );
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
