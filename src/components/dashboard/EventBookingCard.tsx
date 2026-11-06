/**
 * EventBookingCard Component
 * Section 5 (Part B): Booking card displaying event time, category badge,
 * status badge ("உறுதியானது"), title with English subtitle, customer, location, and priest info.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BookOpen,
  Heart,
  User,
  MapPin,
  Briefcase,
  UserCheck,
  ChevronRight,
} from 'lucide-react-native';
import { EventBookingItem } from '../../types/dashboard';

interface EventBookingCardProps {
  item: EventBookingItem;
  onPress?: () => void;
}

export const EventBookingCard: React.FC<EventBookingCardProps> = ({
  item,
  onPress,
}) => {
  const renderCategoryIcon = () => {
    switch (item.iconType) {
      case 'book':
        return <BookOpen size={16} color={item.iconColor} />;
      case 'heart':
        return <Heart size={16} color={item.iconColor} />;
      default:
        return <BookOpen size={16} color={item.iconColor} />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${item.titleTamil} ${item.titleEnglish}, ${item.timeRange}`}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
          {renderCategoryIcon()}
        </View>

        <Text style={styles.timeText}>{item.timeRange}</Text>

        <View
          style={[styles.categoryBadge, { backgroundColor: item.categoryBg }]}
        >
          <Text
            style={[
              styles.categoryBadgeText,
              { color: item.categoryTextColor },
            ]}
          >
            {item.category}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>

      {/* Main Title Row with Chevron */}
      <View style={styles.titleRow}>
        <Text style={styles.titleText} numberOfLines={1}>
          {`${item.titleTamil} • ${item.titleEnglish}`}
        </Text>
        <ChevronRight size={16} color="#9CA3AF" style={styles.chevron} />
      </View>

      {/* Customer & Location / Admin Info Row */}
      <View style={styles.detailsRow}>
        <View style={styles.inlineInfo}>
          <User size={12} color="#64746B" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.customerName}</Text>
        </View>

        {item.location && (
          <View style={styles.inlineInfo}>
            <Text style={styles.bulletSeparator}>•</Text>
            <MapPin size={12} color="#64746B" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}

        {!item.isPriestRow && item.adminOrPriestInfo && (
          <View style={styles.inlineInfo}>
            <Text style={styles.bulletSeparator}>•</Text>
            <Briefcase size={12} color="#B87B28" style={styles.detailIcon} />
            <Text style={[styles.detailText, styles.adminDetailText]} numberOfLines={1}>
              {item.adminOrPriestInfo}
            </Text>
          </View>
        )}
      </View>

      {/* Priest Info Row (if separate row) */}
      {item.isPriestRow && item.adminOrPriestInfo && (
        <View style={styles.priestRow}>
          <UserCheck size={13} color="#0D543F" style={styles.detailIcon} />
          <Text style={styles.priestText} numberOfLines={1}>
            {item.adminOrPriestInfo}
          </Text>
        </View>
      )}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#073E2E',
    marginRight: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E2F8ED',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginLeft: 'auto',
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
    marginTop: 8,
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F2F24',
    flex: 1,
    marginRight: 6,
  },
  chevron: {
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  inlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 3,
  },
  detailText: {
    fontSize: 11,
    color: '#64746B',
  },
  adminDetailText: {
    color: '#B87B28',
  },
  bulletSeparator: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  priestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  priestText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D543F',
  },
});
