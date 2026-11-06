/**
 * BookingCard Component
 * Displays a single booking item with time slot pill, status badge,
 * event title, category label, client name, venue, phone, and assigned priest.
 */

import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Clock, MapPin, Phone, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking, BookingStatus } from '../../types/schedule';

interface BookingCardProps {
  booking: ScheduleBooking;
  onPress?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress }) => {
  const { t } = useTranslation();

  const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          container: styles.statusConfirmed,
          text: styles.statusTextConfirmed,
          label: `✓ ${t('status.confirmed')}`,
          timeContainer: styles.timeGreen,
          timeText: styles.timeTextGreen,
        };
      case 'upcoming':
        return {
          container: styles.statusUpcoming,
          text: styles.statusTextUpcoming,
          label: `⏱ ${t('status.upcoming')}`,
          timeContainer: styles.timeAmber,
          timeText: styles.timeTextAmber,
        };
      case 'pending':
        return {
          container: styles.statusPending,
          text: styles.statusTextPending,
          label: `⏱ ${t('status.pending')}`,
          timeContainer: styles.timeYellow,
          timeText: styles.timeTextYellow,
        };
      case 'completed':
        return {
          container: styles.statusCompleted,
          text: styles.statusTextCompleted,
          label: `✓ ${t('status.completed')}`,
          timeContainer: styles.timeSlate,
          timeText: styles.timeTextSlate,
        };
      default:
        return {
          container: styles.statusPending,
          text: styles.statusTextPending,
          label: booking.statusLabelTamil,
          timeContainer: styles.timeGreen,
          timeText: styles.timeTextGreen,
        };
    }
  };

  const statusStyle = getStatusStyles(booking.status);


  const handleCall = () => {
    if (booking.clientPhone) {
      Linking.openURL(`tel:${booking.clientPhone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${booking.titleTamil}, ${booking.timeSlot}, ${statusStyle.label}`}
    >
      {/* Top Row: Time Slot Badge & Status Badge */}
      <View style={styles.topRow}>
        <View style={[styles.timeBadge, statusStyle.timeContainer]}>
          <Clock size={12} color={statusStyle.timeText.color} style={styles.clockIcon} />
          <Text style={[styles.timeText, statusStyle.timeText]}>
            {booking.timeSlot}
          </Text>
        </View>

        <View style={[styles.statusBadge, statusStyle.container]}>
          <Text style={[styles.statusText, statusStyle.text]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Title & Category */}
      <Text style={styles.titleText}>{booking.titleTamil}</Text>
      <Text style={styles.categorySubtext}>
        {booking.categoryLabelTamil}
        {booking.titleEnglish ? ` • ${booking.titleEnglish}` : ''}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details (Client, Location, Priest, Phone) */}
      <View style={styles.detailsContainer}>
        {/* Client Name */}
        <View style={styles.detailRow}>
          <User size={13} color="#074735" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={1}>
            {booking.clientName}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.detailRow}>
          <MapPin size={13} color="#074735" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={1}>
            {booking.locationTamil}
          </Text>
        </View>

        {/* Priest & Phone */}
        <View style={styles.bottomDetailRow}>
          <View style={styles.priestContainer}>
            <Text style={styles.priestSymbol}>👳</Text>
            <Text style={styles.priestText} numberOfLines={1}>
              {booking.priestNameTamil}
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
            <Text style={styles.paymentAmountText}>
              💰 {t('common.fee')}: {booking.amount || `₹ ${booking.totalEventCharge?.toLocaleString('en-IN')}`}
            </Text>
            {booking.clientBalanceAmount !== undefined && booking.clientBalanceAmount > 0 && (
              <View style={styles.cardDueBadge}>
                <Text style={styles.cardDueBadgeText}>
                  {t('schedule.summaryPending')}: ₹ {booking.clientBalanceAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            {booking.clientBalanceAmount === 0 && (booking.totalEventCharge || 0) > 0 && (
              <View style={styles.cardPaidBadge}>
                <Text style={styles.cardPaidBadgeText}>{t('schedule.paid')}</Text>
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
    marginBottom: 12,
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
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  categorySubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
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
});

