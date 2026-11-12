import React from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PoojaBookingFormModal } from '../src/components/common/PoojaBookingFormModal';

jest.mock('../src/services/bookingApiService', () => ({
  bookingApiService: {
    checkAvailability: jest.fn().mockResolvedValue({
      available: true,
      calculatedEndTime: '08:30 PM',
      conflicts: [],
    }),
    createBooking: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

const mockStaffList = [
  {
    id: 'p-murugan',
    nameTamil: 'முருகன் சுவாமிகள்',
    nameEnglish: 'Murugan Swamigal',
    fullTitleTamil: 'முருகன் சுவாமிகள் - தலைமை குருக்கள்',
    designationTamil: 'தலைமை குருக்கள்',
    designation: 'Chief Priest',
    phone: '9840122334',
    phoneDisplay: '+91 98401 22334',
    status: 'active',
    isLead: true,
  },
  {
    id: 'p-shastri',
    nameTamil: 'சாஸ்திரிஜி வெங்கடேஸ்வரன்',
    nameEnglish: 'Shastriji Venkateswaran',
    fullTitleTamil: 'சாஸ்திரிஜி வெங்கடேஸ்வரன்',
    designationTamil: 'குருக்கள்',
    designation: 'Priest',
    phone: '9840122335',
    phoneDisplay: '+91 98401 22335',
    status: 'active',
  },
];

jest.mock('../src/services/staffService', () => ({
  staffService: {
    getAllStaff: jest.fn().mockReturnValue(mockStaffList),
    getActiveStaff: jest.fn().mockReturnValue(mockStaffList),
    fetchStaff: jest.fn().mockImplementation(() => Promise.resolve(mockStaffList)),
    subscribe: jest.fn().mockReturnValue(() => {}),
  },
}));

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
  it('renders Stage 01 replica with header, stepper, and without suggested timings or swipe bar', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // Header & Subtitle
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('புதிய நிகழ்வு சேர்க்கை');

    // Language Toggle Pill
    expect(texts).toContain('தமிழ்');
    expect(texts).toContain('EN');

    // Stepper Track
    expect(texts).toContain('1. நிகழ்வு');
    expect(texts).toContain('2. பக்தர்');
    expect(texts).toContain('3. இடம்');
    expect(texts).toContain('4. பொருட்கள்');
    expect(texts).toContain('5. கட்டணம்');

    // Swipe affordance section removed as requested
    expect(texts).not.toContain('ஸ்வைப் செய்யவும்');

    // STAGE 01 Card Header & Badge
    expect(texts).toContain('● 1. பூஜை & நிகழ்வு விவரங்கள்');
    expect(texts).toContain('STAGE 01');

    // Fields in Stage 01
    expect(texts).toContain('பூஜை வகை');
    expect(texts).toContain('தேதி');
    expect(texts).toContain('சுபமுகூர்த்தம்');
    expect(texts).toContain('துவக்க நேரம்');
    expect(texts).toContain('கால அளவு');
    expect(texts).toContain('1h');
    expect(texts).toContain('2h');
    expect(texts).toContain('3h');
    expect(texts).toContain('4h');
    expect(texts).toContain('Custom');
    expect(texts).toContain('முடிவு நேரம் (கணக்கிடப்பட்டது)');
    expect(texts).toContain('தலைமை புரோகிதர்');

    // Item 3: Suggested timings chips are completely removed
    expect(texts).not.toContain('பரிந்துரை :');
    expect(texts).not.toContain('07:00 AM');
    expect(texts).not.toContain('09:00 AM');
    expect(texts).not.toContain('10:30 AM');

    // Item 7: No arbitrary priest selected by default on new booking
    expect(texts).toContain('புரோகிதரை தேர்ந்தெடுக்கவும்');
    expect(texts).toContain('தேர்வு செய் ›');

    // Bottom Action Buttons
    expect(texts).toContain('ரத்து செய்');
    expect(texts).toContain('அடுத்து');

    // Check placeholder-only: title starts empty
    const inputs = root.findAllByType(TextInput);
    expect(inputs[0].props.value).toBe('');
    expect(inputs[0].props.placeholder).toContain('கணபதி ஹோமம்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('switches language cleanly between Tamil and English without losing entered form data', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // Type in a custom pooja title in Tamil mode
    const textInputs = root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      textInputs[0].props.onChangeText('மகா கணபதி ஹோமம்');
    });

    // Tap EN language toggle button
    const enButton = root.findByProps({ accessibilityLabel: 'English Language' });
    await ReactTestRenderer.act(async () => {
      enButton.props.onPress();
    });

    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Header & Stage now pure English
    expect(texts).toContain('Pooja Registration');
    expect(texts).toContain('Add New Event / Booking');
    expect(texts).toContain('● 1. Event & Pooja Details');
    expect(texts).toContain('Pooja / Event Type');
    expect(texts).toContain('Start Time');
    expect(texts).toContain('Duration');
    expect(texts).toContain('Cancel');
    expect(texts).toContain('Next');

    // Check entered data was preserved in the TextInput!
    const recheckedInputs = root.findAllByType(TextInput);
    expect(recheckedInputs[0].props.value).toBe('மகா கணபதி ஹோமம்');

    // Switch back to Tamil
    const taButton = root.findByProps({ accessibilityLabel: 'தமிழ் மொழி' });
    await ReactTestRenderer.act(async () => {
      taButton.props.onPress();
    });

    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('● 1. பூஜை & நிகழ்வு விவரங்கள்');
    expect(texts).toContain('ரத்து செய்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('renders Tamil Devotee step (Stage 02) text immediately on initial render without requiring touch', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // Advance directly to Step 2
    const nextBtn = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn.props.onPress();
    });

    // Item 2: All Tamil labels and text must be immediately visible without touch
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 2. பக்தர் விவரங்கள்');
    expect(texts).toContain('STAGE 02');
    expect(texts).toContain('கர்த்தா / பக்தர் பெயர்');
    expect(texts).toContain('அலைபேசி எண்');
    expect(texts).toContain('மாற்று எண்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('allows free navigation between steps even when fields are empty, and validates on final submit', async () => {
    const handleSubmit = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // On Step 1: Leave title empty and press Next
    const nextBtn1 = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn1.props.onPress();
    });

    // Successfully moves to Step 2 freely!
    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 2. பக்தர் விவரங்கள்');

    // Jump freely to Step 5 via stepper
    const step5Pill = root.findByProps({ accessibilityLabel: 'Step 5: 5. கட்டணம்' });
    await ReactTestRenderer.act(async () => {
      step5Pill.props.onPress();
    });

    // Now on Step 5
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 5. கட்டண விவரம் & கணக்கு');

    // Press Submit on Step 5 with empty fields
    const submitBtn = root.findByProps({ accessibilityLabel: 'பதிவு உறுதி செய்' });
    await ReactTestRenderer.act(async () => {
      submitBtn.props.onPress();
    });

    // Submit blocked, handleSubmit not called, jumped back to Step 1 showing validation error
    expect(handleSubmit).not.toHaveBeenCalled();
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 1. பூஜை & நிகழ்வு விவரங்கள்');
    expect(texts).toContain('பூஜை வகை / தலைப்பை உள்ளிடவும்');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('navigates seamlessly across all 5 steps with Next, Back, and completes submission when valid', async () => {
    const handleSubmit = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // STEP 1: Fill Pooja Type
    const stage1Inputs = root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      stage1Inputs[0].props.onChangeText('கணபதி ஹோமம்');
    });

    // Open Time Picker and confirm time
    const timeSelector = root.findByProps({ accessibilityLabel: 'Start Time' });
    await ReactTestRenderer.act(async () => {
      timeSelector.props.onPress();
    });
    const confirmTimeBtn = root.findByProps({ accessibilityLabel: 'Confirm Time Selection' });
    await ReactTestRenderer.act(async () => {
      confirmTimeBtn.props.onPress();
    });

    // Open Priest Picker and select priest
    const priestTrigger = root.findByProps({ accessibilityLabel: 'Select Priest Trigger' });
    await ReactTestRenderer.act(async () => {
      priestTrigger.props.onPress();
    });
    const priestRow = root.findByProps({ accessibilityLabel: 'Select Shastriji Venkateswaran' });
    await ReactTestRenderer.act(async () => {
      priestRow.props.onPress();
    });

    // Advance to Step 2
    const nextBtn1 = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn1.props.onPress();
    });

    // STEP 2: Now on Customer Details
    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 2. பக்தர் விவரங்கள்');
    expect(texts).toContain('STAGE 02');

    // Test Back button navigation
    const backBtn2 = root.findByProps({ accessibilityLabel: 'பின்செல்' });
    await ReactTestRenderer.act(async () => {
      backBtn2.props.onPress();
    });

    // Back on Step 1, verify entered title is preserved
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 1. பூஜை & நிகழ்வு விவரங்கள்');
    const stage1InputsRecheck = root.findAllByType(TextInput);
    expect(stage1InputsRecheck[0].props.value).toBe('கணபதி ஹோமம்');

    // Advance back to Step 2
    const nextBtnRecheck = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtnRecheck.props.onPress();
    });

    // STEP 2: Fill Name & Phone and press Next
    const stage2Inputs = root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      stage2Inputs[0].props.onChangeText('திரு. ராதாகிருஷ்ணன்');
      stage2Inputs[1].props.onChangeText('9876543210');
    });

    const nextBtn2 = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn2.props.onPress();
    });

    // STEP 3: Venue Details
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 3. நிகழ்விடம் & முகவரி');
    expect(texts).toContain('STAGE 03');
    expect(texts).toContain('இல்லம்');
    expect(texts).toContain('கோவில்');
    expect(texts).toContain('மண்டபம்');
    expect(texts).toContain('பிற');

    const nextBtn3 = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn3.props.onPress();
    });

    // STEP 4: Samagri Details
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 4. பூஜை திரவியங்கள் & ஏற்பாடு');
    expect(texts).toContain('STAGE 04');
    expect(texts).toContain('பக்தர் ஏற்பாடு');
    expect(texts).toContain('கோவில் / புரோகிதர்');

    const nextBtn4 = root.findByProps({ accessibilityLabel: 'அடுத்து' });
    await ReactTestRenderer.act(async () => {
      nextBtn4.props.onPress();
    });

    // STEP 5: Payment & Accounts
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('● 5. கட்டண விவரம் & கணக்கு');
    expect(texts).toContain('STAGE 05');
    expect(texts).toContain('வாடிக்கையாளர் கட்டணம்');
    expect(texts).toContain('மொத்தக் கட்டணம்');
    expect(texts).toContain('புரோகிதர் ஊதியம்');
    expect(texts).toContain('பதிவு உறுதி செய்');

    // Fill payments
    const stage5Inputs = root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      stage5Inputs[0].props.onChangeText('5000'); // total charge
      stage5Inputs[1].props.onChangeText('1000'); // advance
      stage5Inputs[2].props.onChangeText('2500'); // priest pay
      stage5Inputs[3].props.onChangeText('500');  // priest advance
    });

    // Confirm booking
    const submitBtn = root.findByProps({ accessibilityLabel: 'பதிவு உறுதி செய்' });
    await ReactTestRenderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.title).toBe('கணபதி ஹோமம்');
    expect(submitted.clientName).toBe('திரு. ராதாகிருஷ்ணன்');
    expect(submitted.phone).toBe('9876543210');
    expect(submitted.totalEventCharge).toBe(5000);
    expect(submitted.clientAdvanceAmount).toBe(1000);
    expect(submitted.clientBalanceAmount).toBe(4000);
    expect(submitted.priestTotalPay).toBe(2500);
    expect(submitted.priestAdvancePaid).toBe(500);
    expect(submitted.priestBalanceAmount).toBe(2000);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('Item 6: opens interactive Date Picker directly when tapping the date box and updates date without keyboard', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // Directly tap anywhere on the Date box
    const dateSelector = root.findByProps({ accessibilityLabel: 'Date' });
    await ReactTestRenderer.act(async () => {
      dateSelector.props.onPress();
    });

    // Verify Date Picker elements are displayed
    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('இன்று');
    expect(texts).toContain('மூடு');

    // Pick a date cell
    const dayCell = root.findByProps({ accessibilityLabel: 'Date 2026-11-20' });
    await ReactTestRenderer.act(async () => {
      dayCell.props.onPress();
    });

    // Date box now displays the updated date
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('2026-11-20');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('Item 6: opens interactive Time Picker directly when tapping the time box and updates time without keyboard', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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

    // Directly tap anywhere on the Time box
    const timeSelector = root.findByProps({ accessibilityLabel: 'Start Time' });
    await ReactTestRenderer.act(async () => {
      timeSelector.props.onPress();
    });

    // Verify Time Picker elements are displayed
    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('துவக்க நேரம் தேர்வு');
    expect(texts).toContain('நேரம் உறுதி செய்');

    // Tap Confirm in Time Picker
    const confirmBtn = root.findByProps({ accessibilityLabel: 'Confirm Time Selection' });
    await ReactTestRenderer.act(async () => {
      confirmBtn.props.onPress();
    });

    // Time box now displays the confirmed time
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('05:30 PM');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('Item 7: Assigned Priest starts unselected on new booking, reflects immediately upon selection, and preserves in edit mode', async () => {
    // 1. Test new booking: no arbitrary priest selected
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
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
    let texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('புரோகிதரை தேர்ந்தெடுக்கவும்');
    expect(texts).toContain('தேர்வு செய் ›');

    // Open priest picker
    const priestTrigger = root.findByProps({ accessibilityLabel: 'Select Priest Trigger' });
    await ReactTestRenderer.act(async () => {
      priestTrigger.props.onPress();
    });

    // Select priest
    const priestRow = root.findByProps({ accessibilityLabel: 'Select Shastriji Venkateswaran' });
    await ReactTestRenderer.act(async () => {
      priestRow.props.onPress();
    });

    // Immediately reflected in the field!
    texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('சாஸ்திரிஜி வெங்கடேஸ்வரன்');
    expect(texts).toContain('மாற்று ›');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });

    // 2. Test edit mode: preserves previously assigned priest
    const existingBooking: any = {
      id: 'book-101',
      date: '2026-11-25',
      titleTamil: 'கணபதி ஹோமம்',
      clientName: 'கல்யாணசுந்தரம்',
      clientPhone: '9840122334',
      priestId: 'p-shastri',
      priestNameTamil: 'சாஸ்திரிஜி வெங்கடேஸ்வரன்',
      startTime: '06:00 AM',
      durationMinutes: 120,
      venueType: 'home',
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <PoojaBookingFormModal
            visible={true}
            onClose={jest.fn()}
            onSubmit={jest.fn()}
            initialBooking={existingBooking}
          />
        </SafeAreaProvider>
      );
    });

    const rootEdit = renderer!.root;
    texts = rootEdit.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('சாஸ்திரிஜி வெங்கடேஸ்வரன்');
    expect(texts).toContain('மாற்று ›');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
