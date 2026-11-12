/**
 * Device Service for FCM Push Notification Token Registration
 *
 * Implements:
 * 1. Persistent device identifier generation via AsyncStorage.
 * 2. Device registration (POST /api/v1/devices/register) with backend when authenticated.
 * 3. Token refresh update (PUT /api/v1/devices/token).
 * 4. Safe offline caching of refreshed tokens when logged out or during network failure.
 * 5. Device unregistration (POST /api/v1/devices/unregister) on logout.
 * 6. Duplicate registration prevention.
 * 7. Masked token logging to protect user security.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import { authStorage } from '../storage/authStorage';
import { logFcmDiagnostic } from '../utils/fcmLogger';

const STORAGE_KEYS = {
  DEVICE_ID: '@fcm_device_id',
  LAST_REGISTERED: '@fcm_last_registered',
  PENDING_TOKEN: '@fcm_pending_token',
};

const APP_VERSION = '0.0.1';

/**
 * Mask token string for safe logging (e.g. c_X789...yz99)
 */
export const maskToken = (token: string | null | undefined): string => {
  if (!token || typeof token !== 'string') return '[empty]';
  if (token.length <= 10) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
};

/**
 * Get or generate a persistent device identifier
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (existing) {
      return existing;
    }
    const generated = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, generated);
    return generated;
  } catch {
    return `dev_fallback_${Platform.OS}`;
  }
};

export const deviceService = {
  /**
   * Get currently pending or cached FCM token
   */
  async getPendingToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TOKEN);
    } catch {
      return null;
    }
  },

  /**
   * Register device with the backend
   * Only executes if the user is currently authenticated with a valid token.
   * If logged out or network fails, queues token for the next authenticated launch.
   */
  async registerDevice(tokenParam?: string): Promise<{
    status: 'registered' | 'already_registered' | 'skipped_unauthenticated' | 'error' | 'no_token';
    message?: string;
  }> {
    try {
      // 1. Verify user is currently authenticated
      const accessToken = await authStorage.getAccessToken();
      if (!accessToken) {
        if (tokenParam) {
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TOKEN, tokenParam);
        }
        return { status: 'skipped_unauthenticated', message: 'User is not logged in. Registration skipped.' };
      }

      // 2. Resolve token: parameter -> pending cached token -> FCM getToken()
      let tokenToRegister = tokenParam;

      if (!tokenToRegister) {
        tokenToRegister = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TOKEN) || undefined;
      }

      if (!tokenToRegister) {
        try {
          const messagingInstance = getMessaging();
          const fetchedToken = await getToken(messagingInstance);
          if (fetchedToken) {
            tokenToRegister = fetchedToken;
          }
        } catch (fetchErr: any) {
          console.warn('[deviceService] Could not fetch FCM token:', fetchErr?.message || fetchErr);
        }
      }

      if (!tokenToRegister) {
        return { status: 'no_token', message: 'No FCM token available.' };
      }

      // 3. Obtain user context to prevent duplicate registrations for the same user & token
      const session = await authStorage.getUserSession();
      const currentUserId = session?.userId ? String(session.userId) : 'authenticated';
      const userRole = session?.role || 'unknown';

      logFcmDiagnostic({
        event: 'FCM_USER_CONTEXT',
        userId: currentUserId,
        role: userRole,
        success: true,
        details: { staffId: session?.staffId }
      });

      const lastRegisteredRaw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED);
      if (lastRegisteredRaw) {
        try {
          const lastRegistered = JSON.parse(lastRegisteredRaw);
          if (
            lastRegistered.token === tokenToRegister &&
            lastRegistered.userId === currentUserId &&
            Date.now() - (lastRegistered.timestamp || 0) < 24 * 60 * 60 * 1000 // 24 hours
          ) {
            return { status: 'already_registered', message: 'Device already registered for current user.' };
          }
        } catch {}
      }

      // 4. Send registration payload to backend
      const deviceId = await getDeviceId();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      logFcmDiagnostic({
        event: 'FCM_DEVICE_REGISTER_REQUEST',
        deviceId,
        userId: currentUserId,
        role: userRole,
        maskedToken: tokenToRegister,
        success: true,
        details: { platform, appVersion: APP_VERSION }
      });

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.DEVICES.REGISTER, {
        fcmToken: tokenToRegister,
        platform,
        deviceId,
        appVersion: APP_VERSION,
      });

      logFcmDiagnostic({
        event: 'FCM_DEVICE_REGISTER_RESPONSE',
        deviceId,
        userId: currentUserId,
        role: userRole,
        maskedToken: tokenToRegister,
        success: true,
        details: { responseStatus: response.status }
      });

      logFcmDiagnostic({
        event: 'FCM_TOKEN_LIFECYCLE',
        deviceId,
        userId: currentUserId,
        role: userRole,
        maskedToken: tokenToRegister,
        success: true,
        details: { action: 'activate_token' }
      });

      // 5. Update local state
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_REGISTERED,
        JSON.stringify({
          token: tokenToRegister,
          userId: currentUserId,
          timestamp: Date.now(),
        })
      );
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_TOKEN);

      console.log(`[deviceService] Device registered successfully for user ${currentUserId} with token: ${maskToken(tokenToRegister)}`);
      return { status: 'registered' };
    } catch (err: any) {
      logFcmDiagnostic({
        event: 'FCM_DEVICE_REGISTER_RESPONSE',
        success: false,
        maskedToken: tokenParam,
        errorCode: err?.code || 'REGISTRATION_ERROR',
        errorMessage: err?.message || 'Network error'
      });
      console.warn('[deviceService] Device registration failed, retaining token for next launch:', err?.message || err);
      if (tokenParam) {
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TOKEN, tokenParam).catch(() => {});
      }
      return { status: 'error', message: err?.message || 'Network error' };
    }
  },

  /**
   * Update device token on token refresh
   */
  async updateDeviceToken(newToken: string): Promise<void> {
    if (!newToken) return;

    try {
      // Always store as pending token in case user is logged out or offline
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TOKEN, newToken);

      const accessToken = await authStorage.getAccessToken();
      if (!accessToken) {
        console.log(`[deviceService] Token refreshed while logged out, queued: ${maskToken(newToken)}`);
        return;
      }

      const deviceId = await getDeviceId();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      await apiClient.put(API_CONFIG.ENDPOINTS.DEVICES.UPDATE_TOKEN, {
        fcmToken: newToken,
        deviceId,
        platform,
        appVersion: APP_VERSION,
      });

      const session = await authStorage.getUserSession();
      const currentUserId = session?.userId ? String(session.userId) : 'authenticated';

      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_REGISTERED,
        JSON.stringify({
          token: newToken,
          userId: currentUserId,
          timestamp: Date.now(),
        })
      );
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_TOKEN);

      console.log(`[deviceService] Token update synced to backend: ${maskToken(newToken)}`);
    } catch (err: any) {
      console.warn('[deviceService] Token refresh update failed, stored as pending:', err?.message || err);
    }
  },

  /**
   * Unregister device on logout
   * Deactivates the device record for the authenticated user without blocking logout.
   */
  async unregisterDevice(): Promise<void> {
    try {
      const accessToken = await authStorage.getAccessToken();
      if (!accessToken) {
        return;
      }

      const deviceId = await getDeviceId();

      // Retrieve token from last registration or pending storage
      let fcmToken: string | undefined;
      const lastRegisteredRaw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED);
      if (lastRegisteredRaw) {
        try {
          fcmToken = JSON.parse(lastRegisteredRaw)?.token;
        } catch {}
      }
      if (!fcmToken) {
        fcmToken = (await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TOKEN)) || undefined;
      }

      await apiClient.post(
        API_CONFIG.ENDPOINTS.DEVICES.UNREGISTER,
        {
          fcmToken,
          deviceId,
        },
        { timeout: 3500 }
      );

      logFcmDiagnostic({
        event: 'FCM_TOKEN_LIFECYCLE',
        deviceId,
        maskedToken: fcmToken,
        success: true,
        details: { action: 'deactivate_token_logout' }
      });

      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_REGISTERED);
      console.log('[deviceService] Device unregistered successfully on logout');
    } catch (err: any) {
      // Non-fatal on logout; local tokens must always be cleared
      console.warn('[deviceService] Device unregister request failed on logout (proceeding with local cleanup):', err?.message || err);
    }
  },
};
