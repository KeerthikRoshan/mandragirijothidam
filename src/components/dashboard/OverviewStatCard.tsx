/**
 * OverviewStatCard Component
 * Redesigned Section 4 Overview Card:
 * - Upper-left: Tamil title, prominent count, and supporting subtitle.
 * - Lower-right: Astrology character illustration anchored to the corner.
 * - Clean white card with subtle elevation and rounded corners (22dp).
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OverviewStatItem } from '../../types/dashboard';

interface OverviewStatCardProps {
  item: OverviewStatItem;
  onPress?: () => void;
}

export const OverviewStatCard: React.FC<OverviewStatCardProps> = ({
  item,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.value} ${item.subtitle}`}
    >
      {/* Upper-Left Content: Title, Large Count, and Subtitle */}
      <View style={styles.textContent}>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.valueRow}>
          <Text
            style={[
              styles.valueText,
              item.valueColor ? { color: item.valueColor } : null,
            ]}
          >
            {item.value}
          </Text>
          {item.subtitle ? (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Lower-Right Illustration: Anchored naturally to bottom-right corner */}
      {item.image && (
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  textContent: {
    zIndex: 2,
    maxWidth: '75%',
  },
  titleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#064532', // Dark forest-green text
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  valueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#064E3B', // Primary forest green count
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64746B',
    marginLeft: 6,
  },
  illustration: {
    position: 'absolute',
    right: -12,
    bottom: -40,
    width: 145,
    height: 145,
    zIndex: 1,
  },
});
