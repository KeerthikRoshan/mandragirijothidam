/**
 * PriestScreen Component (புரோகிதர் & உதவியாளர்)
 *
 * Implements the Priest & Assistant screen for Mandhragiri Jothidam:
 * 1. Top App Header matching ScheduleHeader (back button, bilingual title, Add Priest action).
 * 2. Search Bar with Tamil & English placeholder and real-time staff filtering.
 * 3. Section Header: "புரோகிதர் & உதவியாளர் குழு" with dynamic active staff count pill.
 * 4. Horizontal Priest Selection List with responsive card widths, crisp avatars, and "+ சேர்க்க" card.
 * 5. Main Priest Profile Card:
 *    - Balanced avatar, name, and role badge without text squeezing.
 *    - Full Tamil title & tradition without awkward truncation.
 *    - Dedicated reserved call button layout.
 *    - 3 Equal-width statistics columns with gold highlight for this week's bookings.
 *    - Consistent, aligned phone, expertise, and languages information rows.
 * 6. Equal-height Booking Tabs (கடந்தவை, நிகழ்வு, அடுத்தவை) with context-aware summary bar.
 * 7. 100% mathematically synchronized counts & booking timeline for selected priest.
 * 8. Add New Priest Modal (AddPriestModal) triggered by header icon and horizontal list "+ சேர்க்க" card.
 * 9. Floating New Booking Button (+ பூஜை பதிவு (New)) triggering PoojaBookingFormModal.
 * 10. Bottom Navigation with 'priest' tab active.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, X } from 'lucide-react-native';
import { PriestHeader } from '../../components/priest/PriestHeader';
import { PriestList } from '../../components/priest/PriestList';
import { PriestProfileCard } from '../../components/priest/PriestProfileCard';
import { PriestBookingTabs } from '../../components/priest/PriestBookingTabs';
import { AddPriestModal } from '../../components/priest/AddPriestModal';
import { BookingCard } from '../../components/schedule/BookingCard';
import { NewBookingButton } from '../../components/dashboard/NewBookingButton';
import { DashboardBottomNav } from '../../components/dashboard/DashboardBottomNav';
import {
  PoojaBookingFormModal,
  NewBookingFormData,
} from '../../components/common/PoojaBookingFormModal';
import { PriestBookingTab, PriestStaffItem } from '../../types/priest';
import { PriestScreenNavigationProp } from '../../types/navigation';
import { ScheduleBooking } from '../../types/schedule';
import { getPriestBookingCategories } from '../../utils/priestBookingSelectors';
import { staffService } from '../../services/staffService';
import { bookingApiService } from '../../services/bookingApiService';
import { useTranslation } from 'react-i18next';

export const PriestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PriestScreenNavigationProp>();
  const { t } = useTranslation();

  // State
  const [staffList, setStaffList] = useState<PriestStaffItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedPriestId, setSelectedPriestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBookingTab, setActiveBookingTab] =
    useState<PriestBookingTab>('active');

  // Separate modal states: Add Priest vs New Pooja Registration
  const [isAddPriestModalVisible, setIsAddPriestModalVisible] =
    useState<boolean>(false);
  const [isRegistrationModalVisible, setIsRegistrationModalVisible] =
    useState<boolean>(false);

  // Dynamic Priest Bookings fetched from backend API
  const [dynamicPriestBookings, setDynamicPriestBookings] = useState<ScheduleBooking[]>([]);

  const loadPriestBookings = useCallback(async (priestId: string) => {
    try {
      const list = await bookingApiService.getPriestBookings(priestId);
      if (list && list.length > 0) {
        setDynamicPriestBookings(list);
      } else {
        setDynamicPriestBookings([]);
      }
    } catch (err) {
      console.warn('⚠️ [PriestScreen] Failed to load priest bookings from API:', err);
    }
  }, []);

  // Fetch staff directory from backend database API: GET /api/v1/staff
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const staff = await staffService.fetchStaff();
      setStaffList(staff);
      const targetPriestId = selectedPriestId && staff.some(s => s.id === selectedPriestId)
        ? selectedPriestId
        : (staff.length > 0 ? staff[0].id : null);
      setSelectedPriestId(targetPriestId);
      if (targetPriestId) {
        await loadPriestBookings(targetPriestId);
      }
    } catch (error) {
      console.warn('Failed to refresh staff from API:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedPriestId, loadPriestBookings]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const staff = await staffService.fetchStaff();
        if (isMounted) {
          setStaffList(staff);
          const firstId = staff.length > 0 ? staff[0].id : null;
          setSelectedPriestId(prev => (prev && staff.some(s => s.id === prev) ? prev : firstId));
          if (firstId) {
            loadPriestBookings(firstId);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch staff from API:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    const unsubscribe = staffService.subscribe(() => {
      if (!isMounted) return;
      const current = staffService.getAllStaff();
      setStaffList(current);
      setSelectedPriestId(prev => {
        if (prev && current.some(s => s.id === prev)) {
          return prev;
        }
        return current.length > 0 ? current[0].id : null;
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadPriestBookings]);

  // Dynamically resolve currently selected priest
  const selectedPriest: PriestStaffItem | null = useMemo(() => {
    if (staffList.length === 0) return null;
    return staffList.find(p => p.id === selectedPriestId) || staffList[0] || null;
  }, [staffList, selectedPriestId]);

  // Load priest bookings whenever active priest selection changes
  useEffect(() => {
    if (selectedPriest?.id) {
      loadPriestBookings(selectedPriest.id);
    }
  }, [selectedPriest?.id, loadPriestBookings]);

  // Dynamic active staff count calculated strictly from records where status === 'active'
  const activeCount = useMemo(() => {
    return staffList.filter(s => s.status === 'active').length;
  }, [staffList]);

  // Filter priests by search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) {
      return staffList;
    }
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter(
      p =>
        (p.nameEnglish && p.nameEnglish.toLowerCase().includes(q)) ||
        (p.nameTamil && p.nameTamil.includes(q)) ||
        (p.designationTamil && p.designationTamil.includes(q)) ||
        (p.expertiseTamil && p.expertiseTamil.includes(q))
    );
  }, [staffList, searchQuery]);

  // Synchronized bookings and statistics calculated via selector utility
  const priestBookings = useMemo(() => {
    if (dynamicPriestBookings.length > 0) {
      return dynamicPriestBookings;
    }
    return selectedPriest?.bookings || [];
  }, [dynamicPriestBookings, selectedPriest?.bookings]);

  const bookingCategories = useMemo(() => {
    if (!selectedPriest) {
      return {
        all: [],
        past: [],
        active: [],
        upcoming: [],
        thisWeek: [],
        conflicts: [],
        counts: {
          total: 0,
          past: 0,
          active: 0,
          upcoming: 0,
          thisWeek: 0,
          conflicts: 0,
        },
      };
    }
    return getPriestBookingCategories(priestBookings, '2026-10-16');
  }, [selectedPriest, priestBookings]);

  // Bookings to display under current tab — guaranteed to match tab count exactly
  const currentTabBookings: ScheduleBooking[] = useMemo(() => {
    return bookingCategories[activeBookingTab] || [];
  }, [bookingCategories, activeBookingTab]);

  const handleBookingPress = (booking: ScheduleBooking) => {
    Alert.alert(
      booking.titleTamil,
      `நேரம்: ${booking.timeSlot}\nவாடிக்கையாளர்: ${booking.clientName}\nஇடம்: ${booking.locationTamil || 'ஆலயம்'}\nநிலை: ${booking.statusLabelTamil}`
    );
  };

  const handleAddNewPriest = (newPriest: PriestStaffItem) => {
    setSelectedPriestId(newPriest.id);
    setIsAddPriestModalVisible(false);
  };

  const handleCreateBooking = async (formData: NewBookingFormData) => {
    try {
      const startTime = formData.timeSlot.split('-')[0].trim();
      const targetPriestId = formData.priestId || (selectedPriest ? selectedPriest.id : undefined);
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
        priestId: targetPriestId,
        priest_id: targetPriestId,
        priestIds: targetPriestId ? [targetPriestId] : [],
        priest_ids: targetPriestId ? [targetPriestId] : [],
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

      const newBooking = await bookingApiService.createBooking(payload);
      setIsRegistrationModalVisible(false);
      if (selectedPriest?.id) {
        await loadPriestBookings(selectedPriest.id);
      }
      Alert.alert(
        'பூஜை பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது',
        `${newBooking.titleTamil || newBooking.titleEnglish} (${formData.timeSlot})\nபக்தர்: ${formData.clientName}\nபுரோகிதர்: ${formData.priestName}`
      );
    } catch (err: any) {
      Alert.alert('பதிவு பிழை', err?.message || 'பூஜை பதிவை சேர்க்க முடியவில்லை');
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

      {/* 1. Top App Header (like ScheduleHeader in DailyScheduleScreen) */}
      <PriestHeader
        onPressBack={() => navigation.navigate('Dashboard')}
        onPressAdd={() => setIsAddPriestModalVisible(true)}
        activeCount={activeCount}
      />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 84 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#0B5E41']}
            tintColor="#0B5E41"
          />
        }
      >
        {/* 2. Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('priest.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
              >
                <X size={16} color="#64748B" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Horizontal Priest Selection List with Add Staff Button */}
        <PriestList
          staffList={filteredStaff}
          selectedPriestId={selectedPriest?.id || ''}
          onSelectPriest={priest => setSelectedPriestId(priest.id)}
          onPressAdd={() => setIsAddPriestModalVisible(true)}
        />

        {/* Loading State when initial fetch is pending */}
        {isLoading && staffList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0B5E41" />
            <Text style={styles.loadingText}>
              {t('common.loading', 'பணியாளர்கள் விவரங்கள் ஏற்றப்படுகின்றன...')}
            </Text>
          </View>
        ) : selectedPriest ? (
          <>
            {/* 5. Main Priest Profile Card with Synchronized Statistics & Attendance Navigation */}
            <PriestProfileCard
              priest={selectedPriest}
              stats={bookingCategories.counts}
              onPressAttendance={priest =>
                navigation.navigate('StaffAttendanceDetail', {
                  staffId: priest.id,
                })
              }
            />

            {/* 6. Booking Tabs & Context-Aware Scheduled Info */}
            <PriestBookingTabs
              activeTab={activeBookingTab}
              onSelectTab={setActiveBookingTab}
              tabCounts={{
                past: bookingCategories.counts.past,
                active: bookingCategories.counts.active,
                upcoming: bookingCategories.counts.upcoming,
              }}
              scheduledCount={bookingCategories.counts[activeBookingTab]}
            />

            {/* 7. Active Bookings Timeline (100% Synchronized with active tab counter) */}
            <View style={styles.bookingsContainer}>
              {currentTabBookings.length > 0 ? (
                currentTabBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onPress={() => handleBookingPress(booking)}
                  />
                ))
              ) : (
                <View style={styles.emptyBookingsContainer}>
                  <Text style={styles.emptyBookingsText}>
                    {t('priest.emptyBookings')}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyStaffContainer}>
            <Text style={styles.emptyStaffTitle}>
              {t('priest.noStaffFound', 'பணியாளர்கள் எவரும் இல்லை')}
            </Text>
            <Text style={styles.emptyStaffSubtitle}>
              {t(
                'priest.addStaffHint',
                'புதிய புரோகிதர் அல்லது உதவியாளரை சேர்க்க மேலே உள்ள "+ சேர்க்க" பொத்தானை அழுத்தவும்'
              )}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating New Booking Button (+ பூஜை பதிவு (New)) */}
      <NewBookingButton
        title={t('dashboard.newBookingBtnTitle')}
        subtext={t('dashboard.newBookingBtnSub')}
        bottomOffset={fabBottomOffset}
        align="right"
        onPress={() => setIsRegistrationModalVisible(true)}
      />

      {/* Bottom Navigation */}
      <DashboardBottomNav
        activeTab="priest"
        onTabPress={tabId => {
          if (tabId === 'home') {
            navigation.navigate('Dashboard');
          } else if (tabId === 'date') {
            navigation.navigate('DailySchedule');
          } else if (tabId === 'settings' || tabId === 'profile') {
            navigation.navigate('Settings');
          }
        }}
      />

      {/* 1. Add New Priest Modal (triggered by Header-Right icon & horizontal list "+ சேர்க்க" card) */}
      <AddPriestModal
        visible={isAddPriestModalVisible}
        onClose={() => setIsAddPriestModalVisible(false)}
        onSubmit={handleAddNewPriest}
      />

      {/* 2. Shared Pooja Registration Modal (triggered by bottom floating "+ பூஜை பதிவு (New)" button) */}
      <PoojaBookingFormModal
        visible={isRegistrationModalVisible}
        onClose={() => setIsRegistrationModalVisible(false)}
        onSubmit={handleCreateBooking}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Matching dashboard & schedule theme
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 0,
  },
  bookingsContainer: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  emptyBookingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  emptyBookingsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStaffContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStaffTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStaffSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
