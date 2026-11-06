/**
 * AddPriestModal Component
 * Bottom-Up Registration Modal to add a new Priest or Assistant (புதிய புரோகிதர் சேர்க்க).
 *
 * Implements the application's established design system:
 * - Vedic forest green (#074735) branding, gold accents (#C6A15B), off-white backgrounds (#FAF9F6).
 * - Smooth slide-up presentation with translucent backdrop and top dismiss handle.
 * - Interactive chips for designation and role badge selection.
 * - Form validation with error message banner.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  LayoutAnimation,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Eye, EyeOff, Trash2, UserPlus, X } from 'lucide-react-native';
import { PriestStaffItem } from '../../types/priest';
import { useTranslation } from 'react-i18next';
import { ImageUploadSheetModal } from '../common/ImageUploadSheetModal';
import { CreateStaffRequest, staffService } from '../../services/staffService';
import { showToast } from '../common/AppToast';

interface AddPriestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newPriest: PriestStaffItem) => void;
}

export const AddPriestModal: React.FC<AddPriestModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { t } = useTranslation();

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldLayouts = useRef<{ [key: string]: number }>({});
  const activeFieldRef = useRef<string | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Form State
  const [nameEnglish, setNameEnglish] = useState<string>('');
  const [nameTamil, setNameTamil] = useState<string>('');
  const [role, setRole] = useState<string>('Priest');
  const [designation, setDesignation] = useState<string>('புரோகிதர்');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [expertiseTamil, setExpertiseTamil] =
    useState<string>('ஹோமம் & சிறப்பு பூஜை');
  const [traditionTamil, setTraditionTamil] =
    useState<string>('வேத சைவ ஆகமம்');
  const [certificationTamil, setCertificationTamil] =
    useState<string>('அங்கீகரிக்கப்பட்ட கள குரு');
  const [languagesTamil, setLanguagesTamil] =
    useState<string>('தமிழ் & சமஸ்கிருதம்');
  const [email, setEmail] = useState<string>('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadSheetVisible, setIsUploadSheetVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollToField = (fieldKey: string, delay: number = 60) => {
    setTimeout(() => {
      const y = fieldLayouts.current[fieldKey];
      if (typeof y === 'number' && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, y - 16),
          animated: true,
        });
      }
    }, delay);
  };

  const handleFieldFocus = (fieldKey: string) => {
    activeFieldRef.current = fieldKey;
    scrollToField(fieldKey);
  };

  const handleFieldLayout = (fieldKey: string) => (event: LayoutChangeEvent) => {
    fieldLayouts.current[fieldKey] = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const onKeyboardShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height || 0;
      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);

      if (activeFieldRef.current) {
        scrollToField(activeFieldRef.current, Platform.OS === 'ios' ? 100 : 60);
      }
    };

    const onKeyboardHide = () => {
      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      activeFieldRef.current = null;
    };

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const resetForm = () => {
    setNameEnglish('');
    setNameTamil('');
    setRole('Priest');
    setDesignation('புரோகிதர்');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    setExpertiseTamil('ஹோமம் & சிறப்பு பூஜை');
    setTraditionTamil('வேத சைவ ஆகமம்');
    setCertificationTamil('அங்கீகரிக்கப்பட்ட கள குரு');
    setLanguagesTamil('தமிழ் & சமஸ்கிருதம்');
    setEmail('');
    setAvatarUri(null);
    setIsUploadSheetVisible(false);
    setIsSubmitting(false);
    setErrorMessage(null);
    activeFieldRef.current = null;
  };

  const handleClose = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (isSubmitting) return;

    if (!nameEnglish.trim()) {
      setErrorMessage(t('priest.modal.nameEnglishRequired', 'புரோகிதரின் ஆங்கிலப் பெயரை உள்ளிடவும் (English Name is required).'));
      return;
    }

    if (!nameTamil.trim()) {
      setErrorMessage(t('priest.modal.nameTamilRequired', 'புரோகிதரின் தமிழ்ப் பெயரை உள்ளிடவும் (Tamil Name is required).'));
      return;
    }

    if (!role.trim()) {
      setErrorMessage(t('priest.modal.roleRequired', 'பணியாளர் வகையை உள்ளிடவும் (Role is required).'));
      return;
    }

    if (!designation.trim()) {
      setErrorMessage(t('priest.modal.designationRequired', 'பதவியை உள்ளிடவும் (Designation is required).'));
      return;
    }

    if (!phone.trim()) {
      setErrorMessage(t('priest.modal.phoneRequired', 'கைபேசி எண்ணை உள்ளிடவும் (Phone number is required).'));
      return;
    }

    if (!password.trim()) {
      setErrorMessage(t('priest.modal.passwordRequired', 'பணியாளர் கடவுச்சொல்லை உள்ளிடவும் (Staff password is required).'));
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage(t('priest.modal.passwordLength', 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும் (Password must be at least 4 characters).'));
      return;
    }

    const cleanPhone = phone.trim();
    const roleClean = role.trim();
    const designationClean = designation.trim();

    const payload: CreateStaffRequest = {
      name_english: nameEnglish.trim(),
      name_tamil: nameTamil.trim(),
      staff_role: roleClean,
      designation: designationClean,
      phone: cleanPhone,
      password: password.trim(),
      tradition: traditionTamil.trim() || 'சைவ ஆகமம் & வேத நெறி',
      expertise: expertiseTamil.trim() || 'விவாஹம், நவகிரக சாந்தி & மகா ருத்ர ஹோமம்',
      certification: certificationTamil.trim() || 'சிவநெறி ஆகம பிரவீண குரு',
      languages_spoken: languagesTamil.trim() || 'தமிழ், சமஸ்கிருதம், ஆங்கிலம்',
      avatar_url: avatarUri || null,
      email: email.trim() || undefined,

      // camelCase aliases for backend support
      nameEnglish: nameEnglish.trim(),
      nameTamil: nameTamil.trim(),
      staffRole: roleClean,
      languagesSpoken: languagesTamil.trim() || 'தமிழ், சமஸ்கிருதம், ஆங்கிலம்',
      avatarUrl: avatarUri || null,
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await staffService.createStaff(payload);
      if (result.success && result.data) {
        showToast({
          type: 'success',
          message: result.message || t('priest.modal.createSuccess', 'புரோகிதர் வெற்றிகரமாக சேர்க்கப்பட்டார்.'),
        });
        onSubmit(result.data);
        resetForm();
      } else {
        const errorMsg = result.message || t('priest.modal.createError', 'புரோகிதர் சேர்க்க முடியவில்லை.');
        setErrorMessage(errorMsg);
        showToast({
          type: 'error',
          message: errorMsg,
        });
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    } catch (_err) {
      const genericError = t('priest.modal.genericError', 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
      setErrorMessage(genericError);
      showToast({
        type: 'error',
        message: genericError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const topBuffer = insets.top + 16;
  const maxModalHeight = isKeyboardVisible
    ? Math.max(260, windowHeight - keyboardHeight - topBuffer)
    : Math.min(windowHeight * 0.90, windowHeight - topBuffer);

  const nonScrollHeight = errorMessage ? 195 : 155;
  const maxScrollHeight = isKeyboardVisible
    ? Math.max(120, maxModalHeight - nonScrollHeight)
    : 440;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdropDismiss}
          onPress={() => {
            Keyboard.dismiss();
            handleClose();
          }}
        />

        <View
          style={[
            styles.modalContent,
            {
              maxHeight: maxModalHeight,
              paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleBox}>
              <View style={styles.headerIconCircle}>
                <UserPlus size={18} color="#074735" />
              </View>
              <View>
                <Text style={styles.modalTitle}>{t('priest.modal.title')}</Text>
                <Text style={styles.modalSubtitleEnglish}>
                  {t('priest.modal.subtitle')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel={t('common.close', 'Close')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={[styles.scrollBody, { maxHeight: maxScrollHeight, flexShrink: 1 }]}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: isKeyboardVisible ? 60 : 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* Optional Field: Profile Image Upload */}
            <View style={styles.imageUploadSection} onLayout={handleFieldLayout('avatar')}>
              <Text style={styles.inputLabel}>
                {t('imageUpload.photoOptional', 'சுயவிவரப் படம் (விருப்பத்தேர்வு)')}
              </Text>

              <View style={styles.imagePickerCard}>
                {avatarUri ? (
                  <View style={styles.avatarPreviewRow}>
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarPreviewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.avatarActionButtons}>
                      <Pressable
                        onPress={() => setIsUploadSheetVisible(true)}
                        style={styles.changePhotoButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('imageUpload.changePhoto', 'படம் மாற்றுக')}
                      >
                        <Camera size={14} color="#074735" />
                        <Text style={styles.changePhotoButtonText}>
                          {t('imageUpload.changePhoto', 'படம் மாற்றுக')}
                        </Text>
                      </Pressable>

                      <Pressable
                        testID="priest-image-remove-btn"
                        onPress={() => setAvatarUri(null)}
                        style={styles.removePhotoButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('imageUpload.removePhoto', 'புகைப்படத்தை நீக்குக')}
                      >
                        <Trash2 size={14} color="#DC2626" />
                        <Text style={styles.removePhotoButtonText}>
                          {t('imageUpload.remove', 'நீக்குக')}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    testID="priest-image-upload-btn"
                    onPress={() => setIsUploadSheetVisible(true)}
                    style={styles.uploadPlaceholder}
                    accessibilityRole="button"
                    accessibilityLabel={t('imageUpload.uploadPhoto', 'சுயவிவரப் படம் பதிவேற்றுக')}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Camera size={20} color="#074735" strokeWidth={2.2} />
                    </View>
                    <View style={styles.uploadTextContainer}>
                      <Text style={styles.uploadPlaceholderTitle}>
                        {t('imageUpload.uploadPhoto', 'சுயவிவரப் படம் பதிவேற்றுக')}
                      </Text>
                      <Text style={styles.uploadPlaceholderSubtitle}>
                        {t('imageUpload.tapToUpload', 'கேமரா அல்லது கேலரியில் இருந்து பதிவேற்ற தட்டவும்')}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Field 1: English Name */}
            <View onLayout={handleFieldLayout('nameEnglish')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.nameEnglish')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ramesh Gurukkal"
                placeholderTextColor="#94A3B8"
                value={nameEnglish}
                onChangeText={text => {
                  setNameEnglish(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => handleFieldFocus('nameEnglish')}
                autoCapitalize="words"
              />
            </View>

            {/* Field 2: Tamil Name */}
            <View onLayout={handleFieldLayout('nameTamil')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.nameTamil')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="எ.கா. ரமேஷ் குருக்கள்"
                placeholderTextColor="#94A3B8"
                value={nameTamil}
                onChangeText={text => {
                  setNameTamil(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => handleFieldFocus('nameTamil')}
              />
            </View>

            {/* Field 3: Role (பணி / பங்கு) */}
            <View onLayout={handleFieldLayout('role')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.role', 'Staff Role')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('priest.modal.rolePlaceholder', 'e.g. Chief Priest, Assistant, Archakar')}
                placeholderTextColor="#94A3B8"
                value={role}
                onChangeText={text => {
                  setRole(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => handleFieldFocus('role')}
              />
            </View>

            {/* Field 4: Designation (பதவி) */}
            <View onLayout={handleFieldLayout('designation')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.designation', 'Designation')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('priest.modal.designationPlaceholder', 'e.g. தலைமை குருக்கள், உதவியாளர்')}
                placeholderTextColor="#94A3B8"
                value={designation}
                onChangeText={text => {
                  setDesignation(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => handleFieldFocus('designation')}
              />
            </View>

            {/* Field 5: Phone Number */}
            <View onLayout={handleFieldLayout('phone')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.phone')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="+91 98401 XXXXX"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => handleFieldFocus('phone')}
                keyboardType="phone-pad"
              />
            </View>

            {/* Field 6: Password for Staff Login */}
            <View onLayout={handleFieldLayout('password')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.password', 'Staff Login Password')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordTextInput}
                  placeholder={t('priest.modal.passwordPlaceholder', 'e.g. StaffPass@2026')}
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onFocus={() => handleFieldFocus('password')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.eyeIconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </Pressable>
              </View>
              <Text style={styles.helperText}>
                {t('priest.modal.passwordHelper', 'This password will be used for staff login and must be set by admin.')}
              </Text>
            </View>

            {/* Field 5: Tradition / ஆகம நெறி */}
            <View onLayout={handleFieldLayout('tradition')}>
              <Text style={styles.inputLabel}>{t('priest.modal.tradition')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="எ.கா. வேத சைவ ஆகமம் (Vedic Shastra)"
                placeholderTextColor="#94A3B8"
                value={traditionTamil}
                onChangeText={setTraditionTamil}
                onFocus={() => handleFieldFocus('tradition')}
              />
            </View>

            {/* Field 6: Expertise */}
            <View onLayout={handleFieldLayout('expertise')}>
              <Text style={styles.inputLabel}>{t('priest.modal.expertise')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="எ.கா. ஹோமம் & கிரகப்பிரவேசம்"
                placeholderTextColor="#94A3B8"
                value={expertiseTamil}
                onChangeText={setExpertiseTamil}
                onFocus={() => handleFieldFocus('expertise')}
              />
            </View>

            {/* Field 7: Certification */}
            <View onLayout={handleFieldLayout('certification')}>
              <Text style={styles.inputLabel}>{t('priest.modal.certification')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="எ.கா. அங்கீகரிக்கப்பட்ட கள குரு"
                placeholderTextColor="#94A3B8"
                value={certificationTamil}
                onChangeText={setCertificationTamil}
                onFocus={() => handleFieldFocus('certification')}
              />
            </View>

            {/* Field 8: Languages */}
            <View onLayout={handleFieldLayout('languages')}>
              <Text style={styles.inputLabel}>{t('priest.modal.languages')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="எ.கா. தமிழ் & சமஸ்கிருதம்"
                placeholderTextColor="#94A3B8"
                value={languagesTamil}
                onChangeText={setLanguagesTamil}
                onFocus={() => handleFieldFocus('languages')}
              />
            </View>

            {/* Field 9: Email Address (Optional) */}
            <View onLayout={handleFieldLayout('email')}>
              <Text style={styles.inputLabel}>
                {t('priest.modal.email', 'மின்னஞ்சல் முகவரி (விருப்பத்தேர்வு)')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('priest.modal.emailPlaceholder', 'e.g. priest@mandhragiri.com')}
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleFieldFocus('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={handleClose}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel', 'Cancel')}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel', 'ரத்து')}</Text>
            </Pressable>

            <Pressable
              testID="add-priest-submit-btn"
              onPress={handleSubmit}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={t('priest.modal.submit')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    {t('common.saving', 'சேமிக்கிறது...')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>{t('priest.modal.submit')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Device Camera & Gallery Upload Sheet */}
      <ImageUploadSheetModal
        visible={isUploadSheetVisible}
        onClose={() => setIsUploadSheetVisible(false)}
        onSelectImage={uri => setAvatarUri(uri)}
        onRemoveImage={() => setAvatarUri(null)}
        hasImage={Boolean(avatarUri)}
        title={t('priest.modal.uploadTitle', 'புரோகிதர் சுயவிவரப் படம்')}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#074735',
  },
  modalSubtitleEnglish: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#718096',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollBody: {
    maxHeight: 440,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#1E293B',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  passwordTextInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#1E293B',
  },
  eyeIconButton: {
    padding: 4,
    marginLeft: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    flex: 1.6,
    backgroundColor: '#074735',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C6A15B',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageUploadSection: {
    marginTop: 2,
    marginBottom: 6,
  },
  imagePickerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 10,
    marginTop: 4,
  },
  uploadPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C6A15B',
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadPlaceholderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#074735',
  },
  uploadPlaceholderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#C6A15B',
    marginRight: 12,
  },
  avatarActionButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6ECE9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  changePhotoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 5,
  },
  removePhotoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});
