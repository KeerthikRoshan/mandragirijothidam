/**
 * WeeklyCalendar Component
 * Weekly horizontal date selector for Daily Schedule screen.
 * Shows 7 consecutive dates with Tamil/English weekday, Gregorian date,
 * booking counts, selected state (forest green + gold border),
 * and automatic centering of the active/today date.
 */

import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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

const ENGLISH_WEEKDAY_ABBREVIATIONS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateKey: string) => void;
  onExpandToMonth?: () => void;
  bookings: ScheduleBooking[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  onSelectDate,
  bookings,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const selectedDateObj = parseDateKey(selectedDate);
  const weekDates = getWeekDates(selectedDateObj, true);

  // Helper to count bookings on a specific date
  const getBookingCount = (dateKey: string) => {
    return bookings.filter(b => b.date === dateKey).length;
  };

  // Center the selected date in view
  useEffect(() => {
    const selectedIndex = weekDates.findIndex(d => isSameDay(d, selectedDateObj));
    if (selectedIndex >= 0 && scrollViewRef.current) {
      const cardWidthWithGap = 76; // 68 width + 8 gap
      const offset = Math.max(0, selectedIndex * cardWidthWithGap - (screenWidth - 68) / 2 + 12);
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
    }
  }, [selectedDate, screenWidth, selectedDateObj, weekDates]);

  return (
    <View style={styles.container}>
      {/* 7-Day Horizontal Strip */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weekDates.map(dateObj => {
          const dateKey = formatDateKey(dateObj);
          const isSelected = isSameDay(dateObj, selectedDateObj);
          const isToday = isSameDay(dateObj, new Date());
          const dayOfWeek = dateObj.getDay();
          const weekdayAbbrev = isTa
            ? TAMIL_WEEKDAY_ABBREVIATIONS[dayOfWeek]
            : ENGLISH_WEEKDAY_ABBREVIATIONS[dayOfWeek];
          const dayNumber = dateObj.getDate();
          const count = getBookingCount(dateKey);
          const tamilInfo = getTamilDateInfo(dateKey);

          return (
            <Pressable
              key={dateKey}
              onPress={() => onSelectDate(dateKey)}
              style={[
                styles.dayCard,
                isSelected
                  ? styles.dayCardSelected
                  : isToday
                  ? styles.dayCardToday
                  : styles.dayCardNormal,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${weekdayAbbrev} ${dayNumber}, ${count} ${
                isTa ? 'முன்பதிவுகள்' : 'bookings'
              }${isToday ? ' (Today)' : ''}`}
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

              {/* Weekday Text (Tamil / English) */}
              <Text
                style={[
                  styles.weekdayText,
                  isTa && styles.weekdayTextTamil,
                  isSelected && styles.weekdayTextSelected,
                ]}
                numberOfLines={1}
              >
                {weekdayAbbrev}
              </Text>

              {/* Gregorian Day Number */}
              <Text
                style={[
                  styles.dayNumberText,
                  isSelected && styles.dayNumberTextSelected,
                  !isSelected && isToday && styles.dayNumberTextToday,
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
                    isTa && styles.countTextTamil,
                    isSelected ? styles.countTextSelected : styles.countTextNormal,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {isTa
                    ? `${count} முன்பதிவு`
                    : `${count} ${count === 1 ? 'event' : 'events'}`}
                </Text>
              </View>

              {/* Subtle indicator dot for Today when another date is selected */}
              {isToday && !isSelected && <View style={styles.todayIndicatorDot} />}
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  dayCardToday: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#074735',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
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
  weekdayTextTamil: {
    fontSize: 11,
    fontWeight: '600',
  },
  weekdayTextSelected: {
    color: '#E5E7EB',
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#074735',
  },
  dayNumberTextToday: {
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
    justifyContent: 'center',
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
  countTextTamil: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  countTextNormal: {
    color: '#64748B',
  },
  countTextSelected: {
    color: '#7A5408', // Dark gold text
  },
  todayIndicatorDot: {
    position: 'absolute',
    bottom: -3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#074735',
  },
});
