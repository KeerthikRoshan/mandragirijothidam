/**
 * SkeletonLoader Component
 * Reusable, smooth pulsing placeholder loading component for Mandhragiri Jothidam
 * Designed in harmony with the Vedic green, cream (#EAE6DF / #DFD9CE), and gold palette.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

/**
 * 2x2 Dashboard / Settings Stat Card Skeleton
 */
export const SkeletonStatCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.statCardContainer, style]}>
      <View style={styles.statCardHeader}>
        <Skeleton width="60%" height={14} borderRadius={4} />
        <Skeleton width={28} height={28} borderRadius={14} />
      </View>
      <Skeleton width="45%" height={24} borderRadius={6} style={styles.marginVertical8} />
      <Skeleton width="75%" height={12} borderRadius={4} />
    </View>
  );
};

/**
 * Booking List Card Skeleton
 */
export const SkeletonBookingCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.bookingCardContainer, style]}>
      <View style={styles.bookingCardHeader}>
        <View style={styles.flex1}>
          <Skeleton width="70%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} style={styles.marginTop6} />
        </View>
        <Skeleton width={64} height={22} borderRadius={11} />
      </View>
      <View style={styles.divider} />
      <View style={styles.bookingCardFooter}>
        <Skeleton width="35%" height={13} borderRadius={4} />
        <Skeleton width="45%" height={13} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * Notification / Audit Item Row Skeleton
 */
export const SkeletonRowItem: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.rowContainer, style]}>
      <Skeleton width={36} height={36} borderRadius={18} style={styles.marginRight12} />
      <View style={styles.flex1}>
        <Skeleton width="75%" height={14} borderRadius={4} />
        <Skeleton width="50%" height={11} borderRadius={4} style={styles.marginTop6} />
      </View>
      <Skeleton width={40} height={12} borderRadius={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#DFD9CE',
  },
  statCardContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginVertical8: {
    marginVertical: 8,
  },
  bookingCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F0EA',
    marginVertical: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  flex1: {
    flex: 1,
  },
  marginTop6: {
    marginTop: 6,
  },
  marginRight12: {
    marginRight: 12,
  },
});
