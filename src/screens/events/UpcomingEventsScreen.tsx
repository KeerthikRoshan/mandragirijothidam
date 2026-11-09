/**
 * UpcomingEventsScreen Component (வரவிருக்கும் நிகழ்வுகள்)
 *
 * Dedicated screen for all scheduled future bookings:
 * - Strictly displays bookings where startDateTime > now (excluding live and completed).
 * - Chronological ascending sort (nearest upcoming events first).
 * - Real-time search by devotee name, pooja title, booking number, phone.
 * - Date range filter pills (All Upcoming, Next 7 Days, Next 30 Days, This Month).
 * - Full booking inspection via BookingDetailModal.
 * - Editing supported for events scheduled > 24 hours in the future.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Clock,
  Filter,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking } from '../../types/schedule';
import { UpcomingEventsScreenNavigationProp } from '../../types/navigation';
import { bookingApiService } from '../../services/bookingApiService';
import { INITIAL_SCHEDULE_BOOKINGS } from '../../data/scheduleMockData';
import { buildBookingPayload, getBookingDateTimes, isBookingEditable } from '../../utils/bookingRules';
import { parseLocalDateParts } from '../../utils/timeCalculation';
import { TodayBookingCard } from '../../components/dashboard/TodayBookingCard';
import { BookingDetailModal } from '../../components/dashboard/BookingDetailModal';
import {
  PoojaBookingFormModal,
  NewBookingFormData,
} from '../../components/common/PoojaBookingFormModal';

type DateFilterType = 'all' | 'next7' | 'next30' | 'month';

export const UpcomingEventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<UpcomingEventsScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [allBookings, setAllBookings] = useState<ScheduleBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DateFilterType>('all');

  // Modal inspection & editing states
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<ScheduleBooking | null>(null);
  const [isRegistrationModalVisible, setIsRegistrationModalVisible] = useState<boolean>(false);

  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const list = await bookingApiService.listBookings();
      if (list && list.length > 0) {
        setAllBookings(list);
        return;
      }
    } catch (err) {
      console.warn('⚠️ [UpcomingEventsScreen] Failed to fetch live bookings:', err);
    }
    // Fallback to initial mock bookings
    setAllBookings(INITIAL_SCHEDULE_BOOKINGS);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchUpcomingBookings().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [fetchUpcomingBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUpcomingBookings();
    setRefreshing(false);
  }, [fetchUpcomingBookings]);

  // Filter & sort upcoming bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Filter strictly future bookings that have not started yet
    const upcoming = allBookings.filter((b) => {
      const status = (b.status || '').toLowerCase();
      if (status === 'completed' || status === 'cancelled') return false;

      const { startDateTime } = getBookingDateTimes(b);
      // Strictly greater than current date/time (exclude live and past)
      return startDateTime.getTime() > nowMs;
    });

    // 2. Sort ascending by startDateTime (nearest first)
    upcoming.sort((a, b) => {
      const timeA = getBookingDateTimes(a).startDateTime.getTime();
      const timeB = getBookingDateTimes(b).startDateTime.getTime();
      return timeA - timeB;
    });

    // 3. Filter by date category
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msInDay = 24 * 60 * 60 * 1000;

    let dateFiltered = upcoming;
    if (activeFilter === 'next7') {
      const limitMs = startOfToday + 8 * msInDay;
      dateFiltered = upcoming.filter((b) => {
        const { startDateTime } = getBookingDateTimes(b);
        return startDateTime.getTime() <= limitMs;
      });
    } else if (activeFilter === 'next30') {
      const limitMs = startOfToday + 31 * msInDay;
      dateFiltered = upcoming.filter((b) => {
        const { startDateTime } = getBookingDateTimes(b);
        return startDateTime.getTime() <= limitMs;
      });
    } else if (activeFilter === 'month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      dateFiltered = upcoming.filter((b) => {
        const { year, month } = parseLocalDateParts(b.date);
        return year === currentYear && month - 1 === currentMonth;
      });
    }

    // 4. Search query filter
    if (!searchQuery.trim()) {
      return dateFiltered;
    }
    const q = searchQuery.toLowerCase().trim();
    return dateFiltered.filter((b) => {
      const devotee = (b.clientName || '').toLowerCase();
      const phone = (b.clientPhone || '').toLowerCase();
      const titleTa = (b.titleTamil || '').toLowerCase();
      const titleEn = (b.titleEnglish || '').toLowerCase();
      const bNum = (b.bookingNumber || b.id || '').toLowerCase();
      const priest = (b.priestNameTamil || b.priestNameEnglish || '').toLowerCase();
      return (
        devotee.includes(q) ||
        phone.includes(q) ||
        titleTa.includes(q) ||
        titleEn.includes(q) ||
        bNum.includes(q) ||
        priest.includes(q)
      );
    });
  }, [allBookings, activeFilter, searchQuery]);

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

  const handleRegistrationSubmit = async (formData: NewBookingFormData) => {
    try {
      const payload = buildBookingPayload(formData);

      if (editingBooking) {
        await bookingApiService.updateBooking(editingBooking.id, payload);
        setIsRegistrationModalVisible(false);
        setEditingBooking(null);
        await fetchUpcomingBookings();
        Alert.alert(t('common.success') || 'வெற்றி', t('bookingDetail.updateSuccess') || 'பூஜை பதிவு புதுப்பிக்கப்பட்டது');
      } else {
        await bookingApiService.createBooking(payload);
        setIsRegistrationModalVisible(false);
        await fetchUpcomingBookings();
        Alert.alert(t('common.success') || 'வெற்றி', 'பூஜை பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது');
      }
    } catch (err: any) {
      console.error('❌ [UpcomingEventsScreen] Failed to save booking:', err);
      Alert.alert(t('common.error') || 'Error', err?.message || 'Failed to update booking');
      throw err;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, isTa && styles.titleTamil]}>
            {t('upcomingEvents.title')}
          </Text>
          <Text style={[styles.subtitle, isTa && styles.subtitleTamil]}>
            {t('upcomingEvents.subtitle')}
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {filteredBookings.length}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isTa && styles.searchTamil]}
          placeholder={t('upcomingEvents.searchPlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearButton}
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* Filter Pills */}
      <View style={styles.filterBar}>
        <Pressable
          onPress={() => setActiveFilter('all')}
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'all' && styles.filterChipTextActive,
              isTa && styles.chipTamilFont,
            ]}
          >
            {t('upcomingEvents.filterAll')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('next7')}
          style={[styles.filterChip, activeFilter === 'next7' && styles.filterChipActive]}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'next7' && styles.filterChipTextActive,
              isTa && styles.chipTamilFont,
            ]}
          >
            {t('upcomingEvents.filterNext7Days')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('next30')}
          style={[styles.filterChip, activeFilter === 'next30' && styles.filterChipActive]}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'next30' && styles.filterChipTextActive,
              isTa && styles.chipTamilFont,
            ]}
          >
            {t('upcomingEvents.filterNext30Days')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('month')}
          style={[styles.filterChip, activeFilter === 'month' && styles.filterChipActive]}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'month' && styles.filterChipTextActive,
              isTa && styles.chipTamilFont,
            ]}
          >
            {t('upcomingEvents.filterThisMonth')}
          </Text>
        </Pressable>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#074735" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#074735']}
              tintColor="#074735"
            />
          }
          renderItem={({ item }) => (
            <TodayBookingCard
              booking={item}
              showDate={true}
              onPress={() => handleBookingPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <CalendarClock size={36} color="#8C6D23" />
              </View>
              <Text style={[styles.emptyTitle, isTa && styles.emptyTamilTitle]}>
                {t('upcomingEvents.noEvents')}
              </Text>
              <Text style={[styles.emptySubtitle, isTa && styles.emptyTamilSub]}>
                {t('upcomingEvents.noEventsSub')}
              </Text>
            </View>
          }
        />
      )}

      {/* Booking Detail View Modal */}
      <BookingDetailModal
        visible={isDetailModalVisible}
        booking={selectedBooking}
        onClose={() => setIsDetailModalVisible(false)}
        onEdit={handleEditBooking}
      />

      {/* Registration/Edit Form Modal */}
      <PoojaBookingFormModal
        visible={isRegistrationModalVisible}
        onClose={() => {
          setIsRegistrationModalVisible(false);
          setEditingBooking(null);
        }}
        onSubmit={handleRegistrationSubmit}
        selectedDate={editingBooking?.date}
        initialDateKey={editingBooking?.date}
        initialBooking={editingBooking || undefined}
        editBooking={editingBooking || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAF9F6',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAE8DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: -0.3,
  },
  titleTamil: {
    fontSize: 17,
    lineHeight: 23,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  subtitleTamil: {
    fontSize: 11,
    lineHeight: 15,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E2ECE7',
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#074735',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  searchTamil: {
    fontSize: 13,
  },
  clearButton: {
    padding: 4,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#074735',
    borderColor: '#074735',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  chipTamilFont: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FBF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptyTamilTitle: {
    fontSize: 15,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyTamilSub: {
    fontSize: 12,
    lineHeight: 17,
  },
});
