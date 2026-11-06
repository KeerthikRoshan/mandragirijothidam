import React from 'react';
import { Alert, Text, TextInput, Pressable } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileScreen } from '../src/screens/profile/ProfileScreen';
import { setAppLanguage } from '../src/i18n';
import { authService } from '../src/services/auth/authService';

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

describe('ProfileScreen Component (Simplified Admin & Chief Officiant Profile)', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('ta');
    });
  });

  it('renders simplified profile layout with only relevant details and no unnecessary sections', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <ProfileScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // 1. Header
    expect(texts).toContain('நிர்வாகி சுயவிவரம்');
    expect(texts).toContain('Admin & Chief Officiant');

    // 2. Updated Profile Details: Admin ID, Name, Email, Address, Role
    expect(texts.some(t => t.includes('ADM-2026-108'))).toBe(true);
    expect(texts.some(t => t.includes('சுந்தரமூர்த்தி குருக்கள்'))).toBe(true);
    expect(texts.some(t => t.includes('முதன்மை நிர்வாகி'))).toBe(true);
    expect(texts).toContain('mandhragiri.jothidam@gmail.com');
    expect(texts.some(t => t.includes('மதுரை - 625001'))).toBe(true);
    expect(texts.some(t => t.includes('நிர்வாக எண் (Admin ID)'))).toBe(true);
    expect(texts.some(t => t.includes('மின்னஞ்சல் முகவரி'))).toBe(true);
    expect(texts.some(t => t.includes('சுயவிவரப் படம் பதிவேற்றுக') || t.includes('படம் மாற்றுக'))).toBe(true);

    // 3. Verify complete removal of unnecessary profile information & actions
    expect(texts.some(t => t.includes('வேத சைவ ஆகம ரத்னா'))).toBe(false);
    expect(texts.some(t => t.includes('Certified Officiant'))).toBe(false);
    expect(texts.some(t => t.includes('TN-VDC-108 • மதுரை பீடம்'))).toBe(false);
    expect(texts).not.toContain('அழைக்க');
    expect(texts).not.toContain('WhatsApp');
    expect(texts).not.toContain('பகிர்க');

    // 4. Verify complete removal of unnecessary sections
    expect(texts).not.toContain('வேத ஞானம் & பூஜை விசேஷங்கள்');
    expect(texts).not.toContain('மகா சண்டி யாகம்');
    expect(texts).not.toContain('அலுவலக & தரிசன நேரங்கள்');
    expect(texts).not.toContain('சான்றிதழ்கள் & அங்கீகாரங்கள்');
    expect(texts).not.toContain('28+');
    expect(texts).not.toContain('1,200+');

    // 5. Verify Logout option is now present in Profile Screen
    expect(texts.some(t => t.includes('வெளியேறு (Sign Out)'))).toBe(true);
    expect(texts.some(t => t.includes('கணக்கு & பாதுகாப்பு'))).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('allows admin to edit profile details and change profile avatar', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <ProfileScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;

    // Open edit modal
    const editBtn = root.findByProps({ accessibilityLabel: 'விவரங்களை புதுப்பி' });
    await ReactTestRenderer.act(async () => {
      editBtn.props.onPress();
    });

    // Check modal fields
    const textInputs = root.findAllByType(TextInput);
    expect(textInputs.length).toBeGreaterThanOrEqual(5);

    // Edit Admin ID, Name, Email, Address
    await ReactTestRenderer.act(async () => {
      textInputs[0].props.onChangeText('ADM-2026-999'); // Admin ID
      textInputs[1].props.onChangeText('சிவஸ்ரீ கல்யாணசுந்தர குருக்கள்'); // Tamil name
      textInputs[3].props.onChangeText('admin.updated@mandhragiri.com'); // Email
    });

    // Save profile changes
    const alertSpy = jest.spyOn(Alert, 'alert');
    const saveBtn = root.findByProps({ accessibilityLabel: 'மாற்றங்களைச் சேமிக்க' });
    expect(saveBtn).toBeDefined();
    await ReactTestRenderer.act(async () => {
      saveBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('வெற்றிகரமாக புதுப்பிக்கப்பட்டன')
    );
    alertSpy.mockRestore();

    // Verify updated values displayed on profile
    const updatedTexts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(updatedTexts.some(t => t.includes('ADM-2026-999'))).toBe(true);
    expect(updatedTexts.some(t => t.includes('கல்யாணசுந்தர குருக்கள்'))).toBe(true);
    expect(updatedTexts).toContain('admin.updated@mandhragiri.com');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('triggers sign out confirmation alert and calls authService.logout', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const logoutSpy = jest.spyOn(authService, 'logout').mockResolvedValue(true as any);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <ProfileScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const signOutBtn = root.findByProps({ accessibilityLabel: 'வெளியேறு (Sign Out)' });
    expect(signOutBtn).toBeDefined();

    await ReactTestRenderer.act(async () => {
      signOutBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'வெளியேறு (Sign Out)',
      expect.stringContaining('நிர்வாக கணக்கிலிருந்து நிச்சயமாக வெளியேற விரும்புகிறீர்களா?'),
      expect.any(Array)
    );

    // Trigger the destructive onPress action
    const alertButtons = alertSpy.mock.calls[0][2];
    const confirmButton = alertButtons?.find((b: any) => b.style === 'destructive');
    expect(confirmButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      await confirmButton?.onPress();
    });

    expect(logoutSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
    logoutSpy.mockRestore();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('supports bilingual rendering in English mode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('en');
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <ProfileScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    expect(texts).toContain('Admin Profile');
    expect(texts).toContain('Admin & Chief Officiant');
    expect(texts).toContain('Admin Number / ID');
    expect(texts).toContain('Name');
    expect(texts).toContain('Email Address');
    expect(texts).toContain('Address');
    expect(texts).toContain('Update Profile Details');
    expect(texts).toContain('Sign Out');
    expect(texts).toContain('Account & Security');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
