/**
 * OverviewSection Component
 * Section 4: "இன்றைய நிலை • Overview" heading, "அறிக்கைகள் ›" link, and 2x2 statistics grid.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OverviewStatItem } from '../../types/dashboard';
import { OverviewStatCard } from './OverviewStatCard';

interface OverviewSectionProps {
  title?: string;
  actionText?: string;
  stats: OverviewStatItem[];
  onPressReports?: () => void;
  onPressStat?: (item: OverviewStatItem) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  title = 'இன்றைய நிலை • Overview',
  actionText,
  stats,
  onPressReports,
  onPressStat,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headingTitle}>{title}</Text>
        {actionText ? (
          <Pressable
            onPress={onPressReports}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionText}>{actionText}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 2x2 Statistics Grid */}
      <View style={styles.gridContainer}>
        {/* Row 1: Today's Events & Upcoming */}
        <View style={styles.row}>
          {stats[0] && (
            <OverviewStatCard
              item={stats[0]}
              onPress={() => onPressStat?.(stats[0])}
            />
          )}
          <View style={styles.gap} />
          {stats[1] && (
            <OverviewStatCard
              item={stats[1]}
              onPress={() => onPressStat?.(stats[1])}
            />
          )}
        </View>

        {/* Row 2: Approval Pending & Completed */}
        <View style={[styles.row, styles.rowMarginTop]}>
          {stats[2] && (
            <OverviewStatCard
              item={stats[2]}
              onPress={() => onPressStat?.(stats[2])}
            />
          )}
          <View style={styles.gap} />
          {stats[3] && (
            <OverviewStatCard
              item={stats[3]}
              onPress={() => onPressStat?.(stats[3])}
            />
          )}
        </View>
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
    marginBottom: 12,
  },
  headingTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#073E2E',
    letterSpacing: 0.1,
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C6D23', // Temple gold
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rowMarginTop: {
    marginTop: 14,
  },
  gap: {
    width: 12,
  },
});
