/**
 * StaffRemindersScreen Component
 * Reminders & Task Checklist for Priests and Assistants
 *
 * Implements:
 * 1. Categorized Reminders: Today, Upcoming, Completed.
 * 2. Links to associated events.
 * 3. Quick complete actions.
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
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import {
  completeReminder,
  getRemindersForStaff,
} from '../../services/reminderService';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import { StaffReminder, StaffUserProfile } from '../../types/staffPortal';
import { formatDateKey, formatTamilDisplayDate } from '../../utils/dateUtils';
import {
  StaffRemindersScreenNavigationProp,
  StaffRemindersScreenRouteProp,
} from '../../types/navigation';

type ReminderTab = 'today' | 'upcoming' | 'completed';

export const StaffRemindersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffRemindersScreenNavigationProp>();
  const route = useRoute<StaffRemindersScreenRouteProp>();

  const [activeTab, setActiveTab] = useState<ReminderTab>('today');
  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);
  const [reminders, setReminders] = useState<StaffReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const todayKey = formatDateKey(new Date());

  const loadReminders = useCallback(async (staffIdParam?: string) => {
    try {
      let staff: StaffUserProfile;
      if (staffIdParam) {
        staff = await authService.setStaffSession(staffIdParam);
      } else {
        staff = await authService.getCurrentStaff();
      }
      setCurrentStaff(staff);

      const rems = await getRemindersForStaff(staff.id);
      setReminders(rems);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadReminders(route?.params?.staffId);
  }, [route?.params?.staffId, loadReminders]);

  const filteredReminders = useMemo(() => {
    return reminders.filter(r => {
      if (activeTab === 'today') {
        return r.date === todayKey && r.status !== 'completed';
      }
      if (activeTab === 'upcoming') {
        return r.date > todayKey && r.status !== 'completed';
      }
      if (activeTab === 'completed') {
        return r.status === 'completed';
      }
      return true;
    });
  }, [reminders, activeTab, todayKey]);

  const counts = useMemo(() => {
    return {
      today: reminders.filter(r => r.date === todayKey && r.status !== 'completed').length,
      upcoming: reminders.filter(r => r.date > todayKey && r.status !== 'completed').length,
      completed: reminders.filter(r => r.status === 'completed').length,
    };
  }, [reminders, todayKey]);

  const handleMarkDone = async (rem: StaffReminder) => {
    if (!currentStaff) return;
    const res = await completeReminder(rem.id, currentStaff.id);
    if (res.success) {
      Alert.alert('வெற்றி', 'நினைவூட்டல் நிறைவு செய்யப்பட்டது.');
      loadReminders(currentStaff.id);
    }
  };

  const handleOpenLinkedEvent = (_eventId?: string) => {
    if (!currentStaff) return;
    navigation.navigate('StaffEvents', { staffId: currentStaff.id });
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
            நினைவூட்டல்கள் (Reminders)
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentStaff?.nameTamil} • {currentStaff?.designationTamil}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh reminders"
          onPress={() => {
            setRefreshing(true);
            loadReminders(currentStaff?.id);
          }}
          style={styles.refreshButton}
        >
          <RefreshCw size={16} color="#074735" />
        </Pressable>
      </View>

      {/* 2. Tabs */}
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

      {/* 3. List */}
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
        ) : filteredReminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={36} color="#98A2B3" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'today'
                ? 'இன்றைய நினைவூட்டல்கள் எதுவும் இல்லை'
                : activeTab === 'upcoming'
                ? 'அடுத்து வரும் நினைவூட்டல்கள் எதுவும் இல்லை'
                : 'நிறைவுற்ற நினைவூட்டல்கள் எதுவும் இல்லை'}
            </Text>
            <Text style={styles.emptySubtitle}>
              ஒதுக்கப்பட்ட நிகழ்வுகள் மற்றும் பூஜைகளுக்கான நினைவூட்டல்கள் இங்கே தோன்றும்.
            </Text>
          </View>
        ) : (
          filteredReminders.map(rem => {
            const isCompleted = rem.status === 'completed';

            return (
              <View
                key={rem.id}
                style={[styles.remCard, isCompleted && styles.remCardCompleted]}
              >
                <View style={styles.remTopRow}>
                  <View style={styles.remDateBadge}>
                    <Calendar size={11} color="#074735" />
                    <Text style={styles.remDateText}>
                      {formatTamilDisplayDate(rem.date)}
                    </Text>
                  </View>

                  <View style={styles.remTimeBadge}>
                    <Clock size={11} color="#667085" />
                    <Text style={styles.remTimeText}>{rem.time}</Text>
                  </View>
                </View>

                <Text style={styles.remTitle}>{rem.titleTamil}</Text>
                <Text style={styles.remDesc}>{rem.descriptionTamil}</Text>

                <View style={styles.remFooterRow}>
                  {rem.eventId ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View linked event"
                      onPress={() => handleOpenLinkedEvent(rem.eventId)}
                      style={styles.linkedEventButton}
                    >
                      <ExternalLink size={12} color="#074735" />
                      <Text style={styles.linkedEventText}>
                        தொடர்புடைய பூஜை / நிகழ்வு ›
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}

                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={14} color="#145C43" />
                      <Text style={styles.completedBadgeText}>நிறைவுற்றது</Text>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark reminder completed"
                      onPress={() => handleMarkDone(rem)}
                      style={styles.markDoneBtn}
                    >
                      <Check size={13} color="#FFFFFF" />
                      <Text style={styles.markDoneText}>நிறைவு</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 4. Bottom Navigation */}
      <StaffBottomNav activeTab="reminders" staffId={currentStaff?.id} />
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

  /* List */
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

  /* Reminder Cards */
  remCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  remCardCompleted: {
    backgroundColor: '#F9FBF9',
    borderColor: '#C3E4CD',
  },
  remTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  remDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#074735',
  },
  remTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remTimeText: {
    fontSize: 11,
    color: '#667085',
  },
  remTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1B2D25',
    marginBottom: 4,
  },
  remDesc: {
    fontSize: 12,
    color: '#475467',
    lineHeight: 18,
  },
  remFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
  },
  linkedEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedEventText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#074735',
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#074735',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FAF9F5',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#145C43',
  },
});
