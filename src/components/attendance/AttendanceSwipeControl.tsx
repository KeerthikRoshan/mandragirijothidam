/**
 * AttendanceSwipeControl Component
 * Interactive Swipe-based Daily Attendance for Mandhragiri Jothidam Staff Portal
 *
 * Implements:
 * - Real PanResponder gesture handling (No external animation-only hacks).
 * - Swipe Right: Present (Green #145C43).
 * - Swipe Left: Absent (Red #B42318).
 * - Smooth spring snap-back when gesture is incomplete.
 * - Anti-accidental submission threshold guard.
 * - Loading indicator during submission.
 * - Once-per-day enforcement state: replaces swipe control with locked confirmation.
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Sliders,
  XCircle,
} from 'lucide-react-native';
import { StaffAttendanceRecord } from '../../types/attendance';

interface AttendanceSwipeControlProps {
  todayDateDisplay: string;
  staffName: string;
  designation: string;
  existingRecord: StaffAttendanceRecord | null;
  onSwipeAttendance: (status: 'present' | 'absent') => Promise<void>;
  onRequestCorrection?: () => void;
}

const SWIPE_THRESHOLD = 85;
const MAX_SWIPE = 130;

export const AttendanceSwipeControl: React.FC<AttendanceSwipeControlProps> = ({
  todayDateDisplay,
  staffName,
  designation,
  existingRecord,
  onSwipeAttendance,
  onRequestCorrection,
}) => {
  const pan = useRef(new Animated.Value(0)).current;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dragDirection, setDragDirection] = useState<'none' | 'right' | 'left'>('none');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (existingRecord || submitting) return false;
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (existingRecord || submitting) return;
        const clampedDx = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, gestureState.dx));
        pan.setValue(clampedDx);

        if (clampedDx > 20) {
          setDragDirection('right');
        } else if (clampedDx < -20) {
          setDragDirection('left');
        } else {
          setDragDirection('none');
        }
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (existingRecord || submitting) return;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Trigger Present
          Animated.timing(pan, {
            toValue: MAX_SWIPE,
            duration: 150,
            useNativeDriver: false,
          }).start(async () => {
            setSubmitting(true);
            try {
              await onSwipeAttendance('present');
            } catch (_e) {
              Animated.spring(pan, {
                toValue: 0,
                friction: 5,
                useNativeDriver: false,
              }).start();
            } finally {
              setSubmitting(false);
              setDragDirection('none');
            }
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Trigger Absent
          Animated.timing(pan, {
            toValue: -MAX_SWIPE,
            duration: 150,
            useNativeDriver: false,
          }).start(async () => {
            setSubmitting(true);
            try {
              await onSwipeAttendance('absent');
            } catch (_e) {
              Animated.spring(pan, {
                toValue: 0,
                friction: 5,
                useNativeDriver: false,
              }).start();
            } finally {
              setSubmitting(false);
              setDragDirection('none');
            }
          });
        } else {
          // Incomplete gesture: Snap smoothly back to center
          Animated.spring(pan, {
            toValue: 0,
            friction: 6,
            tension: 50,
            useNativeDriver: false,
          }).start(() => setDragDirection('none'));
        }
      },
    })
  ).current;

  // Background color interpolations
  const rightTrackBg = pan.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, MAX_SWIPE],
    outputRange: ['rgba(20, 92, 67, 0.08)', 'rgba(20, 92, 67, 0.35)', 'rgba(20, 92, 67, 0.85)'],
    extrapolate: 'clamp',
  });

  const leftTrackBg = pan.interpolate({
    inputRange: [-MAX_SWIPE, -SWIPE_THRESHOLD, 0],
    outputRange: ['rgba(180, 35, 24, 0.85)', 'rgba(180, 35, 24, 0.35)', 'rgba(180, 35, 24, 0.08)'],
    extrapolate: 'clamp',
  });

  // If attendance is already recorded for today, display the permanent confirmed state
  if (existingRecord && (existingRecord.status === 'present' || existingRecord.status === 'absent')) {
    const isPresent = existingRecord.status === 'present';

    return (
      <View style={[styles.card, isPresent ? styles.cardConfirmedPresent : styles.cardConfirmedAbsent]}>
        {/* Header row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.staffMeta}>
            <Text style={styles.cardStaffName} numberOfLines={1}>
              {staffName}
            </Text>
            <Text style={styles.cardDesignation} numberOfLines={1}>
              {designation}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Clock size={12} color="#074735" />
            <Text style={styles.dateBadgeText}>{todayDateDisplay}</Text>
          </View>
        </View>

        {/* Confirmation Content */}
        <View style={styles.confirmedContent}>
          <View style={styles.statusIconBox}>
            {isPresent ? (
              <CheckCircle2 size={36} color="#145C43" />
            ) : (
              <XCircle size={36} color="#B42318" />
            )}
          </View>

          <View style={styles.confirmedDetails}>
            <Text style={styles.confirmedTitle}>
              {isPresent ? 'இன்றைய வருகை பதிவானது' : 'இன்றைய விடுப்பு பதிவானது'}
            </Text>
            <Text style={styles.confirmedSubtitle}>
              Today's Attendance Recorded ({isPresent ? 'Present' : 'Absent'})
            </Text>

            <View style={styles.confirmedTimeRow}>
              <View style={[styles.confirmedPill, isPresent ? styles.pillPresent : styles.pillAbsent]}>
                <Text style={[styles.confirmedPillText, isPresent ? styles.pillTextPresent : styles.pillTextAbsent]}>
                  {isPresent ? '✓ வருகை (Present)' : '✕ விடுப்பு (Absent)'}
                </Text>
              </View>

              {existingRecord.submissionTime && (
                <Text style={styles.timestampText}>
                  நேரம்: {existingRecord.submissionTime}
                </Text>
              )}
            </View>

            {existingRecord.remarks ? (
              <Text style={styles.remarksText} numberOfLines={2}>
                குறிப்பு: {existingRecord.remarks}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Lock note & Admin correction link */}
        <View style={styles.lockedFooter}>
          <View style={styles.lockedRow}>
            <Lock size={12} color="#667085" />
            <Text style={styles.lockedNoteText}>
              ஒரு நாளில் ஒரு முறை மட்டுமே வருகை பதிவு செய்ய இயலும் (Recorded once per day).
            </Text>
          </View>

          {onRequestCorrection && (
            <Pressable
              onPress={onRequestCorrection}
              accessibilityRole="button"
              accessibilityLabel="Request attendance correction"
              style={styles.correctionButton}
            >
              <Text style={styles.correctionButtonText}>
                திருத்தம் தேவையா? (Correction Request) ›
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Active Swipe Control Card
  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.staffMeta}>
          <Text style={styles.cardStaffName} numberOfLines={1}>
            {staffName}
          </Text>
          <Text style={styles.cardDesignation} numberOfLines={1}>
            {designation}
          </Text>
        </View>

        <View style={styles.dateBadge}>
          <CalendarCheck size={13} color="#074735" />
          <Text style={styles.dateBadgeText}>{todayDateDisplay}</Text>
        </View>
      </View>

      {/* Swipe Instruction Banner */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
          வலதுபுறம் இழுக்கவும்: <Text style={styles.boldGreen}>வருகை</Text> | இடதுபுறம் இழுக்கவும்:{' '}
          <Text style={styles.boldRed}>விடுப்பு</Text>
        </Text>
        <Text style={styles.instructionSubText}>
          Swipe right for Present • Swipe left for Absent
        </Text>
      </View>

      {/* Swipe Track Container */}
      <View style={styles.trackWrapper}>
        {/* Left Track (Absent Background) */}
        <Animated.View style={[styles.leftTrack, { backgroundColor: leftTrackBg }]}>
          <ChevronLeft size={16} color={dragDirection === 'left' ? '#FFFFFF' : '#B42318'} />
          <Text style={[styles.trackLabel, dragDirection === 'left' && styles.trackLabelActiveWhite]}>
            விடுப்பு (Absent)
          </Text>
        </Animated.View>

        {/* Right Track (Present Background) */}
        <Animated.View style={[styles.rightTrack, { backgroundColor: rightTrackBg }]}>
          <Text style={[styles.trackLabel, dragDirection === 'right' && styles.trackLabelActiveWhite]}>
            வருகை (Present)
          </Text>
          <ChevronRight size={16} color={dragDirection === 'right' ? '#FFFFFF' : '#145C43'} />
        </Animated.View>

        {/* Center Draggable Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: pan }],
            },
          ]}
          {...panResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Daily Attendance Swipe Control: Swipe right to mark Present, swipe left to mark Absent"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#074735" />
          ) : (
            <View style={styles.thumbInner}>
              <Sliders size={18} color="#074735" />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Fallback Tap Buttons for accessibility / non-swipe assistive access */}
      <View style={styles.fallbackTapRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark Absent"
          onPress={() => onSwipeAttendance('absent')}
          disabled={submitting}
          style={styles.fallbackTapButtonAbsent}
        >
          <XCircle size={14} color="#B42318" />
          <Text style={styles.fallbackTapTextAbsent}>விடுப்பு (Absent)</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark Present"
          onPress={() => onSwipeAttendance('present')}
          disabled={submitting}
          style={styles.fallbackTapButtonPresent}
        >
          <CheckCircle2 size={14} color="#145C43" />
          <Text style={styles.fallbackTapTextPresent}>வருகை (Present)</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardConfirmedPresent: {
    backgroundColor: '#F3FAF5',
    borderColor: '#C3E4CD',
  },
  cardConfirmedAbsent: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  staffMeta: {
    flex: 1,
  },
  cardStaffName: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2D25',
  },
  cardDesignation: {
    fontSize: 12,
    color: '#5F7068',
    marginTop: 2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#074735',
  },

  /* Instructions */
  instructionBanner: {
    backgroundColor: '#FAF9F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEAE0',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#344054',
    textAlign: 'center',
  },
  instructionSubText: {
    fontSize: 10,
    color: '#667085',
    marginTop: 2,
    textAlign: 'center',
  },
  boldGreen: {
    color: '#145C43',
    fontWeight: '700',
  },
  boldRed: {
    color: '#B42318',
    fontWeight: '700',
  },

  /* Swipe Track */
  trackWrapper: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F4EFEA',
    borderWidth: 1,
    borderColor: '#E2DDD1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  leftTrack: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 14,
    gap: 4,
  },
  rightTrack: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 14,
    gap: 4,
  },
  trackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475467',
  },
  trackLabelActiveWhite: {
    color: '#FFFFFF',
  },
  thumb: {
    position: 'absolute',
    left: '50%',
    marginLeft: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C6A15B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  thumbInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Fallback Tap Row */
  fallbackTapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  fallbackTapButtonAbsent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE4E2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    gap: 6,
  },
  fallbackTapTextAbsent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B42318',
  },
  fallbackTapButtonPresent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F3EB',
    borderWidth: 1,
    borderColor: '#C2E0CC',
    gap: 6,
  },
  fallbackTapTextPresent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#145C43',
  },

  /* Confirmed State Layout */
  confirmedContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  statusIconBox: {
    marginTop: 2,
  },
  confirmedDetails: {
    flex: 1,
  },
  confirmedTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2D25',
  },
  confirmedSubtitle: {
    fontSize: 12,
    color: '#5F7068',
    marginTop: 1,
  },
  confirmedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  confirmedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillPresent: {
    backgroundColor: '#E8F3EB',
    borderWidth: 1,
    borderColor: '#C2E0CC',
  },
  pillAbsent: {
    backgroundColor: '#FEE4E2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  confirmedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextPresent: {
    color: '#145C43',
  },
  pillTextAbsent: {
    color: '#B42318',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#344054',
  },
  remarksText: {
    fontSize: 11,
    color: '#B42318',
    marginTop: 4,
    fontStyle: 'italic',
  },
  lockedFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedNoteText: {
    flex: 1,
    fontSize: 10.5,
    color: '#667085',
  },
  correctionButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  correctionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#936319',
  },
});
