/**
 * LiveOperationsCard Component
 * Section 5 (Part A): Dark green live operations panel with live dot indicator,
 * "LIVE OPERATIONS TODAY" banner, and inner white card for ongoing poojas.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Flame } from 'lucide-react-native';
import { LiveOperationData } from '../../types/dashboard';

interface LiveOperationsCardProps {
  data: LiveOperationData;
  onPress?: () => void;
}

export const LiveOperationsCard: React.FC<LiveOperationsCardProps> = ({
  data,
  onPress,
}) => {
  return (
    <View style={styles.outerContainer}>
      {/* Live Header with Glowing Yellow Dot */}
      <View style={styles.headerRow}>
        <View style={styles.liveDot} />
        <View style={styles.headerTextColumn}>
          <Text style={styles.headerTitle}>இன்றைய நேரலை நிகழ்வுகள்</Text>
          <Text style={styles.headerSubtitle}>LIVE OPERATIONS TODAY</Text>
        </View>
      </View>

      {/* Inner White Event Card */}
      <Pressable
        onPress={onPress}
        style={styles.innerCard}
        accessibilityRole="button"
        accessibilityLabel={`${data.title}, ${data.subtitle}`}
      >
        <View style={styles.flameIconContainer}>
          <Flame size={18} color="#E5B84A" />
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {data.title}
          </Text>
          <Text style={styles.eventSubtitle} numberOfLines={1}>
            {data.subtitle}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#063D2E', // Deep forest green
    borderRadius: 16,
    padding: 13,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // Golden amber live dot
    marginTop: 4,
    marginRight: 8,
  },
  headerTextColumn: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#84BFA8',
    letterSpacing: 0.8,
    marginTop: 1.5,
  },
  innerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  flameIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#073E2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#073E2E',
  },
  eventSubtitle: {
    fontSize: 11,
    color: '#64746B',
    marginTop: 2,
  },
});
