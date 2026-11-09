/**
 * BookingCard Component
 * Displays a single booking item with time slot pill, status badge,
 * event title, category label, client name, venue, phone, and assigned priest.
 * Clean, simple layout with refined Tamil/English typography.
 */

import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, Clock, MapPin, Phone, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking, BookingStatus } from '../../types/schedule';
import { getBookingDateTimes } from '../../utils/bookingRules';
import { BlinkingLiveDot } from '../common/BlinkingLiveDot';

interface BookingCardProps {
  booking: ScheduleBooking;
  onPress?: () => void;
  showDate?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  showDate = false,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  // Dynamic booking classification using true start and end date/time
  const { effectiveStatus, isNextDay } = useMemo(() => {
    const now = new Date();
    const { startDateTime, endDateTime } = getBookingDateTimes(booking);
    const nowMs = now.getTime();
    const startMs = startDateTime.getTime();
    const endMs = endDateTime.getTime();
    const raw = (booking.status || '').toLowerCase();

    const crossesMidnight =
      endDateTime.getDate() !== startDateTime.getDate() ||
      endDateTime.getTime() - startDateTime.getTime() >= 24 * 60 * 60 * 1000;

    if (raw === 'cancelled' || raw === 'deleted') {
      return { effectiveStatus: 'cancelled' as const, isNextDay: crossesMidnight };
    }
    // Completed if marked completed or current date/time has passed end time
    if (raw === 'completed' || nowMs >= endMs) {
      return { effectiveStatus: 'completed' as const, isNextDay: crossesMidnight };
    }
    // Live if currently between start and end date/time
    if (nowMs >= startMs && nowMs < endMs) {
      return { effectiveStatus: 'live' as const, isNextDay: crossesMidnight };
    }
    if (raw === 'pending') {
      return { effectiveStatus: 'pending' as const, isNextDay: crossesMidnight };
    }
    return { effectiveStatus: 'upcoming' as const, isNextDay: crossesMidnight };
  }, [booking]);

  const rawStatus = (booking.status || '').toLowerCase();

  const getStatusStyles = () => {
    switch (effectiveStatus) {
      case 'completed':
        return {
          container: styles.statusCompleted,
          text: styles.statusTextCompleted,
          label: `✓ ${t('status.completed')}`,
          timeContainer: styles.timeSlate,
          timeText: styles.timeTextSlate,
          isLive: false,
        };
      case 'live':
        return {
          container: styles.statusLive,
          text: styles.statusTextLive,
          label: isTa ? 'நேரலை' : 'LIVE',
          timeContainer: styles.timeGreen,
          timeText: styles.timeTextGreen,
          isLive: true,
        };
      case 'upcoming':
        return {
          container: rawStatus === 'confirmed' ? styles.statusConfirmed : styles.statusUpcoming,
          text: rawStatus === 'confirmed' ? styles.statusTextConfirmed : styles.statusTextUpcoming,
          label: rawStatus === 'confirmed'
            ? `✓ ${t('status.confirmed')}`
            : `⏱ ${t('status.upcoming')}`,
          timeContainer: rawStatus === 'confirmed' ? styles.timeGreen : styles.timeAmber,
          timeText: rawStatus === 'confirmed' ? styles.timeTextGreen : styles.timeTextAmber,
          isLive: false,
        };
      case 'pending':
        return {
          container: styles.statusPending,
          text: styles.statusTextPending,
          label: `⏱ ${t('status.pending')}`,
          timeContainer: styles.timeYellow,
          timeText: styles.timeTextYellow,
          isLive: false,
        };
      case 'cancelled':
        return {
          container: styles.statusCancelled,
          text: styles.statusTextCancelled,
          label: isTa ? '✕ ரத்து' : '✕ Cancelled',
          timeContainer: styles.timeSlate,
          timeText: styles.timeTextSlate,
          isLive: false,
        };
      default:
        return {
          container: styles.statusPending,
          text: styles.statusTextPending,
          label: isTa ? booking.statusLabelTamil || rawStatus : rawStatus,
          timeContainer: styles.timeGreen,
          timeText: styles.timeTextGreen,
          isLive: false,
        };
    }
  };

  const statusStyle = getStatusStyles();

  // Clear start and end time display
  const displayTime = useMemo(() => {
    if (booking.startTime && booking.endTime) {
      return `${booking.startTime} – ${booking.endTime}`;
    }
    return booking.timeSlot || booking.startTime || '—';
  }, [booking.startTime, booking.endTime, booking.timeSlot]);

  const handleCall = () => {
    if (booking.clientPhone) {
      Linking.openURL(`tel:${booking.clientPhone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  const displayTitle = isTa
    ? booking.titleTamil || booking.title || booking.titleEnglish
    : booking.titleEnglish || booking.title || booking.titleTamil;

  const displayCategory = isTa
    ? booking.categoryLabelTamil || t(`schedule.categories.${booking.category}`) || booking.category
    : t(`schedule.categories.${booking.category}`) || booking.category;

  const displayLocation = isTa
    ? booking.locationTamil || booking.location
    : booking.location || booking.locationTamil;

  const displayPriest = isTa
    ? booking.priestNameTamil || booking.priestName
    : booking.priestName || booking.priestNameTamil;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        effectiveStatus === 'live' && styles.cardLive,
        effectiveStatus === 'completed' && styles.cardCompleted,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${displayTime}, ${statusStyle.label}`}
    >
      {/* Top Row: Time Slot Badge & Status Badge */}
      <View style={styles.topRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
          {showDate && Boolean(booking.date) && (
            <View style={[styles.timeBadge, { backgroundColor: '#F1F5F9' }]}>
              <Calendar size={11} color="#074735" style={styles.clockIcon} />
              <Text style={[styles.timeText, { color: '#074735' }]}>
                {booking.date}
              </Text>
            </View>
          )}
          <View style={[styles.timeBadge, statusStyle.timeContainer]}>
            <Clock size={12} color={statusStyle.timeText.color} style={styles.clockIcon} />
            <Text style={[styles.timeText, statusStyle.timeText]}>
              {displayTime}
            </Text>
            {isNextDay && (
              <Text style={[styles.nextDayIndicator, isTa && styles.nextDayIndicatorTamil]}>
                {isTa ? '(அடுத்த நாள்)' : '(Next Day)'}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.statusBadge, statusStyle.container, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          {statusStyle.isLive && <BlinkingLiveDot size={6} color="#16A34A" />}
          <Text
            style={[
              styles.statusText,
              statusStyle.text,
              isTa && styles.statusTextTamil,
            ]}
            numberOfLines={1}
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Title & Category */}
      <Text
        style={[
          styles.titleText,
          isTa && styles.titleTextTamil,
        ]}
      >
        {displayTitle}
      </Text>
      <Text
        style={[
          styles.categorySubtext,
          isTa && styles.categorySubtextTamil,
        ]}
      >
        {displayCategory}
        {isTa && booking.titleEnglish ? ` • ${booking.titleEnglish}` : ''}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details (Client, Location, Priest, Phone) */}
      <View style={styles.detailsContainer}>
        {/* Client Name */}
        <View style={styles.detailRow}>
          <User size={13} color="#074735" style={styles.detailIcon} />
          <Text
            style={[
              styles.detailText,
              isTa && styles.detailTextTamil,
            ]}
            numberOfLines={1}
          >
            {booking.clientName}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.detailRow}>
          <MapPin size={13} color="#074735" style={styles.detailIcon} />
          <Text
            style={[
              styles.detailText,
              isTa && styles.detailTextTamil,
            ]}
            numberOfLines={1}
          >
            {displayLocation}
          </Text>
        </View>

        {/* Priest & Phone */}
        <View style={styles.bottomDetailRow}>
          <View style={styles.priestContainer}>
            <Text style={styles.priestSymbol}>👳</Text>
            <Text
              style={[
                styles.priestText,
                isTa && styles.priestTextTamil,
              ]}
              numberOfLines={1}
            >
              {displayPriest}
            </Text>
          </View>

          {booking.clientPhone && (
            <Pressable
              onPress={handleCall}
              style={styles.phoneChip}
              accessibilityRole="button"
              accessibilityLabel={`Call ${booking.clientPhone}`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Phone size={11} color="#074735" style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{booking.clientPhone}</Text>
            </Pressable>
          )}
        </View>

        {/* Payment Summary Row if present */}
        {(booking.totalEventCharge !== undefined || booking.amount) && (
          <View style={styles.paymentSummaryRow}>
            <Text
              style={[
                styles.paymentAmountText,
                isTa && styles.paymentAmountTextTamil,
              ]}
            >
              💰 {t('common.fee')}: {booking.amount || `₹ ${booking.totalEventCharge?.toLocaleString('en-IN')}`}
            </Text>
            {booking.clientBalanceAmount !== undefined && booking.clientBalanceAmount > 0 && (
              <View style={styles.cardDueBadge}>
                <Text
                  style={[
                    styles.cardDueBadgeText,
                    isTa && styles.cardDueBadgeTextTamil,
                  ]}
                >
                  {t('schedule.summaryPending')}: ₹ {booking.clientBalanceAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            {booking.clientBalanceAmount === 0 && (booking.totalEventCharge || 0) > 0 && (
              <View style={styles.cardPaidBadge}>
                <Text
                  style={[
                    styles.cardPaidBadgeText,
                    isTa && styles.cardPaidBadgeTextTamil,
                  ]}
                >
                  {t('schedule.paid')}
                </Text>
              </View>
            )}
          </View>
        )}

      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 2,
  },
  cardLive: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  cardCompleted: {
    borderColor: '#E2E8F0',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clockIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeGreen: {
    backgroundColor: '#E5F7EE',
  },
  timeTextGreen: {
    color: '#065F46',
  },
  timeAmber: {
    backgroundColor: '#FFF4E5',
  },
  timeTextAmber: {
    color: '#C2410C',
  },
  timeYellow: {
    backgroundColor: '#FFF9E6',
  },
  timeTextYellow: {
    color: '#92400E',
  },
  timeSlate: {
    backgroundColor: '#F1F5F9',
  },
  timeTextSlate: {
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextTamil: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  statusConfirmed: {
    backgroundColor: '#E5F7EE',
  },
  statusTextConfirmed: {
    color: '#065F46',
  },
  statusUpcoming: {
    backgroundColor: '#FFF4E5',
  },
  statusTextUpcoming: {
    color: '#C2410C',
  },
  statusPending: {
    backgroundColor: '#FFF9E6',
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusTextCompleted: {
    color: '#475569',
  },
  statusLive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusTextLive: {
    color: '#15803D',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusTextCancelled: {
    color: '#DC2626',
  },
  nextDayIndicator: {
    fontSize: 10,
    fontWeight: '700',
    color: '#074735',
    marginLeft: 4,
  },
  nextDayIndicatorTamil: {
    fontSize: 9,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  titleTextTamil: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  categorySubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  categorySubtextTamil: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    flexShrink: 1,
  },
  detailTextTamil: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    flexShrink: 1,
  },
  bottomDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  priestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  priestSymbol: {
    fontSize: 12,
    marginRight: 5,
  },
  priestText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#074735', // Forest green priest name
    flexShrink: 1,
  },
  priestTextTamil: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  phoneIcon: {
    marginRight: 4,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#074735',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#EFE6D2',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  paymentAmountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
  },
  paymentAmountTextTamil: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardDueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  cardDueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  cardDueBadgeTextTamil: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardPaidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  cardPaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  cardPaidBadgeTextTamil: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
