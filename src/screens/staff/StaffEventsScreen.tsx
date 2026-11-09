/**
 * StaffEventsScreen Component
 * Dedicated Assigned Events & Completion Management for Priests and Assistants
 *
 * Implements:
 * 1. Filter Tabs: Today, Upcoming, Completed.
 * 2. Real data from eventService (connecting with Admin bookings).
 * 3. Event completion workflow with confirmation, optional completion note,
 *    and instant state refresh.
 * 4. Strict isolation: Only shows events assigned to the authenticated staff member.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  User,
  X,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import {
  getEventsForStaff,
  markEventCompleted,
} from '../../services/eventService';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import { StaffAssignedEvent, StaffUserProfile } from '../../types/staffPortal';
import { ScheduleBooking } from '../../types/schedule';
import { BookingDetailModal } from '../../components/common/BookingDetailModal';
import { getBookingDateTimes } from '../../utils/bookingRules';
import { formatDateKey, formatTamilDisplayDate } from '../../utils/dateUtils';
import {
  StaffEventsScreenNavigationProp,
  StaffEventsScreenRouteProp,
} from '../../types/navigation';

type EventTab = 'today' | 'upcoming' | 'completed';

export const StaffEventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffEventsScreenNavigationProp>();
  const route = useRoute<StaffEventsScreenRouteProp>();

  const initialFilter = route?.params?.filter || 'today';
  const [activeTab, setActiveTab] = useState<EventTab>(initialFilter);
  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);
  const [events, setEvents] = useState<StaffAssignedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Completion modal state
  const [completingEvent, setCompletingEvent] = useState<StaffAssignedEvent | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState<boolean>(false);

  // Detail view modal state
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);

  const todayKey = formatDateKey(new Date());

  const loadEvents = useCallback(async (staffIdParam?: string) => {
    try {
      let staff: StaffUserProfile;
      if (staffIdParam) {
        staff = await authService.setStaffSession(staffIdParam);
      } else {
        staff = await authService.getCurrentStaff();
      }
      setCurrentStaff(staff);

      const staffEvents = await getEventsForStaff(staff.id);
      setEvents(staffEvents);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEvents(route?.params?.staffId);
  }, [route?.params?.staffId, loadEvents]);

  const eventToBooking = useCallback(
    (event: StaffAssignedEvent): ScheduleBooking => {
      return {
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
      };
    },
    [currentStaff]
  );

  // Tab Filtering
  const filteredEvents = useMemo(() => {
    const nowMs = Date.now();
    const list = events.filter(event => {
      const b = eventToBooking(event);
      const { startDateTime, endDateTime } = getBookingDateTimes(b);
      const startMs = startDateTime.getTime();
      const endMs = endDateTime.getTime();
      const status = (event.status || '').toLowerCase();

      if (activeTab === 'today') {
        return event.date === todayKey;
      }
      if (activeTab === 'upcoming') {
        return nowMs < startMs && status !== 'completed' && status !== 'cancelled';
      }
      if (activeTab === 'completed') {
        return (nowMs >= endMs || status === 'completed') && status !== 'cancelled';
      }
      return true;
    });

    if (activeTab === 'completed') {
      list.sort((a, b) => {
        const timeA = getBookingDateTimes(eventToBooking(a)).endDateTime.getTime();
        const timeB = getBookingDateTimes(eventToBooking(b)).endDateTime.getTime();
        return timeB - timeA;
      });
    } else {
      list.sort((a, b) => {
        const timeA = getBookingDateTimes(eventToBooking(a)).startDateTime.getTime();
        const timeB = getBookingDateTimes(eventToBooking(b)).startDateTime.getTime();
        return timeA - timeB;
      });
    }
    return list;
  }, [events, activeTab, todayKey, eventToBooking]);

  // Tab Counts
  const counts = useMemo(() => {
    const nowMs = Date.now();
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    events.forEach(event => {
      const b = eventToBooking(event);
      const { startDateTime, endDateTime } = getBookingDateTimes(b);
      const startMs = startDateTime.getTime();
      const endMs = endDateTime.getTime();
      const status = (event.status || '').toLowerCase();

      if (event.date === todayKey) {
        todayCount++;
      }
      if (nowMs < startMs && status !== 'completed' && status !== 'cancelled') {
        upcomingCount++;
      }
      if ((nowMs >= endMs || status === 'completed') && status !== 'cancelled') {
        completedCount++;
      }
    });

    return {
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
    };
  }, [events, todayKey, eventToBooking]);

  const handleEventPress = (event: StaffAssignedEvent) => {
    setSelectedBooking(eventToBooking(event));
    setIsDetailModalVisible(true);
  };

  // Completion Handlers
  const handleOpenCompleteModal = (event: StaffAssignedEvent) => {
    setCompletingEvent(event);
    setCompletionNotes('');
  };

  const handleConfirmCompletion = async () => {
    if (!completingEvent || !currentStaff) return;
    setIsSubmittingCompletion(true);
    try {
      const res = await markEventCompleted(
        completingEvent.id,
        currentStaff.id,
        completionNotes
      );
      if (res.success) {
        Alert.alert(
          'வெற்றி',
          `"${completingEvent.titleTamil}" நிகழ்வு நிறைவடைந்ததாக பதிவு செய்யப்பட்டது.`
        );
        setCompletingEvent(null);
        loadEvents(currentStaff.id);
      } else {
        Alert.alert('பிழை', res.message || 'நிறைவு செய்ய இயலவில்லை.');
      }
    } catch (_e) {
      Alert.alert('பிழை', 'நிகழ்வை நிறைவு செய்ய இயலவில்லை.');
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

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
            எனது நிகழ்வுகள் (My Events)
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentStaff?.nameTamil} • {currentStaff?.designationTamil}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh events"
          onPress={() => {
            setRefreshing(true);
            loadEvents(currentStaff?.id);
          }}
          style={styles.refreshButton}
        >
          <RefreshCw size={16} color="#074735" />
        </Pressable>
      </View>

      {/* 2. Filter Tabs */}
      <View style={styles.tabsContainer}>
        {/* Today */}
        <Pressable
          onPress={() => setActiveTab('today')}
          style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'today' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'today' && styles.tabButtonTextActive]}>
            இன்று (Today)
          </Text>
          <View style={[styles.tabBadge, activeTab === 'today' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'today' && styles.tabBadgeTextActive]}>
              {counts.today}
            </Text>
          </View>
        </Pressable>

        {/* Upcoming */}
        <Pressable
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'upcoming' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'upcoming' && styles.tabButtonTextActive]}>
            அடுத்து (Upcoming)
          </Text>
          <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
              {counts.upcoming}
            </Text>
          </View>
        </Pressable>

        {/* Completed */}
        <Pressable
          onPress={() => setActiveTab('completed')}
          style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'completed' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'completed' && styles.tabButtonTextActive]}>
            நிறைவு (Done)
          </Text>
          <View style={[styles.tabBadge, activeTab === 'completed' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'completed' && styles.tabBadgeTextActive]}>
              {counts.completed}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* 3. Event List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#074735" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles size={36} color="#98A2B3" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'today'
                ? 'இன்று நிகழ்வுகள் எதுவும் இல்லை'
                : activeTab === 'upcoming'
                ? 'அடுத்து வரும் நிகழ்வுகள் எதுவும் இல்லை'
                : 'நிறைவுற்ற நிகழ்வுகள் எதுவும் இல்லை'}
            </Text>
            <Text style={styles.emptySubtitle}>
              தங்களுக்கு புதிய நிகழ்வுகள் ஒதுக்கப்பட்டதும் இங்கே தோன்றும்.
            </Text>
          </View>
        ) : (
          filteredEvents.map(event => {
            const isCompleted = event.status === 'completed';

            return (
              <Pressable
                key={event.id}
                onPress={() => handleEventPress(event)}
                style={[
                  styles.eventCard,
                  isCompleted && styles.eventCardCompleted,
                ]}
              >
                {/* Header row: Category & Date/Time */}
                <View style={styles.eventCardTop}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{event.categoryLabelTamil}</Text>
                  </View>
                  <View style={styles.dateBadge}>
                    <Calendar size={11} color="#074735" />
                    <Text style={styles.dateBadgeText}>
                      {formatTamilDisplayDate(event.date)}
                    </Text>
                  </View>
                </View>

                {/* Event Title */}
                <Text style={styles.eventTitle}>{event.titleTamil}</Text>
                {event.titleEnglish && (
                  <Text style={styles.eventSubtitleEn}>{event.titleEnglish}</Text>
                )}

                {/* Time Slot */}
                <View style={styles.infoRow}>
                  <Clock size={13} color="#074735" />
                  <Text style={styles.timeSlotText}>{event.timeSlot}</Text>
                </View>

                {/* Client Reference */}
                <View style={styles.infoRow}>
                  <User size={13} color="#5F7068" />
                  <Text style={styles.infoText}>
                    பக்தர்: {event.clientName} ({event.clientPhone})
                  </Text>
                </View>

                {/* Location */}
                <View style={styles.infoRow}>
                  <MapPin size={13} color="#5F7068" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {event.locationTamil}
                  </Text>
                </View>

                {/* Optional Notes */}
                {event.notesTamil && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>குறிப்பு: {event.notesTamil}</Text>
                  </View>
                )}

                {/* Footer Action / Status */}
                <View style={styles.eventCardFooter}>
                  {isCompleted ? (
                    <View style={styles.completedStatusRow}>
                      <CheckCircle2 size={16} color="#145C43" />
                      <Text style={styles.completedStatusText}>
                        நிறைவடைந்தது (Completed)
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark event completed"
                      onPress={() => handleOpenCompleteModal(event)}
                      style={styles.markCompleteButton}
                    >
                      <Check size={14} color="#FAF9F5" />
                      <Text style={styles.markCompleteButtonText}>
                        நிறைவு செய்தேன் (Mark Completed)
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* 4. Event Completion Modal with optional note */}
      <Modal
        visible={!!completingEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletingEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>நிகழ்வு நிறைவு பதிவு</Text>
                <Text style={styles.modalSub}>{completingEvent?.titleTamil}</Text>
              </View>
              <Pressable
                onPress={() => setCompletingEvent(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#5F7068" />
              </Pressable>
            </View>

            <Text style={styles.modalPromptText}>
              இந்த நிகழ்வு வெற்றிகரமாக நிறைவு பெற்றதை உறுதி செய்யவும்.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                நிறைவு குறிப்புகள் / Feedback (விருப்பத்திற்குரியது):
              </Text>
              <TextInput
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="எ.கா: பூஜை சிறப்பாக நிறைவுற்றது, பிரசாதம் வழங்கப்பட்டது"
                placeholderTextColor="#98A2B3"
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCompletingEvent(null)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>ரத்து (Cancel)</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmCompletion}
                disabled={isSubmittingCompletion}
                style={styles.modalConfirmButton}
              >
                {isSubmittingCompletion ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>உறுதிப்படுத்துக (Confirm)</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shared Pooja Details Modal */}
      <BookingDetailModal
        visible={isDetailModalVisible}
        booking={selectedBooking}
        onClose={() => setIsDetailModalVisible(false)}
      />

      {/* 5. Bottom Navigation */}
      <StaffBottomNav activeTab="events" staffId={currentStaff?.id} />
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

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#074735',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5F7068',
  },
  tabButtonTextActive: {
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
    fontSize: 10,
    fontWeight: '700',
    color: '#5F7068',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* List Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DDD1',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2D25',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#5F7068',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Event Cards */
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardCompleted: {
    backgroundColor: '#F9FBF9',
    borderColor: '#C3E4CD',
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#F4EFEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#074735',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#074735',
  },
  eventTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2D25',
  },
  eventSubtitleEn: {
    fontSize: 11.5,
    color: '#5F7068',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
  infoText: {
    fontSize: 11.5,
    color: '#475467',
  },
  notesBox: {
    backgroundColor: '#FAF9F5',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EFEAE0',
  },
  notesText: {
    fontSize: 11,
    color: '#5F7068',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
  },
  markCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#074735',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  markCompleteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FAF9F5',
  },
  completedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#145C43',
  },

  /* Modal */
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
    paddingBottom: 10,
  },
  modalTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  modalSub: {
    fontSize: 12,
    color: '#5F7068',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalPromptText: {
    fontSize: 12.5,
    color: '#344054',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    padding: 10,
    fontSize: 12.5,
    backgroundColor: '#FAF9F5',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  modalConfirmButton: {
    backgroundColor: '#074735',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FAF9F5',
  },
});
