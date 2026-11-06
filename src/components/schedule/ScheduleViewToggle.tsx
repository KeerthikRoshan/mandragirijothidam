/**
 * ScheduleViewToggle Component
 * Toggle between Time Sequence (நேர வரிசை) and By Priest (குருக்கள் வாரியாக)
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Clock, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleViewMode } from '../../types/schedule';

interface ScheduleViewToggleProps {
  viewMode: ScheduleViewMode;
  onSelectViewMode: (mode: ScheduleViewMode) => void;
}

export const ScheduleViewToggle: React.FC<ScheduleViewToggleProps> = ({
  viewMode,
  onSelectViewMode,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onSelectViewMode('time')}
        style={[
          styles.tabButton,
          viewMode === 'time' && styles.tabButtonActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('schedule.timeOrder')}
        accessibilityState={{ selected: viewMode === 'time' }}
      >
        <Clock
          size={16}
          color={viewMode === 'time' ? '#FFFFFF' : '#4B5563'}
          strokeWidth={2}
        />

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[
            styles.tabText,
            viewMode === 'time' && styles.tabTextActive,
          ]}
        >
          {t('schedule.timeOrder')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onSelectViewMode('priest')}
        style={[
          styles.tabButton,
          viewMode === 'priest' && styles.tabButtonActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('schedule.byPriest')}
        accessibilityState={{ selected: viewMode === 'priest' }}
      >
        <User
          size={16}
          color={viewMode === 'priest' ? '#FFFFFF' : '#4B5563'}
          strokeWidth={2}
        />

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[
            styles.tabText,
            viewMode === 'priest' && styles.tabTextActive,
          ]}
        >
          {t('schedule.byPriest')}
        </Text>
      </Pressable>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEFED',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 4,
  },

  tabButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 9,
  },

  tabButtonActive: {
    backgroundColor: '#074735',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  tabText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    includeFontPadding: false,
  },

  tabTextActive: {
    color: '#FFFFFF',
  },
});
