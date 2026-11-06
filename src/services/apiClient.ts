/**
 * Centralized Axios API Client for Mandhragiri Jothidam
 *
 * Implements:
 * - Bearer token injection on outgoing requests.
 * - Multi-language header injection (ta/en).
 * - Automatic HTTP 401 handling with refresh-token rotation.
 * - Queueing concurrent 401 requests during a single refresh operation.
 * - Infinite loop prevention.
 * - Distinguishing network failures from revoked sessions.
 * - Strict security: Never logs tokens.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { authStorage } from '../storage/authStorage';
import { getAppLanguage } from '../i18n';
import { showToast } from '../components/common/AppToast';

// Callback invoked when a session is definitively expired/revoked
type AuthExpiredCallback = () => void;
let onAuthExpiredCallback: AuthExpiredCallback | null = null;

export function setOnAuthExpired(callback: AuthExpiredCallback | null): void {
  onAuthExpiredCallback = callback;
}

interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = [];
};

/**
 * Primary configured Axios instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Attach Access Token and Language
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = API_CONFIG.BASE_URL;
    try {
      const accessToken = await authStorage.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (_error) {
      // Secure storage read error; continue without token
    }

    try {
      const lang = getAppLanguage();
      if (lang) {
        config.headers['Accept-Language'] = lang;
      }
    } catch (_error) {}

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`🌐 [apiClient Request] ${config.method?.toUpperCase() || 'GET'} ${fullUrl}`);

    return config;
  },
  (error: any) => {
    console.error('❌ [apiClient Request Setup Error]:', error);
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor: Handle HTTP 401 and Refresh Flow
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log(`📥 [apiClient Response] ${response.status} ${fullUrl}`);
    return response;
  },
  async (error: AxiosError) => {
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'UNKNOWN';
    console.error(`❌ [apiClient Response Error] ${error.response?.status || error.code || 'NETWORK_ERROR'} ${fullUrl}`);
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Check if error is 401 Unauthorized
    if (status === 401) {
      const url = originalRequest.url || '';

      // Prevent refresh loops on login or refresh endpoints
      const isAuthEndpoint =
        url.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) ||
        url.includes(API_CONFIG.ENDPOINTS.AUTH.STAFF_LOGIN) ||
        url.includes(API_CONFIG.ENDPOINTS.AUTH.REFRESH);

      if (originalRequest._retry || isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, enqueue this request
      if (isRefreshing) {
        return new Promise<any>((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await authStorage.getRefreshToken();

        if (!storedRefreshToken) {
          // No refresh token available -> clear credentials & notify
          await authStorage.clearAll();
          processQueue(error, null);
          if (onAuthExpiredCallback) {
            onAuthExpiredCallback();
          }
          return Promise.reject(error);
        }

        // Call refresh endpoint directly using raw axios to avoid interceptor recursion
        const refreshResponse = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
          {
            refreshToken: storedRefreshToken,
            refresh_token: storedRefreshToken,
          },
          {
            timeout: API_CONFIG.TIMEOUT_MS,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        // Normalize response body
        const resData = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken: string | undefined =
          resData?.token || resData?.accessToken || resData?.access_token;
        const newRefreshToken: string =
          resData?.refreshToken ||
          resData?.refresh_token ||
          storedRefreshToken;
        const expiresAt: string | undefined = resData?.expiresAt;

        if (newAccessToken) {
          // Atomically save refreshed tokens
          await authStorage.saveTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt,
          });

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh response did not return an access token');
        }
      } catch (refreshError: any) {
        const refreshStatus = refreshError.response?.status;

        // Distinguish network failure from invalid/revoked token
        if (refreshStatus === 401 || refreshStatus === 403) {
          // Token is revoked or invalid -> clear credentials and reset session
          await authStorage.clearAll();
          processQueue(refreshError, null);
          if (onAuthExpiredCallback) {
            onAuthExpiredCallback();
          }
          showToast({
            type: 'error',
            message:
              getAppLanguage() === 'ta'
                ? 'அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
                : 'Session expired. Please sign in again.',
          });
        } else {
          // Network failure or temporary server issue -> do NOT clear credentials
          processQueue(refreshError, null);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
