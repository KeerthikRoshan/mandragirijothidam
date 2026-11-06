/**
 * Authentication Context for Mandhragiri Jothidam
 * Centralized reactive auth state, role verification, and session lifecycle
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  authService,
  AuthResult,
  BootstrapResult,
  LoginCredentials,
  UserRole,
} from '../services/auth/authService';
import { AuthUserProfile } from '../types/staffPortal';
import { setOnAuthExpired } from '../services/apiClient';
import { getAppLanguage } from '../i18n';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUserProfile | null;
  role: UserRole | null;
  mustChangePassword: boolean;
  isOffline: boolean;
  login: (credentials: LoginCredentials, lang?: any) => Promise<AuthResult>;
  loginStaff: (credentials: LoginCredentials, lang?: any) => Promise<AuthResult>;
  logout: (options?: { silent?: boolean }) => Promise<void>;
  bootstrapAuth: () => Promise<BootstrapResult>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  /**
   * Run authentication bootstrap to restore session from Keychain
   */
  const bootstrapAuth = useCallback(async (): Promise<BootstrapResult> => {
    setIsLoading(true);
    try {
      const result = await authService.bootstrapAuth();
      setIsAuthenticated(result.isAuthenticated);
      setUser(result.user);
      setRole(result.role);
      setMustChangePassword(Boolean(result.mustChangePassword));
      setIsOffline(Boolean(result.isOffline));
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register with API client to handle session expiry automatically
   */
  useEffect(() => {
    setOnAuthExpired(() => {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setMustChangePassword(false);
    });

    // Run startup bootstrap
    bootstrapAuth().catch(() => {});

    return () => {
      setOnAuthExpired(null);
    };
  }, [bootstrapAuth]);

  /**
   * Refresh current user profile from /auth/me
   */
  const refreshUser = useCallback(async () => {
    const updated = await authService.getCurrentUser();
    if (updated) {
      setUser(updated);
      if (updated.role) {
        setRole(updated.role);
      }
    }
  }, []);

  /**
   * Admin Login handler
   */
  const login = useCallback(
    async (credentials: LoginCredentials, lang?: any): Promise<AuthResult> => {
      const activeLang = lang || getAppLanguage() || 'ta';
      const result = await authService.login(credentials, activeLang);

      if (result.status === 'success') {
        setIsAuthenticated(true);
        setUser(result.session.user);
        setRole(result.session.role);
        setMustChangePassword(Boolean(result.session.mustChangePassword));
        setIsOffline(false);
      }

      return result;
    },
    [],
  );

  /**
   * Staff (Priest / Assistant) Login handler
   */
  const loginStaff = useCallback(
    async (credentials: LoginCredentials, lang?: any): Promise<AuthResult> => {
      const activeLang = lang || getAppLanguage() || 'ta';
      const result = await authService.loginStaff(credentials, activeLang);

      if (result.status === 'success') {
        setIsAuthenticated(true);
        setUser(result.session.user);
        setRole(result.session.role);
        setMustChangePassword(Boolean(result.session.mustChangePassword));
        setIsOffline(false);
      }

      return result;
    },
    [],
  );

  /**
   * Centralized Logout
   */
  const logout = useCallback(async (options?: { silent?: boolean }) => {
    const lang = getAppLanguage() === 'ta' ? 'ta' : 'en';
    await authService.logout({ silent: options?.silent, lang });
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setMustChangePassword(false);
    setIsOffline(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      role,
      mustChangePassword,
      isOffline,
      login,
      loginStaff,
      logout,
      bootstrapAuth,
      refreshUser,
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      role,
      mustChangePassword,
      isOffline,
      login,
      loginStaff,
      logout,
      bootstrapAuth,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
