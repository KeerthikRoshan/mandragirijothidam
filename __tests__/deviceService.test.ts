import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceService, maskToken, getDeviceId } from '../src/services/deviceService';
import { apiClient } from '../src/services/apiClient';
import { authStorage } from '../src/storage/authStorage';

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('mock_fcm_token_1234567890_abcdef')),
  onTokenRefresh: jest.fn(() => jest.fn()),
}));

describe('deviceService (FCM Device Token Registration)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('maskToken', () => {
    it('returns [empty] for null or empty tokens', () => {
      expect(maskToken(null)).toBe('[empty]');
      expect(maskToken(undefined)).toBe('[empty]');
      expect(maskToken('')).toBe('[empty]');
    });

    it('returns *** for short tokens', () => {
      expect(maskToken('12345')).toBe('***');
    });

    it('masks long tokens properly', () => {
      const token = 'fcm_long_token_string_1234567890_abcdef';
      const masked = maskToken(token);
      expect(masked.startsWith('fcm_lo')).toBe(true);
      expect(masked.endsWith('cdef')).toBe(true);
      expect(masked.includes('...')).toBe(true);
      expect(masked).not.toBe(token);
    });
  });

  describe('getDeviceId', () => {
    it('generates and persists a stable deviceId if none exists', async () => {
      const id1 = await getDeviceId();
      expect(id1).toBeTruthy();
      expect(id1.startsWith('dev_')).toBe(true);

      const id2 = await getDeviceId();
      expect(id2).toBe(id1);
    });
  });

  describe('registerDevice', () => {
    it('skips registration and saves pending token if user is not authenticated', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue(null);
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });

      const result = await deviceService.registerDevice('sample_fcm_token_12345');
      expect(result.status).toBe('skipped_unauthenticated');
      expect(postSpy).not.toHaveBeenCalled();

      const pending = await AsyncStorage.getItem('@fcm_pending_token');
      expect(pending).toBe('sample_fcm_token_12345');
    });

    it('registers device with backend when authenticated', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      jest.spyOn(authStorage, 'getUserSession').mockResolvedValue({
        userId: '42',
        role: 'admin',
        user: {} as any,
      });
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });

      const result = await deviceService.registerDevice('token_abc_1234567890');
      expect(result.status).toBe('registered');
      expect(postSpy).toHaveBeenCalledWith(
        '/devices/register',
        expect.objectContaining({
          fcmToken: 'token_abc_1234567890',
          platform: expect.any(String),
          deviceId: expect.any(String),
          appVersion: '0.0.1',
        })
      );

      const lastReg = await AsyncStorage.getItem('@fcm_last_registered');
      expect(lastReg).toBeTruthy();
      expect(JSON.parse(lastReg!).token).toBe('token_abc_1234567890');
      expect(JSON.parse(lastReg!).userId).toBe('42');
    });

    it('prevents duplicate registration if already registered for same user & token', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      jest.spyOn(authStorage, 'getUserSession').mockResolvedValue({
        userId: '42',
        role: 'admin',
        user: {} as any,
      });
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });

      // First registration
      await deviceService.registerDevice('token_abc_1234567890');
      expect(postSpy).toHaveBeenCalledTimes(1);

      // Second registration with same token and user
      const result2 = await deviceService.registerDevice('token_abc_1234567890');
      expect(result2.status).toBe('already_registered');
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('handles network failure gracefully without throwing and retains pending token', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      jest.spyOn(authStorage, 'getUserSession').mockResolvedValue({
        userId: '42',
        role: 'admin',
        user: {} as any,
      });
      jest.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network error (500)'));

      const result = await deviceService.registerDevice('token_to_retry_12345');
      expect(result.status).toBe('error');

      const pending = await AsyncStorage.getItem('@fcm_pending_token');
      expect(pending).toBe('token_to_retry_12345');
    });
  });

  describe('updateDeviceToken', () => {
    it('queues token as pending if token is refreshed while logged out', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue(null);
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValue({ data: { success: true } });

      await deviceService.updateDeviceToken('new_refreshed_token_12345');
      expect(putSpy).not.toHaveBeenCalled();

      const pending = await AsyncStorage.getItem('@fcm_pending_token');
      expect(pending).toBe('new_refreshed_token_12345');
    });

    it('updates token on backend when user is authenticated', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      jest.spyOn(authStorage, 'getUserSession').mockResolvedValue({
        userId: '42',
        role: 'admin',
        user: {} as any,
      });
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValue({ data: { success: true } });

      await deviceService.updateDeviceToken('new_refreshed_token_12345');
      expect(putSpy).toHaveBeenCalledWith(
        '/devices/token',
        expect.objectContaining({
          fcmToken: 'new_refreshed_token_12345',
        })
      );
    });
  });

  describe('unregisterDevice', () => {
    it('calls unregister endpoint on logout and clears local registration', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      await AsyncStorage.setItem(
        '@fcm_last_registered',
        JSON.stringify({ token: 'active_token_123', userId: '42' })
      );
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });

      await deviceService.unregisterDevice();
      expect(postSpy).toHaveBeenCalledWith(
        '/devices/unregister',
        expect.objectContaining({
          fcmToken: 'active_token_123',
          deviceId: expect.any(String),
        }),
        expect.any(Object)
      );

      const lastReg = await AsyncStorage.getItem('@fcm_last_registered');
      expect(lastReg).toBeNull();
    });

    it('does not throw or fail if network fails during unregister', async () => {
      jest.spyOn(authStorage, 'getAccessToken').mockResolvedValue('valid_jwt_access_token');
      jest.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network timeout'));

      await expect(deviceService.unregisterDevice()).resolves.not.toThrow();
    });
  });
});
