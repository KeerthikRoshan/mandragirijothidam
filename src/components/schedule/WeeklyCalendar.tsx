/**
 * WeeklyCalendar Component
 * Weekly horizontal date selector for Daily Schedule screen.
 * Shows 7 consecutive dates with Tamil weekday, Gregorian date,
 * booking counts, selected state (forest green + gold border),
 * and "முழு மாதம் ›" expand link.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  formatDateKey,
  getWeekDates,
  isSameDay,
  parseDateKey,
  TAMIL_WEEKDAY_ABBREVIATIONS,
} from '../../utils/dateUtils';
import { getTamilDateInfo } from '../../services/tamilCalendarService';
import { ScheduleBooking } from '../../types/schedule';

interface WeeklyCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateKey: string) => void;
  onExpandToMonth: () => void;
  bookings: ScheduleBooking[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  onSelectDate,
  onExpandToMonth,
  bookings,
}) => {
  const { t } = useTranslation();
  const selectedDateObj = parseDateKey(selectedDate);
  const weekDates = getWeekDates(selectedDateObj, true);


  // Helper to count bookings on a specific date
  const getBookingCount = (dateKey: string) => {
    return bookings.filter(b => b.date === dateKey).length;
  };

  return (
    <View style={styles.container}>
      {/* Top Context Bar: Month & Expand Link */}
      <View style={styles.contextBar}>
        <Pressable
          onPress={onExpandToMonth}
          style={styles.expandButton}
          accessibilityRole="button"
          accessibilityLabel={t('schedule.fullMonthLink') || 'முழு மாதம் ›'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
       />
      </View>

      {/* 7-Day Horizontal Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weekDates.map(dateObj => {
          const dateKey = formatDateKey(dateObj);
          const isSelected = isSameDay(dateObj, selectedDateObj);
          const dayOfWeek = dateObj.getDay();
          const weekdayAbbrev = TAMIL_WEEKDAY_ABBREVIATIONS[dayOfWeek];
          const dayNumber = dateObj.getDate();
          const count = getBookingCount(dateKey);
          const tamilInfo = getTamilDateInfo(dateKey);

          return (
            <Pressable
              key={dateKey}
              onPress={() => onSelectDate(dateKey)}
              style={[
                styles.dayCard,
                isSelected ? styles.dayCardSelected : styles.dayCardNormal,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${weekdayAbbrev} ${dayNumber}, ${count} முன்பதிவுகள்`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Star for Muhurtham date */}
              {tamilInfo.isMuhurtham && (
                <Text
                  style={[
                    styles.muhurthamStar,
                    isSelected && styles.muhurthamStarSelected,
                  ]}
                >
                  ★
                </Text>
              )}

              {/* Tamil Weekday */}
              <Text
                style={[
                  styles.weekdayText,
                  isSelected && styles.weekdayTextSelected,
                ]}
              >
                {weekdayAbbrev}
              </Text>

              {/* Gregorian Day Number */}
              <Text
                style={[
                  styles.dayNumberText,
                  isSelected && styles.dayNumberTextSelected,
                ]}
              >
                {dayNumber}
              </Text>

              {/* Booking Count Badge */}
              <View
                style={[
                  styles.countBadge,
                  isSelected ? styles.countBadgeSelected : styles.countBadgeNormal,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected ? styles.countTextSelected : styles.countTextNormal,
                  ]}
                  numberOfLines={1}
                >
                  {count} முன்பதிவு
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF9F6',
    paddingVertical: 12,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextCalendarIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
  expandButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A47A24', // Gold
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayCard: {
    width: 68,
    height: 86,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  dayCardNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCardSelected: {
    backgroundColor: '#074735', // Deep Forest Green
    borderWidth: 1.5,
    borderColor: '#C5A869', // Rich Gold Border
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  muhurthamStar: {
    position: 'absolute',
    top: 4,
    right: 5,
    fontSize: 10,
    color: '#A47A24',
  },
  muhurthamStarSelected: {
    color: '#FFE082',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  weekdayTextSelected: {
    color: '#E5E7EB',
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#074735',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: '94%',
    alignItems: 'center',
  },
  countBadgeNormal: {
    backgroundColor: '#F1F5F9',
  },
  countBadgeSelected: {
    backgroundColor: '#FFF0CD', // Soft gold
  },
  countText: {
    fontSize: 9,
    fontWeight: '700',
  },
  countTextNormal: {
    color: '#64748B',
  },
  countTextSelected: {
    color: '#7A5408', // Dark gold text
  },
});
