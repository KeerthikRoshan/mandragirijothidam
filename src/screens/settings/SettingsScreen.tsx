/**
 * SettingsScreen Component (அமைப்புகள்)
 *
 * Implements the Mandhragiri Jothidam Settings screen:
 * 1. Top App Header matching other screens (ScheduleHeader & PriestHeader layout).
 * 2. Chief Administrator Profile Card with verified badge and navigation to ProfileScreen.
 * 3. 3-Column Metrics Row (Today's Pooja, Horoscope Bookings, Reminders Sent).
 * 4. Section 1: நிர்வாகம் & செயல்பாடுகள் (Administration & Operations).
 * 5. Section 2: செயலி & நிறுவனம் (App & Organization - 3 items).
 * 6. Traditional Vedic blessing footer and calculation verification.
 * 7. Bottom Navigation with active 'settings' (அமைப்புகள்) tab.
 */

import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Languages,
  Mail,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { ASSETS } from '../../constants/assets';
import { TempleGopuramIcon } from '../../components/common/TempleGopuramIcon';
import { SettingsHeader } from '../../components/settings/SettingsHeader';
import { DashboardBottomNav } from '../../components/dashboard/DashboardBottomNav';
import { SettingsScreenNavigationProp } from '../../types/navigation';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, SupportedLanguage } from '../../i18n';
import { authService } from '../../services/auth/authService';
import { PriestAssistantControlModal } from '../../components/settings/PriestAssistantControlModal';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { t, i18n } = useTranslation();

  // Interactive settings state connected to i18n
  const selectedLanguage = (i18n.language as SupportedLanguage) || 'ta';
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState<boolean>(false);
  const [isPriestControlModalVisible, setIsPriestControlModalVisible] = useState<boolean>(false);


  const bottomNavHeight = 56 + Math.max(insets.bottom, 8);

  const handleReminderManagement = () => {
    Alert.alert(
      t('settings.alerts.remindersTitle', 'நினைவூட்டல் மேலாண்மை'),
      t(
        'settings.alerts.remindersMessage',
        'வாடிக்கையாளர்களுக்கான வாட்ஸ்அப் / எஸ்.எம்.எஸ் நினைவூட்டல் தானியங்கி சேவை செயலில் உள்ளது (99% வெற்றி விகிதம்).'
      )
    );
  };

  const handleReports = () => {
    Alert.alert(
      t('settings.alerts.reportsTitle', 'அறிக்கைகள் & புள்ளிவிவரம்'),
      t(
        'settings.alerts.reportsMessage',
        'நடப்பு மாத முன்பதிவுகள்: 142\nநிறைவடைந்த பூஜைகள்: 128\nவருமானம் & கட்டண வசூல் அறிக்கை தயார் நிலையில் உள்ளது.'
      )
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Top Safe Area Spacer */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Standardized Header matching ScheduleHeader and PriestHeader */}
      <SettingsHeader
        onPressBack={() => navigation.navigate('Dashboard')}
        onPressProfile={() => navigation.navigate('Profile')}
      />

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Chief Administrator Profile Card */}
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => [
            styles.profileCard,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('settings.profileCardTitle')}
        >
          {/* Avatar with Verified Tick */}
          <View style={styles.avatarWrapper}>
            <Image
              source={ASSETS.images.priests.sundaram}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            <View style={styles.verifiedBadge}>
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>

          {/* Details */}
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {t('settings.profileCardName')}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{t('settings.profileCardRole')}</Text>
              </View>
            </View>

            <View style={styles.organizationRow}>
              <TempleGopuramIcon size={14} color="#074735" />
              <Text style={styles.organizationText} numberOfLines={1}>
                {t('settings.profileOrganization')}
              </Text>
            </View>

            <Text style={styles.idLocationText}>
              {t('settings.profileIdLocation')}
            </Text>
          </View>

          <ChevronRight size={18} color="#94A3B8" />
        </Pressable>

        {/* 3. Metrics 3-Column Row */}
        <View style={styles.metricsRow}>
          {/* Metric 1: Today's Pooja */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{t('settings.metricPooja')}</Text>
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricSubtextGreen}>{t('settings.metricPoojaSub')}</Text>
          </View>

          {/* Metric 2: Horoscope Bookings */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{t('settings.metricHoroscope')}</Text>
            <Text style={styles.metricValue}>142</Text>
            <Text style={styles.metricSubtextGold}>{t('settings.metricHoroscopeSub')}</Text>
          </View>

          {/* Metric 3: Reminders Sent */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{t('settings.metricReminders')}</Text>
            <Text style={styles.metricValueGold}>99%</Text>
            <Text style={styles.metricSubtextGray}>{t('settings.metricRemindersSub')}</Text>
          </View>
        </View>

        {/* 4. Section 1: நிர்வாகம் & செயல்பாடுகள் (4 பிரிவுகள்) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionPill} />
              <Text style={styles.sectionTitle}>{t('settings.section1Title')}</Text>
            </View>
            <Text style={styles.sectionCountText}>{t('settings.section1Count')}</Text>
          </View>

          <View style={styles.cardGroup}>
            {/* 1.1 வருகை மேலாண்மை (Attendance Management) */}
            <Pressable
              onPress={() => (navigation as any).navigate('AttendanceManagement')}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.itemAttendance')}, ${t('settings.itemAttendanceSub')}`}
            >
              <View style={styles.itemIconBox}>
                <CalendarCheck size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemAttendance')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemAttendanceSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            {/* 1.2 நினைவூட்டல் மேலாண்மை */}
            <Pressable
              onPress={handleReminderManagement}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
            >
              <View style={styles.itemIconBox}>
                <Mail size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemReminders')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemRemindersSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            {/* 1.3 புரோகிதர் & உதவியாளர் கட்டுப்பாடு (Priest & Assistant Control) */}
            <Pressable
              onPress={() => setIsPriestControlModalVisible(true)}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.itemStaff')}, ${t('settings.itemStaffSub')}`}
            >
              <View style={styles.itemIconBox}>
                <Users size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemStaff')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemStaffSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            {/* 1.4 பணியாளர் விடுப்பு விண்ணப்பங்கள் (Staff Leave Requests) */}
            <Pressable
              onPress={() => (navigation as any).navigate('AdminLeaveManagement')}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.itemLeaveRequests')}, ${t('settings.itemLeaveRequestsSub')}`}
            >
              <View style={styles.itemIconBox}>
                <FileText size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemLeaveRequests')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemLeaveRequestsSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* 5. Section 2: செயலி & நிறுவனம் (பொது அமைப்புகள்) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionPill} />
              <Text style={styles.sectionTitle}>{t('settings.section3Title')}</Text>
            </View>
            <Text style={styles.sectionSubTitleText}>{t('settings.section3Sub')}</Text>
          </View>

          <View style={styles.cardGroup}>
            {/* 3.1 மொழி அமைப்புகள் */}
            <Pressable
              onPress={() => setIsLanguageModalVisible(true)}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
            >
              <View style={styles.itemIconBox}>
                <Languages size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemLanguage')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemLanguageSub')}
                </Text>
              </View>
              <Text style={styles.valueText}>
                {selectedLanguage === 'ta' ? 'தமிழ்' : 'English'}
              </Text>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            {/* 3.2 நிறுவன சுயவிவரம் */}
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
            >
              <View style={styles.itemIconBox}>
                <Building2 size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemOrganization')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemOrganizationSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            {/* 3.3 அறிக்கைகள் & புள்ளிவிவரம் */}
            <Pressable
              onPress={handleReports}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
            >
              <View style={styles.itemIconBox}>
                <TrendingUp size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {t('settings.itemReports')}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {t('settings.itemReportsSub')}
                </Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* 8. Traditional Vedic Blessing Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.blessingRow}>
            <Text style={styles.blessingIcon}>🕉</Text>
            <Text style={styles.blessingText}>
              {t('settings.blessingText')}
            </Text>
            <Text style={styles.blessingIcon}>🕉</Text>
          </View>
          <Text style={styles.versionText}>
            {t('settings.versionText')}
          </Text>
          <Text style={styles.verifiedComputationText}>
            {t('settings.verifiedComputationText')}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Globe size={20} color="#074735" />
              <Text style={styles.dialogTitle}>{t('settings.languageModalTitle')}</Text>
            </View>

            <Pressable
              onPress={async () => {
                await setAppLanguage('ta');
                setIsLanguageModalVisible(false);
              }}
              style={[
                styles.dialogOption,
                selectedLanguage === 'ta' && styles.dialogOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.dialogOptionText,
                  selectedLanguage === 'ta' && styles.dialogOptionTextSelected,
                ]}
              >
                {t('settings.optionTamil')}
              </Text>
              {selectedLanguage === 'ta' && <Check size={18} color="#074735" />}
            </Pressable>

            <Pressable
              onPress={async () => {
                await setAppLanguage('en');
                setIsLanguageModalVisible(false);
              }}
              style={[
                styles.dialogOption,
                selectedLanguage === 'en' && styles.dialogOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.dialogOptionText,
                  selectedLanguage === 'en' && styles.dialogOptionTextSelected,
                ]}
              >
                {t('settings.optionEnglish')}
              </Text>
              {selectedLanguage === 'en' && <Check size={18} color="#074735" />}
            </Pressable>

            <Pressable
              onPress={() => setIsLanguageModalVisible(false)}
              style={styles.dialogCloseButton}
            >
              <Text style={styles.dialogCloseText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Priest & Assistant Control Modal */}
      <PriestAssistantControlModal
        visible={isPriestControlModalVisible}
        onClose={() => setIsPriestControlModalVisible(false)}
      />

      {/* Bottom Navigation with active 'settings' tab */}
      <DashboardBottomNav
        activeTab="settings"
        onTabPress={tabId => {
          if (tabId === 'home') {
            navigation.navigate('Dashboard');
          } else if (tabId === 'date') {
            navigation.navigate('DailySchedule');
          } else if (tabId === 'priest') {
            navigation.navigate('Priest');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white Vedic theme matching Dashboard, DailySchedule & Priest
  },
  topSafeArea: {
    backgroundColor: '#FAF9F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#C6A15B',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
  },
  roleBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#065F46',
  },
  organizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  organizationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 5,
  },
  idLocationText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#074735',
    marginVertical: 2,
  },
  metricValueGold: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B45309',
    marginVertical: 2,
  },
  metricSubtextGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  metricSubtextGold: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  metricSubtextGray: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionPill: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#074735',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F2F24',
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionSubTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C6D23',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  itemRowPressed: {
    backgroundColor: '#F8FAF9',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 1,
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
    marginRight: 6,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 10,
  },
  blessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  blessingIcon: {
    fontSize: 12,
    color: '#C6A15B',
    marginHorizontal: 4,
  },
  blessingText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8C6D23',
    letterSpacing: 0.3,
  },
  versionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 3,
  },
  verifiedComputationText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dialogTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#074735',
  },
  dialogOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogOptionSelected: {
    backgroundColor: '#E6F4EA',
    borderColor: '#A7D7C5',
  },
  dialogOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  dialogOptionTextSelected: {
    color: '#074735',
    fontWeight: '700',
  },
  dialogCloseButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#074735',
    borderRadius: 10,
  },
  dialogCloseText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
