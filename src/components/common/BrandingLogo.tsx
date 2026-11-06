/**
 * BrandingLogo Component
 * Renders the official Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்) logo
 * Preserves exact 1:1 aspect ratio without stretching or distortion.
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { spacing } from '../../constants/spacing';
import { ASSETS } from '../../constants/assets';

export interface BrandingLogoProps {
  size?: number;
}

export const BrandingLogo: React.FC<BrandingLogoProps> = ({ size }) => {
  const { width } = useWindowDimensions();

  // Responsive square sizing (1:1 aspect ratio) preserving the complete emblem and typography
  // Defaults to ~40% of screen width (140dp - 180dp), but can be compacted via size prop (e.g. during keyboard open)
  const defaultSize = Math.min(Math.max(width * 0.1, 100), 180);
  const logoSize = size ?? defaultSize;

  return (
    <View style={styles.container}>
      <Image
        source={ASSETS.images.logo}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
        accessibilityLabel="Mandhragiri Jothidam - மந்திரகிரி ஜோதிடம்"
        accessibilityRole="image"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  logo: {
    alignSelf: 'center',
  },
});
