/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { logFcmDiagnostic } from './src/utils/fcmLogger';

// 11. Notification received while app is backgrounded / terminated
try {
  const messagingInstance = getMessaging();
  setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
    const correlationId = remoteMessage.data?.correlationId || null;
    logFcmDiagnostic({
      event: 'FCM_MESSAGE_BACKGROUND',
      correlationId,
      success: true,
      details: {
        messageId: remoteMessage.messageId,
        data: remoteMessage.data,
        notification: remoteMessage.notification,
      },
    });
  });
} catch (err) {
  console.warn('[FCM Background] Failed to register background message handler:', err?.message || err);
}

AppRegistry.registerComponent(appName, () => App);
