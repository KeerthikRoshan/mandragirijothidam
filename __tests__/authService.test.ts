import {
  validateIndianMobileNumber,
  validatePassword,
  validateLoginForm,
  authService,
} from '../src/services/auth/authService';
import { apiClient } from '../src/services/apiClient';
import { authStorage } from '../src/storage/authStorage';
import axios from 'axios';

describe('authService & validation', () => {
  describe('validateIndianMobileNumber', () => {
    it('returns error when mobile number is empty (Tamil default)', () => {
      expect(validateIndianMobileNumber('')).toBe('மொபைல் எண்ணை உள்ளிடவும்');
    });

    it('returns error when mobile number is empty (English)', () => {
      expect(validateIndianMobileNumber('', 'en')).toBe(
        'Please enter your mobile number',
      );
    });

    it('returns error when mobile number is less than 10 digits', () => {
      expect(validateIndianMobileNumber('987654321')).toBe(
        'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்',
      );
      expect(validateIndianMobileNumber('987654321', 'en')).toBe(
        'Please enter a valid 10-digit mobile number',
      );
    });

    it('returns error when mobile number does not start with 6-9', () => {
      expect(validateIndianMobileNumber('5123456789')).toBe(
        'மொபைல் எண் 6, 7, 8 அல்லது 9 இல் தொடங்க வேண்டும்',
      );
      expect(validateIndianMobileNumber('1234567890', 'en')).toBe(
        'Mobile number must start with 6, 7, 8, or 9',
      );
    });

    it('passes for valid 10-digit Indian numbers starting with 6, 7, 8, or 9', () => {
      expect(validateIndianMobileNumber('9876543210')).toBeNull();
      expect(validateIndianMobileNumber('8123456789', 'en')).toBeNull();
      expect(validateIndianMobileNumber('7012345678')).toBeNull();
      expect(validateIndianMobileNumber('6381234567', 'en')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('returns error when password is empty', () => {
      expect(validatePassword('')).toBe('கடவுச்சொல்லை உள்ளிடவும்');
      expect(validatePassword('', 'en')).toBe('Please enter your password');
    });

    it('returns error when password is shorter than 6 characters', () => {
      expect(validatePassword('12345')).toBe(
        'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்',
      );
      expect(validatePassword('12345', 'en')).toBe(
        'Password must be at least 6 characters',
      );
    });

    it('passes when password is at least 6 characters', () => {
      expect(validatePassword('123456')).toBeNull();
      expect(validatePassword('secret@123', 'en')).toBeNull();
    });
  });

  describe('validateLoginForm', () => {
    it('returns invalid when both fields are empty', () => {
      const result = validateLoginForm('', '');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBeTruthy();
      expect(result.errors.password).toBeTruthy();
    });

    it('returns valid when both fields are correct', () => {
      const result = validateLoginForm('9876543210', 'strongPassword123');
      expect(result.isValid).toBe(true);
      expect(result.errors.mobileNumber).toBeUndefined();
      expect(result.errors.password).toBeUndefined();
    });

    it('returns localized errors in English when requested', () => {
      const result = validateLoginForm('', '', 'en');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Please enter your mobile number');
      expect(result.errors.password).toBe('Please enter your password');
    });
  });

  describe('authService API Integration', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await authStorage.clearAll();
    });

    it('authenticates Admin via POST /auth/login with exact payload', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          status: 1,
          success: true,
          message: 'உள்நுழைவு வெற்றிகரமாக முடிந்தது (Sign in successful)',
          data: {
            token: 'admin-jwt-token-xyz',
            refreshToken: 'admin-refresh-token-xyz',
            expiresAt: '2026-11-05T15:27:18.402Z',
            user: {
              id: 1,
              role: 'admin',
              nameEnglish: 'Super Admin',
              nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
              title: 'முதன்மை நிர்வாகி (Chief Administrator)',
              phone: '+919876543210',
              email: 'mandhiragiri.jothidam@gmail.com',
              avatarUrl: null,
            },
          },
        },
      } as any);

      const result = await authService.login({
        mobileNumber: '9876543210',
        password: 'Admin@1234',
        role: 'admin',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/auth/login',
        {
          mobileNumber: '9876543210',
          password: 'Admin@1234',
          role: 'admin',
        },
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.session.role).toBe('admin');
        expect(result.session.user.nameEnglish).toBe('Super Admin');
        expect(result.session.token).toBe('admin-jwt-token-xyz');
      }

      const storedTokens = await authStorage.getTokens();
      expect(storedTokens?.accessToken).toBe('admin-jwt-token-xyz');
      expect(storedTokens?.refreshToken).toBe('admin-refresh-token-xyz');
      mockPost.mockRestore();
    });

    it('authenticates Staff via POST /auth/staff-login without role in body', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          status: 1,
          success: true,
          message: 'பணியாளர் உள்நுழைவு வெற்றிகரமாக முடிந்தது (Staff sign in successful)',
          data: {
            token: 'staff-jwt-token-abc',
            refreshToken: 'staff-refresh-token-abc',
            expiresAt: '2026-11-05T15:27:36.561Z',
            user: {
              id: '1',
              staffId: 'MJSTF00001',
              userId: '2',
              nameEnglish: 'Murugan',
              nameTamil: 'சிவஸ்ரீ முருகன் குருக்கள்',
              staffRole: 'Priest',
              designation: 'முதன்மை குருக்கள் (Head Priest)',
              phone: '+919876527881',
              phoneDisplay: '+91 987 XXXXX',
              tradition: 'சைவ ஆகமம் (Saiva Agama)',
              expertise: 'விவாஹம், நவகிரக சாந்தி, கணபதி ஹோமம்',
              certification: 'சிவநெறி ஆகம பிரவீண குரு',
              languagesSpoken: 'தமிழ், சமஸ்கிருதம்',
              avatarUrl: 'https://cdn.mandhragiri.com/avatars/murugan.png',
              status: 'active',
              designationTamil: 'முதன்மை குருக்கள் (Head Priest)',
              roleCategory: 'PRIEST',
              roleBadge: 'Priest',
            },
          },
        },
      } as any);

      const result = await authService.loginStaff({
        mobileNumber: '9876527881',
        password: 'SacredPass@2026',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/auth/staff-login',
        {
          mobileNumber: '9876527881',
          password: 'SacredPass@2026',
        },
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.session.role).toBe('staff');
        expect(result.session.staffId).toBe('MJSTF00001');
        expect(result.session.user.nameEnglish).toBe('Murugan');
        expect(result.session.token).toBe('staff-jwt-token-abc');
      }

      mockPost.mockRestore();
    });

    it('handles 401 Unauthorized invalid credentials error correctly', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            status: 0,
            success: false,
            message: 'மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.',
            errors: {
              credentials: 'Invalid mobile number or password.',
            },
          },
        },
      });

      const result = await authService.login({
        mobileNumber: '9876543210',
        password: 'WrongPassword',
        role: 'admin',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toBe('மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.');
      }

      mockPost.mockRestore();
    });

    it('handles 403 Forbidden deactivated staff account correctly', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            status: 0,
            success: false,
            message: 'தங்கள் பணியாளர் கணக்கு தற்போது முடக்கப்பட்டுள்ளது.',
            errors: {
              account: 'Staff account deactivated. Please contact admin.',
            },
          },
        },
      });

      const result = await authService.loginStaff({
        mobileNumber: '9876527881',
        password: 'SacredPass@2026',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toBe('தங்கள் பணியாளர் கணக்கு தற்போது முடக்கப்பட்டுள்ளது.');
      }

      mockPost.mockRestore();
    });

    it('handles 400 Bad Request validation errors correctly', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            status: 0,
            success: false,
            message: 'உள்ளீட்டுத் தரவு சரிபார்ப்பு தோல்வியடைந்தது (Validation failed)',
            errors: {
              mobileNumber: '10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும் (Must be 10 digits)',
            },
          },
        },
      });

      const result = await authService.login({
        mobileNumber: '12345',
        password: 'Pass',
        role: 'admin',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toContain('உள்ளீட்டுத் தரவு சரிபார்ப்பு தோல்வியடைந்தது');
      }

      mockPost.mockRestore();
    });

    it('handles offline / network error with noApiResponse flag', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('Network Error'),
      );

      const result = await authService.login({
        mobileNumber: '9876543210',
        password: 'Admin@1234',
        role: 'admin',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.noApiResponse).toBe(true);
        expect(result.message).toContain('சேவையகத்தை இணைக்க முடியவில்லை');
      }

      mockPost.mockRestore();
    });

    it('fetches authenticated user profile via GET /auth/me', async () => {
      const mockGet = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        status: 200,
        data: {
          status: 1,
          success: true,
          message: 'பயனர் விவரங்கள் பெறப்பட்டது (User profile retrieved)',
          data: {
            id: '1',
            staffId: 'MJSTF00001',
            role: 'staff',
            staffRole: 'Priest',
            nameEnglish: 'Murugan',
            nameTamil: 'சிவஸ்ரீ முருகன் குருக்கள்',
            designation: 'முதன்மை குருக்கள் (Head Priest)',
            phone: '+919876527881',
            status: 'Active',
          },
        },
      } as any);

      const profile = await authService.getCurrentUser();
      expect(mockGet).toHaveBeenCalledWith('/auth/me');
      expect(profile).not.toBeNull();
      expect(profile?.nameEnglish).toBe('Murugan');
      expect((profile as any)?.staffId).toBe('MJSTF00001');

      mockGet.mockRestore();
    });

    it('revokes session if GET /auth/me returns deactivated status', async () => {
      await authStorage.saveTokens({
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
      });

      const mockGet = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        status: 200,
        data: {
          status: 1,
          data: {
            id: '1',
            status: 'inactive',
          },
        },
      } as any);

      const profile = await authService.getCurrentUser();
      expect(profile).toBeNull();
      expect(await authStorage.getTokens()).toBeNull();

      mockGet.mockRestore();
    });

    it('refreshes token via POST /auth/refresh with rotation', async () => {
      await authStorage.saveTokens({
        accessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
      });

      const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: {
          status: 1,
          success: true,
          data: {
            token: 'new-rotated-access-token',
            refreshToken: 'new-rotated-refresh-token',
            expiresAt: '2026-11-05T15:35:10.123Z',
          },
        },
      } as any);

      const newToken = await authService.refreshAccessToken();
      expect(newToken).toBe('new-rotated-access-token');

      const saved = await authStorage.getTokens();
      expect(saved?.accessToken).toBe('new-rotated-access-token');
      expect(saved?.refreshToken).toBe('new-rotated-refresh-token');

      mockPost.mockRestore();
    });
  });
});
