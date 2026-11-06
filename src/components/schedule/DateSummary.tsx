/**
 * DateSummary Component
 * Summary card for the selected date displaying Gregorian date,
 * Tamil year + month + day + weekday, and dynamic booking stat pills
 * (மொத்தம், உறுதி, நிலுவை).
 * Refined for balanced Tamil and English typography.
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
import { formatDisplayDate } from '../../utils/dateUtils';

interface DateSummaryProps {
  selectedDate: string; // YYYY-MM-DD
  tamilInfo: TamilDateInfo;
  summary: DateBookingSummary;
  calendarMode?: CalendarMode;
  onSwitchToWeekly?: () => void;
}

export const DateSummary: React.FC<DateSummaryProps> = ({
  selectedDate,
  tamilInfo,
  summary,
}) => {
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  const displayDate = formatDisplayDate(selectedDate, isTa ? 'ta' : 'en');
  const tamilDateString = isTa
    ? `${tamilInfo.tamilYearName} வருடம் - ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay} • ${tamilInfo.tamilWeekdayFull}`
    : `${tamilInfo.tamilYearName} Year - ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay} • ${tamilInfo.tamilWeekdayFull}`;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.topRow}>
        {/* Date Titles */}
        <View style={styles.dateInfoContainer}>
          <Text style={[styles.gregorianDateText, isTa && styles.gregorianDateTextTamil]}>
            {displayDate}
          </Text>
          <Text style={[styles.tamilDateText, isTa && styles.tamilDateTextTamil]}>
            {tamilDateString}
          </Text>
        </View>
      </View>

      {/* Booking Stat Pills (மொத்தம் / உறுதி / நிலுவை) */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, styles.pillTotal]}>
          <Text style={[styles.pillTextTotal, isTa && styles.pillTextTamil]}>
            {t('schedule.summaryTotal')}: {summary.total}
          </Text>
        </View>

        <View style={[styles.pill, styles.pillConfirmed]}>
          <View style={styles.confirmedDot} />
          <Text style={[styles.pillTextConfirmed, isTa && styles.pillTextTamil]}>
            {t('schedule.summaryConfirmed')}: {summary.confirmed}
          </Text>
        </View>

        <View style={[styles.pill, styles.pillPending]}>
          <View style={styles.pendingDot} />
          <Text style={[styles.pillTextPending, isTa && styles.pillTextTamil]}>
            {t('schedule.summaryPending')}: {summary.pending}
          </Text>
        </View>

        {summary.isMuhurtham && (
          <View style={[styles.pill, styles.pillMuhurtham]}>
            <Text style={[styles.pillTextMuhurtham, isTa && styles.pillTextTamil]}>
              {t('schedule.muhurthamBadge')}
            </Text>
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
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 12,
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
    marginBottom: 8,
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
  gregorianDateTextTamil: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  tamilDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A5408', // Warm brown/gold
    marginTop: 2,
  },
  tamilDateTextTamil: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 15,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  pillTotal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pillTextTotal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  pillConfirmed: {
    backgroundColor: '#E5F7EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  confirmedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 5,
  },
  pillTextConfirmed: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  pillPending: {
    backgroundColor: '#FFF9E6',
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  pillMuhurtham: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pillTextMuhurtham: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  pillTextTamil: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
