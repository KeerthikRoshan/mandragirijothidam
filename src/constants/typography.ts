/**
 * Typography Constants for Mandhragiri Jothidam
 * Optimized for readable Tamil and English typography
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = {
  regular: Platform.select({
    ios: 'NotoSansTamil-Regular',
    android: 'NotoSansTamil-Regular',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'NotoSansTamil-Medium',
    android: 'NotoSansTamil-Medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'NotoSansTamil-SemiBold',
    android: 'NotoSansTamil-SemiBold',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'NotoSansTamil-Bold',
    android: 'NotoSansTamil-Bold',
    default: 'System',
  }),
  english: Platform.select({
    ios: 'PlusJakartaSans-Regular',
    android: 'PlusJakartaSans-Regular',
    default: 'System',
  }),
};

export const typography = {
  fontFamily,

  // Text Presets with generous line heights to prevent Tamil diacritic clipping
  heading: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  subheading: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  error: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  footer: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
  },
} as const;
