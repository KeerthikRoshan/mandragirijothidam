/**
 * MonthlyCalendar Component
 * Full monthly calendar view for Daily Schedule screen.
 * Displays 7-column grid with Gregorian date, authentic Tamil date number,
 * verified Muhurtham highlights (gold card + star), booking indicator dots,
 * month navigator header, and Muhurtham legend.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getMonthCalendarCells,
  isSameDay,
  parseDateKey,
  TAMIL_GREGORIAN_MONTH_NAMES,
  TAMIL_WEEKDAY_ABBREVIATIONS,
} from '../../utils/dateUtils';
import {
  getMuhurthamCountForMonth,
  getTamilDateInfo,
  getTamilMonthDisplayForGregorian,
} from '../../services/tamilCalendarService';
import { ScheduleBooking } from '../../types/schedule';

interface MonthlyCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateKey: string) => void;
  bookings: ScheduleBooking[];
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  selectedDate,
  onSelectDate,
  bookings,
}) => {
  const { t } = useTranslation();
  const selectedDateObj = parseDateKey(selectedDate);
  const [currentYear, setCurrentYear] = useState<number>(selectedDateObj.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(
    selectedDateObj.getMonth()
  );

  const cells = getMonthCalendarCells(currentYear, currentMonthIndex);
  const tamilMonthDisplay = getTamilMonthDisplayForGregorian(
    currentYear,
    currentMonthIndex
  );
  const gregorianMonthName = TAMIL_GREGORIAN_MONTH_NAMES[currentMonthIndex];
  const muhurthamCount = getMuhurthamCountForMonth(currentYear, currentMonthIndex);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  // Helper to count bookings on a specific date
  const getBookingCount = (dateKey: string) => {
    return bookings.filter(b => b.date === dateKey).length;
  };

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handlePrevMonth}
          style={styles.navArrowButton}
          accessibilityRole="button"
          accessibilityLabel={t('schedule.prevMonth')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.starIcon}>✪</Text>
            <Text style={styles.headerTitle}>
              {gregorianMonthName} {currentYear}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>{tamilMonthDisplay}</Text>
        </View>

        <Pressable
          onPress={handleNextMonth}
          style={styles.navArrowButton}
          accessibilityRole="button"
          accessibilityLabel={t('schedule.nextMonth')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight size={22} color="#074735" />
        </Pressable>
      </View>


      {/* Weekday Column Headers (ஞா திங் செவ் புத வியா வெள் சனி) */}
      <View style={styles.weekdayRow}>
        {TAMIL_WEEKDAY_ABBREVIATIONS.map(abbrev => (
          <View key={abbrev} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{abbrev}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {cells.map(cell => {
          const isSelected = isSameDay(cell.date, selectedDateObj);
          const tamilInfo = getTamilDateInfo(cell.dateKey);
          const bookingCount = getBookingCount(cell.dateKey);
          const isMuhurtham = tamilInfo.isMuhurtham;

          return (
            <Pressable
              key={cell.dateKey}
              onPress={() => onSelectDate(cell.dateKey)}
              style={[
                styles.dayCell,
                !cell.isCurrentMonth && styles.dayCellOutside,
                isMuhurtham && cell.isCurrentMonth && styles.dayCellMuhurtham,
                isSelected && styles.dayCellSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${cell.dayNumber}, தமிழ் தேதி ${tamilInfo.tamilDay}, ${bookingCount} முன்பதிவு`}
            >
              {/* Gold star for Muhurtham */}
              {isMuhurtham && cell.isCurrentMonth && (
                <Text
                  style={[
                    styles.cellStar,
                    isSelected && styles.cellStarSelected,
                  ]}
                >
                  ★
                </Text>
              )}

              {/* Gregorian Day Number */}
              <Text
                style={[
                  styles.gregorianText,
                  !cell.isCurrentMonth && styles.outsideMonthText,
                  isMuhurtham && styles.muhurthamGregorianText,
                  isSelected && styles.selectedGregorianText,
                ]}
              >
                {cell.dayNumber}
              </Text>

              {/* Tamil Day Number below */}
              <Text
                style={[
                  styles.tamilDayText,
                  !cell.isCurrentMonth && styles.outsideMonthTamilText,
                  isMuhurtham && styles.muhurthamTamilDayText,
                  isSelected && styles.selectedTamilDayText,
                ]}
              >
                {tamilInfo.tamilDay}
              </Text>

              {/* Booking Dots */}
              {bookingCount > 0 && cell.isCurrentMonth && (
                <View style={styles.dotsRow}>
                  {Array.from({ length: Math.min(bookingCount, 4) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.bookingDot,
                        isSelected && styles.bookingDotSelected,
                      ]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Legend at bottom */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>
          <Text style={styles.legendStar}>★</Text> {t('schedule.muhurthamLegend', { count: muhurthamCount })} •{' '}
          <Text style={styles.legendDot}>●</Text> {t('schedule.bookingDotsLegend')}
        </Text>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: '#A47A24',
    fontSize: 16,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#074735',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
    position: 'relative',
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayCellMuhurtham: {
    backgroundColor: '#FFF0CD', // Soft light gold
    borderWidth: 1,
    borderColor: '#E2C785',
  },
  dayCellSelected: {
    backgroundColor: '#074735', // Deep Forest Green
    borderWidth: 2,
    borderColor: '#C5A869',
  },
  cellStar: {
    position: 'absolute',
    top: 2,
    right: 3,
    fontSize: 8,
    color: '#A47A24',
  },
  cellStarSelected: {
    color: '#FFE082',
  },
  gregorianText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  muhurthamGregorianText: {
    color: '#5C3E00',
  },
  selectedGregorianText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  outsideMonthText: {
    color: '#94A3B8',
  },
  tamilDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  muhurthamTamilDayText: {
    color: '#8C5D07',
  },
  selectedTamilDayText: {
    color: '#E2D3B3',
  },
  outsideMonthTamilText: {
    color: '#CBD5E1',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  bookingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#074735',
  },
  bookingDotSelected: {
    backgroundColor: '#C5A869',
  },
  legendContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  legendStar: {
    color: '#A47A24',
    fontSize: 12,
  },
  legendDot: {
    color: '#074735',
    fontSize: 8,
  },
});
