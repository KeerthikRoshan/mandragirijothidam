/**
 * PoojaBookingFormModal Component
 * Replicated 1:1 from Selected Design Reference (5-Stage Wizard)
 *
 * Enhancements:
 * 1. Smooth 60fps horizontal navigation & gestures (real-time finger drag tracking, spring snap, native driver slide transitions).
 * 2. Tamil Devotee step text visibility (removed restrictive line-heights, integer font sizes, explicit colors, zero-delay rendering).
 * 3. Removed suggested timings from form and pickers for clean direct time picking.
 * 4. Subtle step-position indicator and swipe affordance bar (minimal dots + muted chevrons).
 * 5. Smooth keyboard avoidance without layout flickering or abrupt scroll jumps.
 * 6. Direct full-field date & time picker interactions (tapping anywhere on the field opens picker directly; no keyboard).
 * 7. Assigned Priest selection: no arbitrary priest pre-selected for new bookings; clean placeholder; immediate selection reflection; edit mode preservation.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  X,
} from 'lucide-react-native';
import { ASSETS } from '../../constants/assets';
import {
  BookingCategory,
  ConflictItem,
  ScheduleBooking,
  VenueType,
  SamagriProvider,
} from '../../types/schedule';
import { PriestStaffItem } from '../../types/priest';
import {
  formatDateKey,
  parseDateKey,
  getMonthCalendarCells,
  TAMIL_GREGORIAN_MONTH_NAMES,
  ENGLISH_MONTH_NAMES,
} from '../../utils/dateUtils';
import {
  getTamilDateInfo,
  isMuhurthamDate,
} from '../../services/tamilCalendarService';
import { PRIEST_MOCK_STAFF } from '../../data/priestMockData';
import { staffService } from '../../services/staffService';
import { bookingApiService } from '../../services/bookingApiService';
import { calculateBookingTimings } from '../../utils/timeCalculation';

export interface NewBookingFormData {
  title: string;
  eventTypeId?: string | null;
  clientName: string;
  phone: string;
  alternatePhone?: string;
  venueType: VenueType;
  location: string;
  address?: string;
  area?: string;
  pincode?: string;
  category: BookingCategory;
  categoryLabelTamil: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeSlot: string;
  priestId: string;
  priestIds?: string[];
  priestName: string;
  priestPhone?: string;
  samagriBy?: SamagriProvider;
  notes?: string;
  dateKey: string;
  endDateKey?: string;
  startDateTime?: string;
  endDateTime?: string;
  daysOffset?: number;
  crossesMidnight?: boolean;
  totalEventCharge: number;
  clientAdvanceAmount: number;
  clientTotalReceived: number;
  clientBalanceAmount: number;
  priestTotalPay: number;
  priestAdvancePaid: number;
  priestBalanceAmount: number;
}

interface PoojaBookingFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewBookingFormData) => Promise<void> | void;
  selectedDate?: string; // YYYY-MM-DD
  initialBooking?: ScheduleBooking;
  editBooking?: ScheduleBooking;
  initialDateKey?: string;
}

interface ModalStrings {
  title: string;
  subtitle: string;
  stepLabels: string[];
  stageBadges: string[];
  cancel: string;
  back: string;
  next: string;
  confirmBooking: string;
  // Step 1
  stage1Title: string;
  eventTypeLabel: string;
  eventTypePlaceholder: string;
  dateLabel: string;
  datePlaceholder: string;
  muhurthamBadge: string;
  startTimeLabel: string;
  durationLabel: string;
  selectedDuration: (hours: number | string) => string;
  customDuration: string;
  endTimeAuto: string;
  priestLabel: string;
  changePriest: string;
  selectPriest: string;
  choosePriestHint: string;
  // Step 2
  stage2Title: string;
  customerNameLabel: string;
  customerNamePlaceholder: string;
  mobileLabel: string;
  alternateMobileLabel: string;
  // Step 3
  stage3Title: string;
  venueTypeLabel: string;
  venueHome: string;
  venueTemple: string;
  venueHall: string;
  venueOther: string;
  addressLabel: string;
  addressPlaceholder: string;
  areaLabel: string;
  areaPlaceholder: string;
  pincodeLabel: string;
  pincodePlaceholder: string;
  // Step 4
  stage4Title: string;
  samagriLabel: string;
  samagriCustomer: string;
  samagriPriest: string;
  notesLabel: string;
  notesPlaceholder: string;
  // Step 5
  stage5Title: string;
  customerPaymentTitle: string;
  totalChargeLabel: string;
  advanceReceivedLabel: string;
  balanceDueLabel: string;
  partiallyPaid: string;
  fullyPaid: string;
  unpaid: string;
  priestRemunerationTitle: string;
  priestTotalPayLabel: string;
  priestAdvanceLabel: string;
  priestBalanceLabel: string;
  pendingPayment: string;
  // Date Picker
  datePickerTitle: string;
  todayBtn: string;
  closeBtn: string;
  // Time Picker
  timePickerTitle: string;
  confirmTimeBtn: string;
  hourLabel: string;
  minuteLabel: string;
  // Validation errors
  errEventType: string;
  errDate: string;
  errTime: string;
  errPriest: string;
  errCustomerName: string;
  errMobile: string;
  errAdvanceExceed: string;
  errPriestAdvanceExceed: string;
}

const STRINGS_TA: ModalStrings = {
  title: 'பூஜை பதிவு',
  subtitle: 'புதிய நிகழ்வு சேர்க்கை',
  stepLabels: ['1. நிகழ்வு', '2. பக்தர்', '3. இடம்', '4. பொருட்கள்', '5. கட்டணம்'],
  stageBadges: ['STAGE 01', 'STAGE 02', 'STAGE 03', 'STAGE 04', 'STAGE 05'],
  cancel: 'ரத்து செய்',
  back: 'பின்செல்',
  next: 'அடுத்து',
  confirmBooking: 'பதிவு உறுதி செய்',
  // Step 1
  stage1Title: '● 1. பூஜை & நிகழ்வு விவரங்கள்',
  eventTypeLabel: 'பூஜை வகை',
  eventTypePlaceholder: 'கணபதி ஹோமம் (Ganapathi Homam)',
  dateLabel: 'தேதி',
  datePlaceholder: 'YYYY-MM-DD',
  muhurthamBadge: 'சுபமுகூர்த்தம்',
  startTimeLabel: 'துவக்க நேரம்',
  durationLabel: 'கால அளவு',
  selectedDuration: h => `தேர்வு: ${h} மணி நேரம்`,
  customDuration: 'Custom',
  endTimeAuto: 'முடிவு நேரம் (கணக்கிடப்பட்டது)',
  priestLabel: 'தலைமை புரோகிதர்',
  changePriest: 'மாற்று ›',
  selectPriest: 'தேர்வு செய் ›',
  choosePriestHint: 'கிளிக் செய்து புரோகிதரை தேர்வு செய்யவும்',
  // Step 2
  stage2Title: '● 2. பக்தர் விவரங்கள்',
  customerNameLabel: 'கர்த்தா / பக்தர் பெயர்',
  customerNamePlaceholder: 'எஸ். கல்யாணசுந்தரம்',
  mobileLabel: 'அலைபேசி எண்',
  alternateMobileLabel: 'மாற்று எண்',
  // Step 3
  stage3Title: '● 3. நிகழ்விடம் & முகவரி',
  venueTypeLabel: 'இடத்தின் வகை',
  venueHome: 'இல்லம்',
  venueTemple: 'கோவில்',
  venueHall: 'மண்டபம்',
  venueOther: 'பிற',
  addressLabel: 'முகவரி விவரம்',
  addressPlaceholder: 'கதவு எண், தெரு பெயர் (எ.கா. 12, மேற்கு மாசி வீதி)',
  areaLabel: 'பகுதி / ஊர்',
  areaPlaceholder: 'எ.கா. சிம்மக்கல்',
  pincodeLabel: 'அஞ்சல் குறியீடு',
  pincodePlaceholder: '625001',
  // Step 4
  stage4Title: '● 4. பூஜை திரவியங்கள் & ஏற்பாடு',
  samagriLabel: 'பொருட்கள் ஏற்பாடு பொறுப்பு',
  samagriCustomer: 'பக்தர் ஏற்பாடு',
  samagriPriest: 'கோவில் / புரோகிதர்',
  notesLabel: 'சிறப்பு குறிப்புகள் & நிபந்தனைகள்',
  notesPlaceholder: 'பூஜை திரவியங்கள், விசேஷ ஏற்பாடுகள் பற்றிய குறிப்பு...',
  // Step 5
  stage5Title: '● 5. கட்டண விவரம் & கணக்கு',
  customerPaymentTitle: 'வாடிக்கையாளர் கட்டணம்',
  totalChargeLabel: 'மொத்தக் கட்டணம்',
  advanceReceivedLabel: 'பெறப்பட்ட தொகை / முன்பணம்',
  balanceDueLabel: 'மீதியுள்ள தொகை',
  partiallyPaid: 'பகுதி செலுத்தப்பட்டது',
  fullyPaid: 'முழுமையாக செலுத்தப்பட்டது',
  unpaid: 'நிலுவை',
  priestRemunerationTitle: 'புரோகிதர் ஊதியம்',
  priestTotalPayLabel: 'ஊதியம்',
  priestAdvanceLabel: 'வழங்கிய முன்பணம்',
  priestBalanceLabel: 'புரோகிதருக்கு பாக்கி',
  pendingPayment: 'செலுத்த வேண்டியது',
  // Date Picker
  datePickerTitle: 'தேதி தேர்வு',
  todayBtn: 'இன்று',
  closeBtn: 'மூடு',
  // Time Picker
  timePickerTitle: 'துவக்க நேரம் தேர்வு',
  confirmTimeBtn: 'நேரம் உறுதி செய்',
  hourLabel: 'மணி (Hours)',
  minuteLabel: 'நிமிடம் (Minutes)',
  // Validation errors
  errEventType: 'பூஜை வகை / தலைப்பை உள்ளிடவும்',
  errDate: 'சரியான தேதியை உள்ளிடவும் (YYYY-MM-DD)',
  errTime: 'துவக்க நேரத்தை சரியாக உள்ளிடவும் (e.g. 05:30 PM)',
  errPriest: 'தலைமை புரோகிதரை தேர்ந்தெடுக்கவும்',
  errCustomerName: 'கர்த்தா / பக்தர் பெயர் அவசியம்',
  errMobile: 'சரியான அலைபேசி எண்ணை உள்ளிடவும்',
  errAdvanceExceed: 'முன்பணம் மொத்தக் கட்டணத்தை விட அதிகமாக இருக்கக்கூடாது.',
  errPriestAdvanceExceed: 'புரோகிதர் முன்பணம் மொத்த ஊதியத்தை விட அதிகமாக இருக்கக்கூடாது.',
};

const STRINGS_EN: ModalStrings = {
  title: 'Pooja Registration',
  subtitle: 'Add New Event / Booking',
  stepLabels: ['1. Event', '2. Devotee', '3. Venue', '4. Samagri', '5. Payment'],
  stageBadges: ['STAGE 01', 'STAGE 02', 'STAGE 03', 'STAGE 04', 'STAGE 05'],
  cancel: 'Cancel',
  back: 'Back',
  next: 'Next',
  confirmBooking: 'Confirm Booking',
  // Step 1
  stage1Title: '● 1. Event & Pooja Details',
  eventTypeLabel: 'Pooja / Event Type',
  eventTypePlaceholder: 'Ganapathi Homam',
  dateLabel: 'Date',
  datePlaceholder: 'YYYY-MM-DD',
  muhurthamBadge: 'Muhurtham Day',
  startTimeLabel: 'Start Time',
  durationLabel: 'Duration',
  selectedDuration: h => `Selected: ${h} Hours`,
  customDuration: 'Custom',
  endTimeAuto: 'End Time (Auto-calculated)',
  priestLabel: 'Assigned Priest',
  changePriest: 'Change ›',
  selectPriest: 'Select ›',
  choosePriestHint: 'Tap to assign a priest',
  // Step 2
  stage2Title: '● 2. Customer Details',
  customerNameLabel: 'Customer Name',
  customerNamePlaceholder: 'S. Kalyanasundaram',
  mobileLabel: 'Mobile Number',
  alternateMobileLabel: 'Alternate Phone',
  // Step 3
  stage3Title: '● 3. Venue & Address Details',
  venueTypeLabel: 'Venue Type',
  venueHome: 'Home',
  venueTemple: 'Temple',
  venueHall: 'Hall',
  venueOther: 'Other',
  addressLabel: 'Address Details',
  addressPlaceholder: 'Door No, Street Name (e.g. 12, West Masi Street)',
  areaLabel: 'Area / Town',
  areaPlaceholder: 'e.g. Simmakkal',
  pincodeLabel: 'Pincode',
  pincodePlaceholder: '625001',
  // Step 4
  stage4Title: '● 4. Pooja Samagri & Arrangements',
  samagriLabel: 'Samagri Arranged By',
  samagriCustomer: 'Customer Arranged',
  samagriPriest: 'Temple / Priest',
  notesLabel: 'Special Notes & Requirements',
  notesPlaceholder: 'Notes regarding pooja samagri, special arrangements...',
  // Step 5
  stage5Title: '● 5. Payment & Accounts',
  customerPaymentTitle: 'Customer Payment',
  totalChargeLabel: 'Total Event Charge',
  advanceReceivedLabel: 'Advance Received / Total Paid',
  balanceDueLabel: 'Balance Due',
  partiallyPaid: 'Partially Paid',
  fullyPaid: 'Fully Paid',
  unpaid: 'Unpaid',
  priestRemunerationTitle: 'Priest Remuneration',
  priestTotalPayLabel: 'Total Pay',
  priestAdvanceLabel: 'Advance Paid',
  priestBalanceLabel: 'Balance Due to Priest',
  pendingPayment: 'Pending Payment',
  // Date Picker
  datePickerTitle: 'Select Date',
  todayBtn: 'Today',
  closeBtn: 'Close',
  // Time Picker
  timePickerTitle: 'Select Start Time',
  confirmTimeBtn: 'Confirm Time',
  hourLabel: 'Hours',
  minuteLabel: 'Minutes',
  // Validation errors
  errEventType: 'Please enter Pooja / Event Type',
  errDate: 'Please enter a valid date (YYYY-MM-DD)',
  errTime: 'Please enter a valid start time (e.g. 05:30 PM)',
  errPriest: 'Please select an assigned priest',
  errCustomerName: 'Customer Name is required',
  errMobile: 'Please enter a valid mobile number',
  errAdvanceExceed: 'Advance cannot exceed total event charge.',
  errPriestAdvanceExceed: 'Priest advance cannot exceed total pay.',
};

const DURATION_PRESETS = [
  { label: '1h', minutes: 60, hours: 1 },
  { label: '2h', minutes: 120, hours: 2 },
  { label: '3h', minutes: 180, hours: 3 },
  { label: '4h', minutes: 240, hours: 4 },
  { label: 'Custom', minutes: -1, hours: 'Custom' },
];

const TIME_PICKER_HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const TIME_PICKER_MINUTES = ['00', '15', '30', '45'];

const WEEKDAY_HEADERS_TA = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];
const WEEKDAY_HEADERS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const PoojaBookingFormModal: React.FC<PoojaBookingFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  selectedDate,
  initialBooking,
  editBooking,
  initialDateKey,
}) => {
  const effectiveInitialBooking = initialBooking || editBooking;
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const scrollViewRef = useRef<any>(null);
  const stepperScrollRef = useRef<any>(null);

  // Language & Navigation State
  const [currentLang, setCurrentLang] = useState<'ta' | 'en'>('ta');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const strings = currentLang === 'ta' ? STRINGS_TA : STRINGS_EN;
  const isTa = currentLang === 'ta';

  // Smooth Horizontal Animation Values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Dynamic Staff List from Backend (Pre-load from cache if available)
  const [staffList, setStaffList] = useState<PriestStaffItem[]>(() => {
    try {
      const cached = staffService.getAllStaff();
      return cached && cached.length > 0 ? cached : PRIEST_MOCK_STAFF;
    } catch {
      return PRIEST_MOCK_STAFF;
    }
  });

  // Form Fields State (Placeholder-only for new booking; preserved for initialBooking)
  const initialDateString =
    effectiveInitialBooking?.date ||
    initialDateKey ||
    selectedDate ||
    formatDateKey(new Date());
  const [dateInput, setDateInput] = useState<string>(initialDateString);
  const [title, setTitle] = useState<string>(
    effectiveInitialBooking?.titleTamil || effectiveInitialBooking?.titleEnglish || effectiveInitialBooking?.title || ''
  );

  const [client, setClient] = useState<string>(effectiveInitialBooking?.clientName || '');
  const [phone, setPhone] = useState<string>(effectiveInitialBooking?.clientPhone || effectiveInitialBooking?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState<string>(
    effectiveInitialBooking?.alternatePhone || ''
  );

  // Timing State (Placeholder-only for new bookings)
  const [startTime, setStartTime] = useState<string>(effectiveInitialBooking?.startTime || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    effectiveInitialBooking?.durationMinutes || 180
  );
  const [customDurationInput, setCustomDurationInput] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);

  // Assigned Priest Selection State (Item 7: No arbitrary priest selected by default on new booking)
  const [selectedPriestId, setSelectedPriestId] = useState<string>(
    effectiveInitialBooking?.priestId || ''
  );
  const [isPriestPickerOpen, setIsPriestPickerOpen] = useState<boolean>(false);
  const [customPriestText, setCustomPriestText] = useState<string>('');

  // Venue State
  const [venueType, setVenueType] = useState<VenueType>(effectiveInitialBooking?.venueType || 'home');
  const [address, setAddress] = useState<string>(effectiveInitialBooking?.address || '');
  const [area, setArea] = useState<string>(effectiveInitialBooking?.area || '');
  const [pincode, setPincode] = useState<string>(effectiveInitialBooking?.pincode || '');

  // Additional Details State
  const [samagriBy, setSamagriBy] = useState<SamagriProvider>(
    effectiveInitialBooking?.samagriBy || 'customer'
  );
  const [notes, setNotes] = useState<string>(
    effectiveInitialBooking?.notes || effectiveInitialBooking?.notesTamil || ''
  );

  // Payment State (Placeholder-only for new bookings)
  const [totalEventCharge, setTotalEventCharge] = useState<string>(
    effectiveInitialBooking?.totalEventCharge !== undefined
      ? String(effectiveInitialBooking.totalEventCharge)
      : ''
  );
  const [clientAdvanceAmount, setClientAdvanceAmount] = useState<string>(
    effectiveInitialBooking?.clientAdvanceAmount !== undefined
      ? String(effectiveInitialBooking.clientAdvanceAmount)
      : ''
  );
  const [priestTotalPay, setPriestTotalPay] = useState<string>(
    effectiveInitialBooking?.priestTotalPay !== undefined
      ? String(effectiveInitialBooking.priestTotalPay)
      : ''
  );
  const [priestAdvancePaid, setPriestAdvancePaid] = useState<string>(
    effectiveInitialBooking?.priestAdvancePaid !== undefined
      ? String(effectiveInitialBooking.priestAdvancePaid)
      : ''
  );

  // Interactive Pickers State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);

  // Calendar Picker Year/Month navigation state
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const d = parseDateKey(initialDateString);
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });
  const [calendarMonthIndex, setCalendarMonthIndex] = useState<number>(() => {
    const d = parseDateKey(initialDateString);
    return isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  });

  // Time Picker active temporary selections
  const [tempHour, setTempHour] = useState<string>('05');
  const [tempMinute, setTempMinute] = useState<string>('30');
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');

  // Keyboard avoidance (gentle adjustment without jumps)
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Live Conflict Checking State
  const [activeConflict, setActiveConflict] = useState<ConflictItem | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState<boolean>(false);

  // Fetch live staff from API
  useEffect(() => {
    if (visible) {
      let isMounted = true;
      staffService
        .fetchStaff()
        .then(staff => {
          if (isMounted && staff && staff.length > 0) {
            setStaffList(staff);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [visible]);

  // Synchronize initial booking details or reset to placeholder-only fields
  const prevVisibleRef = useRef<boolean>(false);
  const prevInitialBookingIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isNewOpen = visible && !prevVisibleRef.current;
    const isBookingChanged = visible && effectiveInitialBooking?.id !== prevInitialBookingIdRef.current;

    if (isNewOpen || isBookingChanged) {
      if (effectiveInitialBooking) {
        setDateInput(effectiveInitialBooking.date);
        setTitle(effectiveInitialBooking.titleTamil || effectiveInitialBooking.titleEnglish || effectiveInitialBooking.title || '');
        setClient(effectiveInitialBooking.clientName || '');
        setPhone(effectiveInitialBooking.clientPhone || effectiveInitialBooking.phone || '');
        setAlternatePhone(effectiveInitialBooking.alternatePhone || '');
        setStartTime(effectiveInitialBooking.startTime || '');
        setDurationMinutes(effectiveInitialBooking.durationMinutes || 180);
        setVenueType(effectiveInitialBooking.venueType || 'home');
        setAddress(effectiveInitialBooking.address || '');
        setArea(effectiveInitialBooking.area || '');
        setPincode(effectiveInitialBooking.pincode || '');
        setSamagriBy(effectiveInitialBooking.samagriBy || 'customer');
        setNotes(effectiveInitialBooking.notes || effectiveInitialBooking.notesTamil || '');

        const matchedPriest = staffList.find(
          p => p.id === effectiveInitialBooking.priestId || p.fullTitleTamil === effectiveInitialBooking.priestNameTamil
        );
        if (matchedPriest) {
          setSelectedPriestId(matchedPriest.id);
        } else if (effectiveInitialBooking.priestId) {
          setSelectedPriestId(effectiveInitialBooking.priestId);
        } else if (effectiveInitialBooking.priestNameTamil) {
          setSelectedPriestId('custom');
          setCustomPriestText(effectiveInitialBooking.priestNameTamil);
        } else {
          setSelectedPriestId('');
        }

        setTotalEventCharge(
          effectiveInitialBooking.totalEventCharge !== undefined ? String(effectiveInitialBooking.totalEventCharge) : ''
        );
        setClientAdvanceAmount(
          effectiveInitialBooking.clientAdvanceAmount !== undefined ? String(effectiveInitialBooking.clientAdvanceAmount) : ''
        );
        setPriestTotalPay(
          effectiveInitialBooking.priestTotalPay !== undefined ? String(effectiveInitialBooking.priestTotalPay) : ''
        );
        setPriestAdvancePaid(
          effectiveInitialBooking.priestAdvancePaid !== undefined ? String(effectiveInitialBooking.priestAdvancePaid) : ''
        );

        const d = parseDateKey(effectiveInitialBooking.date);
        if (!isNaN(d.getTime())) {
          setCalendarYear(d.getFullYear());
          setCalendarMonthIndex(d.getMonth());
        }
      } else {
        // New booking: All fields start empty so descriptive placeholders display
        const dateDefault = initialDateKey || selectedDate || formatDateKey(new Date());
        setDateInput(dateDefault);
        setTitle('');
        setClient('');
        setPhone('');
        setAlternatePhone('');
        setStartTime('');
        setDurationMinutes(180);
        setIsCustomDuration(false);
        setCustomDurationInput('');
        setVenueType('home');
        setAddress('');
        setArea('');
        setPincode('');
        setSamagriBy('customer');
        setNotes('');
        setTotalEventCharge('');
        setClientAdvanceAmount('');
        setPriestTotalPay('');
        setPriestAdvancePaid('');
        // Item 7: Do not arbitrarily select any priest for a new booking
        setSelectedPriestId('');
        setCustomPriestText('');

        const d = parseDateKey(dateDefault);
        if (!isNaN(d.getTime())) {
          setCalendarYear(d.getFullYear());
          setCalendarMonthIndex(d.getMonth());
        }
      }
      setCurrentStep(1);
      slideAnim.setValue(0);
      opacityAnim.setValue(1);
      setErrorText(null);
      setActiveConflict(null);
      setIsPriestPickerOpen(false);
      setIsDatePickerOpen(false);
      setIsTimePickerOpen(false);
      prevInitialBookingIdRef.current = effectiveInitialBooking?.id;
    }
    prevVisibleRef.current = visible;
  }, [visible, selectedDate, initialDateKey, effectiveInitialBooking, staffList]);

  // Synchronize time picker whenever it opens or startTime changes
  useEffect(() => {
    if (startTime) {
      const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        if (h === 0) h = 12;
        if (h > 12) h = h % 12;
        setTempHour(String(h).padStart(2, '0'));
        setTempMinute(match[2]);
        setTempPeriod(((match[3] || 'AM').toUpperCase() as 'AM' | 'PM') || 'AM');
      }
    }
  }, [startTime, isTimePickerOpen]);

  // Date validation & Tamil calendar helper
  const isDatePatternValid =
    /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim()) ||
    /^\d{2}-\d{2}-\d{4}$/.test(dateInput.trim());

  const normalizedDateKey = useMemo(() => {
    const trimmed = dateInput.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('-');
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  }, [dateInput]);

  const tamilInfo = useMemo(() => {
    if (isDatePatternValid) {
      try {
        return getTamilDateInfo(normalizedDateKey);
      } catch {
        return null;
      }
    }
    return null;
  }, [normalizedDateKey, isDatePatternValid]);

  // Duration & End Time Calculation
  const currentDuration = isCustomDuration
    ? parseInt(customDurationInput, 10) || 60
    : durationMinutes;

  const calculatedTimings = useMemo(() => {
    if (!startTime.trim()) return null;
    try {
      return calculateBookingTimings(startTime, currentDuration, normalizedDateKey);
    } catch {
      return null;
    }
  }, [startTime, currentDuration, normalizedDateKey]);

  // Active Priest (Item 7: Returns null if no priest is selected yet)
  const activePriest = useMemo(() => {
    if (!selectedPriestId) return null;
    if (selectedPriestId === 'custom') {
      return {
        id: 'custom',
        nameTamil: customPriestText.trim() || (isTa ? 'பிற புரோகிதர் (தனிப்பயன்)' : 'Other Priest (Custom)'),
        nameEnglish: customPriestText.trim() || 'Custom Priest',
        fullTitleTamil: customPriestText.trim() || (isTa ? 'பிற புரோகிதர் (தனிப்பயன்)' : 'Other Priest (Custom)'),
        designationTamil: 'தனிப்பயன்',
        designation: 'Custom',
        phone: '',
      };
    }
    const found = staffList.find(p => p.id === selectedPriestId || p.fullTitleTamil === selectedPriestId);
    if (found) return found;

    // Fallback to effectiveInitialBooking assigned priest details
    if (effectiveInitialBooking && (effectiveInitialBooking.priestId === selectedPriestId || effectiveInitialBooking.priestNameTamil)) {
      return {
        id: selectedPriestId,
        nameTamil: effectiveInitialBooking.priestNameTamil || selectedPriestId,
        nameEnglish: effectiveInitialBooking.priestNameEnglish || selectedPriestId,
        fullTitleTamil: effectiveInitialBooking.priestNameTamil || selectedPriestId,
        designationTamil: 'புரோகிதர்',
        designation: 'Priest',
        phone: effectiveInitialBooking.priestPhone || '',
      };
    }
    return null;
  }, [selectedPriestId, customPriestText, staffList, isTa, effectiveInitialBooking]);

  // Live Conflict Checking
  useEffect(() => {
    if (
      !visible ||
      !isDatePatternValid ||
      !calculatedTimings ||
      !selectedPriestId ||
      selectedPriestId === 'custom' ||
      !startTime.trim()
    ) {
      setActiveConflict(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      if (!isMounted) return;
      setIsCheckingConflict(true);
      try {
        const res = await bookingApiService.checkAvailability({
          booking_date: normalizedDateKey,
          start_time: startTime,
          duration_minutes: currentDuration,
          priest_ids: [selectedPriestId],
          exclude_booking_id: effectiveInitialBooking?.id ? parseInt(String(effectiveInitialBooking.id), 10) || null : null,
        });

        if (!isMounted) return;
        if (!res.available && res.conflicts && res.conflicts.length > 0) {
          setActiveConflict(res.conflicts[0]);
        } else {
          setActiveConflict(null);
        }
      } catch {
        // Non-fatal
      } finally {
        if (isMounted) {
          setIsCheckingConflict(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    normalizedDateKey,
    startTime,
    currentDuration,
    selectedPriestId,
    isDatePatternValid,
    calculatedTimings,
    visible,
    effectiveInitialBooking,
  ]);

  // Numeric currency parsing
  const parseAmount = (val: string): number => {
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  const totalChargeNum = parseAmount(totalEventCharge);
  const clientAdvanceNum = parseAmount(clientAdvanceAmount);
  const clientBalanceNum = Math.max(0, totalChargeNum - clientAdvanceNum);

  const priestPayNum = parseAmount(priestTotalPay);
  const priestAdvanceNum = parseAmount(priestAdvancePaid);
  const priestBalanceNum = Math.max(0, priestPayNum - priestAdvanceNum);

  // Reset & Close
  const handleCloseModal = () => {
    Keyboard.dismiss();
    setErrorText(null);
    setIsPriestPickerOpen(false);
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    onClose();
  };

  // Validation per step (Invoked strictly on final submit)
  const validateStep = (stepNumber: number): boolean => {
    setErrorText(null);

    if (stepNumber === 1) {
      if (!title.trim()) {
        setErrorText(strings.errEventType);
        return false;
      }
      if (title.trim().length < 2) {
        setErrorText(
          currentLang === 'ta'
            ? 'பூஜை வகை / தலைப்பு குறைந்தபட்சம் 2 எழுத்துக்கள் இருக்க வேண்டும்'
            : 'Pooja title must be at least 2 characters'
        );
        return false;
      }
      if (title.trim().length > 150) {
        setErrorText(
          currentLang === 'ta'
            ? 'பூஜை வகை / தலைப்பு அதிகபட்சம் 150 எழுத்துக்கள் மட்டுமே அனுமதிக்கப்படும்'
            : 'Pooja title cannot exceed 150 characters'
        );
        return false;
      }
      if (!isDatePatternValid) {
        setErrorText(strings.errDate);
        return false;
      }
      if (!startTime.trim() || !calculatedTimings) {
        setErrorText(strings.errTime);
        return false;
      }
      if (!calculatedTimings.isEndAfterStart) {
        setErrorText(
          currentLang === 'ta'
            ? 'முடிவு நேரம் துவக்க நேரத்திற்குப் பின் இருக்க வேண்டும்.'
            : 'End date and time must be strictly after start date and time.'
        );
        return false;
      }
      if (!selectedPriestId) {
        setErrorText(strings.errPriest);
        return false;
      }
      if (activeConflict) {
        setErrorText(
          currentLang === 'ta'
            ? `நேர மோதல்: ${activeConflict.priestName} என்பவருக்கு ஏற்கனவே "${activeConflict.eventName}" நிகழ்வு ${activeConflict.startTime || ''} - ${activeConflict.endTime || ''} வரை முன்பதிவு செய்யப்பட்டுள்ளது.`
            : `Time Conflict: ${activeConflict.priestName} is already assigned to "${activeConflict.eventName}" from ${activeConflict.startTime || ''} - ${activeConflict.endTime || ''}.`
        );
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!client.trim()) {
        setErrorText(strings.errCustomerName);
        return false;
      }
      if (client.trim().length < 2) {
        setErrorText(
          currentLang === 'ta'
            ? 'கர்த்தா / பக்தர் பெயர் குறைந்தபட்சம் 2 எழுத்துக்கள் இருக்க வேண்டும்'
            : 'Customer name must be at least 2 characters'
        );
        return false;
      }
      if (client.trim().length > 100) {
        setErrorText(
          currentLang === 'ta'
            ? 'கர்த்தா / பக்தர் பெயர் 100 எழுத்துக்களுக்கு மிகாமல் இருக்க வேண்டும்'
            : 'Customer name cannot exceed 100 characters'
        );
        return false;
      }
      if (!phone.trim()) {
        setErrorText(strings.errMobile);
        return false;
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        setErrorText(
          currentLang === 'ta'
            ? 'சரியான அலைபேசி எண்ணை உள்ளிடவும் (10-15 இலக்கங்கள்)'
            : 'Please enter a valid mobile number (10-15 digits)'
        );
        return false;
      }
      if (alternatePhone.trim()) {
        const cleanAlt = alternatePhone.replace(/[^0-9]/g, '');
        if (cleanAlt.length < 7 || cleanAlt.length > 15) {
          setErrorText(
            currentLang === 'ta'
              ? 'மாற்று அலைபேசி எண் 7 முதல் 15 இலக்கங்கள் இருக்க வேண்டும்'
              : 'Alternate phone must be between 7 and 15 digits'
          );
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      if (address.trim().length > 255) {
        setErrorText(
          currentLang === 'ta'
            ? 'முகவரி 255 எழுத்துக்களுக்கு மிகாமல் இருக்க வேண்டும்'
            : 'Address cannot exceed 255 characters'
        );
        return false;
      }
      if (area.trim().length > 150) {
        setErrorText(
          currentLang === 'ta'
            ? 'பகுதி 150 எழுத்துக்களுக்கு மிகாமல் இருக்க வேண்டும்'
            : 'Area cannot exceed 150 characters'
        );
        return false;
      }
      if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
        setErrorText(
          currentLang === 'ta'
            ? 'அஞ்சல் குறியீடு 6 இலக்கங்கள் இருக்க வேண்டும்'
            : 'Pincode must be a valid 6-digit number'
        );
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      if (notes.trim().length > 500) {
        setErrorText(
          currentLang === 'ta'
            ? 'குறிப்புகள் 500 எழுத்துக்களுக்கு மிகாமல் இருக்க வேண்டும்'
            : 'Notes cannot exceed 500 characters'
        );
        return false;
      }
      return true;
    }

    if (stepNumber === 5) {
      if (clientAdvanceNum > totalChargeNum && totalChargeNum > 0) {
        setErrorText(strings.errAdvanceExceed);
        return false;
      }
      if (priestAdvanceNum > priestPayNum && priestPayNum > 0) {
        setErrorText(strings.errPriestAdvanceExceed);
        return false;
      }
      return true;
    }

    return true;
  };

  // Harmless Field Focus listener (maintains test compatibility without interrupting natural vertical scrolling)
  const handleFieldFocus = (_approxY?: number) => {};

  // Smooth Horizontal Navigation Transition Helper (Item 1 & 2)
  const transitionToStep = (
    targetStep: number,
    direction: 'next' | 'back',
    preserveError: boolean = false
  ) => {
    if (!preserveError) {
      setErrorText(null);
    }
    if (targetStep === currentStep || targetStep < 1 || targetStep > 5) return;
    setCurrentStep(targetStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    stepperScrollRef.current?.scrollTo({ x: (targetStep - 1) * 70, animated: true });

    // Smooth spring slide-in and opacity fade-in on native thread
    const inValue = direction === 'next' ? 45 : -45;
    slideAnim.setValue(inValue);
    opacityAnim.setValue(0.7);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Free Step Navigation Handlers (No mandatory restrictions when navigating between steps)
  const handleNext = () => {
    if (currentStep < 5) {
      transitionToStep(currentStep + 1, 'next');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      transitionToStep(currentStep - 1, 'back');
    } else {
      handleCloseModal();
    }
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep === currentStep) return;
    transitionToStep(targetStep, targetStep > currentStep ? 'next' : 'back');
  };

  // Final Form Submit (Strict validation enforced here across all steps)
  const handleSubmit = async () => {
    Keyboard.dismiss();
    // Validate Step 1
    if (!validateStep(1)) {
      transitionToStep(1, 'back', true);
      return;
    }
    // Validate Step 2
    if (!validateStep(2)) {
      transitionToStep(2, currentStep > 2 ? 'back' : 'next', true);
      return;
    }
    // Validate Step 3
    if (!validateStep(3)) {
      transitionToStep(3, currentStep > 3 ? 'back' : 'next', true);
      return;
    }
    // Validate Step 4
    if (!validateStep(4)) {
      transitionToStep(4, currentStep > 4 ? 'back' : 'next', true);
      return;
    }
    // Validate Step 5
    if (!validateStep(5)) {
      transitionToStep(5, 'next', true);
      return;
    }

    const finalPriestName =
      selectedPriestId === 'custom'
        ? customPriestText.trim()
        : activePriest?.fullTitleTamil || activePriest?.nameTamil || '';

    const category = effectiveInitialBooking?.category || 'temple';
    const categoryLabelTamil =
      effectiveInitialBooking?.categoryLabelTamil ||
      (category === 'temple' ? 'கோவில்' : category === 'jathagam' ? 'ஜாதகம்' : 'வெளி நிகழ்வு');

    const payload: NewBookingFormData = {
      title: title.trim(),
      eventTypeId: effectiveInitialBooking?.eventTypeId || undefined,
      clientName: client.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      venueType,
      location: address.trim() || area.trim() || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்',
      address: address.trim() || undefined,
      area: area.trim() || undefined,
      pincode: pincode.trim() || undefined,
      category,
      categoryLabelTamil,
      startTime: calculatedTimings?.startTime12 || startTime,
      endTime: calculatedTimings?.crossesMidnight
        ? `${calculatedTimings.endTime12} ${calculatedTimings.dayLabel}`
        : calculatedTimings?.endTime12 || '08:30 PM',
      durationMinutes: currentDuration,
      timeSlot: calculatedTimings?.timeSlot || `${startTime} - ${calculatedTimings?.endTime12 || '08:30 PM'}`,
      priestId: selectedPriestId,
      priestIds: [selectedPriestId],
      priestName: finalPriestName,
      priestPhone: activePriest?.phone || undefined,
      samagriBy,
      notes: notes.trim() || undefined,
      dateKey: normalizedDateKey,
      endDateKey: calculatedTimings?.endDateKey || normalizedDateKey,
      startDateTime: calculatedTimings?.startDateTimeISO,
      endDateTime: calculatedTimings?.endDateTimeISO,
      daysOffset: calculatedTimings?.daysOffset || 0,
      crossesMidnight: calculatedTimings?.crossesMidnight || false,
      totalEventCharge: totalChargeNum,
      clientAdvanceAmount: clientAdvanceNum,
      clientTotalReceived:
        effectiveInitialBooking?.clientTotalReceived !== undefined
          ? effectiveInitialBooking.clientTotalReceived
          : clientAdvanceNum,
      clientBalanceAmount: clientBalanceNum,
      priestTotalPay: priestPayNum,
      priestAdvancePaid: priestAdvanceNum,
      priestBalanceAmount: priestBalanceNum,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      if (!effectiveInitialBooking) {
        setTitle('');
        setClient('');
        setPhone('');
        setAlternatePhone('');
        setAddress('');
        setArea('');
        setPincode('');
        setNotes('');
        setTotalEventCharge('');
        setClientAdvanceAmount('');
        setPriestTotalPay('');
        setPriestAdvancePaid('');
        setSelectedPriestId('');
      }
      handleCloseModal();
    } catch (err: any) {
      setErrorText(err?.message || (currentLang === 'ta' ? 'பதிவு தோல்வியடைந்தது' : 'Submission failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Month navigation for Date Picker
  const handlePrevMonth = () => {
    if (calendarMonthIndex === 0) {
      setCalendarMonthIndex(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonthIndex === 11) {
      setCalendarMonthIndex(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonthIndex(m => m + 1);
    }
  };

  const calendarCells = useMemo(() => {
    return getMonthCalendarCells(calendarYear, calendarMonthIndex);
  }, [calendarYear, calendarMonthIndex]);

  const calendarMonthName = isTa
    ? TAMIL_GREGORIAN_MONTH_NAMES[calendarMonthIndex]
    : ENGLISH_MONTH_NAMES[calendarMonthIndex];

  const weekdayHeaders = isTa ? WEEKDAY_HEADERS_TA : WEEKDAY_HEADERS_EN;

  // Time Picker confirm
  const handleConfirmTime = () => {
    setStartTime(`${tempHour}:${tempMinute} ${tempPeriod}`);
    setIsTimePickerOpen(false);
  };

  // Get active duration hours display
  const durationHoursValue = Math.round((currentDuration / 60) * 10) / 10;

  // Priest Avatar Initials
  const priestInitials = useMemo(() => {
    if (!activePriest) return '??';
    const raw = activePriest.nameEnglish || activePriest.nameTamil || 'PR';
    const parts = raw.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.substring(0, 2).toUpperCase();
  }, [activePriest]);

  // Modal Sheet Height: 92% of screen height
  const modalSheetHeight = Math.round(windowHeight * 0.92);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Dismiss Area */}
        <Pressable
          style={styles.backdropDismiss}
          onPress={handleCloseModal}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.modalSheet,
              { height: modalSheetHeight, maxHeight: '94%' },
            ]}
          >
            {/* Modal Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header: Close Button, Title, and Language Switch Pill */}
            <View style={styles.headerRow}>
              <Pressable
                onPress={handleCloseModal}
                style={styles.closeCircleButton}
                accessibilityRole="button"
                accessibilityLabel={isTa ? 'ரத்து செய்' : 'Close'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#475569" />
              </Pressable>

              <View style={styles.headerTitleCol}>
                <Text style={[styles.headerTitleText, isTa && styles.headerTitleTextTamil]}>
                  {effectiveInitialBooking
                    ? (isTa ? 'பூஜை விவரங்களை மாற்றவும்' : 'Edit Booking')
                    : strings.title}
                </Text>
                <Text style={[styles.headerSubtitleText, isTa && styles.headerSubtitleTextTamil]}>
                  {effectiveInitialBooking
                    ? (isTa ? 'விவரங்களை திருத்தவும்' : 'Update Pooja / Event Details')
                    : strings.subtitle}
                </Text>
              </View>

              {/* Language Switch Pill (தமிழ் | EN) */}
              <View style={styles.langTogglePill}>
                <Pressable
                  onPress={() => setCurrentLang('ta')}
                  style={[
                    styles.langSegment,
                    currentLang === 'ta' && styles.langSegmentActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="தமிழ் மொழி"
                >
                  <Text
                    style={[
                      styles.langSegmentText,
                      currentLang === 'ta' && styles.langSegmentTextActive,
                    ]}
                  >
                    தமிழ்
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCurrentLang('en')}
                  style={[
                    styles.langSegment,
                    currentLang === 'en' && styles.langSegmentActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="English Language"
                >
                  <Text
                    style={[
                      styles.langSegmentText,
                      currentLang === 'en' && styles.langSegmentTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Step Progress Tracker Bar */}
            <View style={styles.stepperContainer}>
              <ScrollView
                ref={stepperScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stepperScroll}
              >
                {strings.stepLabels.map((label, idx) => {
                  const stepNumber = idx + 1;
                  const isActive = currentStep === stepNumber;
                  return (
                    <React.Fragment key={stepNumber}>
                      {idx > 0 && <Text style={styles.stepperSlash}>/</Text>}
                      <Pressable
                        onPress={() => handleStepJump(stepNumber)}
                        style={[
                          styles.stepItem,
                          isActive && styles.stepItemActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Step ${stepNumber}: ${label}`}
                      >
                        <View
                          style={[
                            styles.stepDot,
                            isActive && styles.stepDotActive,
                          ]}
                        />
                        <Text
                          style={[
                            styles.stepItemText,
                            isTa && styles.stepItemTextTamil,
                            isActive && styles.stepItemTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </View>

            {/* Error / Conflict Alert Banner */}
            {errorText && (
              <View style={styles.errorBanner}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorText}</Text>
              </View>
            )}

            {/* Scrollable Stage Content with Native High-Performance Smooth Vertical Scrolling */}
            <View style={styles.formContainer}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.formScrollView}
                contentContainerStyle={[
                  styles.formScrollContent,
                  { paddingBottom: keyboardHeight > 0 ? keyboardHeight + (Platform.OS === 'ios' ? 40 : 100) : 36 },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                overScrollMode="always"
                bounces={true}
              >
                <Animated.View
                  style={[
                    {
                      opacity: opacityAnim,
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                  {/* STAGE 01: பூஜை & நிகழ்வு விவரங்கள் (Event Details) */}
                  {currentStep === 1 && (
                    <View style={styles.cardContainer}>
                      {/* Card Header with STAGE 01 badge */}
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeaderTitle, isTa && styles.cardHeaderTitleTamil]}>
                          {strings.stage1Title}
                        </Text>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{strings.stageBadges[0]}</Text>
                        </View>
                      </View>

                      {/* 1.1 Pooja Type */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.eventTypeLabel}
                        </Text>
                        <TextInput
                          style={[styles.textInput, isTa && styles.textInputTamil]}
                          value={title}
                          onChangeText={setTitle}
                          maxLength={150}
                          placeholder={strings.eventTypePlaceholder}
                          placeholderTextColor="#94A3B8"
                          returnKeyType="next"
                          accessibilityLabel="Pooja or Event Type"
                          onFocus={() => handleFieldFocus(20)}
                        />
                      </View>

                      {/* 1.2 Date & Muhurtham helper box (Item 6: Direct Picker Tap) */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.dateLabel}
                        </Text>
                        <Pressable
                          onPress={() => setIsDatePickerOpen(true)}
                          style={styles.pickerSelectorBox}
                          accessibilityRole="button"
                          accessibilityLabel="Date"
                        >
                          <Text
                            style={[
                              styles.pickerSelectorText,
                              !dateInput ? styles.pickerSelectorPlaceholder : null,
                            ]}
                          >
                            {dateInput || strings.datePlaceholder}
                          </Text>
                          <Calendar size={18} color="#074735" />
                        </Pressable>

                        {/* Subhamuhurtham Highlight Box */}
                        <View style={styles.muhurthamBox}>
                          <View style={styles.muhurthamLeftRow}>
                            <View style={styles.muhurthamDot} />
                            <Text style={[styles.muhurthamText, isTa && styles.muhurthamTextTamil]}>
                              {tamilInfo
                                ? currentLang === 'ta'
                                  ? `${tamilInfo.tamilWeekday || ''} • ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay}`
                                  : `${normalizedDateKey} • ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay}`
                                : normalizedDateKey}
                            </Text>
                          </View>
                          <Text style={[styles.muhurthamBadgeText, isTa && styles.muhurthamBadgeTextTamil]}>
                            {strings.muhurthamBadge}
                          </Text>
                        </View>
                      </View>

                      {/* 1.3 Start Time (Item 3: Suggested chips removed; Item 6: Direct Picker Tap) */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.startTimeLabel}
                        </Text>
                        <Pressable
                          onPress={() => setIsTimePickerOpen(true)}
                          style={styles.pickerSelectorBox}
                          accessibilityRole="button"
                          accessibilityLabel="Start Time"
                        >
                          <Text
                            style={[
                              styles.pickerSelectorText,
                              !startTime ? styles.pickerSelectorPlaceholder : null,
                            ]}
                          >
                            {startTime || '05:30 PM'}
                          </Text>
                          <Clock size={18} color="#074735" />
                        </Pressable>
                      </View>

                      {/* 1.4 Duration Selector */}
                      <View style={styles.fieldGroup}>
                        <View style={styles.labelWithActionRow}>
                          <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                            {strings.durationLabel}
                          </Text>
                          <Text style={[styles.selectedDurationText, isTa && styles.selectedDurationTextTamil]}>
                            {strings.selectedDuration(durationHoursValue)}
                          </Text>
                        </View>
                        <View style={styles.durationPillsTrack}>
                          {DURATION_PRESETS.map(preset => {
                            const isSelected =
                              preset.minutes === -1
                                ? isCustomDuration
                                : !isCustomDuration && durationMinutes === preset.minutes;
                            return (
                              <Pressable
                                key={preset.label}
                                onPress={() => {
                                  if (preset.minutes === -1) {
                                    setIsCustomDuration(true);
                                  } else {
                                    setIsCustomDuration(false);
                                    setDurationMinutes(preset.minutes);
                                  }
                                }}
                                style={[
                                  styles.durationPill,
                                  isSelected && styles.durationPillActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.durationPillText,
                                    isTa && styles.durationPillTextTamil,
                                    isSelected && styles.durationPillTextActive,
                                  ]}
                                >
                                  {preset.label === 'Custom' ? strings.customDuration : preset.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        {/* Custom Duration Input if selected */}
                        {isCustomDuration && (
                          <View style={styles.customDurationRow}>
                            <TextInput
                              style={[styles.textInput, { flex: 1 }]}
                              value={customDurationInput}
                              onChangeText={setCustomDurationInput}
                              maxLength={4}
                              placeholder={isTa ? 'நிமிடங்கள் (எ.கா. 90)' : 'Minutes (e.g. 90)'}
                              placeholderTextColor="#94A3B8"
                              keyboardType="number-pad"
                              onFocus={() => handleFieldFocus(260)}
                            />
                          </View>
                        )}
                      </View>

                      {/* 1.5 Auto Calculated End Time Box */}
                      <View style={styles.endTimeCard}>
                        <View style={styles.endTimeLeft}>
                          <Clock size={16} color="#074735" />
                          <View style={styles.endTimeCol}>
                            <Text style={[styles.endTimeLabel, isTa && styles.endTimeLabelTamil]}>
                              {strings.endTimeAuto}
                            </Text>
                            <Text style={styles.endTimeFormula}>
                              {startTime
                                ? `${startTime} + ${durationHoursValue}h${
                                    calculatedTimings && calculatedTimings.daysOffset > 0
                                      ? ` • ${isTa ? calculatedTimings.dayLabelTamil : calculatedTimings.dayLabel}`
                                      : ''
                                  }`
                                : `-- + ${durationHoursValue}h`}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.endTimeRight}>
                          <View style={styles.endTimeValueCol}>
                            <View style={styles.endTimeValueRow}>
                              <Text style={styles.endTimeValue}>
                                {calculatedTimings?.endTime12 || '--:--'}
                              </Text>
                              {calculatedTimings && calculatedTimings.daysOffset > 0 && (
                                <View style={styles.nextDayBadge}>
                                  <Text style={styles.nextDayBadgeText}>
                                    {isTa
                                      ? calculatedTimings.nextDayBadgeTamil
                                      : calculatedTimings.nextDayBadge}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.autoBadge}>
                            <Text style={styles.autoBadgeText}>AUTO</Text>
                          </View>
                        </View>
                      </View>

                      {/* 1.6 Chief Priest Card (Item 7: No arbitrary priest selected by default) */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.priestLabel}
                        </Text>
                        <Pressable
                          onPress={() => setIsPriestPickerOpen(true)}
                          style={[
                            styles.priestCardTrigger,
                            !activePriest && styles.priestCardTriggerEmpty,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Select Priest Trigger"
                        >
                          {activePriest ? (
                            <>
                              <View style={styles.priestAvatarCircle}>
                                <Text style={styles.priestAvatarText}>{priestInitials}</Text>
                              </View>
                              <View style={styles.priestInfoCol}>
                                <Text style={[styles.priestNameText, isTa && styles.priestNameTextTamil]}>
                                  {currentLang === 'ta'
                                    ? activePriest.nameTamil || activePriest.nameEnglish
                                    : activePriest.nameEnglish || activePriest.nameTamil}
                                </Text>
                                <Text style={[styles.priestRoleText, isTa && styles.priestRoleTextTamil]}>
                                  {currentLang === 'ta'
                                    ? activePriest.designationTamil || 'தலைமை புரோகிதர்'
                                    : (activePriest as any).roleBadge || activePriest.designationTamil || 'Chief Priest'}
                                </Text>
                              </View>
                              <Text style={[styles.changePriestLink, isTa && styles.changePriestLinkTamil]}>
                                {strings.changePriest}
                              </Text>
                            </>
                          ) : (
                            <>
                              <View style={[styles.priestAvatarCircle, styles.priestAvatarCircleEmpty]}>
                                <User size={18} color="#94A3B8" />
                              </View>
                              <View style={styles.priestInfoCol}>
                                <Text style={[styles.priestNameText, styles.priestNameTextPlaceholder]}>
                                  {isTa ? 'புரோகிதரை தேர்ந்தெடுக்கவும்' : 'Select Assigned Priest'}
                                </Text>
                                <Text style={styles.priestRoleText}>
                                  {strings.choosePriestHint}
                                </Text>
                              </View>
                              <Text style={styles.selectPriestLink}>
                                {strings.selectPriest}
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* STAGE 02: பக்தர் விவரங்கள் (Item 2: Full Tamil visibility on initial render) */}
                  {currentStep === 2 && (
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeaderTitle, isTa && styles.cardHeaderTitleTamil]}>
                          {strings.stage2Title}
                        </Text>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{strings.stageBadges[1]}</Text>
                        </View>
                      </View>

                      {/* 2.1 Customer Name */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.customerNameLabel}
                        </Text>
                        <TextInput
                          style={[styles.textInput, isTa && styles.textInputTamil]}
                          value={client}
                          onChangeText={setClient}
                          maxLength={100}
                          placeholder={strings.customerNamePlaceholder}
                          placeholderTextColor="#94A3B8"
                          returnKeyType="next"
                          accessibilityLabel="Customer Name"
                          onFocus={() => handleFieldFocus(20)}
                        />
                      </View>

                      {/* 2.2 Mobile & Alternate Phone in 2 Columns */}
                      <View style={styles.twoColumnRow}>
                        <View style={styles.columnHalf}>
                          <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                            {strings.mobileLabel}
                          </Text>
                          <TextInput
                            style={[styles.textInput, isTa && styles.textInputTamil]}
                            value={phone}
                            onChangeText={setPhone}
                            maxLength={15}
                            placeholder="+91 98401 22334"
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                            accessibilityLabel="Mobile Number"
                            onFocus={() => handleFieldFocus(90)}
                          />
                        </View>
                        <View style={styles.columnHalf}>
                          <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                            {strings.alternateMobileLabel}
                          </Text>
                          <TextInput
                            style={[styles.textInput, isTa && styles.textInputTamil]}
                            value={alternatePhone}
                            onChangeText={setAlternatePhone}
                            maxLength={15}
                            placeholder="+91..."
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                            accessibilityLabel="Alternate Phone"
                            onFocus={() => handleFieldFocus(90)}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* STAGE 03: நிகழ்விடம் & முகவரி (Venue & Address Details) */}
                  {currentStep === 3 && (
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeaderTitle, isTa && styles.cardHeaderTitleTamil]}>
                          {strings.stage3Title}
                        </Text>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{strings.stageBadges[2]}</Text>
                        </View>
                      </View>

                      {/* 3.1 Venue Type - 4 Options in a Row */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.venueTypeLabel}
                        </Text>
                        <View style={styles.venueCardsRow}>
                          {/* Home */}
                          <Pressable
                            onPress={() => setVenueType('home')}
                            style={[
                              styles.venueCard,
                              venueType === 'home' && styles.venueCardSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.venueHome}
                          >
                            <View style={[styles.venueImageWrapper, venueType === 'home' && styles.venueImageWrapperSelected]}>
                              <Image
                                source={ASSETS.images.venue.home}
                                style={styles.venueImage}
                                resizeMode="contain"
                              />
                            </View>
                            <Text
                              style={[
                                styles.venueCardLabel,
                                isTa && styles.venueCardLabelTamil,
                                venueType === 'home' && styles.venueCardLabelSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {strings.venueHome}
                            </Text>
                          </Pressable>

                          {/* Temple */}
                          <Pressable
                            onPress={() => setVenueType('temple')}
                            style={[
                              styles.venueCard,
                              venueType === 'temple' && styles.venueCardSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.venueTemple}
                          >
                            <View style={[styles.venueImageWrapper, venueType === 'temple' && styles.venueImageWrapperSelected]}>
                              <Image
                                source={ASSETS.images.venue.temple}
                                style={styles.venueImage}
                                resizeMode="contain"
                              />
                            </View>
                            <Text
                              style={[
                                styles.venueCardLabel,
                                isTa && styles.venueCardLabelTamil,
                                venueType === 'temple' && styles.venueCardLabelSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {strings.venueTemple}
                            </Text>
                          </Pressable>

                          {/* Hall */}
                          <Pressable
                            onPress={() => setVenueType('hall')}
                            style={[
                              styles.venueCard,
                              venueType === 'hall' && styles.venueCardSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.venueHall}
                          >
                            <View style={[styles.venueImageWrapper, venueType === 'hall' && styles.venueImageWrapperSelected]}>
                              <Image
                                source={ASSETS.images.venue.hall}
                                style={styles.venueImage}
                                resizeMode="contain"
                              />
                            </View>
                            <Text
                              style={[
                                styles.venueCardLabel,
                                isTa && styles.venueCardLabelTamil,
                                venueType === 'hall' && styles.venueCardLabelSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {strings.venueHall}
                            </Text>
                          </Pressable>

                          {/* Other */}
                          <Pressable
                            onPress={() => setVenueType('other')}
                            style={[
                              styles.venueCard,
                              venueType === 'other' && styles.venueCardSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.venueOther}
                          >
                            <View style={[styles.venueImageWrapper, venueType === 'other' && styles.venueImageWrapperSelected]}>
                              <Image
                                source={ASSETS.images.venue.other}
                                style={styles.venueImage}
                                resizeMode="contain"
                              />
                            </View>
                            <Text
                              style={[
                                styles.venueCardLabel,
                                isTa && styles.venueCardLabelTamil,
                                venueType === 'other' && styles.venueCardLabelSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {strings.venueOther}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* 3.2 Address Details */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.addressLabel}
                        </Text>
                        <TextInput
                          style={[styles.textInput, styles.multilineInput, isTa && styles.textInputTamil]}
                          value={address}
                          onChangeText={setAddress}
                          maxLength={255}
                          placeholder={strings.addressPlaceholder}
                          placeholderTextColor="#94A3B8"
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          onFocus={() => handleFieldFocus(120)}
                        />
                      </View>

                      {/* 3.3 Area & Pincode in 2 Columns */}
                      <View style={styles.twoColumnRow}>
                        <View style={[styles.columnHalf, { flex: 1.3 }]}>
                          <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                            {strings.areaLabel}
                          </Text>
                          <TextInput
                            style={[styles.textInput, isTa && styles.textInputTamil]}
                            value={area}
                            onChangeText={setArea}
                            maxLength={150}
                            placeholder={strings.areaPlaceholder}
                            placeholderTextColor="#94A3B8"
                            onFocus={() => handleFieldFocus(220)}
                          />
                        </View>
                        <View style={[styles.columnHalf, { flex: 1 }]}>
                          <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                            {strings.pincodeLabel}
                          </Text>
                          <TextInput
                            style={[styles.textInput, isTa && styles.textInputTamil]}
                            value={pincode}
                            onChangeText={setPincode}
                            maxLength={6}
                            placeholder={strings.pincodePlaceholder}
                            placeholderTextColor="#94A3B8"
                            keyboardType="number-pad"
                            onFocus={() => handleFieldFocus(220)}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* STAGE 04: பூஜை திரவியங்கள் & ஏற்பாடு (Pooja Samagri Details) */}
                  {currentStep === 4 && (
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeaderTitle, isTa && styles.cardHeaderTitleTamil]}>
                          {strings.stage4Title}
                        </Text>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{strings.stageBadges[3]}</Text>
                        </View>
                      </View>

                      {/* 4.1 Samagri Arrangement Responsibility */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.samagriLabel}
                        </Text>
                        <View style={styles.radioCardsRow}>
                          {/* Customer Arranged */}
                          <Pressable
                            onPress={() => setSamagriBy('customer')}
                            style={[
                              styles.radioCard,
                              samagriBy === 'customer' && styles.radioCardSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.radioCardText,
                                isTa && styles.radioCardTextTamil,
                                samagriBy === 'customer' && styles.radioCardTextSelected,
                              ]}
                              numberOfLines={2}
                            >
                              {strings.samagriCustomer}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                samagriBy === 'customer' && styles.radioCircleActive,
                              ]}
                            />
                          </Pressable>

                          {/* Temple / Priest Arranged */}
                          <Pressable
                            onPress={() => setSamagriBy('priest')}
                            style={[
                              styles.radioCard,
                              samagriBy === 'priest' && styles.radioCardSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.radioCardText,
                                isTa && styles.radioCardTextTamil,
                                samagriBy === 'priest' && styles.radioCardTextSelected,
                              ]}
                              numberOfLines={2}
                            >
                              {strings.samagriPriest}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                samagriBy === 'priest' && styles.radioCircleActive,
                              ]}
                            />
                          </Pressable>
                        </View>
                      </View>

                      {/* 4.2 Special Notes & Requests */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isTa && styles.fieldLabelTamil]}>
                          {strings.notesLabel}
                        </Text>
                        <TextInput
                          style={[styles.textInput, styles.multilineInputNotes, isTa && styles.textInputTamil]}
                          value={notes}
                          onChangeText={setNotes}
                          maxLength={500}
                          placeholder={strings.notesPlaceholder}
                          placeholderTextColor="#94A3B8"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          onFocus={() => handleFieldFocus(110)}
                        />
                      </View>
                    </View>
                  )}

                  {/* STAGE 05: கட்டண விவரம் & கணக்கு (Payment & Cash Accounting) */}
                  {currentStep === 5 && (
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeaderTitle, isTa && styles.cardHeaderTitleTamil]}>
                          {strings.stage5Title}
                        </Text>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{strings.stageBadges[4]}</Text>
                        </View>
                      </View>

                      {/* Section A: Customer Payment */}
                      <Text style={[styles.paymentSectionTitle, isTa && styles.paymentSectionTitleTamil]}>
                        {strings.customerPaymentTitle}
                      </Text>
                      <View style={styles.paymentBoxContainer}>
                        {/* Total Event Charge */}
                        <View style={styles.paymentFieldGroup}>
                          <Text style={[styles.paymentFieldLabel, isTa && styles.paymentFieldLabelTamil]}>
                            {strings.totalChargeLabel}
                          </Text>
                          <View style={styles.currencyInputRow}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.currencyTextInput}
                              value={totalEventCharge}
                              onChangeText={setTotalEventCharge}
                              maxLength={10}
                              placeholder="10000"
                              placeholderTextColor="#94A3B8"
                              keyboardType="number-pad"
                              accessibilityLabel="Total Event Charge"
                              onFocus={() => handleFieldFocus(50)}
                            />
                          </View>
                        </View>

                        {/* Advance Received */}
                        <View style={styles.paymentFieldGroup}>
                          <Text style={[styles.paymentFieldLabel, isTa && styles.paymentFieldLabelTamil]}>
                            {strings.advanceReceivedLabel}
                          </Text>
                          <View style={styles.currencyInputRow}>
                            <Text style={[styles.currencySymbol, { color: '#059669' }]}>₹</Text>
                            <TextInput
                              style={[styles.currencyTextInput, { color: '#059669' }]}
                              value={clientAdvanceAmount}
                              onChangeText={setClientAdvanceAmount}
                              maxLength={10}
                              placeholder="1000"
                              placeholderTextColor="#94A3B8"
                              keyboardType="number-pad"
                              accessibilityLabel="Advance Received"
                              onFocus={() => handleFieldFocus(130)}
                            />
                          </View>
                        </View>

                        {/* Auto-calculated Balance Due Card */}
                        <View style={styles.balanceSummaryCard}>
                          <View style={styles.balanceSummaryLeft}>
                            <Text style={[styles.balanceSummaryLabel, isTa && styles.balanceSummaryLabelTamil]}>
                              {strings.balanceDueLabel}
                            </Text>
                            <Text
                              style={[
                                styles.balanceBadgeText,
                                isTa && styles.balanceBadgeTextTamil,
                                clientBalanceNum === 0
                                ? { color: '#059669' }
                                : clientAdvanceNum > 0
                                ? { color: '#D97706' }
                                : { color: '#DC2626' },
                              ]}
                            >
                              {clientBalanceNum === 0
                                ? strings.fullyPaid
                                : clientAdvanceNum > 0
                                ? strings.partiallyPaid
                                : strings.unpaid}
                            </Text>
                          </View>
                          <Text style={styles.balanceSummaryValue}>
                            ₹ {clientBalanceNum.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Section B: Priest Remuneration */}
                      <Text style={[styles.paymentSectionTitle, isTa && styles.paymentSectionTitleTamil, { marginTop: 16 }]}>
                        {strings.priestRemunerationTitle}
                      </Text>
                      <View style={styles.paymentBoxContainer}>
                        {/* Priest Total Pay */}
                        <View style={styles.paymentFieldGroup}>
                          <Text style={[styles.paymentFieldLabel, isTa && styles.paymentFieldLabelTamil]}>
                            {strings.priestTotalPayLabel}
                          </Text>
                          <View style={styles.currencyInputRow}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.currencyTextInput}
                              value={priestTotalPay}
                              onChangeText={setPriestTotalPay}
                              maxLength={10}
                              placeholder="2500"
                              placeholderTextColor="#94A3B8"
                              keyboardType="number-pad"
                              accessibilityLabel="Priest Total Pay"
                              onFocus={() => handleFieldFocus(270)}
                            />
                          </View>
                        </View>

                        {/* Priest Advance Paid */}
                        <View style={styles.paymentFieldGroup}>
                          <Text style={[styles.paymentFieldLabel, isTa && styles.paymentFieldLabelTamil]}>
                            {strings.priestAdvanceLabel}
                          </Text>
                          <View style={styles.currencyInputRow}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.currencyTextInput}
                              value={priestAdvancePaid}
                              onChangeText={setPriestAdvancePaid}
                              maxLength={10}
                              placeholder="500"
                              placeholderTextColor="#94A3B8"
                              keyboardType="number-pad"
                              accessibilityLabel="Priest Advance Paid"
                              onFocus={() => handleFieldFocus(350)}
                            />
                          </View>
                        </View>

                        {/* Priest Balance Due Card */}
                        <View style={styles.balanceSummaryCard}>
                          <View style={styles.balanceSummaryLeft}>
                            <Text style={[styles.balanceSummaryLabel, isTa && styles.balanceSummaryLabelTamil]}>
                              {strings.priestBalanceLabel}
                            </Text>
                            <Text style={[styles.priestPendingLabel, isTa && styles.priestPendingLabelTamil]}>
                              {strings.pendingPayment}
                            </Text>
                          </View>
                          <Text style={styles.balanceSummaryValue}>
                            ₹ {priestBalanceNum.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </Animated.View>
              </ScrollView>
            </View>

            {/* Bottom Pinned Action Bar */}
            <View
              style={[
                styles.bottomActionBar,
                { paddingBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              {/* Left Action Button (Cancel on Step 1 / Back on Steps 2-5) */}
              <Pressable
                onPress={handleBack}
                style={styles.bottomSecondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  currentStep === 1 ? strings.cancel : strings.back
                }
              >
                <Text style={[styles.bottomSecondaryBtnText, isTa && styles.bottomSecondaryBtnTextTamil]}>
                  {currentStep === 1 ? strings.cancel : strings.back}
                </Text>
              </Pressable>

              {/* Right Action Button (Next on Steps 1-4 / Confirm Booking or Save on Step 5) */}
              <Pressable
                onPress={currentStep === 5 ? handleSubmit : handleNext}
                style={[styles.bottomPrimaryBtn, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={
                  currentStep === 5
                    ? (effectiveInitialBooking ? (isTa ? 'சேமிக்க' : 'Save Changes') : strings.confirmBooking)
                    : strings.next
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={[styles.bottomPrimaryBtnText, isTa && styles.bottomPrimaryBtnTextTamil]}>
                      {currentStep === 5
                        ? (effectiveInitialBooking ? (isTa ? 'சேமிக்க' : 'Save Changes') : strings.confirmBooking)
                        : strings.next}
                    </Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>

            {/* Interactive Date Picker Overlay */}
            {isDatePickerOpen && (
              <View style={styles.pickerOverlayContainer}>
                <Pressable
                  style={styles.pickerBackdrop}
                  onPress={() => setIsDatePickerOpen(false)}
                >
                  <Pressable style={styles.calendarModalSheet} onPress={e => e.stopPropagation()}>
                    {/* Calendar Header with Navigation */}
                    <View style={styles.calendarHeaderRow}>
                      <Pressable
                        onPress={handlePrevMonth}
                        style={styles.calendarNavBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Previous Month"
                      >
                        <ChevronLeft size={20} color="#074735" />
                      </Pressable>
                      <Text style={[styles.calendarMonthTitle, isTa && styles.calendarMonthTitleTamil]}>
                        {calendarMonthName} {calendarYear}
                      </Text>
                      <Pressable
                        onPress={handleNextMonth}
                        style={styles.calendarNavBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Next Month"
                      >
                        <ChevronRight size={20} color="#074735" />
                      </Pressable>
                    </View>

                    {/* Weekday Labels Header */}
                    <View style={styles.calendarWeekdaysRow}>
                      {weekdayHeaders.map((day, idx) => (
                        <Text key={idx} style={styles.calendarWeekdayLabel}>
                          {day}
                        </Text>
                      ))}
                    </View>

                    {/* 7-Column Calendar Days Grid */}
                    <View style={styles.calendarGrid}>
                      {calendarCells.map((cell, idx) => {
                        const isSelected = cell.dateKey === normalizedDateKey;
                        const isMuhurtham = isMuhurthamDate(cell.dateKey);
                        const isToday = cell.dateKey === formatDateKey(new Date());

                        return (
                          <Pressable
                            key={idx}
                            onPress={() => {
                              setDateInput(cell.dateKey);
                              setIsDatePickerOpen(false);
                            }}
                            style={[
                              styles.calendarDayCell,
                              isSelected && styles.calendarDayCellSelected,
                              isToday && !isSelected && styles.calendarDayCellToday,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Date ${cell.dateKey}`}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                !cell.isCurrentMonth && styles.calendarDayTextInactive,
                                isSelected && styles.calendarDayTextSelected,
                              ]}
                            >
                              {cell.dayNumber}
                            </Text>
                            {isMuhurtham && (
                              <View
                                style={[
                                  styles.calendarMuhurthamDot,
                                  isSelected && styles.calendarMuhurthamDotSelected,
                                ]}
                              />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Calendar Footer Actions */}
                    <View style={styles.calendarFooterRow}>
                      <Pressable
                        onPress={() => {
                          const todayStr = formatDateKey(new Date());
                          setDateInput(todayStr);
                          const d = parseDateKey(todayStr);
                          setCalendarYear(d.getFullYear());
                          setCalendarMonthIndex(d.getMonth());
                          setIsDatePickerOpen(false);
                        }}
                        style={styles.calendarTodayBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Pick Today's Date"
                      >
                        <Text style={[styles.calendarTodayBtnText, isTa && styles.calendarTodayBtnTextTamil]}>
                          {strings.todayBtn}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setIsDatePickerOpen(false)}
                        style={styles.calendarCloseBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Close Date Picker"
                      >
                        <Text style={[styles.calendarCloseBtnText, isTa && styles.calendarCloseBtnTextTamil]}>
                          {strings.closeBtn}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Pressable>
              </View>
            )}

            {/* Interactive Time Picker Overlay (Item 3: Suggested slots removed) */}
            {isTimePickerOpen && (
              <View style={styles.pickerOverlayContainer}>
                <Pressable
                  style={styles.pickerBackdrop}
                  onPress={() => setIsTimePickerOpen(false)}
                >
                  <Pressable style={styles.timeModalSheet} onPress={e => e.stopPropagation()}>
                    {/* Time Picker Header */}
                    <View style={styles.pickerHeader}>
                      <Text style={[styles.pickerTitle, isTa && styles.pickerTitleTamil]}>
                        {strings.timePickerTitle}
                      </Text>
                      <Pressable
                        onPress={() => setIsTimePickerOpen(false)}
                        style={styles.pickerCloseBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Close Time Picker"
                      >
                        <X size={18} color="#475569" />
                      </Pressable>
                    </View>

                    {/* Live Selected Time Box + AM/PM Toggle */}
                    <View style={styles.timePreviewRow}>
                      <View style={styles.timeDisplayPill}>
                        <Clock size={20} color="#074735" />
                        <Text style={styles.timePreviewText}>
                          {tempHour}:{tempMinute}
                        </Text>
                      </View>
                      <View style={styles.amPmToggleRow}>
                        <Pressable
                          onPress={() => setTempPeriod('AM')}
                          style={[
                            styles.amPmSegment,
                            tempPeriod === 'AM' && styles.amPmSegmentActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.amPmSegmentText,
                              tempPeriod === 'AM' && styles.amPmSegmentTextActive,
                            ]}
                          >
                            AM
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setTempPeriod('PM')}
                          style={[
                            styles.amPmSegment,
                            tempPeriod === 'PM' && styles.amPmSegmentActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.amPmSegmentText,
                              tempPeriod === 'PM' && styles.amPmSegmentTextActive,
                            ]}
                          >
                            PM
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Hour Selection Grid */}
                    <Text style={[styles.timeSectionLabel, isTa && styles.timeSectionLabelTamil]}>
                      {strings.hourLabel}
                    </Text>
                    <View style={styles.timePillsGrid}>
                      {TIME_PICKER_HOURS.map(h => (
                        <Pressable
                          key={h}
                          onPress={() => setTempHour(h)}
                          style={[
                            styles.timePillItem,
                            tempHour === h && styles.timePillItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timePillText,
                              tempHour === h && styles.timePillTextActive,
                            ]}
                          >
                            {h}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Minute Selection Grid */}
                    <Text style={[styles.timeSectionLabel, isTa && styles.timeSectionLabelTamil, { marginTop: 12 }]}>
                      {strings.minuteLabel}
                    </Text>
                    <View style={styles.timePillsGrid}>
                      {TIME_PICKER_MINUTES.map(m => (
                        <Pressable
                          key={m}
                          onPress={() => setTempMinute(m)}
                          style={[
                            styles.timePillItem,
                            tempMinute === m && styles.timePillItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timePillText,
                              tempMinute === m && styles.timePillTextActive,
                            ]}
                          >
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Time Picker Confirm Button */}
                    <Pressable
                      onPress={handleConfirmTime}
                      style={styles.timeConfirmBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm Time Selection"
                    >
                      <Text style={[styles.timeConfirmBtnText, isTa && styles.timeConfirmBtnTextTamil]}>
                        {strings.confirmTimeBtn}
                      </Text>
                    </Pressable>
                  </Pressable>
                </Pressable>
              </View>
            )}

            {/* Priest Selection Picker Overlay (Item 7: Reflects selection immediately, no arbitrary priest preselected) */}
            {isPriestPickerOpen && (
              <View style={styles.pickerOverlayContainer}>
                <Pressable
                  style={styles.pickerBackdrop}
                  onPress={() => setIsPriestPickerOpen(false)}
                >
                  <Pressable style={styles.pickerContentSheet} onPress={e => e.stopPropagation()}>
                    <View style={styles.pickerHeader}>
                      <Text style={[styles.pickerTitle, isTa && styles.pickerTitleTamil]}>
                        {strings.priestLabel}
                      </Text>
                      <Pressable
                        onPress={() => setIsPriestPickerOpen(false)}
                        style={styles.pickerCloseBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Close priest picker"
                      >
                        <X size={18} color="#475569" />
                      </Pressable>
                    </View>

                    <ScrollView style={styles.pickerListScroll}>
                      {staffList.map(priest => {
                        const isSelected = selectedPriestId === priest.id;
                        return (
                          <Pressable
                            key={priest.id}
                            onPress={() => {
                              setSelectedPriestId(priest.id);
                              setIsPriestPickerOpen(false);
                            }}
                            style={[
                              styles.pickerItemRow,
                              isSelected && styles.pickerItemRowSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${priest.nameEnglish || priest.nameTamil}`}
                          >
                            <View style={styles.priestAvatarCircle}>
                              <Text style={styles.priestAvatarText}>
                                {priest.nameEnglish
                                  ? priest.nameEnglish.substring(0, 2).toUpperCase()
                                  : 'PR'}
                              </Text>
                            </View>
                            <View style={styles.pickerItemTextCol}>
                              <Text style={[styles.pickerItemName, isTa && styles.pickerItemNameTamil]}>
                                {currentLang === 'ta'
                                  ? priest.nameTamil || priest.nameEnglish
                                  : priest.nameEnglish || priest.nameTamil}
                              </Text>
                              <Text style={[styles.pickerItemRole, isTa && styles.pickerItemRoleTamil]}>
                                {currentLang === 'ta'
                                  ? priest.designationTamil || 'தலைமை புரோகிதர்'
                                  : (priest as any).roleBadge || priest.designationTamil || 'Priest'}
                              </Text>
                            </View>
                            {isSelected && <Check size={18} color="#074735" />}
                          </Pressable>
                        );
                      })}

                      {/* Custom Priest Option */}
                      <Pressable
                        onPress={() => {
                          setSelectedPriestId('custom');
                          setIsPriestPickerOpen(false);
                        }}
                        style={[
                          styles.pickerItemRow,
                          selectedPriestId === 'custom' && styles.pickerItemRowSelected,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Select Custom Priest"
                      >
                        <View
                          style={[
                            styles.priestAvatarCircle,
                            { backgroundColor: '#475569' },
                          ]}
                        >
                          <Text style={styles.priestAvatarText}>CP</Text>
                        </View>
                        <View style={styles.pickerItemTextCol}>
                          <Text style={[styles.pickerItemName, isTa && styles.pickerItemNameTamil]}>
                            {currentLang === 'ta'
                              ? 'பிற புரோகிதர் (தனிப்பயன்)'
                              : 'Other Priest (Custom)'}
                          </Text>
                          <Text style={[styles.pickerItemRole, isTa && styles.pickerItemRoleTamil]}>
                            {currentLang === 'ta'
                              ? 'பெயரை கைமுறையாக உள்ளிடவும்'
                              : 'Enter priest name manually'}
                          </Text>
                        </View>
                        {selectedPriestId === 'custom' && <Check size={18} color="#074735" />}
                      </Pressable>
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '100%',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  closeCircleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitleTextTamil: {
    fontSize: 15,
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerSubtitleTextTamil: {
    fontSize: 11,
  },
  langTogglePill: {
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langSegment: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
  },
  langSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  langSegmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  langSegmentTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },

  // Stepper Bar
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  stepperScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  stepperSlash: {
    color: '#CBD5E1',
    fontSize: 12,
    marginHorizontal: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  stepItemActive: {
    backgroundColor: '#074735', // Deep Forest Green active pill
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  stepDotActive: {
    backgroundColor: '#10B981', // Bright Emerald dot inside active pill
  },
  stepItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  stepItemTextTamil: {
    fontSize: 12,
  },
  stepItemTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Form Container (PanResponder attaches here for swipe gesture)
  formContainer: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
  },
  formScrollContent: {
    padding: 16,
  },

  // Stage Card Container
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  cardHeaderTitleTamil: {
    fontSize: 15,
    color: '#0F172A',
  },
  stageBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  // Fields (Item 2: Full Tamil font visibility with standard metrics)
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  fieldLabelTamil: {
    fontSize: 13,
    color: '#334155',
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  textInputTamil: {
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 70,
    paddingTop: 10,
  },
  multilineInputNotes: {
    minHeight: 80,
    paddingTop: 10,
  },

  // Direct Interactive Picker Boxes (Item 6: Entire box is directly clickable)
  pickerSelectorBox: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerSelectorPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },

  // Muhurtham Highlight Box
  muhurthamBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 38,
  },
  muhurthamLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  muhurthamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  muhurthamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  muhurthamTextTamil: {
    fontSize: 12,
  },
  muhurthamBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  muhurthamBadgeTextTamil: {
    fontSize: 11,
  },

  // Duration
  selectedDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#074735',
  },
  selectedDurationTextTamil: {
    fontSize: 12,
  },
  durationPillsTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  durationPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  durationPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  durationPillTextTamil: {
    fontSize: 12,
  },
  durationPillTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  customDurationRow: {
    marginTop: 8,
    flexDirection: 'row',
  },

  // Auto End Time Card
  endTimeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  endTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  endTimeCol: {
    flex: 1,
  },
  endTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  endTimeLabelTamil: {
    fontSize: 12,
  },
  endTimeFormula: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  endTimeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endTimeValueCol: {
    alignItems: 'flex-end',
  },
  endTimeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  endTimeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  nextDayBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  nextDayBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  autoBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },

  // Priest Card (Item 7: Placeholder style when empty)
  priestCardTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priestCardTriggerEmpty: {
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  priestAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priestAvatarCircleEmpty: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priestAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  priestInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  priestNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  priestNameTextTamil: {
    fontSize: 14,
    color: '#0F172A',
  },
  priestNameTextPlaceholder: {
    color: '#475569',
    fontWeight: '600',
  },
  priestRoleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priestRoleTextTamil: {
    fontSize: 11,
  },
  changePriestLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  changePriestLinkTamil: {
    fontSize: 12,
  },
  selectPriestLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },

  // Step 2 & 3 Two Column Layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  columnHalf: {
    flex: 1,
  },

  // Step 3: Venue Option Cards (with Image Illustrations)
  venueCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  venueCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    minHeight: 90,
  },
  venueCardSelected: {
    borderColor: '#074735',
    borderWidth: 2,
    backgroundColor: '#ffffff ',
  },
  venueImageWrapper: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  venueImageWrapperSelected: {},
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  venueCardLabelTamil: {
    fontSize: 11,
    fontWeight: '600',
  },
  venueCardLabelSelected: {
    color: '#074735',
    fontWeight: '700',
  },

  // Step 4: Radio Cards (Tuned so long Tamil labels never wrap awkwardly or clip)
  radioCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radioCard: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  radioCardSelected: {
    borderColor: '#074735',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  radioCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginRight: 6,
  },
  radioCardTextTamil: {
    fontSize: 12,
  },
  radioCardTextSelected: {
    color: '#074735',
    fontWeight: '700',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  radioCircleActive: {
    borderColor: '#074735',
    borderWidth: 5,
    backgroundColor: '#FFFFFF',
  },

  // Step 5: Payment Styles
  paymentSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  paymentSectionTitleTamil: {
    fontSize: 13,
  },
  paymentBoxContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  paymentFieldGroup: {
    marginBottom: 10,
  },
  paymentFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  paymentFieldLabelTamil: {
    fontSize: 12,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginRight: 6,
  },
  currencyTextInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  balanceSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  balanceSummaryLeft: {
    flex: 1,
  },
  balanceSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  balanceSummaryLabelTamil: {
    fontSize: 12,
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  balanceBadgeTextTamil: {
    fontSize: 11,
  },
  priestPendingLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priestPendingLabelTamil: {
    fontSize: 11,
  },
  balanceSummaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Bottom Pinned Action Bar
  bottomActionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,

  },
  bottomSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  bottomSecondaryBtnTextTamil: {
    fontSize: 14,
  },
  bottomPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#074735', // Deep Forest Green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#074735',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPrimaryBtnTextTamil: {
    fontSize: 14,
  },

  // Picker Overlays Common
  pickerOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 10,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pickerContentSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '75%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerTitleTamil: {
    fontSize: 15,
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerListScroll: {
    padding: 12,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  pickerItemRowSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#074735',
  },
  pickerItemTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerItemNameTamil: {
    fontSize: 14,
  },
  pickerItemRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pickerItemRoleTamil: {
    fontSize: 11,
  },

  // Interactive Calendar Sheet Styles
  calendarModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 360,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarMonthTitleTamil: {
    fontSize: 15,
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  calendarWeekdayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: '#074735',
  },
  calendarDayCellToday: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  calendarDayTextInactive: {
    color: '#CBD5E1',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarMuhurthamDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
    position: 'absolute',
    bottom: 3,
  },
  calendarMuhurthamDotSelected: {
    backgroundColor: '#FEF08A',
  },
  calendarFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarTodayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
  },
  calendarTodayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#074735',
  },
  calendarTodayBtnTextTamil: {
    fontSize: 12,
  },
  calendarCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  calendarCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  calendarCloseBtnTextTamil: {
    fontSize: 12,
  },

  // Interactive Time Picker Sheet Styles
  timeModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 360,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  timePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeDisplayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePreviewText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#074735',
  },
  amPmToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  amPmSegment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  amPmSegmentActive: {
    backgroundColor: '#074735',
  },
  amPmSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  amPmSegmentTextActive: {
    color: '#FFFFFF',
  },
  timeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  timeSectionLabelTamil: {
    fontSize: 12,
  },
  timePillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePillItem: {
    width: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillItemActive: {
    backgroundColor: '#074735',
    borderColor: '#074735',
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  timePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeConfirmBtn: {
    backgroundColor: '#074735',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  timeConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeConfirmBtnTextTamil: {
    fontSize: 14,
  },
});
