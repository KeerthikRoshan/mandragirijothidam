import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DailyScheduleScreen } from '../src/screens/schedule/DailyScheduleScreen';

const Stack = createNativeStackNavigator();

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

describe('DailyScheduleScreen Component', () => {
  it('renders weekly view mode matching the reference screenshot', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="DailySchedule" component={DailyScheduleScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // 1. Header
    expect(texts).toContain('நிகழ்வு அட்டவணை');
    expect(texts).toContain('Daily Schedule');

    // 2. Weekly Calendar & Expand Link
    expect(texts).toContain('முழு மாதம் ›');
    expect(texts).toContain('வெள்');
    expect(texts).toContain('திங்');

    // 3. Date Summary
    expect(texts).toContain('நவம்பர் 21, 2026');
    expect(texts).toContain('மொத்தம்: 4');
    expect(texts).toContain('உறுதி: 2');
    expect(texts).toContain('நிலுவை: 1');

    // 4. View Toggle
    expect(texts).toContain('நேர வரிசை');
    expect(texts).toContain('குருக்கள் வாரியாக');

    // 5. Category Filters
    expect(texts).toContain('அனைத்தும் (4)');
    expect(texts).toContain('ஜாதகம் (1)');
    expect(texts).toContain('கோவில் (1)');
    expect(texts).toContain('வெளி நிகழ்வு (2)');

    // 6. Timeline Bookings
    expect(texts).toContain('ஜாதக கணிப்பு & பலன் பார்த்தல்');
    expect(texts).toContain('திருமண முகூர்த்த பூஜை & சங்கல்பம்');
    expect(texts).toContain('கிரகப்பிரவேச கணபதி ஹோமம்');
    expect(texts).toContain('ஆயுள் ஹோமம் & மிருத்யுஞ்சய ஜபம்');

    // 7. Floating Action Button
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('(New)');

    // 8. Bottom Nav
    expect(texts).toContain('முகப்பு');
    expect(texts).toContain('நாள்வாரி');
  });
});
