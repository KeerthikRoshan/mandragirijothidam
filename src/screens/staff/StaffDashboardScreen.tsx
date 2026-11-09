/**
 * StaffDashboardScreen Component
 * Main Portal Home for Priests and Assistants (Mandhragiri Jothidam)
 *
 * Implements:
 * 1. Warm Vedic Greeting: "வணக்கம்", Staff Name, Designation, and Current Date.
 * 2. Prominent Daily Attendance Card with Real Swipe Gesture Control.
 * 3. Today's Assigned Events with Quick "Mark Completed" Action.
 * 4. Pending Event Completions summary & Actionable reminders.
 * 5. Quick Links to "My Attendance", "My Events", and "Leave Requests".
 * 6. Clean, calm, minimal UI tailored for priests and assistants.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import {
  getStaffAttendanceRecordForDate,
  submitSelfAttendance,
} from '../../services/attendanceService';
import {
  getEventsForStaff,
  getStaffEventCounts,
  getTodayEventsForStaff,
  markEventCompleted,
} from '../../services/eventService';
import {
  completeReminder,
  getRemindersForStaff,
} from '../../services/reminderService';
import { AttendanceSwipeControl } from '../../components/attendance/AttendanceSwipeControl';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import { StaffAttendanceRecord } from '../../types/attendance';
import { StaffAssignedEvent, StaffReminder, StaffUserProfile } from '../../types/staffPortal';
import { ScheduleBooking } from '../../types/schedule';
import { BookingDetailModal } from '../../components/common/BookingDetailModal';
import { PRIEST_MOCK_STAFF } from '../../data/priestMockData';
import {
  formatDateKey,
  formatTamilDisplayDate,
  parseDateKey,
  TAMIL_WEEKDAY_FULL,
} from '../../utils/dateUtils';
import {
  StaffDashboardScreenNavigationProp,
  StaffDashboardScreenRouteProp,
} from '../../types/navigation';

export const StaffDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffDashboardScreenNavigationProp>();
  const route = useRoute<StaffDashboardScreenRouteProp>();

  // Authenticated Staff Profile State
  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Today's attendance record
  const todayKey = formatDateKey(new Date());
  const [todayAttendance, setTodayAttendance] = useState<StaffAttendanceRecord | null>(null);

  // Event and reminder states
  const [todayEvents, setTodayEvents] = useState<StaffAssignedEvent[]>([]);
  const [eventCounts, setEventCounts] = useState({
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    pendingCompletionCount: 0,
  });
  const [reminders, setReminders] = useState<StaffReminder[]>([]);

  // Switch Staff Modal (for easy demonstration/testing across 5 staff members)
  const [isStaffSwitchModalVisible, setIsStaffSwitchModalVisible] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);

  /**
   * Load all staff dashboard data
   */
  const loadDashboardData = useCallback(async (staffIdParam?: string) => {
    try {
      let staffProfile: StaffUserProfile;
      if (staffIdParam) {
        staffProfile = await authService.setStaffSession(staffIdParam);
      } else {
        staffProfile = await authService.getCurrentStaff();
      }
      setCurrentStaff(staffProfile);

      // Load attendance, events, and reminders in parallel
      const [record, events, counts, rems] = await Promise.all([
        getStaffAttendanceRecordForDate(staffProfile.id, todayKey),
        getTodayEventsForStaff(staffProfile.id),
        getStaffEventCounts(staffProfile.id),
        getRemindersForStaff(staffProfile.id),
      ]);

      setTodayAttendance(record);
      setTodayEvents(events);
      setEventCounts(counts);
      setReminders(rems);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayKey]);

  useEffect(() => {
    setLoading(true);
    loadDashboardData(route?.params?.staffId);
  }, [route?.params?.staffId, loadDashboardData]);

  // Handle Swipe Attendance Submission
  const handleSwipeAttendance = async (status: 'present' | 'absent') => {
    if (!currentStaff) return;
    try {
      const result = await submitSelfAttendance(currentStaff.id, todayKey, status);
      if (result.success) {
        setTodayAttendance(result.record);
        Alert.alert(
          status === 'present' ? 'வருகை பதிவு செய்யப்பட்டது' : 'விடுப்பு பதிவு செய்யப்பட்டது',
          status === 'present'
            ? 'தங்களின் இன்றைய வருகை வெற்றிகரமாக பதிவு செய்யப்பட்டது.'
            : 'தங்களின் இன்றைய விடுப்பு வெற்றிகரமாக பதிவு செய்யப்பட்டது.'
        );
      } else {
        Alert.alert('அறிவிப்பு', result.message);
      }
    } catch (_e) {
      Alert.alert('பிழை', 'வருகை பதிவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    }
  };

  // Handle Event Completion
  const handleMarkEventCompleted = (event: StaffAssignedEvent) => {
    if (!currentStaff) return;

    Alert.alert(
      'நிகழ்வு நிறைவு உறுதிப்படுத்தல்',
      `"${event.titleTamil}" நிகழ்வு வெற்றிகரமாக நிறைவுற்றதா?`,
      [
        { text: 'ரத்து', style: 'cancel' },
        {
          text: 'ஆம், நிறைவுற்றது',
          style: 'default',
          onPress: async () => {
            const res = await markEventCompleted(event.id, currentStaff.id);
            if (res.success) {
              Alert.alert(
                'வெற்றி',
                'நிகழ்வு வெற்றிகரமாக நிறைவு செய்யப்பட்டது என பதிவு செய்யப்பட்டது.'
              );
              loadDashboardData(currentStaff.id);
            } else {
              Alert.alert('பிழை', res.message || 'நிகழ்வை நிறைவு செய்ய முடியவில்லை.');
            }
          },
        },
      ]
    );
  };

  // Complete reminder
  const handleCompleteReminder = async (rem: StaffReminder) => {
    if (!currentStaff) return;
    await completeReminder(rem.id, currentStaff.id);
    loadDashboardData(currentStaff.id);
  };

  // Switch to another staff member
  const handleSwitchStaff = async (staffId: string) => {
    setIsStaffSwitchModalVisible(false);
    setLoading(true);
    await authService.setStaffSession(staffId);
    loadDashboardData(staffId);
  };

  const handleEventPress = (event: StaffAssignedEvent) => {
    const booking: ScheduleBooking = {
      id: event.id,
      bookingNumber: `#BK-${event.id.replace('ev-', '').replace('today-', '')}`,
      date: event.date,
      timeSlot: event.timeSlot,
      startTime: event.startTime,
      endTime: event.endTime,
      titleTamil: event.titleTamil,
      titleEnglish: event.titleEnglish,
      clientName: event.clientName,
      clientPhone: event.clientPhone,
      locationTamil: event.locationTamil,
      locationEnglish: event.locationEnglish,
      category: event.category as any,
      categoryLabelTamil: event.categoryLabelTamil,
      status: event.status as any,
      statusLabelTamil: event.statusLabelTamil,
      notes: event.notesTamil,
      priestNameTamil: currentStaff?.nameTamil,
      priestNameEnglish: currentStaff?.nameEnglish,
      priestPhone: currentStaff?.phone,
    };
    setSelectedBooking(booking);
    setIsDetailModalVisible(true);
  };

  const todayObj = parseDateKey(todayKey);
  const weekdayTamil = TAMIL_WEEKDAY_FULL[todayObj.getDay()];
  const displayDateText = `${formatTamilDisplayDate(todayKey)} • ${weekdayTamil}`;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Header Bar with Warm Vedic Greeting */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>வணக்கம் 🙏</Text>
          <View style={styles.nameRow}>
            <Text style={styles.staffNameText} numberOfLines={1}>
              {currentStaff?.nameTamil || 'பணியாளர்'}
            </Text>
            {currentStaff?.roleBadge && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{currentStaff.roleBadge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.designationText}>
            {currentStaff?.designationTamil} ({currentStaff?.designationEnglish || 'Staff'})
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Staff Switch Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch staff profile"
            onPress={() => setIsStaffSwitchModalVisible(true)}
            style={styles.switchStaffButton}
          >
            <Users size={16} color="#074735" />
            <Text style={styles.switchStaffText}>மாற்றுக</Text>
          </Pressable>

          {/* Refresh Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh portal"
            onPress={() => {
              setRefreshing(true);
              loadDashboardData(currentStaff?.id);
            }}
            style={styles.refreshButton}
          >
            <RefreshCw size={16} color="#074735" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Today's Date Banner */}
        <View style={styles.dateBanner}>
          <Calendar size={15} color="#074735" />
          <Text style={styles.dateBannerText}>{displayDateText}</Text>
        </View>

        {/* 3. Daily Attendance Card: Interactive Swipe Control */}
        <AttendanceSwipeControl
          todayDateDisplay={formatTamilDisplayDate(todayKey)}
          staffName={currentStaff?.nameTamil || ''}
          designation={currentStaff?.designationTamil || ''}
          existingRecord={todayAttendance}
          onSwipeAttendance={handleSwipeAttendance}
          onRequestCorrection={() => {
            Alert.alert(
              'வருகை திருத்த கோரிக்கை',
              'வருகை பதிவில் ஏதேனும் தவறு இருப்பின், தலைமை நிர்வாகி சுந்தரமூர்த்தி குருக்களிடம் தெரிவிக்கவும்.'
            );
          }}
        />

        {/* 4. Compact Metrics Bar */}
        <View style={styles.metricsRow}>
          {/* Today's Events */}
          <Pressable
            onPress={() => navigation.navigate('StaffEvents', { staffId: currentStaff?.id, filter: 'today' })}
            style={[styles.metricCard, styles.metricCardGreen]}
          >
            <Text style={styles.metricNumber}>{eventCounts.todayCount}</Text>
            <Text style={styles.metricLabel}>இன்றைய நிகழ்வுகள்</Text>
            <Text style={styles.metricSub}>Today's Events</Text>
          </Pressable>

          {/* Pending Completions */}
          <Pressable
            onPress={() => navigation.navigate('StaffEvents', { staffId: currentStaff?.id, filter: 'today' })}
            style={[styles.metricCard, styles.metricCardAmber]}
          >
            <Text style={[styles.metricNumber, { color: '#B45309' }]}>
              {eventCounts.pendingCompletionCount}
            </Text>
            <Text style={styles.metricLabel}>நிறைவு நிலுவை</Text>
            <Text style={styles.metricSub}>To Complete</Text>
          </Pressable>

          {/* Upcoming Reminders */}
          <Pressable
            onPress={() => navigation.navigate('StaffReminders', { staffId: currentStaff?.id })}
            style={[styles.metricCard, styles.metricCardGold]}
          >
            <Text style={[styles.metricNumber, { color: '#936319' }]}>
              {reminders.filter(r => r.status === 'pending').length}
            </Text>
            <Text style={styles.metricLabel}>நினைவூட்டல்</Text>
            <Text style={styles.metricSub}>Reminders</Text>
          </Pressable>
        </View>

        {/* 5. Today's Assigned Events Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionPill} />
            <Text style={styles.sectionTitle}>இன்றைய பணிக்கான நிகழ்வுகள்</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('StaffEvents', { staffId: currentStaff?.id })}
          >
            <Text style={styles.sectionLink}>அனைத்தும் காண்க ›</Text>
          </Pressable>
        </View>

        {todayEvents.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Sparkles size={32} color="#C6A15B" />
            <Text style={styles.emptyStateTitle}>இன்று நிகழ்வுகள் எதுவும் இல்லை</Text>
            <Text style={styles.emptyStateSub}>
              இன்றைய தினத்திற்கு தங்களுக்கு புதிய பூஜைகள் அல்லது நிகழ்வுகள் ஒதுக்கப்படவில்லை.
            </Text>
          </View>
        ) : (
          todayEvents.map(event => {
            const isCompleted = event.status === 'completed';

            return (
              <Pressable
                key={event.id}
                onPress={() => handleEventPress(event)}
                style={[styles.eventCard, isCompleted && styles.eventCardCompleted]}
              >
                {/* Event Top Row: Category & Time */}
                <View style={styles.eventTopRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{event.categoryLabelTamil}</Text>
                  </View>
                  <View style={styles.timePill}>
                    <Clock size={12} color="#074735" />
                    <Text style={styles.timePillText}>{event.timeSlot}</Text>
                  </View>
                </View>

                {/* Event Title */}
                <Text style={styles.eventTitle}>{event.titleTamil}</Text>

                {/* Client & Location info */}
                <View style={styles.eventInfoRow}>
                  <User size={13} color="#5F7068" />
                  <Text style={styles.eventInfoText}>{event.clientName}</Text>
                </View>

                <View style={styles.eventInfoRow}>
                  <MapPin size={13} color="#5F7068" />
                  <Text style={styles.eventInfoText} numberOfLines={1}>
                    {event.locationTamil}
                  </Text>
                </View>

                {/* Bottom Action Row */}
                <View style={styles.eventActionRow}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={14} color="#145C43" />
                      <Text style={styles.completedBadgeText}>நிறைவடைந்தது (Completed)</Text>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${event.titleTamil} completed`}
                      onPress={() => handleMarkEventCompleted(event)}
                      style={styles.markCompletedButton}
                    >
                      <Check size={14} color="#FAF9F5" />
                      <Text style={styles.markCompletedText}>நிறைவு செய்தேன் (Mark Completed)</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })
        )}

        {/* 6. Actionable Reminders Section */}
        {reminders.filter(r => r.status === 'pending').length > 0 && (
          <View style={styles.remindersSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Bell size={16} color="#074735" />
                <Text style={styles.sectionTitle}>இன்றைய நினைவூட்டல்கள்</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('StaffReminders', { staffId: currentStaff?.id })}
              >
                <Text style={styles.sectionLink}>அனைத்தும் ›</Text>
              </Pressable>
            </View>

            {reminders
              .filter(r => r.status === 'pending')
              .slice(0, 2)
              .map(rem => (
                <View key={rem.id} style={styles.reminderCard}>
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderTitle}>{rem.titleTamil}</Text>
                    <Text style={styles.reminderDesc} numberOfLines={2}>
                      {rem.descriptionTamil}
                    </Text>
                    <View style={styles.reminderMetaRow}>
                      <Clock size={11} color="#667085" />
                      <Text style={styles.reminderTimeText}>{rem.time}</Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark reminder done"
                    onPress={() => handleCompleteReminder(rem)}
                    style={styles.reminderDoneButton}
                  >
                    <Check size={16} color="#145C43" />
                  </Pressable>
                </View>
              ))}
          </View>
        )}

        {/* 7. Quick Navigation Cards */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.quickLinksHeading}>விரைவு இணைப்புகள் (Quick Links)</Text>

          <View style={styles.quickLinksGrid}>
            {/* Link 1: My Attendance */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View My Attendance"
              onPress={() => navigation.navigate('StaffAttendance', { staffId: currentStaff?.id })}
              style={styles.quickLinkCard}
            >
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#E8F3EB' }]}>
                <CalendarCheck size={20} color="#145C43" />
              </View>
              <View style={styles.quickLinkInfo}>
                <Text style={styles.quickLinkTitle}>எனது வருகை வரலாறு</Text>
                <Text style={styles.quickLinkSubtitle}>மாதாந்திர வருகை & விடுப்பு விவரம்</Text>
              </View>
              <ChevronRight size={16} color="#98A2B3" />
            </Pressable>

            {/* Link 2: Leave Application */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply for Leave"
              onPress={() => navigation.navigate('StaffLeaves', { staffId: currentStaff?.id })}
              style={styles.quickLinkCard}
            >
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#FEF3F2' }]}>
                <FileText size={20} color="#B42318" />
              </View>
              <View style={styles.quickLinkInfo}>
                <Text style={styles.quickLinkTitle}>விடுப்பு விண்ணப்பங்கள்</Text>
                <Text style={styles.quickLinkSubtitle}>புதிய விடுப்பு பதிவு & ஒப்புதல் நிலை</Text>
              </View>
              <ChevronRight size={16} color="#98A2B3" />
            </Pressable>

            {/* Link 3: All Assigned Events */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View All Assigned Events"
              onPress={() => navigation.navigate('StaffEvents', { staffId: currentStaff?.id })}
              style={styles.quickLinkCard}
            >
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#FDFBF7' }]}>
                <Calendar size={20} color="#936319" />
              </View>
              <View style={styles.quickLinkInfo}>
                <Text style={styles.quickLinkTitle}>ஒதுக்கப்பட்ட அனைத்து நிகழ்வுகள்</Text>
                <Text style={styles.quickLinkSubtitle}>அடுத்து வரும் பூஜைகள் மற்றும் நிறைவுற்றவை</Text>
              </View>
              <ChevronRight size={16} color="#98A2B3" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 8. Staff Switch Modal */}
      <Modal
        visible={isStaffSwitchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStaffSwitchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <Text style={styles.modalTitle}>பணியாளர் கணக்கு தேர்வு</Text>
            <Text style={styles.modalSubtitle}>
              Select staff account to view specific portal & attendance
            </Text>

            <View style={styles.staffListContainer}>
              {PRIEST_MOCK_STAFF.map(staff => {
                const isSelected = staff.id === currentStaff?.id;
                return (
                  <Pressable
                    key={staff.id}
                    onPress={() => handleSwitchStaff(staff.id)}
                    style={[
                      styles.staffSelectItem,
                      isSelected && styles.staffSelectItemActive,
                    ]}
                  >
                    <View style={styles.staffSelectDetails}>
                      <Text style={styles.staffSelectNameEn}>{staff.nameEnglish}</Text>
                      <Text style={styles.staffSelectNameTa}>{staff.nameTamil}</Text>
                      <Text style={styles.staffSelectDes}>
                        {staff.designationTamil} ({staff.designationEnglish})
                      </Text>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color="#145C43" />}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setIsStaffSwitchModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>மூடுக (Close)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Shared Pooja Details Modal */}
      <BookingDetailModal
        visible={isDetailModalVisible}
        booking={selectedBooking}
        onClose={() => setIsDetailModalVisible(false)}
      />

      {/* 9. Bottom Navigation */}
      <StaffBottomNav activeTab="home" staffId={currentStaff?.id} />
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
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD1',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#074735',
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  staffNameText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2D25',
  },
  roleBadge: {
    backgroundColor: '#FBF5E8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E7D5AA',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#936319',
  },
  designationText: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3EB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  switchStaffText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#074735',
  },
  refreshButton: {
    width: 34,
    height: 34,
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

  /* Date Banner */
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    marginBottom: 14,
  },
  dateBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#074735',
  },

  /* Metrics Bar */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  metricCardGreen: {
    backgroundColor: '#F3FAF5',
    borderColor: '#C3E4CD',
  },
  metricCardAmber: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  metricCardGold: {
    backgroundColor: '#FDFBF7',
    borderColor: '#E7D5AA',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#145C43',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2D25',
  },
  metricSub: {
    fontSize: 9.5,
    color: '#5F7068',
    marginTop: 1,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionPill: {
    width: 3,
    height: 14,
    backgroundColor: '#074735',
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1B2D25',
  },
  sectionLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
  },

  /* Event Cards */
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DDD1',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2D25',
    marginTop: 8,
  },
  emptyStateSub: {
    fontSize: 11.5,
    color: '#5F7068',
    textAlign: 'center',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  eventCardCompleted: {
    backgroundColor: '#F9FBF9',
    borderColor: '#C3E4CD',
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: '#F4EFEA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#074735',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#074735',
  },
  eventTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2D25',
    marginBottom: 6,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  eventInfoText: {
    fontSize: 11.5,
    color: '#475467',
  },
  eventActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
  },
  markCompletedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#074735',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  markCompletedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FAF9F5',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  completedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#145C43',
  },

  /* Reminders */
  remindersSection: {
    marginBottom: 16,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2D25',
  },
  reminderDesc: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
  },
  reminderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reminderTimeText: {
    fontSize: 10.5,
    color: '#667085',
    fontWeight: '600',
  },
  reminderDoneButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  /* Quick Links */
  quickLinksSection: {
    marginBottom: 16,
  },
  quickLinksHeading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2D25',
    marginBottom: 10,
  },
  quickLinksGrid: {
    gap: 8,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  quickLinkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkInfo: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2D25',
  },
  quickLinkSubtitle: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
  },

  /* Staff Select Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
    marginBottom: 14,
  },
  staffListContainer: {
    gap: 8,
    marginBottom: 14,
  },
  staffSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    backgroundColor: '#FAF9F5',
  },
  staffSelectItemActive: {
    backgroundColor: '#E8F3EB',
    borderColor: '#145C43',
  },
  staffSelectDetails: {
    flex: 1,
  },
  staffSelectNameEn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2D25',
  },
  staffSelectNameTa: {
    fontSize: 11.5,
    color: '#074735',
  },
  staffSelectDes: {
    fontSize: 10.5,
    color: '#5F7068',
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F4EFEA',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475467',
  },
});
