/**
 * StaffAttendanceScreen Component
 * Individual Monthly Attendance History for Authenticated Priest or Assistant
 *
 * Implements:
 * 1. Personal Attendance Records only (Strict Data Isolation).
 * 2. Month Navigation (Previous / Next / Today).
 * 3. Monthly Metrics: Present, Absent, Attendance Percentage (%), Not Marked.
 * 4. Attendance Percentage Formula: Present / (Present + Absent) * 100 (excludes Not Marked).
 * 5. Complete Date-wise History with submission timestamps and absence remarks.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import { getStaffMonthlyAttendance } from '../../services/attendanceService';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import {
  StaffAttendanceRecord,
  StaffMonthlyAttendanceSummary,
} from '../../types/attendance';
import { StaffUserProfile } from '../../types/staffPortal';
import {
  addMonths,
  ENGLISH_MONTH_NAMES,
  isToday,
  parseDateKey,
  TAMIL_GREGORIAN_MONTH_NAMES,
  TAMIL_WEEKDAY_ABBREVIATIONS,
  TAMIL_WEEKDAY_FULL,
} from '../../utils/dateUtils';
import {
  StaffAttendanceScreenNavigationProp,
  StaffAttendanceScreenRouteProp,
} from '../../types/navigation';

type TabFilter = 'all' | 'present' | 'absent' | 'not_marked';

export const StaffAttendanceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffAttendanceScreenNavigationProp>();
  const route = useRoute<StaffAttendanceScreenRouteProp>();

  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const [monthlyData, setMonthlyData] = useState<StaffMonthlyAttendanceSummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAttendance = useCallback(
    async (staffIdParam?: string, year?: number, month?: number) => {
      try {
        let staff: StaffUserProfile;
        if (staffIdParam) {
          staff = await authService.setStaffSession(staffIdParam);
        } else {
          staff = await authService.getCurrentStaff();
        }
        setCurrentStaff(staff);

        const y = year ?? viewYear;
        const m = month ?? viewMonth;
        const summary = await getStaffMonthlyAttendance(staff.id, y, m);
        setMonthlyData(summary);
      } catch (_e) {
        // Fallback
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [viewYear, viewMonth]
  );

  useEffect(() => {
    setLoading(true);
    loadAttendance(route?.params?.staffId, viewYear, viewMonth);
  }, [route?.params?.staffId, viewYear, viewMonth, loadAttendance]);

  // Month Navigation
  const handlePrevMonth = () => {
    const curDate = new Date(viewYear, viewMonth, 1);
    const prev = addMonths(curDate, -1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  };

  const handleNextMonth = () => {
    const curDate = new Date(viewYear, viewMonth, 1);
    const next = addMonths(curDate, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth;
  }, [viewYear, viewMonth]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!monthlyData) return [];
    if (activeTab === 'all') return monthlyData.records;
    return monthlyData.records.filter(r => r.status === activeTab);
  }, [monthlyData, activeTab]);

  // Display detail on tap
  const handleTapDateRecord = (record: StaffAttendanceRecord) => {
    const isPresent = record.status === 'present';
    const isAbsent = record.status === 'absent';
    const statusText = isPresent
      ? 'வருகை (Present)'
      : isAbsent
      ? 'விடுப்பு (Absent)'
      : 'பதிவாகவில்லை (Not Marked)';

    let message = `தேதி: ${record.dateKey}\nநிலை: ${statusText}`;
    if (isPresent && record.submissionTime) {
      message += `\nபதிவான நேரம்: ${record.submissionTime}`;
    }
    if (isAbsent && record.remarks) {
      message += `\nகாரணம்: ${record.remarks}`;
    }

    Alert.alert('வருகை விவரம்', message);
  };

  const monthEn = ENGLISH_MONTH_NAMES[viewMonth];
  const monthTa = TAMIL_GREGORIAN_MONTH_NAMES[viewMonth];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Header Bar */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#1B2D25" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            எனது வருகை (My Attendance)
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentStaff?.nameTamil} • {currentStaff?.designationTamil}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh attendance"
          onPress={() => {
            setRefreshing(true);
            loadAttendance(currentStaff?.id, viewYear, viewMonth);
          }}
          style={styles.refreshButton}
        >
          <RefreshCw size={16} color="#074735" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Month Navigation Card */}
        <View style={styles.monthNavCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={handlePrevMonth}
            style={styles.monthNavArrow}
          >
            <ChevronLeft size={20} color="#074735" />
          </Pressable>

          <View style={styles.monthCenterInfo}>
            <View style={styles.monthTitleRow}>
              <Calendar size={15} color="#074735" />
              <Text style={styles.monthTitleText}>
                {monthEn} {viewYear}
              </Text>
            </View>
            <Text style={styles.monthSubtitleText}>
              {monthTa} {viewYear}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={handleNextMonth}
            style={styles.monthNavArrow}
          >
            <ChevronRight size={20} color="#074735" />
          </Pressable>

          {!isCurrentMonth && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset to current month"
              onPress={handleTodayMonth}
              style={styles.todayMonthButton}
            >
              <Text style={styles.todayMonthText}>இன்று</Text>
            </Pressable>
          )}
        </View>

        {/* 3. Monthly Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Present */}
          <View style={[styles.metricCard, styles.metricCardPresent]}>
            <View style={styles.metricIconWrap}>
              <CheckCircle2 size={16} color="#145C43" />
            </View>
            <Text style={[styles.metricVal, { color: '#145C43' }]}>
              {monthlyData?.presentCount ?? 0}
            </Text>
            <Text style={styles.metricLbl}>வருகை (Present)</Text>
          </View>

          {/* Absent */}
          <View style={[styles.metricCard, styles.metricCardAbsent]}>
            <View style={styles.metricIconWrap}>
              <XCircle size={16} color="#B42318" />
            </View>
            <Text style={[styles.metricVal, { color: '#B42318' }]}>
              {monthlyData?.absentCount ?? 0}
            </Text>
            <Text style={styles.metricLbl}>விடுப்பு (Absent)</Text>
          </View>

          {/* Attendance Percentage */}
          <View style={[styles.metricCard, styles.metricCardRate]}>
            <View style={styles.metricIconWrap}>
              <CalendarCheck size={16} color="#936319" />
            </View>
            <Text style={[styles.metricVal, { color: '#936319' }]}>
              {monthlyData ? `${monthlyData.attendancePercentage}%` : '0%'}
            </Text>
            <Text style={styles.metricLbl}>வருகை சதவீதம் (Rate)</Text>
          </View>

          {/* Not Marked */}
          <View style={[styles.metricCard, styles.metricCardNeutral]}>
            <View style={styles.metricIconWrap}>
              <Clock size={16} color="#667085" />
            </View>
            <Text style={[styles.metricVal, { color: '#667085' }]}>
              {monthlyData?.notMarkedCount ?? 0}
            </Text>
            <Text style={styles.metricLbl}>பதிவாகவில்லை</Text>
          </View>
        </View>

        {/* 4. Filter Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'all' }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
              அனைத்தும்
            </Text>
            <View style={[styles.tabBadge, activeTab === 'all' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'all' && styles.tabBadgeTextActive]}>
                {monthlyData?.records.length ?? 0}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('present')}
            style={[styles.tabBtn, activeTab === 'present' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'present' }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'present' && styles.tabBtnTextActive]}>
              வருகை
            </Text>
            <View style={[styles.tabBadge, activeTab === 'present' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'present' && styles.tabBadgeTextActive]}>
                {monthlyData?.presentCount ?? 0}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('absent')}
            style={[styles.tabBtn, activeTab === 'absent' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'absent' }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'absent' && styles.tabBtnTextActive]}>
              விடுப்பு
            </Text>
            <View style={[styles.tabBadge, activeTab === 'absent' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'absent' && styles.tabBadgeTextActive]}>
                {monthlyData?.absentCount ?? 0}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('not_marked')}
            style={[styles.tabBtn, activeTab === 'not_marked' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'not_marked' }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'not_marked' && styles.tabBtnTextActive]}>
              நிலுவை
            </Text>
            <View style={[styles.tabBadge, activeTab === 'not_marked' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'not_marked' && styles.tabBadgeTextActive]}>
                {monthlyData?.notMarkedCount ?? 0}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5. Date-wise List */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeading}>நாள்வாரியான வருகை பட்டியல்</Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#074735" />
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock size={32} color="#98A2B3" />
              <Text style={styles.emptyText}>இந்த தேர்வில் பதிவுகள் எதுவும் இல்லை.</Text>
            </View>
          ) : (
            filteredRecords.map(record => {
              const recDate = parseDateKey(record.dateKey);
              const dayNum = recDate.getDate();
              const weekdayIndex = recDate.getDay();
              const weekdayTaAbbr = TAMIL_WEEKDAY_ABBREVIATIONS[weekdayIndex];
              const weekdayTaFull = TAMIL_WEEKDAY_FULL[weekdayIndex];
              const isDateToday = isToday(recDate);

              const isPresent = record.status === 'present';
              const isAbsent = record.status === 'absent';
              const isNotMarked = record.status === 'not_marked';

              return (
                <Pressable
                  key={record.id}
                  onPress={() => handleTapDateRecord(record)}
                  style={[
                    styles.historyCard,
                    isDateToday && styles.historyCardToday,
                    isAbsent && styles.historyCardAbsentBorder,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Attendance record for ${record.dateKey}: ${record.status}`}
                >
                  {/* Left Column: Day number & Weekday */}
                  <View
                    style={[
                      styles.dateBadgeColumn,
                      isPresent && styles.dateBadgePresent,
                      isAbsent && styles.dateBadgeAbsent,
                      isNotMarked && styles.dateBadgeNotMarked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateBadgeNumber,
                        isPresent && styles.dateBadgeNumberPresent,
                        isAbsent && styles.dateBadgeNumberAbsent,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    <Text
                      style={[
                        styles.dateBadgeWeekday,
                        isPresent && styles.dateBadgeWeekdayPresent,
                        isAbsent && styles.dateBadgeWeekdayAbsent,
                      ]}
                    >
                      {weekdayTaAbbr}
                    </Text>
                  </View>

                  {/* Middle Column: Date info, timestamps, remarks */}
                  <View style={styles.historyDetailsColumn}>
                    <View style={styles.historyDateRow}>
                      <Text style={styles.historyFullDateText}>
                        {record.dateKey} • {weekdayTaFull}
                      </Text>
                      {isDateToday && (
                        <View style={styles.todaySmallBadge}>
                          <Text style={styles.todaySmallBadgeText}>இன்று</Text>
                        </View>
                      )}
                    </View>

                    {isPresent && (
                      <View style={styles.historyStatusInfoRow}>
                        <Clock size={11} color="#145C43" />
                        <Text style={styles.historyTimestampText}>
                          பதிவான நேரம்: {record.submissionTime || '08:00 AM'}
                        </Text>
                      </View>
                    )}

                    {isAbsent && (
                      <View style={styles.historyRemarksRow}>
                        <AlertCircle size={11} color="#B42318" />
                        <Text style={styles.historyRemarksText} numberOfLines={1}>
                          {record.remarks || 'விடுப்பு பதிவு செய்யப்பட்டது'}
                        </Text>
                      </View>
                    )}

                    {isNotMarked && (
                      <Text style={styles.historyNotMarkedText}>
                        வருகை பதிவு செய்யப்படவில்லை
                      </Text>
                    )}
                  </View>

                  {/* Right Column: Status pill */}
                  <View
                    style={[
                      styles.statusPill,
                      isPresent && styles.statusPillPresent,
                      isAbsent && styles.statusPillAbsent,
                      isNotMarked && styles.statusPillNotMarked,
                    ]}
                  >
                    {isPresent && <Check size={11} color="#145C43" />}
                    {isAbsent && <X size={11} color="#B42318" />}
                    <Text
                      style={[
                        styles.statusPillText,
                        isPresent && styles.statusPillTextPresent,
                        isAbsent && styles.statusPillTextAbsent,
                        isNotMarked && styles.statusPillTextNotMarked,
                      ]}
                    >
                      {isPresent ? 'வருகை' : isAbsent ? 'விடுப்பு' : 'நிலுவை'}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 6. Bottom Navigation */}
      <StaffBottomNav activeTab="attendance" staffId={currentStaff?.id} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD1',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16.5,
    fontWeight: '700',
    color: '#074735',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#5F7068',
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F4EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  /* Month Navigation */
  monthNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  monthNavArrow: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F4EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterInfo: {
    alignItems: 'center',
    flex: 1,
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitleText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 15.5,
    fontWeight: '700',
    color: '#074735',
  },
  monthSubtitleText: {
    fontSize: 11.5,
    color: '#5F7068',
    marginTop: 2,
  },
  todayMonthButton: {
    backgroundColor: '#074735',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 6,
  },
  todayMonthText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FAF9F5',
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  metricCardPresent: {
    backgroundColor: '#F3FAF5',
    borderColor: '#C3E4CD',
  },
  metricCardAbsent: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  metricCardRate: {
    backgroundColor: '#FDFBF7',
    borderColor: '#E7D5AA',
  },
  metricCardNeutral: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EAECF0',
  },
  metricIconWrap: {
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5B53',
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#074735',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5F7068',
  },
  tabBtnTextActive: {
    color: '#FAF9F5',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#5F7068',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* History List */
  historySection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2D25',
    marginBottom: 10,
  },
  centerBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  emptyText: {
    fontSize: 12,
    color: '#5F7068',
    marginTop: 6,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  historyCardToday: {
    borderColor: '#074735',
    borderWidth: 1.5,
  },
  historyCardAbsentBorder: {
    borderColor: '#FECDCA',
  },
  dateBadgeColumn: {
    width: 40,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F4EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateBadgePresent: {
    backgroundColor: '#E8F3EB',
  },
  dateBadgeAbsent: {
    backgroundColor: '#FEE4E2',
  },
  dateBadgeNotMarked: {
    backgroundColor: '#F2F4F7',
  },
  dateBadgeNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2D25',
  },
  dateBadgeNumberPresent: {
    color: '#145C43',
  },
  dateBadgeNumberAbsent: {
    color: '#B42318',
  },
  dateBadgeWeekday: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#5F7068',
  },
  dateBadgeWeekdayPresent: {
    color: '#145C43',
  },
  dateBadgeWeekdayAbsent: {
    color: '#B42318',
  },
  historyDetailsColumn: {
    flex: 1,
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyFullDateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1B2D25',
  },
  todaySmallBadge: {
    backgroundColor: '#074735',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todaySmallBadgeText: {
    color: '#FAF9F5',
    fontSize: 8.5,
    fontWeight: '700',
  },
  historyStatusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  historyTimestampText: {
    fontSize: 10.5,
    color: '#145C43',
    fontWeight: '600',
  },
  historyRemarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  historyRemarksText: {
    fontSize: 10.5,
    color: '#B42318',
    fontWeight: '500',
  },
  historyNotMarkedText: {
    fontSize: 10.5,
    color: '#667085',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  statusPillPresent: {
    backgroundColor: '#E8F3EB',
  },
  statusPillAbsent: {
    backgroundColor: '#FEE4E2',
  },
  statusPillNotMarked: {
    backgroundColor: '#F2F4F7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillTextPresent: {
    color: '#145C43',
  },
  statusPillTextAbsent: {
    color: '#B42318',
  },
  statusPillTextNotMarked: {
    color: '#475467',
  },
});
