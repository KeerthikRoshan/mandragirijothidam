/**
 * BookingTimeline Component (Clean Booking List)
 * Displays booking cards for the selected date in a simple, easy-to-scan layout
 * without stepper or progress indicators.
 * Supports Time Order and By Priest view modes.
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookingCard } from './BookingCard';
import { ScheduleBooking, ScheduleViewMode } from '../../types/schedule';
import { ASSETS } from '../../constants/assets';

interface BookingTimelineProps {
  bookings: ScheduleBooking[];
  viewMode: ScheduleViewMode;
  onSelectBooking?: (booking: ScheduleBooking) => void;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  bookings,
  viewMode,
  onSelectBooking,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={ASSETS.images.schedule.emptyCalendar}
          style={styles.emptyImage}
          resizeMode="contain"
          accessible
          accessibilityLabel={t('schedule.emptyTitle')}
        />
        <Text style={[styles.emptyTitle, isTa && styles.emptyTitleTamil]}>
          {t('schedule.emptyTitle')}
        </Text>
        <Text style={[styles.emptySubtitle, isTa && styles.emptySubtitleTamil]}>
          {t('schedule.emptySubtitle')}
        </Text>
      </View>
    );
  }

  // If in 'priest' mode, group bookings by priestNameTamil / priestName
  if (viewMode === 'priest') {
    const priestGroups: Record<string, ScheduleBooking[]> = {};
    bookings.forEach(b => {
      const priest = isTa
        ? b.priestNameTamil || b.priestName || t('schedule.otherPriests')
        : b.priestName || b.priestNameTamil || t('schedule.otherPriests');
      if (!priestGroups[priest]) {
        priestGroups[priest] = [];
      }
      priestGroups[priest].push(b);
    });

    return (
      <View style={styles.listContainer}>
        {Object.entries(priestGroups).map(([priestName, priestBookings]) => (
          <View key={priestName} style={styles.priestSection}>
            {/* Priest Section Header */}
            <View style={styles.priestHeader}>
              <Text style={styles.priestHeaderIcon}>👳</Text>
              <Text
                style={[
                  styles.priestHeaderTitle,
                  isTa && styles.priestHeaderTitleTamil,
                ]}
                numberOfLines={1}
              >
                {priestName}
              </Text>
              <View style={styles.priestCountBadge}>
                <Text
                  style={[
                    styles.priestCountText,
                    isTa && styles.priestCountTextTamil,
                  ]}
                >
                  {t('schedule.eventsCount', { count: priestBookings.length })}
                </Text>
              </View>
            </View>

            {/* Bookings for this priest (Clean, Stepper-Free Cards) */}
            <View style={styles.cardGroup}>
              {priestBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => onSelectBooking?.(booking)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Standard 'time' mode: Clean, simple, easy-to-scan list of cards
  return (
    <View style={styles.listContainer}>
      <View style={styles.cardGroup}>
        {bookings.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onPress={() => onSelectBooking?.(booking)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  cardGroup: {
    gap: 10,
  },
  priestSection: {
    marginBottom: 16,
  },
  priestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  priestHeaderIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  priestHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#074735',
    flex: 1,
  },
  priestHeaderTitleTamil: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  priestCountBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priestCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  priestCountTextTamil: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 100,
    height: 90,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#074735',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyTitleTamil: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  emptySubtitleTamil: {
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 17,
  },
});
