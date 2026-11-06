/**
 * ProfileScreen Component (நிர்வாகி சுயவிவரம்)
 *
 * Mandhiragiri Jothidam Admin & Chief Officiant Profile Screen:
 * 1. Clean, simplified layout focusing strictly on relevant profile details:
 *    - Admin Number / ID
 *    - Name
 *    - Email Address
 *    - Address
 *    - Profile Image (Device camera or photo library upload)
 * 2. Real Profile Image Upload from Camera or Gallery (no predefined avatars).
 * 3. Profile Editing modal allowing admin to update details and upload/replace profile photo.
 * 4. Secure Logout functionality with session revocation and token cleanup.
 * 5. Standardized Top Header matching ScheduleHeader, PriestHeader & SettingsHeader.
 * 6. Full bilingual support (Tamil & English) in Vedic green, cream, and gold theme.
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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Edit3,
  LogOut,
  Mail,
  MapPin,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from 'lucide-react-native';
import { ASSETS } from '../../constants/assets';
import { DashboardBottomNav } from '../../components/dashboard/DashboardBottomNav';
import { ImageUploadSheetModal } from '../../components/common/ImageUploadSheetModal';
import { ProfileScreenNavigationProp } from '../../types/navigation';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth/authService';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { t, i18n } = useTranslation();

  const isTamil = (i18n.language || 'ta').startsWith('ta');

  // Admin Profile Details
  const [adminId, setAdminId] = useState<string>('ADM-2026-108');
  const [adminNameTamil, setAdminNameTamil] = useState<string>('சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்');
  const [adminNameEnglish, setAdminNameEnglish] = useState<string>('Sundaramoorthy Gurukkal');
  const [adminEmail, setAdminEmail] = useState<string>('mandhragiri.jothidam@gmail.com');
  const [adminAddressTamil, setAdminAddressTamil] = useState<string>(
    'எண். 14, மீனாட்சி சுந்தரேஸ்வரர் சன்னதி தெரு, மதுரை - 625001'
  );
  const [adminAddressEnglish, setAdminAddressEnglish] = useState<string>(
    'No. 14, Meenakshi Sundareswarar Sannathi Street, Madurai - 625001'
  );

  // Uploaded Profile Photo (actual device image URI)
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [isUploadSheetVisible, setIsUploadSheetVisible] = useState<boolean>(false);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [draftId, setDraftId] = useState<string>(adminId);
  const [draftNameTamil, setDraftNameTamil] = useState<string>(adminNameTamil);
  const [draftNameEnglish, setDraftNameEnglish] = useState<string>(adminNameEnglish);
  const [draftEmail, setDraftEmail] = useState<string>(adminEmail);
  const [draftAddress, setDraftAddress] = useState<string>(
    isTamil ? adminAddressTamil : adminAddressEnglish
  );
  const [draftImageUri, setDraftImageUri] = useState<string | null>(uploadedImageUri);

  const bottomNavHeight = 56 + Math.max(insets.bottom, 8);

  // Profile image source
  const profileImageSource = uploadedImageUri
    ? { uri: uploadedImageUri }
    : ASSETS.images.priests.sundaram;

  const draftImageSource = draftImageUri
    ? { uri: draftImageUri }
    : ASSETS.images.priests.sundaram;

  const handleOpenEditModal = () => {
    setDraftId(adminId);
    setDraftNameTamil(adminNameTamil);
    setDraftNameEnglish(adminNameEnglish);
    setDraftEmail(adminEmail);
    setDraftAddress(isTamil ? adminAddressTamil : adminAddressEnglish);
    setDraftImageUri(uploadedImageUri);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!draftNameTamil.trim() && !draftNameEnglish.trim()) {
      Alert.alert(
        t('common.error', 'பிழை'),
        isTamil ? 'பெயரை உள்ளிடவும்.' : 'Please enter your name.'
      );
      return;
    }

    setAdminId(draftId.trim() || 'ADM-2026-108');
    if (draftNameTamil.trim()) setAdminNameTamil(draftNameTamil.trim());
    if (draftNameEnglish.trim()) setAdminNameEnglish(draftNameEnglish.trim());
    setAdminEmail(draftEmail.trim());
    if (isTamil) {
      setAdminAddressTamil(draftAddress.trim());
    } else {
      setAdminAddressEnglish(draftAddress.trim());
    }
    setUploadedImageUri(draftImageUri);

    setIsEditModalVisible(false);
    Alert.alert(
      t('common.success', 'வெற்றி'),
      t('profile.editSuccess', 'சுயவிவரத் தகவல்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன.')
    );
  };

  // Direct image upload from main profile screen
  const handleDirectSelectImage = (uri: string) => {
    setUploadedImageUri(uri);
    setDraftImageUri(uri);
  };

  const handleDirectRemoveImage = () => {
    setUploadedImageUri(null);
    setDraftImageUri(null);
  };

  // Image selection inside edit modal
  const handleModalSelectImage = (uri: string) => {
    setDraftImageUri(uri);
  };

  const handleModalRemoveImage = () => {
    setDraftImageUri(null);
  };

  // Logout handler with full session and token cleanup
  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutTitle', 'வெளியேறு (Sign Out)'),
      t(
        'profile.signOutConfirm',
        'நிர்வாக கணக்கிலிருந்து நிச்சயமாக வெளியேற விரும்புகிறீர்களா?'
      ),
      [
        { text: t('common.cancel', 'ரத்து'), style: 'cancel' },
        {
          text: t('profile.signOutYes', 'ஆம், வெளியேறு'),
          style: 'destructive',
          onPress: async () => {
            await authService.logout({
              lang: isTamil ? 'ta' : 'en',
            });
            try {
              if (!navigation?.isReady || navigation.isReady()) {
                navigation?.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              }
            } catch {
              // Non-fatal if navigation is unmounting
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Top Safe Area Spacer */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* 1. Standardized Top Header matching ScheduleHeader, PriestHeader & SettingsHeader */}
      <View style={styles.headerContainer}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack', 'Go back')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('profile.title', 'நிர்வாகி சுயவிவரம்')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('profile.subtitle', 'Admin & Chief Officiant')}
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title', 'அமைப்புகள்')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Settings size={20} color="#074735" />
        </Pressable>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Profile Card with Uploaded Photo & Badges */}
        <View style={styles.heroCard}>
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setIsUploadSheetVisible(true)}
              style={styles.avatarWrapper}
              accessibilityRole="button"
              accessibilityLabel={t('imageUpload.uploadPhoto', 'Upload Profile Photo')}
            >
              <Image
                source={profileImageSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={styles.verifiedBadge}>
                <Check size={13} color="#FFFFFF" strokeWidth={3} />
              </View>

              <View style={styles.cameraBadge}>
                <Camera size={13} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Pressable>

            {/* Change / Upload Photo Pill */}
            <Pressable
              onPress={() => setIsUploadSheetVisible(true)}
              style={styles.changePhotoPill}
              accessibilityRole="button"
              accessibilityLabel={t('imageUpload.changePhoto', 'Change Photo')}
            >
              <Camera size={13} color="#074735" />
              <Text style={styles.changePhotoText}>
                {uploadedImageUri
                  ? t('imageUpload.changePhoto', 'படம் மாற்றுக')
                  : t('imageUpload.uploadPhoto', 'புகைப்படம் பதிவேற்றுக')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.heroName}>
            {isTamil ? adminNameTamil : adminNameEnglish}
          </Text>
          <Text style={styles.heroSubname}>
            {isTamil ? adminNameEnglish : adminNameTamil}
          </Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {t('profile.chiefAdmin', 'முதன்மை நிர்வாகி')}
              </Text>
            </View>

            <View style={styles.adminIdBadge}>
              <Text style={styles.adminIdBadgeText}>ID: {adminId}</Text>
            </View>
          </View>
        </View>

        {/* 3. Relevant Profile Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionPill} />
              <Text style={styles.sectionTitle}>
                {t('profile.detailsSectionTitle', 'சுயவிவர விவரங்கள்')}
              </Text>
            </View>
            <Text style={styles.sectionSubTitleText}>
              {t('profile.detailsSectionSubtitle', 'Credentials & Contact')}
            </Text>
          </View>

          <View style={styles.cardGroup}>
            {/* 3.1 Admin Number / ID */}
            <View style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <ShieldCheck size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>
                  {t('profile.adminIdLabel', 'நிர்வாக எண் (Admin ID)')}
                </Text>
                <Text style={styles.itemValue}>{adminId}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3.2 Name */}
            <View style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <User size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>
                  {t('profile.nameLabel', 'பெயர்')}
                </Text>
                <Text style={styles.itemValue}>
                  {isTamil ? adminNameTamil : adminNameEnglish}
                </Text>
                <Text style={styles.itemSubvalue}>
                  {isTamil ? adminNameEnglish : adminNameTamil}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3.3 Email Address */}
            <View style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <Mail size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>
                  {t('profile.emailLabel', 'மின்னஞ்சல் முகவரி')}
                </Text>
                <Text style={styles.itemValue}>{adminEmail}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3.4 Address */}
            <View style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <MapPin size={18} color="#074735" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>
                  {t('profile.addressLabel', 'முகவரி')}
                </Text>
                <Text style={styles.itemValue}>
                  {isTamil ? adminAddressTamil : adminAddressEnglish}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Edit Profile Button */}
        <Pressable
          onPress={handleOpenEditModal}
          style={({ pressed }) => [
            styles.editProfileButton,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('profile.updateDetails', 'விவரங்களை புதுப்பி')}
        >
          <Edit3 size={17} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.editProfileButtonText}>
            {t('profile.updateDetails', 'விவரங்களை புதுப்பி')}
          </Text>
        </Pressable>

        {/* 5. Account & Security: Logout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionPill, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.sectionTitle}>
                {t('profile.securitySectionTitle', 'கணக்கு & பாதுகாப்பு')}
              </Text>
            </View>
            <Text style={[styles.sectionSubTitleText, { color: '#DC2626' }]}>
              {t('profile.securitySectionSubtitle', 'Active Session')}
            </Text>
          </View>

          <View style={styles.cardGroup}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('profile.signOut', 'வெளியேறு (Sign Out)')}
            >
              <View style={styles.logoutIconBox}>
                <LogOut size={18} color="#DC2626" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.logoutTitle}>
                  {t('profile.signOut', 'வெளியேறு (Sign Out)')}
                </Text>
                <Text style={styles.logoutSubtitle} numberOfLines={1}>
                  {t('profile.signOutSub', 'நிர்வாக அமர்விலிருந்து பாதுகாப்பாக வெளியேற')}
                </Text>
              </View>
              <ChevronRight size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 6. Profile Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editDialogCard}>
            <View style={styles.modalHeaderRow}>
              <Edit3 size={19} color="#074735" />
              <Text style={styles.editDialogTitle}>
                {t('profile.editModalTitle', 'சுயவிவர விவரங்களை புதுப்பிக்க')}
              </Text>
            </View>
            <Text style={styles.editDialogSubtitle}>
              {t('profile.editModalSubtitle', 'நிர்வாக தொடர்பு விவரங்களை மாற்றலாம்')}
            </Text>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Image Upload Field inside Edit Modal */}
              <View style={styles.modalPhotoSection}>
                <Image
                  source={draftImageSource}
                  style={styles.modalAvatarPreview}
                  resizeMode="cover"
                />

                <View style={styles.modalPhotoActions}>
                  <Pressable
                    onPress={() => setIsUploadSheetVisible(true)}
                    style={styles.modalUploadButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('imageUpload.uploadPhoto', 'Upload Photo')}
                  >
                    <Upload size={14} color="#074735" strokeWidth={2.2} />
                    <Text style={styles.modalUploadButtonText}>
                      {draftImageUri
                        ? t('imageUpload.changePhoto', 'படம் மாற்றுக')
                        : t('imageUpload.uploadPhoto', 'புகைப்படம் பதிவேற்றுக')}
                    </Text>
                  </Pressable>

                  {draftImageUri && (
                    <Pressable
                      onPress={handleModalRemoveImage}
                      style={styles.modalRemoveButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('imageUpload.remove', 'Remove')}
                    >
                      <Trash2 size={14} color="#DC2626" />
                      <Text style={styles.modalRemoveButtonText}>
                        {t('imageUpload.remove', 'நீக்குக')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Form Input Fields */}
              <Text style={styles.inputLabel}>
                {t('profile.adminIdLabel', 'நிர்வாக எண் (Admin ID)')}
              </Text>
              <TextInput
                style={styles.textInput}
                value={draftId}
                onChangeText={setDraftId}
                placeholder="ADM-2026-108"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('profile.nameTamilLabel', 'பெயர் (தமிழ்)')}
              </Text>
              <TextInput
                style={styles.textInput}
                value={draftNameTamil}
                onChangeText={setDraftNameTamil}
                placeholder="சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('profile.nameEnglishLabel', 'Name in English')}
              </Text>
              <TextInput
                style={styles.textInput}
                value={draftNameEnglish}
                onChangeText={setDraftNameEnglish}
                placeholder="Sundaramoorthy Gurukkal"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('profile.emailLabel', 'மின்னஞ்சல் முகவரி')}
              </Text>
              <TextInput
                style={styles.textInput}
                value={draftEmail}
                onChangeText={setDraftEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="mandhragiri.jothidam@gmail.com"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('profile.addressLabel', 'முகவரி')}
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={draftAddress}
                onChangeText={setDraftAddress}
                multiline
                numberOfLines={3}
                placeholder="முகவரி..."
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={styles.dialogButtonRow}>
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                style={styles.dialogCancelButton}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel', 'ரத்து')}</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveProfile}
                style={styles.dialogSaveButton}
                accessibilityRole="button"
                accessibilityLabel={t('profile.editModalSave', 'மாற்றங்களைச் சேமிக்க')}
              >
                <Text style={styles.dialogSaveText}>
                  {t('profile.editModalSave', 'மாற்றங்களைச் சேமிக்க')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Image Upload Source Sheet Modal (Camera / Gallery) */}
      <ImageUploadSheetModal
        visible={isUploadSheetVisible}
        onClose={() => setIsUploadSheetVisible(false)}
        onSelectImage={isEditModalVisible ? handleModalSelectImage : handleDirectSelectImage}
        onRemoveImage={isEditModalVisible ? handleModalRemoveImage : handleDirectRemoveImage}
        hasImage={isEditModalVisible ? !!draftImageUri : !!uploadedImageUri}
      />

      {/* 8. Bottom Navigation with active 'settings' tab */}
      <DashboardBottomNav
        activeTab="settings"
        onTabPress={tabId => {
          if (tabId === 'home') {
            navigation.navigate('Dashboard');
          } else if (tabId === 'date') {
            navigation.navigate('DailySchedule');
          } else if (tabId === 'priest') {
            navigation.navigate('Priest');
          } else if (tabId === 'settings' || tabId === 'profile') {
            navigation.navigate('Settings');
          }
        }}
      />
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
  headerIconButton: {
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
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: '#C6A15B',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#074735',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6ECE9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1DDD6',
    marginTop: 2,
  },
  changePhotoText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F2F24',
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubname: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  roleBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  adminIdBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adminIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    paddingHorizontal: 14,
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
    marginRight: 6,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  itemSubvalue: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
    marginTop: 1,
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    lineHeight: 18,
  },
  logoutSubtitle: {
    fontSize: 11,
    color: '#EF4444',
    lineHeight: 15,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#074735',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C6A15B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editDialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#074735',
  },
  editDialogSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 12,
  },
  modalScrollView: {
    maxHeight: 380,
  },
  modalPhotoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 14,
  },
  modalAvatarPreview: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#C6A15B',
  },
  modalPhotoActions: {
    flex: 1,
    gap: 6,
  },
  modalUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6ECE9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1DDD6',
  },
  modalUploadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalRemoveButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  dialogButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dialogSaveButton: {
    flex: 1.3,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#074735',
    borderWidth: 1,
    borderColor: '#C6A15B',
  },
  dialogSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
