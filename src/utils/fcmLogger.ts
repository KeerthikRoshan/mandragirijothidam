/**
 * FCM Push Notification Diagnostic Logger for Mandhiragiri Jothidam
 * Instruments all 15 client-side lifecycle and delivery events.
 * Enforces strict security: Masked tokens only, no secrets or auth tokens logged.
 */

import { Platform } from 'react-native';

export type FcmDiagnosticEvent =
  | 'FCM_APP_INIT'                          // 1. Firebase app initialization
  | 'FCM_PERMISSION_STATUS'                 // 2. Notification permission status
  | 'FCM_PERMISSION_RESULT_ANDROID'         // 3. Android notification permission result (Android 13+)
  | 'FCM_TOKEN_GENERATE'                    // 4. FCM token generation success/failure
  | 'FCM_TOKEN_REFRESH'                     // 5. FCM token refresh
  | 'FCM_DEVICE_REGISTER_REQUEST'           // 6. Device registration API request
  | 'FCM_DEVICE_REGISTER_RESPONSE'          // 7. Device registration API response
  | 'FCM_USER_CONTEXT'                      // 8. Authenticated user ID and role used for registration
  | 'FCM_TOKEN_LIFECYCLE'                   // 9. Device token activation/deactivation
  | 'FCM_MESSAGE_FOREGROUND'                // 10. Notification received while app is foregrounded
  | 'FCM_MESSAGE_BACKGROUND'                // 11. Notification received while app is backgrounded
  | 'FCM_NOTIFICATION_OPENED_APP'           // 12. Notification opened by tapping
  | 'FCM_INITIAL_NOTIFICATION'              // 13. Notification opened from a terminated state
  | 'FCM_FOREGROUND_DISPLAY_EXEC'           // 14. Foreground notification display handler execution
  | 'FCM_CHANNEL_CREATED';                  // 15. Notification channel creation and importance

export interface FcmLogPayload {
  event: FcmDiagnosticEvent;
  deviceId?: string;
  userId?: string | number | null;
  role?: string | null;
  correlationId?: string | null;
  success: boolean;
  maskedToken?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  details?: Record<string, any>;
}

/**
 * Mask token for safe logging (e.g. c1Mebu...B7bY)
 */
export const maskToken = (token: string | null | undefined): string => {
  if (!token || typeof token !== 'string') return '[empty]';
  if (token.length <= 10) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
};

/**
 * Emit structured diagnostic log to console and optional log handlers
 */
export const logFcmDiagnostic = (payload: FcmLogPayload): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    event: payload.event,
    deviceId: payload.deviceId || 'unknown',
    userId: payload.userId ?? null,
    role: payload.role ?? null,
    correlationId: payload.correlationId ?? null,
    success: payload.success,
    maskedToken: payload.maskedToken ? maskToken(payload.maskedToken) : null,
    errorCode: payload.errorCode ?? null,
    errorMessage: payload.errorMessage ? String(payload.errorMessage).slice(0, 500) : null,
    details: payload.details || {},
  };

  const prefix = payload.success ? '🔔 [FCM_DIAGNOSTIC:SUCCESS]' : '⚠️ [FCM_DIAGNOSTIC:FAILURE]';
  console.log(`${prefix} ${payload.event}`, JSON.stringify(logEntry, null, 2));
};
