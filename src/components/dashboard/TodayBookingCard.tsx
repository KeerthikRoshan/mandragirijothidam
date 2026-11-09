/**
 * TodayBookingCard Component
 * Modern, clean card for Today's Events on the Home Screen.
 *
 * Implements:
 * - Devotee name
 * - Pooja / Event name
 * - Start time – End time
 * - Priest name
 * - Venue / Location
 * - Booking status
 * - Live Event Highlighting:
 *   - Highlight currently running events using green accent (#059669).
 *   - Clear LIVE indicator.
 *   - An event is LIVE only when the current date/time falls between start & end.
 *   - Upcoming events today have normal appearance.
 *   - Completed events are visually differentiated.
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  User,
  UserCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking } from '../../types/schedule';
import { getBookingLiveStatus } from '../../utils/bookingRules';
import { BlinkingLiveDot } from '../common/BlinkingLiveDot';

interface TodayBookingCardProps {
  booking: ScheduleBooking;
  onPress?: () => void;
  showDate?: boolean;
}

export const TodayBookingCard: React.FC<TodayBookingCardProps> = ({
  booking,
  onPress,
  showDate = false,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const liveStatus = useMemo(() => {
    return getBookingLiveStatus(booking);
  }, [booking]);

  const isCompleted = booking.status === 'completed' || liveStatus.isPast;
  const isLive = liveStatus.isLive;

  // Title formatting
  const mainTitle = isTa
    ? booking.titleTamil || booking.titleEnglish || booking.title
    : booking.titleEnglish || booking.titleTamil || booking.title;

  const subtitle = isTa
    ? booking.titleEnglish
    : booking.titleTamil;

  // Priest name
  const priestName = isTa
    ? booking.priestNameTamil || booking.priestNameEnglish || booking.priestName || 'சுவாமி'
    : booking.priestNameEnglish || booking.priestNameTamil || booking.priestName || 'Priest';

  // Location / Venue
  const locationText =
    booking.address ||
    booking.locationTamil ||
    booking.location ||
    'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்';

  // Time Range
  const timeDisplay =
    booking.timeSlot ||
    (booking.startTime && booking.endTime
      ? `${booking.startTime} – ${booking.endTime}`
      : booking.startTime || '—');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isLive && styles.liveCard,
        isCompleted && styles.completedCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${mainTitle}, ${booking.clientName}, ${timeDisplay}`}
    >
      {/* Top Timing & Status Bar */}
      <View style={styles.topRow}>
        <View style={styles.timeBadgeRow}>
          {showDate && Boolean(booking.date) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
              <Calendar
                size={12}
                color={isLive ? '#059669' : isCompleted ? '#6B7280' : '#074735'}
                style={styles.timeIcon}
              />
              <Text
                style={[
                  styles.timeText,
                  { fontWeight: '700', color: isLive ? '#059669' : isCompleted ? '#6B7280' : '#074735' },
                ]}
              >
                {booking.date}
              </Text>
              <Text style={{ marginHorizontal: 4, color: '#D1D5DB', fontSize: 10 }}>•</Text>
            </View>
          )}
          <Clock
            size={12}
            color={isLive ? '#059669' : isCompleted ? '#6B7280' : '#8C6D23'}
            style={styles.timeIcon}
          />
          <Text
            style={[
              styles.timeText,
              isLive && styles.liveTimeText,
              isCompleted && styles.completedTimeText,
            ]}
          >
            {timeDisplay}
          </Text>
        </View>

        {/* Live or Status Badge */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <BlinkingLiveDot size={6} color="#16A34A" />
            <Text style={styles.liveBadgeText}>
              {t('bookingDetail.live') || 'LIVE'}
            </Text>
          </View>
        ) : isCompleted ? (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={11} color="#059669" style={styles.badgeIcon} />
            <Text style={styles.completedBadgeText}>
              {booking.statusLabelTamil || t('bookingDetail.completed')}
            </Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {booking.statusLabelTamil || t('bookingDetail.confirmed')}
            </Text>
          </View>
        )}
      </View>

      {/* Main Pooja / Event Name */}
      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          <Text
            style={[
              styles.eventTitle,
              isLive && styles.liveEventTitle,
              isCompleted && styles.completedText,
              isTa && styles.tamilTitleFont,
            ]}
            numberOfLines={1}
          >
            {mainTitle}
            {subtitle && subtitle !== mainTitle ? ` • ${subtitle}` : ''}
          </Text>
        </View>
        <ChevronRight
          size={16}
          color={isLive ? '#059669' : '#9CA3AF'}
          style={styles.chevron}
        />
      </View>

      {/* Devotee Row */}
      <View style={styles.devoteeRow}>
        <View style={styles.devoteeIconBox}>
          <User
            size={12}
            color={isLive ? '#065F46' : isCompleted ? '#6B7280' : '#074735'}
          />
        </View>
        <Text
          style={[
            styles.devoteeName,
            isCompleted && styles.completedText,
            isTa && styles.tamilTextScale,
          ]}
          numberOfLines={1}
        >
          {booking.clientName}
        </Text>
        {Boolean(booking.clientPhone) && (
          <Text style={styles.devoteePhone}>
            ({booking.clientPhone})
          </Text>
        )}
      </View>

      {/* Priest & Location Row */}
      <View style={styles.detailsRow}>
        {/* Priest */}
        <View style={styles.detailItem}>
          <UserCheck
            size={12}
            color={isLive ? '#047857' : isCompleted ? '#9CA3AF' : '#0D543F'}
            style={styles.detailIcon}
          />
          <Text
            style={[
              styles.detailText,
              styles.priestText,
              isCompleted && styles.completedSubText,
              isTa && styles.tamilSubScale,
            ]}
            numberOfLines={1}
          >
            {priestName}
          </Text>
        </View>

        <Text style={styles.bulletSeparator}>•</Text>

        {/* Location */}
        <View style={styles.detailItem}>
          <MapPin
            size={12}
            color={isLive ? '#047857' : isCompleted ? '#9CA3AF' : '#B87B28'}
            style={styles.detailIcon}
          />
          <Text
            style={[
              styles.detailText,
              styles.locationText,
              isCompleted && styles.completedSubText,
              isTa && styles.tamilSubScale,
            ]}
            numberOfLines={1}
          >
            {locationText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F2F1',
  },
  liveCard: {
    backgroundColor: '#F0FDF4', // Light mint green tint
    borderColor: '#059669', // Emerald accent border
    borderWidth: 1.5,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
    opacity: 0.88,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#073E2E',
  },
  liveTimeText: {
    color: '#047857',
    fontWeight: '800',
  },
  completedTimeText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeIcon: {
    marginRight: 3,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  statusBadge: {
    backgroundColor: '#E2F8ED',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleColumn: {
    flex: 1,
    paddingRight: 6,
  },
  eventTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F2F24',
    letterSpacing: -0.1,
  },
  liveEventTitle: {
    color: '#064E3B',
  },
  completedText: {
    color: '#6B7280',
  },
  completedSubText: {
    color: '#9CA3AF',
  },
  tamilTitleFont: {
    fontSize: 13.8,
    lineHeight: 18,
  },
  chevron: {
    marginLeft: 4,
  },
  devoteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  devoteeIconBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#E2ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  devoteeName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  devoteePhone: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 5,
  },
  tamilTextScale: {
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 11.5,
    color: '#4B5563',
  },
  priestText: {
    color: '#0D543F',
    fontWeight: '600',
  },
  locationText: {
    color: '#B87B28',
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 11,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  tamilSubScale: {
    fontSize: 10.8,
  },
});
