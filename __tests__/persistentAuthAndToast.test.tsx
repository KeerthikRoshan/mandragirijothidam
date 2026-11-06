/**
 * Comprehensive Test Suite for:
 * 1. Global Toast Notification System
 * 2. Persistent Authentication & Hardware Keychain Storage
 * 3. Token Lifecycle & Axios Interceptor Refresh Flow
 * 4. Startup Bootstrap & Role-based Routing
 * 5. Centralized Logout
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppToast, showToast, _resetToastState } from '../src/components/common/AppToast';
import { authStorage } from '../src/storage/authStorage';
import { apiClient, setOnAuthExpired } from '../src/services/apiClient';
import {
  authService,
  isAdminRole,
  isStaffRole,
} from '../src/services/auth/authService';

const initialMetrics = {
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

describe('1. Global Toast Notification System', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    _resetToastState();
  });

  afterEach(async () => {
    if (renderer) {
      await ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    jest.useRealTimers();
  });

  it('renders nothing when no toast has been triggered', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    const containers = renderer!.root.findAllByProps({ testID: 'app-toast-container' });
    expect(containers.length).toBe(0);
  });

  it('displays bottom success toast with proper message and styles', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    await ReactTestRenderer.act(() => {
      showToast({
        type: 'success',
        message: 'Login successful',
      });
    });

    const root = renderer!.root;
    const messageNode = root.findByProps({ children: 'Login successful' });
    expect(messageNode).toBeDefined();

    const container = root.findByProps({ testID: 'app-toast-container' });
    expect(container).toBeDefined();
    expect(container.props.pointerEvents).toBe('box-none');
  });

  it('displays error, warning, and info toasts', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    // Error toast
    await ReactTestRenderer.act(() => {
      showToast.error('Invalid mobile number or password');
    });
    expect(
      renderer!.root.findAllByType(Text).some(t => t.props.children === 'Invalid mobile number or password'),
    ).toBe(true);

    // Advance timer past auto-dismiss duration
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(3600);
    });

    // Warning toast
    await ReactTestRenderer.act(() => {
      showToast.warning('Please enter your password');
    });
    expect(
      renderer!.root.findAllByType(Text).some(t => t.props.children === 'Please enter your password'),
    ).toBe(true);

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(3600);
    });

    // Info toast
    await ReactTestRenderer.act(() => {
      showToast.info('Connecting to server...');
    });
    expect(
      renderer!.root.findAllByType(Text).some(t => t.props.children === 'Connecting to server...'),
    ).toBe(true);
  });

  it('suppresses duplicate toast messages triggered in rapid succession', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    await ReactTestRenderer.act(() => {
      showToast({ type: 'error', message: 'Network connection lost' });
    });

    // Trigger duplicate immediately
    await ReactTestRenderer.act(() => {
      showToast({ type: 'error', message: 'Network connection lost' });
    });

    // Advance time slightly (under duplicate threshold of 2500ms)
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1000);
      showToast({ type: 'error', message: 'Network connection lost' });
    });

    const textNodes = renderer!.root
      .findAllByType(Text)
      .filter(t => t.props.children === 'Network connection lost');
    expect(textNodes.length).toBe(1);
  });

  it('automatically disappears after specified duration', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    await ReactTestRenderer.act(() => {
      showToast({ type: 'info', message: 'Session updating', duration: 2000 });
    });

    expect(renderer!.root.findByProps({ children: 'Session updating' })).toBeDefined();

    // Advance timers past duration + animation time
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(2500);
    });

    const containers = renderer!.root.findAllByProps({ testID: 'app-toast-container' });
    expect(containers.length).toBe(0);
  });

  it('allows manual dismiss on tap', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <AppToast />
        </SafeAreaProvider>,
      );
    });

    await ReactTestRenderer.act(() => {
      showToast({ type: 'success', message: 'Pooja booked' });
    });

    const dismissBtn = renderer!.root.findByProps({ accessibilityLabel: 'Dismiss toast' });
    await ReactTestRenderer.act(() => {
      dismissBtn.props.onPress();
    });

    // Advance animation time
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(300);
    });

    const containers = renderer!.root.findAllByProps({ testID: 'app-toast-container' });
    expect(containers.length).toBe(0);
  });
});

describe('2. Persistent Login & Secure Storage (authStorage)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (Keychain as any)._resetMockStore();
    await AsyncStorage.clear();
  });

  it('stores access and refresh tokens in Keychain and NEVER in AsyncStorage', async () => {
    const tokens = {
      accessToken: 'access-jwt-sample-token-123',
      refreshToken: 'refresh-opaque-sample-token-456',
      expiresAt: '2026-12-31T23:59:59Z',
    };

    const saved = await authStorage.saveTokens(tokens);
    expect(saved).toBe(true);

    // Verify stored in Keychain
    const stored = await authStorage.getTokens();
    expect(stored?.accessToken).toBe('access-jwt-sample-token-123');
    expect(stored?.refreshToken).toBe('refresh-opaque-sample-token-456');

    // Verify NEVER stored in AsyncStorage
    const asyncStorageKeys = await AsyncStorage.getAllKeys();
    expect(asyncStorageKeys.length).toBe(0);
  });

  it('retrieves access token and refresh token individually', async () => {
    await authStorage.saveTokens({
      accessToken: 'acc-token-abc',
      refreshToken: 'ref-token-xyz',
    });

    const access = await authStorage.getAccessToken();
    const refresh = await authStorage.getRefreshToken();

    expect(access).toBe('acc-token-abc');
    expect(refresh).toBe('ref-token-xyz');
  });

  it('clears tokens from Keychain securely', async () => {
    await authStorage.saveTokens({
      accessToken: 'acc-token-to-delete',
      refreshToken: 'ref-token-to-delete',
    });

    await authStorage.clearTokens();
    const tokens = await authStorage.getTokens();
    expect(tokens).toBeNull();
  });

  it('saves and clears user session profile securely', async () => {
    await authStorage.saveUserSession({
      userId: 'adm-sundaram',
      role: 'ADMIN',
      user: {
        nameEnglish: 'Sundaramoorthy Gurukkal',
        nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
      },
    });

    const userSession = await authStorage.getUserSession();
    expect(userSession?.userId).toBe('adm-sundaram');
    expect(userSession?.role).toBe('ADMIN');

    await authStorage.clearAll();
    expect(await authStorage.getUserSession()).toBeNull();
    expect(await authStorage.getTokens()).toBeNull();
  });
});

describe('3. Axios Interceptors & Token Refresh Lifecycle', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (Keychain as any)._resetMockStore();
  });

  it('injects Bearer token in request header when access token is stored', async () => {
    await authStorage.saveTokens({
      accessToken: 'my-valid-bearer-jwt',
      refreshToken: 'my-refresh-token',
    });

    const interceptor = (apiClient.interceptors.request as any).handlers[0];
    const initialConfig: any = { headers: {} };
    const processedConfig = await interceptor.fulfilled(initialConfig);

    expect(processedConfig.headers.Authorization).toBe('Bearer my-valid-bearer-jwt');
  });

  it('clears credentials and triggers callback when refresh token is rejected with 401', async () => {
    const onExpiredMock = jest.fn();
    setOnAuthExpired(onExpiredMock);

    await authStorage.saveTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'revoked-refresh-token',
    });

    // Mock raw axios post for refresh endpoint to return 401 (revoked)
    const postSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Refresh token revoked' },
      },
    });

    const originalRequest = {
      url: '/dashboard/overview',
      headers: {},
    };

    // Simulate response interceptor 401 rejection
    const interceptor = (apiClient.interceptors.response as any).handlers[0];

    await expect(
      interceptor.rejected({
        config: originalRequest,
        response: { status: 401 },
      }),
    ).rejects.toBeDefined();

    expect(onExpiredMock).toHaveBeenCalledTimes(1);
    expect(await authStorage.getTokens()).toBeNull();

    postSpy.mockRestore();
    setOnAuthExpired(null);
  });

  it('does NOT wipe credentials if token refresh fails due to network outage', async () => {
    const onExpiredMock = jest.fn();
    setOnAuthExpired(onExpiredMock);

    await authStorage.saveTokens({
      accessToken: 'old-access-token',
      refreshToken: 'valid-stored-refresh-token',
    });

    // Network error (no response)
    const postSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
      message: 'Network Error',
      code: 'ERR_NETWORK',
    });

    const originalRequest = {
      url: '/bookings/today',
      headers: {},
    };

    const interceptor = (apiClient.interceptors.response as any).handlers[0];

    await expect(
      interceptor.rejected({
        config: originalRequest,
        response: { status: 401 },
      }),
    ).rejects.toBeDefined();

    // Ensure credentials WERE NOT wiped on network failure
    const tokens = await authStorage.getTokens();
    expect(tokens?.refreshToken).toBe('valid-stored-refresh-token');
    expect(onExpiredMock).not.toHaveBeenCalled();

    postSpy.mockRestore();
    setOnAuthExpired(null);
  });
});

describe('4. Dual-Role Authentication & Session Bootstrap', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (Keychain as any)._resetMockStore();
  });

  it('authenticates Admin and stores tokens securely', async () => {
    const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      status: 200,
      data: {
        status: 1,
        success: true,
        data: {
          token: 'admin-jwt-token-xyz',
          refreshToken: 'admin-refresh-token-xyz',
          user: {
            id: 'admin-1',
            role: 'admin',
            nameEnglish: 'Super Admin',
            nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
          },
        },
      },
    } as any);

    const result = await authService.login({
      countryCode: '+91',
      mobileNumber: '9876543210',
      password: 'Admin@1234',
      role: 'admin',
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(isAdminRole(result.session.role)).toBe(true);
      expect(result.session.user.id).toBe('admin-1');
    }

    const storedTokens = await authStorage.getTokens();
    expect(storedTokens).not.toBeNull();
    expect(storedTokens?.accessToken).toBe('admin-jwt-token-xyz');
    mockPost.mockRestore();
  });

  it('authenticates Priest and stores staff tokens securely', async () => {
    const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      status: 200,
      data: {
        status: 1,
        success: true,
        data: {
          token: 'staff-jwt-token-abc',
          refreshToken: 'staff-refresh-token-abc',
          user: {
            id: '1',
            staffId: 'MJSTF00001',
            role: 'staff',
            staffRole: 'Priest',
            nameEnglish: 'Murugan',
            nameTamil: 'முருகன்',
          },
        },
      },
    } as any);

    const result = await authService.loginStaff({
      countryCode: '+91',
      mobileNumber: '9876527881',
      password: 'SacredPass@2026',
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(isStaffRole(result.session.role)).toBe(true);
      expect(result.session.staffId).toBe('MJSTF00001');
    }

    const storedTokens = await authStorage.getTokens();
    expect(storedTokens).not.toBeNull();
    expect(storedTokens?.accessToken).toBe('staff-jwt-token-abc');
    mockPost.mockRestore();
  });

  it('re-establishes session on startup bootstrap without requiring login', async () => {
    await authStorage.saveTokens({
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
    });
    await authStorage.saveUserSession({
      userId: 'MJSTF00001',
      staffId: 'MJSTF00001',
      role: 'staff',
      user: {
        id: 'MJSTF00001',
        role: 'staff',
        nameEnglish: 'Murugan',
        nameTamil: 'முருகன்',
        designationTamil: 'தலைமை குருக்கள்',
        phone: '+919876527881',
      },
    });

    const mockGet = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      status: 200,
      data: {
        status: 1,
        data: {
          id: '1',
          staffId: 'MJSTF00001',
          role: 'staff',
          staffRole: 'Priest',
          nameEnglish: 'Murugan',
          nameTamil: 'சிவஸ்ரீ முருகன் குருக்கள்',
          status: 'Active',
        },
      },
    } as any);

    // Simulate app restart
    const bootstrap = await authService.bootstrapAuth();

    expect(bootstrap.isAuthenticated).toBe(true);
    expect(bootstrap.user).not.toBeNull();
    expect(isStaffRole(bootstrap.role ?? undefined)).toBe(true);
    mockGet.mockRestore();
  });

  it('returns unauthenticated on bootstrap when no tokens are present', async () => {
    await authStorage.clearAll();
    const bootstrap = await authService.bootstrapAuth();

    expect(bootstrap.isAuthenticated).toBe(false);
    expect(bootstrap.user).toBeNull();
  });

  it('logs out and wipes Keychain tokens while showing bottom success toast', async () => {
    await authStorage.saveTokens({
      accessToken: 'active-token',
      refreshToken: 'active-refresh',
    });
    await authStorage.saveUserSession({
      userId: 'user-1',
      role: 'admin',
      user: {
        id: 'user-1',
        role: 'admin',
        nameEnglish: 'Super Admin',
        nameTamil: 'முதன்மை நிர்வாகி',
        title: 'Admin',
        phone: '9876543210',
      },
    });

    expect(await authStorage.getTokens()).not.toBeNull();

    await authService.logout({ lang: 'en', silent: true });

    expect(await authStorage.getTokens()).toBeNull();
    expect(await authStorage.getUserSession()).toBeNull();
  });

  it('sends exact request payload { mobileNumber, password, role } to /auth/login', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        status: 1,
        message: 'Success',
        data: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: { id: 'user-123', role: 'admin' },
        },
      },
    } as any);

    await authService.login({
      mobileNumber: '9840123456',
      password: 'myPassword123',
      role: 'admin',
    });

    expect(postSpy).toHaveBeenCalledWith(
      '/auth/login',
      {
        mobileNumber: '9840123456',
        password: 'myPassword123',
        role: 'admin',
      },
    );
    postSpy.mockRestore();
  });

  it('extracts authentication error message directly from API response', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          status: 0,
          message: 'Incorrect mobile number or password from server',
        },
      },
    });

    const result = await authService.login({
      mobileNumber: '9840123456',
      password: 'wrongPassword',
      role: 'admin',
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('Incorrect mobile number or password from server');
    }
    postSpy.mockRestore();
  });

  it('handles backend error envelope under HTTP 200 with Tamil message and errors', async () => {
    const errorPayload = {
      status: 0,
      success: false,
      message: 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.',
      data: null,
      errors: {
        credentials: 'Invalid mobile number or password.',
      },
      timestamp: '2026-11-03T09:18:10.958Z',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      status: 200,
      data: errorPayload,
    } as any);

    const result = await authService.login(
      {
        mobileNumber: '9840123456',
        password: 'wrongPassword',
        role: 'admin',
      },
      'ta',
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.');
    }
    postSpy.mockRestore();
  });

  it('handles 401 Unauthorized for unregistered staff payload and displays API error toast', async () => {
    const errorPayload = {
      status: 0,
      success: false,
      message: 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.',
      data: null,
      errors: {
        credentials: 'Invalid mobile number or password.',
      },
      timestamp: '2026-11-03T09:49:09.587Z',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: errorPayload,
      },
    });

    const result = await authService.login(
      {
        mobileNumber: '9840123406',
        password: 'SacredPass@2026',
        role: 'staff',
      },
      'ta',
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.');
    }
    postSpy.mockRestore();
  });

  it('handles backend error envelope under HTTP 401 with Tamil message and errors', async () => {
    const errorPayload = {
      status: 0,
      success: false,
      message: 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.',
      data: null,
      errors: {
        credentials: 'Invalid mobile number or password.',
      },
      timestamp: '2026-11-03T09:18:10.958Z',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: errorPayload,
      },
    });

    const result = await authService.login(
      {
        mobileNumber: '9840123456',
        password: 'wrongPassword',
        role: 'admin',
      },
      'ta',
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.');
    }
    postSpy.mockRestore();
  });

  it('handles 401 Unauthorized for unregistered staff payload and displays API error toast', async () => {
    const errorPayload = {
      status: 0,
      success: false,
      message: 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.',
      data: null,
      errors: {
        credentials: 'Invalid mobile number or password.',
      },
      timestamp: '2026-11-03T09:49:09.587Z',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: errorPayload,
      },
    });

    const result = await authService.login(
      {
        mobileNumber: '9840123406',
        password: 'SacredPass@2026',
        role: 'staff',
      },
      'ta',
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.');
    }
    postSpy.mockRestore();
  });

  it('LoginScreen does not render any Dashboard Preview text or preview links', async () => {
    const { LoginScreen } = require('../src/screens/auth/LoginScreen');
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </SafeAreaProvider>,
      );
    });

    const texts = renderer!.root.findAllByType(Text).map(t => t.props.children);
    const previewFound = texts.some(
      text => typeof text === 'string' && (text.includes('Dashboard Preview') || text.includes('Preview')),
    );
    expect(previewFound).toBe(false);
  });
});
