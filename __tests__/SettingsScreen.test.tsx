import React from 'react';
import { Alert, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';
import { setAppLanguage, APP_LANGUAGE_KEY } from '../src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

describe('SettingsScreen Component', () => {
  it('renders all reference UI sections, metrics, and Tamil labels matching the design', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <SettingsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // 1. Header matching other screens
    expect(texts).toContain('அமைப்புகள்');
    expect(texts).toContain('Settings & Preferences');

    // 2. Profile Preview Card
    expect(texts).toContain('சுந்தரமூர்த்தி குருக்கள்');
    expect(texts).toContain('முதன்மை நிர்வாகி');
    expect(texts).toContain('மந்திரகிரி ஜோதிட நிலையம்');
    expect(texts).toContain('TN-VDC-108 • மதுரை');

    // 3. 3-Column Metrics Row
    expect(texts).toContain('இன்றைய பூஜை');
    expect(texts).toContain('8');
    expect(texts).toContain('4 முடிந்தது');
    expect(texts).toContain('ஜாதகப் பதிவுகள்');
    expect(texts).toContain('142');
    expect(texts).toContain('+12 இந்த வாரம்');
    expect(texts).toContain('நினைவூட்டல்');
    expect(texts).toContain('99%');
    expect(texts).toContain('அனுப்பப்பட்டது');

    // 4. Section 1: நிர்வாகம் & செயல்பாடுகள்
    expect(texts).toContain('நிர்வாகம் & செயல்பாடுகள்');
    expect(texts).toContain('4 பிரிவுகள்');
    expect(texts).not.toContain('நிகழ்ச்சி வகைகள் மேலாண்மை');
    expect(texts).toContain('நினைவூட்டல் மேலாண்மை');
    expect(texts).toContain('புரோகிதர் & உதவியாளர் கட்டுப்பாடு');
    expect(texts).toContain('பணியாளர் விடுப்பு விண்ணப்பங்கள்');

    // Verify reminder settings tab has been removed
    expect(texts).not.toContain('நினைவூட்டல் அமைப்புகள்');
    expect(texts).not.toContain('WhatsApp/SMS');

    // 5. Verify Section 2 (நாட்காட்டி & பஞ்சாங்கம்) has been totally removed
    expect(texts).not.toContain('நாட்காட்டி & பஞ்சாங்கம்');
    expect(texts).not.toContain('வேதக் கணிதம்');
    expect(texts).not.toContain('நாட்காட்டி அமைப்புகள்');
    expect(texts).not.toContain('முகூர்த்த வரம்புகள்');
    expect(texts).not.toContain('சுபமுகூர்த்தம்');

    // 6. Section 2: செயலி & நிறுவனம்
    expect(texts).toContain('செயலி & நிறுவனம்');
    expect(texts).toContain('பொது அமைப்புகள்');
    expect(texts).toContain('மொழி அமைப்புகள்');
    expect(texts).toContain('தமிழ்');
    expect(texts).toContain('நிறுவன சுயவிவரம்');
    expect(texts).toContain('அறிக்கைகள் & புள்ளிவிவரம்');

    // 7. Verify Logout has been moved to Profile screen (not in Settings screen)
    expect(texts.some(t => t.includes('வெளியேறு'))).toBe(false);

    // 8. Vedic Blessing Footer
    expect(texts.some(t => t.includes('லோகா சமஸ்தா சுகினோ பவந்து'))).toBe(true);
    expect(texts.some(t => t.includes('பதிப்பு 2.4.0 (Build 2026.10)'))).toBe(true);
    expect(texts.some(t => t.includes('சரிபார்க்கப்பட்டவை'))).toBe(true);

    // 9. Bottom Navigation
    expect(texts).toContain('முகப்பு');
    expect(texts).toContain('நாள்வாரி');
    expect(texts).toContain('புரோகிதர்');
    expect(texts).toContain('அமைப்புகள்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('does not display logout in Settings screen as it is moved to Profile screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <SettingsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts.some(t => t.includes('வெளியேறு'))).toBe(false);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('switches between Tamil and English dynamically without restarting the app', async () => {
    // 1. Initial render in default Tamil
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('ta');
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <SettingsScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    let texts = renderer!.root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('அமைப்புகள்');
    expect(texts).toContain('மொழி அமைப்புகள்');
    expect(texts).toContain('தமிழ்');
    expect(texts).toContain('பணியாளர் விடுப்பு விண்ணப்பங்கள்');
    expect(texts).toContain('விடுப்பு ஒப்புதல் மற்றும் முடிவு வரலாறு');

    // 2. Switch to English
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('en');
    });

    texts = renderer!.root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('Settings');
    expect(texts).toContain('Language Settings');
    expect(texts).toContain('English');
    expect(texts).toContain('Administration & Operations');
    expect(texts).toContain('Staff Leave Requests');
    expect(texts).toContain('Leave approvals and decision history');
    expect(texts).not.toContain('Event Types Management');
    expect(texts).toContain('Reminder Management');
    expect(texts).not.toContain('Reminder Settings');
    expect(texts).not.toContain('Calendar & Panchangam');
    expect(texts).not.toContain('Calendar Settings');
    expect(texts).toContain('Reports & Analytics');
    expect(await AsyncStorage.getItem(APP_LANGUAGE_KEY)).toBe('en');

    // 3. Switch back to Tamil
    await ReactTestRenderer.act(async () => {
      await setAppLanguage('ta');
    });

    texts = renderer!.root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('அமைப்புகள்');
    expect(texts).toContain('மொழி அமைப்புகள்');
    expect(texts).toContain('தமிழ்');
    expect(texts).toContain('பணியாளர் விடுப்பு விண்ணப்பங்கள்');
    expect(await AsyncStorage.getItem(APP_LANGUAGE_KEY)).toBe('ta');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
