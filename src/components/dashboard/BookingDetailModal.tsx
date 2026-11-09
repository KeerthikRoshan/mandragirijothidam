/**
 * BookingDetailModal Component
 * Dedicated, production-quality modal for viewing full booking details
 * and initiating edits with strict 24-hour edit restriction enforcement.
 */

import React, { useMemo } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  IndianRupee,
  Lock,
  MapPin,
  Package,
  Phone,
  Radio,
  User,
  UserCheck,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScheduleBooking } from '../../types/schedule';
import { isBookingEditable, getBookingLiveStatus } from '../../utils/bookingRules';
import { BlinkingLiveDot } from '../common/BlinkingLiveDot';

interface BookingDetailModalProps {
  visible: boolean;
  booking: ScheduleBooking | null;
  onClose: () => void;
  onEdit?: (booking: ScheduleBooking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  visible,
  booking,
  onClose,
  onEdit,
}) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const editCheck = useMemo(() => {
    return isBookingEditable(booking);
  }, [booking]);

  const liveStatus = useMemo(() => {
    if (!booking) return { isLive: false, isPast: false, isUpcoming: false };
    return getBookingLiveStatus(booking);
  }, [booking]);

  if (!booking) {
    return null;
  }

  const handleEditPress = () => {
    if (!editCheck.isEditable) {
      const msg = isTa ? editCheck.reasonTa : editCheck.reasonEn;
      Alert.alert(
        t('bookingDetail.editUnavailable'),
        msg || t('bookingDetail.editNotice')
      );
      return;
    }
    onEdit?.(booking);
  };

  const totalCharge = booking.totalEventCharge ?? 0;
  const advancePaid = booking.clientTotalReceived ?? booking.clientAdvanceAmount ?? 0;
  const balanceAmount = booking.clientBalanceAmount ?? Math.max(0, totalCharge - advancePaid);
  const paymentStatus = (booking.clientPaymentStatus || (advancePaid >= totalCharge && totalCharge > 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending')).toLowerCase();

  const durationHours = booking.durationMinutes
    ? Math.round((booking.durationMinutes / 60) * 10) / 10
    : 1;

  const venueLabel = () => {
    switch (booking.venueType) {
      case 'temple':
        return isTa ? 'கோவில் வளாகம்' : 'Temple';
      case 'hall':
        return isTa ? 'திருமண மண்டபம்' : 'Marriage Hall';
      case 'other':
        return isTa ? 'வெளிப்புற இடம்' : 'Outdoor / Other';
      default:
        return isTa ? 'இல்லம் (வீடு)' : 'Home';
    }
  };

  const samagriLabel = () => {
    if (booking.samagriBy === 'priest') {
      return t('bookingDetail.samagriPriest');
    }
    return t('bookingDetail.samagriCustomer');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Top Notch Drag Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <View style={styles.bookingNumberRow}>
                <Text style={styles.bookingIdText}>
                  {booking.bookingNumber || `#BK-${booking.id}`}
                </Text>
                {liveStatus.isLive ? (
                  <View style={styles.liveBadge}>
                    <BlinkingLiveDot size={6} color="#16A34A" />
                    <Text style={styles.liveBadgeText}>
                      {t('bookingDetail.live')}
                    </Text>
                  </View>
                ) : booking.status === 'completed' || liveStatus.isPast ? (
                  <View style={styles.completedBadge}>
                    <CheckCircle2 size={11} color="#047857" style={styles.badgeIcon} />
                    <Text style={styles.completedBadgeText}>
                      {t('bookingDetail.completed')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>
                      {booking.statusLabelTamil || t('bookingDetail.confirmed')}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.eventMainTitle,
                  isTa && styles.tamilTitleFont,
                ]}
                numberOfLines={2}
              >
                {isTa
                  ? booking.titleTamil || booking.titleEnglish
                  : booking.titleEnglish || booking.titleTamil}
              </Text>
            </View>

            {/* Header Right Action Buttons */}
            <View style={styles.headerActions}>
              <Pressable
                testID="booking-detail-edit-button"
                onPress={handleEditPress}
                style={[
                  styles.headerIconButton,
                  editCheck.isEditable
                    ? styles.editButtonActive
                    : styles.editButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('bookingDetail.editBooking')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {editCheck.isEditable ? (
                  <Edit3 size={18} color="#064E3B" />
                ) : (
                  <Lock size={16} color="#9CA3AF" />
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={styles.headerIconButton}
                accessibilityRole="button"
                accessibilityLabel={t('bookingDetail.close')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#4B5563" />
              </Pressable>
            </View>
          </View>

          {/* 24-Hour Restriction Warning Banner */}
          {!editCheck.isEditable && (
            <View style={styles.restrictionBanner}>
              <AlertCircle size={15} color="#B45309" style={styles.bannerIcon} />
              <Text
                style={[
                  styles.restrictionBannerText,
                  isTa && styles.tamilTextScale,
                ]}
              >
                {isTa ? editCheck.reasonTa : editCheck.reasonEn}
              </Text>
            </View>
          )}

          {/* Scrollable Detailed Sections */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* SECTION 1: Devotee Information */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <User size={15} color="#064E3B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    isTa && styles.tamilHeadingScale,
                  ]}
                >
                  {t('bookingDetail.devoteeInfo')}
                </Text>
              </View>

              <View style={styles.fieldGrid}>
                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.devoteeName')}
                  </Text>
                  <Text style={styles.fieldValueBold}>
                    {booking.clientName || '—'}
                  </Text>
                </View>

                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.phone')}
                  </Text>
                  <View style={styles.inlineValueRow}>
                    <Phone size={13} color="#059669" style={styles.inlineIcon} />
                    <Text style={styles.fieldValueLink}>
                      {booking.clientPhone || '—'}
                    </Text>
                  </View>
                </View>

                {Boolean(booking.alternatePhone) && (
                  <View style={styles.fieldItemFull}>
                    <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                      {t('bookingDetail.alternatePhone')}
                    </Text>
                    <Text style={styles.fieldValue}>
                      {booking.alternatePhone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 2: Date & Timings */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <Clock size={15} color="#064E3B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    isTa && styles.tamilHeadingScale,
                  ]}
                >
                  {t('bookingDetail.dateTime')}
                </Text>
              </View>

              <View style={styles.fieldGrid}>
                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.date')}
                  </Text>
                  <View style={styles.inlineValueRow}>
                    <Calendar size={13} color="#B87B28" style={styles.inlineIcon} />
                    <Text style={styles.fieldValueBold}>
                      {booking.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.duration')}
                  </Text>
                  <Text style={styles.fieldValue}>
                    {isTa
                      ? `${durationHours} மணி நேரம் (${booking.durationMinutes || 60} நிமி)`
                      : `${durationHours} hrs (${booking.durationMinutes || 60} mins)`}
                  </Text>
                </View>

                <View style={styles.fieldItemFull}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.timings')}
                  </Text>
                  <Text style={styles.timeSlotHighlight}>
                    {booking.timeSlot || `${booking.startTime} - ${booking.endTime}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 3: Priest & Venue Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <UserCheck size={15} color="#064E3B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    isTa && styles.tamilHeadingScale,
                  ]}
                >
                  {t('bookingDetail.priestVenue')}
                </Text>
              </View>

              <View style={styles.fieldGrid}>
                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.assignedPriest')}
                  </Text>
                  <Text style={styles.fieldValueBold}>
                    {isTa
                      ? booking.priestNameTamil || booking.priestNameEnglish || booking.priestName || 'சுவாமி'
                      : booking.priestNameEnglish || booking.priestNameTamil || booking.priestName || 'Priest'}
                  </Text>
                  {Boolean(booking.priestPhone) && (
                    <Text style={styles.fieldSubValue}>
                      {booking.priestPhone}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldItem}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.venue')}
                  </Text>
                  <Text style={styles.fieldValueBold}>
                    {venueLabel()}
                  </Text>
                </View>

                <View style={styles.fieldItemFull}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.address')}
                  </Text>
                  <View style={styles.inlineValueRow}>
                    <MapPin size={13} color="#DC2626" style={styles.inlineIcon} />
                    <Text style={styles.fieldValue} numberOfLines={3}>
                      {booking.address ||
                        booking.locationTamil ||
                        booking.location ||
                        'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்'}
                      {booking.area ? `, ${booking.area}` : ''}
                      {booking.pincode ? ` - ${booking.pincode}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION 4: Financials & Payment Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <IndianRupee size={15} color="#064E3B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    isTa && styles.tamilHeadingScale,
                  ]}
                >
                  {t('bookingDetail.financials')}
                </Text>
              </View>

              <View style={styles.financialRow}>
                <View style={styles.financialCol}>
                  <Text style={styles.financialLabel}>
                    {t('bookingDetail.totalAmount')}
                  </Text>
                  <Text style={styles.financialTotalValue}>
                    ₹ {totalCharge.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.financialCol}>
                  <Text style={styles.financialLabel}>
                    {t('bookingDetail.advanceReceived')}
                  </Text>
                  <Text style={styles.financialAdvanceValue}>
                    ₹ {advancePaid.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.financialCol}>
                  <Text style={styles.financialLabel}>
                    {t('bookingDetail.balanceAmount')}
                  </Text>
                  <Text
                    style={[
                      styles.financialBalanceValue,
                      balanceAmount > 0 ? styles.balancePending : styles.balanceCleared,
                    ]}
                  >
                    ₹ {balanceAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentStatusBadgeRow}>
                <Text style={styles.paymentStatusLabel}>
                  {t('bookingDetail.paymentStatus')}:
                </Text>
                <View
                  style={[
                    styles.paymentBadge,
                    paymentStatus === 'paid'
                      ? styles.paymentBadgePaid
                      : paymentStatus === 'partial'
                      ? styles.paymentBadgePartial
                      : styles.paymentBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentBadgeText,
                      paymentStatus === 'paid'
                        ? styles.paymentTextPaid
                        : paymentStatus === 'partial'
                        ? styles.paymentTextPartial
                        : styles.paymentTextPending,
                    ]}
                  >
                    {paymentStatus === 'paid'
                      ? isTa
                        ? 'முழுமையாக செலுத்தப்பட்டது'
                        : 'Fully Paid'
                      : paymentStatus === 'partial'
                      ? isTa
                        ? 'பகுதி செலுத்துகை'
                        : 'Partial Payment'
                      : isTa
                      ? 'நிலுவையில்'
                      : 'Payment Pending'}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 5: Additional Info & Samagri */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <Package size={15} color="#064E3B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    isTa && styles.tamilHeadingScale,
                  ]}
                >
                  {t('bookingDetail.additionalInfo')}
                </Text>
              </View>

              <View style={styles.fieldGrid}>
                <View style={styles.fieldItemFull}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.samagri')}
                  </Text>
                  <Text style={styles.fieldValueBold}>
                    {samagriLabel()}
                  </Text>
                </View>

                <View style={styles.fieldItemFull}>
                  <Text style={[styles.fieldLabel, isTa && styles.tamilFieldLabel]}>
                    {t('bookingDetail.notes')}
                  </Text>
                  <Text style={styles.fieldValueNotes}>
                    {booking.notes ||
                      booking.notesTamil ||
                      t('bookingDetail.noNotes')}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.closeBtnText,
                  isTa && styles.tamilTextScale,
                ]}
              >
                {t('bookingDetail.close')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleEditPress}
              style={[
                styles.editCtaBtn,
                !editCheck.isEditable && styles.editCtaDisabled,
              ]}
              accessibilityRole="button"
            >
              {editCheck.isEditable ? (
                <>
                  <Edit3 size={16} color="#FFFFFF" style={styles.ctaIcon} />
                  <Text
                    style={[
                      styles.editCtaText,
                      isTa && styles.tamilTextScale,
                    ]}
                  >
                    {t('bookingDetail.editBooking')}
                  </Text>
                </>
              ) : (
                <>
                  <Lock size={15} color="#9CA3AF" style={styles.ctaIcon} />
                  <Text
                    style={[
                      styles.editCtaTextDisabled,
                      isTa && styles.tamilTextScale,
                    ]}
                  >
                    {t('bookingDetail.editUnavailable')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  bookingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeIcon: {
    marginRight: 3,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  confirmedBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  eventMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073E2E',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  tamilTitleFont: {
    fontSize: 16.5,
    lineHeight: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  editButtonActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  editButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerIcon: {
    marginRight: 8,
  },
  restrictionBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  tamilTextScale: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E2ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#073E2E',
    letterSpacing: 0.1,
  },
  tamilHeadingScale: {
    fontSize: 12.8,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  fieldItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  fieldItemFull: {
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  tamilFieldLabel: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
    textTransform: 'none',
  },
  fieldValue: {
    fontSize: 13,
    color: '#1F2937',
  },
  fieldValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  fieldValueLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  fieldSubValue: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  fieldValueNotes: {
    fontSize: 12.5,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  inlineValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIcon: {
    marginRight: 4,
  },
  timeSlotHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#074735',
    backgroundColor: '#E6F4EA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  financialCol: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 3,
  },
  financialTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  financialAdvanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  financialBalanceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  balancePending: {
    color: '#DC2626',
  },
  balanceCleared: {
    color: '#059669',
  },
  paymentStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  paymentStatusLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  paymentBadgePartial: {
    backgroundColor: '#FEF3C7',
  },
  paymentBadgePending: {
    backgroundColor: '#FEE2E2',
  },
  paymentBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  paymentTextPaid: {
    color: '#15803D',
  },
  paymentTextPartial: {
    color: '#B45309',
  },
  paymentTextPending: {
    color: '#B91C1C',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  editCtaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#074735', // Deep forest green
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  editCtaDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ctaIcon: {
    marginRight: 6,
  },
  editCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editCtaTextDisabled: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
