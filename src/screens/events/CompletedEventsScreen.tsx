/**
 * CompletedEventsScreen Component (நிறைவடைந்த நிகழ்வுகள்)
 *
 * Dedicated screen for all past & completed bookings:
 * - Strictly displays bookings where endDateTime <= now OR status === 'completed'.
 * - Consistent descending sort (most recently completed first).
 * - Real-time search by devotee name, pooja title, booking number, priest.
 * - Date range filter pills (All Completed, Past 7 Days, Past 30 Days, This Month)
 *   with horizontal scrolling and dynamic counts.
 * - Polished header matching ScheduleHeader / PriestHeader with centered title and
 *   balanced 38x38 navigation controls.
 * - Full-width BookingCard with date pill, time slot, priest, venue, fee summary,
 *   and direct tap to open BookingDetailModal.
 * - Enforces edit restrictions (past events cannot be modified).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
import {
  ArrowLeft,
  CalendarCheck,
  Search,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking } from '../../types/schedule';
import { CompletedEventsScreenNavigationProp } from '../../types/navigation';
import { bookingApiService } from '../../services/bookingApiService';
import { INITIAL_SCHEDULE_BOOKINGS } from '../../data/scheduleMockData';
import { getBookingDateTimes, isBookingEditable } from '../../utils/bookingRules';
import { parseLocalDateParts } from '../../utils/timeCalculation';
import { BookingCard } from '../../components/schedule/BookingCard';
import { BookingDetailModal } from '../../components/dashboard/BookingDetailModal';

type CompletedDateFilter = 'all' | 'past7' | 'past30' | 'month';

export const CompletedEventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CompletedEventsScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [allBookings, setAllBookings] = useState<ScheduleBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<CompletedDateFilter>('all');

  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);

  const fetchCompletedBookings = useCallback(async () => {
    try {
      const list = await bookingApiService.listBookings();
      if (list && list.length > 0) {
        setAllBookings(list);
        return;
      }
    } catch (err) {
      console.warn('⚠️ [CompletedEventsScreen] Failed to fetch live bookings:', err);
    }
    // Fallback to initial mock bookings
    setAllBookings(INITIAL_SCHEDULE_BOOKINGS);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCompletedBookings().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [fetchCompletedBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompletedBookings();
    setRefreshing(false);
  }, [fetchCompletedBookings]);

  // 1. All completed bookings (end date/time passed or status === completed)
  const completedBookings = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    const completed = allBookings.filter((b) => {
      const status = (b.status || '').toLowerCase();
      if (status === 'completed') return true;
      if (status === 'cancelled') return false;

      const { endDateTime } = getBookingDateTimes(b);
      // Strictly past end date/time
      return nowMs >= endDateTime.getTime();
    });

    // Sort descending by endDateTime (most recently completed first)
    completed.sort((a, b) => {
      const timeA = getBookingDateTimes(a).endDateTime.getTime();
      const timeB = getBookingDateTimes(b).endDateTime.getTime();
      return timeB - timeA;
    });

    return completed;
  }, [allBookings]);

  // 2. Compute dynamic counts for each filter option
  const filterCounts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msInDay = 24 * 60 * 60 * 1000;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const all = completedBookings.length;
    let past7 = 0;
    let past30 = 0;
    let month = 0;

    const limit7Ms = startOfToday - 7 * msInDay;
    const limit30Ms = startOfToday - 30 * msInDay;

    for (const b of completedBookings) {
      const { endDateTime } = getBookingDateTimes(b);
      const bTime = endDateTime.getTime();
      if (bTime >= limit7Ms) past7++;
      if (bTime >= limit30Ms) past30++;

      const { year, month: bMonth } = parseLocalDateParts(b.date);
      if (year === currentYear && bMonth - 1 === currentMonth) {
        month++;
      }
    }

    return { all, past7, past30, month };
  }, [completedBookings]);

  // Filter options configuration
  const filterOptions = useMemo(
    () => [
      {
        id: 'all' as CompletedDateFilter,
        label: t('completedEvents.filterAll'),
        count: filterCounts.all,
      },
      {
        id: 'past7' as CompletedDateFilter,
        label: t('completedEvents.filterPast7Days'),
        count: filterCounts.past7,
      },
      {
        id: 'past30' as CompletedDateFilter,
        label: t('completedEvents.filterPast30Days'),
        count: filterCounts.past30,
      },
      {
        id: 'month' as CompletedDateFilter,
        label: t('completedEvents.filterThisMonth'),
        count: filterCounts.month,
      },
    ],
    [t, filterCounts]
  );

  // 3. Filter by date category and search query
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msInDay = 24 * 60 * 60 * 1000;

    let dateFiltered = completedBookings;
    if (activeFilter === 'past7') {
      const limitMs = startOfToday - 7 * msInDay;
      dateFiltered = completedBookings.filter((b) => {
        const { endDateTime } = getBookingDateTimes(b);
        return endDateTime.getTime() >= limitMs;
      });
    } else if (activeFilter === 'past30') {
      const limitMs = startOfToday - 30 * msInDay;
      dateFiltered = completedBookings.filter((b) => {
        const { endDateTime } = getBookingDateTimes(b);
        return endDateTime.getTime() >= limitMs;
      });
    } else if (activeFilter === 'month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      dateFiltered = completedBookings.filter((b) => {
        const { year, month } = parseLocalDateParts(b.date);
        return year === currentYear && month - 1 === currentMonth;
      });
    }

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
  }, [completedBookings, activeFilter, searchQuery]);

  const handleBookingPress = (booking: ScheduleBooking) => {
    setSelectedBooking(booking);
    setIsDetailModalVisible(true);
  };

  const handleEditBooking = (booking: ScheduleBooking) => {
    const check = isBookingEditable(booking);
    Alert.alert(
      t('bookingDetail.editUnavailable'),
      check.reasonTa || check.reasonEn || t('bookingDetail.editNotice')
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Screen Header – Matching ScheduleHeader / PriestHeader */}
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
          <Text
            style={[styles.title, isTa && styles.titleTamil]}
            numberOfLines={1}
          >
            {t('completedEvents.title')}
          </Text>
          <Text
            style={[styles.subtitle, isTa && styles.subtitleTamil]}
            numberOfLines={1}
          >
            {t('completedEvents.subtitle')}
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
          placeholder={t('completedEvents.searchPlaceholder')}
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

      {/* Horizontally Scrollable Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${filter.label} (${filter.count})`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    isTa && styles.chipTamilFont,
                  ]}
                >
                  {filter.label} ({filter.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#074735']}
              tintColor="#074735"
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              showDate={true}
              onPress={() => handleBookingPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <CalendarCheck size={36} color="#059669" />
              </View>
              <Text style={[styles.emptyTitle, isTa && styles.emptyTamilTitle]}>
                {t('completedEvents.noEvents')}
              </Text>
              <Text style={[styles.emptySubtitle, isTa && styles.emptyTamilSub]}>
                {t('completedEvents.noEventsSub')}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  titleTamil: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginTop: 1,
    textAlign: 'center',
  },
  subtitleTamil: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2ECE7',
    borderWidth: 1,
    borderColor: '#C5D8CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#074735',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  searchTamil: {
    fontSize: 13,
  },
  clearButton: {
    padding: 4,
  },
  filterSection: {
    marginVertical: 6,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#074735',
    borderWidth: 1,
    borderColor: '#074735',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  filterChipTextInactive: {
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipTamilFont: {
    fontSize: 11.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  cardSeparator: {
    height: 10,
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
    backgroundColor: '#E6F4EA',
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
