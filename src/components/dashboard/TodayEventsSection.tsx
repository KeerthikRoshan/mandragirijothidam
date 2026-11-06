/**
 * TodayEventsSection Component
 * Section 5: "இன்றைய நிகழ்வுகள்" header with event count badge,
 * "அனைத்தும் காண்க →" action link, Live Operations Card, and Event Booking Cards.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { LiveOperationData, EventBookingItem } from '../../types/dashboard';
import { LiveOperationsCard } from './LiveOperationsCard';
import { EventBookingCard } from './EventBookingCard';

interface TodayEventsSectionProps {
  title?: string;
  count?: number;
  actionText?: string;
  liveOperation: LiveOperationData;
  bookings: EventBookingItem[];
  onPressViewAll?: () => void;
  onPressLiveOperation?: () => void;
  onPressBooking?: (item: EventBookingItem) => void;
}

export const TodayEventsSection: React.FC<TodayEventsSectionProps> = ({
  title = 'இன்றைய நிகழ்வுகள்',
  count = 8,
  actionText = 'அனைத்தும் காண்க',
  liveOperation,
  bookings,
  onPressViewAll,
  onPressLiveOperation,
  onPressBooking,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.headingTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        </View>

        <Pressable
          onPress={onPressViewAll}
          style={styles.actionRow}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} ${count}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionText}>{actionText}</Text>
          <ArrowRight size={13} color="#8C6D23" style={styles.arrowIcon} />
        </Pressable>
      </View>

      {/* Live Operations Panel */}
      <LiveOperationsCard
        data={liveOperation}
        onPress={onPressLiveOperation}
      />

      {/* Booking Event Cards List */}
      <View style={styles.eventsList}>
        {bookings.map(booking => (
          <EventBookingCard
            key={booking.id}
            item={booking}
            onPress={() => onPressBooking?.(booking)}
          />
        ))}
      </View>
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
  },
  headingTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#073E2E',
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: '#E2ECE7',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#073E2E',
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
  arrowIcon: {
    marginLeft: 4,
  },
  eventsList: {
    marginTop: 4,
  },
});
