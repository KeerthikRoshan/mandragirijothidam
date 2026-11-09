
/**
 * Mandhiragiri Jothidam
 * Application Entry Point
 */

import React, { useEffect } from 'react';
import {
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { AppToast } from './src/components/common/AppToast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { deviceService, maskToken } from './src/services/deviceService';

function App(): React.JSX.Element {

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        // Initialize Firebase Messaging
        const messagingInstance = getMessaging();

        // Listen for FCM token refresh
        const unsubscribeTokenRefresh = onTokenRefresh(
          messagingInstance,
          token => {
            if (isMounted) {
              console.log('FCM TOKEN REFRESHED:', maskToken(token));
              deviceService.updateDeviceToken(token).catch(err => {
                console.warn('[FCM] Token update sync error:', err?.message || err);
              });
            }
          },
        );

        // Request Android 13+ notification permission
        if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
          const permission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          if (!permission) {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );

            console.log('Notification permission:', result);
          } else {
            console.log('Notification permission already granted');
          }
        }

        // Generate FCM registration token
        const token = await getToken(messagingInstance);

        if (isMounted && token) {
          console.log('FCM DEVICE TOKEN:', maskToken(token));
          console.log('FCM TOKEN GENERATED SUCCESSFULLY');
          // If user is already authenticated (e.g. restored session), sync registration
          deviceService.registerDevice(token).catch(() => {});
        }

        return unsubscribeTokenRefresh;

      } catch (error) {
        console.error('FCM INITIALIZATION ERROR:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;

    initializeNotifications().then(cleanup => {
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <RootNavigator />
        <AppToast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
