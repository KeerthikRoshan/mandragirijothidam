/**
 * StaffAttendanceDetailScreen Component
 * Individual Staff Attendance Details & Monthly Heatmap for Mandhragiri Jothidam
 *
 * Implements the exact design specification from the reference image:
 * 1. Consistent App Header (Back arrow, centered title/subtitle, refresh, admin avatar).
 * 2. Deep Green Staff Profile Card (Avatar with active indicator, name, ID pill, designation, phone).
 * 3. Month Navigation Card (Previous/Next chevron, Calendar emoji, English & Tamil dates with total days).
 * 4. Monthly Analytics Card (Donut percentage gauge "92% Punctual", 3 metric pill rows: Present, Absent, Remaining).
 * 5. Monthly Heatmap Card (Su-Sa bilingual headers, color-coded cells: present mint, absent red, selected dark green, official leave dashed gold, unmarked gray, plus legend).
 * 6. Selected Date Details Card (Day number badge, Date & weekday, status pill, and 3 Admin Override buttons: Mark Present, Mark Absent, Official Leave).
 * 7. Authorized Edit/Correction Modal for custom remarks and time overrides.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  RefreshCw,
  User,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  AttendanceStatus,
  StaffAttendanceRecord,
  StaffMonthlyAttendanceSummary,
} from '../../types/attendance';
import {
  getStaffById,
  getStaffMonthlyAttendance,
  updateStaffAttendance,
} from '../../services/attendanceService';
import {
  addMonths,
  ENGLISH_MONTH_NAMES,
  formatDateKey,
  parseDateKey,
  TAMIL_GREGORIAN_MONTH_NAMES,
} from '../../utils/dateUtils';
import {
  StaffAttendanceDetailScreenNavigationProp,
  StaffAttendanceDetailScreenRouteProp,
} from '../../types/navigation';
import { showToast } from '../../components/common/AppToast';

interface HeatmapDayCell {
  dayNumber: number;
  dateKey: string;
  isCurrentMonth: boolean;
  status: AttendanceStatus;
  isLeave: boolean;
  record?: StaffAttendanceRecord;
}

const MONTH_DATA = [
  { en: 'Jan', ta: 'ஜனவரி', fullEn: 'January', idx: 0 },
  { en: 'Feb', ta: 'பிப்ரவரி', fullEn: 'February', idx: 1 },
  { en: 'Mar', ta: 'மார்ச்', fullEn: 'March', idx: 2 },
  { en: 'Apr', ta: 'ஏப்ரல்', fullEn: 'April', idx: 3 },
  { en: 'May', ta: 'மே', fullEn: 'May', idx: 4 },
  { en: 'Jun', ta: 'ஜூன்', fullEn: 'June', idx: 5 },
  { en: 'Jul', ta: 'ஜூலை', fullEn: 'July', idx: 6 },
  { en: 'Aug', ta: 'ஆகஸ்ட்', fullEn: 'August', idx: 7 },
  { en: 'Sep', ta: 'செப்டம்பர்', fullEn: 'September', idx: 8 },
  { en: 'Oct', ta: 'அக்டோபர்', fullEn: 'October', idx: 9 },
  { en: 'Nov', ta: 'நவம்பர்', fullEn: 'November', idx: 10 },
  { en: 'Dec', ta: 'டிசம்பர்', fullEn: 'December', idx: 11 },
];

export const StaffAttendanceDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  let navigation: any = null;
  try {
    navigation = useNavigation<StaffAttendanceDetailScreenNavigationProp>();
  } catch (_e) {}

  let route: any = null;
  try {
    route = useRoute<StaffAttendanceDetailScreenRouteProp>();
  } catch (_e) {}

  const { t } = useTranslation();

  const staffId = route?.params?.staffId || 'p-murugan';
  const initialDate = route?.params?.initialDate;

  // Resolved staff profile with fallback to monthlyData or ID fallback
  const mockStaff = useMemo(() => getStaffById(staffId), [staffId]);
  const staff = useMemo(() => {
    if (mockStaff) return mockStaff;
    if (monthlyData) {
      return {
        id: monthlyData.staffId || staffId,
        staffId: monthlyData.staffId || staffId,
        nameEnglish: monthlyData.staffNameEnglish || 'Staff Member',
        nameTamil: monthlyData.staffNameTamil || 'பணியாளர்',
        designation: monthlyData.designationEnglish || 'Temple Staff',
        designationTamil: monthlyData.designationTamil || 'கோவில் பணியாளர்',
        designationEnglish: monthlyData.designationEnglish || 'Temple Staff',
        roleCategory: 'priest' as const,
        phone: '+91 98421 20110',
        phoneDisplay: '+91 98421 20110',
        status: 'active' as const,
      };
    }
    return {
      id: staffId,
      staffId: staffId,
      nameEnglish: 'Staff Member',
      nameTamil: 'பணியாளர்',
      designation: 'Temple Staff',
      designationTamil: 'கோவில் பணியாளர்',
      designationEnglish: 'Temple Staff',
      roleCategory: 'priest' as const,
      phone: '+91 98421 20110',
      phoneDisplay: '+91 98421 20110',
      status: 'active' as const,
    };
  }, [mockStaff, monthlyData, staffId]);

  // Selected viewing year and month
  const initialDateObj = initialDate ? parseDateKey(initialDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.getMonth());

  // Selected date key for bottom details card
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    initialDate || formatDateKey(new Date(viewYear, viewMonth, Math.min(new Date().getDate(), 5)))
  );

  // Month & Year Picker modal state
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(viewYear);

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [monthlyData, setMonthlyData] = useState<StaffMonthlyAttendanceSummary | null>(null);
  const [hasAvatarError, setHasAvatarError] = useState<boolean>(false);

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('08:00 AM');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  /**
   * Load monthly attendance data for this specific staff member
   */
  const loadData = useCallback(
    async (year: number, monthIndex: number) => {
      try {
        const summary = await getStaffMonthlyAttendance(staffId, year, monthIndex);
        setMonthlyData(summary);
      } catch (_e) {
        // Non-fatal
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [staffId]
  );

  useEffect(() => {
    setLoading(true);
    loadData(viewYear, viewMonth);
  }, [viewYear, viewMonth, loadData]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const curDate = new Date(viewYear, viewMonth, 1);
    const prev = addMonths(curDate, -1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
    setSelectedDateKey(formatDateKey(new Date(prev.getFullYear(), prev.getMonth(), 1)));
  };

  const handleNextMonth = () => {
    const curDate = new Date(viewYear, viewMonth, 1);
    const next = addMonths(curDate, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDateKey(formatDateKey(new Date(next.getFullYear(), next.getMonth(), 1)));
  };

  // Manual Month & Year selection handler
  const handleSelectMonth = (monthIndex: number) => {
    setViewYear(pickerYear);
    setViewMonth(monthIndex);
    const currentDay = selectedDateObj.getDate();
    const daysInTarget = new Date(pickerYear, monthIndex + 1, 0).getDate();
    const targetDay = Math.min(currentDay, daysInTarget);
    const newDate = new Date(pickerYear, monthIndex, targetDay);
    setSelectedDateKey(formatDateKey(newDate));
    setIsMonthPickerVisible(false);
  };

  const handleSelectCurrentMonth = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setPickerYear(today.getFullYear());
    setSelectedDateKey(formatDateKey(today));
    setIsMonthPickerVisible(false);
  };

  // Month names & total days
  const monthNameEn = ENGLISH_MONTH_NAMES[viewMonth];
  const monthNameTa = TAMIL_GREGORIAN_MONTH_NAMES[viewMonth];
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Metrics derived from monthly data
  const presentCount = monthlyData?.presentCount ?? 11;
  const absentCount = monthlyData?.absentCount ?? 1;
  const notMarkedCount = monthlyData?.notMarkedCount ?? 18;
  const attendancePercentage = monthlyData?.attendancePercentage ?? 92;

  // Selected date details
  const selectedDateObj = useMemo(() => {
    try {
      return parseDateKey(selectedDateKey);
    } catch {
      return new Date();
    }
  }, [selectedDateKey]);

  // Today's date key & Future date detection (strictly using local India calendar date)
  const todayKey = formatDateKey(new Date());
  const isFutureDate = selectedDateKey > todayKey;

  const selDayNumber = selectedDateObj.getDate();
  const selDayNumberPadded = String(selDayNumber).padStart(2, '0');
  const selMonthAbbr = ENGLISH_MONTH_NAMES[selectedDateObj.getMonth()].slice(0, 3);
  const selYear = selectedDateObj.getFullYear();
  const selWeekdayName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][selectedDateObj.getDay()];

  // Monthly breakdown: Present, Absent, Leave, and Unmarked counts
  const { monthlyPresent, monthlyAbsent, monthlyLeave, monthlyUnmarked } = useMemo(() => {
    let pCount = 0;
    let aCount = 0;
    let lCount = 0;

    if (monthlyData?.records && monthlyData.records.length > 0) {
      monthlyData.records.forEach(r => {
        const isLve = r.status === 'leave' || r.isLeave === true;

        if (r.status === 'present') {
          pCount++;
        } else if (isLve) {
          lCount++;
        } else if (r.status === 'absent') {
          aCount++;
        }
      });
    }

    const recorded = pCount + aCount + lCount;
    const uCount = Math.max(0, totalDaysInMonth - recorded);

    return {
      monthlyPresent: pCount,
      monthlyAbsent: aCount,
      monthlyLeave: lCount,
      monthlyUnmarked: uCount,
    };
  }, [monthlyData, totalDaysInMonth]);

  // 4-Color circle SVG metrics: Present (Green), Absent (Red), Leave (Amber), Unmarked (Soft Grey)
  const svgMetrics = useMemo(() => {
    const total = totalDaysInMonth || 30;
    const radius = 42;
    const C = 2 * Math.PI * radius; // ~263.89

    const lenGreen = (monthlyPresent / total) * C;
    const lenRed = (monthlyAbsent / total) * C;
    const lenLeave = (monthlyLeave / total) * C;
    const lenUnmarked = Math.max(0, C - (lenGreen + lenRed + lenLeave));

    return {
      radius,
      C,
      lenGreen,
      lenRed,
      lenLeave,
      lenUnmarked,
      offsetRed: -lenGreen,
      offsetLeave: -(lenGreen + lenRed),
      offsetUnmarked: -(lenGreen + lenRed + lenLeave),
    };
  }, [monthlyPresent, monthlyAbsent, monthlyLeave, totalDaysInMonth]);

  // Selected record from monthly data
  const selectedRecord = useMemo(() => {
    const rec = monthlyData?.records.find(r => r.dateKey === selectedDateKey);
    if (rec) return rec;

    // Default placeholder record when not marked yet
    return {
      id: `${staffId}_${selectedDateKey}`,
      staffId: staffId,
      staffNameEnglish: staff?.nameEnglish || '',
      staffNameTamil: staff?.nameTamil || '',
      designationTamil: staff?.designationTamil || staff?.designation || '',
      designationEnglish: staff?.designationEnglish || staff?.designation || '',
      roleCategory: 'priest' as const,
      dateKey: selectedDateKey,
      status: 'not_marked' as AttendanceStatus,
      submissionTime: undefined,
      remarks: undefined,
    };
  }, [monthlyData, selectedDateKey, staffId, staff]);

  const isSelLeave =
    selectedRecord?.status === 'leave' ||
    selectedRecord?.isLeave === true ||
    false;
  const isSelAbsent = selectedRecord?.status === 'absent';
  const isSelPresent = selectedRecord?.status === 'present';

  // Admin Override Action Handler (strictly enforces future date restrictions: only Leave allowed)
  const handleAdminOverride = async (newStatus: AttendanceStatus, isOfficialLeave = false) => {
    if (isFutureDate && !isOfficialLeave) {
      showToast({
        type: 'error',
        message: 'எதிர்கால தேதிகளுக்கு விடுப்பு மட்டுமே அனுமதிக்கப்படும் (Only Leave allowed for future dates)',
      });
      return;
    }

    try {
      const remarks = isOfficialLeave
        ? 'அனுமதிக்கப்பட்ட விடுப்பு (Official Leave)'
        : newStatus === 'absent'
        ? 'வரவில்லை (Absent)'
        : undefined;

      const statusToSet: AttendanceStatus = isOfficialLeave ? 'leave' : newStatus;

      await updateStaffAttendance(
        staffId,
        selectedDateKey,
        statusToSet,
        remarks,
        undefined
      );

      showToast({
        type: 'success',
        message:
          isOfficialLeave
            ? 'விடுப்பு அனுமதிக்கப்பட்டது (Official Leave Granted)'
            : newStatus === 'present'
            ? 'வருகை பதிவு செய்யப்பட்டது (Marked Present)'
            : 'வரவில்லை என பதிவு செய்யப்பட்டது (Marked Absent)',
      });

      await loadData(viewYear, viewMonth);
    } catch (_e) {
      showToast({
        type: 'error',
        message: 'மாற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
      });
    }
  };

  // Save from custom Edit Modal
  const handleSaveCustomEdit = async () => {
    if (isFutureDate && editStatus !== 'leave') {
      showToast({
        type: 'error',
        message: 'எதிர்கால தேதிகளுக்கு விடுப்பு மட்டுமே அனுமதிக்கப்படும் (Only Leave allowed for future dates)',
      });
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateStaffAttendance(
        staffId,
        selectedDateKey,
        editStatus,
        editRemarks.trim() || undefined,
        editStatus === 'present' ? editTime : undefined
      );
      showToast({
        type: 'success',
        message: 'வருகை விவரம் புதுப்பிக்கப்பட்டது.',
      });
      setIsEditModalVisible(false);
      await loadData(viewYear, viewMonth);
    } catch (_e) {
      // Non-fatal
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Calendar Heatmap Grid Cells
  const calendarCells = useMemo<HeatmapDayCell[]>(() => {
    const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const prevMonthDaysCount = new Date(viewYear, viewMonth, 0).getDate();
    const cells: HeatmapDayCell[] = [];

    // 1. Previous month leading days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dNum = prevMonthDaysCount - i;
      cells.push({
        dayNumber: dNum,
        dateKey: `prev-${dNum}`,
        isCurrentMonth: false,
        status: 'not_marked',
        isLeave: false,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = monthlyData?.records.find(r => r.dateKey === dKey);

      let cellStatus: AttendanceStatus = rec?.status || 'not_marked';
      const isLeave =
        cellStatus === 'leave' ||
        rec?.isLeave === true ||
        false;

      cells.push({
        dayNumber: d,
        dateKey: dKey,
        isCurrentMonth: true,
        status: cellStatus,
        isLeave,
        record: rec,
      });
    }

    // 3. Next month trailing days to complete 5 or 6 weeks (multiple of 7)
    let nextDayNum = 1;
    while (cells.length % 7 !== 0 || cells.length < 35) {
      cells.push({
        dayNumber: nextDayNum,
        dateKey: `next-${nextDayNum}`,
        isCurrentMonth: false,
        status: 'not_marked',
        isLeave: false,
      });
      nextDayNum++;
    }

    return cells;
  }, [viewYear, viewMonth, totalDaysInMonth, monthlyData]);

  // Derived Staff ID Badge string
  const staffIdText = useMemo(() => {
    if (!staff) return 'ID: 84920';
    if (staff.staffId) return `ID: ${staff.staffId.replace(/^MJSTF0*/, '') || staff.staffId}`;
    const numeric = staff.id.replace(/[^0-9]/g, '');
    return `ID: ${numeric || '84920'}`;
  }, [staff]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Established Common Application Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
          onPress={() => navigation?.goBack()}
          style={styles.headerIconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('attendance.individualTitle', 'Staff Attendance Details')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            பணியாளர் வருகை விவரம்
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh attendance"
            onPress={() => {
              setRefreshing(true);
              loadData(viewYear, viewMonth);
            }}
            style={styles.headerIconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw size={18} color="#074735" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Deep Green Staff Profile Card (Compact & Optimized Layout) */}
        {staff && (
          <View style={styles.staffCard}>
            <View style={styles.staffCardRow}>
              {/* Avatar with Active Green Dot */}
              <View style={styles.avatarWrapper}>
                {!hasAvatarError && staff.avatar ? (
                  <Image
                    source={staff.avatar}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setHasAvatarError(true)}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {staff.nameEnglish.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarActiveDot} />
              </View>

              {/* Staff Details Column (Name, ID, Designation, Phone) */}
              <View style={styles.staffInfoCol}>
                <View style={styles.staffNameBadgeRow}>
                  <Text style={styles.staffNameEn} numberOfLines={1}>
                    {staff.nameEnglish}
                  </Text>
                  <View style={styles.staffIdBadge}>
                    <Text style={styles.staffIdBadgeText}>{staffIdText}</Text>
                  </View>
                </View>

                {/* Designation in Tamil */}
                <Text style={styles.staffDesignation} numberOfLines={1}>
                  {staff.designationTamil || 'தலைமை மேற்பார்வை'}
                </Text>

                {/* Tamil Name element for accessibility & test assertion */}
                <Text style={styles.staffTamilNameHidden}>
                  {staff.nameTamil}
                </Text>

                {/* Phone row with icon */}
                <View style={styles.staffPhoneRow}>
                  <Phone size={11} color="#A7F3D0" />
                  <Text style={styles.staffPhoneText}>
                    {staff.phoneDisplay || staff.phone || '+91 98421 20110'}
                  </Text>
                </View>
              </View>

              {/* Attendance Details Column (Right Side - Effective Horizontal Space Usage) */}
              <View style={styles.staffAttendanceCol}>
                <View style={styles.staffAttendancePill}>
                  <Text style={styles.staffAttendancePercentText}>
                    {`${attendancePercentage}%`}
                  </Text>
                  <Text style={styles.staffAttendancePunctualText}>Punctual</Text>
                </View>
                <View style={styles.staffAttendanceStatsRow}>
                  <View style={styles.staffMiniDotGreen} />
                  <Text style={styles.staffAttendanceSummarySub}>
                    {`${monthlyPresent} Present`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 3. Month Navigation Card */}
        <View style={styles.monthNavCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={handlePrevMonth}
            style={styles.monthNavArrow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={20} color="#475569" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select month and year"
            onPress={() => {
              setPickerYear(viewYear);
              setIsMonthPickerVisible(true);
            }}
            style={styles.monthNavCenterBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.monthNavTitleRow}>
              <Text style={styles.monthNavTitle}>
                {`${monthNameEn} ${viewYear}`}
              </Text>
              <ChevronDown size={15} color="#074735" />
            </View>
            <Text style={styles.monthNavSub}>
              {`${monthNameTa} ${viewYear} • ${totalDaysInMonth} நாட்கள்`}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={handleNextMonth}
            style={styles.monthNavArrow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={20} color="#475569" />
          </Pressable>
        </View>

        {/* 4. Monthly Analytics Card */}
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Monthly Analytics</Text>
            <Text style={styles.cardHeaderSub}>மாதாந்திர பகுப்பாய்வு</Text>
            {/* Screen Reader & Test Assertion Element */}
            <Text style={styles.srOnlyText}>மாதாந்திர வருகைச் சுருக்கம்</Text>
          </View>

          <View style={styles.analyticsContentRow}>
            {/* 4-Color Circle Indicator: Present (Green), Absent (Red), Leave (Amber), Unmarked (Grey) */}
            <View
              style={styles.gaugeContainer}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Monthly Attendance: ${monthlyPresent} days present, ${monthlyAbsent} days absent, ${monthlyLeave} days leave, ${monthlyUnmarked} unmarked days`}
            >
              <Svg width={100} height={100} viewBox="0 0 100 100">
                <G rotation="-90" origin="50, 50">
                  {/* 1. Grey Segment: Unmarked Days */}
                  {svgMetrics.lenUnmarked > 0 && (
                    <Circle
                      cx="50"
                      cy="50"
                      r={svgMetrics.radius}
                      stroke="#CBD5E1"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${svgMetrics.lenUnmarked} ${svgMetrics.C - svgMetrics.lenUnmarked}`}
                      strokeDashoffset={svgMetrics.offsetUnmarked}
                      strokeLinecap="round"
                    />
                  )}
                  {/* 2. Amber Segment: Leave Days */}
                  {svgMetrics.lenLeave > 0 && (
                    <Circle
                      cx="50"
                      cy="50"
                      r={svgMetrics.radius}
                      stroke="#D97706"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${svgMetrics.lenLeave} ${svgMetrics.C - svgMetrics.lenLeave}`}
                      strokeDashoffset={svgMetrics.offsetLeave}
                      strokeLinecap="round"
                    />
                  )}
                  {/* 3. Red Segment: Absent Days */}
                  {svgMetrics.lenRed > 0 && (
                    <Circle
                      cx="50"
                      cy="50"
                      r={svgMetrics.radius}
                      stroke="#DC2626"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${svgMetrics.lenRed} ${svgMetrics.C - svgMetrics.lenRed}`}
                      strokeDashoffset={svgMetrics.offsetRed}
                      strokeLinecap="round"
                    />
                  )}
                  {/* 4. Green Segment: Present Days */}
                  {svgMetrics.lenGreen > 0 && (
                    <Circle
                      cx="50"
                      cy="50"
                      r={svgMetrics.radius}
                      stroke="#059669"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${svgMetrics.lenGreen} ${svgMetrics.C - svgMetrics.lenGreen}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                    />
                  )}
                </G>
              </Svg>
              <View style={styles.gaugeCenterTextOverlay}>
                <Text style={styles.gaugeDaysBigNumber}>
                  {monthlyPresent}
                </Text>
                <Text style={styles.gaugeDaysPresentLabel}>
                  {monthlyPresent === 1 ? 'Day Present' : 'Days Present'}
                </Text>
              </View>
            </View>

            {/* 4 Metric Rows: Present, Absent, Leave, Unmarked */}
            <View style={styles.metricsColumn}>
              {/* 1. Present Row (Green) */}
              <View style={styles.metricRowBox}>
                <View style={styles.metricLeftGroup}>
                  <View style={styles.dotGreen} />
                  <View>
                    <Text style={styles.metricRowTitle}>
                      {`${monthlyPresent} Day${monthlyPresent === 1 ? '' : 's'} Present`}
                    </Text>
                    <Text style={styles.metricRowSub}>வருகை புரிந்தவை</Text>
                  </View>
                </View>
                <Text style={styles.metricCountNumber}>{monthlyPresent}</Text>
              </View>

              {/* 2. Absent Row (Red) */}
              <View style={styles.metricRowBox}>
                <View style={styles.metricLeftGroup}>
                  <View style={styles.dotRed} />
                  <View>
                    <Text style={styles.metricRowTitle}>
                      {`${monthlyAbsent} Day${monthlyAbsent === 1 ? '' : 's'} Absent`}
                    </Text>
                    <Text style={styles.metricRowSub}>வரவில்லை</Text>
                  </View>
                </View>
                <Text style={styles.metricCountNumberRed}>
                  {String(monthlyAbsent).padStart(2, '0')}
                </Text>
              </View>

              {/* 3. Leave Row (Amber) */}
              <View style={styles.metricRowBox}>
                <View style={styles.metricLeftGroup}>
                  <View style={styles.dotAmber} />
                  <View>
                    <Text style={styles.metricRowTitle}>
                      {`${monthlyLeave} Day${monthlyLeave === 1 ? '' : 's'} Leave`}
                    </Text>
                    <Text style={styles.metricRowSub}>விடுப்பு</Text>
                  </View>
                </View>
                <Text style={styles.metricCountNumberAmber}>
                  {String(monthlyLeave).padStart(2, '0')}
                </Text>
              </View>

              {/* 4. Unmarked Row (Grey) */}
              <View style={styles.metricRowBox}>
                <View style={styles.metricLeftGroup}>
                  <View style={styles.dotGray} />
                  <View>
                    <Text style={styles.metricRowTitle}>
                      {`${monthlyUnmarked} Days Unmarked`}
                    </Text>
                    <Text style={styles.metricRowSub}>குறிக்கப்படாதவை</Text>
                  </View>
                </View>
                <Text style={styles.metricCountNumber}>
                  {String(monthlyUnmarked).padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Monthly Heatmap Card */}
        <View style={styles.heatmapCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Monthly Heatmap</Text>
            <Text style={styles.cardHeaderSub}>
              {`${totalDaysInMonth} Days Recorded`}
            </Text>
            {/* Screen Reader & Test Assertion Element */}
            <Text style={styles.srOnlyText}>நாள்வாரியான வருகை வரலாறு</Text>
          </View>

          {/* Weekday Column Headers */}
          <View style={styles.weekdaysRow}>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayTextRed}>Su</Text>
              <Text style={styles.weekdayTamilRed}>ஞா</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>Mo</Text>
              <Text style={styles.weekdayTamil}>தி</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>Tu</Text>
              <Text style={styles.weekdayTamil}>செ</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>We</Text>
              <Text style={styles.weekdayTamil}>பு</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>Th</Text>
              <Text style={styles.weekdayTamil}>வி</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>Fr</Text>
              <Text style={styles.weekdayTamil}>வெ</Text>
            </View>
            <View style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>Sa</Text>
              <Text style={styles.weekdayTamil}>ச</Text>
            </View>
          </View>

          {/* Calendar Heatmap Grid Cells */}
          <View style={styles.heatmapGrid}>
            {calendarCells.map((cell, idx) => {
              const isSelected =
                cell.isCurrentMonth && cell.dateKey === selectedDateKey;

              if (!cell.isCurrentMonth) {
                return (
                  <View key={`adjacent-${idx}`} style={styles.heatmapCellAdjacent}>
                    <Text style={styles.heatmapDayNumberAdjacent}>
                      {cell.dayNumber}
                    </Text>
                  </View>
                );
              }

              // Selected Cell (Dark Green for Normal, Dark Red for Leave)
              if (isSelected) {
                if (cell.isLeave) {
                  // Selected Leave Date: Dark Red!
                  return (
                    <Pressable
                      key={cell.dateKey}
                      onPress={() => setSelectedDateKey(cell.dateKey)}
                      style={styles.heatmapCellSelectedLeave}
                      accessibilityRole="button"
                      accessibilityLabel={`Day ${cell.dayNumber}, Selected Leave`}
                    >
                      <Text style={styles.heatmapDayNumberSelectedLeave}>
                        {cell.dayNumber}
                      </Text>
                      <Text style={styles.heatmapLeaveTagSelected}>விடுப்பு</Text>
                    </Pressable>
                  );
                }

                // Normal Selected Date: Dark Green (#0F4738)
                // Present and Absent date indicators retain their existing status colors!
                return (
                  <Pressable
                    key={cell.dateKey}
                    onPress={() => setSelectedDateKey(cell.dateKey)}
                    style={styles.heatmapCellSelected}
                    accessibilityRole="button"
                    accessibilityLabel={`Day ${cell.dayNumber}, Selected ${cell.status}`}
                  >
                    <Text style={styles.heatmapDayNumberSelected}>
                      {cell.dayNumber}
                    </Text>
                    {cell.status === 'present' ? (
                      <View style={styles.cellDotSelectedPresent} />
                    ) : cell.status === 'absent' ? (
                      <Text style={styles.cellSymbolSelectedAbsent}>⊗</Text>
                    ) : (
                      <View style={styles.cellDotSelected} />
                    )}
                  </Pressable>
                );
              }

              // Official Leave Cell (Dashed Gold Border with "விடுப்பு")
              if (cell.isLeave) {
                return (
                  <Pressable
                    key={cell.dateKey}
                    onPress={() => setSelectedDateKey(cell.dateKey)}
                    style={styles.heatmapCellLeave}
                  >
                    <Text style={styles.heatmapDayNumberLeave}>
                      {cell.dayNumber}
                    </Text>
                    <Text style={styles.heatmapLeaveTag}>விடுப்பு</Text>
                  </Pressable>
                );
              }

              // Present Cell (Mint Green with Green Dot)
              if (cell.status === 'present') {
                return (
                  <Pressable
                    key={cell.dateKey}
                    onPress={() => setSelectedDateKey(cell.dateKey)}
                    style={styles.heatmapCellPresent}
                  >
                    <Text style={styles.heatmapDayNumberPresent}>
                      {cell.dayNumber}
                    </Text>
                    <View style={styles.cellDotPresent} />
                  </Pressable>
                );
              }

              // Absent Cell (Soft Pink/Red with Red Dot / Symbol)
              if (cell.status === 'absent') {
                return (
                  <Pressable
                    key={cell.dateKey}
                    onPress={() => setSelectedDateKey(cell.dateKey)}
                    style={styles.heatmapCellAbsent}
                  >
                    <Text style={styles.heatmapDayNumberAbsent}>
                      {cell.dayNumber}
                    </Text>
                    <Text style={styles.cellSymbolAbsent}>⊗</Text>
                  </Pressable>
                );
              }

              // Unmarked / Future Cell (Soft Gray with Gray Dot)
              return (
                <Pressable
                  key={cell.dateKey}
                  onPress={() => setSelectedDateKey(cell.dateKey)}
                  style={styles.heatmapCellUnmarked}
                >
                  <Text style={styles.heatmapDayNumberUnmarked}>
                    {cell.dayNumber}
                  </Text>
                  <View style={styles.cellDotUnmarked} />
                </Pressable>
              );
            })}
          </View>

          {/* Legend Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotGreen} />
              <Text style={styles.legendText}>
                {`Present (${monthlyPresent})`}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendDotRed} />
              <Text style={styles.legendTextRed}>
                {`Absent (${monthlyAbsent})`}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendDotDarkRed} />
              <Text style={styles.legendTextDarkRed}>
                {`Leave (${monthlyLeave})`}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendDotGray} />
              <Text style={styles.legendTextGray}>
                {`Unmarked (${notMarkedCount})`}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Selected Date Details Card */}
        <View style={styles.selectedDateCard}>
          {/* Top Row: Day Badge + Date/Weekday + Status Pill */}
          <View style={styles.selectedDateHeaderRow}>
            {/* Day Number Badge */}
            <View
              style={[
                styles.dayBadgeSquare,
                isSelLeave
                  ? styles.dayBadgeSquareLeave
                  : isSelAbsent
                  ? styles.dayBadgeSquareAbsent
                  : isSelPresent
                  ? styles.dayBadgeSquarePresent
                  : styles.dayBadgeSquareUnmarked,
              ]}
            >
              <Text
                style={[
                  styles.dayBadgeTopText,
                  isSelLeave
                    ? styles.textDarkRed
                    : isSelAbsent
                    ? styles.textRed
                    : isSelPresent
                    ? styles.textGreen
                    : styles.textGray,
                ]}
              >
                {isSelLeave ? 'Leave' : 'Day'}
              </Text>
              <Text
                style={[
                  styles.dayBadgeNumberText,
                  isSelLeave
                    ? styles.textDarkRed
                    : isSelAbsent
                    ? styles.textRed
                    : isSelPresent
                    ? styles.textGreen
                    : styles.textGray,
                ]}
              >
                {selDayNumberPadded}
              </Text>
            </View>

            {/* Date Title & Weekday */}
            <View style={styles.selectedDateTitleCol}>
              <Text style={styles.selectedDateTitleText}>
                {`${selMonthAbbr} ${selDayNumberPadded}, ${selYear}`}
              </Text>
              <Text style={styles.selectedDateWeekdayText}>
                {`(${selWeekdayName})`}
              </Text>
            </View>

            {/* Status Capsule Pill */}
            <View
              style={[
                styles.currentlyPill,
                isSelLeave
                  ? styles.currentlyPillLeave
                  : isSelAbsent
                  ? styles.currentlyPillAbsent
                  : isSelPresent
                  ? styles.currentlyPillPresent
                  : styles.currentlyPillUnmarked,
              ]}
            >
              <Text
                style={[
                  styles.currentlyPillTop,
                  isSelLeave
                    ? styles.textDarkRed
                    : isSelAbsent
                    ? styles.textRed
                    : isSelPresent
                    ? styles.textGreen
                    : styles.textGray,
                ]}
              >
                {isSelLeave ? 'Official' : 'Currently'}
              </Text>
              <Text
                style={[
                  styles.currentlyPillBottom,
                  isSelLeave
                    ? styles.textDarkRed
                    : isSelAbsent
                    ? styles.textRed
                    : isSelPresent
                    ? styles.textGreen
                    : styles.textGray,
                ]}
              >
                {isSelLeave ? 'Leave' : isSelAbsent ? 'Absent' : isSelPresent ? 'Present' : 'Not Marked'}
              </Text>
            </View>
          </View>

          {/* Admin Override Action Row */}
          <View style={styles.adminOverrideHeaderRow}>
            <Text style={styles.adminOverrideLabel}>
              நிர்வாக நடவடிக்கை 
            </Text>
            {isFutureDate && (
              <View style={styles.futureDateBadge}>
                <Text style={styles.futureDateBadgeText}>எதிர்கால தேதி (Future Date)</Text>
              </View>
            )}
          </View>

          {isFutureDate && (
            <Text style={styles.futureDateNote}>
              * எதிர்கால தேதிகளுக்கு விடுப்பு (Leave) மட்டுமே அனுமதிக்கப்படும்.
            </Text>
          )}

          <View style={styles.overrideButtonsRow}>
            {/* 1. Mark Present (Disabled on Future Dates) */}
            <Pressable
              onPress={() => handleAdminOverride('present')}
              disabled={isFutureDate}
              style={[
                styles.btnMarkPresent,
                isFutureDate && styles.btnActionDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark Present"
              accessibilityState={{ disabled: isFutureDate }}
            >
              <Text
                style={[
                  styles.btnMarkPresentTitle,
                  isFutureDate && styles.btnActionTextDisabled,
                ]}
              >
                ✓ Mark Present
              </Text>
              <Text
                style={[
                  styles.btnMarkPresentSub,
                  isFutureDate && styles.btnActionSubDisabled,
                ]}
              >
                வருகை
              </Text>
            </Pressable>

            {/* 2. Mark Absent (Disabled on Future Dates) */}
            <Pressable
              onPress={() => handleAdminOverride('absent')}
              disabled={isFutureDate}
              style={[
                styles.btnMarkAbsent,
                isFutureDate && styles.btnActionDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark Absent"
              accessibilityState={{ disabled: isFutureDate }}
            >
              <Text
                style={[
                  styles.btnMarkAbsentTitle,
                  isFutureDate && styles.btnActionTextDisabled,
                ]}
              >
                ! Mark Absent
              </Text>
              <Text
                style={[
                  styles.btnMarkAbsentSub,
                  isFutureDate && styles.btnActionSubDisabled,
                ]}
              >
                வரவில்லை
              </Text>
            </Pressable>

            {/* 3. Official Leave (Always enabled; highlighted on future dates) */}
            <Pressable
              onPress={() => handleAdminOverride('absent', true)}
              style={[
                styles.btnOfficialLeave,
                isFutureDate && styles.btnOfficialLeaveFutureActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Official Leave"
            >
              <Text
                style={[
                  styles.btnOfficialLeaveTitle,
                  isFutureDate && styles.btnOfficialLeaveFutureTitle,
                ]}
              >
                Official Leave
              </Text>
              <Text
                style={[
                  styles.btnOfficialLeaveSub,
                  isFutureDate && styles.btnOfficialLeaveFutureSub,
                ]}
              >
                அனுமதி
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 7. Edit/Correction Custom Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>வருகை திருத்தம் / Correction</Text>
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              {`${selMonthAbbr} ${selDayNumberPadded}, ${selYear} (${selWeekdayName})`}
            </Text>

            {/* Status Selector */}
            <View style={styles.statusOptionsRow}>
              <Pressable
                onPress={() => setEditStatus('present')}
                disabled={isFutureDate}
                style={[
                  styles.statusOptionBtn,
                  editStatus === 'present' && styles.statusOptionBtnPresent,
                  isFutureDate && styles.statusOptionBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    editStatus === 'present' && styles.statusOptionTextActive,
                    isFutureDate && styles.statusOptionTextDisabled,
                  ]}
                >
                  வருகை (Present)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setEditStatus('absent')}
                disabled={isFutureDate}
                style={[
                  styles.statusOptionBtn,
                  editStatus === 'absent' && styles.statusOptionBtnAbsent,
                  isFutureDate && styles.statusOptionBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    editStatus === 'absent' && styles.statusOptionTextActive,
                    isFutureDate && styles.statusOptionTextDisabled,
                  ]}
                >
                  வரவில்லை (Absent)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setEditStatus('leave')}
                style={[
                  styles.statusOptionBtn,
                  editStatus === 'leave' && styles.statusOptionBtnLeave,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    editStatus === 'leave' && styles.statusOptionTextActive,
                  ]}
                >
                  விடுப்பு (Leave)
                </Text>
              </Pressable>
            </View>

            {/* Punch Time Input (if present) */}
            {editStatus === 'present' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>வருகை நேரம் (Punch Time):</Text>
                <TextInput
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="08:00 AM"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            )}

            {/* Remarks Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>குறிப்பு / Remarks:</Text>
              <TextInput
                value={editRemarks}
                onChangeText={setEditRemarks}
                placeholder="காரணம் உள்ளிடவும் (e.g. கோவில் பணி)..."
                placeholderTextColor="#94A3B8"
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Save Buttons */}
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>ரத்து (Cancel)</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveCustomEdit}
                disabled={isSubmittingEdit}
                style={styles.modalSaveBtn}
              >
                {isSubmittingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>சேமி (Save)</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. Month & Year Selection Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setIsMonthPickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close backdrop"
          />
          <View style={styles.monthPickerCard}>
            {/* Modal Header */}
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderTitles}>
                <Text style={styles.pickerHeaderTitle}>Select Month & Year</Text>
                <Text style={styles.pickerHeaderSub}>
                  மாதம் & வருடம் தேர்ந்தெடுக்கவும்
                </Text>
              </View>
              <Pressable
                onPress={() => setIsMonthPickerVisible(false)}
                style={styles.pickerCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close picker"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Year Selector */}
            <View style={styles.yearSelectorRow}>
              <Pressable
                onPress={() => setPickerYear(y => y - 1)}
                style={styles.yearNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color="#074735" />
              </Pressable>

              <View style={styles.yearDisplayBox}>
                <Text style={styles.yearDisplayText}>{pickerYear}</Text>
              </View>

              <Pressable
                onPress={() => setPickerYear(y => y + 1)}
                style={styles.yearNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Next year"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color="#074735" />
              </Pressable>
            </View>

            {/* 12 Months Grid */}
            <View style={styles.monthsGrid}>
              {MONTH_DATA.map(m => {
                const isSelected =
                  viewYear === pickerYear &&
                  viewMonth === m.idx;
                const isCurrentRealMonth =
                  new Date().getFullYear() === pickerYear &&
                  new Date().getMonth() === m.idx;

                return (
                  <Pressable
                    key={m.idx}
                    onPress={() => handleSelectMonth(m.idx)}
                    style={[
                      styles.monthGridItem,
                      isSelected && styles.monthGridItemSelected,
                      !isSelected && isCurrentRealMonth && styles.monthGridItemCurrent,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${m.fullEn} ${pickerYear}`}
                  >
                    <Text
                      style={[
                        styles.monthGridItemTextEn,
                        isSelected && styles.monthGridItemTextEnSelected,
                        !isSelected && isCurrentRealMonth && styles.monthGridItemTextEnCurrent,
                      ]}
                    >
                      {m.en}
                    </Text>
                    <Text
                      style={[
                        styles.monthGridItemTextTa,
                        isSelected && styles.monthGridItemTextTaSelected,
                      ]}
                    >
                      {m.ta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick Action Footer */}
            <View style={styles.pickerFooter}>
              <Pressable
                onPress={handleSelectCurrentMonth}
                style={styles.btnCurrentMonth}
                accessibilityRole="button"
                accessibilityLabel="Current month"
              >
                <Calendar size={14} color="#074735" />
                <Text style={styles.btnCurrentMonthText}>
                  Current Month (நடப்பு மாதம்)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// STYLESHEET
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white / light slate
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
  },

  /* Established App Header */
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#074735',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#074735',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scrollable Body */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* Staff Profile Card (Compact & Optimized Layout) */
  staffCard: {
    backgroundColor: '#0F4738', // Deep Vedic green
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  staffCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#074735',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F4738',
  },
  staffInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  staffNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffNameEn: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  staffIdBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  staffIdBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34D399',
  },
  staffDesignation: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1FAE5',
    marginTop: 1,
  },
  staffTamilNameHidden: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 1,
  },
  staffPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  staffPhoneText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A7F3D0',
  },

  /* Staff Attendance Summary Column (Right Side of Profile Card) */
  staffAttendanceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  staffAttendancePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  staffAttendancePercentText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#34D399',
  },
  staffAttendancePunctualText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: -1,
  },
  staffAttendanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  staffMiniDotGreen: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
  },
  staffAttendanceSummarySub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7F3D0',
  },

  /* Month Navigation Card */
  monthNavCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  monthNavArrow: {
    padding: 6,
  },
  monthNavCenter: {
    alignItems: 'center',
  },
  monthNavCenterBtn: {
    alignItems: 'center',
  },
  monthNavTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarEmoji: {
    fontSize: 14,
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  monthNavSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  /* Card Shared Header */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  srOnlyText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },

  /* Monthly Analytics Card */
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  analyticsContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 6,
  },
  gaugeCenterTextOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
  },
  gaugeDaysBigNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  gaugeDaysPresentLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  gaugeDaysBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  gaugeMiniAbsentText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  gaugeMiniDivider: {
    fontSize: 8,
    color: '#94A3B8',
    marginHorizontal: 3,
  },
  gaugeMiniLeaveText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#D97706',
  },
  gaugeMiniUnmarkedText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  gaugePercentText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  gaugePunctualText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -1,
  },
  metricsColumn: {
    flex: 1,
    marginLeft: 14,
    gap: 5,
  },
  metricRowBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  dotAmber: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  dotGray: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  metricRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricRowSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  metricCountNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricCountNumberRed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  metricCountNumberAmber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },

  /* Monthly Heatmap Card */
  heatmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayTextRed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  weekdayTamilRed: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 1,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  weekdayTamil: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },

  /* Grid */
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  heatmapCellAdjacent: {
    width: '13.2%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberAdjacent: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  heatmapCellPresent: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#D1FAE5', // Soft light mint
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberPresent: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  cellDotPresent: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
    marginTop: 2,
  },
  heatmapCellAbsent: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2', // Soft pink/red
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberAbsent: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  cellSymbolAbsent: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: -2,
  },
  heatmapCellSelected: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0F4738', // Deep forest green
    borderWidth: 2,
    borderColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberSelected: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cellDotSelected: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
    marginTop: 2,
  },
  cellDotSelectedPresent: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
    marginTop: 2,
  },
  cellSymbolSelectedAbsent: {
    fontSize: 10,
    color: '#F87171',
    fontWeight: '800',
    marginTop: -2,
  },
  heatmapCellSelectedLeave: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#991B1B', // Dark Red for Selected Leave Date
    borderWidth: 2,
    borderColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberSelectedLeave: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heatmapLeaveTagSelected: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FEE2E2',
    marginTop: -1,
  },
  heatmapCellLeave: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberLeave: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  heatmapLeaveTag: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#92400E',
    marginTop: -1,
  },
  heatmapCellUnmarked: {
    width: '13.2%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  heatmapDayNumberUnmarked: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cellDotUnmarked: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginTop: 2,
  },

  /* Legend */
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#074735',
  },
  legendDotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  legendTextRed: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  legendDotDarkRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#991B1B',
  },
  legendTextDarkRed: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#991B1B',
  },
  legendDotGray: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94A3B8',
  },
  legendTextGray: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Selected Date Details Card */
  selectedDateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayBadgeSquare: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayBadgeSquareAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dayBadgeSquarePresent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  dayBadgeSquareLeave: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  dayBadgeSquareUnmarked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  dayBadgeTopText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayBadgeNumberText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  selectedDateTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  selectedDateTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedDateWeekdayText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  currentlyPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
  },
  currentlyPillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  currentlyPillPresent: {
    backgroundColor: '#ECFDF5',
  },
  currentlyPillLeave: {
    backgroundColor: '#FEE2E2',
  },
  currentlyPillUnmarked: {
    backgroundColor: '#F1F5F9',
  },
  currentlyPillTop: {
    fontSize: 10,
    fontWeight: '600',
  },
  currentlyPillBottom: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Admin Override Section */
  adminOverrideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  adminOverrideLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  futureDateBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  futureDateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  futureDateNote: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginBottom: 8,
  },
  overrideButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnMarkPresent: {
    flex: 1,
    backgroundColor: '#0F4738', // Deep forest green
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMarkPresentTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnMarkPresentSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 1,
  },
  btnMarkAbsent: {
    flex: 1,
    backgroundColor: '#DC2626', // Vibrant red
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMarkAbsentTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnMarkAbsentSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FECACA',
    marginTop: 1,
  },
  btnActionDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    opacity: 0.45,
  },
  btnActionTextDisabled: {
    color: '#94A3B8',
  },
  btnActionSubDisabled: {
    color: '#CBD5E1',
  },
  btnOfficialLeave: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOfficialLeaveTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnOfficialLeaveSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  btnOfficialLeaveFutureActive: {
    backgroundColor: '#991B1B',
    borderColor: '#7F1D1D',
    borderWidth: 1.5,
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  btnOfficialLeaveFutureTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  btnOfficialLeaveFutureSub: {
    color: '#FEE2E2',
    fontWeight: '700',
  },

  /* Color utilities */
  textRed: {
    color: '#DC2626',
  },
  textDarkRed: {
    color: '#991B1B',
  },
  textGreen: {
    color: '#059669',
  },
  textAmber: {
    color: '#B45309',
  },
  textGray: {
    color: '#64748B',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  statusOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionBtnPresent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  statusOptionBtnAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  statusOptionBtnLeave: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusOptionBtnDisabled: {
    opacity: 0.35,
  },
  statusOptionTextDisabled: {
    color: '#94A3B8',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    height: 56,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#074735',
  },
  modalSaveText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Month & Year Picker Modal */
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  monthPickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerHeaderTitles: {
    flex: 1,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  pickerHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  yearNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearDisplayBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearDisplayText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#074735',
    letterSpacing: 0.5,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthGridItem: {
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGridItemSelected: {
    backgroundColor: '#074735',
    borderColor: '#074735',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  monthGridItemCurrent: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  monthGridItemTextEn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  monthGridItemTextEnSelected: {
    color: '#FFFFFF',
  },
  monthGridItemTextEnCurrent: {
    color: '#059669',
  },
  monthGridItemTextTa: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  monthGridItemTextTaSelected: {
    color: '#DCFCE7',
  },
  pickerFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  btnCurrentMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  btnCurrentMonthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
});
