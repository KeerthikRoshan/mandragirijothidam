/**
 * StaffLeavesScreen Component (பணியாளர் விடுப்பு விண்ணப்பம்)
 * Leave Application & History Tracking for Priests and Assistants
 *
 * Implements:
 * 1. Full Bilingual Support (Tamil & English) switching seamlessly with app language.
 * 2. Elevated Vedic forest green (#074735), cream (#FAF9F6), and gold (#C6A15B) design system.
 * 3. Consistent typography, balanced padding (16px), aligned components, and smooth transitions.
 * 4. Intuitive, validated leave application form (Start Date, End Date, Type, Reason).
 * 5. Dynamic status filtering (All, Pending, Approved, Rejected) with live badges.
 * 6. Detailed leave cards with duration pills, bilingual dates, and admin audit trail.
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
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  RefreshCw,
  User,
  X,
  XCircle,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import {
  applyLeaveRequest,
  getLeavesForStaff,
  NewLeaveInput,
} from '../../services/leaveService';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import {
  LeaveRequest,
  LeaveType,
  StaffUserProfile,
} from '../../types/staffPortal';
import {
  addDays,
  calculateDaysBetween,
  formatDateKey,
  formatDisplayDate,
} from '../../utils/dateUtils';
import {
  StaffLeavesScreenNavigationProp,
  StaffLeavesScreenRouteProp,
} from '../../types/navigation';
import { useTranslation } from 'react-i18next';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

interface LeaveTypeOption {
  key: LeaveType;
  labelKey: string;
}

const LEAVE_TYPES: LeaveTypeOption[] = [
  { key: 'personal', labelKey: 'leaves.types.personal' },
  { key: 'medical', labelKey: 'leaves.types.medical' },
  { key: 'temple_duty', labelKey: 'leaves.types.temple_duty' },
  { key: 'festival', labelKey: 'leaves.types.festival' },
  { key: 'emergency', labelKey: 'leaves.types.emergency' },
];

export const StaffLeavesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffLeavesScreenNavigationProp>();
  const route = useRoute<StaffLeavesScreenRouteProp>();
  const { t, i18n } = useTranslation();

  const isTamil = (i18n.language || 'ta').startsWith('ta');

  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Apply Modal State
  const [isApplyModalVisible, setIsApplyModalVisible] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(
    formatDateKey(addDays(new Date(), 1))
  );
  const [endDate, setEndDate] = useState<string>(
    formatDateKey(addDays(new Date(), 2))
  );
  const [leaveType, setLeaveType] = useState<LeaveType>('personal');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadLeaves = useCallback(async (staffIdParam?: string) => {
    try {
      let staff: StaffUserProfile;
      if (staffIdParam) {
        staff = await authService.setStaffSession(staffIdParam);
      } else {
        staff = await authService.getCurrentStaff();
      }
      setCurrentStaff(staff);

      const staffLeaves = await getLeavesForStaff(staff.id);
      setLeaves(staffLeaves);
    } catch (_e) {
      // Fallback gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadLeaves(route?.params?.staffId);
  }, [route?.params?.staffId, loadLeaves]);

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

  // Handle Form Submission
  const handleSubmitLeave = async () => {
    if (!currentStaff) return;

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert(
        t('leaves.alerts.errorTitle', 'பிழை'),
        t('leaves.alerts.datesRequired', 'துவக்க மற்றும் முடிவு தேதியை உள்ளிடவும்.')
      );
      return;
    }

    if (startDate > endDate) {
      Alert.alert(
        t('leaves.alerts.errorTitle', 'பிழை'),
        t(
          'leaves.alerts.invalidDateRange',
          'துவக்க தேதி முடிவு தேதிக்கு முன் இருக்க வேண்டும்.'
        )
      );
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      Alert.alert(
        t('leaves.alerts.errorTitle', 'பிழை'),
        t(
          'leaves.alerts.reasonRequired',
          'விடுப்பிற்கான காரணத்தை தெளிவாக உள்ளிடவும் (குறைந்தது 5 எழுத்துகள்).'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const input: NewLeaveInput = {
        startDate,
        endDate,
        leaveType,
        reason: reason.trim(),
      };

      const result = await applyLeaveRequest(currentStaff.id, input);

      if (result.success) {
        Alert.alert(
          t('leaves.alerts.successTitle', 'விண்ணப்பம் பெறப்பட்டது'),
          t(
            'leaves.alerts.successMessage',
            'தங்களின் விடுப்பு விண்ணப்பம் நிர்வாகியின் ஒப்புதலுக்காக சமர்ப்பிக்கப்பட்டது.'
          )
        );
        setIsApplyModalVisible(false);
        setReason('');
        loadLeaves(currentStaff.id);
      } else {
        Alert.alert(
          t('leaves.alerts.failedTitle', 'விண்ணப்பிக்க இயலவில்லை'),
          result.error || t('leaves.alerts.failedGeneral', 'பிழை ஏற்பட்டது.')
        );
      }
    } catch (_e) {
      Alert.alert(
        t('leaves.alerts.errorTitle', 'பிழை'),
        t('leaves.alerts.failedGeneral', 'விடுப்பு விண்ணப்பத்தை சமர்ப்பிக்க இயலவில்லை.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const staffDisplayName = isTamil
    ? currentStaff?.nameTamil || currentStaff?.nameEnglish
    : currentStaff?.nameEnglish || currentStaff?.nameTamil;

  const staffDisplayRole = isTamil
    ? currentStaff?.designationTamil || 'பணியாளர்'
    : currentStaff?.designationEnglish || currentStaff?.role || 'Staff Member';

  const bottomNavHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Header Bar matching ScheduleHeader and PriestHeader standard */}
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
            {t('leaves.title', 'விடுப்பு விண்ணப்பங்கள்')}
          </Text>
          <Text style={styles.englishSubtitle} numberOfLines={1}>
            {staffDisplayName ? `${staffDisplayName} • ${staffDisplayRole}` : t('leaves.subtitle', 'Staff Leave Application')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('leaves.refreshLabel', 'Refresh leaves')}
          onPress={() => {
            setRefreshing(true);
            loadLeaves(currentStaff?.id);
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

      {/* 2. Top Action Banner: Staff Summary & Apply Button */}
      <View style={styles.actionBanner}>
        <View style={styles.staffSummaryCard}>
          <View style={styles.staffAvatarCircle}>
            <User size={18} color="#074735" />
          </View>
          <View style={styles.staffMetaBox}>
            <Text style={styles.staffNameText} numberOfLines={1}>
              {staffDisplayName || 'Staff Member'}
            </Text>
            <Text style={styles.staffRoleText} numberOfLines={1}>
              {staffDisplayRole}
            </Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeNumber}>{counts.all}</Text>
            <Text style={styles.totalBadgeLabel}>
              {t('leaves.tabs.all', 'அனைத்தும்')}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('leaves.applyButton', '+ புதிய விடுப்பு விண்ணப்பிக்க')}
          onPress={() => setIsApplyModalVisible(true)}
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <FilePlus2 size={18} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>
            {t('leaves.applyButton', '+ புதிய விடுப்பு விண்ணப்பிக்க')}
          </Text>
        </Pressable>
      </View>

      {/* 3. Filter Tabs (All, Pending, Approved, Rejected) */}
      <View style={styles.tabsContainer}>
        {/* All Tab */}
        <Pressable
          onPress={() => setActiveTab('all')}
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'all' && styles.tabButtonTextActive,
            ]}
          >
            {t('leaves.tabs.all', 'அனைத்தும்')}
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'all' && styles.tabBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'all' && styles.tabBadgeTextActive,
              ]}
            >
              {counts.all}
            </Text>
          </View>
        </Pressable>

        {/* Pending Tab */}
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[
            styles.tabButton,
            activeTab === 'pending' && styles.tabButtonActiveAmber,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'pending' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'pending' && styles.tabButtonTextActiveAmber,
            ]}
          >
            {t('leaves.tabs.pending', 'நிலுவை')}
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'pending' && styles.tabBadgeActiveAmber,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'pending' && styles.tabBadgeTextActiveAmber,
              ]}
            >
              {counts.pending}
            </Text>
          </View>
        </Pressable>

        {/* Approved Tab */}
        <Pressable
          onPress={() => setActiveTab('approved')}
          style={[
            styles.tabButton,
            activeTab === 'approved' && styles.tabButtonActiveGreen,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'approved' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'approved' && styles.tabButtonTextActiveGreen,
            ]}
          >
            {t('leaves.tabs.approved', 'அங்கீகரிக்கப்பட்டது')}
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'approved' && styles.tabBadgeActiveGreen,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'approved' && styles.tabBadgeTextActiveGreen,
              ]}
            >
              {counts.approved}
            </Text>
          </View>
        </Pressable>

        {/* Rejected Tab */}
        <Pressable
          onPress={() => setActiveTab('rejected')}
          style={[
            styles.tabButton,
            activeTab === 'rejected' && styles.tabButtonActiveRed,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'rejected' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'rejected' && styles.tabButtonTextActiveRed,
            ]}
          >
            {t('leaves.tabs.rejected', 'நிராகரிப்பு')}
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'rejected' && styles.tabBadgeActiveRed,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'rejected' && styles.tabBadgeTextActiveRed,
              ]}
            >
              {counts.rejected}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* 4. Leave History List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 24 },
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
              {t(`leaves.empty.${activeTab}`, t('leaves.empty.all', 'விடுப்பு விண்ணப்பங்கள் எதுவும் இல்லை'))}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('leaves.empty.subtitle', 'மேலே உள்ள பொத்தானைப் பயன்படுத்தி புதிய விடுப்புக்கு விண்ணப்பிக்கலாம்.')}
            </Text>
          </View>
        ) : (
          filteredLeaves.map(leave => {
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isRejected = leave.status === 'rejected';

            const typeLabel = t(
              `leaves.types.${leave.leaveType}`,
              leave.leaveType === 'personal'
                ? 'தனிப்பட்ட விடுப்பு'
                : leave.leaveType === 'medical'
                ? 'மருத்துவ விடுப்பு'
                : leave.leaveType === 'temple_duty'
                ? 'கோவில் விசேஷ பணி'
                : leave.leaveType === 'festival'
                ? 'திருவிழா விடுப்பு'
                : 'அவசர விடுப்பு'
            );

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

            return (
              <View
                key={leave.id}
                style={[
                  styles.leaveCard,
                  isApproved && styles.leaveCardApproved,
                  isRejected && styles.leaveCardRejected,
                ]}
              >
                {/* Header row: Leave Type & Status Pill */}
                <View style={styles.leaveCardTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isPending && styles.statusPillPending,
                      isApproved && styles.statusPillApproved,
                      isRejected && styles.statusPillRejected,
                    ]}
                  >
                    {isPending && <Clock size={12} color="#B45309" />}
                    {isApproved && <CheckCircle2 size={12} color="#166534" />}
                    {isRejected && <XCircle size={12} color="#991B1B" />}
                    <Text
                      style={[
                        styles.statusPillText,
                        isPending && styles.statusPillTextPending,
                        isApproved && styles.statusPillTextApproved,
                        isRejected && styles.statusPillTextRejected,
                      ]}
                    >
                      {t(`leaves.status.${leave.status}`, isPending ? 'நிலுவையில்' : isApproved ? 'அங்கீகரிக்கப்பட்டது' : 'நிராகரிக்கப்பட்டது')}
                    </Text>
                  </View>
                </View>

                {/* Dates & Duration row */}
                <View style={styles.datesRow}>
                  <Calendar size={15} color="#074735" />
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
                  <Text style={styles.reasonLabel}>
                    {t('leaves.reasonLabel', 'காரணம்:')}{' '}
                    <Text style={styles.reasonContent}>{leave.reason}</Text>
                  </Text>
                </View>

                {/* Applied Date Meta */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {t('leaves.appliedDateLabel', 'விண்ணப்பித்த தேதி:')} {formattedAppliedDate}
                  </Text>
                </View>

                {/* Admin Decision Audit Section (if decided) */}
                {(isApproved || isRejected) && (
                  <View
                    style={[
                      styles.adminDecisionBox,
                      isApproved
                        ? styles.decisionApprovedBox
                        : styles.decisionRejectedBox,
                    ]}
                  >
                    <View style={styles.decisionHeaderRow}>
                      <Text
                        style={[
                          styles.adminDecisionTitle,
                          isApproved
                            ? styles.decisionApprovedTitle
                            : styles.decisionRejectedTitle,
                        ]}
                      >
                        {t('leaves.adminDecisionTitle', 'நிர்வாக முடிவு:')}
                      </Text>
                      <Text style={styles.decisionStatusLabel}>
                        {t(`leaves.status.${leave.status}`)}
                      </Text>
                    </View>

                    {leave.adminRemarks && (
                      <Text style={styles.adminRemarksText}>
                        "{leave.adminRemarks}"
                      </Text>
                    )}

                    <Text style={styles.adminAuditText}>
                      {t('leaves.decidedByMeta', {
                        name:
                          leave.decidedBy ||
                          (isTamil ? 'முதன்மை நிர்வாகி' : 'Chief Administrator'),
                        date: formattedDecidedDate,
                      })}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 5. Apply Leave Modal */}
      <Modal
        visible={isApplyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdropDismiss}
            onPress={() => setIsApplyModalVisible(false)}
          />

          <View style={styles.modalDialog}>
            {/* Modal Drag Handle */}
            <View style={styles.modalHandleBar} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconCircle}>
                  <FilePlus2 size={18} color="#074735" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {t('leaves.modal.title', 'புதிய விடுப்பு விண்ணப்பம்')}
                  </Text>
                  <Text style={styles.modalSub}>
                    {staffDisplayName || 'Staff Member'} • {staffDisplayRole}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsApplyModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t('leaves.modal.cancel', 'Close')}
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Leave Type Selector Chips */}
              <Text style={styles.inputLabel}>
                {t('leaves.modal.typeLabel', 'விடுப்பு வகை (Leave Type):')}
              </Text>
              <View style={styles.typeChipsGrid}>
                {LEAVE_TYPES.map(tOption => {
                  const isSelected = leaveType === tOption.key;
                  return (
                    <Pressable
                      key={tOption.key}
                      onPress={() => setLeaveType(tOption.key)}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipActive,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextActive,
                        ]}
                      >
                        {t(tOption.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date Inputs in 2-Column Row */}
              <View style={styles.dateInputsRow}>
                {/* Start Date */}
                <View style={styles.dateInputCol}>
                  <Text style={styles.inputLabel}>
                    {t('leaves.modal.startDateLabel', 'துவக்க தேதி (Start Date):')}
                  </Text>
                  <View style={styles.inputWithIcon}>
                    <Calendar size={14} color="#074735" style={styles.inputIcon} />
                    <TextInput
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputWithIcon}
                    />
                  </View>
                </View>

                {/* End Date */}
                <View style={styles.dateInputCol}>
                  <Text style={styles.inputLabel}>
                    {t('leaves.modal.endDateLabel', 'முடிவு தேதி (End Date):')}
                  </Text>
                  <View style={styles.inputWithIcon}>
                    <Calendar size={14} color="#074735" style={styles.inputIcon} />
                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputWithIcon}
                    />
                  </View>
                </View>
              </View>

              {/* Reason Multiline Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('leaves.modal.reasonLabel', 'விடுப்பிற்கான காரணம் (Reason for Leave):')}
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t(
                    'leaves.modal.reasonPlaceholder',
                    'விடுப்பிற்கான விரிவான காரணத்தை உள்ளிடவும்...'
                  )}
                  placeholderTextColor="#94A3B8"
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsApplyModalVisible(false)}
                style={styles.modalCancelButton}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>
                  {t('leaves.modal.cancel', 'ரத்து')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitLeave}
                disabled={isSubmitting}
                style={[
                  styles.modalSubmitButton,
                  isSubmitting && styles.modalSubmitDisabled,
                ]}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {t('leaves.modal.submit', 'விண்ணப்பிக்க (Submit)')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. Bottom Navigation */}
      <StaffBottomNav activeTab="more" staffId={currentStaff?.id} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Vedic off-white theme
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },

  /* Standardized Header */
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

  /* Action Banner */
  actionBanner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  staffSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  staffAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6ECE9',
    borderWidth: 1,
    borderColor: '#C6A15B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  staffMetaBox: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#074735',
  },
  staffRoleText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E8D8B0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  totalBadgeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#074735',
  },
  totalBadgeLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#855E15',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#074735',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C6A15B',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  applyButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Filter Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
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
  tabButtonTextActiveAmber: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabButtonTextActiveGreen: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabButtonTextActiveRed: {
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

  /* Scroll Area & List */
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

  /* Leave Cards */
  leaveCard: {
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
  leaveCardApproved: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  leaveCardRejected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
  },
  leaveCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: '#E6ECE9',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 4,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillApproved: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusPillRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextPending: {
    color: '#92400E',
  },
  statusPillTextApproved: {
    color: '#166534',
  },
  statusPillTextRejected: {
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
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  reasonContent: {
    fontWeight: '400',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  adminDecisionBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  decisionApprovedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  decisionRejectedBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  decisionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  adminDecisionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  decisionApprovedTitle: {
    color: '#166534',
  },
  decisionRejectedTitle: {
    color: '#991B1B',
  },
  decisionStatusLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  adminRemarksText: {
    fontSize: 11.5,
    color: '#334155',
    fontStyle: 'italic',
    marginVertical: 2,
  },
  adminAuditText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
  },

  /* Apply Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalDialog: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  modalHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#074735',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  typeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeChipActive: {
    backgroundColor: '#074735',
    borderColor: '#C6A15B',
  },
  typeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateInputCol: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitButton: {
    flex: 1.6,
    backgroundColor: '#074735',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C6A15B',
  },
  modalSubmitDisabled: {
    opacity: 0.7,
  },
  modalSubmitText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
