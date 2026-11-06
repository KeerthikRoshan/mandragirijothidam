/**
 * LanguageToggle Component
 * Minimalist segmented toggle for Tamil (தமிழ்) and English
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Languages } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { borderRadius, spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import type { Language } from '../../constants/translations';

export interface LanguageToggleProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Languages size={15} color={colors.primary} />
      </View>

      <View style={styles.togglePill}>
        {/* Tamil Option */}
        <Pressable
          onPress={() => onLanguageChange('ta')}
          accessibilityRole="button"
          accessibilityLabel="தமிழுக்கு மாற்றவும்"
          accessibilityState={{ selected: currentLanguage === 'ta' }}
          style={[
            styles.segment,
            currentLanguage === 'ta' && styles.activeSegment,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text
            style={[
              styles.segmentText,
              currentLanguage === 'ta' && styles.activeSegmentText,
            ]}
          >
            தமிழ்
          </Text>
        </Pressable>

        {/* English Option */}
        <Pressable
          onPress={() => onLanguageChange('en')}
          accessibilityRole="button"
          accessibilityLabel="Switch to English"
          accessibilityState={{ selected: currentLanguage === 'en' }}
          style={[
            styles.segment,
            currentLanguage === 'en' && styles.activeSegment,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text
            style={[
              styles.segmentText,
              currentLanguage === 'en' && styles.activeSegmentText,
            ]}
          >
            English
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  iconWrapper: {
    marginRight: spacing.xs,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 12,
  },
  activeSegmentText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
