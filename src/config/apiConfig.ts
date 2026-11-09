/**
 * API Configuration for Mandhragiri Jothidam
 * Centralized endpoint catalogue and global environment settings
 *
 * Current Global Server URL: http://localhost:5000
 * Global Login Endpoint: POST http://localhost:5000/api/v1/auth/login
 */

export type Environment = 'development' | 'test' | 'preprod' | 'production';

export const ENVIRONMENTS: Record<Environment, { BASE_URL: string }> = {
  development: {
    BASE_URL: 'http://10.18.29.141:5000',
  },
  test: {
    BASE_URL: 'https://test-api.mandhragirijothidam.com',
  },
  preprod: {
    BASE_URL: 'https://preprod-api.mandhragirijothidam.com',
  },
  production: {
    BASE_URL: 'https://api.mandhragirijothidam.com',
  },
};

// Global active environment setting (Default: development -> http://localhost:5000)
export let CURRENT_ENVIRONMENT: Environment = 'development';

export function setApiEnvironment(env: Environment): void {
  CURRENT_ENVIRONMENT = env;
}

export function getApiBaseUrl(): string {
  return ENVIRONMENTS[CURRENT_ENVIRONMENT].BASE_URL;
}

export const API_CONFIG = {
  get SERVER_URL() {
    return getApiBaseUrl();
  },
  get BASE_URL() {
    return `${getApiBaseUrl()}/api/v1`;
  },
  AUTH_LOGIN_PATH: '/auth/login',
  TIMEOUT_MS: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      STAFF_LOGIN: '/auth/staff-login',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      LOGOUT: '/auth/logout',
      VERIFY_TOKEN: '/auth/verify-token',
    },
    STAFF: {
      LIST: '/staff',
      CREATE: '/createStaff',
      PROFILE: '/staff/me/profile',
      DASHBOARD: '/staff/me/dashboard',
      UPDATE: (id: string | number) => `/staff/${id}`,
    },
    ATTENDANCE: {
      DAILY: '/attendance/daily',
      RECORD: '/attendance/record',
      MONTHLY: (staffId: string | number) => `/attendance/${staffId}/monthly`,
    },
    BOOKINGS: {
      LIST: '/bookings',
      CREATE: '/bookings',
      CHECK_AVAILABILITY: '/bookings/check-availability',
      EVENT_TYPES: '/bookings/event-types',
      BY_DATE: (date: string) => `/bookings?date=${date}`,
      BY_PRIEST: (priestId: string | number) => `/bookings/priest/${priestId}`,
      FINANCIAL_AUDITS_SUMMARY: '/bookings/financial-audits/summary',
      FINANCIAL_AUDITS_SETTLEMENTS: '/bookings/financial-audits/settlements',
      FINANCIAL_AUDITS_TRANSACTIONS: '/bookings/financial-audits/transactions',
      DETAILS: (id: string | number) => `/bookings/${id}`,
      UPDATE: (id: string | number) => `/bookings/${id}`,
      DELETE: (id: string | number) => `/bookings/${id}`,
      PAYMENTS: (id: string | number) => `/bookings/${id}/payments`,
    },
    DEVICES: {
      REGISTER: '/devices/register',
      UPDATE_TOKEN: '/devices/token',
      UNREGISTER: '/devices/unregister',
    },
    NOTIFICATIONS: {
      LIST: '/notifications',
      UNREAD_COUNT: '/notifications/unread-count',
      READ: (id: string | number) => `/notifications/${id}/read`,
      READ_ALL: '/notifications/read-all',
      DELETE: (id: string | number) => `/notifications/${id}`,
      PREFERENCES: '/notifications/preferences',
    },
  },
  HEADERS: {
    ACCEPT_LANGUAGE: 'Accept-Language',
    AUTHORIZATION: 'Authorization',
  },
};

export type ApiEndpoints = typeof API_CONFIG.ENDPOINTS;
