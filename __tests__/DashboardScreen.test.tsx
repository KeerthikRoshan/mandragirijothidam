import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DashboardScreen } from '../src/screens/dashboard/DashboardScreen';

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

describe('DashboardScreen Component', () => {
  it('renders all sections and Tamil text matching the updated reference screenshot', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <DashboardScreen />
          </NavigationContainer>
        </SafeAreaProvider>,
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Section 1: Top App Header
    expect(texts).toContain('மந்திரகிரி ஜோதிடம்');

    // Section 2: Dashboard Welcome Area
    expect(texts).toContain('வணக்கம், நிர்வாகி');

    // Section 3: Today's Panchangam
    expect(texts).toContain('இன்றைய');
    expect(texts).toContain('பஞ்சாங்கம்');
    expect(texts).toContain('சுக்கில துவாதசி');
    expect(texts).toContain('உத்திரம்');
    expect(texts).toContain('09:15 – 10:15');
    expect(texts).toContain('07:30 – 09:00');
    expect(texts).toContain('சுபம்');
    expect(texts).toContain('விலக்குக');
    expect(texts).toContain('முழு பஞ்சாங்கம் காண்க • View Full Panchangam');

    // Section 4: Today's Overview
    expect(texts).toContain('இன்றைய நிலை');
    expect(texts).toContain('அறிக்கைகள் ›');
    expect(texts).toContain('08');
    expect(texts).toContain('24');
    expect(texts).toContain('05');
    expect(texts).toContain('142');

    // Section 5: Today's Events
    expect(texts).toContain('இன்றைய நிகழ்வுகள்');
    expect(texts).toContain('8');
    expect(texts).toContain('காண்க');
    expect(texts).toContain('இன்றைய நேரலை நிகழ்வுகள்');
    expect(texts).toContain('LIVE OPERATIONS TODAY');
    expect(texts).toContain('08:30 AM கணபதி ஹோமம்');
    expect(texts).toContain('ஜாதக கணிப்பு • Consultation');
    expect(texts).toContain('திருமண பூஜை • Marriage Pooja');
    expect(texts).toContain('உறுதியானது');

    // Section 6: Floating Action Button
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('(New)');

    // Section 7: Bottom Navigation
    expect(texts).toContain('முகப்பு');
    expect(texts).toContain('நாள்வாரி');
    expect(texts).toContain('புரோகிதர்');
    expect(texts).toContain('அமைப்புகள்');
  });
});
