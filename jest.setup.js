/* global jest */
/**
 * Jest Setup configuration for Mandhragiri Jothidam
 */

// Mock react-native-bootsplash native module
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockReturnValue(false),
  useHideAnimation: jest.fn(() => ({
    container: { style: {}, onLayout: jest.fn() },
    logo: { source: { uri: '' } },
    brand: { source: { uri: '' } },
  })),
}));

// Mock react-native-video component
jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockVideo = React.forwardRef((props, _ref) => {
    return React.createElement(View, { testID: 'mock-video', ...props });
  });
  MockVideo.displayName = 'MockVideo';
  return {
    __esModule: true,
    default: MockVideo,
    Video: MockVideo,
  };
});

// Mock @react-native-async-storage/async-storage
const mockAsyncStorageStore = new Map();
const mockAsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageStore.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    mockAsyncStorageStore.set(key, String(value));
    return Promise.resolve(null);
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorageStore.delete(key);
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    mockAsyncStorageStore.clear();
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockAsyncStorageStore.keys()))),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map((k) => [k, mockAsyncStorageStore.get(k) ?? null]))
  ),
  multiSet: jest.fn((keyValuePairs) => {
    keyValuePairs.forEach(([k, v]) => mockAsyncStorageStore.set(k, String(v)));
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => mockAsyncStorageStore.delete(k));
    return Promise.resolve(null);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
  ...mockAsyncStorage,
}));

// Mock react-native-keychain native module
const mockKeychainStore = new Map();
const mockKeychain = {
  SECURITY_LEVEL_ANY: 'SECURITY_LEVEL_ANY',
  SECURITY_LEVEL_SECURE_SOFTWARE: 'SECURITY_LEVEL_SECURE_SOFTWARE',
  SECURITY_LEVEL_SECURE_HARDWARE: 'SECURITY_LEVEL_SECURE_HARDWARE',
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
    ALWAYS: 'AccessibleAlways',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    ALWAYS_THIS_DEVICE_ONLY: 'AccessibleAlwaysThisDeviceOnly',
  },
  ACCESS_CONTROL: {
    USER_PRESENCE: 'UserPresence',
    BIOMETRY_ANY: 'BiometryAny',
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
    DEVICE_PASSCODE: 'DevicePasscode',
    APPLICATION_PASSWORD: 'ApplicationPassword',
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'AuthenticationTypeDevicePasscodeOrBiometrics',
    BIOMETRICS: 'AuthenticationTypeBiometrics',
  },
  setGenericPassword: jest.fn((username, password, options) => {
    const service = options?.service || 'default';
    mockKeychainStore.set(service, { username, password, service });
    return Promise.resolve(true);
  }),
  getGenericPassword: jest.fn((options) => {
    const service = options?.service || 'default';
    const item = mockKeychainStore.get(service);
    return Promise.resolve(item || false);
  }),
  resetGenericPassword: jest.fn((options) => {
    const service = options?.service || 'default';
    mockKeychainStore.delete(service);
    return Promise.resolve(true);
  }),
  setInternetCredentials: jest.fn((server, username, password, options) => {
    const service = options?.service || server || 'default';
    mockKeychainStore.set(service, { username, password, service });
    return Promise.resolve(true);
  }),
  getInternetCredentials: jest.fn((server, options) => {
    const service = options?.service || server || 'default';
    const item = mockKeychainStore.get(service);
    return Promise.resolve(item || false);
  }),
  resetInternetCredentials: jest.fn((server, options) => {
    const service = options?.service || server || 'default';
    mockKeychainStore.delete(service);
    return Promise.resolve(true);
  }),
  _mockStore: mockKeychainStore,
  _resetMockStore: () => mockKeychainStore.clear(),
};

jest.mock('react-native-keychain', () => mockKeychain);

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn((options, callback) => {
    const res = {
      assets: [{ uri: 'file://mock/camera_photo.jpg', fileName: 'camera_photo.jpg', type: 'image/jpeg' }],
    };
    if (callback) callback(res);
    return Promise.resolve(res);
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    const res = {
      assets: [{ uri: 'file://mock/gallery_photo.jpg', fileName: 'gallery_photo.jpg', type: 'image/jpeg' }],
    };
    if (callback) callback(res);
    return Promise.resolve(res);
  }),
}));

// Mock PermissionsAndroid methods for test flexibility
const { PermissionsAndroid } = require('react-native');
PermissionsAndroid.check = jest.fn(() => Promise.resolve(true));
PermissionsAndroid.request = jest.fn(() => Promise.resolve('granted'));
PermissionsAndroid.requestMultiple = jest.fn(() => Promise.resolve({}));

// Initialize central i18n for tests
require('./src/i18n');

// Mock @react-native-firebase/messaging and @react-native-firebase/app
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('mock_fcm_token_1234567890_abcdef')),
  onTokenRefresh: jest.fn(() => jest.fn()),
  default: jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve('mock_fcm_token_1234567890_abcdef')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
  })),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(() => ({})),
  default: {
    app: jest.fn(() => ({})),
  },
}));



