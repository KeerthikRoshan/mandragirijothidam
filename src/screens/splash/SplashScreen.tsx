/**
 * SplashScreen Component
 *
 * Plays the official Mandhragiri Jothidam animated MP4 splash video once,
 * seamlessly hides the native BootSplash, bootstraps persistent authentication,
 * and routes directly to the appropriate screen without flickering.
 *
 * Routing Rules:
 * - ADMIN / SUPER_ADMIN -> DashboardScreen
 * - PRIEST / ASSISTANT -> StaffDashboardScreen
 * - Unauthenticated or Invalid Session -> LoginScreen
 *
 * Highlights:
 * - Pure white background (#FFFFFF) to eliminate letterboxing across all device aspect ratios.
 * - resizeMode="contain" ensures the sacred circular artwork is never distorted or clipped.
 * - Fallback timer & onError handlers guarantee the user is never stuck.
 * - Single-execution navigation guards prevent duplicate transitions.
 * - No brief flash of Login before reaching Dashboard.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Video, { OnVideoErrorData } from 'react-native-video';
import BootSplash from 'react-native-bootsplash';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { ASSETS } from '../../constants/assets';
import type { SplashScreenNavigationProp } from '../../types/navigation';
import {
  authService,
  BootstrapResult,
  isStaffRole,
} from '../../services/auth/authService';

const SAFETY_TIMEOUT_MS = 10000; // 10-second safety fallback

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const hasNavigatedRef = useRef(false);

  // Synchronization between media playback and authentication bootstrap
  const isVideoDoneRef = useRef(false);
  const isBootstrapDoneRef = useRef(false);
  const bootstrapResultRef = useRef<BootstrapResult | null>(null);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  /**
   * Final atomic navigation step once both video and auth bootstrap have resolved
   */
  const performNavigation = useCallback(() => {
    if (hasNavigatedRef.current) {
      return;
    }
    hasNavigatedRef.current = true;

    // Ensure native splash is dismissed
    BootSplash.hide({ fade: true }).catch(() => {});

    const result = bootstrapResultRef.current;

    if (result && result.isAuthenticated && result.user) {
      if (isStaffRole(result.role ?? undefined)) {
        navigation.replace('StaffDashboard', {
          staffId: (result.user as any).staffId || result.user.id,
        });
      } else {
        navigation.replace('Dashboard');
      }
    } else {
      navigation.replace('Login');
    }
  }, [navigation]);

  /**
   * Check if both video playback and auth check are ready to transition
   */
  const checkReadiness = useCallback(() => {
    if (isVideoDoneRef.current && isBootstrapDoneRef.current) {
      performNavigation();
    } else if (isVideoDoneRef.current && !isBootstrapDoneRef.current) {
      // Video completed early, show subtle indicator while waiting for network check
      setShowLoadingIndicator(true);
    }
  }, [performNavigation]);

  /**
   * Run authentication bootstrap in parallel with video playback
   */
  useEffect(() => {
    let isMounted = true;

    authService
      .bootstrapAuth()
      .then(res => {
        if (!isMounted) {
          return;
        }
        bootstrapResultRef.current = res;
        isBootstrapDoneRef.current = true;
        checkReadiness();
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        bootstrapResultRef.current = {
          isAuthenticated: false,
          user: null,
          role: null,
        };
        isBootstrapDoneRef.current = true;
        checkReadiness();
      });

    return () => {
      isMounted = false;
    };
  }, [checkReadiness]);

  /**
   * Hide native BootSplash immediately when the video is ready to display
   */
  const handleReadyForDisplay = useCallback(() => {
    BootSplash.hide({ fade: true }).catch(() => {});
  }, []);

  /**
   * Fallback to hide BootSplash on media load
   */
  const handleLoad = useCallback(() => {
    BootSplash.hide({ fade: true }).catch(() => {});
  }, []);

  /**
   * When video completes single playback
   */
  const handleEnd = useCallback(() => {
    isVideoDoneRef.current = true;
    checkReadiness();
  }, [checkReadiness]);

  /**
   * Error handler: If video fails or format is unsupported, mark video done
   */
  const handleError = useCallback(
    (_error: OnVideoErrorData) => {
      isVideoDoneRef.current = true;
      checkReadiness();
    },
    [checkReadiness],
  );

  /**
   * Safety watchdog timer to prevent user from being trapped if media or network stalls
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      isVideoDoneRef.current = true;
      isBootstrapDoneRef.current = true;
      performNavigation();
    }, SAFETY_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [performNavigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Video
        source={ASSETS.videos.splash}
        style={styles.video}
        resizeMode="contain"
        repeat={false}
        paused={false}
        controls={false}
        muted={false}
        volume={1.0}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
        playWhenInactive={false}
        onReadyForDisplay={handleReadyForDisplay}
        onLoad={handleLoad}
        onEnd={handleEnd}
        onError={handleError}
      />
      {showLoadingIndicator && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Pure white (#FFFFFF)
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
});
