/**
 * ScheduleHeader Component
 * Top app bar for Daily Schedule screen with title, English subtitle,
 * back/home navigation, and calendar view switch button.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Calendar, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CalendarMode } from '../../types/schedule';

interface ScheduleHeaderProps {
  calendarMode: CalendarMode;
  onPressBack?: () => void;
  onToggleCalendarMode?: () => void;
}

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  calendarMode,
  onPressBack,
  onToggleCalendarMode,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerContainer}>
      {/* Back / Navigation button */}
      <Pressable
        onPress={onPressBack}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={22} color="#074735" />
      </Pressable>

      {/* Center Title & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.tamilTitle}>{t('schedule.title')}</Text>
        <Text style={styles.englishSubtitle}>{t('schedule.subtitle')}</Text>
      </View>

      {/* Right Mode Toggle button */}
      <Pressable
        onPress={onToggleCalendarMode}
        style={[
          styles.iconButton,
          calendarMode === 'month' && styles.iconButtonActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          calendarMode === 'week' ? t('schedule.fullMonthView') : t('schedule.weekView')
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {calendarMode === 'week' ? (
          <CalendarDays size={20} color="#074735" />
        ) : (
          <Calendar size={20} color="#C5A869" />
        )}
      </Pressable>
    </View>
  );
};


const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconButtonActive: {
    backgroundColor: '#074735',
    borderColor: '#C5A869',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamilTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.3,
  },
  englishSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginTop: 1,
  },
});
