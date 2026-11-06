/**
 * LoginScreen Component
 * Sacred Vedic Luxury Sign In for Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்)
 *
 * Exact replication of English & Tamil design specifications:
 * - Ambient background soft rings & spiritual glow
 * - Auspicious top mark:
 *   - Tamil: "• ஓம் சாந்தி"
 *   - English: "• OM SHANTI"
 * - Language Switcher Pill:
 *   - "தமிழ் | English" with active dark-green velvet pill
 * - Centered brand emblem halo container with ambient drop-shadow
 * - Brand Titles:
 *   - Tamil: Two-line title "மந்திரகிரி \n ஜோதிடம்"
 *   - English: Luxury serif single-line title "Mandhragiri Jothidam"
 * - Glassmorphic card (rounded-3xl) with subtle gold border
 * - Role selection divider:
 *   - Tamil: "உள்நுழைவு வகை"
 *   - English: "SIGN IN AS"
 * - Two side-by-side role buttons:
 *   - Option 1: ShieldCheck icon + "நிர்வாகி" (TA) / "Admin" (EN)
 *   - Option 2: Users icon + "புரோகிதர்" (TA) / "Priest" (EN)
 * - Mobile input:
 *   - Label: "கைபேசி எண்" (TA) / "MOBILE NUMBER" (EN)
 *   - Badge: "IN +91" | "98765 43210"
 * - Password input:
 *   - Label: "கடவுச்சொல்" (TA) / "PASSWORD" (EN)
 *   - Placeholder dots: "••••••••••••••••" with eye toggle visibility icon
 *   - Right-aligned link: "கடவுச்சொல் மறந்துவிட்டதா?" (TA) / "Forgot Password?" (EN) in italic gold serif
 * - Primary CTA Button:
 *   - "உள்நுழைக →" (TA) / "SIGN IN →" (EN) in deep velvet green with gold arrow
 * - Footer:
 *   - "மந்திரகிரி ஜோதிடம்" (TA) / "Mandhragiri Jothidam" (EN)
 *   - iOS home bar indicator
 *
 * Keyboard Handling & Input Fixes:
 * - When an input is focused, the form scrolls up so the focused field sits
 *   above the keyboard while the mobile number field stays partly visible,
 *   so the user can always see what they have entered.
 * - Android: extra bottom scroll room equal to the keyboard height, because
 *   KeyboardAvoidingView does not lift content there.
 * - iOS: KeyboardAvoidingView 'padding' behaviour handles the lift.
 * - Vertical centering is turned off while the keyboard is open so it does not
 *   fight the programmatic scroll.
 * - Full-area touch responsiveness: tapping anywhere inside the input box focuses the input
 * - Preserves Keyboard listeners for test lifecycle & safe area insets
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react-native';

import { ASSETS } from '../../constants/assets';
import { translations, Language } from '../../constants/translations';
import {
  authService,
  isStaffRole,
  validateIndianMobileNumber,
  validatePassword,
} from '../../services/auth/authService';
import type { LoginScreenNavigationProp } from '../../types/navigation';
import { getAppLanguage, setAppLanguage } from '../../i18n';
import { showToast } from '../../components/common/AppToast';

/** How far above the focused field we stop scrolling, so the field above it stays visible */
const SCROLL_TOP_OFFSET = 100;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Input references for full-box tap focusing
  const mobileInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Measured Y positions used to scroll the focused field into view.
  // container: centerContainer inside the ScrollView content
  // card: glass card inside centerContainer
  // mobile / password: field groups inside the card
  const layoutY = useRef({ container: 0, card: 0, mobile: 0, password: 0 });

  // Keyboard visibility tracking
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Language state (Primary: Tamil 'ta', Secondary: English 'en')
  const [language, setLanguage] = useState<Language>(() => {
    const cur = getAppLanguage();
    return cur === 'en' ? 'en' : 'ta';
  });
  const t = translations[language];

  // Form states
  const [loginRole, setLoginRole] = useState<'admin' | 'staff'>('admin');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states for input styling
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Inline validation error states
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /**
   * Listen to keyboard show/hide events across iOS and Android
   */
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e: any) => {
      setIsKeyboardVisible(true);
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  /**
   * Scrolls the form so the given field sits near the top of the visible area,
   * leaving the field above it (and the controls below it) visible
   * above the keyboard.
   */
  const scrollToField = (field: 'mobile' | 'password') => {
    // Wait for the keyboard to finish opening and the layout to settle
    setTimeout(
      () => {
        const y =
          layoutY.current.container +
          layoutY.current.card +
          layoutY.current[field];
        scrollViewRef.current?.scrollTo({
          y: Math.max(y - SCROLL_TOP_OFFSET, 0),
          animated: true,
        });
      },
      Platform.OS === 'ios' ? 60 : 280,
    );
  };

  /**
   * Focus handlers: highlight the field and scroll it above the keyboard
   */
  const handleMobileFocus = () => {
    setIsMobileFocused(true);
    scrollToField('mobile');
  };

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    scrollToField('password');
  };

  /**
   * Language change handler. Updates UI and re-evaluates active validation errors.
   */
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setAppLanguage(newLang).catch(() => {});

    if (mobileError) {
      setMobileError(validateIndianMobileNumber(mobileNumber, newLang));
    }
    if (passwordError) {
      setPasswordError(validatePassword(password, newLang));
    }
  };

  /**
   * Mobile number change handler.
   * Restricts input strictly to digits and max 10 characters.
   */
  const handleMobileChange = (text: string) => {
    const numericText = text.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(numericText);

    if (mobileError) {
      setMobileError(null);
    }
  };

  /**
   * Password change handler.
   * Clears inline error to prevent abrupt layout shifts while typing.
   */
  const handlePasswordChange = (text: string) => {
    setPassword(text);

    if (passwordError) {
      setPasswordError(null);
    }
  };

  /**
   * Form submission handler
   * Implements:
   * - Unified API endpoint integration: POST http://localhost:5000/api/v1/auth/login
   * - Exact payload: { mobileNumber, password, role: "admin" | "staff" }
   * - Role-based dashboard routing
   * - Inline validation errors only (no frontend-generated toasts)
   * - Fast, responsive loading feedback
   */
  const handleLoginSubmit = async () => {
    Keyboard.dismiss();

    // 1. Frontend validation: limited strictly to inline form errors
    const mobileErr = validateIndianMobileNumber(mobileNumber, language);
    const passErr = validatePassword(password, language);

    setMobileError(mobileErr);
    setPasswordError(passErr);

    if (mobileErr || passErr) {
      return; // Return early; inline errors displayed beneath inputs
    }

    if (loading) {
      return; // Prevent duplicate requests
    }

    try {
      setLoading(true);

      console.log('👉 [LoginScreen] Submitting login request:', {
        mobileNumber,
        role: loginRole,
        language,
      });

      const result = await authService.login(
        {
          mobileNumber,
          password,
          role: loginRole,
        },
        language,
      );

      console.log('🏁 [LoginScreen] Login outcome status:', result.status);

      if (result.status === 'success') {
        // 2. Based on selected role (admin or staff), navigate user to corresponding dashboard
        if (loginRole === 'staff' || isStaffRole(result.session.role)) {
          navigation.replace('StaffDashboard', {
            staffId: result.session.staffId || result.session.userId,
          });
        } else {
          navigation.replace('Dashboard');
        }
      } else if (result.status === 'error') {
        // 4. Handle authentication errors using API responses only. Do not display frontend-generated toast error messages.
        if (result.message) {
          showToast.error(result.message);
        }
      }
    } catch (err: any) {
      // Show API response error if an unhandled Axios error escaped
      let errorData = err?.response?.data;
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData);
        } catch (_e) {}
      }

      const apiMessage =
        (typeof errorData === 'object' && errorData !== null
          ? errorData.message ||
            errorData.errors?.credentials ||
            (typeof errorData.errors === 'string'
              ? errorData.errors
              : errorData.errors && typeof errorData.errors === 'object'
                ? Object.values(errorData.errors)[0]
                : null) ||
            errorData.error
          : typeof errorData === 'string'
            ? errorData
            : null) ||
        (err?.response?.status === 401
          ? (language === 'ta'
              ? 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.'
              : 'Invalid mobile number or password.')
          : null);

      if (apiMessage && typeof apiMessage === 'string') {
        showToast.error(apiMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isTamil = language === 'ta';

  // Bottom padding: on Android the keyboard does not push content, so we add
  // the keyboard height as extra scroll room. iOS is handled by KeyboardAvoidingView.
  const scrollBottomPadding =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 0) +
        (isKeyboardVisible ? keyboardHeight : 0) +
        24
      : Math.max(insets.bottom + 20, isKeyboardVisible ? 60 : 20);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#59f659" />

      {/* Ambient background soft concentric rings (strictly background, non-blocking) */}
      <View style={styles.ambientOuterRing} pointerEvents="none" />
      <View style={styles.ambientInnerRing} pointerEvents="none" />

      {/* Top Header Row with Auspicious Mark & Minimalist Language Switcher Pill */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        {/* Left: Auspicious Vedic insignia mark */}
        <View style={styles.auspiciousContainer}>
          <View style={styles.goldDot} />
          <Text style={styles.omShantiText}>
            {isTamil ? 'ஓம் சாந்தி' : 'OM SHANTI'}
          </Text>
        </View>

        {/* Right: Language Switcher Pill */}
        <View style={styles.langPillContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="தமிழுக்கு மாற்றவும்"
            onPress={() => handleLanguageChange('ta')}
            style={[
              styles.langPillBtn,
              isTamil && styles.langPillBtnActive,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
          >
            <Text
              style={[
                styles.langPillText,
                isTamil && styles.langPillTextActive,
              ]}
            >
              தமிழ்
            </Text>
          </Pressable>

          <Text style={styles.langPillSeparator}>|</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to English"
            onPress={() => handleLanguageChange('en')}
            style={[
              styles.langPillBtn,
              !isTamil && styles.langPillBtnActive,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}
          >
            <Text
              style={[
                styles.langPillText,
                !isTamil && styles.langPillTextActive,
              ]}
            >
              English
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: scrollBottomPadding,
              // Stop vertical centering from fighting the scroll while typing
              justifyContent: isKeyboardVisible ? 'flex-start' : 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={styles.centerContainer}
            onLayout={(e) => {
              layoutY.current.container = e.nativeEvent.layout.y;
            }}
          >
            {/* Brand Logo Container with soft ambient drop-shadow */}
            <View style={styles.brandLogoContainer}>
              <View style={styles.brandLogoHalo}>
                <Image
                  source={ASSETS.images.logo}
                  style={styles.brandLogoImage}
                  resizeMode="cover"
                  accessibilityLabel="Mandhragiri Jothidam Emblem"
                  accessibilityRole="image"
                />
              </View>
            </View>

            {/* Sacred Titles Heading */}
            <View style={styles.titleSection}>
              {isTamil ? (
                <Text style={styles.brandTitleTamil}>மந்திரகிரி ஜோதிடம்</Text>
              ) : (
                <Text style={styles.brandTitleEnglish}>Mandhragiri Jothidam</Text>
              )}
              <Text style={styles.subHeadingText}>
                {isTamil ? 'உள்நுழையவும்' : 'Sign In'}
              </Text>
            </View>

            {/* Glassmorphic Login Form Card */}
            <View
              style={styles.glassFormCard}
              onLayout={(e) => {
                layoutY.current.card = e.nativeEvent.layout.y;
              }}
            >
              {/* Role Selection Section: Divider + Two Side-by-side Role Buttons */}
              <View style={styles.roleSelectionSection}>
                {/* Divider with Center Badge */}
                <View style={styles.roleDividerWrapper}>
                  <View style={styles.roleDividerLine} />
                  <View style={styles.roleDividerBadge}>
                    <Text style={styles.roleDividerText}>
                      {isTamil ? 'உள்நுழைவு வகை' : 'SIGN IN AS'}
                    </Text>
                  </View>
                  <View style={styles.roleDividerLine} />
                </View>

                {/* Two Refined Buttons: Admin & Priest */}
                <View style={styles.roleButtonsRow}>
                  {/* Option 1: Admin */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Admin Login"
                    onPress={() => setLoginRole('admin')}
                    style={[
                      styles.roleButton,
                      loginRole === 'admin'
                        ? styles.roleButtonActive
                        : styles.roleButtonInactive,
                    ]}
                  >
                    <ShieldCheck
                      size={15}
                      color={loginRole === 'admin' ? '#E6C98A' : '#B88E28'}
                      strokeWidth={1.8}
                      style={styles.roleButtonIcon}
                    />
                    <Text
                      style={[
                        styles.roleButtonText,
                        loginRole === 'admin'
                          ? styles.roleButtonTextActive
                          : styles.roleButtonTextInactive,
                      ]}
                    >
                      {isTamil ? 'நிர்வாகி' : 'Admin'}
                    </Text>
                  </Pressable>

                  {/* Option 2: Priest */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Priest & Assistant Login"
                    onPress={() => setLoginRole('staff')}
                    style={[
                      styles.roleButton,
                      loginRole === 'staff'
                        ? styles.roleButtonActive
                        : styles.roleButtonInactive,
                    ]}
                  >
                    <Users
                      size={15}
                      color={loginRole === 'staff' ? '#E6C98A' : '#B88E28'}
                      strokeWidth={1.8}
                      style={styles.roleButtonIcon}
                    />
                    <Text
                      style={[
                        styles.roleButtonText,
                        loginRole === 'staff'
                          ? styles.roleButtonTextActive
                          : styles.roleButtonTextInactive,
                      ]}
                    >
                      {isTamil ? 'புரோகிதர்' : 'Priest'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Mobile Number Input Group */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  layoutY.current.mobile = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.fieldLabel}>
                  {isTamil ? 'மொபைல் எண்' : 'MOBILE NUMBER'}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    isMobileFocused && styles.inputContainerFocused,
                    Boolean(mobileError) && styles.inputContainerError,
                  ]}
                >
                  {/* Country Code Badge */}
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeTextIN}>IN</Text>
                    <Text style={styles.countryCodeNumber}>+91</Text>
                  </View>
                  <View style={styles.inputSeparator} />

                  {/* Phone Input */}
                  <TextInput
                    ref={mobileInputRef}
                    accessibilityLabel={isTamil ? 'மொபைல் எண்' : 'Mobile Number'}
                    style={styles.textInput}
                    placeholder={isTamil ? 'மொபைல் எண் உள்ளிடவும்' : 'Enter mobile number'}
                    placeholderTextColor="rgba(42, 77, 56, 0.35)"
                    value={mobileNumber}
                    onChangeText={handleMobileChange}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={!loading}
                    onFocus={handleMobileFocus}
                    onBlur={() => setIsMobileFocused(false)}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {mobileError ? (
                  <Text style={styles.inlineErrorText}>{mobileError}</Text>
                ) : null}
              </View>

              {/* Password Input Group */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  layoutY.current.password = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.fieldLabel}>
                  {isTamil ? 'கடவுச்சொல்' : 'PASSWORD'}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    isPasswordFocused && styles.inputContainerFocused,
                    Boolean(passwordError) && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    ref={passwordInputRef}
                    accessibilityLabel={isTamil ? 'கடவுச்சொல்' : 'Password'}
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder={isTamil ? 'கடவுச்சொல் உள்ளிடவும்' : 'Enter password'}
                    placeholderTextColor="rgba(42, 77, 56, 0.35)"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLoginSubmit}
                    editable={!loading}
                    onFocus={handlePasswordFocus}
                    onBlur={() => setIsPasswordFocused(false)}
                  />

                  {/* Password Toggle Visibility Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPasswordVisible ? t.hidePassword : t.showPassword
                    }
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.eyeToggleBtn}
                  >
                    {isPasswordVisible ? (
                      <Eye
                        size={18}
                        color="rgba(42, 77, 56, 0.55)"
                        strokeWidth={1.75}
                      />
                    ) : (
                      <EyeOff
                        size={18}
                        color="rgba(42, 77, 56, 0.55)"
                        strokeWidth={1.75}
                      />
                    )}
                  </Pressable>
                </View>
                {passwordError ? (
                  <Text style={styles.inlineErrorText}>{passwordError}</Text>
                ) : null}
              </View>

              {/* Primary Sign In CTA Button */}
              <View style={styles.actionWrapper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.submit}
                  disabled={loading}
                  onPress={handleLoginSubmit}
                  style={({ pressed }) => [
                    styles.primarySacredBtn,
                    pressed && styles.primarySacredBtnPressed,
                    loading && styles.primarySacredBtnDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#E6C98A" />
                  ) : (
                    <>
                      <Text style={styles.primarySacredBtnText}>
                        {isTamil ? 'உள்நுழை' : 'SIGN IN'}
                      </Text>
                      <ArrowRight
                        size={16}
                        color="#D4AF37"
                        strokeWidth={2.2}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Footer Branding */}
            <View style={styles.footerBranding}>
              <Text style={styles.footerBrandingText}>
                {isTamil ? 'மந்திரகிரி ஜோதிடம்' : 'Mandhragiri Jothidam'}
              </Text>
              <Text style={styles.footerSubText}>Mandhragiri Jothidam</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eeefe2',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 4,
    backgroundColor: "#eeefe2"
  },
  centerContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  
  },

  /* Ambient Concentric Rings */
  ambientOuterRing: {
    position: 'absolute',
    top: -90,
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1,
    borderColor: 'rgba(210, 223, 214, 0.6)',
    zIndex: -1,
  },
  ambientInnerRing: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    zIndex: -1,
  },

  /* Header Top Bar */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    zIndex: 10,
  },
  auspiciousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  omShantiText: {
    fontSize: 12.5,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: '#B88E28',
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* Minimalist Language Switcher Pill */
  langPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.32)',
    borderRadius: 24,
    padding: 3,
    shadowColor: '#1C3827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  langPillBtn: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 3.5,
  },
  langPillBtnActive: {
    backgroundColor: '#1C3827',
    shadowColor: '#1C3827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C3827',
  },
  langPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  langPillSeparator: {
    fontSize: 11,
    color: '#D2DFD6',
    marginHorizontal: 1,
  },

  /* Brand Logo & Emblem */
  brandLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  brandLogoHalo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.38)',
    shadowColor: '#B88E28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  /* Titles */
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitleEnglish: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2618',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  brandTitleTamil: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2618',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  subHeadingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(28, 56, 39, 0.7)',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* Soft Glassmorphism Panel */
  glassFormCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.24)',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    shadowColor: '#1C3827',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },

  /* Role Selection: SIGN IN AS / உள்நுழைவு வகை + Two Pill Buttons */
  roleSelectionSection: {
    marginBottom: 16,
  },
  roleDividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.28)',
  },
  roleDividerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  roleDividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(42, 77, 56, 0.75)',
    textTransform: 'uppercase',
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10.5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  roleButtonActive: {
    backgroundColor: '#1C3827',
    borderWidth: 1,
    borderColor: '#1C3827',
    shadowColor: '#1C3827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  roleButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(184, 142, 40, 0.28)',
  },
  roleButtonIcon: {
    marginRight: 6,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roleButtonTextInactive: {
    color: '#1C3827',
  },

  /* Input Field Groups */
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#1C3827',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(210, 223, 214, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: '#B42318',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeTextIN: {
    fontSize: 11,
    fontWeight: '800',
    color: '#946F1C',
    marginRight: 4,
  },
  countryCodeNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2618',
  },
  inputSeparator: {
    height: 20,
    width: 1,
    backgroundColor: '#D2DFD6',
    marginHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F2618',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    letterSpacing: 0.4,
  },
  passwordInput: {
    paddingRight: 8,
    letterSpacing: 0,
  },
  eyeToggleBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineErrorText: {
    fontSize: 11,
    color: '#B42318',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },

  /* Primary CTA Sacred Button */
  actionWrapper: {
    marginTop: 10,
  },
  primarySacredBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#1C3827',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#14301E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 5,
  },
  primarySacredBtnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  primarySacredBtnDisabled: {
    opacity: 0.7,
  },
  primarySacredBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#F4F7F4',
    textTransform: 'uppercase',
  },

  /* Footer */
  footerBranding: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  footerBrandingText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 13,
    letterSpacing: 1.5,
    color: 'rgba(28, 56, 39, 0.75)',
    fontWeight: '500',
  },
  footerSubText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(28, 56, 39, 0.55)',
    marginTop: 2,
  },
});