/**
 * AdminLeaveManagementScreen Component (பணியாளர் விடுப்பு மேலாண்மை)
 * Administrative Approval & Management of Staff Leave Requests
 *
 * Implements:
 * 1. Overview of all staff leave requests across Priests & Assistants.
 * 2. Full Bilingual Support (Tamil & English) switching seamlessly with app language.
 * 3. Status Filters: Pending, Approved, Rejected, All with live badges.
 * 4. Standardized app header matching ScheduleHeader, PriestHeader & SettingsHeader.
 * 5. Approve and Reject actions with optional admin response/reason.
 * 6. Audit stamp recording the deciding Admin account and timestamp.
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
import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  User,
  X,
  XCircle,
} from 'lucide-react-native';
import {
  decideLeaveRequest,
  getAllStaffLeaves,
} from '../../services/leaveService';
import { LeaveRequest, LeaveStatus } from '../../types/staffPortal';
import { calculateDaysBetween, formatDisplayDate } from '../../utils/dateUtils';
import { AdminLeaveManagementScreenNavigationProp } from '../../types/navigation';
import { useTranslation } from 'react-i18next';

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

export const AdminLeaveManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AdminLeaveManagementScreenNavigationProp>();
  const { t, i18n } = useTranslation();

  const isTamil = (i18n.language || 'ta').startsWith('ta');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Decision Modal State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approved' | 'rejected'>('approved');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadLeaves = useCallback(async () => {
    try {
      const allLeaves = await getAllStaffLeaves();
      setLeaves(allLeaves);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadLeaves();
  }, [loadLeaves]);

  // Tab Filtering
  const filteredLeaves = useMemo(() => {
    if (activeTab === 'all') return leaves;
    return leaves.filter(l => l.status === activeTab);
  }, [leaves, activeTab]);

  const counts = useMemo(() => {
    return {
      all: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
    };
  }, [leaves]);

  const handleOpenDecision = (leave: LeaveRequest, action: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setDecisionAction(action);
    setAdminRemarks('');
  };

  const handleConfirmDecision = async () => {
    if (!selectedLeave) return;

    setIsSubmitting(true);
    try {
      const result = await decideLeaveRequest(
        selectedLeave.id,
        decisionAction,
        'Chief Administrator',
        adminRemarks.trim() || undefined
      );

      if (result.success) {
        Alert.alert(
          decisionAction === 'approved'
            ? t('adminLeaves.confirmApprove', 'விடுப்பு ஒப்புதல் அளிக்கப்பட்டது')
            : t('adminLeaves.confirmReject', 'விடுப்பு நிராகரிக்கப்பட்டது'),
          decisionAction === 'approved'
            ? t('adminLeaves.approvedSuccess', 'பணியாளரின் விடுப்பு விண்ணப்பம் ஒப்புதல் அளிக்கப்பட்டது.')
            : t('adminLeaves.rejectedSuccess', 'பணியாளரின் விடுப்பு விண்ணப்பம் நிராகரிக்கப்பட்டது.')
        );
        setSelectedLeave(null);
        loadLeaves();
      } else {
        Alert.alert(
          t('leaves.alerts.errorTitle', 'பிழை'),
          result.error || 'முடிவை பதிவு செய்ய இயலவில்லை.'
        );
      }
    } catch (_e) {
      Alert.alert(
        t('leaves.alerts.errorTitle', 'பிழை'),
        'முடிவை பதிவு செய்ய இயலவில்லை.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Header Bar matching ScheduleHeader, PriestHeader & SettingsHeader standard */}
      <View style={styles.headerContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack', 'Go back')}
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.tamilTitle} numberOfLines={1}>
            {t('adminLeaves.title', 'பணியாளர் விடுப்பு மேலாண்மை')}
          </Text>
          <Text style={styles.englishSubtitle} numberOfLines={1}>
            {t('adminLeaves.subtitle', 'Staff Leave Requests • Administration')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('adminLeaves.refreshLabel', 'Refresh leave list')}
          onPress={() => {
            setRefreshing(true);
            loadLeaves();
          }}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RefreshCw
            size={18}
            color="#074735"
            style={refreshing ? styles.refreshSpinning : undefined}
          />
        </Pressable>
      </View>

      {/* 2. Tabs */}
      <View style={styles.tabsContainer}>
        {/* Pending */}
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActiveAmber]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'pending' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.tabButtonTextActive]}>
            {t('adminLeaves.tabs.pending', 'நிலுவை (Pending)')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActiveAmber]}>
            <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
              {counts.pending}
            </Text>
          </View>
        </Pressable>

        {/* Approved */}
        <Pressable
          onPress={() => setActiveTab('approved')}
          style={[styles.tabButton, activeTab === 'approved' && styles.tabButtonActiveGreen]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'approved' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'approved' && styles.tabButtonTextActive]}>
            {t('adminLeaves.tabs.approved', 'அங்கீகரித்தவை')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'approved' && styles.tabBadgeActiveGreen]}>
            <Text style={[styles.tabBadgeText, activeTab === 'approved' && styles.tabBadgeTextActive]}>
              {counts.approved}
            </Text>
          </View>
        </Pressable>

        {/* Rejected */}
        <Pressable
          onPress={() => setActiveTab('rejected')}
          style={[styles.tabButton, activeTab === 'rejected' && styles.tabButtonActiveRed]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'rejected' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'rejected' && styles.tabButtonTextActive]}>
            {t('adminLeaves.tabs.rejected', 'நிராகரித்தவை')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'rejected' && styles.tabBadgeActiveRed]}>
            <Text style={[styles.tabBadgeText, activeTab === 'rejected' && styles.tabBadgeTextActive]}>
              {counts.rejected}
            </Text>
          </View>
        </Pressable>

        {/* All */}
        <Pressable
          onPress={() => setActiveTab('all')}
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
            {t('adminLeaves.tabs.all', 'அனைத்தும்')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'all' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'all' && styles.tabBadgeTextActive]}>
              {counts.all}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* 3. List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#074735" />
          </View>
        ) : filteredLeaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FileText size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>
              {t('adminLeaves.empty', 'விண்ணப்பங்கள் எதுவும் இல்லை')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('adminLeaves.emptySub', 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் விடுப்பு விண்ணப்பங்கள் எதுவும் காணப்படவில்லை.')}
            </Text>
          </View>
        ) : (
          filteredLeaves.map(leave => {
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isRejected = leave.status === 'rejected';

            const durationDays = calculateDaysBetween(
              leave.startDate,
              leave.endDate
            );

            const formattedStartDate = formatDisplayDate(
              leave.startDate,
              isTamil ? 'ta' : 'en'
            );
            const formattedEndDate = formatDisplayDate(
              leave.endDate,
              isTamil ? 'ta' : 'en'
            );
            const formattedAppliedDate = formatDisplayDate(
              leave.appliedAt,
              isTamil ? 'ta' : 'en'
            );
            const formattedDecidedDate = leave.decidedAt
              ? formatDisplayDate(leave.decidedAt, isTamil ? 'ta' : 'en')
              : '';

            const staffName = isTamil
              ? leave.staffNameTamil || leave.staffNameEnglish
              : leave.staffNameEnglish || leave.staffNameTamil;

            const staffRole = isTamil
              ? leave.designationTamil
              : leave.designationEnglish || leave.designationTamil;

            return (
              <View
                key={leave.id}
                style={[
                  styles.card,
                  isApproved && styles.cardApproved,
                  isRejected && styles.cardRejected,
                ]}
              >
                {/* Staff Meta & Status Pill */}
                <View style={styles.cardHeader}>
                  <View style={styles.staffMeta}>
                    <Text style={styles.staffNameText}>
                      {staffName}
                    </Text>
                    <Text style={styles.staffDesText}>{staffRole}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isPending && styles.pillPending,
                      isApproved && styles.pillApproved,
                      isRejected && styles.pillRejected,
                    ]}
                  >
                    {isPending && <Clock size={12} color="#B45309" />}
                    {isApproved && <CheckCircle2 size={12} color="#166534" />}
                    {isRejected && <XCircle size={12} color="#991B1B" />}
                    <Text
                      style={[
                        styles.statusPillText,
                        isPending && styles.pillTextPending,
                        isApproved && styles.pillTextApproved,
                        isRejected && styles.pillTextRejected,
                      ]}
                    >
                      {t(`leaves.status.${leave.status}`, isPending ? 'நிலுவையில்' : isApproved ? 'அங்கீகரிக்கப்பட்டது' : 'நிராகரிக்கப்பட்டது')}
                    </Text>
                  </View>
                </View>

                {/* Dates & Duration */}
                <View style={styles.datesRow}>
                  <Calendar size={14} color="#074735" />
                  <Text style={styles.datesText}>
                    {isTamil
                      ? `${formattedStartDate} முதல் ${formattedEndDate} வரை`
                      : `${formattedStartDate} to ${formattedEndDate}`}
                  </Text>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationPillText}>
                      {t('leaves.daysCount', { count: durationDays })}
                    </Text>
                  </View>
                </View>

                {/* Reason callout */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>
                    {t('leaves.reasonLabel', 'காரணம்:')}{' '}
                    <Text style={styles.reasonSubText}>{leave.reason}</Text>
                  </Text>
                </View>

                {/* Applied Date */}
                <Text style={styles.appliedDateText}>
                  {t('adminLeaves.appliedOn', { date: formattedAppliedDate })}
                </Text>

                {/* Admin Audit if decided */}
                {(isApproved || isRejected) && (
                  <View
                    style={[
                      styles.decisionAuditBox,
                      isApproved ? styles.auditApprovedBox : styles.auditRejectedBox,
                    ]}
                  >
                    <Text style={styles.auditTitle}>
                      {t('adminLeaves.adminRemarks', 'நிர்வாக பதில்:')}
                    </Text>
                    {leave.adminRemarks && (
                      <Text style={styles.auditRemarks}>"{leave.adminRemarks}"</Text>
                    )}
                    <Text style={styles.auditMeta}>
                      {t('adminLeaves.decidedBy', {
                        name: leave.decidedBy,
                        date: formattedDecidedDate,
                      })}
                    </Text>
                  </View>
                )}

                {/* Admin Actions if Pending */}
                {isPending && (
                  <View style={styles.adminActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Reject leave request"
                      onPress={() => handleOpenDecision(leave, 'rejected')}
                      style={styles.rejectButton}
                    >
                      <X size={15} color="#DC2626" />
                      <Text style={styles.rejectButtonText}>
                        {t('adminLeaves.btnReject', 'நிராகரி (Reject)')}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Approve leave request"
                      onPress={() => handleOpenDecision(leave, 'approved')}
                      style={styles.approveButton}
                    >
                      <Check size={15} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>
                        {t('adminLeaves.btnApprove', 'ஒப்புதல் (Approve)')}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Decision Modal */}
      <Modal
        visible={!!selectedLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLeave(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdropDismiss}
            onPress={() => setSelectedLeave(null)}
          />

          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {decisionAction === 'approved'
                    ? t('adminLeaves.confirmApprove', 'விடுப்பு ஒப்புதல் (Approve Leave)')
                    : t('adminLeaves.confirmReject', 'விடுப்பு நிராகரிப்பு (Reject Leave)')}
                </Text>
                <Text style={styles.modalSub}>
                  {isTamil
                    ? selectedLeave?.staffNameTamil || selectedLeave?.staffNameEnglish
                    : selectedLeave?.staffNameEnglish || selectedLeave?.staffNameTamil}{' '}
                  • ({selectedLeave?.startDate} to {selectedLeave?.endDate})
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedLeave(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('adminLeaves.remarksLabel', 'நிர்வாகக் குறிப்பு / பதில் (Admin Remarks):')}
              </Text>
              <TextInput
                value={adminRemarks}
                onChangeText={setAdminRemarks}
                placeholder={
                  decisionAction === 'approved'
                    ? t('adminLeaves.remarksPlaceholder', 'எ.கா: அனுமதிக்கப்பட்டது (Approved).')
                    : 'நிராகரிப்பிற்கான காரணத்தை உள்ளிடவும்...'
                }
                placeholderTextColor="#94A3B8"
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSelectedLeave(null)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>
                  {t('adminLeaves.cancel', 'ரத்து')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDecision}
                disabled={isSubmitting}
                style={[
                  styles.modalConfirmButton,
                  decisionAction === 'approved'
                    ? styles.confirmApprove
                    : styles.confirmReject,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {decisionAction === 'approved'
                      ? t('adminLeaves.confirmApprove', 'ஒப்புதல் செய்க')
                      : t('adminLeaves.confirmReject', 'நிராகரிக்க')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Vedic off-white
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },

  /* Standardized Header matching ScheduleHeader & PriestHeader */
  headerContainer: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  tamilTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#074735',
    letterSpacing: 0.2,
  },
  englishSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  refreshSpinning: {
    opacity: 0.5,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#074735',
  },
  tabButtonActiveAmber: {
    backgroundColor: '#D97706',
  },
  tabButtonActiveGreen: {
    backgroundColor: '#16A34A',
  },
  tabButtonActiveRed: {
    backgroundColor: '#DC2626',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5F7068',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeActiveAmber: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeActiveGreen: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeActiveRed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#5F7068',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* Scroll Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    marginTop: 14,
    gap: 6,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Cards */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardApproved: {
    borderColor: '#A7F3D0',
  },
  cardRejected: {
    borderColor: '#FECACA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  staffMeta: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#074735',
  },
  staffDesText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 4,
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillApproved: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pillRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextPending: {
    color: '#92400E',
  },
  pillTextApproved: {
    color: '#166534',
  },
  pillTextRejected: {
    color: '#991B1B',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  datesText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  durationPill: {
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E8D8B0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#855E15',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#074735',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  reasonSubText: {
    fontWeight: '400',
    color: '#475569',
  },
  appliedDateText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  decisionAuditBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  auditApprovedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  auditRejectedBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  auditTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
  },
  auditRemarks: {
    fontSize: 11.5,
    color: '#334155',
    fontStyle: 'italic',
    marginVertical: 2,
  },
  auditMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
  },
  approveButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#074735',
    borderWidth: 1,
    borderColor: '#C6A15B',
    gap: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#074735',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmApprove: {
    backgroundColor: '#074735',
    borderWidth: 1,
    borderColor: '#C6A15B',
  },
  confirmReject: {
    backgroundColor: '#DC2626',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
