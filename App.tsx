/**
 * Mandhiragiri Jothidam
 * Application Entry Point
 * Instruments all 15 FCM diagnostic events, initializes notification channels,
 * and renders the 5-Minute Prominent Reminder Modal.
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AppToast } from './src/components/common/AppToast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigate } from './src/navigation/navigationRef';
import { deviceService, maskToken, getDeviceId } from './src/services/deviceService';
import { logFcmDiagnostic } from './src/utils/fcmLogger';
import {
  ProminentReminderModal,
  ProminentReminderBooking,
} from './src/components/reminders/ProminentReminderModal';

function App(): React.JSX.Element {
  const [reminderModalVisible, setReminderModalVisible] = useState<boolean>(false);
  const [activeReminderBooking, setActiveReminderBooking] = useState<ProminentReminderBooking | null>(null);
  const [activeReminderNotificationId, setActiveReminderNotificationId] = useState<string | number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        const deviceId = await getDeviceId();

        // 1. Firebase App Initialization Log
        logFcmDiagnostic({
          event: 'FCM_APP_INIT',
          deviceId,
          success: true,
          details: { platform: Platform.OS, version: Platform.Version },
        });

        // 15. Notification Channel Creation Log
        logFcmDiagnostic({
          event: 'FCM_CHANNEL_CREATED',
          deviceId,
          success: true,
          details: {
            channels: [
              { id: 'mandhiragiri_default_channel', importance: 'HIGH' },
              { id: 'mandhiragiri_reminder_channel', importance: 'HIGH_URGENT' },
            ],
          },
        });

        // Initialize Firebase Messaging
        const messagingInstance = getMessaging();

        // 5. Listen for FCM token refresh
        const unsubscribeTokenRefresh = onTokenRefresh(
          messagingInstance,
          token => {
            if (isMounted) {
              logFcmDiagnostic({
                event: 'FCM_TOKEN_REFRESH',
                deviceId,
                maskedToken: token,
                success: true,
              });
              deviceService.updateDeviceToken(token).catch(err => {
                console.warn('[FCM] Token update sync error:', err?.message || err);
              });
            }
          },
        );

        // 10 & 14. Foreground push message handler
        const unsubscribeOnMessage = onMessage(
          messagingInstance,
          async remoteMessage => {
            if (!isMounted) return;

            const correlationId = (remoteMessage.data?.correlationId as string) || null;
            logFcmDiagnostic({
              event: 'FCM_MESSAGE_FOREGROUND',
              deviceId,
              correlationId,
              success: true,
              details: {
                messageId: remoteMessage.messageId,
                data: remoteMessage.data,
                notification: remoteMessage.notification,
              },
            });

            const eventType = (remoteMessage.data?.eventType as string) || (remoteMessage.data?.reminderType as string);
            const is5mReminder = eventType === 'BOOKING_5M_REMINDER';

            if (is5mReminder) {
              // 14. Foreground display execution for 5-minute reminder modal
              logFcmDiagnostic({
                event: 'FCM_FOREGROUND_DISPLAY_EXEC',
                deviceId,
                correlationId,
                success: true,
                details: { displayHandler: 'ProminentReminderModal', bookingId: remoteMessage.data?.bookingId },
              });

              setActiveReminderNotificationId((remoteMessage.data?.notificationId as string) || undefined);
              setActiveReminderBooking({
                id: (remoteMessage.data?.bookingId as string) || (remoteMessage.data?.entityId as string),
                bookingNumber: (remoteMessage.data?.bookingNumber as string) || undefined,
                title: (remoteMessage.data?.title as string) || remoteMessage.notification?.title,
                timeSlot: (remoteMessage.data?.timeSlot as string) || (remoteMessage.data?.startTime as string),
                dateKey: (remoteMessage.data?.dateKey as string) || undefined,
                priestName: (remoteMessage.data?.priestName as string) || undefined,
              });
              setReminderModalVisible(true);
            }

            // Always display in-app toast for foreground message awareness
            const title =
              remoteMessage.notification?.title ||
              (remoteMessage.data?.title as string) ||
              'மந்திரகிரி ஜோதிடம்';
            const body =
              remoteMessage.notification?.body ||
              (remoteMessage.data?.body as string) ||
              '';

            if (title) {
              AppToast.show({
                type: is5mReminder ? 'error' : 'success',
                text1: String(title),
                text2: String(body),
                visibilityTime: is5mReminder ? 7000 : 4000,
              });
            }
          },
        );

        // 12. Notification opened by tapping from background state
        const unsubscribeOpenedApp = onNotificationOpenedApp(
          messagingInstance,
          remoteMessage => {
            if (!isMounted) return;
            const correlationId = (remoteMessage.data?.correlationId as string) || null;
            logFcmDiagnostic({
              event: 'FCM_NOTIFICATION_OPENED_APP',
              deviceId,
              correlationId,
              success: true,
              details: { data: remoteMessage.data },
            });

            const entityId = remoteMessage.data?.entityId || remoteMessage.data?.bookingId;
            if (entityId) {
              navigate('DailySchedule', { date: remoteMessage.data?.dateKey as string });
            }
          },
        );

        // 13. Notification opened from a terminated state
        getInitialNotification(messagingInstance)
          .then(remoteMessage => {
            if (remoteMessage && isMounted) {
              const correlationId = (remoteMessage.data?.correlationId as string) || null;
              logFcmDiagnostic({
                event: 'FCM_INITIAL_NOTIFICATION',
                deviceId,
                correlationId,
                success: true,
                details: { data: remoteMessage.data },
              });

              const entityId = remoteMessage.data?.entityId || remoteMessage.data?.bookingId;
              if (entityId) {
                navigate('DailySchedule', { date: remoteMessage.data?.dateKey as string });
              }
            }
          })
          .catch(err => {
            logFcmDiagnostic({
              event: 'FCM_INITIAL_NOTIFICATION',
              deviceId,
              success: false,
              errorMessage: err?.message || err,
            });
          });

        // 2 & 3. Request Android 13+ notification permission
        if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
          const permission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          logFcmDiagnostic({
            event: 'FCM_PERMISSION_STATUS',
            deviceId,
            success: true,
            details: { hasPermission: permission },
          });

          if (!permission) {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );

            logFcmDiagnostic({
              event: 'FCM_PERMISSION_RESULT_ANDROID',
              deviceId,
              success: result === PermissionsAndroid.RESULTS.GRANTED,
              details: { result },
            });
          }
        }

        // 4. Generate FCM registration token
        try {
          const token = await getToken(messagingInstance);
          if (isMounted && token) {
            logFcmDiagnostic({
              event: 'FCM_TOKEN_GENERATE',
              deviceId,
              maskedToken: token,
              success: true,
            });

            // If user is already authenticated (e.g. restored session), sync registration
            deviceService.registerDevice(token).catch(() => {});
          } else {
            logFcmDiagnostic({
              event: 'FCM_TOKEN_GENERATE',
              deviceId,
              success: false,
              errorMessage: 'Empty token returned from getToken()',
            });
          }
        } catch (tokenErr: any) {
          logFcmDiagnostic({
            event: 'FCM_TOKEN_GENERATE',
            deviceId,
            success: false,
            errorCode: tokenErr?.code,
            errorMessage: tokenErr?.message || tokenErr,
          });
        }

        return () => {
          unsubscribeTokenRefresh();
          unsubscribeOnMessage();
          unsubscribeOpenedApp();
        };

      } catch (error: any) {
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
        <NotificationProvider>
          <RootNavigator />
          <AppToast />
          <ProminentReminderModal
            visible={reminderModalVisible}
            notificationId={activeReminderNotificationId}
            booking={activeReminderBooking}
            canComplete={true}
            onDismiss={() => {
              setReminderModalVisible(false);
              setActiveReminderBooking(null);
            }}
            onOpenDetails={bookingId => {
              setReminderModalVisible(false);
              if (activeReminderBooking?.dateKey) {
                navigate('DailySchedule', { date: activeReminderBooking.dateKey });
              }
            }}
            onCompleteBooking={bookingId => {
              setReminderModalVisible(false);
              if (activeReminderBooking?.dateKey) {
                navigate('DailySchedule', { date: activeReminderBooking.dateKey });
              }
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
