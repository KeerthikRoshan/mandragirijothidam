/**
 * Global AppToast Notification System
 * Sacred Vedic Luxury Toast for Mandhragiri Jothidam
 *
 * Features:
 * - Positioned at bottom above safe area / navigation bar.
 * - Deep velvet green background (#0B3D2E) with sacred gold border (#C6A15B).
 * - Lucide icons for Success, Error, Warning, and Info.
 * - Auto-dismiss with configurable duration.
 * - Duplicate suppression within 2.5 seconds.
 * - Multi-line word wrapping without overflow.
 * - Non-blocking pointerEvents="box-none" wrapper.
 * - Global imperative helper `showToast({ type, message })`.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ShowToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (payload: ToastPayload) => void;

// Active listeners and deduplication tracker
const listeners = new Set<ToastListener>();
let lastMessage = '';
let lastTriggerTime = 0;
const DUPLICATE_SUPPRESSION_MS = 600;
const DEFAULT_DURATION_MS = 3500;
const ERROR_DURATION_MS = 4500;

export function _resetToastState(): void {
  lastMessage = '';
  lastTriggerTime = 0;
}

/**
 * Imperative global helper to show a toast anywhere in the app
 * (usable inside screens, hooks, services, or Axios interceptors)
 */
export function showToast(options: ShowToastOptions): void {
  if (!options || !options.message) {
    return;
  }

  const now = Date.now();
  // Prevent duplicate toast messages within suppression window
  if (
    options.message === lastMessage &&
    now - lastTriggerTime < DUPLICATE_SUPPRESSION_MS
  ) {
    return;
  }

  lastMessage = options.message;
  lastTriggerTime = now;

  const defaultDuration =
    options.type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS;

  const payload: ToastPayload = {
    id: `toast_${now}_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type,
    message: options.message,
    duration: options.duration || defaultDuration,
  };

  listeners.forEach(listener => listener(payload));
}

// Convenience alias helpers
showToast.success = (message: string, duration?: number) =>
  showToast({ type: 'success', message, duration });
showToast.error = (message: string, duration?: number) =>
  showToast({ type: 'error', message, duration: duration || ERROR_DURATION_MS });
showToast.warning = (message: string, duration?: number) =>
  showToast({ type: 'warning', message, duration });
showToast.info = (message: string, duration?: number) =>
  showToast({ type: 'info', message, duration });

/**
 * Theme configuration per toast type
 */
const TOAST_THEME = {
  success: {
    icon: CheckCircle2,
    iconColor: '#34D399', // Mint emerald
    borderColor: '#1F8A70', // Primary Green Accent
    accentPill: '#134E3C',
    title: 'Success',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#F87171', // Soft Crimson
    borderColor: '#C64242', // Error Red
    accentPill: '#4A1D1D',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#FBBF24', // Warm Gold Amber
    borderColor: '#C6A15B', // Sacred Vedic Gold
    accentPill: '#4D3B16',
    title: 'Warning',
  },
  info: {
    icon: Info,
    iconColor: '#C6A15B', // Sacred Vedic Gold
    borderColor: '#C6A15B',
    accentPill: '#1A3F33',
    title: 'Information',
  },
};

/**
 * Global AppToast Component mounted at application root
 */
export const AppToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(24)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track virtual keyboard height dynamically on iOS and Android
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const dismissToast = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
      _resetToastState();
    });
  }, [opacityAnim, translateYAnim]);

  useEffect(() => {
    const handleToast = (payload: ToastPayload) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setCurrentToast(payload);
      opacityAnim.setValue(0);
      translateYAnim.setValue(24);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      const duration =
        payload.duration ||
        (payload.type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);

      hideTimeoutRef.current = setTimeout(() => {
        dismissToast();
      }, duration);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [dismissToast, opacityAnim, translateYAnim]);

  if (!currentToast) {
    return null;
  }

  const theme = TOAST_THEME[currentToast.type] || TOAST_THEME.info;
  const IconComponent = theme.icon;

  // Position above keyboard if active, or above bottom safe-area insets
  const baseBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12) + 16;
  const bottomInset = keyboardHeight > 0 ? keyboardHeight + 16 : baseBottom;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={dismissToast}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        <View
          style={[styles.overlayContainer, { bottom: bottomInset }]}
          pointerEvents="box-none"
          testID="app-toast-container"
        >
          <Animated.View
            style={[
              styles.toastCard,
              {
                borderColor: theme.borderColor,
                opacity: opacityAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Pressable
              style={styles.contentRow}
              onPress={dismissToast}
              hitSlop={8}
              accessibilityLabel={`${theme.title}: ${currentToast.message}`}
            >
              {/* Status Icon */}
              <View
                style={[styles.iconWrapper, { backgroundColor: theme.accentPill }]}
              >
                <IconComponent size={20} color={theme.iconColor} strokeWidth={2.4} />
              </View>

              {/* Toast Message Body */}
              <View style={styles.textContainer}>
                <Text
                  style={styles.messageText}
                  numberOfLines={4}
                  ellipsizeMode="tail"
                >
                  {currentToast.message}
                </Text>
              </View>

              {/* Quick Dismiss Cross */}
              <Pressable
                style={styles.dismissButton}
                onPress={dismissToast}
                hitSlop={12}
                accessibilityLabel="Dismiss toast"
                accessibilityRole="button"
              >
                <X size={15} color="#C6A15B" strokeWidth={2} />
              </Pressable>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 9999,
  },
  toastCard: {
    width: Math.min(SCREEN_WIDTH - 28, 440),
    backgroundColor: '#0F2E23', // Deep Vedic forest velvet green
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FCFBF7', // Cream pearl white for high contrast readability
    fontWeight: '500',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  dismissButton: {
    padding: 4,
    marginLeft: 2,
    borderRadius: 10,
  },
});
