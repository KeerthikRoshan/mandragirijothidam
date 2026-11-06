/**
 * PoojaBookingFormModal Component
 * Shared Bottom-Up Registration Modal used across Admin App:
 * 1. Daily Schedule screen ("+ புதிய பதிவு சேர்க்க / +Add Function")
 * 2. Dashboard screen ("+ பூஜை பதிவு (New)")
 * 3. Priest screen ("+ பூஜை பதிவு (New)")
 *
 * Capabilities:
 * - Date is user-customizable with live Tamil calendar preview.
 * - Category picker with custom typable option.
 * - Brogithar (Priest) Dropdown populated from existing prebuilt priest list (PRIEST_MOCK_STAFF).
 * - Saves selected priest's ID/reference (priestId) and contact info.
 * - Dedicated Client Payment & Priest Payment sections with live balance calculations:
 *   - Client Balance = Total Event Charge - Total Payment Received from Client
 *   - Priest Balance = Total Pay for Priest - Advance Paid to Priest
 * - Validates non-negative amounts, decimals, and advance limits.
 * - Supports editing existing events via optional initialBooking prop.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { ChevronDown, ChevronUp, UserCheck } from 'lucide-react-native';
import { BookingCategory, ScheduleBooking } from '../../types/schedule';
import { formatDateKey, formatTamilDisplayDate } from '../../utils/dateUtils';
import { getTamilDateInfo } from '../../services/tamilCalendarService';
import { PRIEST_MOCK_STAFF } from '../../data/priestMockData';
import { useTranslation } from 'react-i18next';

export interface NewBookingFormData {
  title: string;
  clientName: string;
  phone: string;
  location: string;
  category: BookingCategory;
  categoryLabelTamil: string;
  timeSlot: string;
  priestId: string;
  priestName: string;
  priestPhone?: string;
  dateKey: string;
  // Payment tracking fields
  totalEventCharge: number;
  clientAdvanceAmount: number;
  clientTotalReceived: number;
  clientBalanceAmount: number;
  priestTotalPay: number;
  priestAdvancePaid: number;
  priestBalanceAmount: number;
}

interface PoojaBookingFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewBookingFormData) => void;
  selectedDate?: string; // YYYY-MM-DD
  initialBooking?: ScheduleBooking; // For viewing/editing an existing event
}

const CATEGORY_CHOICES: { id: BookingCategory | 'custom'; label: string }[] = [
  { id: 'jathagam', label: 'ஜாதகம்' },
  { id: 'temple', label: 'கோவில்' },
  { id: 'outdoor', label: 'வெளி நிகழ்வு' },
  { id: 'custom', label: 'பிற (தனிப்பயன்)' },
];

export const PoojaBookingFormModal: React.FC<PoojaBookingFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  selectedDate,
  initialBooking,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { t } = useTranslation();

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldLayouts = useRef<{ [key: string]: number }>({});
  const activeFieldRef = useRef<string | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const categoryChoices = useMemo(() => [
    { id: 'jathagam' as const, label: t('bookingModal.categories.jathagam') },
    { id: 'temple' as const, label: t('bookingModal.categories.temple') },
    { id: 'outdoor' as const, label: t('bookingModal.categories.outdoor') },
    { id: 'custom' as const, label: t('bookingModal.categories.custom') },
  ], [t]);

  // Basic event fields
  const initialDateString =
    initialBooking?.date || selectedDate || formatDateKey(new Date());
  const [dateInput, setDateInput] = useState<string>(initialDateString);
  const [title, setTitle] = useState<string>(initialBooking?.titleTamil || '');
  const [client, setClient] = useState<string>(initialBooking?.clientName || '');
  const [phone, setPhone] = useState<string>(initialBooking?.clientPhone || '');
  const [location, setLocation] = useState<string>(
    initialBooking?.locationTamil || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்'
  );
  const [category, setCategory] = useState<BookingCategory | 'custom'>(
    initialBooking?.category || 'jathagam'
  );
  const [customCategoryText, setCustomCategoryText] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>(
    initialBooking?.timeSlot || '02:00 PM - 03:00 PM'
  );

  // Priest dropdown state
  const defaultPriestId =
    initialBooking?.priestId ||
    PRIEST_MOCK_STAFF.find(p => p.fullTitleTamil === initialBooking?.priestNameTamil)?.id ||
    PRIEST_MOCK_STAFF[0].id;
  const [selectedPriestId, setSelectedPriestId] = useState<string>(defaultPriestId);
  const [isPriestDropdownOpen, setIsPriestDropdownOpen] = useState<boolean>(false);
  const [customPriestText, setCustomPriestText] = useState<string>('');

  // Payment state
  const [totalEventCharge, setTotalEventCharge] = useState<string>(
    initialBooking?.totalEventCharge !== undefined
      ? String(initialBooking.totalEventCharge)
      : initialBooking?.amount
      ? initialBooking.amount.replace(/[^0-9.]/g, '')
      : '5000'
  );
  const [clientAdvanceAmount, setClientAdvanceAmount] = useState<string>(
    initialBooking?.clientAdvanceAmount !== undefined
      ? String(initialBooking.clientAdvanceAmount)
      : '1000'
  );
  const [clientTotalReceived, setClientTotalReceived] = useState<string>(
    initialBooking?.clientTotalReceived !== undefined
      ? String(initialBooking.clientTotalReceived)
      : '1000'
  );
  const [priestTotalPay, setPriestTotalPay] = useState<string>(
    initialBooking?.priestTotalPay !== undefined
      ? String(initialBooking.priestTotalPay)
      : '2500'
  );
  const [priestAdvancePaid, setPriestAdvancePaid] = useState<string>(
    initialBooking?.priestAdvancePaid !== undefined
      ? String(initialBooking.priestAdvancePaid)
      : '500'
  );

  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync state whenever modal opens or initial data changes
  useEffect(() => {
    if (visible) {
      if (initialBooking) {
        setDateInput(initialBooking.date);
        setTitle(initialBooking.titleTamil);
        setClient(initialBooking.clientName);
        setPhone(initialBooking.clientPhone || '');
        setLocation(initialBooking.locationTamil || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்');
        setCategory(initialBooking.category);
        setTimeSlot(initialBooking.timeSlot);
        const matchedPriest = PRIEST_MOCK_STAFF.find(
          p => p.id === initialBooking.priestId || p.fullTitleTamil === initialBooking.priestNameTamil
        );
        if (matchedPriest) {
          setSelectedPriestId(matchedPriest.id);
        } else if (initialBooking.priestNameTamil) {
          setSelectedPriestId('custom');
          setCustomPriestText(initialBooking.priestNameTamil);
        } else {
          setSelectedPriestId(PRIEST_MOCK_STAFF[0].id);
        }
        setTotalEventCharge(
          initialBooking.totalEventCharge !== undefined
            ? String(initialBooking.totalEventCharge)
            : initialBooking.amount
            ? initialBooking.amount.replace(/[^0-9.]/g, '')
            : '5000'
        );
        setClientAdvanceAmount(
          initialBooking.clientAdvanceAmount !== undefined
            ? String(initialBooking.clientAdvanceAmount)
            : '1000'
        );
        setClientTotalReceived(
          initialBooking.clientTotalReceived !== undefined
            ? String(initialBooking.clientTotalReceived)
            : '1000'
        );
        setPriestTotalPay(
          initialBooking.priestTotalPay !== undefined
            ? String(initialBooking.priestTotalPay)
            : '2500'
        );
        setPriestAdvancePaid(
          initialBooking.priestAdvancePaid !== undefined
            ? String(initialBooking.priestAdvancePaid)
            : '500'
        );
      } else {
        setDateInput(selectedDate || formatDateKey(new Date()));
      }
      setIsPriestDropdownOpen(false);
      setErrorText(null);
    }
  }, [visible, selectedDate, initialBooking]);

  // Validate date format YYYY-MM-DD
  const isDatePatternValid = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim());

  // Derive Tamil date info for the entered date
  const tamilInfo = useMemo(() => {
    if (isDatePatternValid) {
      try {
        return getTamilDateInfo(dateInput.trim());
      } catch {
        return null;
      }
    }
    return null;
  }, [dateInput, isDatePatternValid]);

  // Safely parse currency string to non-negative number
  const parseAmount = (val: string): number => {
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  // Live parsed payment numbers
  const totalChargeNum = parseAmount(totalEventCharge);
  const clientAdvanceNum = parseAmount(clientAdvanceAmount);
  const clientReceivedNum = parseAmount(clientTotalReceived);
  const clientBalanceNum = Math.max(0, totalChargeNum - clientReceivedNum);

  const priestPayNum = parseAmount(priestTotalPay);
  const priestAdvanceNum = parseAmount(priestAdvancePaid);
  const priestBalanceNum = Math.max(0, priestPayNum - priestAdvanceNum);

  // Active selected priest object
  const activePriest = useMemo(() => {
    if (selectedPriestId === 'custom') {
      return {
        id: 'custom',
        nameTamil: customPriestText.trim() || 'பிற புரோகிதர் (தனிப்பயன்)',
        fullTitleTamil: customPriestText.trim() || 'பிற புரோகிதர் (தனிப்பயன்)',
        designationTamil: 'தனிப்பயன்',
        phone: '',
      };
    }
    const found = PRIEST_MOCK_STAFF.find(p => p.id === selectedPriestId);
    return found || PRIEST_MOCK_STAFF[0];
  }, [selectedPriestId, customPriestText]);

  const handleClose = () => {
    Keyboard.dismiss();
    setErrorText(null);
    setIsPriestDropdownOpen(false);
    activeFieldRef.current = null;
    onClose();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!isDatePatternValid) {
      setErrorText(t('bookingModal.validationDate'));
      return;
    }

    if (!title.trim() || !client.trim()) {
      setErrorText(t('bookingModal.validationRequired'));
      return;
    }

    if (category === 'custom' && !customCategoryText.trim()) {
      setErrorText(t('bookingModal.validationCategory'));
      return;
    }

    if (selectedPriestId === 'custom' && !customPriestText.trim()) {
      setErrorText(t('bookingModal.validationPriest'));
      return;
    }

    // Payment validation rules
    if (clientAdvanceNum > totalChargeNum && totalChargeNum > 0) {
      setErrorText(t('bookingModal.validationClientAdvance'));
      return;
    }

    if (clientReceivedNum > totalChargeNum && totalChargeNum > 0) {
      setErrorText(t('bookingModal.validationClientTotal'));
      return;
    }

    if (priestAdvanceNum > priestPayNum && priestPayNum > 0) {
      setErrorText(t('bookingModal.validationPriestAdvance'));
      return;
    }

    // Determine final category label
    let categoryLabel = 'ஜாதகம்';
    let finalCategory: BookingCategory = 'outdoor';

    if (category === 'custom') {
      categoryLabel = customCategoryText.trim();
      finalCategory = 'outdoor';
    } else {
      const found = CATEGORY_CHOICES.find(c => c.id === category);
      categoryLabel = found?.label || 'ஜாதகம்';
      finalCategory = category as BookingCategory;
    }

    // Determine final priest name & phone
    const finalPriestName =
      selectedPriestId === 'custom'
        ? customPriestText.trim()
        : activePriest.fullTitleTamil;

    onSubmit({
      title: title.trim(),
      clientName: client.trim(),
      phone: phone.trim() || '+91 98421 00000',
      location: location.trim(),
      category: finalCategory,
      categoryLabelTamil: categoryLabel,
      timeSlot: timeSlot.trim() || '02:00 PM - 03:00 PM',
      priestId: selectedPriestId,
      priestName: finalPriestName,
      priestPhone: activePriest.phone || undefined,
      dateKey: dateInput.trim(),
      totalEventCharge: totalChargeNum,
      clientAdvanceAmount: clientAdvanceNum,
      clientTotalReceived: clientReceivedNum,
      clientBalanceAmount: clientBalanceNum,
      priestTotalPay: priestPayNum,
      priestAdvancePaid: priestAdvanceNum,
      priestBalanceAmount: priestBalanceNum,
    });

    // Reset fields if not editing
    if (!initialBooking) {
      setTitle('');
      setClient('');
      setPhone('');
      setCustomCategoryText('');
      setCustomPriestText('');
    }
    setErrorText(null);
    setIsPriestDropdownOpen(false);
    activeFieldRef.current = null;
    onClose();
  };

  const topBuffer = insets.top + 16;
  const maxModalHeight = isKeyboardVisible
    ? Math.max(260, windowHeight - keyboardHeight - topBuffer)
    : Math.min(windowHeight * 0.92, windowHeight - topBuffer);

  const nonScrollHeight = errorText ? 200 : 160;
  const maxScrollHeight = isKeyboardVisible
    ? Math.max(120, maxModalHeight - nonScrollHeight)
    : 520;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
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
          {/* Top Handle Indicator */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {initialBooking ? t('bookingModal.headerEdit') : t('bookingModal.headerNew')}
              </Text>
              <Text style={styles.modalSubtitleEnglish}>
                {t('bookingModal.subtitle')}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
              style={styles.closeButtonCircle}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Error Banner */}
          {errorText && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorText}</Text>
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
            {/* 1. Date Input (User customizable, NOT predefined) */}
            <View onLayout={handleFieldLayout('date')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldDate')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('bookingModal.placeholderDate')}
                placeholderTextColor="#94A3B8"
                value={dateInput}
                onChangeText={text => {
                  setDateInput(text);
                  if (errorText) setErrorText(null);
                }}
                onFocus={() => handleFieldFocus('date')}
              />

              {/* Live Tamil Calendar Preview for entered date */}
              {isDatePatternValid && tamilInfo && (
                <View style={styles.dateHelperBox}>
                  <Text style={styles.dateHelperText}>
                    📅 {formatTamilDisplayDate(dateInput.trim())} • {tamilInfo.tamilMonth} {tamilInfo.tamilDay} ({tamilInfo.tamilWeekdayFull})
                  </Text>
                  {tamilInfo.isMuhurtham && (
                    <Text style={styles.muhurthamBadge}>{t('schedule.muhurthamBadge')}</Text>
                  )}
                </View>
              )}
            </View>

            {/* 2. Title Input */}
            <View onLayout={handleFieldLayout('title')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldTitle')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('bookingModal.placeholderTitle')}
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={text => {
                  setTitle(text);
                  if (errorText) setErrorText(null);
                }}
                onFocus={() => handleFieldFocus('title')}
              />
            </View>

            {/* 3. Client Name Input */}
            <View onLayout={handleFieldLayout('client')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldClientName')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('bookingModal.placeholderClient')}
                placeholderTextColor="#94A3B8"
                value={client}
                onChangeText={text => {
                  setClient(text);
                  if (errorText) setErrorText(null);
                }}
                onFocus={() => handleFieldFocus('client')}
              />
            </View>

            {/* 4. Client Phone Input */}
            <View onLayout={handleFieldLayout('phone')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldPhone')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('bookingModal.placeholderPhone')}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => handleFieldFocus('phone')}
              />
            </View>

            {/* 5. Location Input */}
            <View onLayout={handleFieldLayout('location')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldLocation')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('bookingModal.placeholderLocation')}
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
                onFocus={() => handleFieldFocus('location')}
              />
            </View>

            {/* 6. Category Selector with Custom Typable Option */}
            <View onLayout={handleFieldLayout('category')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldCategory')}</Text>
              <View style={styles.categoryPickerRow}>
                {categoryChoices.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={[
                        styles.categoryChoice,
                        isSelected && styles.categoryChoiceSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.categoryChoiceText,
                          isSelected && styles.categoryChoiceTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Category Typable Input when "பிற (தனிப்பயன்)" is selected */}
              {category === 'custom' && (
                <TextInput
                  style={[styles.textInput, styles.customCategoryInput]}
                  placeholder={t('bookingModal.placeholderCustomCategory')}
                  placeholderTextColor="#94A3B8"
                  value={customCategoryText}
                  onChangeText={text => {
                    setCustomCategoryText(text);
                    if (errorText) setErrorText(null);
                  }}
                  onFocus={() => handleFieldFocus('category')}
                />
              )}
            </View>

            {/* 7. Time Slot Input */}
            <View onLayout={handleFieldLayout('timeSlot')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldTimeSlot')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="02:00 PM - 03:00 PM"
                placeholderTextColor="#94A3B8"
                value={timeSlot}
                onChangeText={setTimeSlot}
                onFocus={() => handleFieldFocus('timeSlot')}
              />
            </View>

            {/* ========================================================= */}
            {/* 8. Brogithar (Priest) Dropdown Selection Field */}
            {/* ========================================================= */}
            <View onLayout={handleFieldLayout('priest')}>
              <Text style={styles.inputLabel}>{t('bookingModal.fieldSelectPriest')}</Text>
              
              {/* Dropdown Trigger */}
              <Pressable
                onPress={() => setIsPriestDropdownOpen(prev => !prev)}
                style={[
                  styles.dropdownTrigger,
                  isPriestDropdownOpen && styles.dropdownTriggerActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select Priest: ${activePriest.fullTitleTamil}`}
              >
                <View style={styles.dropdownTriggerLeft}>
                  <Text style={styles.dropdownPriestIcon}>👳</Text>
                  <View style={styles.dropdownTriggerTextGroup}>
                    <Text style={styles.dropdownSelectedName} numberOfLines={1}>
                      {activePriest.fullTitleTamil}
                    </Text>
                    <View style={styles.designationBadge}>
                      <Text style={styles.designationBadgeText}>
                        {activePriest.designationTamil}
                      </Text>
                    </View>
                  </View>
                </View>

                {isPriestDropdownOpen ? (
                  <ChevronUp size={18} color="#074735" />
                ) : (
                  <ChevronDown size={18} color="#64748B" />
                )}
              </Pressable>

              {/* Dropdown Options List */}
              {isPriestDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <Text style={styles.dropdownHeaderSubtext}>
                    {t('bookingModal.selectPriestDropdown')}
                  </Text>

                  {/* Prebuilt Priests from PRIEST_MOCK_STAFF */}
                  {PRIEST_MOCK_STAFF.map(priest => {
                    const isSelected = selectedPriestId === priest.id;
                    return (
                      <Pressable
                        key={priest.id}
                        onPress={() => {
                          setSelectedPriestId(priest.id);
                          setIsPriestDropdownOpen(false);
                          if (errorText) setErrorText(null);
                        }}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <Text style={styles.priestAvatarEmoji}>👳</Text>
                          <View style={styles.dropdownItemTextCol}>
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                isSelected && styles.dropdownItemTitleSelected,
                              ]}
                            >
                              {priest.fullTitleTamil}
                            </Text>
                            <View style={styles.dropdownItemMetaRow}>
                              <Text style={styles.dropdownItemRoleTag}>
                                {priest.designationTamil}
                              </Text>
                              <Text style={styles.dropdownItemPhone}>
                                • {priest.phoneDisplay || priest.phone}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </Pressable>
                    );
                  })}

                  {/* Option for Custom Priest */}
                  <Pressable
                    onPress={() => {
                      setSelectedPriestId('custom');
                      setIsPriestDropdownOpen(false);
                      if (errorText) setErrorText(null);
                    }}
                    style={[
                      styles.dropdownItem,
                      styles.dropdownItemCustom,
                      selectedPriestId === 'custom' && styles.dropdownItemSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedPriestId === 'custom' }}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <Text style={styles.priestAvatarEmoji}>✍️</Text>
                      <View style={styles.dropdownItemTextCol}>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            selectedPriestId === 'custom' && styles.dropdownItemTitleSelected,
                          ]}
                        >
                          {t('bookingModal.customPriestOption')}
                        </Text>
                        <Text style={styles.dropdownItemSub}>
                          {t('bookingModal.customPriestSub')}
                        </Text>
                      </View>
                    </View>
                    {selectedPriestId === 'custom' && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Custom Priest Typable Input when "பிற புரோகிதர் (தனிப்பயன்)" is selected */}
              {selectedPriestId === 'custom' && (
                <TextInput
                  style={[styles.textInput, styles.customPriestInput]}
                  placeholder={t('bookingModal.placeholderCustomPriest')}
                  placeholderTextColor="#94A3B8"
                  value={customPriestText}
                  onChangeText={text => {
                    setCustomPriestText(text);
                    if (errorText) setErrorText(null);
                  }}
                  onFocus={() => handleFieldFocus('priest')}
                />
              )}
            </View>

            {/* ========================================================= */}
            {/* 9. Payment Fields Section */}
            {/* ========================================================= */}
            <View style={styles.paymentSectionContainer}>
              <View style={styles.paymentSectionHeader}>
                <UserCheck size={16} color="#074735" />
                <Text style={styles.paymentSectionTitle}>
                  {t('bookingModal.sectionPaymentDetails')}
                </Text>
              </View>

              {/* Card A: Client Payment (வாடிக்கையாளர் கட்டணம் & வரவு) */}
              <View style={styles.paymentCard}>
                <Text style={styles.paymentCardTitle}>
                  {t('bookingModal.sectionClientPayment')}
                </Text>

                {/* Total Event Charge */}
                <View onLayout={handleFieldLayout('totalCharge')}>
                  <Text style={styles.paymentFieldLabel}>
                    {t('bookingModal.fieldTotalCharge')}
                  </Text>
                  <View style={styles.currencyInputRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.currencyInput}
                      placeholder="5000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={totalEventCharge}
                      onChangeText={text => {
                        setTotalEventCharge(text);
                        if (errorText) setErrorText(null);
                      }}
                      onFocus={() => handleFieldFocus('totalCharge')}
                    />
                  </View>
                </View>

                {/* Split Row: Advance + Total Received */}
                <View style={styles.splitRow}>
                  {/* Charge Advance */}
                  <View onLayout={handleFieldLayout('clientAdvance')} style={styles.splitCol}>
                    <Text style={styles.paymentFieldLabel}>
                      {t('bookingModal.fieldClientAdvance')}
                    </Text>
                    <View style={styles.currencyInputRow}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.currencyInput}
                        placeholder="1000"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        value={clientAdvanceAmount}
                        onChangeText={text => {
                          setClientAdvanceAmount(text);
                          if (errorText) setErrorText(null);
                        }}
                        onFocus={() => handleFieldFocus('clientAdvance')}
                      />
                    </View>
                  </View>

                  {/* Total Payment Received from Client */}
                  <View onLayout={handleFieldLayout('clientReceived')} style={styles.splitCol}>
                    <Text style={styles.paymentFieldLabel}>
                      {t('bookingModal.fieldClientTotalReceived')}
                    </Text>
                    <View style={styles.currencyInputRow}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.currencyInput}
                        placeholder="1000"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        value={clientTotalReceived}
                        onChangeText={text => {
                          setClientTotalReceived(text);
                          if (errorText) setErrorText(null);
                        }}
                        onFocus={() => handleFieldFocus('clientReceived')}
                      />
                    </View>
                  </View>
                </View>

                {/* Live Calculated Client Balance */}
                <View style={styles.balanceSummaryBox}>
                  <View style={styles.balanceSummaryRow}>
                    <Text style={styles.balanceLabel}>
                      {t('bookingModal.fieldClientBalance')}:
                    </Text>
                    <Text style={styles.balanceAmountClient}>
                      ₹ {clientBalanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.balanceBadgeRow}>
                    {totalChargeNum > 0 && clientBalanceNum === 0 ? (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>{t('bookingModal.fullyPaid')}</Text>
                      </View>
                    ) : clientBalanceNum > 0 ? (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>
                          {t('bookingModal.balanceDueClient')} ₹ {clientBalanceNum.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.balanceSubtext}>
                        {t('bookingModal.clientBalanceFormula')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Card B: Priest Payment (புரோகிதர் ஊதியம் & வழங்கிய தொகை) */}
              <View style={[styles.paymentCard, styles.priestPaymentCard]}>
                <Text style={styles.paymentCardTitle}>
                  {t('bookingModal.sectionPriestPayment')}
                </Text>

                <View style={styles.splitRow}>
                  {/* Total Pay for Priest */}
                  <View onLayout={handleFieldLayout('priestTotalPay')} style={styles.splitCol}>
                    <Text style={styles.paymentFieldLabel}>
                      {t('bookingModal.fieldPriestTotalPay')}
                    </Text>
                    <View style={styles.currencyInputRow}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.currencyInput}
                        placeholder="2500"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        value={priestTotalPay}
                        onChangeText={text => {
                          setPriestTotalPay(text);
                          if (errorText) setErrorText(null);
                        }}
                        onFocus={() => handleFieldFocus('priestTotalPay')}
                      />
                    </View>
                  </View>

                  {/* Advance Paid to Priest */}
                  <View onLayout={handleFieldLayout('priestAdvancePaid')} style={styles.splitCol}>
                    <Text style={styles.paymentFieldLabel}>
                      {t('bookingModal.fieldPriestAdvance')}
                    </Text>
                    <View style={styles.currencyInputRow}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.currencyInput}
                        placeholder="500"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        value={priestAdvancePaid}
                        onChangeText={text => {
                          setPriestAdvancePaid(text);
                          if (errorText) setErrorText(null);
                        }}
                        onFocus={() => handleFieldFocus('priestAdvancePaid')}
                      />
                    </View>
                  </View>
                </View>

                {/* Live Calculated Priest Balance */}
                <View style={[styles.balanceSummaryBox, styles.priestBalanceBox]}>
                  <View style={styles.balanceSummaryRow}>
                    <Text style={styles.balanceLabel}>
                      {t('bookingModal.fieldPriestBalance')}:
                    </Text>
                    <Text style={styles.balanceAmountPriest}>
                      ₹ {priestBalanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.balanceBadgeRow}>
                    {priestPayNum > 0 && priestBalanceNum === 0 ? (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>{t('bookingModal.priestFullyPaid')}</Text>
                      </View>
                    ) : priestBalanceNum > 0 ? (
                      <View style={styles.priestDueBadge}>
                        <Text style={styles.priestDueBadgeText}>
                          {t('bookingModal.balanceDuePriest')} ₹ {priestBalanceNum.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.balanceSubtext}>
                        {t('bookingModal.priestBalanceFormula')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtonsRow}>
            <Pressable
              onPress={handleClose}
              style={styles.modalCancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.modalCancelText}>{t('bookingModal.btnCancel')}</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              style={styles.modalSubmitButton}
              accessibilityRole="button"
              accessibilityLabel="Confirm booking"
            >
              <Text style={styles.modalSubmitText}>{t('bookingModal.btnSubmit')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#074735',
  },
  modalSubtitleEnglish: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C6D23',
    marginTop: 2,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 6,
  },
  dateHelperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF9F4',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  dateHelperText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
    flex: 1,
  },
  muhurthamBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C5D07',
    backgroundColor: '#FFF0CD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  categoryChoice: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChoiceSelected: {
    backgroundColor: '#074735',
    borderColor: '#074735',
  },
  categoryChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChoiceTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customCategoryInput: {
    marginTop: 6,
    borderColor: '#074735',
  },

  /* Dropdown Styles */
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  dropdownTriggerActive: {
    borderColor: '#074735',
    backgroundColor: '#F0FDF4',
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownPriestIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dropdownTriggerTextGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  dropdownSelectedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#074735',
  },
  designationBadge: {
    backgroundColor: '#E5F7EE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  designationBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#074735',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownHeaderSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 5,
  },
  dropdownItemSelected: {
    backgroundColor: '#E5F7EE',
    borderColor: '#10B981',
  },
  dropdownItemCustom: {
    borderStyle: 'dashed',
    backgroundColor: '#FAF5EA',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priestAvatarEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  dropdownItemTitleSelected: {
    fontWeight: '700',
    color: '#065F46',
  },
  dropdownItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dropdownItemRoleTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  dropdownItemPhone: {
    fontSize: 10.5,
    color: '#64748B',
    marginLeft: 4,
  },
  dropdownItemSub: {
    fontSize: 10.5,
    color: '#8C6D23',
    marginTop: 1,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 6,
  },
  customPriestInput: {
    marginTop: 4,
    borderColor: '#074735',
  },

  /* Payment Section Styles */
  paymentSectionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#074735',
  },
  paymentCard: {
    backgroundColor: '#FBF9F5',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  priestPaymentCard: {
    backgroundColor: '#F0F9F6',
    borderColor: '#C7E7DE',
  },
  paymentCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8C6D23',
    marginBottom: 8,
  },
  paymentFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 4,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#074735',
    marginRight: 6,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitCol: {
    flex: 1,
  },
  balanceSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  priestBalanceBox: {
    borderColor: '#A7F3D0',
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  balanceAmountClient: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  balanceAmountPriest: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  balanceBadgeRow: {
    marginTop: 4,
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  paidBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  priestDueBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priestDueBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  balanceSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
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
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#074735',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5A869',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
