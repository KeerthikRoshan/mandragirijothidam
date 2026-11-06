import React from 'react';
import { Text, TextInput } from 'react-native';

import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PoojaBookingFormModal } from '../src/components/common/PoojaBookingFormModal';

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

describe('PoojaBookingFormModal Component', () => {
  it('renders shared bottom-up modal fields, category choices, and action buttons', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <PoojaBookingFormModal
            visible={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            selectedDate="2026-11-21"
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Header
    expect(texts).toContain('புதிய நிகழ்வு / பூஜை பதிவு');

    // Date Subtitle
    expect(texts.some(t => t.includes('நவம்பர் 21, 2026'))).toBe(true);

    // Form Field Labels
    expect(texts).toContain('தேதி (Date - YYYY-MM-DD) *');
    expect(texts).toContain('நிகழ்வு தலைப்பு (Event Title) *');
    expect(texts).toContain('வாடிக்கையாளர் / பக்தர் பெயர் *');
    expect(texts).toContain('கைபேசி எண் (Mobile Number)');
    expect(texts).toContain('நிகழ்வு நடைபெறும் இடம் (Location)');
    expect(texts).toContain('நிகழ்வு வகை (Category) *');
    expect(texts).toContain('நேரம் (Time Slot)');
    expect(texts).toContain('புரோகிதர் / குருக்கள் (Priest - Prebuilt List) *');

    // Category Choices (including custom option)
    expect(texts).toContain('ஜாதகம்');
    expect(texts).toContain('கோவில்');
    expect(texts).toContain('வெளி நிகழ்வு');
    expect(texts).toContain('பிற (தனிப்பயன்)');

    // 1. Brogithar (Priest) Dropdown Selection Trigger
    // Default active priest from existing prebuilt list (PRIEST_MOCK_STAFF[0])
    expect(texts).toContain('முருகன் சுவாமிகள் - தலைமை குருக்கள்');
    expect(texts).toContain('தலைமை');

    // 2. Payment Section & Field Labels
    expect(texts).toContain('கட்டண விவரங்கள் (Payment Details)');
    expect(texts).toContain('1. வாடிக்கையாளர் கட்டணம் (Client Payment)');
    expect(texts).toContain('நிகழ்வு மொத்தக் கட்டணம் (Total Event Charge) *');
    expect(texts).toContain('முன்பணம் (Charge Advance)');
    expect(texts).toContain('பெறப்பட்ட மொத்தத் தொகை (Total Received)');
    expect(texts.some(t => t.includes('வாடிக்கையாளர் நிலுவைத் தொகை'))).toBe(true);

    expect(texts).toContain('2. புரோகிதர் ஊதியம் (Priest Remuneration)');
    expect(texts).toContain('புரோகிதருக்கு வழங்க வேண்டிய மொத்தத் தொகை (Total Pay for Priest)');
    expect(texts).toContain('புரோகிதருக்கு வழங்கிய முன்பணம் (Advance Paid to Priest)');
    expect(texts.some(t => t.includes('புரோகிதருக்கு வழங்க வேண்டிய மீதி'))).toBe(true);

    // Action buttons
    expect(texts).toContain('ரத்து');
    expect(texts).toContain('உறுதி செய்க');
  });

  it('allows opening priest dropdown to display prebuilt priest staff list', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <PoojaBookingFormModal
            visible={true}
            onClose={jest.fn()}
            onSubmit={jest.fn()}
            selectedDate="2026-11-21"
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    // Find dropdown trigger pressable
    const dropdownTrigger = root.findByProps({
      accessibilityLabel: 'Select Priest: முருகன் சுவாமிகள் - தலைமை குருக்கள்',
    });

    // Tap to open dropdown
    await ReactTestRenderer.act(() => {
      dropdownTrigger.props.onPress();
    });

    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Verify all existing prebuilt priests from PRIEST_MOCK_STAFF are displayed
    expect(texts).toContain('முருகன் சுவாமிகள் - தலைமை குருக்கள்');
    expect(texts).toContain('சாஸ்திரிஜி வெங்கடேஸ்வரன்');
    expect(texts).toContain('ராமு - தலைமை பூஜை உதவியாளர்');
    expect(texts).toContain('சுவாமி சுந்தரமூர்த்தி குருக்கள்');
    expect(texts).toContain('சிவஸ்ரீ வெங்கட்ரமண குருக்கள்');
    expect(texts).toContain('பிற புரோகிதர் (தனிப்பயன்)');
  });

  it('correctly calculates balances and submits complete payment fields', async () => {
    const handleSubmit = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <PoojaBookingFormModal
            visible={true}
            onClose={jest.fn()}
            onSubmit={handleSubmit}
            selectedDate="2026-11-21"
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const textInputs = root.findAllByType(TextInput);

    // Fill title and client name
    await ReactTestRenderer.act(() => {
      textInputs[1].props.onChangeText('கணபதி ஹோமம்');
      textInputs[2].props.onChangeText('திரு. ராதாகிருஷ்ணன்');
    });

    // Press Submit button
    const submitBtn = root.findByProps({ accessibilityLabel: 'Confirm booking' });
    await ReactTestRenderer.act(() => {
      submitBtn.props.onPress();
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.title).toBe('கணபதி ஹோமம்');
    expect(submitted.clientName).toBe('திரு. ராதாகிருஷ்ணன்');
    expect(submitted.priestId).toBe('p-murugan');
    expect(submitted.totalEventCharge).toBe(5000);
    expect(submitted.clientAdvanceAmount).toBe(1000);
    expect(submitted.clientTotalReceived).toBe(1000);
    expect(submitted.clientBalanceAmount).toBe(4000); // 5000 - 1000
    expect(submitted.priestTotalPay).toBe(2500);
    expect(submitted.priestAdvancePaid).toBe(500);
    expect(submitted.priestBalanceAmount).toBe(2000); // 2500 - 500
  });
});



