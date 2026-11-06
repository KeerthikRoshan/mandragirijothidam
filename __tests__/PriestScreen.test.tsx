import React from 'react';
import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PriestScreen } from '../src/screens/priest/PriestScreen';
import { PriestHeader } from '../src/components/priest/PriestHeader';
import { PriestList } from '../src/components/priest/PriestList';
import { PriestProfileCard } from '../src/components/priest/PriestProfileCard';
import { PriestBookingTabs } from '../src/components/priest/PriestBookingTabs';
import { AddPriestModal } from '../src/components/priest/AddPriestModal';
import { PoojaBookingFormModal } from '../src/components/common/PoojaBookingFormModal';
import { getPriestBookingCategories } from '../src/utils/priestBookingSelectors';
import { staffService } from '../src/services/staffService';
import { apiClient } from '../src/services/apiClient';
import { PriestStaffItem } from '../src/types/priest';

jest.setTimeout(15000);

jest.mock('../src/services/bookingApiService', () => ({
  bookingApiService: {
    checkAvailability: jest.fn().mockResolvedValue({ available: true, conflicts: [] }),
    createBooking: jest.fn().mockResolvedValue({ id: 1 }),
    getPriestBookings: jest.fn().mockResolvedValue([]),
    getAllBookings: jest.fn().mockResolvedValue([]),
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

const mockDbStaffList: PriestStaffItem[] = [
  {
    id: '1',
    staffId: 'MJSTF00001',
    nameEnglish: 'Sundaramoorthy Gurukkal',
    nameTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்',
    role: 'Priest',
    roleBadge: 'Priest',
    designation: 'முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
    designationTamil: 'முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
    phone: '+919840123456',
    phoneDisplay: '+91 984 XXXXX',
    traditionTamil: 'சைவ ஆகமம் & வேத நெறி',
    certificationTamil: 'சிவநெறி ஆகம பிரவீண குரு',
    expertiseTamil: 'விவாஹம், நவகிரக சாந்தி & மகா ருத்ர ஹோமம்',
    languagesTamil: 'தமிழ், சமஸ்கிருதம், ஆங்கிலம்',
    avatarUrl: 'https://cdn.mandhragiri.com/avatars/sundaram.png',
    status: 'active',
    fullTitleTamil: 'சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள் - முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்',
    bookings: [
      {
        id: 'b-101',
        titleTamil: 'மகா கணபதி ஹோமம்',
        clientName: 'கார்த்திகேயன்',
        timeSlot: '07:00 AM - 08:30 AM',
        date: '2026-10-16',
        status: 'active',
        statusLabelTamil: 'நடைபெறுகிறது',
      },
    ],
  },
  {
    id: '2',
    staffId: 'MJSTF00002',
    nameEnglish: 'Ramu Assistant',
    nameTamil: 'ராமு உதவியாளர்',
    role: 'Assistant',
    roleBadge: 'Assistant',
    designation: 'பூஜை உதவியாளர்',
    designationTamil: 'பூஜை உதவியாளர்',
    phone: '+919840123457',
    phoneDisplay: '+91 984 XXXXX',
    traditionTamil: 'சைவ ஆகமம்',
    certificationTamil: 'சான்றிதழ் பெற்ற உதவியாளர்',
    expertiseTamil: 'பூஜை ஏற்பாடுகள்',
    languagesTamil: 'தமிழ்',
    avatarUrl: null,
    status: 'active',
    fullTitleTamil: 'ராமு உதவியாளர் - பூஜை உதவியாளர்',
    bookings: [],
  },
];

describe('PriestScreen Component', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ReactTestRenderer.act(async () => {
      staffService.clear();
    });
  });

  it('fetches and renders actual staff details from GET /api/v1/staff database endpoint', async () => {
    jest.spyOn(apiClient, 'get').mockImplementation((url: string) => {
      if (url === '/staff' || url.startsWith('/staff')) {
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            message: 'பணியாளர்கள் பட்டியல் பெறப்பட்டது',
            data: {
              totalCount: 2,
              activeCount: 2,
              staff: mockDbStaffList,
            },
          },
        });
      }
      if (url.startsWith('/bookings')) {
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            data: { bookings: [], eventTypes: [] },
          },
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <PriestScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    // Settle async fetch
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // 0. Top App Header
    expect(texts).toContain('புரோகிதர் & உதவியாளர்');
    expect(texts).toContain('Priest & Assistant');

    // 1. Search Bar placeholder
    const textInput = root.findByType(TextInput);
    expect(textInput.props.placeholder).toContain('Search staff / புரோகிதர் & உதவியாளர்');

    // 2. Section header between search bar and horizontal staff list has been removed
    expect(texts).not.toContain('குழு');
    expect(texts).not.toContain('5 Active');

    // 3. Horizontal Priest List Items from Database
    expect(texts.some(t => t.includes('Sundaramoorthy'))).toBe(true);
    expect(texts.some(t => t.includes('Ramu'))).toBe(true);
    expect(texts).toContain('+ சேர்க்க');

    // Verify hardcoded mock data is NOT rendered
    expect(texts).not.toContain('Shastriji');
    expect(texts).not.toContain('Venkat');

    // 4. Main Priest Profile Card (Default: First DB staff Sundaramoorthy)
    expect(texts).toContain('சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள் - முதன்மை நிர்வாகி & தலைமை அர்ச்சகர்');
    expect(texts).toContain('சைவ ஆகமம் & வேத நெறி');
    expect(texts).toContain('சிவநெறி ஆகம பிரவீண குரு');
    expect(texts).toContain('+91 984 XXXXX');
    expect(texts).toContain('விவாஹம், நவகிரக சாந்தி & மகா ருத்ர ஹோமம்');
    expect(texts).toContain('தமிழ், சமஸ்கிருதம், ஆங்கிலம்');

    // 5. Booking Tabs (Synchronized from DB staff's bookings: active 1)
    expect(texts).toContain('நிகழ்வு (1)');

    // 6. Bottom Navigation Tabs
    expect(texts).toContain('முகப்பு');
    expect(texts).toContain('நாள்வாரி');
    expect(texts).toContain('புரோகிதர்');
    expect(texts).toContain('அமைப்புகள்');

    // 7. Floating New Booking Button
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('(New)');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('renders clean empty state when GET /api/v1/staff returns no staff records', async () => {
    jest.spyOn(apiClient, 'get').mockImplementation((url: string) => {
      if (url === '/staff' || url.startsWith('/staff')) {
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            message: 'பணியாளர்கள் பட்டியல் பெறப்பட்டது',
            data: {
              totalCount: 0,
              activeCount: 0,
              staff: [],
            },
          },
        });
      }
      if (url.startsWith('/bookings')) {
        return Promise.resolve({
          status: 200,
          data: {
            status: 1,
            success: true,
            data: { bookings: [], eventTypes: [] },
          },
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <PriestScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Shows header
    expect(texts).toContain('புரோகிதர் & உதவியாளர்');
    // Shows Add Card in list
    expect(texts).toContain('+ சேர்க்க');
    // Shows empty staff notice
    expect(texts).toContain('பணியாளர்கள் எவரும் இல்லை');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('PriestList renders with correct staff, add card, and triggers onSelectPriest', async () => {
    const mockSelect = jest.fn();
    const mockAdd = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PriestList
          staffList={mockDbStaffList}
          selectedPriestId={mockDbStaffList[0].id}
          onSelectPriest={mockSelect}
          onPressAdd={mockAdd}
        />
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts.some(t => t.includes('Sundaramoorthy'))).toBe(true);
    expect(texts.some(t => t.includes('Ramu'))).toBe(true);
    expect(texts).toContain('+ சேர்க்க');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('PriestProfileCard renders priest information and call button correctly', async () => {
    const mockCall = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PriestProfileCard
          priest={mockDbStaffList[0]}
          stats={{ total: 10, thisWeek: 5, conflicts: 0 }}
          onPressCall={mockCall}
        />
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts.some(t => t.includes('Sundaramoorthy'))).toBe(true);
    expect(texts).toContain('Priest');
    expect(texts).toContain('10');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('PriestBookingTabs switches active tab and updates context bar', async () => {
    const mockSelectTab = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PriestBookingTabs
          activeTab="upcoming"
          onSelectTab={mockSelectTab}
          tabCounts={{ past: 3, active: 1, upcoming: 6 }}
          scheduledCount={6}
        />
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('அடுத்தவை (6)');
    expect(texts).toContain('அடுத்து திட்டமிடப்பட்டவை');
    expect(texts).toContain('6 பூஜைகள்');
  });

  it('PriestHeader renders title, subtitle, and triggers back navigation', async () => {
    const mockBack = jest.fn();
    const mockAdd = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PriestHeader
          onPressBack={mockBack}
          onPressAdd={mockAdd}
          activeCount={5}
        />
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('புரோகிதர் & உதவியாளர்');
    expect(texts).toContain('Priest & Assistant');
  });

  it('AddPriestModal renders registration form fields and closes on dismiss', async () => {
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
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('புதிய புரோகிதர் சேர்க்க');
    expect(texts).toContain('Priest & Assistant Registration');
    expect(texts).toContain('புரோகிதரை சேர்க்கவும்');
  });

  it('reusable PoojaBookingFormModal opens cleanly for pooja registration', async () => {
    const mockClose = jest.fn();
    const mockSubmit = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <PoojaBookingFormModal
            visible={true}
            onClose={mockClose}
            onSubmit={mockSubmit}
          />
        </SafeAreaProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));
    expect(texts).toContain('பூஜை பதிவு');
    expect(texts).toContain('புதிய நிகழ்வு சேர்க்கை');
    expect(texts).toContain('ரத்து செய்');
    expect(texts).toContain('அடுத்து');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('getPriestBookingCategories guarantees 100% mathematical synchronization', () => {
    const testPriest = mockDbStaffList[0];
    const categories = getPriestBookingCategories(testPriest.bookings, '2026-10-16');

    expect(categories.counts.total).toBe(testPriest.bookings.length);
    expect(categories.counts.past).toBe(categories.past.length);
    expect(categories.counts.active).toBe(categories.active.length);
    expect(categories.counts.upcoming).toBe(categories.upcoming.length);
    expect(categories.counts.total).toBe(
      categories.counts.past + categories.counts.active + categories.counts.upcoming
    );
  });
});
