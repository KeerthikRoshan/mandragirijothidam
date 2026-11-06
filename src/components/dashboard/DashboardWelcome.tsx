/**
 * DashboardWelcome Component
 * Section 2: Home Dashboard badge, greeting "வணக்கம், நிர்வாகி",
 * dynamic Tamil calendar date, and official emblem star badge.
 */

import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { getTamilCalendarString } from '../../data/dashboardMockData';

interface DashboardWelcomeProps {
  dashboardLabel?: string;
  greeting?: string;
  dateString?: string;
}

export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({
  dashboardLabel: _dashboardLabel = 'Home Dashboard',
  greeting = 'வணக்கம், நிர்வாகி',
  dateString,
}) => {
  const formattedDate = useMemo(() => {
    return dateString || getTamilCalendarString();
  }, [dateString]);

  return (
    <View style={styles.container}>
      {/* Row 1: Home Dashboard Badge */}
      {/* <View style={styles.badgeRow}>
        <View style={styles.templeIconContainer}>
          <TempleGopuramIcon size={18} color="#074735" />
        </View>
        <Text style={styles.dashboardLabel}>{dashboardLabel}</Text>
      </View> */}

      {/* Row 2: Greeting & Right Star Badge */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingText}>{greeting}</Text>

        <View style={styles.starBadgeContainer}>
          <View style={styles.starBadgeCircle}>
            <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Row 3: Dynamic Gregorian & Tamil Date */}
      <Text style={styles.dateText}>{formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FAF9F6',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E2ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dashboardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#063D2E',
    letterSpacing: 0.2,
  },
  starBadgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DDEEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#073E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64746B',
    marginTop: 5,
  },
});
