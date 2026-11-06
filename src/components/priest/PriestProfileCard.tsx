/**
 * PriestProfileCard Component
 * Main Priest Profile Card for Mandhragiri Jothidam.
 *
 * Implements:
 * - Dynamic stats mapping with safe defaults & synchronization.
 * - Profile avatar with fixed 58x58dp pixel dimensions, stable key, and initials fallback.
 * - Senior badge layout preventing title squeeze.
 * - Call button reserved space with active feedback.
 * - Complete un-clipped Tamil titles and traditions with generous line heights.
 * - Aligned phone, expertise, and languages information rows.
 */

import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BadgeCheck,
  CalendarCheck,
  Flame,
  Languages,
  Phone,
  Smartphone,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PriestStaffItem, PriestStats } from '../../types/priest';

interface PriestProfileCardProps {
  priest: PriestStaffItem;
  stats?: PriestStats;
  onPressCall?: () => void;
  onPressAttendance?: (priest: PriestStaffItem) => void;
}

export const PriestProfileCard: React.FC<PriestProfileCardProps> = ({
  priest,
  stats,
  onPressCall,
  onPressAttendance,
}) => {
  const { t } = useTranslation();
  let navigation: any = null;
  try {
    navigation = useNavigation<any>();
  } catch (_e) {
    // Graceful fallback when rendered without NavigationContainer
  }
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  if (!priest) {
    return null;
  }

  const handleCall = () => {
    if (onPressCall) {
      onPressCall();
      return;
    }
    if (priest.phone) {
      Linking.openURL(`tel:${priest.phone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  const handleAttendance = () => {
    if (onPressAttendance) {
      onPressAttendance(priest);
      return;
    }
    if (navigation?.navigate) {
      navigation.navigate('StaffAttendanceDetail', { staffId: priest.id });
    }
  };

  // Safely resolve stats from props or priest object
  const activeStats = stats || priest.stats;
  const totalBookings =
    activeStats?.total ??
    ((priest.tabCounts?.past ?? 0) +
      (priest.tabCounts?.active ?? 0) +
      (priest.tabCounts?.upcoming ?? 0));
  const thisWeekBookings = activeStats?.thisWeek ?? 0;
  const conflictsCount = activeStats?.conflicts ?? 0;

  return (
    <View style={styles.card}>
      {/* 1. Top Section: Avatar, Priest Details, and Reserved Call Button */}
      <View style={styles.topSection}>
        {/* Priest Profile Avatar with explicit pixel dimensions */}
        <View style={styles.avatarContainer}>
          {!hasImageError && priest.avatar ? (
            <Image
              key={`profile-avatar-${priest.id}`}
              source={priest.avatar}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <View style={styles.fallbackAvatar}>
              <Text style={styles.fallbackInitials}>
                {(priest.nameEnglish || priest.nameTamil || 'ST').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Middle Column: Name, Senior Badge, Designation, Tradition, Certification */}
        <View style={styles.infoColumn}>
          {/* Row 1: English Name & Senior Badge */}
          <View style={styles.nameBadgeRow}>
            <Text style={styles.priestName} numberOfLines={1}>
              {priest.nameEnglish}
            </Text>

            {priest.roleBadge && (
              <View style={styles.seniorBadge}>
                <Text style={styles.seniorBadgeText}>{priest.roleBadge}</Text>
              </View>
            )}
          </View>

          {/* Row 2: Full Tamil Designation / Title (Generous line height, no clipping) */}
          <Text style={styles.fullTitleText}>
            {priest.fullTitleTamil}
          </Text>

          {/* Row 3: Tradition / Subtitle */}
          <Text style={styles.traditionText} numberOfLines={1}>
            {priest.traditionTamil}
            {priest.traditionEnglish ? ` • ${priest.traditionEnglish}` : ''}
          </Text>

          {/* Row 4: Certification Row */}
          <View style={styles.certificationRow}>
            <BadgeCheck size={14} color="#C6A15B" style={styles.certIcon} />
            <Text style={styles.certificationText} numberOfLines={2}>
              {priest.certificationTamil}
              {priest.certificationEnglish ? ` • ${priest.certificationEnglish}` : ''}
            </Text>
          </View>
        </View>

        {/* Right Column: Reserved Action Buttons (Attendance & Call) */}
        <View style={styles.actionColumn}>
          <Pressable
            onPress={handleAttendance}
            style={({ pressed }) => [
              styles.attendanceButton,
              pressed && styles.actionButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View attendance for ${priest.nameEnglish}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CalendarCheck size={18} color="#074735" />
          </Pressable>

          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.callButton,
              pressed && styles.actionButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${priest.nameEnglish}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Phone size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* 2. Statistics Grid: 3 Equal-Width Columns */}
      <View style={styles.statsRow}>
        {/* Column 1: Total Bookings */}
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalBookings}</Text>
          <Text style={styles.statLabel}>{t('priest.stats.total')}</Text>
        </View>

        {/* Column 2: This Week's Bookings (Highlighted with Gold border) */}
        <View style={[styles.statBox, styles.statBoxHighlighted]}>
          <Text style={[styles.statNumber, styles.statNumberHighlighted]}>
            {thisWeekBookings}
          </Text>
          <Text style={[styles.statLabel, styles.statLabelHighlighted]}>
            {t('priest.stats.thisWeek')}
          </Text>
        </View>

        {/* Column 3: Conflict Count */}
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{conflictsCount}</Text>
          <Text style={styles.statLabel}>{t('priest.stats.conflicts')}</Text>
        </View>
      </View>


      {/* 3. Information Rows: Phone, Expertise, Languages */}
      <View style={styles.detailsContainer}>
        {/* Phone Number Pill */}
        <View style={styles.detailPill}>
          <Smartphone size={15} color="#074735" />
          <Text style={styles.detailText}>{priest.phoneDisplay}</Text>
        </View>

        {/* Expertise / Ritual Pill */}
        <View style={styles.detailPill}>
          <Flame size={15} color="#B45309" />
          <Text style={styles.detailText}>{priest.expertiseTamil}</Text>
        </View>

        {/* Languages Pill */}
        <View style={styles.detailPill}>
          <Languages size={15} color="#074735" />
          <Text style={styles.detailText}>{priest.languagesTamil}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  fallbackAvatar: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#074735',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FCD34D',
  },
  infoColumn: {
    flex: 1,
    marginHorizontal: 12,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  priestName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
    lineHeight: 22,
  },
  seniorBadge: {
    backgroundColor: '#FEF3C7', // Soft warm yellow
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  seniorBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309', // Dark amber
    letterSpacing: 0.5,
  },
  fullTitleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#074735', // Brand forest green
    marginTop: 1,
  },
  traditionText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#4B5563',
    marginTop: 2,
  },
  certificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  certIcon: {
    marginRight: 4,
  },
  certificationText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#065F46',
    fontWeight: '600',
    flexShrink: 1,
  },
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  attendanceButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F3EB',
    borderWidth: 1,
    borderColor: '#C2E0CC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#074735',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBoxHighlighted: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A', // Gold border accent
    borderWidth: 1.5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
    lineHeight: 28,
  },
  statNumberHighlighted: {
    color: '#B45309', // Warm amber highlight
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  statLabelHighlighted: {
    color: '#1F2937',
    fontWeight: '700',
  },
  detailsContainer: {
    marginTop: 12,
    gap: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F2F24',
    marginLeft: 8,
    lineHeight: 17,
  },
});
