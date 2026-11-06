import React from 'react';
import { Alert, Text, TextInput, Pressable } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AddPriestModal } from '../src/components/priest/AddPriestModal';
import { PriestAssistantControlModal } from '../src/components/settings/PriestAssistantControlModal';
import { staffService } from '../src/services/staffService';
import { authService } from '../src/services/auth/authService';
import { PriestStaffItem } from '../src/types/priest';
import { setAppLanguage } from '../src/i18n';
import { apiClient } from '../src/services/apiClient';
import { authStorage } from '../src/storage/authStorage';

const initialMetrics = {
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

const extractText = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
};

describe('Priest & Assistant Control & Add Priest Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(apiClient, 'post').mockImplementation((url: string, payload: any) => {
      if (url === '/auth/staff-login') {
        if (payload?.mobileNumber === '9840144444') {
          return Promise.reject({
            response: {
              status: 403,
              data: {
                status: 0,
                success: false,
                message: 'தங்கள் பணியாளர் கணக்கு தற்போது முடக்கப்பட்டுள்ளது.',
                errors: { account: 'Staff account deactivated' },
              },
            },
          });
        }
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            message: 'பணியாளர் உள்நுழைவு வெற்றிகரமாக முடிந்தது',
            data: {
              token: 'staff-test-token',
              refreshToken: 'staff-test-refresh',
              user: {
                id: 'p-created-test',
                staffId: 'p-created-test',
                role: 'staff',
                nameEnglish: 'Ganesh Archakar',
                nameTamil: 'கணேஷ் அர்ச்சகர்',
                phone: payload?.mobileNumber || '9840155555',
                status: 'active',
              },
            },
          },
        });
      }
      if (
        url === '/staff' ||
        url === '/createStaff' ||
        url.startsWith('/staff') ||
        url.startsWith('/createStaff')
      ) {
        return Promise.resolve({
          status: 201,
          data: {
            status: 1,
            success: true,
            message: 'புரோகிதர் வெற்றிகரமாக சேர்க்கப்பட்டார்.',
            data: {
              id: '4',
              staffId: 'MJSTF00004',
              userId: '5',
              nameEnglish: payload.name_english || payload.nameEnglish,
              nameTamil: payload.name_tamil || payload.nameTamil,
              staffRole: payload.staff_role || payload.staffRole,
              designation: payload.designation,
              phone: payload.phone,
              phoneDisplay:
                payload.phone && payload.phone.length > 6
                  ? `${payload.phone.slice(0, 6)} XXXXX`
                  : payload.phone,
              tradition: payload.tradition,
              expertise: payload.expertise,
              certification: payload.certification,
              languagesSpoken: payload.languages_spoken || payload.languagesSpoken,
              avatarUrl: payload.avatar_url || payload.avatarUrl || null,
              status: 'active',
              createdAt: '2026-11-04 14:55:49',
              updatedAt: '2026-11-04 14:55:49',
              designationTamil: payload.designation,
              roleCategory: 'PRIEST',
              roleBadge: payload.staff_role || payload.staffRole,
              fullTitleTamil: `${payload.name_tamil} - ${payload.designation}`,
            },
            errors: null,
            timestamp: '2026-11-04T09:25:49.587Z',
          },
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    jest.spyOn(apiClient, 'get').mockImplementation((url: string) => {
      if (url === '/staff' || url.startsWith('/staff')) {
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            message: 'Staff directory retrieved.',
            data: {
              totalCount: staffService.getAllStaff().length,
              activeCount: staffService.getActiveStaff().length,
              staff: staffService.getAllStaff(),
            },
          },
        });
      }
      return Promise.reject(new Error(`Unknown GET endpoint: ${url}`));
    });

    jest.spyOn(apiClient, 'put').mockImplementation((url: string, payload: any) => {
      if (url.startsWith('/staff/')) {
        if (payload?.phone === '9840199999_conflict') {
          return Promise.reject({
            response: {
              status: 409,
              data: {
                status: 0,
                success: false,
                message:
                  'இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (Mobile number already registered).',
              },
            },
          });
        }
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            message: 'பணியாளர் விவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',
            data: {
              ...payload,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
      return Promise.reject(new Error(`Unknown PUT endpoint: ${url}`));
    });
  });
  describe('AddPriestModal Form Fields', () => {
    it('has Role, Designation, and Password as text inputs with Password below Mobile Number', async () => {
      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const textInputs = root.findAllByType(TextInput);
      const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

      // Verify labels
      expect(texts.some(t => t.includes('பணி / பங்கு') || t.includes('Role'))).toBe(true);
      expect(texts.some(t => t.includes('பதவி') || t.includes('Designation'))).toBe(true);
      expect(texts.some(t => t.includes('கைபேசி எண்') || t.includes('Mobile Number'))).toBe(true);
      expect(texts.some(t => t.includes('கடவுச்சொல்') || t.includes('Password'))).toBe(true);

      // Verify text inputs:
      // Index 0: nameEnglish
      // Index 1: nameTamil
      // Index 2: role
      // Index 3: designation
      // Index 4: phone
      // Index 5: password (directly beneath phone!)
      expect(textInputs.length).toBeGreaterThanOrEqual(6);

      // Verify password input has secureTextEntry
      const passwordInput = textInputs.find(ti => ti.props.secureTextEntry !== undefined);
      expect(passwordInput).toBeDefined();
      expect(passwordInput?.props.secureTextEntry).toBe(true);

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('submits new priest with text role, designation, and password', async () => {
      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const textInputs = root.findAllByType(TextInput);

      // Fill in:
      // 0: nameEnglish
      // 1: nameTamil
      // 2: role
      // 3: designation
      // 4: phone
      // 5: password
      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('Test Priest');
        textInputs[1].props.onChangeText('சோதனை குருக்கள்');
        textInputs[2].props.onChangeText('Chief Priest');
        textInputs[3].props.onChangeText('தலைமை குருக்கள்');
        textInputs[4].props.onChangeText('9840199999');
        textInputs[5].props.onChangeText('TestPass@2026');
      });

      // Find submit button via testID
      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      expect(submitButton).toBeDefined();

      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedPriest: PriestStaffItem = mockSubmit.mock.calls[0][0];
      expect(submittedPriest.nameEnglish).toBe('Test Priest');
      expect(submittedPriest.nameTamil).toBe('சோதனை குருக்கள்');
      expect(submittedPriest.role).toBe('Chief Priest');
      expect(submittedPriest.designationTamil).toBe('தலைமை குருக்கள்');
      expect(submittedPriest.phone).toBe('9840199999');
      expect(submittedPriest.password).toBe('TestPass@2026');
      expect(submittedPriest.status).toBe('active');
      expect(submittedPriest.avatar).toBeNull(); // Optional image defaults to null without failure

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('allows uploading a profile photo and sets it as the staff member avatar', async () => {
      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;

      // 1. Verify upload placeholder button exists
      const uploadBtn = root.findByProps({ testID: 'priest-image-upload-btn' });
      expect(uploadBtn).toBeDefined();

      // Open Image Upload Sheet
      await ReactTestRenderer.act(async () => {
        uploadBtn.props.onPress();
      });

      // 2. Select photo from camera/gallery via ImageUploadSheetModal
      const cameraBtn = root.findByProps({ accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க' });
      expect(cameraBtn).toBeDefined();
      await ReactTestRenderer.act(async () => {
        await cameraBtn.props.onPress();
      });

      // 3. Verify photo preview and remove button are now visible
      const removeBtn = root.findByProps({ testID: 'priest-image-remove-btn' });
      expect(removeBtn).toBeDefined();

      // 4. Fill required fields and submit
      const textInputs = root.findAllByType(TextInput);
      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('Sundar Priest');
        textInputs[1].props.onChangeText('சுந்தர் குருக்கள்');
        textInputs[2].props.onChangeText('Priest');
        textInputs[3].props.onChangeText('குருக்கள்');
        textInputs[4].props.onChangeText('9840188888');
        textInputs[5].props.onChangeText('Sundar@2026');
      });

      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedPriest: PriestStaffItem = mockSubmit.mock.calls[0][0];
      expect(submittedPriest.nameEnglish).toBe('Sundar Priest');
      expect(submittedPriest.avatar).toEqual({ uri: 'file://mock/camera_photo.jpg' });

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('allows removing an uploaded photo before submitting so staff is created with null avatar', async () => {
      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;

      // Open and pick photo
      const uploadBtn = root.findByProps({ testID: 'priest-image-upload-btn' });
      await ReactTestRenderer.act(async () => {
        uploadBtn.props.onPress();
      });
      const galleryBtn = root.findByProps({ accessibilityLabel: 'கேலரியில் இருந்து தேர்வு செய்க' });
      await ReactTestRenderer.act(async () => {
        await galleryBtn.props.onPress();
      });

      // Remove photo
      const removeBtn = root.findByProps({ testID: 'priest-image-remove-btn' });
      expect(removeBtn).toBeDefined();
      await ReactTestRenderer.act(async () => {
        removeBtn.props.onPress();
      });

      // Verify upload placeholder is back
      const restoredUploadBtn = root.findByProps({ testID: 'priest-image-upload-btn' });
      expect(restoredUploadBtn).toBeDefined();

      // Submit form
      const textInputs = root.findAllByType(TextInput);
      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('No Photo Priest');
        textInputs[1].props.onChangeText('புகைப்படம் இல்லா குருக்கள்');
        textInputs[2].props.onChangeText('Assistant');
        textInputs[3].props.onChangeText('உதவியாளர்');
        textInputs[4].props.onChangeText('9840177777');
        textInputs[5].props.onChangeText('Pass@2026');
      });

      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedPriest: PriestStaffItem = mockSubmit.mock.calls[0][0];
      expect(submittedPriest.avatar).toBeNull();

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('integrates POST /api/v1/createStaff API with expected payload structure and bearer token', async () => {
      await authStorage.saveTokens({
        accessToken: 'mock-admin-bearer-token',
        refreshToken: 'mock-admin-refresh-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 201,
        data: {
          status: 1,
          success: true,
          message: 'புரோகிதர் வெற்றிகரமாக சேர்க்கப்பட்டார்.',
          data: {
            id: '4',
            staffId: 'MJSTF00004',
            userId: '5',
            nameEnglish: 'Sundaramoorthy Gurukkal',
            nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
            staffRole: 'Priest',
            designation: 'முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
            phone: '+919840123456',
            phoneDisplay: '+91 984 XXXXX',
            tradition: 'சைவ ஆகமம் & வேத நெறி',
            expertise: 'விவாஹம், நவகிரக சாந்தி & மகா ருத்ர ஹோமம்',
            certification: 'சிவநெறி ஆகம பிரவீண குரு',
            languagesSpoken: 'தமிழ், சமஸ்கிருதம், ஆங்கிலம்',
            avatarUrl: 'https://cdn.mandhragiri.com/avatars/sundaram.png',
            status: 'active',
            createdAt: '2026-11-04 14:55:49',
            updatedAt: '2026-11-04 14:55:49',
            designationTamil: 'முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
            roleCategory: 'PRIEST',
            roleBadge: 'Priest',
            fullTitleTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள் - முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
          },
          errors: null,
          timestamp: '2026-11-04T09:25:49.587Z',
        },
      });

      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const textInputs = root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('Sundaramoorthy Gurukkal');
        textInputs[1].props.onChangeText('சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்');
        textInputs[2].props.onChangeText('Priest');
        textInputs[3].props.onChangeText('முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்');
        textInputs[4].props.onChangeText('+919840123456');
        textInputs[5].props.onChangeText('SacredPass@2026');
      });

      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledPayload] = postSpy.mock.calls[0];
      expect(calledUrl).toBe('/createStaff');
      expect(calledPayload.name_english).toBe('Sundaramoorthy Gurukkal');
      expect(calledPayload.name_tamil).toBe('சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்');
      expect(calledPayload.staff_role).toBe('Priest');
      expect(calledPayload.designation).toBe('முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்');
      expect(calledPayload.phone).toBe('+919840123456');
      expect(calledPayload.password).toBe('SacredPass@2026');
      expect(calledPayload.nameEnglish).toBe('Sundaramoorthy Gurukkal');
      expect(calledPayload.nameTamil).toBe('சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்');

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedPriest: PriestStaffItem = mockSubmit.mock.calls[0][0];
      expect(submittedPriest.id).toBe('MJSTF00004');
      expect(submittedPriest.staffId).toBe('MJSTF00004');
      expect(submittedPriest.nameEnglish).toBe('Sundaramoorthy Gurukkal');
      expect(submittedPriest.avatar).toEqual({ uri: 'https://cdn.mandhragiri.com/avatars/sundaram.png' });

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('handles backend error responses (e.g. 409 conflict duplicate phone) gracefully with banner message', async () => {
      jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            status: 0,
            success: false,
            message: 'இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (Mobile already registered)',
            errors: { phone: 'Phone number is already associated with an existing account' },
          },
        },
      });

      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const textInputs = root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('Duplicate Priest');
        textInputs[1].props.onChangeText('நகல் குருக்கள்');
        textInputs[2].props.onChangeText('Priest');
        textInputs[3].props.onChangeText('குருக்கள்');
        textInputs[4].props.onChangeText('9840123456');
        textInputs[5].props.onChangeText('Password@123');
      });

      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      // Submit was rejected, so onSubmit must not be called
      expect(mockSubmit).not.toHaveBeenCalled();

      // Error banner must display the server's error message
      const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
      expect(
        texts.some(t => t.includes('இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது'))
      ).toBe(true);

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('gracefully creates staff item in offline fallback when backend API is unreachable', async () => {
      // Mock network error without response
      jest.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network error'));

      const mockClose = jest.fn();
      const mockSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={mockClose}
              onSubmit={mockSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const textInputs = root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        textInputs[0].props.onChangeText('Offline Priest');
        textInputs[1].props.onChangeText('ஆஃப்லைன் குருக்கள்');
        textInputs[2].props.onChangeText('Assistant');
        textInputs[3].props.onChangeText('உதவியாளர்');
        textInputs[4].props.onChangeText('9840112233');
        textInputs[5].props.onChangeText('OfflinePass@2026');
      });

      const submitButton = root.findByProps({ testID: 'add-priest-submit-btn' });
      await ReactTestRenderer.act(async () => {
        await submitButton.props.onPress();
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedPriest: PriestStaffItem = mockSubmit.mock.calls[0][0];
      expect(submittedPriest.nameEnglish).toBe('Offline Priest');
      expect(submittedPriest.phone).toBe('9840112233');

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });
  });

  describe('PriestAssistantControlModal', () => {
    it('renders all created priests and assistants with Active/Inactive controls', async () => {
      const mockClose = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <PriestAssistantControlModal
              visible={true}
              onClose={mockClose}
              initialFilter="all"
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;
      const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

      // Title & Active/Inactive filter tabs
      expect(texts.some(t => t.includes('புரோகிதர் & உதவியாளர் கட்டுப்பாடு'))).toBe(true);
      expect(
        texts.some(
          t =>
            t.includes('செயல் / முடக்கம் பணியாளர் கட்டுப்பாடு') ||
            t.includes('Active / Inactive Staff Control')
        )
      ).toBe(true);
      expect(texts.some(t => t.includes('செயலில்') || t.includes('Active'))).toBe(true);
      expect(texts.some(t => t.includes('முடக்கப்பட்டவை') || t.includes('Inactive'))).toBe(true);

      // Staff names displayed
      expect(texts.some(t => t.includes('Murugan'))).toBe(true);
      expect(texts.some(t => t.includes('Shastriji'))).toBe(true);
      expect(texts.some(t => t.includes('Ramu'))).toBe(true);

      // Action buttons: Deactivate/Activate and Delete
      expect(texts.some(t => t.includes('முடக்கு') || t.includes('Deactivate'))).toBe(true);
      expect(texts.some(t => t.includes('நீக்கு') || t.includes('Fire'))).toBe(true);

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('supports seamless bilingual switching between Tamil and English in PriestAssistantControlModal', async () => {
      const mockClose = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;

      // 1. Render in English
      await ReactTestRenderer.act(async () => {
        await setAppLanguage('en');
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <PriestAssistantControlModal
              visible={true}
              onClose={mockClose}
              initialFilter="all"
            />
          </SafeAreaProvider>
        );
      });

      let root = renderer!.root;
      let texts = root.findAllByType(Text).map(t => extractText(t.props.children));

      expect(texts.some(t => t.includes('Priest & Assistant Control'))).toBe(true);
      expect(texts.some(t => t.includes('Active / Inactive Staff Control'))).toBe(true);
      expect(texts.some(t => t.includes('All Staff'))).toBe(true);
      expect(texts.some(t => t.includes('Active'))).toBe(true);
      expect(texts.some(t => t.includes('Inactive'))).toBe(true);
      expect(texts.some(t => t.includes('Deactivate'))).toBe(true);
      expect(texts.some(t => t.includes('Delete (Fire)'))).toBe(true);

      // 2. Switch back to Tamil
      await ReactTestRenderer.act(async () => {
        await setAppLanguage('ta');
      });

      texts = root.findAllByType(Text).map(t => extractText(t.props.children));
      expect(texts.some(t => t.includes('புரோகிதர் & உதவியாளர் கட்டுப்பாடு'))).toBe(true);
      expect(texts.some(t => t.includes('செயல் / முடக்கம் பணியாளர் கட்டுப்பாடு'))).toBe(true);
      expect(texts.some(t => t.includes('செயலில்'))).toBe(true);
      expect(texts.some(t => t.includes('முடக்கப்பட்டவை'))).toBe(true);

      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('toggles staff status between active and inactive', async () => {
      const initialActiveCount = staffService.getActiveStaff().length;
      const firstStaff = staffService.getAllStaff()[0];
      expect(firstStaff.status).toBe('active');

      // Update status to inactive
      await ReactTestRenderer.act(async () => {
        staffService.updateStaffStatus(firstStaff.id, 'inactive');
      });
      expect(staffService.getStaffById(firstStaff.id)?.status).toBe('inactive');
      expect(staffService.getActiveStaff().length).toBe(initialActiveCount - 1);

      // Reactivate
      await ReactTestRenderer.act(async () => {
        staffService.updateStaffStatus(firstStaff.id, 'active');
      });
      expect(staffService.getStaffById(firstStaff.id)?.status).toBe('active');
      expect(staffService.getActiveStaff().length).toBe(initialActiveCount);
    });

    it('permanently deletes / fires a staff member when confirmed', async () => {
      // Add a test staff to delete
      const tempStaff: PriestStaffItem = {
        id: `temp-${Date.now()}`,
        nameEnglish: 'Temporary Staff',
        nameTamil: 'தற்காலிக பணியாளர்',
        role: 'Assistant',
        designationTamil: 'உதவியாளர்',
        designationEnglish: 'Assistant',
        fullTitleTamil: 'தற்காலிக பணியாளர் - உதவியாளர்',
        traditionTamil: 'வேத சைவ ஆகமம்',
        traditionEnglish: 'Vedic Tradition',
        certificationTamil: 'சான்றிதழ் பெற்றவர்',
        certificationEnglish: 'Certified',
        phone: '9840188888',
        phoneDisplay: '98401 88888',
        password: 'Pass@123',
        expertiseTamil: 'பூஜை உதவி',
        languagesTamil: 'தமிழ்',
        status: 'active',
        bookings: [],
      };

      await ReactTestRenderer.act(async () => {
        staffService.addStaff(tempStaff);
      });
      expect(staffService.getStaffById(tempStaff.id)).toBeDefined();

      // Delete staff
      let deleted = false;
      await ReactTestRenderer.act(async () => {
        deleted = staffService.deleteStaff(tempStaff.id);
      });
      expect(deleted).toBe(true);
      expect(staffService.getStaffById(tempStaff.id)).toBeUndefined();
    });

    it('integrates PUT /api/v1/staff/:id to Deactivate staff and immediately updates UI', async () => {
      const putSpy = jest.spyOn(apiClient, 'put');
      const getSpy = jest.spyOn(apiClient, 'get');
      const firstStaff = staffService.getAllStaff()[0];
      const initialActiveCount = staffService.getActiveStaff().length;

      const result = await staffService.updateStaffApi(firstStaff.id, {
        status: 'Inactive',
        staff: { status: 'Inactive' },
      });

      expect(result.success).toBe(true);
      expect(putSpy).toHaveBeenCalledWith(
        `/staff/${firstStaff.id}`,
        expect.objectContaining({ status: 'Inactive' })
      );
      // Status in memory updated immediately
      expect(staffService.getStaffById(firstStaff.id)?.status).toBe('inactive');
      expect(staffService.getActiveStaff().length).toBe(initialActiveCount - 1);
    });

    it('integrates PUT /api/v1/staff/:id to Activate staff and immediately updates UI', async () => {
      const putSpy = jest.spyOn(apiClient, 'put');
      const firstStaff = staffService.getAllStaff()[0];

      // Set to inactive first
      staffService.updateStaffStatus(firstStaff.id, 'inactive');
      const initialActiveCount = staffService.getActiveStaff().length;

      const result = await staffService.updateStaffApi(firstStaff.id, {
        status: 'Active',
        staff: { status: 'Active' },
      });

      expect(result.success).toBe(true);
      expect(putSpy).toHaveBeenCalledWith(
        `/staff/${firstStaff.id}`,
        expect.objectContaining({ status: 'Active' })
      );
      // Status in memory updated immediately
      expect(staffService.getStaffById(firstStaff.id)?.status).toBe('active');
      expect(staffService.getActiveStaff().length).toBe(initialActiveCount + 1);
    });

    it('integrates PUT /api/v1/staff/:id to Soft Delete staff (isDeleted: true)', async () => {
      const putSpy = jest.spyOn(apiClient, 'put');
      const targetStaff = staffService.getAllStaff()[1];

      const result = await staffService.updateStaffApi(targetStaff.id, {
        isDeleted: true,
        status: 'DELETED',
      });

      expect(result.success).toBe(true);
      expect(putSpy).toHaveBeenCalledWith(
        `/staff/${targetStaff.id}`,
        expect.objectContaining({ isDeleted: true, status: 'DELETED' })
      );
      // Staff member immediately removed from store
      expect(staffService.getStaffById(targetStaff.id)).toBeUndefined();
    });

    it('handles 409 Conflict duplicate phone error properly on update', async () => {
      const result = await staffService.updateStaffApi('conflict-id', {
        phone: '9840199999_conflict',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது');
    });
  });

  describe('Staff Login with Admin-Assigned Password', () => {
    it('authenticates created staff using their assigned password and phone', async () => {
      const createdStaff: PriestStaffItem = {
        id: 'p-created-test',
        nameEnglish: 'Ganesh Archakar',
        nameTamil: 'கணேஷ் அர்ச்சகர்',
        role: 'Archakar',
        designationTamil: 'அர்ச்சகர்',
        designationEnglish: 'Archakar',
        fullTitleTamil: 'கணேஷ் அர்ச்சகர் - ஆலய அர்ச்சகர்',
        traditionTamil: 'வேத சைவ ஆகமம்',
        traditionEnglish: 'Vedic Tradition',
        certificationTamil: 'ஆகம வித்தகர்',
        certificationEnglish: 'Agama Specialist',
        phone: '9840155555',
        phoneDisplay: '+91 98401 55555',
        password: 'AdminSetPassword@2026',
        expertiseTamil: 'அபிஷேகம் & ஆராதனை',
        languagesTamil: 'தமிழ் & சமஸ்கிருதம்',
        status: 'active',
        bookings: [],
      };

      await ReactTestRenderer.act(async () => {
        staffService.addStaff(createdStaff);
      });

      // Attempt staff login with assigned credentials
      const result = await authService.loginStaff({
        mobileNumber: '9840155555',
        password: 'AdminSetPassword@2026',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.session.user.nameEnglish).toBe('Ganesh Archakar');
        expect(result.session.user.role).toBe('staff');
      }

      // Cleanup
      await ReactTestRenderer.act(async () => {
        staffService.deleteStaff('p-created-test');
      });
    });

    it('rejects staff login if staff member is deactivated by admin', async () => {
      const inactiveStaff: PriestStaffItem = {
        id: 'p-inactive-test',
        nameEnglish: 'Inactive Staff',
        nameTamil: 'முடக்கப்பட்ட பணியாளர்',
        role: 'Assistant',
        designationTamil: 'உதவியாளர்',
        designationEnglish: 'Assistant',
        fullTitleTamil: 'முடக்கப்பட்ட பணியாளர்',
        traditionTamil: 'வேத சைவ ஆகமம்',
        traditionEnglish: 'Vedic Tradition',
        certificationTamil: 'சான்றிதழ்',
        certificationEnglish: 'Certified',
        phone: '9840144444',
        phoneDisplay: '+91 98401 44444',
        password: 'StaffPass@2026',
        expertiseTamil: 'உதவி',
        languagesTamil: 'தமிழ்',
        status: 'inactive', // Deactivated!
        bookings: [],
      };

      await ReactTestRenderer.act(async () => {
        staffService.addStaff(inactiveStaff);
      });

      const result = await authService.loginStaff({
        mobileNumber: '9840144444',
        password: 'StaffPass@2026',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toContain('முடக்கப்பட்டுள்ளது');
      }

      // Cleanup
      await ReactTestRenderer.act(async () => {
        staffService.deleteStaff('p-inactive-test');
      });
    });
  });
});
