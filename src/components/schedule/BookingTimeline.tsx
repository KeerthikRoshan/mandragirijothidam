/**
 * BookingTimeline Component
 * Vertical timeline with status-colored nodes, connecting dotted lines,
 * and cards. Also supports grouping by priest when viewMode === 'priest'.
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
import { ScheduleBooking, ScheduleViewMode, BookingStatus } from '../../types/schedule';
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
  const { t } = useTranslation();

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
        <Text style={styles.emptyTitle}>{t('schedule.emptyTitle')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('schedule.emptySubtitle')}
        </Text>
      </View>
    );
  }

  // Node dot color based on booking status
  const getNodeColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return '#059669'; // Green
      case 'upcoming':
        return '#EA580C'; // Orange
      case 'pending':
        return '#D97706'; // Amber/Yellow
      case 'completed':
        return '#64748B'; // Slate
      default:
        return '#074735';
    }
  };

  // If in 'priest' mode, group bookings by priestNameTamil
  if (viewMode === 'priest') {
    const priestGroups: Record<string, ScheduleBooking[]> = {};
    bookings.forEach(b => {
      const priest = b.priestNameTamil || t('schedule.otherPriests');
      if (!priestGroups[priest]) {
        priestGroups[priest] = [];
      }
      priestGroups[priest].push(b);
    });

    return (
      <View style={styles.timelineContainer}>
        {Object.entries(priestGroups).map(([priestName, priestBookings]) => (
          <View key={priestName} style={styles.priestSection}>
            {/* Priest Section Header */}
            <View style={styles.priestHeader}>
              <Text style={styles.priestHeaderIcon}>👳</Text>
              <Text style={styles.priestHeaderTitle}>{priestName}</Text>
              <View style={styles.priestCountBadge}>
                <Text style={styles.priestCountText}>
                  {t('schedule.eventsCount', { count: priestBookings.length })}
                </Text>
              </View>
            </View>


            {/* Bookings for this priest */}
            {priestBookings.map((booking, idx) => (
              <View key={booking.id} style={styles.row}>
                {/* Timeline Axis */}
                <View style={styles.axisContainer}>
                  <View
                    style={[
                      styles.timelineNode,
                      { backgroundColor: getNodeColor(booking.status) },
                    ]}
                  />
                  {idx < priestBookings.length - 1 && (
                    <View style={styles.dottedLine} />
                  )}
                </View>

                {/* Booking Card */}
                <View style={styles.cardWrapper}>
                  <BookingCard
                    booking={booking}
                    onPress={() => onSelectBooking?.(booking)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  // Standard 'time' mode
  return (
    <View style={styles.timelineContainer}>
      {bookings.map((booking, index) => {
        const isLast = index === bookings.length - 1;
        const nodeColor = getNodeColor(booking.status);

        return (
          <View key={booking.id} style={styles.row}>
            {/* Timeline Axis */}
            <View style={styles.axisContainer}>
              <View style={[styles.timelineNode, { backgroundColor: nodeColor }]} />
              {!isLast && <View style={styles.dottedLine} />}
            </View>

            {/* Booking Card */}
            <View style={styles.cardWrapper}>
              <BookingCard
                booking={booking}
                onPress={() => onSelectBooking?.(booking)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  axisContainer: {
    width: 28,
    alignItems: 'center',
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2,
  },
  dottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginTop: 2,
    marginBottom: 0,
    zIndex: 1,
  },
  cardWrapper: {
    flex: 1,
    paddingLeft: 6,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
});

