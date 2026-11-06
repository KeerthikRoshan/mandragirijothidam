/**
 * ImageUploadSheetModal Component
 *
 * Reusable image picker action sheet modal providing device camera & photo gallery uploads:
 * - Option 1: Take Photo with device Camera (launchCamera).
 * - Option 2: Choose Photo from device Gallery / Photo Library (launchImageLibrary).
 * - Option 3: Remove Current Photo (optional, if an image is already uploaded).
 * - Built in accordance with Vedic green (#074735), cream (#FAF9F6), and gold (#C6A15B) styling.
 * - Full bilingual support (Tamil & English).
 */

import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  launchCamera,
  launchImageLibrary,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

interface ImageUploadSheetModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (uri: string) => void;
  onRemoveImage?: () => void;
  hasImage?: boolean;
  title?: string;
}

export const ImageUploadSheetModal: React.FC<ImageUploadSheetModalProps> = ({
  visible,
  onClose,
  onSelectImage,
  onRemoveImage,
  hasImage = false,
  title,
}) => {
  const { t } = useTranslation();

  /**
   * Request and verify Android runtime camera permissions.
   * Handles:
   * - Already granted -> true
   * - User grants -> true
   * - User denies -> shows explanation dialog, returns false
   * - User permanently denies (never_ask_again) -> shows dialog with "Open Settings" button, returns false
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (alreadyGranted) {
        return true;
      }

      const permissionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('imageUpload.cameraPermissionTitle', 'கேமரா அனுமதி தேவை'),
          message: t(
            'imageUpload.cameraPermissionMsg',
            'சுயவிவரப் படம் எடுப்பதற்கு கேமரா அனுமதியை வழங்கவும்.'
          ),
          buttonPositive: t('imageUpload.permissionAllow', 'அனுமதி'),
          buttonNegative: t('common.cancel', 'ரத்து'),
        }
      );

      if (permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      if (permissionResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          t('imageUpload.permissionBlockedTitle', 'கேமரா அனுமதி முடக்கப்பட்டுள்ளது'),
          t(
            'imageUpload.permissionBlockedMsg',
            'கேமரா அனுமதி நிரந்தரமாக முடக்கப்பட்டுள்ளது. சாதன அமைப்புகளில் (App Settings) சென்று கேமரா அனுமதியை இயக்கவும்.'
          ),
          [
            {
              text: t('common.cancel', 'ரத்து'),
              style: 'cancel',
            },
            {
              text: t('imageUpload.openSettings', 'அமைப்புகளைத் திறக்க'),
              onPress: () => {
                Linking.openSettings().catch(() => {});
              },
            },
          ]
        );
        return false;
      }

      // Normally denied
      Alert.alert(
        t('imageUpload.permissionDeniedTitle', 'கேமரா அனுமதி மறுக்கப்பட்டது'),
        t(
          'imageUpload.permissionDeniedMsg',
          'சுயவிவரப் படம் எடுக்க கேமரா அனுமதி தேவை. மீண்டும் முயற்சி செய்து அனுமதியை வழங்கவும்.'
        ),
        [{ text: t('common.ok', 'சரி') }]
      );
      return false;
    } catch (err) {
      console.warn('Camera permission check failed:', err);
      return false;
    }
  };

  const handleCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      saveToPhotos: false,
    };

    try {
      const response = await launchCamera(options);
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        if (response.errorCode === 'camera_unavailable') {
          Alert.alert(
            t('common.error', 'பிழை'),
            t(
              'imageUpload.cameraUnavailable',
              'இந்த சாதனத்தில் கேமரா வசதி இல்லை அல்லது முடக்கப்பட்டுள்ளது.'
            )
          );
        } else if (response.errorCode === 'permission') {
          Alert.alert(
            t('imageUpload.permissionBlockedTitle', 'கேமரா அனுமதி முடக்கப்பட்டுள்ளது'),
            t(
              'imageUpload.permissionBlockedMsg',
              'கேமரா அனுமதி நிரந்தரமாக முடக்கப்பட்டுள்ளது. சாதன அமைப்புகளில் (App Settings) சென்று கேமரா அனுமதியை இயக்கவும்.'
            ),
            [
              { text: t('common.cancel', 'ரத்து'), style: 'cancel' },
              {
                text: t('imageUpload.openSettings', 'அமைப்புகளைத் திறக்க'),
                onPress: () => {
                  Linking.openSettings().catch(() => {});
                },
              },
            ]
          );
        } else {
          Alert.alert(
            t('common.error', 'பிழை'),
            response.errorMessage ||
              t('imageUpload.cameraError', 'கேமராவைத் திறக்க முடியவில்லை.')
          );
        }
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        onSelectImage(asset.uri);
        onClose();
      } else {
        Alert.alert(
          t('common.error', 'பிழை'),
          t('imageUpload.noImageSelected', 'புகைப்படம் எதுவும் தேர்ந்தெடுக்கப்படவில்லை.')
        );
      }
    } catch (err) {
      console.warn('Failed to open camera:', err);
      Alert.alert(
        t('common.error', 'பிழை'),
        t('imageUpload.cameraError', 'கேமராவைத் திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')
      );
    }
  };

  const handleGallery = async () => {
    // Note: Android system Photo Picker (PickVisualMedia) is used automatically by react-native-image-picker
    // and does NOT require READ_EXTERNAL_STORAGE or READ_MEDIA_IMAGES permissions.
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      selectionLimit: 1,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert(
          t('common.error', 'பிழை'),
          response.errorMessage ||
            t(
              'imageUpload.galleryError',
              'புகைப்படக் கேலரியைத் திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            )
        );
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        onSelectImage(asset.uri);
        onClose();
      } else {
        Alert.alert(
          t('common.error', 'பிழை'),
          t('imageUpload.noImageSelected', 'புகைப்படம் எதுவும் தேர்ந்தெடுக்கப்படவில்லை.')
        );
      }
    } catch (err) {
      console.warn('Failed to open photo library:', err);
      Alert.alert(
        t('common.error', 'பிழை'),
        t(
          'imageUpload.galleryError',
          'புகைப்படக் கேலரியைத் திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        )
      );
    }
  };

  const handleRemove = () => {
    if (onRemoveImage) {
      onRemoveImage();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchArea} onPress={onClose} />

        <View style={styles.sheetCard}>
          {/* Top Drag Handle Indicator */}
          <View style={styles.handleBar} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.sheetTitle}>
                {title || t('imageUpload.modalTitle', 'சுயவிவரப் படம் பதிவேற்றுக')}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {t('imageUpload.modalSubtitle', 'சாதன கேமரா அல்லது கேலரியில் இருந்து தேர்வு செய்க')}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeIconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'ரத்து')}
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {/* Option 1: Camera */}
            <Pressable
              onPress={handleCamera}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && styles.optionRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('imageUpload.takePhoto', 'கேமரா மூலம் படம் எடுக்க')}
            >
              <View style={styles.iconBoxGreen}>
                <Camera size={20} color="#074735" strokeWidth={2.2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('imageUpload.takePhoto', 'கேமரா மூலம் படம் எடுக்க')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('imageUpload.takePhotoSub', 'கேமராவைப் பயன்படுத்தி புதிய படம் எடுக்கவும்')}
                </Text>
              </View>
            </Pressable>

            <View style={styles.divider} />

            {/* Option 2: Gallery */}
            <Pressable
              onPress={handleGallery}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && styles.optionRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('imageUpload.chooseGallery', 'கேலரியில் இருந்து தேர்வு செய்க')}
            >
              <View style={styles.iconBoxGold}>
                <ImageIcon size={20} color="#8C6D23" strokeWidth={2.2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('imageUpload.chooseGallery', 'கேலரியில் இருந்து தேர்வு செய்க')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('imageUpload.chooseGallerySub', 'சாதன கேலரியில் இருந்து புகைப்படம் தேர்ந்தெடுக்கவும்')}
                </Text>
              </View>
            </Pressable>

            {/* Option 3: Remove Current Photo (conditional) */}
            {hasImage && onRemoveImage && (
              <>
                <View style={styles.divider} />
                <Pressable
                  onPress={handleRemove}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionRowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('imageUpload.removePhoto', 'புகைப்படத்தை நீக்குக')}
                >
                  <View style={styles.iconBoxRed}>
                    <Trash2 size={19} color="#DC2626" strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitleRed}>
                      {t('imageUpload.removePhoto', 'புகைப்படத்தை நீக்குக')}
                    </Text>
                    <Text style={styles.optionSubtitleRed}>
                      {t('imageUpload.removePhotoSub', 'தற்போதைய சுயவிவரப் படத்தை அகற்றவும்')}
                    </Text>
                  </View>
                </Pressable>
              </>
            )}
          </View>

          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel', 'ரத்து')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchArea: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#074735',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionRowPressed: {
    backgroundColor: '#E6ECE9',
  },
  iconBoxGreen: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#D1DDD6',
  },
  iconBoxGold: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iconBoxRed: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  optionTitleRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  optionSubtitleRed: {
    fontSize: 11.5,
    color: '#EF4444',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 68,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
