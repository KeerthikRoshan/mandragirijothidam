/**
 * Prominent Reminder Modal for Mandhiragiri Jothidam (Phase 5 / Part B)
 * Displays immediate foreground 5-minute reminder alert with booking details,
 * dismiss acknowledgement (deduplicated via AsyncStorage), and navigation to booking workflow.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Calendar, Clock, User, ArrowRight, X, CheckCircle } from 'lucide-react-native';

export interface ProminentReminderBooking {
  id?: string | number;
  bookingNumber?: string;
  title?: string;
  dateKey?: string;
  startTime?: string;
  timeSlot?: string;
  priestName?: string;
  location?: string;
}

export interface ProminentReminderModalProps {
  visible: boolean;
  notificationId?: string | number;
  booking?: ProminentReminderBooking | null;
  canComplete?: boolean;
  onDismiss: () => void;
  onOpenDetails: (bookingId?: string | number) => void;
  onCompleteBooking?: (bookingId?: string | number) => void;
}

export const ProminentReminderModal: React.FC<ProminentReminderModalProps> = ({
  visible,
  notificationId,
  booking,
  canComplete = false,
  onDismiss,
  onOpenDetails,
  onCompleteBooking,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Check if this specific reminder was previously dismissed locally
  useEffect(() => {
    let isMounted = true;
    const checkDismissal = async () => {
      if (!notificationId) {
        setIsDismissed(false);
        return;
      }
      try {
        const key = `@dismissed_5m_reminder_${notificationId}`;
        const dismissed = await AsyncStorage.getItem(key);
        if (isMounted) {
          setIsDismissed(dismissed === 'true');
        }
      } catch {
        if (isMounted) setIsDismissed(false);
      }
    };

    if (visible) {
      checkDismissal();
    }
    return () => {
      isMounted = false;
    };
  }, [visible, notificationId]);

  const handleDismiss = async () => {
    if (notificationId) {
      try {
        await AsyncStorage.setItem(`@dismissed_5m_reminder_${notificationId}`, 'true');
      } catch (_) {}
    }
    setIsDismissed(true);
    onDismiss();
  };

  const handleOpenDetails = () => {
    onDismiss();
    onOpenDetails(booking?.id);
  };

  const handleComplete = () => {
    if (onCompleteBooking) {
      onDismiss();
      onCompleteBooking(booking?.id);
    }
  };

  const isModalVisible = visible && !isDismissed && !!booking;

  if (!isModalVisible) {
    return null;
  }

  const bookingRef = booking.bookingNumber || (booking.id ? `#${booking.id}` : '#---');
  const displayTitle = booking.title || 'பூஜை / நிகழ்வு (Pooja / Event)';
  const displayTime = booking.timeSlot || booking.startTime || '---';
  const displayDate = booking.dateKey || 'இன்று (Today)';
  const displayPriest = booking.priestName || 'முதன்மை குருக்கள் (Assigned Priest)';

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerLeft}>
              <View style={styles.bellIconContainer}>
                <Bell size={24} color="#C6A15B" />
              </View>
              <View>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>5 நிமிடங்களில் தொடங்குகிறது (In 5 Minutes)</Text>
                </View>
                <Text style={styles.headerTitle}>முன்பதிவு நினைவூட்டல்</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeButton}
              accessibilityLabel="Close reminder"
            >
              <X size={20} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            {/* Booking Title & Ref */}
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>{displayTitle}</Text>
              <View style={styles.refBadge}>
                <Text style={styles.refBadgeText}>{bookingRef}</Text>
              </View>
            </View>

            {/* Details Box */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Clock size={18} color="#145C43" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>தொடக்க நேரம் (Start Time):</Text>
                  <Text style={styles.detailValue}>{displayTime}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Calendar size={18} color="#145C43" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>தேதி (Date):</Text>
                  <Text style={styles.detailValue}>{displayDate}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <User size={18} color="#145C43" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>ஒதுக்கப்பட்ட குருக்கள் (Priest):</Text>
                  <Text style={styles.detailValue}>{displayPriest}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.instructionsText}>
              நிகழ்வு தொடங்குவதற்கு தயாராக இருக்கவும். விவரங்களை பார்க்க கீழே உள்ள பொத்தானை அழுத்தவும்.
            </Text>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>விவரங்களை பார்க்க (View Details)</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {canComplete && onCompleteBooking && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
                activeOpacity={0.85}
              >
                <CheckCircle size={16} color="#064E3B" style={{ marginRight: 6 }} />
                <Text style={styles.completeButtonText}>நிறைவு செய்தல் (Complete Workflow)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>சரி, புரிந்தது (Dismiss)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FAF9F6',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bellIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  urgentBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#145C43',
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  bodyScroll: {
    maxHeight: 340,
  },
  bodyContent: {
    padding: 20,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  refBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  detailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  instructionsText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#145C43',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#064E3B',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
