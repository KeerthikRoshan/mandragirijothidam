/**
 * DateSummary Component
 * Summary card for the selected date displaying Gregorian date,
 * Tamil year + month + day + weekday, and dynamic booking stat pills
 * (மொத்தம், உறுதி, நிலுவை), plus a "தற்போதைய வாரம்" shortcut in monthly mode.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { DateBookingSummary, CalendarMode } from '../../types/schedule';
import { TamilDateInfo } from '../../types/tamilCalendar';
import { formatTamilDisplayDate } from '../../utils/dateUtils';

interface DateSummaryProps {
  selectedDate: string; // YYYY-MM-DD
  tamilInfo: TamilDateInfo;
  summary: DateBookingSummary;
  calendarMode: CalendarMode;
  onSwitchToWeekly?: () => void;
}

export const DateSummary: React.FC<DateSummaryProps> = ({
  selectedDate,
  tamilInfo,
  summary,
  calendarMode: _calendarMode,
  onSwitchToWeekly: _onSwitchToWeekly,
}) => {
  const { t } = useTranslation();
  const displayDate = formatTamilDisplayDate(selectedDate);
  const tamilDateString = `${tamilInfo.tamilYearName} வருடம் - ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay} • ${tamilInfo.tamilWeekdayFull}`;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.topRow}>
        {/* Date Titles */}
        <View style={styles.dateInfoContainer}>
          <Text style={styles.gregorianDateText}>{displayDate}</Text>
          <Text style={styles.tamilDateText}>{tamilDateString}</Text>
        </View>
       
      </View>

      {/* Booking Stat Pills (மொத்தம் / உறுதி / நிலுவை) */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, styles.pillTotal]}>
          <Text style={styles.pillTextTotal}>{t('schedule.summaryTotal')}: {summary.total}</Text>
        </View>

        <View style={[styles.pill, styles.pillConfirmed]}>
          <View style={styles.confirmedDot} />
          <Text style={styles.pillTextConfirmed}>{t('schedule.summaryConfirmed')}: {summary.confirmed}</Text>
        </View>

        <View style={[styles.pill, styles.pillPending]}>
          <View style={styles.pendingDot} />
          <Text style={styles.pillTextPending}>{t('schedule.summaryPending')}: {summary.pending}</Text>
        </View>

        {summary.isMuhurtham && (
          <View style={[styles.pill, styles.pillMuhurtham]}>
            <Text style={styles.pillTextMuhurtham}>{t('schedule.muhurthamBadge')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F9F6EE', // Warm sandalwood cream
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInfoContainer: {
    flex: 1,
  },
  gregorianDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#074735', // Deep Forest Green
    letterSpacing: 0.2,
  },
  tamilDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A5408', // Warm brown/gold
    marginTop: 3,
  },
  weekShortcutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C5A869',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  weekShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#074735',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillTotal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pillTextTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  pillConfirmed: {
    backgroundColor: '#E5F7EE',
    borderWidth: 1,
    borderColor: '#B0ECC9',
  },
  confirmedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 5,
  },
  pillTextConfirmed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 5,
  },
  pillTextPending: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  pillMuhurtham: {
    backgroundColor: '#FFF0CD',
    borderWidth: 1,
    borderColor: '#E2C785',
  },
  pillTextMuhurtham: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C5D07',
  },
});
