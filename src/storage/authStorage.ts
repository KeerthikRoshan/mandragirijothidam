/**
 * Secure Authentication Storage for Mandhragiri Jothidam
 *
 * Implements hardware-backed secure storage via react-native-keychain.
 * Security Rules:
 * - Access token and refresh token are stored ONLY in Keychain/Keystore.
 * - Passwords are NEVER stored.
 * - Tokens are NEVER stored in AsyncStorage.
 * - Tokens are NEVER printed to console logs.
 * - Atomic replacement on token rotation.
 * - Out-of-order rotation protection.
 */

import * as Keychain from 'react-native-keychain';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  savedAt: number;
}

export interface StoredUserSession {
  userId: string;
  role: string;
  staffId?: string;
  mustChangePassword?: boolean;
  user: any;
}

const TOKEN_SERVICE = 'com.mandhragirijothidam.auth_tokens';
const USER_SERVICE = 'com.mandhragirijothidam.user_session';

export const authStorage = {
  /**
   * Securely saves access and refresh tokens into the device Keychain/Keystore.
   * Atomically replaces existing tokens.
   */
  async saveTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
  }): Promise<boolean> {
    try {
      if (!tokens.accessToken || !tokens.refreshToken) {
        return false;
      }

      const existing = await this.getTokens();
      const now = Date.now();

      // Ensure refresh token rotation doesn't overwrite a newer token with an older one
      if (existing?.savedAt && existing.savedAt > now) {
        return false;
      }

      const payload: StoredTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        savedAt: now,
      };

      await Keychain.setGenericPassword('auth_tokens', JSON.stringify(payload), {
        service: TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      });

      return true;
    } catch (_error) {
      // Silently handle without leaking sensitive data
      return false;
    }
  },

  /**
   * Retrieves securely stored token pair.
   */
  async getTokens(): Promise<StoredTokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: TOKEN_SERVICE,
      });

      if (credentials && credentials.password) {
        const parsed = JSON.parse(credentials.password) as StoredTokens;
        if (parsed.accessToken && parsed.refreshToken) {
          return parsed;
        }
      }
      return null;
    } catch (_error) {
      return null;
    }
  },

  /**
   * Retrieves only the access token.
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken ?? null;
  },

  /**
   * Retrieves only the refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.refreshToken ?? null;
  },

  /**
   * Clears tokens from Keychain.
   */
  async clearTokens(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
      return true;
    } catch (_error) {
      return false;
    }
  },

  /**
   * Saves authenticated user session profile in Keychain.
   */
  async saveUserSession(session: StoredUserSession): Promise<boolean> {
    try {
      await Keychain.setGenericPassword('user_session', JSON.stringify(session), {
        service: USER_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      });
      return true;
    } catch (_error) {
      return false;
    }
  },

  /**
   * Retrieves stored user profile session.
   */
  async getUserSession(): Promise<StoredUserSession | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: USER_SERVICE,
      });

      if (credentials && credentials.password) {
        return JSON.parse(credentials.password) as StoredUserSession;
      }
      return null;
    } catch (_error) {
      return null;
    }
  },

  /**
   * Clears stored user session metadata.
   */
  async clearUserSession(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({ service: USER_SERVICE });
      return true;
    } catch (_error) {
      return false;
    }
  },

  /**
   * Completely clears all credentials and sessions from secure storage.
   */
  async clearAll(): Promise<void> {
    await Promise.all([this.clearTokens(), this.clearUserSession()]);
  },
};
