/**
 * TodayEventsSection Component
 * Redesigned clean booking list for the Home Screen.
 *
 * Implements:
 * 1. Chronological list of bookings scheduled for today.
 * 2. Real-time LIVE event highlighting (green accent + LIVE indicator).
 * 3. Visually differentiated completed bookings.
 * 4. Devotee name, pooja/event name, timings, priest, venue, status.
 * 5. Tap opens BookingDetailModal.
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowRight, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking } from '../../types/schedule';
import { LiveOperationData, EventBookingItem } from '../../types/dashboard';
import { TodayBookingCard } from './TodayBookingCard';
import { EventBookingCard } from './EventBookingCard';
import { classifyTodayBooking, getBookingLiveStatus } from '../../utils/bookingRules';
import { BlinkingLiveDot } from '../common/BlinkingLiveDot';

interface TodayEventsSectionProps {
  title?: string;
  count?: number;
  actionText?: string;
  liveOperation?: LiveOperationData;
  bookings: (ScheduleBooking | EventBookingItem)[];
  onPressViewAll?: () => void;
  onPressLiveOperation?: () => void;
  onPressBooking?: (item: any) => void;
}

export const TodayEventsSection: React.FC<TodayEventsSectionProps> = ({
  title,
  count,
  actionText,
  liveOperation,
  bookings = [],
  onPressViewAll,
  onPressLiveOperation,
  onPressBooking,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const sectionTitle = title || t('bookingDetail.todayEvents') || 'இன்றைய நிகழ்வுகள்';
  const sectionAction = actionText || t('common.viewAll') || 'அனைத்தும் காண்க';
  const displayCount = count !== undefined ? count : bookings.length;

  const isScheduleBooking = (item: any): item is ScheduleBooking => {
    return item && 'date' in item && ('clientName' in item || 'timeSlot' in item);
  };

  // Classify bookings into strict status groups: 1. LIVE, 2. UPCOMING, 3. COMPLETED
  const { liveGroup, upcomingGroup, completedGroup, otherGroup } = useMemo(() => {
    const live: ScheduleBooking[] = [];
    const upcoming: ScheduleBooking[] = [];
    const completed: ScheduleBooking[] = [];
    const other: any[] = [];
    const now = new Date();

    bookings.forEach(b => {
      if (isScheduleBooking(b)) {
        const cat = classifyTodayBooking(b, now);
        if (cat === 'LIVE') {
          live.push(b);
        } else if (cat === 'UPCOMING') {
          upcoming.push(b);
        } else {
          completed.push(b);
        }
      } else {
        other.push(b);
      }
    });

    return {
      liveGroup: live,
      upcomingGroup: upcoming,
      completedGroup: completed,
      otherGroup: other,
    };
  }, [bookings]);

  const liveCount = liveGroup.length;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <Text style={[styles.headingTitle, isTa && styles.tamilHeading]}>
            {sectionTitle}
          </Text>
          <View style={[styles.countBadge, liveCount > 0 && styles.countBadgeLive]}>
            <Text style={[styles.countBadgeText, liveCount > 0 && styles.countBadgeTextLive]}>
              {displayCount}
            </Text>
          </View>
          {liveCount > 0 && (
            <View style={styles.liveNowIndicator}>
              <BlinkingLiveDot size={6} color="#16A34A" />
              <Text style={styles.liveNowText}>
                {liveCount} {t('bookingDetail.live') || 'LIVE'}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={onPressViewAll}
          style={styles.actionRow}
          accessibilityRole="button"
          accessibilityLabel={`${sectionAction} ${displayCount}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.actionText, isTa && styles.tamilActionText]}>
            {sectionAction}
          </Text>
          <ArrowRight size={13} color="#8C6D23" style={styles.arrowIcon} />
        </Pressable>
      </View>

      {/* Bookings List or Empty State */}
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Calendar size={22} color="#074735" />
          </View>
          <Text style={[styles.emptyTitle, isTa && styles.tamilEmptyTitle]}>
            {t('bookingDetail.noEventsToday') || 'இன்று எந்த நிகழ்வுகளும் திட்டமிடப்படவில்லை'}
          </Text>
          <Text style={[styles.emptySub, isTa && styles.tamilEmptySub]}>
            {t('bookingDetail.noEventsTodaySub') || 'இன்றைய தேதிக்கான புதிய முன்பதிவுகள் இங்கு தோன்றும்.'}
          </Text>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {/* 1. LIVE Events Section (Strict Order) */}
          {liveGroup.length > 0 && (
            <View style={styles.statusCategorySection}>
              <View style={styles.statusCategoryHeader}>
                <View style={styles.statusCategoryLeft}>
                  <BlinkingLiveDot size={7} color="#16A34A" />
                  <Text style={styles.statusCategoryTitleLive}>
                    {isTa ? `நேரலை நிகழ்வுகள் (${liveGroup.length})` : `LIVE (${liveGroup.length})`}
                  </Text>
                </View>
                <Text style={styles.statusCategoryHintLive}>
                  {isTa ? 'தற்போது நடைபெறுகிறது' : 'In Progress'}
                </Text>
              </View>
              {liveGroup.map(booking => (
                <TodayBookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => onPressBooking?.(booking)}
                />
              ))}
            </View>
          )}

          {/* 2. UPCOMING Events Section */}
          {upcomingGroup.length > 0 && (
            <View style={styles.statusCategorySection}>
              <View style={styles.statusCategoryHeader}>
                <View style={styles.statusCategoryLeft}>
                  <Clock size={13} color="#D97706" />
                  <Text style={styles.statusCategoryTitleUpcoming}>
                    {isTa ? `வரவிருப்பவை (${upcomingGroup.length})` : `UPCOMING (${upcomingGroup.length})`}
                  </Text>
                </View>
                <Text style={styles.statusCategoryHintUpcoming}>
                  {isTa ? 'அடுத்து திட்டமிடப்பட்டது' : 'Scheduled'}
                </Text>
              </View>
              {upcomingGroup.map(booking => (
                <TodayBookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => onPressBooking?.(booking)}
                />
              ))}
            </View>
          )}

          {/* 3. COMPLETED Events Section */}
          {completedGroup.length > 0 && (
            <View style={styles.statusCategorySection}>
              <View style={styles.statusCategoryHeader}>
                <View style={styles.statusCategoryLeft}>
                  <CheckCircle2 size={13} color="#64748B" />
                  <Text style={styles.statusCategoryTitleCompleted}>
                    {isTa ? `முடிவுற்றவை (${completedGroup.length})` : `COMPLETED (${completedGroup.length})`}
                  </Text>
                </View>
                <Text style={styles.statusCategoryHintCompleted}>
                  {isTa ? 'நிறைவுற்ற நிகழ்வுகள்' : 'Ended'}
                </Text>
              </View>
              {completedGroup.map(booking => (
                <TodayBookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => onPressBooking?.(booking)}
                />
              ))}
            </View>
          )}

          {/* Fallback Non-Schedule items */}
          {otherGroup.map(item => (
            <EventBookingCard
              key={item.id}
              item={item}
              onPress={() => onPressBooking?.(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  headingTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#073E2E',
    letterSpacing: 0.1,
  },
  tamilHeading: {
    fontSize: 15.5,
  },
  countBadge: {
    backgroundColor: '#E2ECE7',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  countBadgeLive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#073E2E',
  },
  countBadgeTextLive: {
    color: '#15803D',
  },
  liveNowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveNowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C6D23', // Temple gold
  },
  tamilActionText: {
    fontSize: 11.8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  eventsList: {
    marginTop: 4,
  },
  statusCategorySection: {
    marginBottom: 12,
  },
  statusCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusCategoryTitleLive: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  statusCategoryHintLive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusCategoryTitleUpcoming: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  statusCategoryHintUpcoming: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
  },
  statusCategoryTitleCompleted: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.2,
  },
  statusCategoryHintCompleted: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F0F2F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  tamilEmptyTitle: {
    fontSize: 13.5,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 16,
  },
  tamilEmptySub: {
    fontSize: 11.5,
  },
});
